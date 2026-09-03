/// <reference types="@cloudflare/workers-types" />
/* Public API — POST /api/v1/scan  (Enterprise tier; OJS/DergiPark integration).
 * Auth: API key via `x-api-key: psb_live_...` or `Authorization: Bearer psb_live_...`.
 * Body: { text: string, journalRules?: string }
 * Returns the readiness report JSON. Deducts 3 credits from the key owner
 * (admins are never charged). The key's raw value is never stored — we match
 * its SHA-256. */
import { json, sbSelectOne, sbUpdate, type Env } from "../_supabase";
import { getProfile, ensureProfile, deductCredits, addCredits, logUsage, canUse, sha256Hex } from "../_db";

const READINESS_SYSTEM =
  "Sen gönderim öncesi uyumluluk denetimi yapan bir akademik editör motorusun. " +
  "Verilen makaleyi tara ve SADECE şu şemaya uygun GEÇERLİ JSON döndür (markdown/açıklama YOK): " +
  '{"score":<0-100>,"grade":"<A|B+|B|C|D>","decision":"<Gönderime hazır|Küçük düzeltmelerle hazır|Önemli eksikler var>",' +
  '"summary":"<tek cümle>","categories":[{"name":"Yapı ve biçim","score":<0-100>,"checks":[{"label":"..","status":"pass|warn|fail","value":"..","note":".."}]},' +
  '{"name":"Kaynakça ve atıf","score":0,"checks":[]},{"name":"Etik ve uyumluluk","score":0,"checks":[]},{"name":"Dil ve sunum","score":0,"checks":[]}],"priority":[".."]}. ' +
  "Metinde olmayanı uydurma; bilgi yoksa status='warn'. Yalnızca JSON yaz.";

const COST = 3;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.ANTHROPIC_API_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Server misconfigured." }, 500);

  const authz = request.headers.get("Authorization") || "";
  const raw = request.headers.get("x-api-key") || (authz.startsWith("Bearer ") ? authz.slice(7) : "");
  if (!raw || !raw.startsWith("psb_")) return json({ error: "API anahtarı gerekli." }, 401);

  const hash = await sha256Hex(raw.trim());
  const key = await sbSelectOne<{ id: string; user_id: string }>(
    env,
    `api_keys?key_hash=eq.${hash}&revoked=eq.false&select=id,user_id`,
  );
  if (!key) return json({ error: "Geçersiz veya iptal edilmiş anahtar." }, 401);

  const profile = await getProfile(env, key.user_id);
  if (!canUse(profile, "api")) return json({ error: "Anahtar sahibinin planı API erişimini kapsamıyor." }, 403);

  let body: { text?: string; journalRules?: string };
  try { body = await request.json(); } catch { return json({ error: "Geçersiz gövde." }, 400); }
  const text = (body.text || "").trim();
  if (text.length < 40) return json({ error: "Metin çok kısa." }, 400);

  await ensureProfile(env, key.user_id, null);
  const isAdmin = !!profile?.is_admin;
  if (!isAdmin) {
    const remaining = await deductCredits(env, key.user_id, COST);
    if (remaining === null) return json({ error: "Yetersiz kredi.", code: "INSUFFICIENT_CREDITS" }, 402);
  }
  await sbUpdate(env, `api_keys?id=eq.${encodeURIComponent(key.id)}`, { last_used: new Date().toISOString() });

  const userContent = (body.journalRules ? `[Hedef dergi kuralları: ${String(body.journalRules).slice(0, 1200)}]\n\n` : "") + text.slice(0, 40000);

  let aiRes: Response;
  try {
    aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: env.AI_MODEL || "claude-sonnet-5",
        max_tokens: 3000,
        thinking: { type: "disabled" },   // all tokens to the answer (avoid empty/truncated)
        system: READINESS_SYSTEM,
        messages: [{ role: "user", content: userContent }],
      }),
    });
  } catch {
    if (!isAdmin) await addCredits(env, key.user_id, COST);
    return json({ error: "AI servisine ulaşılamadı." }, 502);
  }
  if (!aiRes.ok) {
    if (!isAdmin) await addCredits(env, key.user_id, COST);
    return json({ error: `AI hatası (${aiRes.status}).` }, 502);
  }

  const data = (await aiRes.json()) as { content?: Array<{ type?: string; text?: string }> };
  // reasoning models return a thinking block first — select the text block by type.
  const outText = (Array.isArray(data?.content)
    ? data.content.filter((c) => c?.type === "text").map((c) => c.text || "").join("")
    : "") || "";
  let report: unknown = null;
  try {
    const m = outText.match(/\{[\s\S]*\}/);
    report = m ? JSON.parse(m[0]) : null;
  } catch { report = null; }

  try { await logUsage(env, key.user_id, "api_scan", isAdmin ? 0 : COST); } catch { /* ignore */ }

  if (!report) return json({ error: "Rapor ayrıştırılamadı.", raw: outText.slice(0, 500) }, 502);
  return json({ report });
};
