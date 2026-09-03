/// <reference types="@cloudflare/workers-types" />
/* Admin-only user management.
 *   GET  /api/admin/users            -> list all profiles + basic stats
 *   POST /api/admin/users            -> update one user
 *        body: { id, addCredits?, setCredits?, is_pro?, is_admin? }
 * Every request is verified to come from an is_admin caller. */
import { getUserId, json, sbSelectOne, sbUpdate, sbRpc, type Env } from "../_supabase";
import { getProfile, addCredits } from "../_db";

async function requireAdmin(request: Request, env: Env): Promise<string | Response> {
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Oturum yok." }, 401);
  const me = await getProfile(env, userId);
  if (!me?.is_admin) return json({ error: "Yetkiniz yok." }, 403);
  return userId;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const gate = await requireAdmin(request, env);
  if (gate instanceof Response) return gate;

  const data = await sbRpc<{ users: unknown[]; stats: unknown; daily: unknown[] }>(env, "presubly_admin_data", {});
  if (!data) return json({ error: "Veri alınamadı." }, 500);
  return json(data);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const gate = await requireAdmin(request, env);
  if (gate instanceof Response) return gate;

  let body: { id?: string; addCredits?: number; setCredits?: number; plan?: string; is_pro?: boolean; is_admin?: boolean };
  try { body = await request.json(); } catch { return json({ error: "Geçersiz gövde." }, 400); }
  if (!body.id) return json({ error: "Kullanıcı id gerekli." }, 400);

  const exists = await getProfile(env, body.id);
  if (!exists) return json({ error: "Kullanıcı bulunamadı." }, 404);
  const sel = `profiles?id=eq.${body.id}`;

  if (typeof body.plan === "string" && ["free", "academic", "pro", "enterprise"].includes(body.plan)) {
    // keep the legacy is_pro flag consistent with the tier
    await sbUpdate(env, sel, { plan: body.plan, is_pro: body.plan !== "free" });
  }
  if (typeof body.addCredits === "number" && body.addCredits !== 0) {
    await addCredits(env, body.id, Math.trunc(body.addCredits));
    // clamp to >= 0
    const p = await getProfile(env, body.id);
    if (p && p.credits < 0) await sbUpdate(env, sel, { credits: 0 });
  }
  if (typeof body.setCredits === "number") {
    await sbUpdate(env, sel, { credits: Math.max(0, Math.trunc(body.setCredits)) });
  }
  if (typeof body.is_pro === "boolean") {
    await sbUpdate(env, sel, { is_pro: body.is_pro });
  }
  if (typeof body.is_admin === "boolean") {
    await sbUpdate(env, sel, { is_admin: body.is_admin });
  }

  const updated = await sbSelectOne(env, `${sel}&select=id,email,credits,plan,is_pro,is_admin,created_at`);
  return json({ user: updated });
};
