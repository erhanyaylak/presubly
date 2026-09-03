/// <reference types="@cloudflare/workers-types" />
/* İletişim formu — Cloudflare Turnstile ile doğrular, mesajı Supabase'e (contact_messages) kaydeder.
 *
 * Gerekli env:
 *   TURNSTILE_SECRET            (opsiyonel) — ayarlıysa token sunucuda doğrulanır; yoksa doğrulama atlanır.
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — mesajı kaydetmek için (proxy zaten kullanıyor).
 *
 * Tablo: supabase/contact_messages.sql çalıştırılmalı. */
import { Env, json, sbInsert } from "./_supabase";

const clean = (s: unknown, max: number) => String(s ?? "").trim().slice(0, max);

async function verifyTurnstile(env: Env, token: string, ip: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return true; // yapılandırılmamış → koruma pasif, geç
  if (!token || token === "unavailable") return false;
  try {
    const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return !!data.success;
  } catch {
    return false;
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const name = clean(payload.name, 120);
  const email = clean(payload.email, 160);
  const subject = clean(payload.subject, 120);
  const phone = clean(payload.phone, 40);
  const message = clean(payload.message, 4000);
  const token = String(payload.token ?? "");

  if (!name || !email || !message) return json({ error: "missing_fields" }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "bad_email" }, 400);

  const ip = request.headers.get("CF-Connecting-IP") || "";
  const ok = await verifyTurnstile(env, token, ip);
  if (!ok) return json({ error: "captcha_failed" }, 400);

  const stored = await sbInsert(env, "contact_messages", {
    name,
    email,
    subject: subject || null,
    phone: phone || null,
    message,
    ip: ip || null,
    user_agent: clean(request.headers.get("User-Agent"), 300) || null,
  });
  if (!stored) return json({ error: "store_failed" }, 500);

  return json({ ok: true });
};
