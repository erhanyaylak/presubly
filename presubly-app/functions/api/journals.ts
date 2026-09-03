/// <reference types="@cloudflare/workers-types" />
/* Journal profile library (Academic tier).
 *   GET  /api/journals   -> built-in profiles + this user's custom ones
 *   POST /api/journals   -> add a custom journal profile (gated: 'journals')
 */
import { getUserId, json, sbSelect, sbInsert, type Env } from "./_supabase";
import { getProfile, canUse } from "./_db";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Oturum yok." }, 401);
  // built-in (user_id IS NULL) + this user's custom profiles; public first, then by name
  const journals = await sbSelect(
    env,
    `journals?or=(user_id.is.null,user_id.eq.${userId})&select=id,user_id,name,discipline,ref_style,word_limit,similarity_max,study_standard,notes&order=user_id.nullsfirst,name.asc`,
  );
  return json({ journals });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Oturum yok." }, 401);
  const profile = await getProfile(env, userId);
  if (!canUse(profile, "journals")) return json({ error: "Bu özellik Akademik plan gerektirir.", code: "UPGRADE" }, 402);

  let b: { name?: string; discipline?: string; ref_style?: string; word_limit?: number; similarity_max?: number; study_standard?: string; notes?: string };
  try { b = await request.json(); } catch { return json({ error: "Geçersiz gövde." }, 400); }
  if (!b.name || typeof b.name !== "string") return json({ error: "Dergi adı gerekli." }, 400);

  const id = crypto.randomUUID();
  const ok = await sbInsert(env, "journals", {
    id,
    user_id: userId,
    name: b.name.slice(0, 160),
    discipline: (b.discipline || "").slice(0, 80) || null,
    ref_style: (b.ref_style || "").slice(0, 40) || null,
    word_limit: b.word_limit ? Math.trunc(b.word_limit) : null,
    similarity_max: b.similarity_max ? Math.trunc(b.similarity_max) : null,
    study_standard: (b.study_standard || "").slice(0, 40) || null,
    notes: (b.notes || "").slice(0, 1200) || null,
  });
  if (!ok) return json({ error: "Kaydedilemedi." }, 500);
  return json({ id });
};
