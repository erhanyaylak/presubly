/* Presubly Evaluation Harness — §22.
 *
 * Measures INTER-RUN STABILITY (no human labels needed): runs the Hakem
 * Simülasyonu prompt K times on a fixed manuscript and reports how much the
 * deterministic total score, decision, and per-dimension scores vary between
 * runs. Low variance = a stable, trustworthy evaluator.
 *
 * The label-dependent metrics from the analysis (finding precision, critical
 * recall, evidence accuracy, severity agreement, decision calibration) require
 * a human-labelled benchmark set; add that dataset here when available. This
 * harness gives the one metric that is measurable today.
 *
 * Usage (from presubly-app/):
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/eval-harness.mjs [K]
 * If ANTHROPIC_API_KEY is unset it falls back to a local .dev.vars.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOOLS } from "../presubly-config.js";
import { computeSim } from "../simEngine.js";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const K = Math.max(2, parseInt(process.argv[2] || "3", 10) || 3);

function readKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY.trim();
  for (const p of [path.join(__dir, "..", ".dev.vars")]) {
    try { const m = fs.readFileSync(p, "utf8").match(/^ANTHROPIC_API_KEY=(.*)$/m); if (m) return m[1].trim().replace(/^"|"$/g, ""); } catch { /* ignore */ }
  }
  return "";
}
const KEY = readKey();
const MODEL = process.env.AI_MODEL || "claude-sonnet-5";

const SAMPLE = `Başlık: Üniversite öğrencilerinde sınav kaygısı ile akademik erteleme arasındaki ilişki.
Özet: Bu çalışma sınav kaygısı ile akademik erteleme davranışı arasındaki ilişkiyi incelemektedir.
Yöntem: İlişkisel tarama modeli. 240 lisans öğrencisine Sınav Kaygısı Ölçeği ve Akademik Erteleme Ölçeği uygulandı. Örneklem uygun örnekleme ile seçildi; güç analizi yapılmadı. Etik kurul onayı metinde belirtilmedi.
Bulgular: Sınav kaygısı ile erteleme arasında orta düzeyde pozitif korelasyon (r=.42, p<.01). Regresyon analizinde kaygı, ertelemenin anlamlı yordayıcısıydı (β=.39).
Tartışma: Bulgular ilgili literatürle tutarlıdır. Kaygı yönetimi müdahaleleri erteleme davranışını azaltabilir.
Sınırlılıklar: Kesitsel tasarım nedensellik sınırlar. Öz-bildirim ölçekleri kullanıldı.`;

function extractText(data) {
  return (Array.isArray(data?.content) ? data.content.filter((c) => c?.type === "text").map((c) => c.text || "").join("") : "") || "";
}
function looseJSON(text) {
  try { return JSON.parse(text.trim()); } catch { /* try below */ }
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* below */ } }
  // minimal truncation repair
  const s = text.slice(text.indexOf("{"));
  const stack = []; let inStr = false, esc = false, out = "";
  for (const ch of s) {
    if (inStr) { out += ch; if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true; else if (ch === "{") stack.push("}"); else if (ch === "[") stack.push("]"); else if (ch === "}" || ch === "]") stack.pop();
    out += ch;
  }
  if (inStr) out += '"'; out = out.replace(/,\s*$/, ""); for (let i = stack.length - 1; i >= 0; i--) out += stack[i];
  try { return JSON.parse(out); } catch { return null; }
}
async function callSim(sys) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 12000, system: sys, messages: [{ role: "user", content: SAMPLE }] }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`HTTP ${r.status} ${JSON.stringify(data?.error || data).slice(0, 160)}`);
  return looseJSON(extractText(data));
}
const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
const stdev = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
const mode = (a) => { const c = {}; a.forEach((x) => (c[x] = (c[x] || 0) + 1)); return Object.entries(c).sort((x, y) => y[1] - x[1])[0]; };

(async () => {
  if (!KEY) { console.error("ANTHROPIC_API_KEY yok (env veya .dev.vars)."); process.exit(1); }
  const sim = TOOLS.find((t) => t.id === "sim");
  console.log(`Presubly Eval Harness · inter-run stability · K=${K} · model=${MODEL}\n`);
  const runs = [];
  for (let i = 0; i < K; i++) {
    process.stdout.write(`run ${i + 1}/${K} … `);
    try { const obj = await callSim(sim.system); const R = computeSim(obj); runs.push({ R, obj }); console.log(`skor ${R.total} · ${R.decisionCode} · hazır=${R.peerReviewReady}`); }
    catch (e) { console.log("HATA:", e.message); }
  }
  const ok = runs.filter(Boolean);
  if (ok.length < 2) { console.error("\nYeterli başarılı run yok."); process.exit(1); }
  const totals = ok.map((r) => r.R.total);
  const decisions = ok.map((r) => r.R.decisionCode);
  const [modeDec, modeN] = mode(decisions);
  const dimKeys = ["icerik", "yontem", "yapi", "arguman", "literatur", "atif", "risk", "okuma"];
  console.log(`\n── Kararlılık ──`);
  console.log(`Toplam skor: ort ${mean(totals).toFixed(1)} · std ${stdev(totals).toFixed(2)} · aralık ${Math.min(...totals)}-${Math.max(...totals)}`);
  console.log(`Karar uyumu: ${modeN}/${ok.length} run → ${modeDec} (${((modeN / ok.length) * 100).toFixed(0)}%)`);
  console.log(`Boyut skoru std (yüksek = kararsız):`);
  dimKeys.forEach((k) => {
    const vals = ok.map((r) => (r.obj.dimensions || []).find((d) => d.key === k)?.score).filter((x) => typeof x === "number");
    if (vals.length >= 2) console.log(`  ${k.padEnd(10)} std ${stdev(vals).toFixed(1)} (${Math.min(...vals)}-${Math.max(...vals)})`);
  });
  const commentCounts = ok.map((r) => (r.obj.comments || []).length);
  console.log(`Yorum sayısı: ${Math.min(...commentCounts)}-${Math.max(...commentCounts)}`);
  console.log(`\nDüşük std + yüksek karar uyumu = kararlı, güvenilir değerlendirici.`);
})();
