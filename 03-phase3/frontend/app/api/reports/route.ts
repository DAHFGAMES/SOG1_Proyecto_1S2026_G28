import { searchRead } from "@/lib/odoo";

type SaleOrder = {
  id: number;
  name: string;
  partner_id: [number, string];
  amount_total: number;
  date_order: string;
  state: string;
};

type OrderLine = {
  id: number;
  product_id: [number, string];
  product_uom_qty: number;
  price_subtotal: number;
};

/** GET /api/reports -> métricas BI básicas */
export async function GET() {
  try {
    // Todas las órdenes (cotizaciones + confirmadas)
    const orders = await searchRead<SaleOrder>(
      "sale.order",
      [],
      ["id", "name", "partner_id", "amount_total", "date_order", "state"],
      { limit: 0, order: "date_order desc" }
    );

    const byState: Record<string, { count: number; total: number }> = {};
    for (const o of orders) {
      const key = o.state || "unknown";
      if (!byState[key]) byState[key] = { count: 0, total: 0 };
      byState[key].count += 1;
      byState[key].total += o.amount_total;
    }

    // Ventas confirmadas
    const confirmed = orders.filter(
      (o) => o.state === "sale" || o.state === "done"
    );
    const totalSales = confirmed.reduce((sum, o) => sum + o.amount_total, 0);

    // Top clientes por ventas confirmadas
    const byCustomer = new Map<number, { name: string; total: number; orders: number }>();
    for (const o of confirmed) {
      const [pid, pname] = o.partner_id || [0, "Sin cliente"];
      const prev = byCustomer.get(pid) ?? { name: pname, total: 0, orders: 0 };
      prev.total += o.amount_total;
      prev.orders += 1;
      byCustomer.set(pid, prev);
    }
    const topCustomers = Array.from(byCustomer.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Top productos por cantidad vendida (líneas de órdenes confirmadas)
    const confirmedIds = confirmed.map((o) => o.id);
    let topProducts: { id: number; name: string; qty: number; total: number }[] = [];
    if (confirmedIds.length > 0) {
      const lines = await searchRead<OrderLine>(
        "sale.order.line",
        [["order_id", "in", confirmedIds]],
        ["id", "product_id", "product_uom_qty", "price_subtotal"],
        { limit: 0 }
      );
      const byProduct = new Map<number, { name: string; qty: number; total: number }>();
      for (const l of lines) {
        const [pid, pname] = l.product_id || [0, "?"];
        const prev = byProduct.get(pid) ?? { name: pname, qty: 0, total: 0 };
        prev.qty += l.product_uom_qty;
        prev.total += l.price_subtotal;
        byProduct.set(pid, prev);
      }
      topProducts = Array.from(byProduct.entries())
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10);
    }

    // Ventas por mes (últimos 6 meses)
    const byMonth = new Map<string, number>();
    for (const o of confirmed) {
      const month = o.date_order?.slice(0, 7) ?? "unknown";
      byMonth.set(month, (byMonth.get(month) ?? 0) + o.amount_total);
    }
    const salesByMonth = Array.from(byMonth.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    return Response.json({
      summary: {
        total_orders: orders.length,
        confirmed_orders: confirmed.length,
        total_sales: totalSales,
        avg_order_value:
          confirmed.length > 0 ? totalSales / confirmed.length : 0,
      },
      by_state: byState,
      top_customers: topCustomers,
      top_products: topProducts,
      sales_by_month: salesByMonth,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
