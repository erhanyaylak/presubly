import React, { useState } from "react";
import { useLang, currentLang } from "./lang.jsx";
import { ReportBrandHeader, AuditFooter } from "./Report.jsx";
import { Copy, Check } from "lucide-react";

/* Cover letter as a fillable artifact: draft + placeholder checklist + key points. */

export function coverletterToMarkdown(c) {
  const en = currentLang() === "en";
  const lines = [`# Presubly · ${en ? "Cover Letter" : "Kapak Mektubu"}`, ``];
  if (Array.isArray(c?.keyPoints) && c.keyPoints.length) { lines.push(`## ${en ? "Highlights" : "Öne Çıkanlar"}`); c.keyPoints.forEach((k) => lines.push(`- ${k}`)); lines.push(""); }
  if (Array.isArray(c?.placeholders) && c.placeholders.length) { lines.push(`## ${en ? "Fields to Fill" : "Doldurulacak Alanlar"}`); c.placeholders.forEach((p) => lines.push(`- ${p}`)); lines.push(""); }
  lines.push(`## ${en ? "Letter" : "Mektup"}`, ``, c?.letter || "", "");
  lines.push("---", `Presubly · presubly.com — ${new Date().toLocaleDateString(en ? "en-US" : "tr-TR")}`);
  return lines.join("\n");
}

function CopyBtn({ text, label, style }) {
  const { lang } = useLang();
  const [ok, setOk] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* ignore */ } };
  return <button className="res-dl" onClick={copy} style={style}>{ok ? <><Check size={13} /> {lang === "en" ? "Copied" : "Kopyalandı"}</> : <><Copy size={13} /> {label}</>}</button>;
}

export function CoverLetterReport({ report, onDownload, actions }) {
  const { lang } = useLang();
  const c = report || {};
  const placeholders = Array.isArray(c.placeholders) ? c.placeholders.filter(Boolean) : [];
  const keyPoints = Array.isArray(c.keyPoints) ? c.keyPoints.filter(Boolean) : [];
  return (
    <div className="card result on printable">
      <ReportBrandHeader title={lang === "en" ? "Cover Letter" : "Kapak Mektubu"} />
      <div className="res-top">
        <div className="res-dec" style={{ flex: 1 }}><b>{lang === "en" ? "Cover Letter Draft" : "Kapak Mektubu Taslağı"}</b><p>{lang === "en" ? "Ready to send to the editor — fill the fields and copy." : "Editöre gönderime hazır — alanları doldurup kopyalayın."}</p></div>
        <div className="res-actions">{actions}<CopyBtn text={c.letter || ""} label={lang === "en" ? "Copy letter" : "Mektubu kopyala"} /><button className="res-dl" onClick={onDownload}>.md</button></div>
      </div>

      {keyPoints.length > 0 && (
        <div className="rpt-cat"><div className="rpt-cat-h"><b>{lang === "en" ? "Highlights" : "Öne Çıkanlar"}</b></div><ul style={{ margin: 0, paddingLeft: 20 }}>{keyPoints.map((k, i) => <li key={i} style={{ fontSize: 12.5, color: "var(--k3)", margin: "2px 0" }}>{k}</li>)}</ul></div>
      )}

      {placeholders.length > 0 && (
        <div className="rpt-cat">
          <div className="rpt-cat-h"><b>{lang === "en" ? "Fields to Fill" : "Doldurulacak Alanlar"}</b><span style={{ fontSize: 11.5, color: "var(--k4)", marginLeft: "auto" }}>{placeholders.length}</span></div>
          <div className="cl-fields">{placeholders.map((p, i) => <span className="cl-chip" key={i}>{p}</span>)}</div>
        </div>
      )}

      <div className="rpt-cat">
        <div className="rpt-cat-h"><b>{lang === "en" ? "Letter" : "Mektup"}</b><CopyBtn text={c.letter || ""} label={lang === "en" ? "Copy" : "Kopyala"} style={{ marginLeft: "auto" }} /></div>
        <div className="ed-letter">{c.letter}</div>
      </div>
      <AuditFooter meta={c._meta} />
    </div>
  );
}
