import { renderMarkdown } from "./md.js";

/* Multi-format report export: Markdown (elsewhere), Word (.doc HTML), PDF (print).
   5 report templates change the exported document's look. QR helper for share links. */

export const TEMPLATES = [
  { id: "bilimsel", name: "Bilimsel" },
  { id: "klasik", name: "Klasik" },
  { id: "modern", name: "Modern" },
  { id: "resmi", name: "Resmi" },
  { id: "veri", name: "Veri Odaklı" },
];

const TEMPLATE_CSS = {
  bilimsel: `body{font-family:Georgia,'Times New Roman',serif;color:#0A1A14;line-height:1.7}
    h1,h2,h3{font-family:Georgia,serif;color:#0A3D3D} h2{border-bottom:1px solid #C8DAD2;padding-bottom:4px}`,
  klasik: `body{font-family:'Times New Roman',serif;color:#111;line-height:1.6}
    h1,h2,h3{font-family:'Times New Roman',serif;color:#111} h2{text-transform:none}`,
  modern: `body{font-family:'Segoe UI',Arial,sans-serif;color:#0A1A14;line-height:1.7}
    h1,h2,h3{font-family:'Segoe UI',Arial,sans-serif;color:#0A3D3D} h2{color:#0A3D3D;border-left:4px solid #E8970A;padding-left:10px}`,
  resmi: `body{font-family:Cambria,Georgia,serif;color:#1A1A1A;line-height:1.65}
    h1,h2,h3{font-family:Cambria,serif;color:#003C71} h2{color:#003C71}`,
  veri: `body{font-family:Arial,sans-serif;color:#0A1A14;line-height:1.55}
    h1,h2,h3{font-family:'Consolas','Courier New',monospace;color:#0A3D3D;letter-spacing:.02em}
    li{margin:2px 0}`,
};

function docHtml(mdText, title, template, docTitle) {
  const css = TEMPLATE_CSS[template] || TEMPLATE_CSS.bilimsel;
  const body = renderMarkdown(mdText || "");
  const date = new Date().toLocaleDateString("tr-TR");
  return `<!doctype html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${escapeHtml(docTitle || title)}</title>
<style>@page{margin:2.2cm} ${css}
.hdr{border-bottom:2px solid #0A3D3D;padding-bottom:8px;margin-bottom:18px}
.hdr .b{font-family:Georgia,serif;font-size:20px;font-weight:700;color:#0A3D3D}
.hdr .b i{color:#E8970A;font-style:italic}
.hdr .s{font-size:11px;color:#6A8A7C}
.ft{margin-top:26px;border-top:1px solid #C8DAD2;padding-top:8px;font-size:10px;color:#6A8A7C}
code{font-family:Consolas,monospace;background:#F2F7F5;padding:1px 4px}</style></head>
<body><div class="hdr"><div class="b">Pre<i>subly</i> · ${escapeHtml(title)}</div><div class="s">presubly.com · ${date}</div></div>
${body}
<div class="ft">Bu rapor Presubly (presubly.com) ile üretilmiştir · ${date}</div>
</body></html>`;
}

