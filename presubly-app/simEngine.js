/* Deterministic decision engine for the Hakem Simülasyonu.
 *
 * Principle (§8): the AI OBSERVES — it scores each dimension (0-100) with a
 * confidence, supplies evidence, and reports a fixed set of CRITICAL GATES.
 * The application DECIDES — it computes the weighted total, applies critical
 * gates, and maps to a structured decision code. The model never returns the
 * total score or the final decision; those are computed here so they are
 * reproducible and explainable.
 */

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));

/* Dimension weights (sum = 100). Keys must match the model's dimension keys. */
export const SIM_WEIGHTS = {
  icerik: 16,    // İçerik & Özgünlük
  yontem: 20,    // Yöntem (en ağır)
  yapi: 10,      // Yapı & Kurgu
  arguman: 14,   // Argüman & Kanıt
  literatur: 12, // Literatür & Konumlandırma
  atif: 8,       // Atıf & Kaynakça
  risk: 12,      // Etik & Risk
  okuma: 8,      // Dil & Okunabilirlik
};

/* Critical gates — reported by the model per code, decided here (§9). A
   triggered hard gate blocks "peer-review ready" regardless of the score. */
export const SIM_GATES = [
  { code: "STUDY_TYPE_UNCLEAR", label: "Çalışma türü belirlenemiyor" },
  { code: "METHOD_DATA_MISMATCH", label: "Yöntem/analiz veriyle uyumsuz" },
  { code: "NO_ETHICS_APPROVAL", label: "Gerekli etik onay bilgisi yok" },
  { code: "CLAIMS_UNSUPPORTED", label: "Bulgular verilerle desteklenmiyor" },
  { code: "CORE_SECTION_MISSING", label: "Temel raporlama bölümü eksik" },
];
const GATE_LABEL = Object.fromEntries(SIM_GATES.map((g) => [g.code, g.label]));

/* Structured decision codes (§3) + Turkish display labels. */
export const DECISION_LABEL = {
  ACCEPT: "Kabul",
  MINOR_REVISION: "Küçük Revizyon",
  MAJOR_REVISION: "Büyük Revizyon",
  REJECT: "Ret önerisi",
};
export const READINESS_LABEL = {
  READY: "Gönderime hazır",
  MINOR: "Küçük revizyonla hazır",
  NOT_READY: "Hakem değerlendirmesine hazır değil",
};

/* English display labels (render-time selection; engine still returns TR). */
export const DECISION_LABEL_EN = {
  ACCEPT: "Accept", MINOR_REVISION: "Minor Revision", MAJOR_REVISION: "Major Revision", REJECT: "Reject recommendation",
};
export const READINESS_LABEL_EN = {
  READY: "Ready to submit", MINOR: "Ready with minor revisions", NOT_READY: "Not ready for peer review",
};
export const GATE_LABEL_EN = {
  STUDY_TYPE_UNCLEAR: "Study type cannot be determined",
  METHOD_DATA_MISMATCH: "Method/analysis inconsistent with the data",
  NO_ETHICS_APPROVAL: "Required ethics-approval information is missing",
  CLAIMS_UNSUPPORTED: "Findings are not supported by the data",
  CORE_SECTION_MISSING: "A core reporting section is missing",
};
export const POTENTIAL_EN = { "Yüksek": "High", "Orta": "Medium", "Düşük": "Low" };
export const decLabel = (code, lang) => (lang === "en" ? DECISION_LABEL_EN[code] || code : DECISION_LABEL[code] || code);
export const rdyLabel = (code, lang) => (lang === "en" ? READINESS_LABEL_EN[code] || code : READINESS_LABEL[code] || code);
export const gateLabel = (code, trLabel, lang) => (lang === "en" ? GATE_LABEL_EN[code] || trLabel : trLabel);
export const potLabel = (p, lang) => (lang === "en" ? POTENTIAL_EN[p] || p : p);

function normGateStatus(s) {
  const v = String(s || "").toLowerCase();
  if (v.includes("trigger") || v === "fail" || v.includes("var") || v === "evet") return "triggered";
  if (v.includes("not_det") || v.includes("determin") || v.includes("tespit")) return "not_determinable";
  return "clear";
}

/* The single source of truth for the final numbers & decision. Pure function. */
export function computeSim(sim) {
  const dims = Array.isArray(sim?.dimensions) ? sim.dimensions.filter((d) => d && d.score != null) : [];

  // Weighted total (normalised to 0-100 over the weights actually present).
  let acc = 0, wsum = 0;
  dims.forEach((d) => {
    const w = SIM_WEIGHTS[d.key] != null ? SIM_WEIGHTS[d.key] : 100 / 8;
    acc += (clamp(d.score) / 100) * w;
    wsum += w;
  });
  let total = wsum ? Math.round((acc / wsum) * 100) : null;
  // Backward-compat: old saved reports with no dimensions but a model score.
  if (total == null && sim?.score != null) total = clamp(sim.score);
  if (total == null) total = 0;

  // Critical gates.
  const gates = (Array.isArray(sim?.gates) ? sim.gates : []).map((g) => ({
    code: g.code,
    label: GATE_LABEL[g.code] || g.code,
    status: normGateStatus(g.status),
    evidence: g.evidence || "",
    note: g.note || "",
  })).filter((g) => g.code && GATE_LABEL[g.code]);
  const triggered = gates.filter((g) => g.status === "triggered");

  // Decision (§8): gates override the score band.
  let decisionCode;
  if (triggered.length) decisionCode = total < 55 ? "REJECT" : "MAJOR_REVISION";
  else if (total >= 85) decisionCode = "ACCEPT";
  else if (total >= 70) decisionCode = "MINOR_REVISION";
  else if (total >= 55) decisionCode = "MAJOR_REVISION";
  else decisionCode = "REJECT";

  const readiness = triggered.length ? "NOT_READY" : total >= 85 ? "READY" : total >= 70 ? "MINOR" : "NOT_READY";
  const peerReviewReady = readiness !== "NOT_READY";
  const potential = total >= 80 ? "Yüksek" : total >= 60 ? "Orta" : "Düşük";
  const grade = total >= 85 ? "A" : total >= 75 ? "B+" : total >= 65 ? "B" : total >= 50 ? "C" : "D";

  return {
    total, grade, potential,
    decisionCode, decisionLabel: DECISION_LABEL[decisionCode],
    readiness, readinessLabel: READINESS_LABEL[readiness], peerReviewReady,
    gates, triggered,
  };
}
