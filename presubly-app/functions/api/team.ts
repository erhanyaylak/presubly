/// <reference types="@cloudflare/workers-types" />
/* Team collaboration (Pro tier: feature 'team').
 *   GET  /api/team                       -> teams I own or belong to, with members
 *   POST /api/team  { action, ... }      -> create | invite | remove | rename | leave | delete
 */
import { getUserId, json, sbSelect, sbSelectOne, sbInsert, sbUpdate, sbDelete, type Env } from "./_supabase";
import { getProfile, canUse } from "./_db";

interface Team { id: string; name: string; owner_id: string; created_at: string }

async function ownsTeam(env: Env, teamId: string, userId: string): Promise<boolean> {
  const t = await sbSelectOne<Team>(env, `teams?id=eq.${encodeURIComponent(teamId)}&owner_id=eq.${userId}&select=id`);
  return !!t;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Oturum yok." }, 401);
  const profile = await getProfile(env, userId);
  if (!canUse(profile, "team")) return json({ error: "Ekip özelliği Pro plan gerektirir.", code: "UPGRADE" }, 402);
  const email = (profile?.email || "").toLowerCase();

  const owned = await sbSelect<Team>(env, `teams?owner_id=eq.${userId}&select=id,name,owner_id,created_at`);
  const memberRows = email ? await sbSelect<{ team_id: string }>(env, `team_members?email=eq.${encodeURIComponent(email)}&select=team_id`) : [];
  const ownedIds = new Set(owned.map((t) => t.id));
  const memberTeamIds = [...new Set(memberRows.map((r) => r.team_id))].filter((id) => !ownedIds.has(id));
  const memberTeams = memberTeamIds.length
    ? await sbSelect<Team>(env, `teams?id=in.(${memberTeamIds.map(encodeURIComponent).join(",")})&select=id,name,owner_id,created_at`)
    : [];

  const teams = [];
  for (const t of [...owned, ...memberTeams]) {
    const members = await sbSelect(env, `team_members?team_id=eq.${encodeURIComponent(t.id)}&select=id,email,role&order=role.desc,email.asc`);
    teams.push({ ...t, role: t.owner_id === userId ? "owner" : "member", members });
  }
  return json({ teams, email });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Oturum yok." }, 401);
  const profile = await getProfile(env, userId);
  if (!canUse(profile, "team")) return json({ error: "Ekip özelliği Pro plan gerektirir.", code: "UPGRADE" }, 402);

  let b: { action?: string; team_id?: string; name?: string; email?: string; member_id?: string };
  try { b = await request.json(); } catch { return json({ error: "Geçersiz gövde." }, 400); }
  const action = b.action;

  if (action === "create") {
    const name = (b.name || "").trim().slice(0, 80);
    if (!name) return json({ error: "Ekip adı gerekli." }, 400);
    const id = crypto.randomUUID();
    const ok = await sbInsert(env, "teams", { id, name, owner_id: userId });
    if (!ok) return json({ error: "Ekip oluşturulamadı." }, 500);
    await sbInsert(env, "team_members", { id: crypto.randomUUID(), team_id: id, email: (profile?.email || "").toLowerCase(), role: "owner" });
    return json({ id });
  }

  if (action === "invite") {
    if (!b.team_id || !(await ownsTeam(env, b.team_id, userId))) return json({ error: "Yetkiniz yok." }, 403);
    const email = (b.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Geçerli bir e-posta girin." }, 400);
    const exists = await sbSelectOne(env, `team_members?team_id=eq.${encodeURIComponent(b.team_id)}&email=eq.${encodeURIComponent(email)}&select=id`);
    if (exists) return json({ error: "Bu e-posta zaten ekipte." }, 409);
    const ok = await sbInsert(env, "team_members", { id: crypto.randomUUID(), team_id: b.team_id, email, role: "member" });
    if (!ok) return json({ error: "Eklenemedi." }, 500);
    return json({ ok: true });
  }

  if (action === "remove") {
    if (!b.team_id || !b.member_id || !(await ownsTeam(env, b.team_id, userId))) return json({ error: "Yetkiniz yok." }, 403);
    await sbDelete(env, `team_members?id=eq.${encodeURIComponent(b.member_id)}&team_id=eq.${encodeURIComponent(b.team_id)}&role=eq.member`);
    return json({ ok: true });
  }

  if (action === "rename") {
    if (!b.team_id || !(await ownsTeam(env, b.team_id, userId))) return json({ error: "Yetkiniz yok." }, 403);
    await sbUpdate(env, `teams?id=eq.${encodeURIComponent(b.team_id)}`, { name: (b.name || "").trim().slice(0, 80) });
    return json({ ok: true });
  }

  if (action === "leave") {
    if (!b.team_id) return json({ error: "team_id gerekli." }, 400);
    await sbDelete(env, `team_members?team_id=eq.${encodeURIComponent(b.team_id)}&email=eq.${encodeURIComponent((profile?.email || "").toLowerCase())}&role=eq.member`);
    return json({ ok: true });
  }

  if (action === "delete") {
    if (!b.team_id || !(await ownsTeam(env, b.team_id, userId))) return json({ error: "Yetkiniz yok." }, 403);
    await sbDelete(env, `teams?id=eq.${encodeURIComponent(b.team_id)}`);
    return json({ ok: true });
  }

  return json({ error: "Bilinmeyen işlem." }, 400);
};
