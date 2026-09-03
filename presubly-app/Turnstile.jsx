import React, { useEffect, useRef } from "react";

/* Cloudflare Turnstile — bot koruması. Site key public'tir (.env).
   Token, Supabase Auth çağrılarına captchaToken olarak geçirilir; Supabase
   token'ı Turnstile SECRET ile sunucu tarafında doğrular (Auth → Attack
   Protection → CAPTCHA). Site key yoksa widget render edilmez (koruma pasif). */
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export const TURNSTILE_ENABLED = !!SITE_KEY;

let loadingPromise = null;
function loadScript() {
  if (window.turnstile) return Promise.resolve();
  if (loadingPromise) return loadingPromise;
  loadingPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile_load_failed"));
    document.head.appendChild(s);
  });
  return loadingPromise;
}

/* onVerify(token|null); resetKey değişince widget sıfırlanır (token tek kullanımlık). */
export default function Turnstile({ onVerify, resetKey }) {
  const ref = useRef(null);
  const widgetId = useRef(null);
  const cb = useRef(onVerify);
  cb.current = onVerify;

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile || widgetId.current) return;
        const theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          theme,
          language: "tr",
          callback: (t) => cb.current(t),
          "error-callback": () => cb.current(null),
          "expired-callback": () => cb.current(null),
        });
      })
      .catch(() => cb.current("unavailable"));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (resetKey === undefined) return;
    if (widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
      cb.current(null);
    }
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={ref} style={{ marginTop: 4 }} />;
}
