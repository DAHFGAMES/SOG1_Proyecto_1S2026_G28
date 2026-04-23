import { NextRequest } from "next/server";
import { executeKw, searchRead } from "@/lib/odoo";
import { getProductImage } from "@/lib/product-images";

type ProductRow = {
  id: number;
  name: string;
  default_code: string | false;
  list_price: number;
  standard_price: number;
  description_sale: string | false;
  qty_available: number;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(
      100,
      Math.max(1, Number(searchParams.get("per_page") ?? 12))
    );

    const domain: unknown[] = [["sale_ok", "=", true]];
    if (q) domain.push(["name", "ilike", q]);

    // Total para paginación (search_count).
    const total = await executeKw<number>("product.product", "search_count", [
      domain,
    ]);

    const rows = await searchRead<ProductRow>(
      "product.product",
      domain,
      [
        "id",
        "name",
        "default_code",
        "list_price",
        "standard_price",
        "description_sale",
        "qty_available",
      ],
      {
        limit: perPage,
        offset: (page - 1) * perPage,
        order: "default_code asc",
      }
    );

    // Enriquecer con URL de imagen estática.
    const products = rows.map((p) => ({
      ...p,
      image_url: getProductImage(p.default_code),
    }));

    return Response.json({
      products,
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
