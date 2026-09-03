import React from "react";
import { useLang } from "./lang.jsx";

/* Shared helpers + renderer for "Presubly Hakem Yorumları" (anchored referee
   comments). Used by the in-app AnnotatedManuscript and the public SharedView. */

export const SEV_LABEL = { kritik: "Kritik", "uyarı": "Uyarı", "öneri": "Öneri" };
export const SEV_LABEL_EN = { kritik: "Critical", "uyarı": "Warning", "öneri": "Suggestion" };
export const SECTION_EN = { "Başlık": "Title", "Özet": "Abstract", "Giriş": "Introduction", "Yöntem": "Methods", "Bulgular": "Results", "Tartışma": "Discussion", "Sonuç": "Conclusion", "Kaynakça": "References", "Genel": "General" };
export const sevLabel = (s, lang) => (lang === "en" ? SEV_LABEL_EN[s] || s : SEV_LABEL[s] || s);
export const sectionLabel = (s, lang) => (lang === "en" ? SECTION_EN[s] || s : s);

export function normSev(s) {
  const v = String(s || "").toLowerCase();
  if (v === "fail" || v.includes("krit")) return "kritik";
  if (v === "warn" || v.includes("uyar")) return "uyarı";
  return "öneri";
}

export const sevKey = (s) => (s === "kritik" ? "krit" : s === "uyarı" ? "uyar" : "oner"); // ASCII class-safe

/* Accepts the new rich `comments` or the legacy `highlights` shape and normalises. */
export function getComments(src) {
  const raw = Array.isArray(src?.comments) ? src.comments : Array.isArray(src?.highlights) ? src.highlights : [];
  return raw
    .map((c) => ({ quote: c.quote, section: c.section || "Genel", severity: normSev(c.severity), issue: c.issue || c.note || "", suggestion: c.suggestion || "" }))
    .filter((c) => c.quote && String(c.quote).trim().length >= 4);
}

/* Comment cards only (no anchored document) — safe to show without the manuscript. */
export function CommentCards({ comments, title }) {
  const { lang } = useLang();
  const heading = title || (lang === "en" ? "Presubly Reviewer Comments" : "Presubly Hakem Yorumları");
  const list = Array.isArray(comments) ? comments : [];
  if (!list.length) return null;
  return (
    <div className="card" style={{ padding: 18 }}>
      <b style={{ fontFamily: "var(--fd)", fontSize: 15, display: "block", marginBottom: 12 }}>
        {heading} <span style={{ color: "var(--k4)", fontWeight: 400, fontSize: 13 }}>· {list.length}</span>
      </b>
      <div className="pc-list">
        {list.map((c, i) => (
          <div key={i} className={`pc-card pc-b-${sevKey(c.severity)}`}>
            <div className="pc-chead">
              <span className={`pc-badge pc-bg-${sevKey(c.severity)}`}>P{i + 1} · {sevLabel(c.severity, lang)}</span>
              <span className="pc-sec">{sectionLabel(c.section, lang)}</span>
            </div>
            <div className="pc-quote">"{String(c.quote).trim()}"</div>
            {c.issue && <div className="pc-issue">{c.issue}</div>}
            {c.suggestion && <div className="pc-sug"><b>{lang === "en" ? "Suggestion:" : "Öneri:"}</b> {c.suggestion}</div>}
            <div className="pc-brand">— {lang === "en" ? "Presubly Reviewer" : "Presubly Hakem"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
