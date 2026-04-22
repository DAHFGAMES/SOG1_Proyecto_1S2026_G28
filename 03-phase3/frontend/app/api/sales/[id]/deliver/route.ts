import { NextRequest } from "next/server";
import { callMethod, executeKw, searchRead, write } from "@/lib/odoo";

/**
 * POST /api/sales/:id/deliver
 *
 * Confirma las entregas (stock.picking) de una orden, lo que descuenta
 * el stock real del inventario. Flujo:
 *
 *   1. Obtener picking_ids de la sale.order.
 *   2. Para cada picking en estado != 'done', poner qty_done = product_uom_qty
 *      en todos sus stock.move, y validar (button_validate).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = Number(id);
    if (!orderId) {
      return Response.json({ error: "id inválido" }, { status: 400 });
    }

    const [order] = await searchRead<{
      id: number;
      picking_ids: number[];
    }>("sale.order", [["id", "=", orderId]], ["id", "picking_ids"]);
    if (!order) {
      return Response.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    if (!order.picking_ids?.length) {
      return Response.json({ error: "La orden no tiene entregas" }, { status: 400 });
    }

    const pickings = await searchRead<{ id: number; state: string }>(
      "stock.picking",
      [["id", "in", order.picking_ids]],
      ["id", "state"]
    );

    const results: { picking_id: number; state: string; ok: boolean; msg?: string }[] =
      [];

    for (const p of pickings) {
      if (p.state === "done" || p.state === "cancel") {
        results.push({ picking_id: p.id, state: p.state, ok: true, msg: "skip" });
        continue;
      }
      try {
        // Asegurar reservas.
        await callMethod("stock.picking", "action_assign", [p.id]);

        // Poner qty_done = demand en cada stock.move de este picking.
        const moves = await searchRead<{
          id: number;
          product_uom_qty: number;
          quantity: number;
        }>(
          "stock.move",
          [["picking_id", "=", p.id]],
          ["id", "product_uom_qty", "quantity"]
        );
        for (const m of moves) {
          // Campo en Odoo 17: stock.move.quantity (la cantidad hecha).
          await write("stock.move", [m.id], { quantity: m.product_uom_qty });
        }

        // Validar. Puede devolver un dict (wizard de backorder) - se ignora.
        await executeKw("stock.picking", "button_validate", [[p.id]], {
          context: { skip_backorder: true, skip_sms: true },
        });

        results.push({ picking_id: p.id, state: "done", ok: true });
      } catch (err) {
        results.push({
          picking_id: p.id,
          state: p.state,
          ok: false,
          msg: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return Response.json({ success: true, pickings: results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
