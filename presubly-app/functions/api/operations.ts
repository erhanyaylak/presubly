/// <reference types="@cloudflare/workers-types" />
/* PSB-IMP-013 — Submission Operations Center.
 * Analysis reports are immutable evidence snapshots; this endpoint stores only
 * mutable workflow metadata for a manuscript. One operation row per title/user.
 */
import { getUserId, json, sbSelect, sbSelectOne, sbInsert, sbUpdate, type Env } from "./_supabase";
import { getProfile, canUse } from "./_db";

type OperationInput = {
  id?: string | null;
  manuscript_title?: string;
  target_journal?: string;
  status?: string;
  deadline?: string | null;
  next_action?: string;
  notes?: string;
};

const STATUSES = new Set(["preparing", "ready", "submitted", "revision", "accepted", "closed"]);
const clean = (value: unknown, max: number) => String(value || "").trim().slice(0, max);

async function authorized(request: Request, env: Env) {
  const userId = await getUserId(request, env);
  if (!userId) return { error: json({ error: "Oturum yok." }, 401), userId: null };
  const profile = await getProfile(env, userId);
  if (!canUse(profile, "history")) return { error: json({ error: "Bu özellik Akademik plan gerektirir.", code: "UPGRADE" }, 402), userId: null };
  return { error: null, userId };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await authorized(request, env);
  if (auth.error || !auth.userId) return auth.error as Response;
  const operations = await sbSelect(
    env,
    `manuscript_operations?user_id=eq.${auth.userId}&select=id,manuscript_title,target_journal,status,deadline,next_action,notes,created_at,updated_at&order=updated_at.desc&limit=200`,
  );
  return json({ operations });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await authorized(request, env);
  if (auth.error || !auth.userId) return auth.error as Response;

  let body: OperationInput;
  try { body = await request.json(); } catch { return json({ error: "Geçersiz gövde." }, 400); }
  const title = clean(body.manuscript_title, 200);
  if (!title) return json({ error: "Makale başlığı gerekli." }, 400);
  const status = clean(body.status, 24) || "preparing";
  if (!STATUSES.has(status)) return json({ error: "Geçersiz durum." }, 400);
  const deadline = body.deadline ? clean(body.deadline, 10) : null;
  if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return json({ error: "Geçersiz tarih." }, 400);

  const encodedTitle = encodeURIComponent(title);
  const existing = await sbSelectOne<{ id: string }>(env, `manuscript_operations?user_id=eq.${auth.userId}&manuscript_title=eq.${encodedTitle}&select=id&limit=1`);
  const record = {
    manuscript_title: title,
    target_journal: clean(body.target_journal, 200) || null,
    status,
    deadline,
    next_action: clean(body.next_action, 300) || null,
    notes: clean(body.notes, 2000) || null,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const ok = await sbUpdate(env, `manuscript_operations?id=eq.${existing.id}&user_id=eq.${auth.userId}`, record);
    if (!ok) return json({ error: "Gönderim planı güncellenemedi." }, 500);
    return json({ id: existing.id, updated: true });
  }

  const id = crypto.randomUUID();
  const ok = await sbInsert(env, "manuscript_operations", { id, user_id: auth.userId, ...record });
  if (!ok) return json({ error: "Gönderim planı kaydedilemedi." }, 500);
  return json({ id, created: true }, 201);
};
