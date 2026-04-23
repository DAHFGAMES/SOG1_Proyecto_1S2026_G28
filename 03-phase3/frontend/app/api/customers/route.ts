import { NextRequest } from "next/server";
import { create, searchRead } from "@/lib/odoo";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim();

    const domain: unknown[] = [["customer_rank", ">", 0]];
    if (q) domain.push(["name", "ilike", q]);

    const customers = await searchRead(
      "res.partner",
      domain,
      ["id", "name", "email", "phone", "city", "street"],
      { limit: 200, order: "name asc" }
    );

    return Response.json({ customers });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, street, city } = body;

    if (!name) {
      return Response.json({ error: "name es requerido" }, { status: 400 });
    }

    const id = await create("res.partner", {
      name,
      email: email ?? false,
      phone: phone ?? false,
      street: street ?? false,
      city: city ?? false,
      is_company: true,
      customer_rank: 1,
    });

    return Response.json({ success: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
