import React from "react";
import { useLang, currentLang } from "./lang.jsx";
import { ReportBrandHeader, clampScore, scoreColor, StudyClassification, AuditFooter } from "./Report.jsx";
import { computeSim, DECISION_LABEL, decLabel, rdyLabel, gateLabel, potLabel } from "./simEngine.js";

const DEC_COLOR = { ACCEPT: "var(--ok)", MINOR_REVISION: "var(--a2)", MAJOR_REVISION: "#D97A2B", REJECT: "var(--er)" };
/* §23 — Quality Map: click a dimension to drill into its evidence. */
const dimId = (d) => `dim-${String(d.key || d.name || "").replace(/\s+/g, "-").toLowerCase()}`;
function drillToDim(d) {
  const el = document.getElementById(dimId(d));
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("dim-flash");
  setTimeout(() => el.classList.remove("dim-flash"), 1200);
}
function ReviewPanel({ panel }) {
  const { lang } = useLang();
  const list = (Array.isArray(panel) ? panel : []).filter((p) => p && p.role && p.decisionCode);
  if (list.length < 2) return null;
  const codes = new Set(list.map((p) => p.decisionCode));
  const dissent = codes.size > 1;
  return (
    <div className="rpanel">
      <div className="rpanel-h"><b>{lang === "en" ? "Reviewer Panel" : "Hakem Paneli"}</b>{dissent && <span className="rpanel-dissent">{lang === "en" ? "Experts disagree" : "Uzmanlar arasında görüş ayrılığı"}</span>}</div>
      {list.map((p, i) => (
        <div className="rpanel-row" key={i}>
          <span className="rpanel-role">{p.role}</span>
          <span className="rpanel-dec" style={{ color: DEC_COLOR[p.decisionCode] || "var(--k3)", borderColor: DEC_COLOR[p.decisionCode] || "var(--ln)" }}>{decLabel(p.decisionCode, lang)}</span>
          {p.concern && <span className="rpanel-concern">{p.concern}</span>}
        </div>
      ))}
    </div>
  );
}

/* Hakem Simülasyonu — multi-dimension scored review with a radar chart.
   Rendered in the app and (via history) reused. Mirrors the competitor's
   "radar + genel skor + yayın potansiyeli" experience, in Presubly's brand. */

const STATUS = { pass: "var(--ok)", warn: "var(--wn)", fail: "var(--er)" };
const pubColor = (p) => (/yüksek/i.test(p) ? "var(--ok)" : /orta/i.test(p) ? "var(--wn)" : "var(--er)");

/* Circular score ring (donut). */
function ScoreRing({ score, size = 108 }) {
  const s = clampScore(score) ?? 0;
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const col = scoreColor(s);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ln2)" strokeWidth="8" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - s / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset .8s ease" }} />
      <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fontFamily="var(--fd)" fontWeight="700" fontSize="30" fill="var(--ink)">{s}</text>
      <text x="50%" y="66%" textAnchor="middle" fontFamily="var(--fm)" fontSize="9" fill="var(--k4)">/100</text>
    </svg>
  );
}

/* Radar / spider chart over the dimension scores. */
function Radar({ dims, size = 300 }) {
  const cx = size / 2, cy = size / 2, R = size / 2 - 46;
  const N = dims.length;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / N;
  const pt = (i, rr) => [cx + rr * Math.cos(ang(i)), cy + rr * Math.sin(ang(i))];
  const rings = [0.25, 0.5, 0.75, 1];
  const poly = (rr) => dims.map((_, i) => pt(i, rr).join(",")).join(" ");
  const dataPoly = dims.map((d, i) => pt(i, R * (clampScore(d.score) ?? 0) / 100).join(",")).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: size }}>
      {rings.map((rr, k) => (
        <polygon key={k} points={poly(R * rr)} fill="none" stroke="var(--ln)" strokeWidth="1" />
      ))}
      {dims.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--ln2)" strokeWidth="1" />; })}
      <polygon points={dataPoly} fill="rgba(21,107,107,.22)" stroke="var(--tl)" strokeWidth="2" />
      {dims.map((d, i) => { const [x, y] = pt(i, R * (clampScore(d.score) ?? 0) / 100); return <circle key={i} cx={x} cy={y} r="3" fill="var(--tl)" />; })}
      {dims.map((d, i) => {
        const [x, y] = pt(i, R + 22);
        const anchor = Math.abs(x - cx) < 6 ? "middle" : x > cx ? "start" : "end";
        return (
          <text key={i} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontFamily="var(--fb)" fontSize="10.5" fontWeight="600" fill="var(--k3)">
            {d.name}
            <tspan x={x} dy="12" fontFamily="var(--fm)" fontSize="9" fill={scoreColor(d.score)}>{clampScore(d.score)}</tspan>
          </text>
        );
      })}
    </svg>
  );
}

