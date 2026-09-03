/// <reference types="@cloudflare/workers-types" />
/* Shared Supabase access for Pages Functions. Files prefixed with _ are not routes.
 *
 * Auth: the browser sends the user's Supabase access token as a Bearer header.
 * We resolve it to a user id via GET /auth/v1/user (cached ~5 min per token).
 * Data: raw PostgREST + RPC calls using the SERVICE ROLE key (bypasses RLS).
 * No @supabase/supabase-js in the Worker bundle. */

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ANTHROPIC_API_KEY: string;
  AI_MODEL?: string;
  WORKERS_AI_MODEL?: string;
  WORKERS_AI_FALLBACK?: string;   // "1" = allow Llama fallback; anything else = Sonnet-only
  TURNSTILE_SECRET?: string;      // Cloudflare Turnstile secret (iletişim formu doğrulaması)
  // Cloudflare Workers AI binding (free-tier fallback engine). Present when the
  // Pages project has an [ai] binding; undefined otherwise.
  AI?: { run: (model: string, input: unknown) => Promise<{ response?: string }> };
}

export const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

/* ── auth: token → user id (with a small validation cache) ── */
const tokenCache = new Map<string, { userId: string; expiresAt: number }>();
const TOKEN_TTL_MS = 5 * 60 * 1000;

export async function getUserId(request: Request, env: Env): Promise<string | null> {
  const authz = request.headers.get("Authorization") || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
  if (!token || token === "null" || token === "undefined") return null;

  const now = Date.now();
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > now) return cached.userId;

  try {
    const res = await fetch(env.SUPABASE_URL + "/auth/v1/user", {
      headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: "Bearer " + token },
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { id?: string };
    if (!user?.id) return null;
    tokenCache.set(token, { userId: user.id, expiresAt: now + TOKEN_TTL_MS });
    return user.id;
  } catch {
    return null;
  }
}

/* ── PostgREST helpers (service role) ── */
function headers(env: Env, extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY,
    "Content-Type": "application/json",
    ...extra,
  };
}

/** SELECT — returns rows (empty array on error). `path` includes filters/select/order. */
export async function sbSelect<T = Record<string, unknown>>(env: Env, path: string): Promise<T[]> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers: headers(env) });
  if (!res.ok) return [];
  return (await res.json()) as T[];
}

/** SELECT one row (or null). */
export async function sbSelectOne<T = Record<string, unknown>>(env: Env, path: string): Promise<T | null> {
  const rows = await sbSelect<T>(env, path);
  return rows[0] ?? null;
}

/** Exact row count for a filtered table (via content-range header). */
export async function sbCount(env: Env, path: string): Promise<number> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: headers(env, { Prefer: "count=exact", Range: "0-0" }),
  });
  const cr = res.headers.get("content-range") || "";
  const total = cr.split("/")[1];
  return total ? parseInt(total, 10) || 0 : 0;
}

/** INSERT one row. Set `ignoreDup` for INSERT … ON CONFLICT DO NOTHING. */
export async function sbInsert(env: Env, table: string, row: Record<string, unknown>, ignoreDup = false): Promise<boolean> {
  const prefer = (ignoreDup ? "resolution=ignore-duplicates," : "") + "return=minimal";
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: headers(env, { Prefer: prefer }),
    body: JSON.stringify(row),
  });
  return res.ok;
}

/** PATCH rows matched by `path` filters. */
export async function sbUpdate(env: Env, path: string, patch: Record<string, unknown>): Promise<boolean> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: headers(env, { Prefer: "return=minimal" }),
    body: JSON.stringify(patch),
  });
  return res.ok;
}

/** DELETE rows matched by `path` filters. */
export async function sbDelete(env: Env, path: string): Promise<boolean> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    method: "DELETE",
    headers: headers(env, { Prefer: "return=minimal" }),
  });
  return res.ok;
}

/** Call a Postgres function; returns its JSON result. */
export async function sbRpc<T = unknown>(env: Env, fn: string, args: Record<string, unknown>): Promise<T | null> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: headers(env),
    body: JSON.stringify(args),
  });
  if (!res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
