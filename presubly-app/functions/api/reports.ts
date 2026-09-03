/// <reference types="@cloudflare/workers-types" />
/* Saved reports — archive + progress (Academic tier: feature 'history').
 *   GET    /api/reports          -> list this user's saved reports (metadata + data)
 *   POST   /api/reports          -> save a report snapshot
 *   DELETE /api/reports?id=<id>  -> delete one
 */
import { getUserId, json, sbSelect, sbInsert, sbDelete, type Env } from "./_supabase";
import { getProfile, canUse } from "./_db";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Oturum yok." }, 401);
  const profile = await getProfile(env, userId);
  if (!canUse(profile, "history")) return json({ error: "Bu özellik Akademik plan gerektirir.", code: "UPGRADE" }, 402);

  const reports = await sbSelect(
    env,
    `saved_reports?user_id=eq.${userId}&select=id,title,tool,score,grade,data,created_at&order=created_at.desc&limit=200`,
  );
  return json({ reports });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Oturum yok." }, 401);
  const profile = await getProfile(env, userId);
  if (!canUse(profile, "history")) return json({ error: "Bu özellik Akademik plan gerektirir.", code: "UPGRADE" }, 402);

  let b: { title?: string; tool?: string; score?: number; grade?: string; data?: unknown };
  try { b = await request.json(); } catch { return json({ error: "Geçersiz gövde." }, 400); }
  if (!b.data) return json({ error: "Rapor verisi gerekli." }, 400);

  const id = crypto.randomUUID();
  const dataStr = typeof b.data === "string" ? b.data : JSON.stringify(b.data);
  if (dataStr.length > 60000) return json({ error: "Rapor çok büyük." }, 413);

  const ok = await sbInsert(env, "saved_reports", {
    id,
    user_id: userId,
    title: (b.title || "Adsız makale").slice(0, 200),
    tool: (b.tool || "readiness").slice(0, 40),
    score: typeof b.score === "number" ? Math.trunc(b.score) : null,
    grade: (b.grade || "").slice(0, 8) || null,
    data: dataStr,
  });
  if (!ok) return json({ error: "Kaydedilemedi." }, 500);
  return json({ id });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Oturum yok." }, 401);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ error: "id gerekli." }, 400);
  await sbDelete(env, `saved_reports?id=eq.${encodeURIComponent(id)}&user_id=eq.${userId}`);
  return json({ ok: true });
};