function escapeHtml(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

/* Branded report as a self-contained HTML fragment (inline <style>), for rendering
   off-screen into a real PDF. Template `body{}` rules are scoped to `.rpt`. */
function reportInnerHtml(mdText, title, template) {
  const css = (TEMPLATE_CSS[template] || TEMPLATE_CSS.bilimsel).replace(/\bbody\b/g, ".rpt");
  const body = renderMarkdown(mdText || "");
  const date = new Date().toLocaleDateString("tr-TR");
  return `<style>
.rpt{color:#0A1A14}
${css}
.rpt .hdr{border-bottom:2px solid #0A3D3D;padding-bottom:8px;margin-bottom:18px}
.rpt .hdr .b{font-family:Georgia,serif;font-size:20px;font-weight:700;color:#0A3D3D}
.rpt .hdr .b i{color:#E8970A;font-style:italic}
.rpt .hdr .s{font-size:11px;color:#6A8A7C}
.rpt .ft{margin-top:26px;border-top:1px solid #C8DAD2;padding-top:8px;font-size:10px;color:#6A8A7C}
.rpt code{font-family:Consolas,monospace;background:#F2F7F5;padding:1px 4px}
.rpt h1{font-size:21px;margin:0 0 6px} .rpt h2{font-size:16px;margin:16px 0 6px} .rpt h3{font-size:13.5px;margin:12px 0 4px}
.rpt p{margin:0 0 8px} .rpt ul,.rpt ol{margin:0 0 8px;padding-left:22px} .rpt li{margin:3px 0}
.rpt h1,.rpt h2,.rpt h3,.rpt li{page-break-inside:avoid}
</style>
<div class="rpt"><div class="hdr"><div class="b">Pre<i>subly</i> · ${escapeHtml(title)}</div><div class="s">presubly.com · ${date}</div></div>
${body}
<div class="ft">Bu rapor Presubly (presubly.com) ile üretilmiştir · ${date}</div></div>`;
}

export function exportWord(mdText, title, template, filename) {
  const html = docHtml(mdText, title, template);
  const blob = new Blob(["﻿", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = (filename || "presubly-rapor") + ".doc"; a.click();
  URL.revokeObjectURL(url);
}

/* PDF via the browser's own print-to-PDF.
   Why not html2canvas/html2pdf: it rasterises the DOM and reliably produced BLANK
   pages here, and even when it works the output is an image (unselectable text,
   large files). The browser's print engine renders the same branded HTML as a
   real vector PDF — selectable text, correct Turkish glyphs, proper pagination.
   Cost: the user confirms "Kaydet" in the print dialog. The window <title>
   becomes the suggested filename. */
function printHtml(inner, docTitle) {
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${escapeHtml(docTitle)}</title>
<style>@page{margin:1.6cm}
html,body{margin:0;padding:0;background:#fff}
/* keep card/badge backgrounds in the printed PDF */
*{-webkit-print-color-adjust:exact;print-color-adjust:exact}
h1,h2,h3,li{page-break-inside:avoid;break-inside:avoid}
</style></head><body>${inner}</body></html>`;
  const w = window.open("", "_blank", "width=880,height=1040");
  if (!w) { alert("PDF için açılır pencere gerekli — tarayıcıda bu site için pop-up izni verin."); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  let done = false;
  const go = () => { if (done) return; done = true; try { w.print(); } catch { /* ignore */ } };
  w.onload = go;
  setTimeout(go, 700);   // document.write may not fire onload
}

export function exportPdf(mdText, title, template, filename) {
  printHtml(reportInnerHtml(mdText, title, template), filename || "presubly-rapor");
}

/* ── Presubly Yorumlu Nüsha export: manuscript + anchored comment cards ── */
const ANN_SEV = {
  kritik: { c: "#C0392B", bg: "#F8D7D3", label: "Kritik" },
  "uyarı": { c: "#B87808", bg: "#FCEFC7", label: "Uyarı" },
  "öneri": { c: "#0A3D3D", bg: "#D8EDE8", label: "Öneri" },
};
const annSev = (s) => ANN_SEV[String(s || "").toLowerCase()] || ANN_SEV["öneri"];

function annDoc(text, comments) {
  let esc = escapeHtml(text);
  comments.forEach((c, i) => {
    const q = escapeHtml(String(c.quote || "").trim());
    if (q.length < 4) return;
    const idx = esc.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return;
    const s = annSev(c.severity);
    esc = esc.slice(0, idx) + `<mark style="background:${s.bg};border-radius:3px;padding:0 2px">` + esc.slice(idx, idx + q.length) + `</mark><sup style="color:${s.c};font-weight:700;font-size:9px">[P${i + 1}]</sup>` + esc.slice(idx + q.length);
  });
  return esc.replace(/\n/g, "<br/>");
}
function annCards(comments) {
  return comments.map((c, i) => {
    const s = annSev(c.severity);
    const ev = c._verified ? `<span style="font-family:'DM Mono',monospace;font-size:9px;font-weight:700;color:#1A8A52;background:#E8F7EE;border-radius:4px;padding:1px 5px;margin-left:6px">kanıt ✓</span>` : "";
    return `<div style="border:1px solid #D4DDD8;border-left:3px solid ${s.c};border-radius:8px;padding:9px 12px;margin:0 0 8px;background:#fff">
<div style="font-family:'DM Mono',monospace;font-size:10px;font-weight:700;color:${s.c};margin-bottom:4px">P${i + 1} · ${s.label}${c.section ? ` · ${escapeHtml(c.section)}` : ""}${ev}</div>
<div style="font-size:11px;font-style:italic;color:#4A665A;border-left:2px solid #E1E9E5;padding-left:8px;margin-bottom:5px">&ldquo;${escapeHtml(String(c.quote || "").trim())}&rdquo;</div>
${c.issue ? `<div style="font-size:12px;color:#1A2E26;line-height:1.5;margin-bottom:5px">${escapeHtml(c.issue)}</div>` : ""}
${c.suggestion ? `<div style="font-size:12px;color:#0A1A14;line-height:1.5;background:${s.bg};border-radius:6px;padding:6px 10px"><b style="color:${s.c}">Öneri:</b> ${escapeHtml(c.suggestion)}</div>` : ""}
<div style="font-size:9px;color:#A9C0B6;text-align:right;margin-top:6px">— Presubly Hakem</div></div>`;
  }).join("");
}
function annotatedInner(text, comments) {
  const date = new Date().toLocaleDateString("tr-TR");
  const lc = String(text || "").toLowerCase();
  comments.forEach((c) => { c._verified = String(c.quote || "").trim().length >= 4 && lc.includes(String(c.quote).trim().toLowerCase()); });
  const verified = comments.filter((c) => c._verified).length;
  return `<style>.rpt{font-family:Georgia,serif;color:#0A1A14}
.rpt .hdr{border-bottom:2px solid #0A3D3D;padding-bottom:8px;margin-bottom:16px}
.rpt .hdr .b{font-family:Georgia,serif;font-size:20px;font-weight:700;color:#0A3D3D}
.rpt .hdr .b i{color:#E8970A;font-style:italic}
.rpt .hdr .s{font-size:11px;color:#6A8A7C}
.rpt h2{font-family:Georgia,serif;color:#0A3D3D;font-size:16px;border-bottom:1px solid #C8DAD2;padding-bottom:4px;margin:20px 0 12px}
.rpt .doc{font-size:12.5px;line-height:1.95;color:#1A2E26}
.rpt .ft{margin-top:22px;border-top:1px solid #C8DAD2;padding-top:8px;font-size:10px;color:#6A8A7C}</style>
<div class="rpt"><div class="hdr"><div class="b">Pre<i>subly</i> · Yorumlu Nüsha</div><div class="s">presubly.com · ${date}</div></div>
<h2>Makale (işaretli)</h2><div class="doc">${annDoc(text, comments)}</div>
<h2>Presubly Hakem Yorumları · ${comments.length} <span style="font-size:11px;color:#1A8A52;font-weight:600">(${verified} kanıt doğrulandı)</span></h2>${annCards(comments)}
<div class="ft">Bu yorumlu nüsha Presubly (presubly.com) ile üretilmiştir · ${date}</div></div>`;
}

export function exportAnnotatedWord(text, comments, filename) {
  const html = `<!doctype html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${escapeHtml(filename || "presubly-yorumlu-nusha")}</title><style>@page{margin:2cm}</style></head><body>${annotatedInner(text, comments)}</body></html>`;
  const blob = new Blob(["﻿", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = (filename || "presubly-yorumlu-nusha") + ".doc"; a.click();
  URL.revokeObjectURL(url);
}

export function exportAnnotatedPdf(text, comments, filename) {
  printHtml(annotatedInner(text, comments), filename || "presubly-yorumlu-nusha");
}

/* QR data-URL for a share link (dynamic import keeps qrcode out of the main bundle). */
export async function makeQR(text) {
  const QR = (await import("qrcode")).default;
  return QR.toDataURL(text, { margin: 1, width: 200, color: { dark: "#0A3D3D", light: "#ffffff" } });
}
