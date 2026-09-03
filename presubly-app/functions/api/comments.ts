/// <reference types="@cloudflare/workers-types" />
/* Comment system on saved reports (Pro tier: feature 'team').
 * A user may read/write comments on a report if they OWN it or are a TEAMMATE
 * of the owner (share any team). Near-real-time via client polling.
 *   GET    /api/comments?report=<id>   -> list
 *   POST   /api/comments {report_id,body}
 *   DELETE /api/comments?id=<id>       -> own comment (or report owner)
 */
import { getUserId, json, sbSelect, sbSelectOne, sbInsert, sbDelete, sbRpc, type Env } from "./_supabase";
import { getProfile, canUse } from "./_db";

async function reportOwner(env: Env, reportId: string): Promise<string | null> {
  const r = await sbSelectOne<{ user_id: string }>(env, `saved_reports?id=eq.${encodeURIComponent(reportId)}&select=user_id`);
  return r?.user_id ?? null;
}
async function canAccess(env: Env, ownerId: string, userId: string): Promise<boolean> {
  if (ownerId === userId) return true;
  const t = await sbRpc<boolean>(env, "presubly_teammates", { p_a: ownerId, p_b: userId });
  return !!t;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Oturum yok." }, 401);
  const profile = await getProfile(env, userId);
  if (!canUse(profile, "team")) return json({ error: "Yorum sistemi Pro plan gerektirir.", code: "UPGRADE" }, 402);

  const reportId = new URL(request.url).searchParams.get("report");
  if (!reportId) return json({ error: "report gerekli." }, 400);
  const owner = await reportOwner(env, reportId);
  if (!owner) return json({ error: "Rapor bulunamadı." }, 404);
  if (!(await canAccess(env, owner, userId))) return json({ error: "Erişim yok." }, 403);

  const comments = await sbSelect(env, `report_comments?report_id=eq.${encodeURIComponent(reportId)}&select=id,user_id,author,body,created_at&order=created_at.asc`);
  return json({ comments, me: userId, isOwner: owner === userId });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Oturum yok." }, 401);
  const profile = await getProfile(env, userId);
  if (!canUse(profile, "team")) return json({ error: "Yorum sistemi Pro plan gerektirir.", code: "UPGRADE" }, 402);

  let b: { report_id?: string; body?: string };
  try { b = await request.json(); } catch { return json({ error: "Geçersiz gövde." }, 400); }
  const body = (b.body || "").trim().slice(0, 2000);
  if (!b.report_id || !body) return json({ error: "Rapor ve yorum gerekli." }, 400);
  const owner = await reportOwner(env, b.report_id);
  if (!owner) return json({ error: "Rapor bulunamadı." }, 404);
  if (!(await canAccess(env, owner, userId))) return json({ error: "Erişim yok." }, 403);

  const id = crypto.randomUUID();
  const ok = await sbInsert(env, "report_comments", { id, report_id: b.report_id, user_id: userId, author: (profile?.email || "").toLowerCase(), body });
  if (!ok) return json({ error: "Yorum eklenemedi." }, 500);
  return json({ id });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Oturum yok." }, 401);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ error: "id gerekli." }, 400);
  const c = await sbSelectOne<{ user_id: string; report_id: string }>(env, `report_comments?id=eq.${encodeURIComponent(id)}&select=user_id,report_id`);
  if (!c) return json({ ok: true });
  const owner = await reportOwner(env, c.report_id);
  if (c.user_id !== userId && owner !== userId) return json({ error: "Yetkiniz yok." }, 403);
  await sbDelete(env, `report_comments?id=eq.${encodeURIComponent(id)}`);
  return json({ ok: true });
};
