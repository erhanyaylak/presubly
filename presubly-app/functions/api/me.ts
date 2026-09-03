/// <reference types="@cloudflare/workers-types" />
/* POST /api/me — returns the signed-in user's profile (credits/plan/usage),
   creating it (with free starter credits) on first sight. Also backfills the
   email from Supabase (sent by the client) so the admin panel can show who's who. */
import { getUserId, json, sbUpdate, sbCount, type Env } from "./_supabase";
import { ensureProfile, getProfile } from "./_db";

const handler: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Oturum yok." }, 401);

  let email: string | null = null;
  try {
    const body = (await request.json()) as { email?: string };
    if (body?.email && typeof body.email === "string") email = body.email.slice(0, 200);
  } catch { /* GET or empty body */ }

  await ensureProfile(env, userId, email);
  if (email) {
    await sbUpdate(env, `profiles?id=eq.${userId}`, { email });
  }

  const profile = await getProfile(env, userId);
  if (!profile) return json({ error: "Profil bulunamadı." }, 500);

  const uses = await sbCount(env, `usage_logs?user_id=eq.${userId}&select=id`);

  return json({
    credits: profile.credits,
    plan: profile.is_admin ? "enterprise" : (profile.plan || "free"),
    is_pro: !!profile.is_pro || (!!profile.plan && profile.plan !== "free"),
    is_admin: !!profile.is_admin,
    email: profile.email,
    uses,
  });
};

export const onRequestGet = handler;
export const onRequestPost = handler;
