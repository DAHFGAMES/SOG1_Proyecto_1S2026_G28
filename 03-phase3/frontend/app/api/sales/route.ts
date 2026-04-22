import { NextRequest } from "next/server";
import { callMethod, create, executeKw, searchRead } from "@/lib/odoo";

/** GET /api/sales -> listado de órdenes/cotizaciones */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const state = searchParams.get("state"); // draft, sent, sale, done, cancel
    const limit = Number(searchParams.get("limit") ?? 100);

    const domain: unknown[] = [];
    if (state) domain.push(["state", "=", state]);

    const orders = await searchRead(
      "sale.order",
      domain,
      [
        "id",
        "name",
        "partner_id",
        "date_order",
        "amount_total",
        "amount_untaxed",
        "state",
        "user_id",
      ],
      { limit, order: "date_order desc" }
    );

    return Response.json({ orders });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/sales -> crea cotización (y opcionalmente la confirma).
 * Body:
 * {
 *   partner_id: number,
 *   order_lines: [{ product_id, quantity, price_unit? }],
 *   note?: string,
 *   confirm?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partner_id, order_lines, note, confirm } = body as {
      partner_id: number;
      order_lines: { product_id: number; quantity: number; price_unit?: number }[];
      note?: string;
      confirm?: boolean;
      force?: boolean;
    };

    if (!partner_id || !Array.isArray(order_lines) || order_lines.length === 0) {
      return Response.json(
        { error: "partner_id y order_lines son requeridos" },
        { status: 400 }
      );
    }

    // Verificar stock disponible de cada producto.
    const productIds = order_lines.map((l) => l.product_id);
    const stockInfo = await searchRead<{
      id: number;
      name: string;
      qty_available: number;
    }>(
      "product.product",
      [["id", "in", productIds]],
      ["id", "name", "qty_available"]
    );
    const stockMap = new Map(stockInfo.map((p) => [p.id, p]));
    const insufficient = order_lines
      .map((l) => {
        const p = stockMap.get(l.product_id);
        if (!p) return null;
        if (p.qty_available < l.quantity) {
          return {
            product_id: l.product_id,
            name: p.name,
            requested: l.quantity,
            available: p.qty_available,
          };
        }
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (insufficient.length > 0 && !body.force) {
      return Response.json(
        {
          error: "insufficient_stock",
          message: "Stock insuficiente para uno o más productos",
          products: insufficient,
        },
        { status: 409 }
      );
    }

    // En Odoo los one2many se crean con tuplas (0, 0, {valores})
    const lines = order_lines.map((l) => [
      0,
      0,
      {
        product_id: l.product_id,
        product_uom_qty: l.quantity,
        ...(l.price_unit !== undefined ? { price_unit: l.price_unit } : {}),
      },
    ]);

    const orderId = await create("sale.order", {
      partner_id,
      order_line: lines,
      note: note ?? false,
    });

    if (confirm) {
      // Confirma la cotización y la convierte en orden de venta.
      await callMethod("sale.order", "action_confirm", [orderId]);
    }

    return Response.json({ success: true, order_id: orderId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
void executeKw;