export function simToMarkdown(sim) {
  const lang = currentLang();
  const en = lang === "en";
  const R = computeSim(sim);
  const cl = sim.classification;
  const clLine = cl ? `**${en ? "Detected design" : "Tespit edilen tasarım"}:** ${[cl.discipline, cl.field, cl.methodology, cl.design].filter(Boolean).join(" · ")}${typeof cl.confidence === "number" ? (en ? ` (confidence ${clampScore(cl.confidence)}%)` : ` (güven %${clampScore(cl.confidence)})`) : ""}` : null;
  const lines = [
    `# Presubly · ${en ? "Reviewer Simulation" : "Hakem Simülasyonu"}`, ``,
    `**${en ? "Overall score" : "Genel skor"}:** ${R.total}/100 (${R.grade}) — ${en ? "Publication potential" : "Yayın potansiyeli"}: ${potLabel(R.potential, lang)}`,
    `**${en ? "Reviewer decision (sim.)" : "Hakem kararı (sim.)"}:** ${decLabel(R.decisionCode, lang)} · ${rdyLabel(R.readiness, lang)}`,
    ...(clLine ? [clLine] : []), ``,
  ];
  if (R.triggered.length) {
    lines.push(`## ⚠ ${en ? "Critical Gates" : "Kritik Kapılar"} (${R.triggered.length})`);
    R.triggered.forEach((g) => lines.push(`- **${gateLabel(g.code, g.label, lang)}**${g.evidence ? ` — ${g.evidence}` : ""}`));
    lines.push("");
  }
  if (sim.summary) lines.push(sim.summary, ``);
  if (Array.isArray(sim.strengths) && sim.strengths.length) {
    lines.push(`## ${en ? "Strengths" : "Güçlü Yönler"}`);
    sim.strengths.forEach((s) => lines.push(`- ${s}`));
    lines.push("");
  }
  if (Array.isArray(sim.panel) && sim.panel.length >= 2) {
    lines.push(`## ${en ? "Reviewer Panel" : "Hakem Paneli"}`);
    sim.panel.forEach((p) => { if (p && p.role) lines.push(`- **${p.role}:** ${decLabel(p.decisionCode, lang) || p.decisionCode || "—"}${p.concern ? ` — ${p.concern}` : ""}`); });
    lines.push("");
  }
  lines.push(`## ${en ? "Dimension Assessments" : "Boyut Değerlendirmeleri"}`, ``);
  (sim.dimensions || []).forEach((d) => {
    lines.push(`### ${d.name} — ${clampScore(d.score)}/100`);
    if (d.summary) lines.push(d.summary);
    (d.findings || []).forEach((f) => lines.push(`- ${en ? "Finding" : "Bulgu"}: ${f}`));
    (d.suggestions || []).forEach((s) => lines.push(`- ${en ? "Suggestion" : "Öneri"}: ${s}`));
    lines.push("");
  });
  if (Array.isArray(sim.priority) && sim.priority.length) {
    lines.push(`## ${en ? "Before You Submit (Priority Actions)" : "Göndermeden Önce (Öncelikli İşler)"}`);
    sim.priority.forEach((p, i) => lines.push(`${i + 1}. ${p}`));
    lines.push("");
  }
  const comments = Array.isArray(sim.comments) ? sim.comments : Array.isArray(sim.highlights) ? sim.highlights : [];
  if (comments.length) {
    lines.push(`## ${en ? "Presubly Reviewer Comments" : "Presubly Hakem Yorumları"}`, ``);
    comments.forEach((c, i) => {
      const sev = (c.severity || "öneri");
      lines.push(`**P${i + 1} · ${sev}${c.section ? " · " + c.section : ""}** — "${String(c.quote || "").trim()}"`);
      if (c.issue || c.note) lines.push(`${en ? "Issue" : "Sorun"}: ${c.issue || c.note}`);
      if (c.suggestion) lines.push(`${en ? "Suggestion" : "Öneri"}: ${c.suggestion}`);
      lines.push("");
    });
  }
  lines.push("---", `Presubly · presubly.com — ${new Date().toLocaleDateString(en ? "en-US" : "tr-TR")}`);
  return lines.join("\n");
}

