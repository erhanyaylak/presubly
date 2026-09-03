/// <reference types="@cloudflare/workers-types" />
/* Presubly AI proxy — Cloudflare Pages Function.
 *
 * Flow: verify the caller's Supabase access token -> resolve the tool cost
 * server-side -> atomically deduct credits (Supabase) -> call Anthropic with the
 * server-side key -> log usage -> return the message. The Anthropic key NEVER
 * reaches the browser.
 *
 * Env (Pages -> Settings -> Variables, or .dev.vars locally):
 *   SUPABASE_URL                https://<ref>.supabase.co
 *   SUPABASE_ANON_KEY           anon public key (token validation)
 *   SUPABASE_SERVICE_ROLE_KEY   service_role key (billing; bypasses RLS)
 *   ANTHROPIC_API_KEY           sk-ant-...    (encrypted)
 *   AI_MODEL   (optional) default "claude-sonnet-5"
 */
import { getUserId, json, type Env } from "./_supabase";
import { ensureProfile, getProfile, deductCredits, addCredits, logUsage, canUse } from "./_db";

const MAX_SYSTEM = 6000;
// Manuscript body cap. ~200k chars ≈ ~50k tokens — comfortably inside the
// Sonnet 200k-token context and covers virtually every journal article and
// most thesis chapters. (Old 40k ≈ 6k words was far too small for real papers.)
const MAX_MESSAGE = 200000;

/* Authoritative per-tool cost. The client sends `action`; the cost is looked up
   HERE so it can't be spoofed. Keys must match presubly-config.js `action`. */
const TOOL_COSTS: Record<string, number> = {
  sim: 3,
  readiness: 3,
  peer_review: 3,
  editorial: 2,
  response: 2,
  stats: 2,
  checklist: 1,
  citecheck: 2,   // Pro
  coverletter: 2, // Pro
  revision: 2,
};

