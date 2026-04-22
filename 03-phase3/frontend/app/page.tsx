import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Package,
  ReceiptText,
  ShoppingCart,
  Sparkles,
  UserPlus,
  Zap,
} from "lucide-react";

const CARDS = [
  {
    href: "/products",
    title: "Catálogo",
    desc: "Navega productos con imágenes, búsqueda y paginación.",
    icon: Package,
  },
  {
    href: "/checkout",
    title: "Carrito",
    desc: "Revisa tu carrito y completa tu compra con factura.",
    icon: ShoppingCart,
  },
  {
    href: "/register",
    title: "Registrarse",
    desc: "Crea una cuenta de cliente en Odoo en segundos.",
    icon: UserPlus,
  },
  {
    href: "/sales",
    title: "Órdenes de venta",
    desc: "Consulta cotizaciones, ventas confirmadas y facturas.",
    icon: ReceiptText,
  },
  {
    href: "/reports",
    title: "Reportes BI",
    desc: "KPIs, top clientes, top productos y ventas por mes.",
    icon: BarChart3,
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <section className="mb-12">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <Sparkles className="h-3 w-3" />
          Conectado a Odoo 17
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
          Portal de Ventas <span className="text-emerald-600">G28</span>
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Plataforma web para clientes y vendedores: catálogo, carrito,
          cotizaciones, facturación e inteligencia de negocios, todo sincronizado
          en tiempo real con el ERP de la empresa.
        </p>
        <div className="mt-6 flex gap-2">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Ver catálogo
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Reportes
          </Link>
        </div>
      </section>

      {/* Grid de accesos */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ href, title, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-900 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Icon className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-900 dark:group-hover:text-white" />
            </div>
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {desc}
            </p>
          </Link>
        ))}
      </section>

      {/* Info técnica */}
      <section className="mt-12 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <Zap className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
          </div>
          <div>
            <h2 className="font-semibold">Stack</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Next.js 16 + React 19 · TailwindCSS · Lucide · Odoo 17 (JSON-RPC)
              · PostgreSQL · Metabase (BI)
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
