"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  DollarSign,
  Package,
  ReceiptText,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/Card";

type ReportData = {
  summary: {
    total_orders: number;
    confirmed_orders: number;
    total_sales: number;
    avg_order_value: number;
  };
  by_state: Record<string, { count: number; total: number }>;
  top_customers: { id: number; name: string; total: number; orders: number }[];
  top_products: { id: number; name: string; qty: number; total: number }[];
  sales_by_month: { month: string; total: number }[];
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-zinc-500">
        Calculando métricas...
      </div>
    );
  if (error)
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-red-600">
        Error cargando reportes: {error}
      </div>
    );
  if (!data) return null;

  const maxMonth = Math.max(...data.sales_by_month.map((m) => m.total), 1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BarChart3 className="h-6 w-6" />
          Reportes de Ventas
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Métricas rápidas sobre tu actividad comercial
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Órdenes totales"
          value={data.summary.total_orders}
          icon={<ReceiptText className="h-4 w-4" />}
          tone="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        />
        <Kpi
          label="Ventas confirmadas"
          value={data.summary.confirmed_orders}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
        />
        <Kpi
          label="Ingresos totales"
          value={`Q${data.summary.total_sales.toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4" />}
          tone="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        />
        <Kpi
          label="Ticket promedio"
          value={`Q${data.summary.avg_order_value.toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4" />}
          tone="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
        />
      </div>

      {/* Ventas por mes */}
      <Card>
        <CardHeader
          title="Ventas por mes"
          subtitle="Últimos 6 meses"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <CardBody>
          {data.sales_by_month.length === 0 ? (
            <p className="text-sm text-zinc-500">Sin datos aún.</p>
          ) : (
            <div className="space-y-2">
              {data.sales_by_month.map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="w-20 font-mono text-xs text-zinc-500">
                    {m.month}
                  </span>
                  <div className="h-7 flex-1 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                      style={{ width: `${(m.total / maxMonth) * 100}%` }}
                    />
                  </div>
                  <span className="w-28 text-right text-sm font-semibold">
                    Q{m.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Top clientes + productos */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader
            title="Top 10 clientes"
            icon={<Users className="h-4 w-4" />}
          />
          <CardBody>
            {data.top_customers.length === 0 ? (
              <p className="text-sm text-zinc-500">Sin datos.</p>
            ) : (
              <ol className="space-y-2">
                {data.top_customers.map((c, i) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold dark:bg-zinc-800">
                        {i + 1}
                      </span>
                      <span>{c.name}</span>
                      <span className="text-xs text-zinc-500">
                        · {c.orders} órdenes
                      </span>
                    </span>
                    <span className="font-semibold text-emerald-600">
                      Q{c.total.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Top 10 productos"
            icon={<Package className="h-4 w-4" />}
          />
          <CardBody>
            {data.top_products.length === 0 ? (
              <p className="text-sm text-zinc-500">Sin datos.</p>
            ) : (
              <ol className="space-y-2">
                {data.top_products.map((p, i) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold dark:bg-zinc-800">
                        {i + 1}
                      </span>
                      <span className="truncate">{p.name}</span>
                      <span className="text-xs text-zinc-500">
                        · {p.qty} uds
                      </span>
                    </span>
                    <span className="font-semibold text-emerald-600">
                      Q{p.total.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Órdenes por estado */}
      <Card>
        <CardHeader
          title="Órdenes por estado"
          icon={<ReceiptText className="h-4 w-4" />}
        />
        <CardBody>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="py-2 font-medium">Estado</th>
                <th className="py-2 text-right font-medium">Cantidad</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.by_state).map(([state, v]) => (
                <tr
                  key={state}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="py-2 capitalize">{state}</td>
                  <td className="py-2 text-right">{v.count}</td>
                  <td className="py-2 text-right">Q{v.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">{label}</p>
          <div className={`flex h-8 w-8 items-center justify-center rounded-md ${tone}`}>
            {icon}
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
      </CardBody>
    </Card>
  );
}
