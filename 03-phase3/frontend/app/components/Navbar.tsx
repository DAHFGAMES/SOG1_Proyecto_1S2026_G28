"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Home,
  Package,
  ReceiptText,
  ShoppingCart,
  UserPlus,
} from "lucide-react";
import { useCart } from "./CartContext";

const LINKS = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/sales", label: "Mis pedidos", icon: ReceiptText },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/register", label: "Cuenta", icon: UserPlus },
];

export default function Navbar() {
  const { totalItems } = useCart();
  const pathname = usePathname();

  return (
    <header className="no-print sticky top-0 z-30 border-b border-orange-100 bg-white/85 backdrop-blur">
      <div className="h-1 w-full brand-gradient" />
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold tracking-tight text-zinc-900"
        >
          <Image
            src="/branding/logo_circle.png"
            alt="MayaCode Electronics"
            width={40}
            height={40}
            priority
            className="h-10 w-10 rounded-full shadow-sm"
          />
          <span className="hidden text-lg sm:inline">
            MayaCode <span className="brand-text-gradient">Electronics</span>
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-1 text-sm">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                    active
                      ? "bg-orange-100 text-orange-700"
                      : "text-zinc-600 hover:bg-green-50 hover:text-green-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        <Link
          href="/checkout"
          className="brand-gradient relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
        >
          <ShoppingCart className="h-4 w-4" />
          Carrito
          {totalItems > 0 && (
            <span className="ml-0.5 rounded-full bg-white px-1.5 text-xs font-bold text-orange-600">
              {totalItems}
            </span>
          )}
        </Link>
      </nav>
    </header>
  );
}
