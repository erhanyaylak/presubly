import React, { useState } from "react";
import { useLang, currentLang } from "./lang.jsx";
import { ReportBrandHeader, STATUS, AuditFooter } from "./Report.jsx";
import { Copy, Check } from "lucide-react";

/* §3 — Editorial assessment with STRUCTURED decision codes (no free-text state).
   The AI emits decisionCode/scopeFit enums; the UI colours/labels them here. */

export const ED_DECISION = {
  SEND_TO_REVIEW: { label: "Hakeme Gönder", en: "Send to Review", c: "var(--ok)", bg: "var(--okl)" },
  REVISION_BEFORE_REVIEW: { label: "Hakem Öncesi Revizyon", en: "Revision Before Review", c: "var(--a2)", bg: "var(--al)" },
  DESK_REJECT: { label: "Masa Başı Ret", en: "Desk Reject", c: "var(--er)", bg: "var(--erl)" },
  OUT_OF_SCOPE: { label: "Kapsam Dışı", en: "Out of Scope", c: "var(--er)", bg: "var(--erl)" },
  INSUFFICIENT_EVIDENCE: { label: "Yetersiz Bilgi — Karar Verilemedi", en: "Insufficient Information — Undecided", c: "var(--k4)", bg: "var(--paper2)" },
};
const SCOPE = { HIGH: { label: "Yüksek", en: "High", n: 3, c: "var(--ok)" }, PARTIAL: { label: "Kısmi", en: "Partial", n: 2, c: "var(--a2)" }, LOW: { label: "Düşük", en: "Low", n: 1, c: "var(--er)" }, UNKNOWN: { label: "Belirsiz", en: "Unknown", n: 0, c: "var(--k5)" } };
const pick = (o, lang) => (o ? (lang === "en" ? o.en || o.label : o.label) : "");

export function editorialToMarkdown(e) {
  const lang = currentLang(); const en = lang === "en";
  const d = ED_DECISION[e.decisionCode] || { label: e.decisionCode || "—" };
  const sc = SCOPE[e.scopeFit];
  const lines = [`# Presubly · ${en ? "Editorial Assessment" : "Editöryal Değerlendirme"}`, ``, `**${en ? "Editor decision" : "Editör kararı"}:** ${pick(d, lang)}`];
  if (sc) lines.push(`**${en ? "Scope fit" : "Kapsam uyumu"}:** ${pick(sc, lang)}${e.scopeNotes ? ` — ${e.scopeNotes}` : ""}`);
  lines.push("");
  if (e.summary) lines.push(e.summary, "");
  if (e.rationale) lines.push(`## ${en ? "Decision Rationale" : "Karar Gerekçesi"}`, e.rationale, "");
  if (Array.isArray(e.ethics) && e.ethics.length) {
    lines.push(`## ${en ? "Ethics & Integrity" : "Etik & Bütünlük"}`);
    e.ethics.forEach((k) => lines.push(`- [${k.status || "?"}] ${k.label}${k.note ? ` — ${k.note}` : ""}`));
    lines.push("");
  }
  if (Array.isArray(e.priority) && e.priority.length) {
    lines.push(`## ${en ? "Priority Actions" : "Öncelikli İşler"}`);
    e.priority.forEach((p, i) => lines.push(`${i + 1}. ${p}`));
    lines.push("");
  }
  if (e.letter) lines.push(`## ${en ? "Author Notification Letter (Draft)" : "Yazara Bildirim Mektubu (Taslak)"}`, ``, e.letter, "");
  lines.push("---", `Presubly · presubly.com — ${new Date().toLocaleDateString(en ? "en-US" : "tr-TR")}`);
  return lines.join("\n");
}

function CopyLetter({ text }) {
  const { lang } = useLang();
  const [ok, setOk] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1600); } catch { /* ignore */ } };
  return <button className="res-dl" onClick={copy} style={{ marginLeft: "auto" }}>{ok ? <><Check size={13} /> {lang === "en" ? "Copied" : "Kopyalandı"}</> : <><Copy size={13} /> {lang === "en" ? "Copy letter" : "Mektubu kopyala"}</>}</button>;
}

export function EditorialReport({ report, onDownload, actions }) {
  const { lang } = useLang();
  const e = report || {};
  const d = ED_DECISION[e.decisionCode] || ED_DECISION.INSUFFICIENT_EVIDENCE;
  const sc = SCOPE[e.scopeFit] || SCOPE.UNKNOWN;
  return (
    <div className="card result on printable">
      <ReportBrandHeader title={lang === "en" ? "Editorial Assessment" : "Editöryal Değerlendirme"} />
      <div className="res-top">
        <div className="ed-decision" style={{ background: d.bg, color: d.c }}>{pick(d, lang)}</div>
        <div className="res-dec" style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--fm)", fontSize: 10, letterSpacing: ".06em", color: "var(--k4)" }}>{lang === "en" ? "SCOPE FIT" : "KAPSAM UYUMU"}</div>
          <div className="ed-scope">
            {[1, 2, 3].map((n) => <div key={n} className="ed-scope-seg" style={{ background: n <= sc.n ? sc.c : "var(--ln2)" }} />)}
            <b style={{ color: sc.c, fontSize: 13, marginLeft: 6 }}>{pick(sc, lang)}</b>
          </div>
          {e.scopeNotes && <p style={{ fontSize: 12.5, color: "var(--k3)", margin: "6px 0 0", lineHeight: 1.5 }}>{e.scopeNotes}</p>}
        </div>
        <div className="res-actions">{actions}<button className="res-dl" onClick={onDownload}>{lang === "en" ? "download .md" : ".md indir"}</button></div>
      </div>

      {e.summary && <p style={{ fontSize: 13, color: "var(--k3)", lineHeight: 1.6 }}>{e.summary}</p>}
      {e.rationale && (
        <div className="rpt-cat"><div className="rpt-cat-h"><b>{lang === "en" ? "Decision Rationale" : "Karar Gerekçesi"}</b></div><p style={{ fontSize: 12.5, color: "var(--k3)", lineHeight: 1.55, margin: 0 }}>{e.rationale}</p></div>
      )}

      {Array.isArray(e.ethics) && e.ethics.length > 0 && (
        <div className="rpt-cat">
          <div className="rpt-cat-h"><b>{lang === "en" ? "Ethics & Integrity" : "Etik & Bütünlük"}</b></div>
          {e.ethics.map((k, i) => {
            const st = STATUS[k.status] || STATUS.warn;
            return <div className="chk" key={i}><span className="chk-dot" style={{ background: st.c }} /><span className="chk-l">{k.label}{k.note ? <em> — {k.note}</em> : null}</span></div>;
          })}
        </div>
      )}

      {Array.isArray(e.priority) && e.priority.length > 0 && (
        <div className="rpt-priority"><div className="rpt-cat-h"><b>{lang === "en" ? "Priority Actions" : "Öncelikli İşler"}</b></div><ol>{e.priority.map((p, i) => <li key={i}>{p}</li>)}</ol></div>
      )}

      {e.letter && (
        <div className="rpt-cat">
          <div className="rpt-cat-h"><b>{lang === "en" ? "Author Notification Letter (Draft)" : "Yazara Bildirim Mektubu (Taslak)"}</b><CopyLetter text={e.letter} /></div>
          <div className="ed-letter">{e.letter}</div>
        </div>
      )}
      <AuditFooter meta={e._meta} />
    </div>
  );
}
