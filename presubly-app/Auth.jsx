import React, { useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import { Logo, Wordmark, FONTS } from "./Brand.jsx";
import Turnstile, { TURNSTILE_ENABLED } from "./Turnstile.jsx";
import { useLang } from "./lang.jsx";

/* Dedicated auth screen (shaped after desk-ly.com): left branded panel +
   right embedded Supabase email/password form with signin/signup tabs.
   Green & Gold brand. */

const T = {
  teal: "#0A3D3D", tealMid: "#0D4F4F", tealLight: "#156B6B",
  amber: "#E8970A", amber3: "#FBCA5C", sage: "#F2F7F5", line: "#C8DAD2",
  ink: "#0A1A14", mut: "#3A5248", success: "#0A7A3A", warn: "#8A5A00", error: "#8A1A1A",
};

const inputStyle = {
  width: "100%", padding: "11px 13px", borderRadius: 9, border: `1px solid ${T.line}`,
  fontFamily: FONTS.u, fontSize: 14, color: T.ink, background: "#fff", outline: "none", boxSizing: "border-box",
};
const labelStyle = { display: "block", fontFamily: FONTS.m, fontSize: 10.5, letterSpacing: ".08em", color: T.mut, marginBottom: 6, textTransform: "uppercase" };

function EmailForm({ mode }) {
  const { t, lang } = useLang();
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [token, setToken] = useState(null);
  const [resetKey, setResetKey] = useState(0);

  const captcha = () => (token && token !== "unavailable" ? token : undefined);
  const resetCaptcha = () => { setToken(null); setResetKey((k) => k + 1); };

  async function submit(e) {
    e.preventDefault();
    setErr(""); setNotice("");
    if (!email || !pw) { setErr(t("E-posta ve şifre gerekli.", "Email and password are required.")); return; }
    if (isSignup && pw.length < 6) { setErr(t("Şifre en az 6 karakter olmalı.", "Password must be at least 6 characters.")); return; }
    if (TURNSTILE_ENABLED && !token) { setErr(t("Lütfen güvenlik doğrulamasını tamamlayın.", "Please complete the security check.")); return; }
    setBusy(true);
    const captchaToken = captcha();
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email, password: pw,
          options: { data: { full_name: name || "" }, emailRedirectTo: window.location.origin, captchaToken },
        });
        if (error) throw error;
        // If email confirmation is required, there's a user but no session yet.
        if (data.user && !data.session) {
          setNotice(t("Hesabınız oluşturuldu. E-postanıza gönderilen doğrulama bağlantısına tıklayın.", "Your account was created. Click the verification link sent to your email."));
        }
        // else: onAuthStateChange in AuthGate takes over.
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw, options: { captchaToken } });
        if (error) throw error;
      }
    } catch (e2) {
      setErr(translateError(e2?.message || "", lang));
      resetCaptcha(); // Turnstile token tek kullanımlık — başarısızlıkta yenile
    }
    setBusy(false);
  }

  async function forgot() {
    setErr(""); setNotice("");
    if (!email) { setErr(t("Önce e-posta adresinizi girin.", "Enter your email address first.")); return; }
    if (TURNSTILE_ENABLED && !token) { setErr(t("Lütfen güvenlik doğrulamasını tamamlayın.", "Please complete the security check.")); return; }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin, captchaToken: captcha() });
      if (error) throw error;
      setNotice(t("Şifre sıfırlama bağlantısı e-postanıza gönderildi.", "A password reset link has been sent to your email."));
    } catch (e2) {
      setErr(translateError(e2?.message || "", lang));
      resetCaptcha();
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {isSignup && (
        <div>
          <label style={labelStyle}>{t("Ad Soyad (opsiyonel)", "Full name (optional)")}</label>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Adınız Soyadınız", "Your full name")} autoComplete="name" />
        </div>
      )}
      <div>
        <label style={labelStyle}>{t("E-posta", "Email")}</label>
        <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email" required />
      </div>
      <div>
        <label style={labelStyle}>{t("Şifre", "Password")}</label>
        <input style={inputStyle} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={isSignup ? t("En az 6 karakter", "At least 6 characters") : t("Şifreniz", "Your password")} autoComplete={isSignup ? "new-password" : "current-password"} required />
      </div>

      {err && <div style={{ fontSize: 12.5, color: T.error, background: "#FBEBEB", border: `1px solid #F0CFCF`, borderRadius: 8, padding: "8px 11px" }}>{err}</div>}
      {notice && <div style={{ fontSize: 12.5, color: T.success, background: "#E9F6EE", border: `1px solid #C7E6D3`, borderRadius: 8, padding: "8px 11px" }}>{notice}</div>}

      <Turnstile onVerify={setToken} resetKey={resetKey} />

      <button type="submit" disabled={busy || (TURNSTILE_ENABLED && !token)} style={{ width: "100%", padding: "12px 0", borderRadius: 9, border: 0, cursor: busy || (TURNSTILE_ENABLED && !token) ? "default" : "pointer", background: T.teal, color: "#fff", fontFamily: FONTS.u, fontWeight: 700, fontSize: 14.5, opacity: busy || (TURNSTILE_ENABLED && !token) ? 0.6 : 1 }}>
        {busy ? t("Lütfen bekleyin…", "Please wait…") : isSignup ? t("Hesap Oluştur", "Create Account") : t("Giriş Yap", "Sign In")}
      </button>

      {!isSignup && (
        <button type="button" onClick={forgot} style={{ background: "none", border: 0, color: T.mut, fontFamily: FONTS.u, fontSize: 12.5, cursor: "pointer", alignSelf: "center", textDecoration: "underline" }}>
          {t("Şifreni mi unuttun?", "Forgot your password?")}
        </button>
      )}
    </form>
  );
}

