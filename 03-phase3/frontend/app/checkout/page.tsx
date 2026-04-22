"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Minus,
  Package,
  Plus,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card, CardBody, CardHeader } from "../components/Card";
import { useCart } from "../components/CartContext";

type Customer = { id: number; name: string; email: string | false };
type Step = "cart" | "customer" | "mode" | "confirm" | "done";
type Mode = "quotation" | "invoice";

type StockWarning = {
  product_id: number;
  name: string;
  requested: number;
  available: number;
};

export default function CheckoutPage() {
  const { items, setQty, remove, clear, totalPrice, totalItems } = useCart();
  const [step, setStep] = useState<Step>("cart");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const [mode, setMode] = useState<Mode>("invoice");
  const [forceStock, setForceStock] = useState(false);
  const [stockWarnings, setStockWarnings] = useState<StockWarning[]>([]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    orderId: number;
    mode: Mode;
    invoiceName?: string;
    invoiceTotal?: number;
    invoiceState?: string;
    stockUpdated?: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => {
        setCustomers(d.customers || []);
        try {
          const raw = localStorage.getItem("g28-customer");
          if (raw) {
            const s = JSON.parse(raw) as { id: number };
            if (s?.id) setSelected(s.id);
          }
        } catch {}
      });
  }, []);

  async function submit() {
    if (!selected) {
      setError("Selecciona un cliente.");
      return;
    }
    setLoading(true);
    setError(null);
    setStockWarnings([]);

    try {
      const saleRes = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner_id: selected,
          confirm: mode === "invoice",
          force: forceStock,
          note:
            mode === "quotation"
              ? "Cotización generada desde portal web G28"
              : "Compra directa desde portal web G28",
          order_lines: items.map((i) => ({
            product_id: i.product.id,
            quantity: i.qty,
            price_unit: i.product.list_price,
          })),
        }),
      });
      const saleData = await saleRes.json();

      // Stock insuficiente -> pedir confirmación
      if (saleRes.status === 409 && saleData.error === "insufficient_stock") {
        setStockWarnings(saleData.products);
        setLoading(false);
        return;
      }
      if (saleData.error) throw new Error(saleData.error);

      const base = { orderId: saleData.order_id, mode };

      if (mode === "quotation") {
        setResult(base);
        setStep("done");
        clear();
        return;
      }

      // Modo invoice: descontar stock + generar factura
      let stockUpdated = false;
      try {
        const delivRes = await fetch(
          `/api/sales/${saleData.order_id}/deliver`,
          { method: "POST" }
        );
        const delivData = await delivRes.json();
        stockUpdated = !delivData.error;
      } catch {
        /* no bloquea */
      }

      const invRes = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sale_order_id: saleData.order_id,
          post: true,
        }),
      });
      const invData = await invRes.json();
      if (invData.error) throw new Error(invData.error);

      const firstInv = invData.invoices?.[0];
      setResult({
        ...base,
        invoiceName: firstInv?.name,
        invoiceTotal: firstInv?.amount_total,
        invoiceState: firstInv?.state,
        stockUpdated,
      });
      setStep("done");
      clear();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // ====== Paso DONE ======
  if (step === "done" && result) {
    const isQuotation = result.mode === "quotation";
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <Card>
          <CardBody className="text-center">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                isQuotation
                  ? "bg-blue-100 dark:bg-blue-900/30"
                  : "bg-emerald-100 dark:bg-emerald-900/30"
              }`}
            >
              <CheckCircle2
                className={`h-8 w-8 ${
                  isQuotation
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              />
            </div>
            <h1 className="mt-4 text-2xl font-bold">
              {isQuotation
                ? "¡Cotización generada!"
                : "¡Compra procesada!"}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {isQuotation
                ? "Tu cotización quedó en estado borrador en Odoo y puede ser enviada al cliente."
                : "Tu orden fue confirmada, el inventario actualizado y la factura generada."}
            </p>

            <div className="mt-6 space-y-2 text-left">
              <Row
                icon={<ReceiptText className="h-4 w-4" />}
                label="Orden"
                value={`#${result.orderId}`}
              />
              {!isQuotation && (
                <>
                  <Row
                    icon={<FileText className="h-4 w-4" />}
                    label="Factura"
                    value={result.invoiceName ?? "—"}
                  />
                  <Row
                    icon={<Package className="h-4 w-4" />}
                    label="Stock"
                    value={
                      result.stockUpdated
                        ? "Descontado ✓"
                        : "Sin actualizar"
                    }
                  />
                  <Row
                    label="Total facturado"
                    value={`Q${(result.invoiceTotal ?? 0).toFixed(2)}`}
                    bold
                  />
                </>
              )}
            </div>

            <div className="mt-6 flex justify-center gap-2">
              <Link href="/products">
                <Button variant="secondary" leftIcon={<ShoppingBag className="h-4 w-4" />}>
                  Seguir comprando
                </Button>
              </Link>
              <Link href="/sales">
                <Button leftIcon={<ReceiptText className="h-4 w-4" />}>
                  Ver órdenes
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // ====== Header ======
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold">
        <ShoppingCart className="h-6 w-6" />
        Checkout
      </h1>
      <Stepper current={step} />

      {/* PASO 1: Carrito */}
      {step === "cart" && (
        <Card>
          <CardHeader
            title={`Productos en tu carrito (${totalItems})`}
            icon={<ShoppingCart className="h-4 w-4" />}
          />
          <CardBody>
            {items.length === 0 ? (
              <div className="py-10 text-center">
                <ShoppingCart className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                <p className="mt-3 text-zinc-500">Tu carrito está vacío.</p>
                <Link href="/products" className="mt-4 inline-block">
                  <Button leftIcon={<Package className="h-4 w-4" />}>
                    Ver catálogo
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {items.map((i) => (
                    <div
                      key={i.product.id}
                      className="flex items-center gap-3 py-3"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={i.product.image_url ?? "/products/placeholder.svg"}
                        alt={i.product.name}
                        className="h-16 w-16 rounded-lg bg-zinc-50 object-contain p-1 dark:bg-zinc-800"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{i.product.name}</p>
                        <p className="text-xs font-mono text-zinc-500">
                          {i.product.default_code || "—"}
                        </p>
                        <p className="text-sm font-semibold text-emerald-600">
                          Q{i.product.list_price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center rounded-md border border-zinc-200 dark:border-zinc-800">
                        <button
                          onClick={() => setQty(i.product.id, i.qty - 1)}
                          className="flex h-8 w-8 items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-10 text-center text-sm font-medium">
                          {i.qty}
                        </span>
                        <button
                          onClick={() => setQty(i.product.id, i.qty + 1)}
                          className="flex h-8 w-8 items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="w-24 text-right font-semibold">
                        Q{(i.qty * i.product.list_price).toFixed(2)}
                      </p>
                      <button
                        onClick={() => remove(i.product.id)}
                        className="rounded p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <span className="text-zinc-500">Total del carrito</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    Q{totalPrice.toFixed(2)}
                  </span>
                </div>
                <Button
                  onClick={() => setStep("customer")}
                  variant="success"
                  size="lg"
                  className="mt-4 w-full"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Continuar
                </Button>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* PASO 2: Cliente */}
      {step === "customer" && (
        <Card>
          <CardHeader
            title="Selecciona el cliente"
            icon={<User className="h-4 w-4" />}
          />
          <CardBody>
            <select
              value={selected ?? ""}
              onChange={(e) =>
                setSelected(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-400"
            >
              <option value="">-- Elige un cliente --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.email ? ` · ${c.email}` : ""}
                </option>
              ))}
            </select>

            <Link
              href="/register"
              className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <UserPlus className="h-3 w-3" />
              Crear cuenta nueva
            </Link>

            <div className="mt-6 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setStep("cart")}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Atrás
              </Button>
              <Button
                variant="success"
                onClick={() => setStep("mode")}
                disabled={!selected}
                className="flex-1"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Continuar
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* PASO 3: Modo (cotización vs compra) */}
      {step === "mode" && (
        <Card>
          <CardHeader
            title="¿Qué quieres generar?"
            icon={<FileText className="h-4 w-4" />}
          />
          <CardBody>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <ModeCard
                active={mode === "quotation"}
                onClick={() => setMode("quotation")}
                icon={<FileText className="h-5 w-5" />}
                title="Cotización"
                desc="Solo crea el documento en Odoo en estado borrador. No descuenta stock ni genera factura."
              />
              <ModeCard
                active={mode === "invoice"}
                onClick={() => setMode("invoice")}
                icon={<ReceiptText className="h-5 w-5" />}
                title="Compra + Factura"
                desc="Confirma la orden, descuenta stock y genera la factura publicada."
              />
            </div>
            <div className="mt-6 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setStep("customer")}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Atrás
              </Button>
              <Button
                variant="success"
                onClick={() => setStep("confirm")}
                className="flex-1"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Continuar
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* PASO 4: Confirmar */}
      {step === "confirm" && (
        <Card>
          <CardHeader
            title="Confirmar"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <CardBody>
            <div className="space-y-1 text-sm">
              <Row
                label="Cliente"
                value={customers.find((c) => c.id === selected)?.name ?? "—"}
              />
              <Row label="Productos" value={String(totalItems)} />
              <Row
                label="Tipo"
                value={
                  mode === "quotation" ? "Cotización" : "Compra + factura"
                }
              />
              <Row
                label="Total"
                value={`Q${totalPrice.toFixed(2)}`}
                bold
              />
            </div>

            {stockWarnings.length > 0 && (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900 dark:text-amber-200">
                      Stock insuficiente
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-amber-800 dark:text-amber-300">
                      {stockWarnings.map((w) => (
                        <li key={w.product_id}>
                          <strong>{w.name}</strong>: solicitados {w.requested}
                          , disponibles {w.available}
                        </li>
                      ))}
                    </ul>
                    <label className="mt-3 flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200">
                      <input
                        type="checkbox"
                        checked={forceStock}
                        onChange={(e) => setForceStock(e.target.checked)}
                      />
                      Continuar de todos modos (crear la orden aunque no haya
                      stock)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="mt-6 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setStep("mode")}
                disabled={loading}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Atrás
              </Button>
              <Button
                variant="success"
                onClick={submit}
                loading={loading}
                className="flex-1"
                disabled={stockWarnings.length > 0 && !forceStock}
              >
                {mode === "quotation"
                  ? "Generar cotización"
                  : "Confirmar y facturar"}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  bold = false,
  icon,
}: {
  label: string;
  value: string;
  bold?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-zinc-500">
        {icon}
        {label}
      </span>
      <span className={bold ? "text-lg font-bold text-emerald-600" : ""}>
        {value}
      </span>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-all ${
        active
          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20 dark:border-emerald-400 dark:bg-emerald-900/20"
          : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            active
              ? "bg-emerald-600 text-white"
              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {icon}
        </div>
        {active && (
          <Badge tone="success" icon={<CheckCircle2 className="h-3 w-3" />}>
            Seleccionado
          </Badge>
        )}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{desc}</p>
    </button>
  );
}

function Stepper({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "cart", label: "Carrito" },
    { key: "customer", label: "Cliente" },
    { key: "mode", label: "Tipo" },
    { key: "confirm", label: "Confirmar" },
  ];
  const idx = steps.findIndex((s) => s.key === current);
  return (
    <ol className="mb-6 flex items-center gap-2 text-sm">
      {steps.map((s, i) => (
        <li key={s.key} className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              i < idx
                ? "bg-emerald-600 text-white"
                : i === idx
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800"
            }`}
          >
            {i < idx ? "✓" : i + 1}
          </span>
          <span className={i <= idx ? "font-medium" : "text-zinc-500"}>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <span className="text-zinc-300 dark:text-zinc-700">→</span>
          )}
        </li>
      ))}
    </ol>
  );
}