/* Actions that require a paid tier — enforced server-side. */
const TOOL_FEATURE: Record<string, string> = {
  citecheck: "citecheck",
  coverletter: "coverletter",
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.ANTHROPIC_API_KEY || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Sunucu yapılandırması eksik (env)." }, 500);
  }

  // 1. auth
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Oturum yok. Lütfen giriş yapın." }, 401);

  // 2. payload
  let payload: { action?: string; system?: string; messages?: Array<{ role: string; content: string }>; max_tokens?: number; stream?: boolean };
  try { payload = await request.json(); } catch { return json({ error: "Geçersiz istek gövdesi." }, 400); }

  const action = typeof payload.action === "string" ? payload.action : "";
  const cost = TOOL_COSTS[action];
  if (cost === undefined) return json({ error: "Geçersiz araç." }, 400);

  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const userMsg = messages.find((m) => m.role === "user")?.content ?? "";
  if (!userMsg || typeof userMsg !== "string") return json({ error: "Boş istek." }, 400);
  if (userMsg.length > MAX_MESSAGE) return json({ error: `Metin çok uzun (~${Math.round(MAX_MESSAGE / 1000)}k karakter sınırı). Çok uzun bir tez ise bölüm bölüm gönderin.` }, 413);

  const model = env.AI_MODEL || "claude-sonnet-5";

  // 3. atomic credit deduction BEFORE calling the model.
  //    Super admins have unlimited credits — never charged, never blocked.
  await ensureProfile(env, userId, null);
  const profile = await getProfile(env, userId);
  const isAdmin = !!profile?.is_admin;

  // tier gate for Pro-only tools
  const feature = TOOL_FEATURE[action];
  if (feature && !canUse(profile, feature)) {
    return json({ error: "Bu araç Pro plan gerektirir.", code: "UPGRADE" }, 402);
  }

  let remaining: number;
  if (isAdmin) {
    remaining = profile?.credits ?? 0;
  } else {
    const deducted = await deductCredits(env, userId, cost);
    if (deducted === null) {
      return json({ error: "Yetersiz kredi.", code: "INSUFFICIENT_CREDITS" }, 402);
    }
    remaining = deducted;
  }
  const charged = isAdmin ? 0 : cost;

  const sys = typeof payload.system === "string" ? payload.system.slice(0, MAX_SYSTEM) : undefined;
  const userContent = userMsg.slice(0, MAX_MESSAGE);
  const maxTok = Math.min(payload.max_tokens || 2000, 12000);
  const ANTHROPIC_HEADERS = { "Content-Type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" };
  const aiBody = (stream: boolean) => JSON.stringify({
    model, max_tokens: maxTok, thinking: { type: "disabled" }, stream,
    system: sys, messages: [{ role: "user", content: userContent }],
  });
  const failure = (status: number, detail: string) => {
    if (status === 400 && /credit balance is too low/i.test(detail)) return json({ error: "AI motoru geçici olarak kullanılamıyor (servis bakiyesi). Lütfen birazdan tekrar deneyin.", code: "AI_CREDITS", detail }, 503);
    if (status === 429) return json({ error: "AI motoru şu anda yoğun. Lütfen birkaç saniye sonra tekrar deneyin.", code: "AI_BUSY", detail }, 503);
    if (status === 0) return json({ error: "AI servisine ulaşılamadı.", detail }, 502);
    return json({ error: `AI hatası (${status}).`, detail }, 502);
  };

  /* 4a. STREAMING path — long manuscripts can exceed Cloudflare's ~100s origin
     limit (HTTP 524). Streaming starts bytes immediately so the connection stays
     alive; the client accumulates the text deltas and parses the full result. */
  if (payload.stream === true) {
    let res: Response;
    try {
      res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: ANTHROPIC_HEADERS, body: aiBody(true) });
    } catch {
      if (charged) await addCredits(env, userId, charged);
      return failure(0, "network");
    }
    if (!res.ok || !res.body) {
      if (charged) await addCredits(env, userId, charged);
      return failure(res.status, (await res.text().catch(() => "")).slice(0, 200));
    }
    try { await logUsage(env, userId, action, charged); } catch { /* ignore */ }
    return new Response(res.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Credits-Remaining": String(remaining),
        "X-Model": model,
      },
    });
  }

  // 4. call the AI. Primary = Anthropic (highest quality). If Anthropic is
  //    unavailable (no prepaid balance / rate-limited / down) AND a Cloudflare
  //    Workers AI binding exists, transparently fall back to it so the tools
  //    never stop working. The client shape stays identical either way.
  type Anthropic = { ok: boolean; status: number; detail: string; data?: Record<string, unknown> };
  const callAnthropic = async (): Promise<Anthropic> => {
    try {
      // thinking disabled in aiBody(): the reasoning phase eats the max_tokens
      // budget and intermittently leaves no room for the answer → empty outputs.
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: ANTHROPIC_HEADERS, body: aiBody(false) });
      if (!res.ok) return { ok: false, status: res.status, detail: (await res.text().catch(() => "")).slice(0, 200) };
      return { ok: true, status: 200, detail: "", data: (await res.json()) as Record<string, unknown> };
    } catch {
      return { ok: false, status: 0, detail: "network" };
    }
  };

  const WA_MODEL = env.WORKERS_AI_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
  const WA_MAX_INPUT = 40000; // Workers AI context is smaller than Claude's
  // returns { data } on success, or { err } describing why the fallback couldn't run
  const callWorkersAI = async (): Promise<{ data?: Record<string, unknown>; err?: string }> => {
    if (!env.AI) return { err: "no-binding" };
    try {
      const messages = [
        ...(sys ? [{ role: "system", content: sys }] : []),
        { role: "user", content: userContent.slice(0, WA_MAX_INPUT) },
      ];
      const out = await env.AI.run(WA_MODEL, { messages, max_tokens: 4096 });
      const text = (out && typeof out.response === "string") ? out.response : "";
      if (!text) return { err: "empty-response" };
      // normalise into the Anthropic response shape the client already parses
      return { data: { content: [{ type: "text", text }], model: WA_MODEL, stop_reason: "end_turn", engine: "workers-ai" } };
    } catch (e) {
      return { err: "run-failed: " + String((e as Error)?.message || e).slice(0, 120) };
    }
  };

  let data: Record<string, unknown> | null = null;
  let fbErr = "not-attempted";
  const a = await callAnthropic();
  if (a.ok) {
    data = a.data ?? null;
  } else {
    // Anthropic failed. Everything runs on Claude Sonnet by default; the free
    // Workers AI (Llama) fallback is used ONLY when WORKERS_AI_FALLBACK=1.
    const creditIssue = a.status === 400 && /credit balance is too low/i.test(a.detail);
    const fbEnabled = env.WORKERS_AI_FALLBACK === "1";
    const recoverable = fbEnabled && (creditIssue || a.status === 429 || a.status >= 500 || a.status === 0);
    if (recoverable) { const fb = await callWorkersAI(); if (fb.data) data = fb.data; else fbErr = fb.err || "unknown"; }
    else if (!fbEnabled) fbErr = "disabled";

    if (!data) {
      if (charged) await addCredits(env, userId, charged); // refund — nothing usable produced
      const dbg = `anthropic=${a.status} fallback=${fbErr}`;
      if (creditIssue) return json({ error: "AI motoru geçici olarak kullanılamıyor (servis bakiyesi). Lütfen birazdan tekrar deneyin.", code: "AI_CREDITS", detail: dbg }, 503);
      if (a.status === 429) return json({ error: "AI motoru şu anda yoğun. Lütfen birkaç saniye sonra tekrar deneyin.", code: "AI_BUSY", detail: dbg }, 503);
      if (a.status === 0) return json({ error: "AI servisine ulaşılamadı.", detail: dbg }, 502);
      return json({ error: `AI hatası (${a.status}).`, detail: `${a.detail} | ${dbg}` }, 502);
    }
  }

  // 5. best-effort usage log
  try { await logUsage(env, userId, action, charged); } catch { /* ignore */ }

  return json({ ...data, credits_remaining: remaining });
};
