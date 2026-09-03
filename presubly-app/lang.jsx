import React, { createContext, useContext, useState, useCallback } from "react";

/* Basit iki-dilli katman (TR/EN). Presubly şu an landing için çift dilli.
   - t(tr, en): satır içi metin çevirisi.
   - L(obj): { tr, en } biçimli veri alanını aktif dile göre seçer; düz string ise
     olduğu gibi döner (henüz çevrilmemiş alanlar Türkçe kalır — sorunsuz fallback). */
const LangContext = createContext({ lang: "tr", setLang: () => {}, t: (tr) => tr, L: (v) => v });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem("pb_lang") === "en" ? "en" : "tr"; } catch { return "tr"; }
  });
  const setLang = useCallback((l) => {
    const v = l === "en" ? "en" : "tr";
    setLangState(v);
    try { localStorage.setItem("pb_lang", v); } catch {}
    try { document.documentElement.lang = v; } catch {}
  }, []);
  const t = useCallback((tr, en) => (lang === "en" ? (en ?? tr) : tr), [lang]);
  const L = useCallback((v) => {
    if (v && typeof v === "object" && !Array.isArray(v) && ("tr" in v || "en" in v)) return v[lang] ?? v.tr ?? v.en;
    return v;
  }, [lang]);
  return <LangContext.Provider value={{ lang, setLang, t, L }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/* Aktif dili context dışından (pure fonksiyonlarda, ör. markdown export) okumak için. */
export const currentLang = () => {
  try { return localStorage.getItem("pb_lang") === "en" ? "en" : "tr"; } catch { return "tr"; }
};
