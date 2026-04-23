"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Mail,
  Minus,
  Package,
  Plus,
  Printer,
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
import { useCart, type CartItem } from "../components/CartContext";

type Customer = { id: number; name: string; email: string | false };
type Step = "cart" | "customer" | "mode" | "confirm" | "done";
type Mode = "quotation" | "invoice";

type StockWarning = {
  product_id: number;
  name: string;
  requested: number;
  available: number;
};

type ReceiptData = {
  orderId: number;
  mode: Mode;
  customerName: string;
  customerEmail: string | null;
  items: CartItem[];
  subtotal: number;
  total: number;
  invoiceName?: string;
  invoiceTotal?: number;
  date: string;
  emailSent: boolean;
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
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
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

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selected) || null,
    [customers, selected]
  );

  async function submit() {
    if (!selected) {
      setError("Selecciona un cliente.");
      return;
    }
    setLoading(true);
    setError(null);
    setStockWarnings([]);

    // Snapshot del carrito ANTES de limpiar (para el comprobante)
    const snapshotItems = items.map((i) => ({ ...i, product: { ...i.product } }));
    const snapshotSubtotal = totalPrice;

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
              ? "Cotización solicitada desde la tienda en línea"
              : "Compra realizada desde la tienda en línea",
          order_lines: items.map((i) => ({
            product_id: i.product.id,
            quantity: i.qty,
            price_unit: i.product.list_price,
          })),
        }),
      });
      const saleData = await saleRes.json();

      if (saleRes.status === 409 && saleData.error === "insufficient_stock") {
        setStockWarnings(saleData.products);
        setLoading(false);
        return;
      }
      if (saleData.error) throw new Error(saleData.error);

      const base: ReceiptData = {
        orderId: saleData.order_id,
        mode,
        customerName: selectedCustomer?.name ?? "Cliente",
        customerEmail: selectedCustomer?.email || null,
        items: snapshotItems,
        subtotal: snapshotSubtotal,
        total: snapshotSubtotal,
        date: new Date().toISOString(),
        emailSent: Boolean(saleData.email_sent),
      };

      if (mode === "quotation") {
        setReceipt(base);
        setStep("done");
        clear();
        return;
      }

      // Compra: descontar inventario + emitir factura (silencioso para el usuario)
      try {
        await fetch(`/api/sales/${saleData.order_id}/deliver`, {
          method: "POST",
        });
      } catch {}

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
      setReceipt({
        ...base,
        invoiceName: firstInv?.name,
        invoiceTotal: firstInv?.amount_total,
        total: firstInv?.amount_total ?? base.total,
        emailSent: Boolean(invData.email_sent),
      });
      setStep("done");
      clear();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // ====== Paso DONE: Comprobante / Factura ======
  if (step === "done" && receipt) {
    return <Receipt data={receipt} />;
  }

  // ====== Flujo ======
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold">
        <ShoppingCart className="h-6 w-6 text-orange-600" />
        Finalizar compra
      </h1>
      <Stepper current={step} />

      {/* PASO 1: Carrito */}
      {step === "cart" && (
        <Card>
          <CardHeader
            title={`Tu carrito (${totalItems} ${totalItems === 1 ? "artículo" : "artículos"})`}
            icon={<ShoppingCart className="h-4 w-4" />}
          />
          <CardBody>
            {items.length === 0 ? (
              <div className="py-10 text-center">
                <ShoppingCart className="mx-auto h-12 w-12 text-zinc-300" />
                <p className="mt-3 text-zinc-500">Tu carrito está vacío.</p>
                <Link href="/products" className="mt-4 inline-block">
                  <Button leftIcon={<Package className="h-4 w-4" />}>
                    Ver productos
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="divide-y divide-zinc-100">
                  {items.map((i) => (
                    <div
                      key={i.product.id}
                      className="flex items-center gap-3 py-3"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={i.product.image_url ?? "/products/placeholder.svg"}
                        alt={i.product.name}
                        className="h-16 w-16 rounded-lg bg-zinc-50 object-contain p-1"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{i.product.name}</p>
                        <p className="text-sm font-semibold text-orange-600">
                          Q{i.product.list_price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center rounded-full border border-zinc-200">
                        <button
                          onClick={() => setQty(i.product.id, i.qty - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-l-full hover:bg-orange-50"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-10 text-center text-sm font-medium">
                          {i.qty}
                        </span>
                        <button
                          onClick={() => setQty(i.product.id, i.qty + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-r-full hover:bg-orange-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="w-24 text-right font-semibold">
                        Q{(i.qty * i.product.list_price).toFixed(2)}
                      </p>
                      <button
                        onClick={() => remove(i.product.id)}
                        className="rounded-full p-2 text-red-500 hover:bg-red-50"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
                  <span className="text-zinc-600">Total</span>
                  <span className="text-2xl font-bold text-green-600">
                    Q{totalPrice.toFixed(2)}
                  </span>
                </div>
                <Button
                  onClick={() => setStep("customer")}
                  variant="success"
                  size="lg"
                  className="mt-4 w-full !bg-green-600 hover:!bg-green-700"
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
            title="¿A nombre de quién?"
            icon={<User className="h-4 w-4" />}
          />
          <CardBody>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Selecciona tu cuenta
            </label>
            <select
              value={selected ?? ""}
              onChange={(e) =>
                setSelected(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value="">-- Elige una cuenta --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.email ? ` · ${c.email}` : ""}
                </option>
              ))}
            </select>

            <Link
              href="/register"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:underline"
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
                onClick={() => setStep("mode")}
                disabled={!selected}
                className="flex-1 !bg-green-600 hover:!bg-green-700 !text-white"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Continuar
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* PASO 3: Tipo */}
      {step === "mode" && (
        <Card>
          <CardHeader
            title="¿Cómo deseas continuar?"
            icon={<FileText className="h-4 w-4" />}
          />
          <CardBody>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <ModeCard
                active={mode === "quotation"}
                onClick={() => setMode("quotation")}
                icon={<FileText className="h-5 w-5" />}
                title="Solicitar cotización"
                desc="Recibe un presupuesto de tu pedido sin compromiso de compra."
              />
              <ModeCard
                active={mode === "invoice"}
                onClick={() => setMode("invoice")}
                icon={<ReceiptText className="h-5 w-5" />}
                title="Comprar ahora"
                desc="Confirma tu pedido y recibe tu factura al instante."
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
                onClick={() => setStep("confirm")}
                className="flex-1 !bg-green-600 hover:!bg-green-700 !text-white"
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
            title="Revisa tu pedido"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <CardBody>
            <div className="space-y-1 text-sm">
              <Row
                label="Cliente"
                value={selectedCustomer?.name ?? "—"}
              />
              <Row label="Artículos" value={String(totalItems)} />
              <Row
                label="Tipo"
                value={mode === "quotation" ? "Cotización" : "Compra"}
              />
              <Row
                label="Total"
                value={`Q${totalPrice.toFixed(2)}`}
                bold
              />
            </div>

            {stockWarnings.length > 0 && (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900">
                      Existencia limitada
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-amber-800">
                      {stockWarnings.map((w) => (
                        <li key={w.product_id}>
                          <strong>{w.name}</strong>: pediste {w.requested},
                          disponibles {w.available}
                        </li>
                      ))}
                    </ul>
                    <label className="mt-3 flex items-center gap-2 text-sm text-amber-900">
                      <input
                        type="checkbox"
                        checked={forceStock}
                        onChange={(e) => setForceStock(e.target.checked)}
                      />
                      Continuar de todas formas
                    </label>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800">
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
                onClick={submit}
                loading={loading}
                className="flex-1 !bg-green-600 hover:!bg-green-700 !text-white"
                disabled={stockWarnings.length > 0 && !forceStock}
              >
                {mode === "quotation"
                  ? "Solicitar cotización"
                  : "Confirmar compra"}
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
      <span className={bold ? "text-lg font-bold text-green-600" : ""}>
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
      className={`rounded-2xl border-2 p-5 text-left transition-all ${
        active
          ? "border-orange-500 bg-orange-50 ring-4 ring-orange-500/10"
          : "border-zinc-200 bg-white hover:border-orange-300"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            active ? "brand-gradient text-white" : "bg-zinc-100 text-zinc-700"
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
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 text-sm text-zinc-600">{desc}</p>
    </button>
  );
}

function Stepper({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "cart", label: "Carrito" },
    { key: "customer", label: "Cuenta" },
    { key: "mode", label: "Tipo" },
    { key: "confirm", label: "Confirmar" },
  ];
  const idx = steps.findIndex((s) => s.key === current);
  return (
    <ol className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      {steps.map((s, i) => (
        <li key={s.key} className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              i < idx
                ? "bg-green-600 text-white"
                : i === idx
                ? "brand-gradient text-white"
                : "bg-zinc-200 text-zinc-500"
            }`}
          >
            {i < idx ? "✓" : i + 1}
          </span>
          <span className={i <= idx ? "font-medium" : "text-zinc-500"}>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <span className="text-zinc-300">→</span>
          )}
        </li>
      ))}
    </ol>
  );
}

// ========================================================================
//   COMPROBANTE / FACTURA
// ========================================================================
function Receipt({ data }: { data: ReceiptData }) {
  const isQuotation = data.mode === "quotation";
  const docTitle = isQuotation ? "Cotización" : "Factura";
  const docNumber = isQuotation
    ? `COT-${String(data.orderId).padStart(6, "0")}`
    : data.invoiceName ?? `FAC-${String(data.orderId).padStart(6, "0")}`;
  const dateLabel = new Date(data.date).toLocaleString("es-GT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Banner de éxito */}
      <div className="no-print mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-5">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-zinc-900">
            {isQuotation
              ? "¡Cotización generada con éxito!"
              : "¡Gracias por tu compra!"}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            {isQuotation
              ? "Aquí tienes tu cotización. Puedes imprimirla o guardarla como PDF."
              : "Tu pedido fue confirmado. Aquí está tu comprobante de compra."}
          </p>
          {data.emailSent && data.customerEmail && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">
              <Mail className="h-3.5 w-3.5" />
              Enviado a {data.customerEmail}
            </p>
          )}
          {!data.emailSent && data.customerEmail && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
              <Mail className="h-3.5 w-3.5" />
              Programado para envío a {data.customerEmail}
            </p>
          )}
        </div>
      </div>

      {/* Comprobante */}
      <div className="print-page overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
        {/* Header de la factura */}
        <div className="bg-[#0e1b2e] px-8 py-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/branding/logo_circle.png"
                alt="MayaCode Electronics"
                width={56}
                height={56}
                className="h-14 w-14 rounded-full bg-white/5"
              />
              <div>
                <div className="text-lg font-extrabold tracking-tight">
                  MayaCode <span className="text-orange-400">Electronics</span>
                </div>
                <p className="mt-0.5 text-xs text-white/80">
                  Ciudad de Guatemala · info@mayacode.gt
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-white/80">
                {docTitle}
              </p>
              <p className="font-mono text-lg font-bold">{docNumber}</p>
              <p className="mt-1 text-xs text-white/90">{dateLabel}</p>
            </div>
          </div>
        </div>

        {/* Cliente */}
        <div className="grid grid-cols-1 gap-4 border-b border-zinc-100 px-8 py-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Cliente
            </p>
            <p className="mt-1 font-semibold text-zinc-900">
              {data.customerName}
            </p>
            {data.customerEmail && (
              <p className="text-sm text-zinc-600">{data.customerEmail}</p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {isQuotation ? "Validez" : "Estado"}
            </p>
            <p className="mt-1 font-semibold">
              {isQuotation ? (
                <span className="text-orange-600">15 días</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Pagada
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="px-8 py-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="py-2 font-semibold">Producto</th>
                <th className="py-2 text-center font-semibold">Cant.</th>
                <th className="py-2 text-right font-semibold">P. Unit</th>
                <th className="py-2 text-right font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((i) => (
                <tr
                  key={i.product.id}
                  className="border-b border-zinc-100 align-top"
                >
                  <td className="py-3">
                    <p className="font-medium text-zinc-900">
                      {i.product.name}
                    </p>
                    {i.product.default_code && (
                      <p className="font-mono text-xs text-zinc-500">
                        {i.product.default_code}
                      </p>
                    )}
                  </td>
                  <td className="py-3 text-center">{i.qty}</td>
                  <td className="py-3 text-right">
                    Q{i.product.list_price.toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-semibold">
                    Q{(i.qty * i.product.list_price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="flex justify-end border-t border-zinc-100 bg-zinc-50/60 px-8 py-5">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal</span>
              <span>Q{data.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-2 text-base">
              <span className="font-bold text-zinc-900">Total</span>
              <span className="font-extrabold brand-text-gradient">
                Q{data.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-100 px-8 py-4 text-center text-xs text-zinc-500">
          {isQuotation
            ? "Este documento es una cotización y no constituye una factura."
            : "Gracias por su preferencia. MayaCode Electronics le agradece su compra."}
        </div>
      </div>

      {/* Acciones */}
      <div className="no-print mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => window.print()}
          className="brand-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
        >
          <Printer className="h-4 w-4" />
          Imprimir / Guardar PDF
        </button>
        <Link href="/products">
          <Button
            variant="secondary"
            leftIcon={<ShoppingBag className="h-4 w-4" />}
          >
            Seguir comprando
          </Button>
        </Link>
        <Link href="/sales">
          <Button
            variant="secondary"
            leftIcon={<ReceiptText className="h-4 w-4" />}
          >
            Ver mis pedidos
          </Button>
        </Link>
      </div>
    </div>
  );
}
