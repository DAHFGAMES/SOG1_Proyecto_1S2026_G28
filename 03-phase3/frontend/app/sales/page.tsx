"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Filter,
  RefreshCw,
  ReceiptText,
  Send,
  XCircle,
} from "lucide-react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card, CardBody, CardHeader } from "../components/Card";

type Order = {
  id: number;
  name: string;
  partner_id: [number, string] | false;
  date_order: string;
  amount_total: number;
  amount_untaxed: number;
  state: string;
  user_id: [number, string] | false;
};

const STATES = {
  draft: { label: "Cotización", tone: "neutral" as const, icon: FileText },
  sent: { label: "Enviada", tone: "info" as const, icon: Send },
  sale: { label: "Venta", tone: "success" as const, icon: CheckCircle2 },
  done: { label: "Cerrada", tone: "violet" as const, icon: CheckCircle2 },
  cancel: { label: "Cancelada", tone: "danger" as const, icon: XCircle },
};

export default function SalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    const url = filter ? `/api/sales?state=${filter}` : "/api/sales";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setOrders(data.orders || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <ReceiptText className="h-6 w-6" />
            Órdenes de Venta
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {orders.length} órdenes encontradas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-10 rounded-md border border-zinc-200 bg-white pl-9 pr-8 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
            >
              <option value="">Todas</option>
              <option value="draft">Cotizaciones</option>
              <option value="sent">Enviadas</option>
              <option value="sale">Ventas</option>
              <option value="done">Cerradas</option>
              <option value="cancel">Canceladas</option>
            </select>
          </div>
          <Button
            variant="secondary"
            onClick={load}
            leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <Card>
        <CardHeader
          title="Listado"
          icon={<ReceiptText className="h-4 w-4" />}
        />
        <CardBody className="!p-0">
          {loading && !orders.length ? (
            <div className="p-8 text-center text-zinc-500">Cargando...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <ReceiptText className="mx-auto h-12 w-12 text-zinc-300" />
              <p className="mt-3 text-zinc-500">Sin órdenes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
                    <th className="px-4 py-3 font-medium">Orden</th>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Subtotal</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const s =
                      STATES[o.state as keyof typeof STATES] ?? STATES.draft;
                    const Icon = s.icon;
                    return (
                      <tr
                        key={o.id}
                        className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                      >
                        <td className="px-4 py-3 font-mono font-medium">
                          {o.name}
                        </td>
                        <td className="px-4 py-3">
                          {o.partner_id ? o.partner_id[1] : "—"}
                        </td>
                        <td className="px-4 py-3 text-zinc-500">
                          {new Date(o.date_order).toLocaleString("es-GT", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={s.tone} icon={<Icon className="h-3 w-3" />}>
                            {s.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                          Q{o.amount_untaxed.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          Q{o.amount_total.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
