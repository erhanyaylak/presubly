import React from "react";
import { useLang, currentLang } from "./lang.jsx";
import { Logo, Wordmark } from "./Brand.jsx";

/* Readiness Report card — shared by the app (Presubly.jsx) and the public
   share view (SharedView.jsx). `actions` is optional extra toolbar JSX. */

/* Branded header stamped on every generated report/analysis (on screen, in
   the PDF print, and in the shared view). */
export function ReportBrandHeader({ title = "Uyumluluk Raporu" }) {
  return (
    <div className="rpt-brand">
      <Wordmark size={16} />
      <span className="rpt-brand-sep">·</span>
      <span className="rpt-brand-t">{title}</span>
      <span className="rpt-brand-url">presubly.com</span>
    </div>
  );
}

export const STATUS = {
  pass: { c: "var(--ok)", bg: "var(--okl)", t: "#1A8A52" },
  warn: { c: "var(--wn)", bg: "var(--wnl)", t: "var(--a2)" },
  fail: { c: "var(--er)", bg: "var(--erl)", t: "#C04030" },
  unknown: { c: "var(--k5)", bg: "var(--paper2)", t: "var(--k4)" },   // metinde tespit edilemedi (≠ eksik)
};

export function clampScore(s) {
  const n = typeof s === "number" ? s : parseInt(s, 10);
  if (Number.isNaN(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function scoreColor(score) {
  if (score == null) return "var(--k4)";
  if (score >= 80) return "var(--ok)";
  if (score >= 60) return "var(--wn)";
  return "var(--er)";
}

/* Robustly pull a JSON object out of the model's reply (handles ```json fences
   or leading prose). Returns null if nothing valid is found. */
export function extractReport(text) {
  if (!text) return null;
  const tryParse = (s) => { try { const o = JSON.parse(s); return o && o.categories ? o : null; } catch { return null; } };
  let r = tryParse(text.trim());
  if (r) return r;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && (r = tryParse(fenced[1].trim()))) return r;
  const braced = text.match(/\{[\s\S]*\}/);
  if (braced && (r = tryParse(braced[0]))) return r;
  const repaired = repairTruncatedJSON(text);        // salvage a cut-off report
  return repaired && Array.isArray(repaired.categories) ? repaired : null;
}

/* Lenient JSON recovery for model output. Handles the three ways a model breaks
   strict JSON when it copies verbatim manuscript text:
     1. raw newlines / tabs inside string values (must be \n / \t)
     2. truncation at the output-token limit (unclosed strings & brackets)
     3. trailing commas before a } or ]
   Walks char-by-char tracking string context, rewriting as it goes. Cannot fix
   an unescaped " inside a string (ambiguous) — that still returns null. */
function repairTruncatedJSON(text) {
  const start = text.indexOf("{");
  if (start < 0) return null;
  const s = text.slice(start);
  const stack = [];
  let out = "", inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) { out += ch; esc = false; continue; }
      if (ch === "\\") { out += ch; esc = true; continue; }
      if (ch === '"') { out += ch; inStr = false; continue; }
      if (ch === "\n") { out += "\\n"; continue; }   // escape raw control chars
      if (ch === "\r") { out += "\\r"; continue; }
      if (ch === "\t") { out += "\\t"; continue; }
      out += ch; continue;
    }
    if (ch === '"') { inStr = true; out += ch; continue; }
    if (ch === "{") { stack.push("}"); out += ch; continue; }
    if (ch === "[") { stack.push("]"); out += ch; continue; }
    if (ch === "}" || ch === "]") { stack.pop(); out += ch; continue; }
    out += ch;
  }
  if (inStr) out += '"';                              // close an unterminated string
  out = out.replace(/,\s*$/, "");                     // dangling comma at the cut point
  out = out.replace(/,?\s*"[^"]*"\s*:\s*$/, "");      // dangling "key": with no value
  out = out.replace(/,\s*$/, "");
  out = out.replace(/,(\s*[}\]])/g, "$1");            // trailing commas before a closer
  for (let k = stack.length - 1; k >= 0; k--) out += stack[k];
  try { const o = JSON.parse(out); return o && typeof o === "object" ? o : null; } catch { return null; }
}

/* Generic JSON extractor (for the sim report, which uses `dimensions`). */
export function extractJSON(text) {
  if (!text) return null;
  const tryParse = (s) => { try { return JSON.parse(s); } catch { return null; } };
  let r = tryParse(text.trim());
  if (r && typeof r === "object") return r;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && (r = tryParse(fenced[1].trim()))) return r;
  const braced = text.match(/\{[\s\S]*\}/);
  if (braced && (r = tryParse(braced[0]))) return r;
  // last resort: the JSON was cut off (output token limit) — salvage the prefix.
  return repairTruncatedJSON(text);
}

