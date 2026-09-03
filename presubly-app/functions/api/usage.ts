/// <reference types="@cloudflare/workers-types" />
/* GET /api/usage — the signed-in user's recent AI usage log. */
import { getUserId, json, sbSelect, type Env } from "./_supabase";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Oturum yok." }, 401);

  const logs = await sbSelect(
    env,
    `usage_logs?user_id=eq.${userId}&select=action,cost,created_at&order=created_at.desc&limit=50`,
  );

  return json({ logs });
};