export function downloadSim(sim) {
  const blob = new Blob([simToMarkdown(sim)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "presubly-hakem-simulasyonu.md"; a.click();
  URL.revokeObjectURL(url);
}

export function SimReport({ sim, onDownload, actions }) {
  const { lang } = useLang();
  const dims = Array.isArray(sim.dimensions) ? sim.dimensions : [];
  const R = computeSim(sim);                    // deterministic: total, decision, gates
  const pub = R.potential;

  return (
    <div className="card result on printable">
      <ReportBrandHeader title={lang === "en" ? "Reviewer Simulation" : "Hakem Simülasyonu"} />
      <StudyClassification c={sim.classification} />

      <div className="sim-top">
        <ScoreRing score={R.total} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span className="rpt-grade" style={{ width: 40, height: 40, fontSize: 17, background: scoreColor(R.total) }}>{R.grade}</span>
            <div>
              <div style={{ fontFamily: "var(--fm)", fontSize: 10, letterSpacing: ".08em", color: "var(--k4)" }}>{lang === "en" ? "REVIEWER DECISION (SIM.)" : "HAKEM KARARI (SİM.)"}</div>
              <div style={{ fontFamily: "var(--fd)", fontSize: 18, fontWeight: 700, color: R.peerReviewReady ? "var(--ok)" : "var(--er)" }}>{decLabel(R.decisionCode, lang)}</div>
            </div>
          </div>
          <div className="pub-bar">
            {["düşük", "orta", "yüksek"].map((lv, i) => {
              const cur = ["düşük", "orta", "yüksek"].indexOf(pub.toLowerCase());
              return <div key={lv} className="pub-seg" style={{ background: i <= cur ? pubColor(pub) : "var(--ln2)" }} title={lv} />;
            })}
          </div>
          <div style={{ marginTop: 9, display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700 }}>
            <span style={{ padding: "3px 11px", borderRadius: 999, background: R.peerReviewReady ? "var(--okl)" : "var(--erl)", color: R.peerReviewReady ? "var(--ok)" : "var(--er)" }}>
              {R.peerReviewReady ? "✓ " : "⚠ "}{rdyLabel(R.readiness, lang)}
            </span>
            <span style={{ fontFamily: "var(--fm)", fontSize: 10.5, color: "var(--k5)" }}>{lang === "en" ? "Publication potential" : "Yayın potansiyeli"}: {potLabel(pub, lang)}</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--k3)", lineHeight: 1.6, marginTop: 10 }}>{sim.summary}</p>
        </div>
        <div className="res-actions">{actions}<button className="res-dl" onClick={onDownload}>{lang === "en" ? "download .md" : ".md indir"}</button></div>
      </div>

      {R.triggered.length > 0 && (
        <div className="sim-gates">
          <div className="sim-gates-h"><b>⚠ {lang === "en" ? "Critical Gates" : "Kritik Kapılar"}</b><span>{R.triggered.length} {lang === "en" ? "blocking issues · score-independent" : "engelleyici sorun · puandan bağımsız"}</span></div>
          {R.triggered.map((g) => (
            <div className="sim-gate" key={g.code}>
              <span className="sim-gate-dot" />
              <div><b>{gateLabel(g.code, g.label, lang)}</b>{g.evidence && <p>{g.evidence}</p>}</div>
            </div>
          ))}
        </div>
      )}

      {Array.isArray(sim.strengths) && sim.strengths.length > 0 && (
        <div className="rpt-priority" style={{ borderLeftColor: "var(--ok)" }}>
          <div className="rpt-cat-h"><b>{lang === "en" ? "Strengths" : "Güçlü Yönler"}</b></div>
          <ul>{sim.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}

      <div className="sim-grid">
        <div className="sim-radar"><Radar dims={dims} /></div>
        <div className="sim-bars">
          {dims.map((d) => (
            <div className="sim-brow sim-brow-click" key={d.key || d.name} role="button" tabIndex={0} onClick={() => drillToDim(d)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); drillToDim(d); } }} title={lang === "en" ? "Go to evidence" : "Kanıta git"}>
              <span className="sim-bl">{d.name}</span>
              <div className="sim-bw"><i style={{ width: `${clampScore(d.score)}%`, background: scoreColor(d.score) }} /></div>
              <span className="sim-bv" style={{ color: scoreColor(d.score) }}>{clampScore(d.score)}</span>
            </div>
          ))}
        </div>
      </div>

      <ReviewPanel panel={sim.panel} />

      {dims.map((d) => (
        <div className="rpt-cat" id={dimId(d)} key={(d.key || d.name) + "-detail"}>
          <div className="rpt-cat-h">
            <b>{d.name}</b>
            {typeof d.confidence === "number" && <span style={{ fontFamily: "var(--fm)", fontSize: 10, color: "var(--k5)", marginLeft: "auto", marginRight: 8 }} title={lang === "en" ? "Model confidence in this score" : "Modelin bu puandan güveni"}>{lang === "en" ? `confidence ${clampScore(d.confidence)}%` : `güven %${clampScore(d.confidence)}`}</span>}
            <span style={{ color: scoreColor(d.score) }}>{clampScore(d.score)}/100</span>
          </div>
          {d.summary && <p style={{ fontSize: 12.5, color: "var(--k3)", lineHeight: 1.55, margin: "0 0 6px" }}>{d.summary}</p>}
          {(d.findings || []).map((f, i) => (
            <div className="chk" key={"f" + i}><span className="chk-dot" style={{ background: STATUS.warn }} /><span className="chk-l">{f}</span></div>
          ))}
          {(d.suggestions || []).map((s, i) => (
            <div className="chk" key={"s" + i}><span className="chk-dot" style={{ background: STATUS.pass }} /><span className="chk-l"><em style={{ color: "var(--k4)", fontStyle: "normal" }}>{lang === "en" ? "Suggestion:" : "Öneri:"}</em> {s}</span></div>
          ))}
        </div>
      ))}

      {Array.isArray(sim.priority) && sim.priority.length > 0 && (
        <div className="rpt-priority">
          <div className="rpt-cat-h"><b>{lang === "en" ? "Before you submit" : "Göndermeden önce"}</b></div>
          <ol>{sim.priority.map((p, i) => <li key={i}>{p}</li>)}</ol>
        </div>
      )}
      <AuditFooter meta={sim._meta} />
    </div>
  );
}
