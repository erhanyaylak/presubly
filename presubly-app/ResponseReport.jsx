import React, { useState } from "react";
import { useLang, currentLang } from "./lang.jsx";
import { ReportBrandHeader, AuditFooter } from "./Report.jsx";
import { Copy, Check } from "lucide-react";

/* §15 — structured point-by-point reviewer response: parse comments, classify
   each, draft a per-comment response, and expose a change-summary table. */

export const RES_CLS = {
  ACCEPT: { label: "Kabul", en: "Accept", c: "var(--ok)", bg: "var(--okl)" },
  PARTIAL: { label: "Kısmi Kabul", en: "Partial", c: "var(--a2)", bg: "var(--al)" },
  REBUT: { label: "Gerekçeli İtiraz", en: "Reasoned Rebuttal", c: "var(--tl)", bg: "var(--tll)" },
  CLARIFY: { label: "Açıklama", en: "Clarification", c: "var(--k4)", bg: "var(--paper2)" },
};
const clsOf = (x) => RES_CLS[String(x || "").toUpperCase()] || RES_CLS.CLARIFY;
const clsLabel = (o, lang) => (lang === "en" ? o.en || o.label : o.label);

function CopyBtn({ text, label, style }) {
  const { lang } = useLang();
  const [ok, setOk] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* ignore */ } };
  return <button className="res-dl" onClick={copy} style={style}>{ok ? <><Check size={13} /> {lang === "en" ? "Copied" : "Kopyalandı"}</> : <><Copy size={13} /> {label || (lang === "en" ? "Copy" : "Kopyala")}</>}</button>;
}

export function responseLetter(r) {
  const en = currentLang() === "en";
  const rows = Array.isArray(r?.responses) ? r.responses : [];
  const lines = [];
  rows.forEach((x, i) => {
    lines.push(`${x.reviewer ? x.reviewer + " — " : ""}${en ? "Comment" : "Yorum"} ${i + 1}: ${x.comment || ""}`);
    lines.push(`${en ? "Response" : "Yanıt"}: ${x.response || ""}`);
    if (x.change) lines.push(`${en ? "Change" : "Değişiklik"}: ${x.change}${x.location ? ` (${x.location})` : ""}`);
    lines.push("");
  });
  return lines.join("\n").trim();
}

export function responseToMarkdown(r) {
  const lang = currentLang(); const en = lang === "en";
  const rows = Array.isArray(r?.responses) ? r.responses : [];
  const lines = [`# Presubly · ${en ? "Reviewer Response (point-by-point)" : "Hakem Yanıtı (point-by-point)"}`, ``];
  if (r?.summary) lines.push(r.summary, ``);
  rows.forEach((x, i) => {
    const c = clsOf(x.classification);
    lines.push(`## ${en ? "Comment" : "Yorum"} ${i + 1}${x.reviewer ? ` · ${x.reviewer}` : ""} — ${clsLabel(c, lang)}`);
    if (x.comment) lines.push(`> ${x.comment}`);
    if (x.response) lines.push(`**${en ? "Response" : "Yanıt"}:** ${x.response}`);
    if (x.change) lines.push(`**${en ? "Change" : "Değişiklik"}:** ${x.change}${x.location ? ` (${x.location})` : ""}`);
    lines.push("");
  });
  lines.push("---", `Presubly · presubly.com — ${new Date().toLocaleDateString(en ? "en-US" : "tr-TR")}`);
  return lines.join("\n");
}

export function ResponseReport({ report, onDownload, actions }) {
  const { lang } = useLang();
  const rows = Array.isArray(report?.responses) ? report.responses : [];
  const counts = { ACCEPT: 0, PARTIAL: 0, REBUT: 0, CLARIFY: 0 };
  rows.forEach((x) => { const k = String(x.classification || "").toUpperCase(); if (counts[k] != null) counts[k]++; });
  const changes = rows.filter((x) => x.change && !/^\s*\[/.test(x.change));
  return (
    <div className="card result on printable">
      <ReportBrandHeader title={lang === "en" ? "Reviewer Response" : "Hakem Yanıtı"} />
      <div className="res-top">
        <div className="res-dec" style={{ flex: 1 }}>
          <b>{lang === "en" ? `Point-by-point response to ${rows.length} comments` : `${rows.length} yoruma point-by-point yanıt`}</b>
          <p style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
            {Object.entries(RES_CLS).map(([k, v]) => counts[k] > 0 && <em key={k} style={{ color: v.c }}>{counts[k]} {clsLabel(v, lang)}</em>)}
          </p>
        </div>
        <div className="res-actions">{actions}<CopyBtn text={responseLetter(report)} label={lang === "en" ? "Copy full response" : "Tüm yanıtı kopyala"} /><button className="res-dl" onClick={onDownload}>.md</button></div>
      </div>
      {report?.summary && <p style={{ fontSize: 13, color: "var(--k3)", lineHeight: 1.6 }}>{report.summary}</p>}

      {rows.map((x, i) => {
        const c = clsOf(x.classification);
        return (
          <div className="rpt-cat" key={i}>
            <div className="rpt-cat-h">
              <b>{lang === "en" ? "Comment" : "Yorum"} {i + 1}{x.reviewer ? ` · ${x.reviewer}` : ""}</b>
              <span className="res-cls" style={{ color: c.c, background: c.bg }}>{clsLabel(c, lang)}</span>
            </div>
            {x.comment && <div className="res-comment">{x.comment}</div>}
            {x.response && (
              <div className="res-answer">
                {x.response}
                <CopyBtn text={x.response} label={lang === "en" ? "Copy response" : "Yanıtı kopyala"} style={{ marginTop: 8 }} />
              </div>
            )}
            {x.change && <div className="res-change"><b>{lang === "en" ? "Change:" : "Değişiklik:"}</b> {x.change}{x.location ? <em style={{ color: "var(--k4)" }}> — {x.location}</em> : null}</div>}
          </div>
        );
      })}

      {changes.length > 0 && (
        <div className="rpt-cat">
          <div className="rpt-cat-h"><b>{lang === "en" ? "Change Summary" : "Değişiklik Özeti"}</b><span style={{ fontSize: 11.5, color: "var(--k4)", marginLeft: "auto" }}>{changes.length} {lang === "en" ? "changes" : "değişiklik"}</span></div>
          <div className="res-table">
            {changes.map((x, i) => (
              <div className="res-trow" key={i}>
                <span className="res-tc">{x.change}</span>
                <span className="res-tl">{x.location || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <AuditFooter meta={report?._meta} />
    </div>
  );
}
