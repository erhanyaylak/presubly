/// <reference types="@cloudflare/workers-types" />
/* Shareable public report links (Enterprise tier: feature 'share').
 *   POST /api/share            -> create a public link (gated), returns { id }
 *   GET  /api/share?id=<id>    -> public read (NO auth), increments views
 */
import { getUserId, json, sbInsert, sbSelectOne, sbRpc, type Env } from "./_supabase";
import { getProfile, canUse } from "./_db";

const TTL_DAYS = 7;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Oturum yok." }, 401);
  const profile = await getProfile(env, userId);
  if (!canUse(profile, "share")) return json({ error: "Paylaşım linki Kurumsal plan gerektirir.", code: "UPGRADE" }, 402);

  let b: { title?: string; data?: unknown };
  try { b = await request.json(); } catch { return json({ error: "Geçersiz gövde." }, 400); }
  if (!b.data) return json({ error: "Rapor verisi gerekli." }, 400);

  const id = crypto.randomUUID();
  const dataStr = typeof b.data === "string" ? b.data : JSON.stringify(b.data);
  if (dataStr.length > 60000) return json({ error: "Rapor çok büyük." }, 413);
  const expires = new Date(Date.now() + TTL_DAYS * 86400000).toISOString();

  const ok = await sbInsert(env, "shared_reports", {
    id,
    user_id: userId,
    title: (b.title || "Uyumluluk Raporu").slice(0, 200),
    data: dataStr,
    expires_at: expires,
  });
  if (!ok) return json({ error: "Link oluşturulamadı." }, 500);
  return json({ id, expires_at: expires });
};

/* Public read — no auth. Used by the #share-<id> route. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ error: "id gerekli." }, 400);
  const row = await sbSelectOne<{ title: string; data: string; views: number; expires_at: string | null }>(
    env,
    `shared_reports?id=eq.${encodeURIComponent(id)}&select=title,data,views,expires_at`,
  );
  if (!row) return json({ error: "Rapor bulunamadı." }, 404);
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return json({ error: "Bu paylaşım linkinin süresi doldu." }, 410);
  }
  await sbRpc(env, "bump_share_views", { p_id: id });
  let data: unknown;
  try { data = JSON.parse(row.data); } catch { data = null; }
  return json({ title: row.title, data, views: row.views + 1 });
};
