/* Extract plain text from an uploaded manuscript file. Heavy parsers (mammoth
   for .docx, pdf.js for .pdf) are loaded on demand so they never bloat the main
   bundle. Returns the extracted text or throws. */

/* §6 — reconstruct a page's STRUCTURE from pdf.js text items (position/size) so
   the model gets sections/paragraphs/pages instead of one flat blob. Items are
   grouped into lines by baseline y, ordered top→bottom, joined left→right;
   large vertical gaps become paragraph breaks and larger fonts become headings.
   (Single-column heuristic; multi-column layouts may interleave.) */
function median(a) { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)] || 0; }
/* Flat join — the pre-§6 extractor; used as a guaranteed fallback. */
function flatPage(items, pageNum) {
  const t = (items || []).map((it) => (it && it.str) || "").join(" ").replace(/[ \t]+/g, " ").trim();
  return t ? `[Sayfa ${pageNum}]\n${t}` : "";
}
/* Try structured extraction; if it throws or yields almost no body, fall back to
   the flat join so a valid text-layer PDF never comes out empty. */
function extractPage(items, pageNum) {
  try {
    const s = structurePage(items, pageNum);
    const body = s.replace(/^\[Sayfa \d+\]\s*/, "").replace(/^##\s*/gm, "").trim();
    if (body.length >= 10) return s;
  } catch { /* fall through to flat */ }
  return flatPage(items, pageNum);
}
function structurePage(items, pageNum) {
  const toks = (items || []).filter((it) => it && typeof it.str === "string" && it.str.length && Array.isArray(it.transform));
  if (!toks.length) return `[Sayfa ${pageNum}]`;
  // O(n) line grouping: bucket by rounded baseline y (a linear scan per token is
  // O(n²) and made large PDFs blow past the read timeout).
  const byY = new Map();
  toks.forEach((it) => {
    const y = it.transform[5], x = it.transform[4];
    const h = it.height || Math.abs(it.transform[3]) || 10;
    const k = Math.round(y / 3);
    let line = byY.get(k) || byY.get(k - 1) || byY.get(k + 1);
    if (!line) { line = { y, hs: [], toks: [] }; byY.set(k, line); }
    line.toks.push({ x, str: it.str }); line.hs.push(h);
  });
  const lines = [...byY.values()];
  lines.sort((a, b) => b.y - a.y);                       // PDF y grows upward → top first
  const lineHs = lines.map((l) => median(l.hs));
  const medH = median(lineHs) || 10;
  const out = [];
  let prevY = null, prevH = null;
  lines.forEach((l) => {
    l.toks.sort((a, b) => a.x - b.x);
    const text = l.toks.map((t) => t.str).join("").replace(/\s+/g, " ").trim();
    if (!text) return;
    const h = median(l.hs);
    if (prevY != null && prevY - l.y > (prevH || h) * 1.7) out.push("");   // paragraph break
    const isHeading = h > medH * 1.22 && text.length <= 90 && /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(text);
    out.push(isHeading ? `## ${text}` : text);
    prevY = l.y; prevH = h;
  });
  return `[Sayfa ${pageNum}]\n${out.join("\n")}`;
}

export async function extractFileText(file) {
  const name = (file.name || "").toLowerCase();

  if (/\.(txt|md|markdown)$/.test(name)) {
    return await file.text();
  }

  if (/\.docx$/.test(name)) {
    const buf = await file.arrayBuffer();
    const mammoth = await import("mammoth");
    const res = await (mammoth.default || mammoth).extractRawText({ arrayBuffer: buf });
    return res.value || "";
  }

  if (/\.pdf$/.test(name)) {
    const buf = await file.arrayBuffer();
    const pdfjs = await import("pdfjs-dist");
    // pdf.js v4 worker is an ES module. Let Vite bundle/instantiate it as a real
    // worker (?worker) — the ?url path can spawn the wrong worker type and hang.
    try {
      const PdfWorker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?worker")).default;
      pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();
    } catch {
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    }
    const doc = await pdfjs.getDocument({ data: buf, disableFontFace: true, isEvalSupported: false }).promise;
    const pages = [];
    let itemCount = 0;
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      itemCount += (content.items || []).length;
      pages.push(extractPage(content.items, i));
    }
    try { await doc.destroy(); } catch { /* ignore */ }
    const out = pages.filter(Boolean).join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
    // eslint-disable-next-line no-console
    console.log(`[pdf] ${doc.numPages} sayfa · ${itemCount} metin öğesi · çıkarılan ${out.length} karakter`);
    return out;
  }

  throw new Error("unsupported");
}
