/* §4 — runtime output contracts.
 *
 * The app is JSX (no compile-time types), so we validate & normalise every AI
 * JSON payload before it reaches the renderer/engine: clamp out-of-range scores,
 * coerce arrays, drop malformed entries, normalise enums. A structurally invalid
 * payload (e.g. a sim with no dimensions) returns null so the caller falls back
 * to the "couldn't process" path instead of rendering garbage.
 */

const num = (x, lo = 0, hi = 100) => { const n = Math.round(Number(x)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : null; };
const str = (x) => (typeof x === "string" ? x : x == null ? "" : String(x));
const arr = (x) => (Array.isArray(x) ? x : []);
const strArr = (x) => arr(x).filter((v) => typeof v === "string" && v.trim()).map((v) => v.trim());

function normCls(c) {
  if (!c || typeof c !== "object") return null;
  const o = { discipline: str(c.discipline), field: str(c.field), studyFamily: str(c.studyFamily), methodology: str(c.methodology), design: str(c.design), confidence: num(c.confidence) };
  return (o.discipline || o.methodology || o.design) ? o : null;
}

export function normalizeSim(o) {
  if (!o || typeof o !== "object") return null;
  const dimensions = arr(o.dimensions)
    .map((d) => (d && typeof d === "object" ? {
      key: str(d.key), name: str(d.name) || str(d.key),
      score: num(d.score) ?? 0, confidence: num(d.confidence),
      summary: str(d.summary), findings: strArr(d.findings), suggestions: strArr(d.suggestions),
    } : null))
    .filter((d) => d && (d.name || d.key));
  if (!dimensions.length) return null;                       // not a usable sim payload
  const gates = arr(o.gates).filter((g) => g && typeof g === "object" && g.code)
    .map((g) => ({ code: str(g.code), status: str(g.status), evidence: str(g.evidence), note: str(g.note) }));
  const panel = arr(o.panel).filter((p) => p && p.role && p.decisionCode)
    .map((p) => ({ role: str(p.role), decisionCode: str(p.decisionCode).toUpperCase().replace(/\s+/g, "_"), concern: str(p.concern) }));
  return {
    classification: normCls(o.classification),
    summary: str(o.summary),
    strengths: strArr(o.strengths),
    panel,
    dimensions,
    gates,
    priority: strArr(o.priority),
    comments: arr(o.comments),        // Comments.getComments() normalises further
  };
}

export function normalizeCoverletter(o) {
  if (!o || typeof o !== "object") return null;
  const letter = str(o.letter);
  if (!letter) return null;
  return { letter, placeholders: strArr(o.placeholders), keyPoints: strArr(o.keyPoints) };
}

export function normalizeResponse(o) {
  if (!o || typeof o !== "object") return null;
  const CLS = new Set(["ACCEPT", "PARTIAL", "REBUT", "CLARIFY"]);
  const responses = arr(o.responses).filter((x) => x && typeof x === "object")
    .map((x) => {
      const cl = str(x.classification).toUpperCase();
      return { reviewer: str(x.reviewer), comment: str(x.comment), classification: CLS.has(cl) ? cl : "CLARIFY", response: str(x.response), change: str(x.change), location: str(x.location) };
    })
    .filter((x) => x.comment || x.response);
  if (!responses.length) return null;
  return { summary: str(o.summary), responses };
}

export function normalizeEditorial(o) {
  if (!o || typeof o !== "object") return null;
  const DEC = new Set(["SEND_TO_REVIEW", "REVISION_BEFORE_REVIEW", "DESK_REJECT", "OUT_OF_SCOPE", "INSUFFICIENT_EVIDENCE"]);
  const SF = new Set(["HIGH", "PARTIAL", "LOW", "UNKNOWN"]);
  const VALID = new Set(["pass", "warn", "fail", "unknown"]);
  const dc = str(o.decisionCode).toUpperCase().replace(/\s+/g, "_");
  const sf = str(o.scopeFit).toUpperCase();
  const ethics = arr(o.ethics).filter((k) => k && typeof k === "object")
    .map((k) => ({ label: str(k.label), status: VALID.has(String(k.status).toLowerCase()) ? String(k.status).toLowerCase() : "warn", note: str(k.note) }))
    .filter((k) => k.label);
  const letter = str(o.letter);
  if (!DEC.has(dc) && !letter && !ethics.length) return null;   // not a usable editorial payload
  return {
    decisionCode: DEC.has(dc) ? dc : "INSUFFICIENT_EVIDENCE",
    scopeFit: SF.has(sf) ? sf : "UNKNOWN",
    scopeNotes: str(o.scopeNotes), summary: str(o.summary), rationale: str(o.rationale),
    ethics, priority: strArr(o.priority), letter,
  };
}

export function normalizeReadiness(o) {
  if (!o || typeof o !== "object") return null;
  const VALID = new Set(["pass", "warn", "fail", "unknown"]);
  const categories = arr(o.categories)
    .map((c) => (c && typeof c === "object" ? {
      name: str(c.name), score: num(c.score),
      checks: arr(c.checks).filter((k) => k && typeof k === "object")
        .map((k) => ({ label: str(k.label), status: VALID.has(String(k.status).toLowerCase()) ? String(k.status).toLowerCase() : "warn", value: str(k.value), note: str(k.note) }))
        .filter((k) => k.label),
    } : null))
    .filter((c) => c && c.name);
  if (!categories.length) return null;
  let journalFit = null;
  if (o.journalFit && typeof o.journalFit === "object") {
    const f = {};
    ["topicFit", "articleTypeFit", "methodFit", "audienceFit", "policyFit", "overallFit"].forEach((k) => { const n = num(o.journalFit[k]); if (n != null) f[k] = n; });
    f.notes = str(o.journalFit.notes);
    if (Object.keys(f).length > 1) journalFit = f;
  }
  return {
    classification: normCls(o.classification),
    score: num(o.score) ?? 0,
    grade: str(o.grade),
    decision: str(o.decision),
    summary: str(o.summary),
    categories,
    priority: strArr(o.priority),
    comments: arr(o.comments),
    journalFit,
  };
}
