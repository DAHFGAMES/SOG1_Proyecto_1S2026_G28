"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  Search,
  ShoppingCart,
} from "lucide-react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { useCart, type CartProduct } from "../components/CartContext";

type Product = CartProduct & {
  standard_price: number;
  description_sale: string | false;
  qty_available: number;
};

type Pagination = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export default function ProductsPage() {
  const { add } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      per_page: "12",
    });
    if (debouncedQuery) params.set("q", debouncedQuery);

    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProducts(data.products);
        setPagination(data.pagination);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, debouncedQuery]);

  function handleAdd(p: Product) {
    add({
      id: p.id,
      name: p.name,
      default_code: p.default_code,
      list_price: p.list_price,
      image_url: p.image_url,
    });
    setAdded(p.id);
    setTimeout(() => setAdded(null), 1200);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Package className="h-6 w-6" />
            Catálogo
          </h1>
          {pagination && (
            <p className="mt-1 text-sm text-zinc-500">
              {pagination.total} productos disponibles
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-64 rounded-md border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-400"
            />
          </div>
          <Link href="/checkout">
            <Button variant="success" leftIcon={<ShoppingCart className="h-4 w-4" />}>
              Carrito
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          Error: {error}
        </p>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800"
            />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <Package className="mx-auto h-12 w-12 text-zinc-400" />
          <p className="mt-3 text-zinc-500">No hay productos que coincidan.</p>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <article
              key={p.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="relative aspect-square overflow-hidden bg-zinc-50 dark:bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image_url}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3">
                  <Badge tone="neutral">{p.default_code || "—"}</Badge>
                </div>
                <div className="absolute right-3 top-3">
                  {p.qty_available > 0 ? (
                    <Badge tone="success">Stock: {p.qty_available}</Badge>
                  ) : (
                    <Badge tone="danger">Agotado</Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-2 font-medium">{p.name}</h3>
                {p.description_sale && (
                  <p className="mt-1 line-clamp-2 flex-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {p.description_sale}
                  </p>
                )}
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-zinc-500">Precio</p>
                    <p className="text-xl font-bold text-emerald-600">
                      Q{p.list_price.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleAdd(p)}
                    variant={added === p.id ? "success" : "primary"}
                    size="sm"
                    leftIcon={
                      added === p.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )
                    }
                  >
                    {added === p.id ? "Agregado" : "Agregar"}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Paginación */}
      {pagination && pagination.total_pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            Anterior
          </Button>
          <div className="flex gap-1">
            {Array.from(
              { length: pagination.total_pages },
              (_, i) => i + 1
            ).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`h-9 min-w-9 rounded-md px-3 text-sm font-medium transition-colors ${
                  n === page
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setPage((p) => Math.min(pagination.total_pages, p + 1))
            }
            disabled={page === pagination.total_pages}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
