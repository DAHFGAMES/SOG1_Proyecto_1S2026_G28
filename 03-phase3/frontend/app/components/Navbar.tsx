"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Cpu,
  Home,
  Package,
  ReceiptText,
  ShoppingCart,
  UserPlus,
} from "lucide-react";
import { useCart } from "./CartContext";

const LINKS = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/products", label: "Catálogo", icon: Package },
  { href: "/sales", label: "Órdenes", icon: ReceiptText },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/register", label: "Registro", icon: UserPlus },
];

export default function Navbar() {
  const { totalItems } = useCart();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
            <Cpu className="h-4 w-4" />
          </span>
          G28 Electronics
        </Link>

        <ul className="hidden md:flex items-center gap-1 text-sm">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
                    active
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
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
          className="relative flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <ShoppingCart className="h-4 w-4" />
          Carrito
          {totalItems > 0 && (
            <span className="ml-0.5 rounded-full bg-emerald-500 px-1.5 text-xs font-bold text-white">
              {totalItems}
            </span>
          )}
        </Link>
      </nav>
    </header>
  );
}
