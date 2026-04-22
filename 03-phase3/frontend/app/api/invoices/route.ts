import { NextRequest } from "next/server";
import {
  callMethod,
  create,
  executeKw,
  executeKwWithContext,
  searchRead,
} from "@/lib/odoo";

/**
 * POST /api/invoices
 * Body: { sale_order_id: number, post?: boolean }
 *
 * Flujo correcto en Odoo 17 (los métodos con _ no son callables por RPC):
 *   1. Confirmar la orden si está en draft (action_confirm).
 *   2. Crear wizard sale.advance.payment.inv con context active_ids=[order_id].
 *   3. Llamar al método público create_invoices() del wizard.
 *   4. Leer invoice_ids de la orden para devolver la factura creada.
 *   5. Opcionalmente action_post para publicar la factura.
 */
export async function POST(request: NextRequest) {
  try {
    const { sale_order_id, post = true } = (await request.json()) as {
      sale_order_id: number;
      post?: boolean;
    };

    if (!sale_order_id) {
      return Response.json(
        { error: "sale_order_id es requerido" },
        { status: 400 }
      );
    }

    // 1. Leer estado actual.
    const [order] = await searchRead<{
      id: number;
      state: string;
      invoice_ids: number[];
    }>(
      "sale.order",
      [["id", "=", sale_order_id]],
      ["id", "state", "invoice_ids"]
    );
    if (!order) {
      return Response.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // 2. Confirmar si sigue en cotización.
    if (order.state === "draft" || order.state === "sent") {
      await callMethod("sale.order", "action_confirm", [sale_order_id]);
    }

    // 3. Wizard para crear factura. En contextos activos Odoo toma la(s)
    //    sale.order desde active_ids y active_model.
    const ctx = {
      active_model: "sale.order",
      active_ids: [sale_order_id],
      active_id: sale_order_id,
    };

    const wizardId = await executeKwWithContext<number>(
      "sale.advance.payment.inv",
      "create",
      [{ advance_payment_method: "delivered" }],
      ctx
    );

    await executeKwWithContext(
      "sale.advance.payment.inv",
      "create_invoices",
      [[wizardId]],
      ctx
    );

    // 4. Leer facturas recién creadas desde la orden.
    const [refreshed] = await searchRead<{ id: number; invoice_ids: number[] }>(
      "sale.order",
      [["id", "=", sale_order_id]],
      ["id", "invoice_ids"]
    );
    const invoiceIds = refreshed?.invoice_ids ?? [];

    // 5. Publicar facturas.
    if (post && invoiceIds.length > 0) {
      try {
        await callMethod("account.move", "action_post", invoiceIds);
      } catch {
        // Si falla (ej. config contable incompleta), se queda en borrador.
      }
    }

    const invoices = await searchRead(
      "account.move",
      [["id", "in", invoiceIds]],
      ["id", "name", "amount_total", "amount_residual", "state"]
    );

    return Response.json({ success: true, invoices });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}

/** GET /api/invoices?order_id=123 */
export async function GET(request: NextRequest) {
  try {
    const orderId = Number(request.nextUrl.searchParams.get("order_id"));
    if (!orderId) {
      return Response.json({ error: "order_id requerido" }, { status: 400 });
    }
    const [order] = await searchRead<{ id: number; invoice_ids: number[] }>(
      "sale.order",
      [["id", "=", orderId]],
      ["id", "invoice_ids"]
    );
    if (!order || !order.invoice_ids?.length) {
      return Response.json({ invoices: [] });
    }
    const invoices = await searchRead(
      "account.move",
      [["id", "in", order.invoice_ids]],
      ["id", "name", "amount_total", "amount_residual", "state", "invoice_date"]
    );
    return Response.json({ invoices });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
// Silenciar warnings de imports no usados.
void executeKw;
void create;
