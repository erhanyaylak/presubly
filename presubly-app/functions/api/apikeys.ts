/// <reference types="@cloudflare/workers-types" />
/* API key management (Enterprise tier: feature 'api').
 *   GET  /api/apikeys              -> list this user's keys (metadata only)
 *   POST /api/apikeys              -> { label } create; returns the FULL key ONCE
 *   POST /api/apikeys {revoke:id}  -> revoke a key
 * The raw key is only ever returned at creation time; we store its SHA-256.
 */
import { getUserId, json, sbSelect, sbInsert, sbUpdate, type Env } from "./_supabase";
import { getProfile, canUse, sha256Hex } from "./_db";

async function requireApiTier(request: Request, env: Env): Promise<string | Response> {
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Oturum yok." }, 401);
  const profile = await getProfile(env, userId);
  if (!canUse(profile, "api")) return json({ error: "API erişimi Kurumsal plan gerektirir.", code: "UPGRADE" }, 402);
  return userId;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const gate = await requireApiTier(request, env);
  if (gate instanceof Response) return gate;
  const keys = await sbSelect(
    env,
    `api_keys?user_id=eq.${gate}&select=id,prefix,label,revoked,last_used,created_at&order=created_at.desc`,
  );
  return json({ keys });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const gate = await requireApiTier(request, env);
  if (gate instanceof Response) return gate;
  const userId = gate;

  let b: { label?: string; revoke?: string };
  try { b = await request.json(); } catch { b = {}; }

  if (b.revoke) {
    await sbUpdate(env, `api_keys?id=eq.${encodeURIComponent(b.revoke)}&user_id=eq.${userId}`, { revoked: true });
    return json({ ok: true });
  }

  // create
  const raw = "psb_live_" + crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const prefix = raw.slice(0, 16) + "…";
  const key_hash = await sha256Hex(raw);
  const id = crypto.randomUUID();
  const ok = await sbInsert(env, "api_keys", {
    id,
    user_id: userId,
    prefix,
    key_hash,
    label: (b.label || "Varsayılan anahtar").slice(0, 80),
  });
  if (!ok) return json({ error: "Anahtar oluşturulamadı." }, 500);
  return json({ id, key: raw, prefix }); // key shown once
};