export function reportToMarkdown(report) {
  const en = currentLang() === "en";
  const lines = [`# Presubly — ${en ? "Readiness Report" : "Uyumluluk Raporu"}`, ``, `**${en ? "Overall score" : "Genel skor"}:** ${clampScore(report.score)}/100 (${report.grade || "—"}) — ${report.decision || ""}`, ``];
  const cl = report.classification;
  if (cl && (cl.methodology || cl.design || cl.discipline)) lines.push(`**${en ? "Detected design" : "Tespit edilen tasarım"}:** ${[cl.discipline, cl.field, cl.methodology, cl.design].filter(Boolean).join(" · ")}${typeof cl.confidence === "number" ? (en ? ` (confidence ${clampScore(cl.confidence)}%)` : ` (güven %${clampScore(cl.confidence)})`) : ""}`, ``);
  const jf = report.journalFit;
  if (jf && typeof jf === "object" && typeof jf.overallFit === "number") {
    lines.push(`## ${en ? "Journal Fit — Overall" : "Dergi Uyumu — Genel"} %${clampScore(jf.overallFit)}`);
    [["topicFit", en ? "Topic/scope" : "Konu/kapsam"], ["articleTypeFit", en ? "Article type" : "Makale türü"], ["methodFit", en ? "Method" : "Yöntem"], ["audienceFit", en ? "Audience" : "Hedef kitle"], ["policyFit", en ? "Policy" : "Politika"]].forEach(([k, l]) => { if (typeof jf[k] === "number") lines.push(`- ${l}: %${clampScore(jf[k])}`); });
    if (jf.notes) lines.push(jf.notes);
    lines.push("");
  }
  if (report.summary) lines.push(report.summary, ``);
  (report.categories || []).forEach((cat) => {
    lines.push(`## ${cat.name}${typeof cat.score === "number" ? ` (${clampScore(cat.score)}/100)` : ""}`);
    (cat.checks || []).forEach((c) => {
      const mark = c.status === "pass" ? "✓" : c.status === "fail" ? "✕" : c.status === "unknown" ? "?" : "!";
      lines.push(`- [${mark}] ${c.label}${c.value ? ` — ${c.value}` : ""}${c.note ? ` (${c.note})` : ""}`);
    });
    lines.push("");
  });
  if (Array.isArray(report.priority) && report.priority.length) {
    lines.push(`## ${en ? "Before you submit" : "Göndermeden önce"}`);
    report.priority.forEach((p, i) => lines.push(`${i + 1}. ${p}`));
    lines.push("");
  }
  const comments = Array.isArray(report.comments) ? report.comments : Array.isArray(report.highlights) ? report.highlights : [];
  if (comments.length) {
    lines.push(`## ${en ? "Presubly Reviewer Comments" : "Presubly Hakem Yorumları"}`, ``);
    comments.forEach((c, i) => {
      lines.push(`**P${i + 1} · ${c.severity || "öneri"}${c.section ? " · " + c.section : ""}** — "${String(c.quote || "").trim()}"`);
      if (c.issue || c.note) lines.push(`${en ? "Issue" : "Sorun"}: ${c.issue || c.note}`);
      if (c.suggestion) lines.push(`${en ? "Suggestion" : "Öneri"}: ${c.suggestion}`);
      lines.push("");
    });
  }
  lines.push("---", `Presubly · presubly.com — ${new Date().toLocaleDateString(en ? "en-US" : "tr-TR")}`);
  return lines.join("\n");
}