function translateError(msg, lang) {
  const en = lang === "en";
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return en ? "Incorrect email or password." : "E-posta veya şifre hatalı.";
  if (m.includes("already registered") || m.includes("already been registered")) return en ? "This email is already registered. Try signing in." : "Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.";
  if (m.includes("email not confirmed")) return en ? "Please verify your email; check your inbox." : "E-postanızı doğrulayın; gelen kutunuzu kontrol edin.";
  if (m.includes("password should be at least")) return en ? "Password must be at least 6 characters." : "Şifre en az 6 karakter olmalı.";
  if (m.includes("rate limit")) return en ? "Too many attempts. Please wait a moment." : "Çok fazla deneme. Lütfen biraz bekleyin.";
  if (m.includes("unable to validate email")) return en ? "Enter a valid email address." : "Geçerli bir e-posta adresi girin.";
  return msg || (en ? "Something went wrong, please try again." : "Bir sorun oluştu, tekrar deneyin.");
}

function MiniReport() {
  const { t } = useLang();
  const rows = [
    { s: "pass", l: t("APA 7 kaynakça", "APA 7 references"), v: "32/32" },
    { s: "warn", l: t("Özet kelime sınırı", "Abstract word limit"), v: "267/250" },
    { s: "fail", l: t("Benzerlik eşiği", "Similarity threshold"), v: "%23" },
  ];
  const col = (s) => (s === "pass" ? T.success : s === "warn" ? T.warn : T.error);
  return (
    <div style={{ marginTop: 26, background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 34px 70px -34px rgba(0,0,0,.6)", transform: "rotate(-1.4deg)", color: T.ink }}>
      <div style={{ height: 4, background: T.amber }} />
      <div style={{ padding: "15px 17px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}>
          <span style={{ fontFamily: FONTS.m, fontSize: 9.5, letterSpacing: ".1em", color: "#6A8A7C" }}>READINESS</span>
          <span style={{ marginLeft: "auto", fontFamily: FONTS.d, fontWeight: 700, fontSize: 22, color: T.success, lineHeight: 1 }}>87<span style={{ fontFamily: FONTS.u, fontSize: 12, color: "#6A8A7C", fontWeight: 400 }}>/100 · B+</span></span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "#DCE9E3", overflow: "hidden", marginBottom: 12 }}><div style={{ width: "87%", height: "100%", background: `linear-gradient(90deg,${T.tealLight},${T.success})` }} /></div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: i === 0 ? "none" : `1px solid ${T.line}` }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: col(r.s) }} />
            <span style={{ fontSize: 12, color: T.ink, flex: 1 }}>{r.l}</span>
            <span style={{ fontFamily: FONTS.m, fontSize: 11, color: col(r.s) }}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Auth({ mode = "signup", setMode, onBack }) {
  const { t } = useLang();
  const isSignup = mode === "signup";
  const VALUES = [
    t("Onlarca kontrol noktası, puanlı rapor", "Dozens of checkpoints, a scored report"),
    t("Hedef dergi profiline göre denetim", "Checks against your target-journal profile"),
    t(".pdf / .docx yükle — saniyede sonuç", "Upload .pdf / .docx — results in seconds"),
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.sage, padding: "clamp(16px,4vw,44px)", fontFamily: FONTS.u }}>
      <div className="auth-card" style={{ width: "100%", maxWidth: 960, minHeight: 600, background: "#fff", borderRadius: 22, overflow: "hidden", border: `1px solid ${T.line}`, boxShadow: "0 44px 100px -55px rgba(10,61,61,.6)" }}>
        {/* LEFT — brand panel */}
        <div className="auth-side" style={{ position: "relative", overflow: "hidden", color: "#fff", padding: "44px 52px", display: "flex", flexDirection: "column",
          background: `radial-gradient(680px 320px at 20% -10%, ${T.tealLight} 0%, rgba(21,107,107,0) 60%), linear-gradient(160deg,${T.tealMid} 0%,${T.teal} 60%,#072423 100%)` }}>
          <div style={{ position: "absolute", left: -120, top: -120, width: 420, height: 420, background: "radial-gradient(circle,rgba(232,151,10,.32),rgba(232,151,10,0) 66%)", pointerEvents: "none" }} />
          <button onClick={onBack} style={{ position: "relative", alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#CFE0DA", background: "rgba(255,255,255,.1)", border: 0, cursor: "pointer", padding: "7px 14px", borderRadius: 20 }}>
            ← {t("Anasayfaya dön", "Back to home")}
          </button>

          <div style={{ position: "relative", margin: "auto 0", maxWidth: 430, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 22 }}>
              <Wordmark size={24} variant="dark" />
            </div>
            <h1 style={{ fontFamily: FONTS.d, fontWeight: 700, fontSize: "clamp(26px,3vw,36px)", lineHeight: 1.12, letterSpacing: "-0.02em", margin: 0 }}>
              {isSignup ? t("Presubly'ye hoş geldiniz.", "Welcome to Presubly.") : t("Tekrar hoş geldiniz.", "Welcome back.")}
            </h1>
            <p style={{ fontSize: 15, color: "#B7CCC3", marginTop: 14, lineHeight: 1.6 }}>
              {isSignup ? t("3 ücretsiz tarama ile başlayın — kredi kartı gerekmez.", "Start with 3 free scans — no credit card required.") : t("Raporlarınız ve taramalarınız sizi bekliyor.", "Your reports and scans are waiting for you.")}
            </p>

            <MiniReport />

            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 22 }}>
              {VALUES.map((v, i) => (
                <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 12.5, color: "#C7D6CE" }}>
                  <Check size={15} style={{ color: T.amber3, flexShrink: 0 }} />{v}
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: "relative", fontFamily: FONTS.d, fontStyle: "italic", fontSize: 14.5, color: "#7FA093", marginTop: 24 }}>{t("Göndermeden önce hazır ol.", "Be ready before you submit.")}</div>
        </div>

        {/* RIGHT — form */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "44px 24px" }}>
          <div style={{ width: "100%", maxWidth: 400 }}>
            <div className="auth-mob" style={{ display: "none", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 22 }}>
              <Wordmark size={20} />
            </div>

            <div style={{ display: "flex", background: T.sage, borderRadius: 12, padding: 4, marginBottom: 24, border: `1px solid ${T.line}` }}>
              {[["signin", t("Giriş Yap", "Sign In")], ["signup", t("Kayıt Ol", "Sign Up")]].map(([m, label]) => (
                <button key={m} onClick={() => setMode?.(m)} style={{ flex: 1, fontFamily: FONTS.u, fontSize: 14, fontWeight: 700, padding: "10px 0", borderRadius: 9, border: 0, cursor: "pointer", background: mode === m ? "#fff" : "transparent", color: mode === m ? T.teal : T.mut, boxShadow: mode === m ? "0 2px 8px -3px rgba(10,61,61,.3)" : "none", transition: "background .15s, color .15s" }}>
                  {label}
                </button>
              ))}
            </div>

            <h2 style={{ fontFamily: FONTS.d, fontWeight: 700, fontSize: 26, color: T.ink, letterSpacing: "-0.01em", margin: "0 0 4px" }}>
              {isSignup ? t("Hesap oluşturun", "Create your account") : t("Giriş yapın", "Sign in")}
            </h2>
            <p style={{ fontSize: 14, color: T.mut, margin: "0 0 22px" }}>
              {isSignup ? t("Ücretsiz başlayın, saniyeler içinde.", "Start free, in seconds.") : t("E-posta ve şifrenizle devam edin.", "Continue with your email and password.")}
            </p>

            <EmailForm mode={mode} />
          </div>
        </div>
      </div>
    </div>
  );
}
