import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  UserPlus,
} from "lucide-react";

const QUICK_LINKS = [
  {
    href: "/products",
    title: "Ver productos",
    desc: "Explora nuestro catálogo de tecnología.",
    icon: Package,
    tone: "orange",
  },
  {
    href: "/checkout",
    title: "Mi carrito",
    desc: "Revisa tus artículos y finaliza tu compra.",
    icon: ShoppingBag,
    tone: "green",
  },
  {
    href: "/register",
    title: "Crear cuenta",
    desc: "Regístrate para comprar más rápido.",
    icon: UserPlus,
    tone: "orange",
  },
  {
    href: "/sales",
    title: "Mis pedidos",
    desc: "Consulta tus compras y cotizaciones.",
    icon: FileText,
    tone: "green",
  },
] as const;

const FEATURES = [
  {
    icon: Truck,
    title: "Entrega rápida",
    desc: "Procesamos tu pedido el mismo día.",
  },
  {
    icon: ShieldCheck,
    title: "Compra segura",
    desc: "Tus datos y pagos siempre protegidos.",
  },
  {
    icon: Sparkles,
    title: "Cotiza sin compromiso",
    desc: "Solicita una cotización antes de comprar.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Banner oficial */}
      <section className="overflow-hidden rounded-3xl border border-orange-100 bg-[#0e1b2e] shadow-sm">
        <Image
          src="/branding/banner.png"
          alt="MayaCode Electronics - Cotizaciones y soluciones tecnológicas"
          width={1600}
          height={560}
          priority
          className="h-auto w-full"
        />
      </section>

      {/* Hero */}
      <section className="relative mt-8 overflow-hidden rounded-3xl border border-orange-100 bg-white p-8 md:p-12 shadow-sm">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-green-200/40 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-100 to-green-100 px-3 py-1 text-xs font-semibold text-orange-700">
            <Sparkles className="h-3 w-3" />
            Tecnología al mejor precio
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-6xl">
            Bienvenido a{" "}
            <span className="brand-text-gradient">MayaCode Electronics</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-600">
            Tu tienda de confianza en cotizaciones y soluciones tecnológicas.
            Compra al instante o solicita una cotización personalizada.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md transition-transform hover:scale-[1.02]"
            >
              Ver productos
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full border-2 border-orange-200 bg-white px-6 py-3 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-50"
            >
              <UserPlus className="h-4 w-4" />
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map(({ href, title, desc, icon: Icon, tone }) => (
          <Link
            key={href}
            href={href}
            className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg"
          >
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
                tone === "orange"
                  ? "bg-orange-100 text-orange-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-zinc-900">{title}</h3>
            <p className="mt-1 text-sm text-zinc-600">{desc}</p>
            <ArrowRight className="absolute bottom-5 right-5 h-4 w-4 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-orange-500" />
          </Link>
        ))}
      </section>

      {/* Beneficios */}
      <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl border border-green-100 bg-gradient-to-br from-white to-green-50/40 p-6"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-bold text-zinc-900">{title}</h3>
            <p className="mt-1 text-sm text-zinc-600">{desc}</p>
          </div>
        ))}
      </section>

      {/* CTA final */}
      <section className="mt-10 overflow-hidden rounded-3xl brand-gradient p-8 md:p-10 text-white shadow-md">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold md:text-3xl">
              ¿Listo para empezar?
            </h2>
            <p className="mt-1 text-sm md:text-base text-white/90">
              Agrega productos al carrito y recibe tu comprobante al instante.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-orange-600 shadow-sm transition-transform hover:scale-[1.02]"
          >
            Ir a comprar
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