export function downloadReport(report) {
  const blob = new Blob([reportToMarkdown(report)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "presubly-uyumluluk-raporu.md"; a.click();
  URL.revokeObjectURL(url);
}

/* §20 — explainable audit trail footer. */
const ENGINE_LABEL = { anthropic: "Claude Sonnet", "workers-ai": "Ekonomik motor (Llama)" };
export function AuditFooter({ meta }) {
  const { lang } = useLang();
  if (!meta) return null;
  const eng = ENGINE_LABEL[meta.engine] || meta.model || "AI";
  let d = "";
  try { d = meta.at ? new Date(meta.at).toLocaleDateString(lang === "en" ? "en-US" : "tr-TR") : ""; } catch { /* ignore */ }
  return (
    <div className="audit-ft">
      <span>{lang === "en" ? "Engine" : "Motor"}: <b>{eng}</b></span>
      {meta.promptVersion && <span>{lang === "en" ? "Prompt version" : "Yönerge sürümü"} <b>v{meta.promptVersion}</b></span>}
      {d && <span>{d}</span>}
      <span className="audit-ft-note">{lang === "en" ? "Evidence-based, deterministic score/decision engine" : "Kanıta dayalı, deterministik puan/karar motoru"}</span>
    </div>
  );
}

/* §12 — detected study design chip (shown atop sim/readiness reports). */
export function StudyClassification({ c }) {
  const { lang } = useLang();
  if (!c || !(c.methodology || c.design || c.discipline)) return null;
  const parts = [c.discipline, c.field, c.methodology, c.design].map((x) => (x || "").trim()).filter(Boolean);
  const seen = new Set(); const uniq = parts.filter((p) => { const k = p.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  return (
    <div className="study-cls">
      <span className="study-cls-t">{lang === "en" ? "Detected design" : "Tespit edilen tasarım"}</span>
      <span className="study-cls-v">{uniq.join(" · ")}</span>
      {typeof c.confidence === "number" && <span className="study-cls-conf">{lang === "en" ? `confidence ${clampScore(c.confidence)}%` : `güven %${clampScore(c.confidence)}`}</span>}
    </div>
  );
}

/* §13 — journal fit panel (shown when a target journal profile was selected). */
const FIT_ROWS = [
  ["topicFit", "Konu / kapsam", "Topic / scope"], ["articleTypeFit", "Makale türü", "Article type"], ["methodFit", "Yöntem", "Method"],
  ["audienceFit", "Hedef kitle", "Audience"], ["policyFit", "Politika uyumu", "Policy fit"],
];
export function JournalFit({ fit }) {
  const { lang } = useLang();
  if (!fit || typeof fit !== "object") return null;
  const rows = FIT_ROWS.filter(([k]) => typeof fit[k] === "number");
  if (!rows.length && typeof fit.overallFit !== "number") return null;
  const overall = clampScore(fit.overallFit);
  return (
    <div className="jfit">
      <div className="jfit-h"><b>{lang === "en" ? "Journal Fit" : "Dergi Uyumu"}</b>{typeof fit.overallFit === "number" && <span className="jfit-overall" style={{ color: scoreColor(overall) }}>{overall}%</span>}</div>
      {rows.map(([k, labelTr, labelEn]) => {
        const v = clampScore(fit[k]);
        return (
          <div className="jfit-row" key={k}>
            <span className="jfit-l">{lang === "en" ? labelEn : labelTr}</span>
            <div className="jfit-bar"><i style={{ width: `${v}%`, background: scoreColor(v) }} /></div>
            <span className="jfit-v" style={{ color: scoreColor(v) }}>{v}%</span>
          </div>
        );
      })}
      {fit.notes && <p className="jfit-note">{fit.notes}</p>}
    </div>
  );
}

export function ReadinessReport({ report, onDownload, actions, printable = true }) {
  const { lang } = useLang();
  const score = clampScore(report.score);
  const counts = { pass: 0, warn: 0, fail: 0, unknown: 0 };
  (report.categories || []).forEach((cat) => (cat.checks || []).forEach((c) => { if (counts[c.status] !== undefined) counts[c.status]++; }));

  return (
    <div className={"card result on" + (printable ? " printable" : "")}>
      <ReportBrandHeader title={lang === "en" ? "Readiness Report" : "Uyumluluk Raporu"} />
      <StudyClassification c={report.classification} />
      <div className="res-top">
        <div className="res-score">
          <b style={{ color: scoreColor(score) }}>{score ?? "—"}</b><span>/100</span>
        </div>
        {report.grade && <div className="rpt-grade" style={{ background: scoreColor(score) }}>{report.grade}</div>}
        <div className="res-dec">
          <b>{report.decision || (lang === "en" ? "Readiness Report" : "Uyumluluk Raporu")}</b>
          <p>{report.summary || "Readiness Report"}</p>
        </div>
        <div className="res-actions">
          {actions}
          <button className="res-dl" onClick={onDownload}>{lang === "en" ? "download .md" : ".md indir"}</button>
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
          <span style={{ color: "var(--k4)" }}>{lang === "en" ? "Overall compliance" : "Genel uyumluluk"}</span>
          <span className="rpt-legend">
            <em style={{ color: "var(--ok)" }}>{counts.pass} {lang === "en" ? "pass" : "uygun"}</em>
            <em style={{ color: "var(--wn)" }}>{counts.warn} {lang === "en" ? "warning" : "uyarı"}</em>
            <em style={{ color: "var(--er)" }}>{counts.fail} {lang === "en" ? "issue" : "sorun"}</em>
            {counts.unknown > 0 && <em style={{ color: "var(--k5)" }}>{counts.unknown} {lang === "en" ? "not detected" : "tespit edilemedi"}</em>}
          </span>
        </div>
        <div className="rpt-bar"><i style={{ width: `${score ?? 0}%`, background: scoreColor(score) }} /></div>
      </div>

      <JournalFit fit={report.journalFit} />

      {(report.categories || []).map((cat, i) => (
        <div className="rpt-cat" key={i}>
          <div className="rpt-cat-h">
            <b>{cat.name}</b>
            {typeof cat.score === "number" && <span style={{ color: scoreColor(cat.score) }}>{clampScore(cat.score)}/100</span>}
          </div>
          {(cat.checks || []).map((c, j) => {
            const st = STATUS[c.status] || STATUS.warn;
            return (
              <div className="chk" key={j}>
                <span className="chk-dot" style={{ background: st.c }} />
                <span className="chk-l">{c.label}{c.note ? <em> — {c.note}</em> : null}</span>
                {c.value && <span className="chk-v" style={{ color: st.t, background: st.bg }}>{c.value}</span>}
              </div>
            );
          })}
        </div>
      ))}

      {Array.isArray(report.priority) && report.priority.length > 0 && (
        <div className="rpt-priority">
          <div className="rpt-cat-h"><b>{lang === "en" ? "Before you submit" : "Göndermeden önce"}</b></div>
          <ol>{report.priority.map((p, i) => <li key={i}>{p}</li>)}</ol>
        </div>
      )}
      <AuditFooter meta={report._meta} />
    </div>
  );
}
