/**
 * Cliente JSON-RPC para Odoo 17.
 *
 * Usa el endpoint /jsonrpc de Odoo (stateless). Cada llamada envía
 * credenciales explícitas, por lo que no requiere manejo de sesiones/cookies.
 *
 * Flujo:
 *   1. authenticate(db, login, password) -> uid
 *   2. execute_kw(db, uid, password, model, method, args, kwargs) -> resultado
 */

const ODOO_URL = process.env.ODOO_URL || "http://localhost:8069";
const ODOO_DB = process.env.ODOO_DB || "g28_db";
const ODOO_USERNAME = process.env.ODOO_USERNAME || "admin@odoo.com";
const ODOO_PASSWORD = process.env.ODOO_PASSWORD || "12345";

type JsonRpcResponse<T> = {
  jsonrpc: "2.0";
  id: number | null;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: { name?: string; debug?: string; message?: string };
  };
};

async function jsonRpc<T>(
  service: string,
  method: string,
  args: unknown[]
): Promise<T> {
  const res = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
      id: Math.floor(Math.random() * 1_000_000),
    }),
    // Odoo puede tardar; no cachear.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Odoo HTTP ${res.status}: ${res.statusText}`);
  }

  const data = (await res.json()) as JsonRpcResponse<T>;
  if (data.error) {
    const detail =
      data.error.data?.message || data.error.message || "Unknown error";
    throw new Error(`Odoo RPC error: ${detail}`);
  }
  return data.result as T;
}

// Cache del uid durante el ciclo de vida del proceso.
let cachedUid: number | null = null;

export async function authenticate(): Promise<number> {
  if (cachedUid) return cachedUid;
  const uid = await jsonRpc<number | false>("common", "authenticate", [
    ODOO_DB,
    ODOO_USERNAME,
    ODOO_PASSWORD,
    {},
  ]);
  if (!uid) {
    throw new Error(
      "Autenticación fallida en Odoo. Verifica ODOO_USERNAME/ODOO_PASSWORD/ODOO_DB."
    );
  }
  cachedUid = uid;
  return uid;
}

export async function executeKw<T = unknown>(
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  const uid = await authenticate();
  return jsonRpc<T>("object", "execute_kw", [
    ODOO_DB,
    uid,
    ODOO_PASSWORD,
    model,
    method,
    args,
    kwargs,
  ]);
}

/**
 * Atajo: ejecuta método con context específico. Odoo lee `active_ids`,
 * `active_model`, `active_id` del contexto para los wizards.
 */
export async function executeKwWithContext<T = unknown>(
  model: string,
  method: string,
  args: unknown[],
  context: Record<string, unknown>,
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  return executeKw<T>(model, method, args, { ...kwargs, context });
}

/** Atajo: search_read */
export async function searchRead<T = Record<string, unknown>>(
  model: string,
  domain: unknown[] = [],
  fields: string[] = [],
  opts: { limit?: number; offset?: number; order?: string } = {}
): Promise<T[]> {
  return executeKw<T[]>(model, "search_read", [domain], {
    fields,
    limit: opts.limit ?? 0,
    offset: opts.offset ?? 0,
    order: opts.order ?? "id desc",
  });
}

/** Atajo: create */
export async function create(
  model: string,
  values: Record<string, unknown>
): Promise<number> {
  return executeKw<number>(model, "create", [values]);
}

/** Atajo: write */
export async function write(
  model: string,
  ids: number[],
  values: Record<string, unknown>
): Promise<boolean> {
  return executeKw<boolean>(model, "write", [ids, values]);
}

/** Atajo: unlink */
export async function unlink(model: string, ids: number[]): Promise<boolean> {
  return executeKw<boolean>(model, "unlink", [ids]);
}

/** Llamar métodos custom (ej. action_confirm en sale.order). */
export async function callMethod<T = unknown>(
  model: string,
  method: string,
  ids: number[],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  return executeKw<T>(model, method, [ids], kwargs);
}

export const odoo = {
  authenticate,
  executeKw,
  searchRead,
  create,
  write,
  unlink,
  callMethod,
};
