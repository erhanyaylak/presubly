import { useState } from "react";
import { LayoutList, Quote, ShieldCheck, Library, RefreshCw, Share2, BookOpen, BarChart3, BookMarked, Globe, ArrowRight,
  Sparkles, MessageSquare, ListChecks, FileCheck2, Link2, ScrollText, PenLine, Gauge, Scale, CheckCircle2, AlertTriangle, XCircle, Search, ClipboardList, UploadCloud, SquareTerminal, Mail, MapPin, Menu, X, Send } from "lucide-react";
import { Logo, Wordmark } from "./Brand.jsx";
import Auth from "./Auth.jsx";
import Turnstile, { TURNSTILE_ENABLED } from "./Turnstile.jsx";
import { PLAN_LABEL, PLAN_PRICE, PLAN_FEATURES, PLAN_TAGLINE, PLAN_LABEL_EN, PLAN_FEATURES_EN, PLAN_TAGLINE_EN, PLAN_PRICE_NOTE_EN } from "./plans.js";
import { useLang } from "./lang.jsx";

/* ═══════════════════════════════════════════════════════════
   PRESUBLY · Landing  ·  Official Brand Kit (Green & Gold)
   Layout shaped after desk-ly.com. Pricing lives on its own page,
   reached from the top nav (like Deskly).
   Deep Teal #0A3D3D · Amber #E8970A · Sage #F2F7F5 · Ink #0A1A14
   Playfair Display (display) · DM Sans (UI) · DM Mono (data)
   ═══════════════════════════════════════════════════════════ */

const T = {
  teal: "#0A3D3D", tealMid: "#0D4F4F", tealLight: "#156B6B",
  amber: "#E8970A", amber3: "#FBCA5C", amberSoft: "#FEF8E8", amberDark: "#8A5A00",
  sage: "#F2F7F5", sageDark: "#DCE9E3", ink: "#0A1A14",
  card: "#FFFFFF", line: "#C8DAD2",
  text: "#0A1A14", textMut: "#3A5248", textFaint: "#6A8A7C",
  success: "#0A7A3A", warn: "#8A5A00", error: "#8A1A1A",
};
const F = { d: "'Playfair Display',Georgia,serif", u: "'DM Sans',-apple-system,sans-serif", m: "'DM Mono',ui-monospace,monospace" };

const scrollTo = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth" }); };

const Check = ({ c = T.success, s = 17 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><path d="M20 6L9 17l-5-5" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

const Eyebrow = ({ children }) => (
  <div style={{ fontFamily: F.m, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.amberDark, marginBottom: 10, fontWeight: 500 }}>{children}</div>
);

const SectionHead = ({ kicker, title, sub }) => (
  <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
    <Eyebrow>{kicker}</Eyebrow>
    <h2 style={{ fontFamily: F.d, fontSize: "clamp(28px,4vw,42px)", fontWeight: 700, color: T.ink, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{title}</h2>
    {sub && <p style={{ fontFamily: F.u, fontSize: 15, color: T.textMut, margin: "12px auto 0", lineHeight: 1.6 }}>{sub}</p>}
  </div>
);

function ReportDemo() {
  const rows = [
    { s: "pass", l: "APA 7 kaynakça biçimi", v: "32/32 kaynak" },
    { s: "pass", l: "Etik beyanı & onay belgesi", v: "Mevcut" },
    { s: "pass", l: "Başlık sayfası & yazar bilgileri", v: "Tam" },
    { s: "warn", l: "Özet kelime sınırı", v: "267/250" },
    { s: "fail", l: "Benzerlik oranı eşiği", v: "%23 > %20" },
    { s: "pass", l: "Tablo & şekil altyazıları", v: "8/8 etiketli" },
  ];
  const col = (s) => (s === "pass" ? T.success : s === "warn" ? T.amber : T.error);
  return (
    <div style={{ maxWidth: 560, margin: "52px auto 0", background: T.card, borderRadius: 16, boxShadow: "0 44px 90px -40px rgba(0,0,0,.5)", textAlign: "left", overflow: "hidden", border: "1px solid rgba(255,255,255,.14)" }}>
      <div style={{ height: 4, background: T.amber }} />
      <div style={{ padding: "22px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span style={{ fontFamily: F.m, fontSize: 10, color: T.textFaint, letterSpacing: "0.12em" }}>READINESS REPORT</span>
          <span style={{ marginLeft: "auto", fontFamily: F.m, fontSize: 11, fontWeight: 500, color: T.success, background: "#E8F7EE", padding: "3px 10px", borderRadius: 20 }}>87 · B+</span>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontFamily: F.u, fontSize: 12, color: T.textMut }}>Genel uyumluluk</span><span style={{ fontFamily: F.m, fontSize: 13, color: T.success, fontWeight: 500 }}>87%</span></div>
          <div style={{ height: 6, borderRadius: 3, background: T.sageDark, overflow: "hidden" }}><div style={{ width: "87%", height: "100%", background: `linear-gradient(90deg,${T.tealLight},${T.success})`, borderRadius: 3 }} /></div>
        </div>
        {rows.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: i === 0 ? "none" : `1px solid ${T.line}` }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: col(c.s) }} />
            <span style={{ fontFamily: F.u, fontSize: 12.5, color: T.text, flex: 1 }}>{c.l}</span>
            <span style={{ fontFamily: F.m, fontSize: 11.5, color: col(c.s) }}>{c.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ Araç tanıtım mockup'ları (paperguide tarzı, Presubly marka kiti) ═══ */
const chipS = { fontFamily: F.m, fontSize: 10.5, color: T.textMut, background: T.sage, border: `1px solid ${T.line}`, borderRadius: 20, padding: "4px 9px", display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" };
const Bar = ({ w = "100%", h = 8, c = T.sageDark, r = 4 }) => <div style={{ width: w, height: h, borderRadius: r, background: c }} />;
const ScoreBadge = ({ n, g }) => (
  <span style={{ fontFamily: F.m, fontSize: 11.5, fontWeight: 600, color: T.success, background: "#E8F7EE", padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{n} · {g}</span>
);
const Ring = ({ pct }) => {
  const r = 30, c = 2 * Math.PI * r;
  return (
    <svg width="82" height="82" viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
      <circle cx="40" cy="40" r={r} fill="none" stroke={T.sageDark} strokeWidth="8" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={T.success} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 40 40)" />
      <text x="40" y="40" textAnchor="middle" dominantBaseline="central" fontFamily={F.d} fontSize="19" fontWeight="700" fill={T.ink}>{pct}</text>
    </svg>
  );
};

function MockCard({ label, badge, children, float }) {
  return (
    <div style={{ position: "relative", maxWidth: 440, margin: "0 auto" }}>
      <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, boxShadow: "0 34px 66px -38px rgba(10,26,20,.42)", overflow: "hidden" }}>
        <div style={{ height: 3, background: T.amber }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", borderBottom: `1px solid ${T.line}` }}>
          <span style={{ fontFamily: F.m, fontSize: 10, letterSpacing: "0.1em", color: T.textFaint }}>{label}</span>
          {badge && <span style={{ marginLeft: "auto" }}>{badge}</span>}
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
      {float}
    </div>
  );
}

function SimMock() {
  const scores = [82, 66, 74, 60, 88, 55, 79, 71];
  const labels = ["İçerik", "Yöntem", "Yapı", "Argüman", "Literatür", "Atıf", "Risk", "Dil"];
  const cx = 120, cy = 118, R = 82;
  const pt = (i, r) => { const a = (-90 + i * 45) * Math.PI / 180; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  const ring = (f) => scores.map((_, i) => pt(i, R * f).join(",")).join(" ");
  const poly = scores.map((s, i) => pt(i, R * s / 100).join(",")).join(" ");
  const panel = [["Yöntem", "Minor"], ["İstatistik", "Major"], ["Alan", "Minor"], ["Etik", "Kabul"]];
  const pc = { Minor: T.success, Major: T.amber, Kabul: T.teal };
  return (
    <MockCard label="HAKEM SİMÜLASYONU" badge={<ScoreBadge n="78" g="B" />}>
      <svg viewBox="0 0 240 236" width="100%" style={{ maxWidth: 290, display: "block", margin: "0 auto" }}>
        {[1, 0.66, 0.33].map((f, k) => <polygon key={k} points={ring(f)} fill="none" stroke={T.line} strokeWidth="1" />)}
        {scores.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={T.line} strokeWidth="1" />; })}
        <polygon points={poly} fill="rgba(10,61,61,.15)" stroke={T.teal} strokeWidth="2" />
        {scores.map((s, i) => { const [x, y] = pt(i, R * s / 100); return <circle key={i} cx={x} cy={y} r="3" fill={T.amber} />; })}
        {scores.map((_, i) => { const [x, y] = pt(i, R + 15); return <text key={i} x={x} y={y} fill={T.textMut} fontSize="9" fontFamily={F.m} textAnchor="middle" dominantBaseline="middle">{labels[i]}</text>; })}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12, justifyContent: "center" }}>
        {panel.map(([r, d]) => <span key={r} style={chipS}>{r}<b style={{ color: pc[d], marginLeft: 5, fontWeight: 600 }}>{d}</b></span>)}
      </div>
    </MockCard>
  );
}

function ReadinessMock() {
  const cats = [["Yapı & biçim", 88], ["Kaynakça & atıf", 76], ["Etik & uyumluluk", 62], ["Dil & sunum", 92]];
  const col = (v) => (v >= 80 ? T.success : v >= 65 ? T.amber : T.error);
  return (
    <MockCard label="READINESS REPORT" badge={<ScoreBadge n="84" g="B+" />}>
      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
        <Ring pct={84} />
        <div style={{ flex: 1, display: "grid", gap: 11 }}>
          {cats.map(([l, v]) => (
            <div key={l}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontFamily: F.u, fontSize: 11.5, color: T.textMut }}>{l}</span>
                <span style={{ fontFamily: F.m, fontSize: 11, color: col(v) }}>{v}</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: T.sageDark, overflow: "hidden" }}><div style={{ width: `${v}%`, height: "100%", background: col(v) }} /></div>
            </div>
          ))}
        </div>
      </div>
    </MockCard>
  );
}

function ReviewMock() {
  return (
    <MockCard label="HAKEM İNCELEMESİ" badge={<ScoreBadge n="71" g="B" />}
      float={
        <div style={{ position: "absolute", right: -8, bottom: -18, width: 230, background: T.teal, borderRadius: 14, padding: "12px 14px", boxShadow: "0 22px 42px -18px rgba(10,26,20,.6)" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 7, alignItems: "center" }}>
            <span style={{ fontFamily: F.m, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", color: T.teal, background: T.amber, padding: "2px 7px", borderRadius: 12 }}>KRİTİK</span>
            <span style={{ fontFamily: F.m, fontSize: 9.5, color: "#9FBDB2" }}>Yöntem · s.4</span>
          </div>
          <div style={{ fontFamily: F.u, fontSize: 11, color: "#EAF2EE", lineHeight: 1.5 }}>Örneklem büyüklüğü güç analiziyle gerekçelendirilmemiş — n hesabını ekleyin.</div>
        </div>
      }>
      <div style={{ display: "grid", gap: 9, paddingBottom: 34 }}>
        <Bar w="70%" h={7} /><Bar w="100%" h={7} />
        <div style={{ background: "rgba(232,151,10,.16)", borderLeft: `3px solid ${T.amber}`, padding: "6px 8px", borderRadius: "0 6px 6px 0" }}><Bar w="88%" h={7} c={T.amber3} /></div>
        <Bar w="96%" h={7} /><Bar w="58%" h={7} /><Bar w="92%" h={7} /><Bar w="44%" h={7} />
      </div>
    </MockCard>
  );
}

function ResponseMock() {
  const rows = [
    { c: "Kabul", cc: T.success, q: "Giriş literatürü yeterince kapsamıyor.", a: "3 güncel çalışma eklendi (s. 2–3)." },
    { c: "Kısmi", cc: T.amber, q: "Örneklem yöntemi net değil.", a: "Yöntem paragrafı yeniden yazıldı." },
    { c: "İtiraz", cc: T.teal, q: "Bulgular abartılı yorumlanmış.", a: "Sınırlılıklar bölümüyle dengelendi." },
  ];
  return (
    <MockCard label="POINT-BY-POINT YANIT" badge={<span style={chipS}>3 / 12 yorum</span>}>
      <div style={{ display: "grid", gap: 13 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ borderLeft: `3px solid ${r.cc}`, paddingLeft: 11 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 6 }}>
              <MessageSquare size={12} color={T.textFaint} style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontFamily: F.u, fontSize: 11.5, color: T.textMut, lineHeight: 1.4 }}>{r.q}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontFamily: F.m, fontSize: 9.5, fontWeight: 700, color: "#fff", background: r.cc, padding: "2px 8px", borderRadius: 11, flexShrink: 0 }}>{r.c}</span>
              <span style={{ fontFamily: F.u, fontSize: 11.5, color: T.text, lineHeight: 1.4 }}>{r.a}</span>
            </div>
          </div>
        ))}
      </div>
    </MockCard>
  );
}

function CiteMock() {
  const rows = [
    { t: "Yılmaz & Demir (2021)", s: "ok", v: "eşleşti" },
    { t: "Kaya (2019)", s: "ok", v: "eşleşti" },
    { t: "Öztürk (2020)", s: "fail", v: "listede yok" },
    { t: "[12] Chen et al.", s: "warn", v: "DOI eksik" },
    { t: "Aydın (2018)", s: "ok", v: "eşleşti" },
  ];
  const ic = { ok: <CheckCircle2 size={14} color={T.success} />, warn: <AlertTriangle size={14} color={T.amber} />, fail: <XCircle size={14} color={T.error} /> };
  const col = { ok: T.success, warn: T.amber, fail: T.error };
  return (
    <MockCard label="ATIF–KAYNAKÇA" badge={<ScoreBadge n="32/34" g="APA 7" />}>
      <div style={{ display: "grid", gap: 8 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", background: T.sage, borderRadius: 8, border: `1px solid ${T.line}` }}>
            <span style={{ flexShrink: 0, display: "flex" }}>{ic[r.s]}</span>
            <span style={{ fontFamily: F.m, fontSize: 11.5, color: T.text, flex: 1 }}>{r.t}</span>
            <span style={{ fontFamily: F.u, fontSize: 10.5, color: col[r.s], whiteSpace: "nowrap" }}>{r.v}</span>
          </div>
        ))}
      </div>
    </MockCard>
  );
}

const SHOWCASE = [
  { kicker: { tr: "Hakem Simülasyonu", en: "Reviewer Simulation" }, Ic: Sparkles, Mock: SimMock,
    title: { tr: "Çalışmanı gerçek bir hakem gibi puanla", en: "Score your work like a real reviewer" },
    desc: { tr: "Presubly makaleni 8 boyutta değerlendirir, radar grafiğiyle görselleştirir ve yayın potansiyelini deterministik bir motorla hesaplar — yüzeysel değil, metindeki kanıta bağlı.", en: "Presubly evaluates your paper across 8 dimensions, visualizes them on a radar chart, and computes publication potential with a deterministic engine — evidence-based, not superficial." },
    bullets: [
      { Ic: Gauge, t: { tr: "İçerik, yöntem, yapı, argüman, literatür, atıf, risk ve dil ayrı ayrı skorlanır", en: "Content, method, structure, argument, literature, citations, risk and language are scored separately" } },
      { Ic: Scale, t: { tr: "4 uzmanlı hakem paneli — her biri kendi perspektifinden karar verir", en: "A 4-expert reviewer panel — each decides from its own perspective" } },
      { Ic: ShieldCheck, t: { tr: "Kritik kapılar puandan bağımsız çalışır; bir ihlal varsa öne çıkarılır", en: "Critical gates work independently of the score; any violation is surfaced" } },
    ] },
  { kicker: { tr: "Uyumluluk Taraması", en: "Readiness Scan" }, Ic: ListChecks, Mock: ReadinessMock,
    title: { tr: "Gönderim gereksinimlerini tek raporda gör", en: "See every submission requirement in one report" },
    desc: { tr: "Biçim, kaynakça, etik ve dil — dört kategori, onlarca kontrol noktası. Puanlı Readiness Report sorunlu alanları renk koduyla işaretler ve öncelik listesi çıkarır.", en: "Format, references, ethics and language — four categories, dozens of checkpoints. A scored Readiness Report flags problem areas with color codes and produces a priority list." },
    bullets: [
      { Ic: FileCheck2, t: { tr: "37+ kontrol noktası; her biri geçti / uyarı / eksik olarak etiketlenir", en: "37+ checkpoints, each labeled pass / warning / missing" } },
      { Ic: Library, t: { tr: "Hedef dergi profili verildiğinde kapsam ve politika uyumu ölçülür", en: "When a target-journal profile is given, scope and policy fit are measured" } },
      { Ic: CheckCircle2, t: { tr: "Genel puan + harf notu + göndermeden önce yapılacaklar listesi", en: "Overall score + letter grade + a pre-submission to-do list" } },
    ] },
  { kicker: { tr: "Bilimsel Hakem İncelemesi", en: "Scientific Peer Review" }, Ic: PenLine, Mock: ReviewMock,
    title: { tr: "Makalenin üzerine işaretli hakem yorumları", en: "Reviewer comments anchored onto your paper" },
    desc: { tr: "7 akademik kriter, 100 puanlık ölçek. Her yorum metindeki tam ifadeye çapalanır; major/minor önceliklendirmesiyle somut bir düzeltme rehberi çıkar.", en: "7 academic criteria on a 100-point scale. Every comment is anchored to the exact wording in the text, with major/minor prioritization for a concrete revision guide." },
    bullets: [
      { Ic: MessageSquare, t: { tr: "Yorumlar makaledeki birebir alıntıya bağlanır — havada kalmaz", en: "Comments link to a verbatim quote in the paper — never vague" } },
      { Ic: ScrollText, t: { tr: "COPE ilkeleri + 13 disipline özgü değerlendirme kriterleri", en: "COPE principles + criteria tailored to 13 disciplines" } },
      { Ic: ArrowRight, t: { tr: "Major / minor ayrımıyla neyi önce düzelteceğini bilirsin", en: "Major / minor split tells you what to fix first" } },
    ] },
  { kicker: { tr: "Yanıt Asistanı", en: "Response Assistant" }, Ic: MessageSquare, Mock: ResponseMock,
    title: { tr: "Hakem yorumlarına point-by-point yanıt", en: "Point-by-point responses to reviewer comments" },
    desc: { tr: "Hakem raporunu ayrıştırır, her yorumu sınıflandırır ve yapısal bir yanıt mektubu + değişiklik özeti üretir. Revizyon turunu saatlerden dakikalara indir.", en: "Parses the reviewer report, classifies each comment, and produces a structured response letter + change summary. Turn a revision round from hours into minutes." },
    bullets: [
      { Ic: ListChecks, t: { tr: "Her yorum: kabul / kısmi / itiraz / açıklama olarak sınıflandırılır", en: "Each comment classified: accept / partial / rebut / clarify" } },
      { Ic: FileCheck2, t: { tr: "Düzenli değişiklik tablosu — editöre net ve izlenebilir bir yanıt", en: "A tidy change table — a clear, traceable reply to the editor" } },
      { Ic: ScrollText, t: { tr: "Kibar, profesyonel ve savunulabilir bir akademik dil", en: "Polite, professional and defensible academic tone" } },
    ] },
  { kicker: { tr: "Atıf–Kaynakça Denetimi", en: "Citation–Reference Check" }, Ic: Link2, Mock: CiteMock,
    title: { tr: "Her atıf kaynakçayla eşleşiyor mu?", en: "Does every citation match the reference list?" },
    desc: { tr: "Metin içi atıfları kaynakça listesiyle çift yönlü eşleştirir; eşleşmeyen, eksik veya fazla kayıtları ve DOI/biçim sorunlarını tek tek bulur.", en: "Two-way matching of in-text citations against the reference list; finds unmatched, missing or extra entries and DOI/format issues one by one." },
    bullets: [
      { Ic: Link2, t: { tr: "Metin ↔ liste eşleştirme; öksüz atıflar ve kullanılmayan kayıtlar", en: "Text ↔ list matching; orphan citations and unused entries" } },
      { Ic: Search, t: { tr: "DOI doğrulama ve APA 7 / Vancouver biçim tutarlılığı", en: "DOI verification and APA 7 / Vancouver format consistency" } },
      { Ic: CheckCircle2, t: { tr: "Kaç atıfın eşleştiğini ve neyin elle düzeltileceğini gör", en: "See how many citations matched and what to fix by hand" } },
    ] },
];

const MORE = [
  { Ic: Scale, title: { tr: "Editöryal Değerlendirme", en: "Editorial Assessment" }, d: { tr: "Kapsam uyumu, etik analizi ve masa-başı editör kararı + yazar bildirim mektubu taslağı.", en: "Scope fit, ethics analysis and a desk-editor decision + author notification letter draft." } },
  { Ic: BarChart3, title: { tr: "İstatistik Denetleyici", en: "Statistics Auditor" }, d: { tr: "Test seçimi, varsayımlar, p-değeri, etki büyüklüğü ve çoklu karşılaştırma düzeltmeleri.", en: "Test selection, assumptions, p-values, effect sizes and multiple-comparison corrections." } },
  { Ic: ClipboardList, title: { tr: "Submission Checklist", en: "Submission Checklist" }, d: { tr: "Çalışma türüne uygun raporlama standardı (CONSORT / PRISMA / STROBE) otomatik seçilir.", en: "The reporting standard fitting your study type (CONSORT / PRISMA / STROBE) is selected automatically." } },
  { Ic: ScrollText, title: { tr: "Kapak Mektubu Üretici", en: "Cover Letter Generator" }, d: { tr: "Editöre profesyonel kapak mektubu taslağı + doldurulacak alanlar + öne çıkan katkı listesi.", en: "A professional cover-letter draft for the editor + fields to fill + a highlights list." } },
  { Ic: RefreshCw, title: { tr: "Revizyon Doğrulama", en: "Revision Verification" }, d: { tr: "Önceki bulguların düzeltilmiş makalede gerçekten çözülüp çözülmediğini madde madde doğrular.", en: "Verifies point by point whether prior findings were truly resolved in the revised paper." } },
];

function ToolShowcase({ kicker, Ic, title, desc, bullets, Mock, flip }) {
  const { L } = useLang();
  return (
    <div className={`showcase-row${flip ? " flip" : ""}`}>
      <div className="showcase-txt">
        <div style={{ display: "inline-flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: T.teal, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic size={16} /></span>
          <span style={{ fontFamily: F.m, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.amberDark, fontWeight: 500 }}>{L(kicker)}</span>
        </div>
        <h3 style={{ fontFamily: F.d, fontSize: "clamp(23px,3vw,31px)", fontWeight: 700, color: T.ink, margin: 0, lineHeight: 1.15, letterSpacing: "-0.02em" }}>{L(title)}</h3>
        <p style={{ fontFamily: F.u, fontSize: 15, color: T.textMut, lineHeight: 1.65, margin: "14px 0 22px", maxWidth: 470 }}>{L(desc)}</p>
        <div style={{ display: "grid", gap: 13 }}>
          {bullets.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
              <span style={{ width: 26, height: 26, borderRadius: 7, background: T.sageDark, color: T.teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}><b.Ic size={14} /></span>
              <span style={{ fontFamily: F.u, fontSize: 13.5, color: T.text, lineHeight: 1.5 }}>{L(b.t)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="showcase-mock"><Mock /></div>
    </div>
  );
}

const STEPS = [
  { n: "1", title: { tr: "Makaleyi yükle", en: "Upload your paper" }, d: { tr: ".pdf / .docx / metin yükle. Presubly yapıyı otomatik tanır.", en: "Upload .pdf / .docx / text. Presubly detects the structure automatically." } },
  { n: "2", title: { tr: "Hedef dergiyi seç", en: "Pick the target journal" }, d: { tr: "Kütüphaneden dergi veya kendi yönergeni ver; kurallar ona göre uygulanır.", en: "Choose a journal from the library or upload your own guidelines; the rules apply accordingly." } },
  { n: "3", title: { tr: "Raporu al", en: "Get the report" }, d: { tr: "Saniyeler içinde puanlı readiness report — sorunlu alanlar işaretli, öneriler hazır.", en: "A scored readiness report in seconds — problem areas flagged, suggestions ready." } },
];

/* ── Akış: bağlı stepper + adım başına mini görsel ── */
function StepVisual({ n }) {
  if (n === "1") return (
    <div style={{ border: `1.5px dashed ${T.line}`, borderRadius: 12, padding: "16px 14px", background: T.card, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, width: "100%" }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: T.sageDark, color: T.teal, display: "flex", alignItems: "center", justifyContent: "center" }}><UploadCloud size={18} /></span>
      <span style={{ fontFamily: F.u, fontSize: 12.5, fontWeight: 600, color: T.ink }}>Dosyanı bırak</span>
      <span style={{ fontFamily: F.m, fontSize: 10, color: T.textFaint }}>.pdf · .docx · metin</span>
    </div>
  );
  if (n === "2") return (
    <div style={{ border: `1px solid ${T.line}`, borderRadius: 12, padding: 14, background: T.card, width: "100%", display: "grid", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", border: `1px solid ${T.teal}`, borderRadius: 8, background: "#D8EDE8" }}>
        <Library size={14} color={T.teal} /><span style={{ fontFamily: F.u, fontSize: 12.5, fontWeight: 600, color: T.teal, flex: 1 }}>TEBD</span><span style={{ fontFamily: F.m, fontSize: 11, color: T.teal }}>▾</span>
      </div>
      <span style={{ fontFamily: F.u, fontSize: 10.5, color: T.textFaint, textAlign: "center" }}>ya da kendi yönergeni yükle</span>
    </div>
  );
  return (
    <div style={{ border: `1px solid ${T.line}`, borderRadius: 12, padding: 14, background: T.card, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}>
        <span style={{ fontFamily: F.d, fontSize: 24, fontWeight: 700, color: T.success, lineHeight: 1 }}>84</span>
        <span style={{ fontFamily: F.m, fontSize: 10.5, color: T.success, background: "#E8F7EE", padding: "3px 9px", borderRadius: 20 }}>B+ · hazır</span>
      </div>
      <div style={{ display: "grid", gap: 5 }}>
        {[88, 72, 92].map((w, i) => <div key={i} style={{ height: 5, borderRadius: 3, background: T.sageDark, overflow: "hidden" }}><div style={{ width: `${w}%`, height: "100%", background: T.tealLight }} /></div>)}
      </div>
    </div>
  );
}

function StepFlow() {
  const { L } = useLang();
  return (
    <div className="flow-rail" style={{ marginTop: 54 }}>
      <div className="flow-line" />
      {STEPS.map((s) => (
        <div key={s.n} className="flow-node">
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: T.teal, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.d, fontWeight: 700, fontSize: 18, position: "relative", zIndex: 1, boxShadow: `0 0 0 7px ${T.card}` }}>{s.n}</div>
          <div style={{ fontFamily: F.d, fontSize: 18, fontWeight: 700, color: T.ink, margin: "17px 0 6px" }}>{L(s.title)}</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: T.textMut, lineHeight: 1.55, maxWidth: 240, marginBottom: 18 }}>{L(s.d)}</div>
          <StepVisual n={s.n} />
        </div>
      ))}
    </div>
  );
}

const STANDARDS = ["COPE", "ICMJE", "CONSORT", "PRISMA", "STROBE", "COREQ", "APA"];

const CORP = [
  { Ic: BookOpen, title: { tr: "Dergi Editörleri", en: "Journal Editors" }, d: { tr: "Gelen makaleleri masaya almadan önce ön-hakem taramasından geçirin; masa başı red kararlarını hızlandırın, hakem yükünü azaltın.", en: "Run incoming manuscripts through a pre-review scan before desk assessment; speed up desk rejections and lighten reviewer load." } },
  { Ic: Library, title: { tr: "Üniversite Kütüphaneleri", en: "University Libraries" }, d: { tr: "Araştırmacılara güvenli, yerli altyapıyla ön değerlendirme hizmeti sunun. Kurum geneli erişim ve raporlama.", en: "Offer researchers a pre-assessment service on secure, local infrastructure. Institution-wide access and reporting." } },
  { Ic: BarChart3, title: { tr: "BAP Koordinatörlükleri", en: "Research Fund Offices" }, d: { tr: "Proje ve makale çıktılarını yapısal geri bildirimle standartlaştırın; yayın kalitesini kurumsal ölçekte artırın.", en: "Standardize project and paper outputs with structured feedback; raise publication quality at institutional scale." } },
  { Ic: BookMarked, title: { tr: "Akademik Yayınevleri", en: "Academic Publishers" }, d: { tr: "Uçtan uca bağımsız altyapıyla yayın kalite süreçlerini standartlaştırın; API ile kendi akışınıza gömün.", en: "Standardize publication quality workflows with independent end-to-end infrastructure; embed it in your flow via API." } },
];

const CORP_CAPS = [
  { tr: "REST API ile OJS / DergiPark akışına gömülü uyumluluk kontrolü", en: "Compliance checks embedded into OJS / DergiPark flows via REST API" },
  { tr: "KVKK uyumlu, yerli altyapı — makale metni sunucuda saklanmaz", en: "KVKK-compliant, local infrastructure — paper text is not stored on servers" },
  { tr: "Kurum geneli erişim, tekil oturum ve merkezi raporlama", en: "Institution-wide access, single sign-on and central reporting" },
  { tr: "SLA, öncelikli işlem ve kuruma özel dergi profil kütüphanesi", en: "SLA, priority processing and an institution-specific journal profile library" },
];

const FAQ_DATA = [
  { q: { tr: "Hangi dosya formatları destekleniyor?", en: "Which file formats are supported?" }, a: { tr: "Metin yapıştırma her pakette; .pdf ve .docx yükleme Akademik ve üzeri paketlerde. Taranmış (görsel) PDF'lerde metni yapıştırmanız gerekir.", en: "Pasting text is available on every plan; .pdf and .docx upload on Academic and above. For scanned (image) PDFs you need to paste the text." } },
  { q: { tr: "Dergi yazar yönergesi nasıl tanımlanır?", en: "How is a journal's author guideline defined?" }, a: { tr: "Kütüphaneden hazır bir dergi/standart profili seçebilir ya da kendi yönergenizi girip özel profil oluşturabilirsiniz (Akademik+). Kurallar taramaya uygulanır.", en: "You can pick a ready journal/standard profile from the library, or enter your own guideline to create a custom profile (Academic+). The rules apply to the scan." } },
  { q: { tr: "Verilerim saklanıyor mu?", en: "Is my data stored?" }, a: { tr: "Makale metniniz sunucuda saklanmaz; yalnızca tarama anında AI'a iletilir. Yalnızca 'Kaydet' derseniz rapor özeti arşivlenir. KVKK uyumlu; model eğitiminde kullanılmaz.", en: "Your paper text is not stored on servers; it is only sent to the AI at scan time. A report summary is archived only if you click 'Save'. KVKK-compliant; never used for model training." } },
  { q: { tr: "Ücretsiz deneme var mı?", en: "Is there a free trial?" }, a: { tr: "Evet — kredi kartı gerekmeden ayda 3 tarama ücretsiz. Sınırsız kullanım Akademik paketten başlar.", en: "Yes — 3 free scans per month, no credit card required. Unlimited use starts with the Academic plan." } },
  { q: { tr: "API / OJS entegrasyonu mümkün mü?", en: "Is API / OJS integration possible?" }, a: { tr: "Evet, Kurumsal pakette. REST API (/api/v1/scan) ile OJS veya DergiPark akışınıza Presubly taramasını gömebilirsiniz.", en: "Yes, on the Enterprise plan. With the REST API (/api/v1/scan) you can embed a Presubly scan into your OJS or DergiPark flow." } },
];

const PRICING_TIERS = ["free", "academic", "pro", "enterprise"];
const POPULAR = "academic";

const UNL = { tr: "Sınırsız", en: "Unlimited" };
const COMPARE = [
  { g: { tr: "Tarama & Krediler", en: "Scans & Credits" }, rows: [
    { l: { tr: "Aylık tarama", en: "Monthly scans" }, v: ["3", UNL, UNL, UNL] },
    { l: { tr: "Ek kredi paketi", en: "Add-on credit pack" }, v: [true, true, true, true] },
    { l: { tr: "6 temel araç (readiness, hakem, editöryal, yanıt, istatistik, checklist)", en: "6 core tools (readiness, review, editorial, response, stats, checklist)" }, v: [true, true, true, true] },
  ] },
  { g: { tr: "Dergi & Dosya", en: "Journal & Files" }, rows: [
    { l: { tr: "Dergi profili kütüphanesi", en: "Journal profile library" }, v: [false, true, true, true] },
    { l: { tr: ".pdf / .docx yükleme", en: ".pdf / .docx upload" }, v: [false, true, true, true] },
    { l: { tr: "Rapor arşivi & ilerleme", en: "Report archive & progress" }, v: [false, true, true, true] },
  ] },
  { g: { tr: "İleri Analiz", en: "Advanced Analysis" }, rows: [
    { l: { tr: "Yeniden tarama & karşılaştırma", en: "Re-scan & comparison" }, v: [false, false, true, true] },
    { l: { tr: "Atıf–kaynakça denetimi", en: "Citation–reference check" }, v: [false, false, true, true] },
    { l: { tr: "Kapak mektubu üretici", en: "Cover letter generator" }, v: [false, false, true, true] },
    { l: { tr: "Öncelikli işlem", en: "Priority processing" }, v: [false, false, true, true] },
  ] },
  { g: { tr: "Paylaşım & Entegrasyon", en: "Sharing & Integration" }, rows: [
    { l: { tr: "Paylaşılabilir rapor linki", en: "Shareable report link" }, v: [false, false, false, true] },
    { l: { tr: "PDF rapor çıktısı", en: "PDF report export" }, v: [false, false, false, true] },
    { l: { tr: "API erişimi (OJS/DergiPark)", en: "API access (OJS/DergiPark)" }, v: [false, false, false, true] },
  ] },
  { g: { tr: "Destek", en: "Support" }, rows: [
    { l: { tr: "Destek düzeyi", en: "Support level" }, v: [{ tr: "Topluluk", en: "Community" }, { tr: "E-posta", en: "Email" }, { tr: "Öncelikli", en: "Priority" }, { tr: "SLA / özel", en: "SLA / custom" }] },
  ] },
];

const FOOT_COLS = [
  { h: { tr: "ÜRÜN", en: "PRODUCT" }, links: [
    { t: { tr: "Fiyatlar", en: "Pricing" }, k: "page", to: "pricing" },
    { t: { tr: "Özellikler", en: "Features" }, k: "page", to: "features" },
    { t: { tr: "Nasıl çalışır?", en: "How it works" }, k: "page", to: "how" },
    { t: { tr: "Kurumsal", en: "Enterprise" }, k: "page", to: "kurumsal" },
    { t: { tr: "SSS", en: "FAQ" }, k: "page", to: "faq" },
  ] },
  { h: { tr: "ARAÇLAR", en: "TOOLS" }, links: [
    { t: { tr: "Hakem Simülasyonu", en: "Reviewer Simulation" }, k: "page", to: "features" },
    { t: { tr: "Uyumluluk Taraması", en: "Readiness Scan" }, k: "page", to: "features" },
    { t: { tr: "Hakem İncelemesi", en: "Peer Review" }, k: "page", to: "features" },
    { t: { tr: "Atıf Denetimi", en: "Citation Check" }, k: "page", to: "features" },
    { t: { tr: "Kapak Mektubu", en: "Cover Letter" }, k: "page", to: "features" },
  ] },
  { h: { tr: "ŞİRKET", en: "COMPANY" }, links: [
    { t: { tr: "Hakkımızda", en: "About" }, k: "page", to: "about" },
    { t: { tr: "İletişim", en: "Contact" }, k: "page", to: "contact" },
    { t: { tr: "Scitera", en: "Scitera" }, k: "href", to: "https://scitera.net" },
  ] },
  { h: { tr: "HUKUKİ", en: "LEGAL" }, links: [
    { t: { tr: "Gizlilik Politikası", en: "Privacy Policy" }, k: "page", to: "privacy" },
    { t: { tr: "Kullanım Şartları", en: "Terms of Use" }, k: "page", to: "terms" },
    { t: { tr: "Çerez Politikası", en: "Cookie Policy" }, k: "page", to: "cookies" },
    { t: { tr: "KVKK / GDPR", en: "KVKK / GDPR" }, k: "page", to: "kvkk" },
    { t: { tr: "Güvenlik Bildirimi", en: "Security Notice" }, k: "page", to: "security" },
  ] },
];

function FooterLink({ link, goPage, goPricing }) {
  const { L } = useLang();
  const st = { fontFamily: F.u, fontSize: 13.5, marginBottom: 11 };
  if (link.k === "pricing") return <span className="pb-flink" style={st} onClick={goPricing}>{L(link.t)}</span>;
  if (link.k === "page") return <span className="pb-flink" style={st} onClick={() => goPage(link.to)}>{L(link.t)}</span>;
  if (link.k === "href") return <a className="pb-flink" style={st} href={link.to} target="_blank" rel="noreferrer">{L(link.t)}</a>;
  if (link.k === "mail") return <a className="pb-flink" style={st} href={`mailto:${link.to}`}>{L(link.t)}</a>;
  return <a className="pb-flink" style={st} href="#" onClick={(e) => e.preventDefault()}>{L(link.t)}</a>;
}

/* ═══════════════ Alt sayfalar (nav → ayrı detay sayfaları) ═══════════════ */
function PageHero({ kicker, title, sub, children }) {
  return (
    <section style={{ background: `linear-gradient(180deg,${T.card},${T.sage})`, borderBottom: `1px solid ${T.line}` }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "62px 24px 52px", textAlign: "center" }}>
        <Eyebrow>{kicker}</Eyebrow>
        <h1 style={{ fontFamily: F.d, fontSize: "clamp(29px,5vw,46px)", fontWeight: 700, color: T.ink, margin: 0, letterSpacing: "-0.025em", lineHeight: 1.08 }}>{title}</h1>
        {sub && <p style={{ fontFamily: F.u, fontSize: "clamp(14.5px,2vw,17px)", color: T.textMut, maxWidth: 640, margin: "18px auto 0", lineHeight: 1.6 }}>{sub}</p>}
        {children && <div style={{ marginTop: 26, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>{children}</div>}
      </div>
    </section>
  );
}
const StartBtn = ({ onClick, children, variant }) => (
  <button onClick={onClick} style={{ fontFamily: F.u, fontSize: 14.5, fontWeight: 600, padding: "13px 26px", borderRadius: 12, border: variant === "ghost" ? `1px solid ${T.line}` : "none", cursor: "pointer", background: variant === "ghost" ? T.card : variant === "teal" ? T.teal : T.amber, color: variant === "teal" ? "#fff" : variant === "ghost" ? T.ink : T.teal, display: "inline-flex", alignItems: "center", gap: 7 }}>{children}</button>
);

/* — Özellikler sayfası — */
function FeaturesPage({ onStart }) {
  const { t } = useLang();
  const matrix = [
    [t("Hakem Simülasyonu", "Reviewer Simulation"), t("8 boyut · radar · panel", "8 dimensions · radar · panel"), "3"],
    [t("Uyumluluk Taraması", "Readiness Scan"), t("37+ kontrol · Readiness Report", "37+ checks · Readiness Report"), "3"],
    [t("Bilimsel Hakem İncelemesi", "Scientific Peer Review"), t("7 kriter · işaretli yorumlar", "7 criteria · anchored comments"), "3"],
    [t("Editöryal Değerlendirme", "Editorial Assessment"), t("masa-başı karar + mektup", "desk decision + letter"), "2"],
    [t("Yanıt Asistanı", "Response Assistant"), t("point-by-point + değişiklik tablosu", "point-by-point + change table"), "2"],
    [t("İstatistik Denetleyici", "Statistics Auditor"), t("test · p-değeri · etki büyüklüğü", "test · p-value · effect size"), "2"],
    [t("Atıf–Kaynakça Denetimi", "Citation–Reference Check"), t("eşleştirme · DOI · biçim", "matching · DOI · format"), "2"],
    [t("Submission Checklist", "Submission Checklist"), "CONSORT / PRISMA / STROBE", "1"],
    [t("Kapak Mektubu Üretici", "Cover Letter Generator"), t("editöre taslak + katkı listesi", "editor draft + highlights list"), "2"],
    [t("Revizyon Doğrulama", "Revision Verification"), t("çözüldü mü? · madde madde", "resolved? · point by point"), "2"],
  ];
  return (
    <>
      <PageHero kicker={t("Özellikler", "Features")} title={t("Gönderime giden her adım için bir araç", "A tool for every step to submission")} sub={t("Simülasyondan atıf denetimine, hakem yanıtından kapak mektubuna — Presubly'nin 10 aracı makaleni editörün masasına oturmadan önce baştan sona hazırlar.", "From reviewer simulation to citation checks, reviewer responses to cover letters — Presubly's 10 tools prepare your paper end to end before the editor's desk.")}>
        <StartBtn onClick={onStart}>{t("Ücretsiz dene →", "Try free →")}</StartBtn>
      </PageHero>
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "72px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 76 }}>
          {SHOWCASE.map((s, i) => <ToolShowcase key={s.kicker.tr} {...s} flip={i % 2 === 1} />)}
        </div>
        <div style={{ marginTop: 80 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <Eyebrow>{t("Tam liste", "Full list")}</Eyebrow>
            <div style={{ fontFamily: F.d, fontSize: 23, fontWeight: 700, color: T.ink }}>{t("10 araç · maliyet (kredi)", "10 tools · cost (credits)")}</div>
          </div>
          <div style={{ overflowX: "auto", border: `1px solid ${T.line}`, borderRadius: 16, background: T.card }}>
            <table style={{ width: "100%", minWidth: 520, borderCollapse: "collapse", fontFamily: F.u, fontSize: 13.5 }}>
              <tbody>
                {matrix.map((r, i) => (
                  <tr key={r[0]} style={{ borderTop: i === 0 ? "none" : `1px solid ${T.line}` }}>
                    <td style={{ padding: "13px 18px", fontFamily: F.d, fontWeight: 700, color: T.ink, whiteSpace: "nowrap" }}>{r[0]}</td>
                    <td style={{ padding: "13px 18px", color: T.textMut }}>{r[1]}</td>
                    <td style={{ padding: "13px 18px", textAlign: "right" }}><span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: T.amberDark, background: T.amberSoft, borderRadius: 20, padding: "3px 10px", whiteSpace: "nowrap" }}>{r[2]} {t("kredi", "credits")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}

/* — Nasıl çalışır? sayfası — */
function HowPage({ onStart }) {
  const { t, L } = useLang();
  const engine = [
    { Ic: Scale, t: { tr: "AI gözlemler, kurallar karar verir", en: "AI observes, rules decide" }, d: { tr: "Yapay zekâ her boyutu kanıtla puanlar; toplam skoru, harf notunu ve nihai kararı deterministik bir motor hesaplar — aynı metin, aynı sonuç.", en: "The AI scores each dimension with evidence; a deterministic engine computes the total score, letter grade and final decision — same text, same result." } },
    { Ic: ShieldCheck, t: { tr: "Kritik kapılar puandan bağımsız", en: "Critical gates are score-independent" }, d: { tr: "Etik onay eksikliği, yöntem–veri uyumsuzluğu, desteklenmeyen iddia gibi ihlaller yüksek puanı geçersiz kılar; göz ardı edilemez.", en: "Violations like missing ethics approval, method–data mismatch or unsupported claims override a high score; they can't be ignored." } },
    { Ic: CheckCircle2, t: { tr: "Kanıt doğrulaması", en: "Evidence verification" }, d: { tr: "Her eleştiri makaledeki birebir alıntıya bağlanır; metinde bulunamayan bir alıntı raporlanmaz — halüsinasyon filtresi.", en: "Every critique links to a verbatim quote in the paper; a quote not found in the text isn't reported — a hallucination filter." } },
    { Ic: Gauge, t: { tr: "Güven & çekimserlik", en: "Confidence & abstention" }, d: { tr: "Metinde yeterli bilgi yoksa sistem 'tespit edilemedi' der; uydurmaz. Her boyut için güven düzeyi gösterilir.", en: "If there isn't enough in the text, the system says 'not detected' rather than inventing. A confidence level is shown per dimension." } },
  ];
  return (
    <>
      <PageHero kicker={t("Nasıl çalışır?", "How it works?")} title={t("Yükle, seç, puanlı raporunu al", "Upload, select, get a scored report")} sub={t("Presubly bir prompt-çalıştırıcı değil; kanıta dayalı, deterministik ve çalışma tasarımına duyarlı bir gönderim-öncesi değerlendirme sistemidir.", "Presubly is not a prompt-runner; it's an evidence-based, deterministic, study-design-aware pre-submission assessment system.")}>
        <StartBtn onClick={onStart}>{t("Makale yükle →", "Upload paper →")}</StartBtn>
      </PageHero>
      <section style={{ maxWidth: 980, margin: "0 auto", padding: "68px 24px 40px" }}>
        <StepFlow />
      </section>
      <section style={{ background: T.card, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "72px 24px" }}>
          <SectionHead kicker={t("Motorun içi", "Under the hood")} title={t("Neden güvenilir?", "Why it's trustworthy")} sub={t("Presubly'yi sıradan bir 'AI özetleyici'den ayıran dört ilke.", "Four principles that separate Presubly from a plain 'AI summarizer'.")} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginTop: 44 }}>
            {engine.map((e) => (
              <div key={e.t.tr} style={{ background: T.sage, border: `1px solid ${T.line}`, borderRadius: 16, padding: 24 }}>
                <span style={{ width: 42, height: 42, borderRadius: 11, background: "#D8EDE8", color: T.teal, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><e.Ic size={20} /></span>
                <div style={{ fontFamily: F.d, fontSize: 17, fontWeight: 700, color: T.ink, marginBottom: 7 }}>{L(e.t)}</div>
                <div style={{ fontFamily: F.u, fontSize: 13, color: T.textMut, lineHeight: 1.6 }}>{L(e.d)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* — Kurumsal sayfası — */
function EnterprisePage({ onStart }) {
  const { t, L } = useLang();
  return (
    <>
      <PageHero kicker={t("Kurumsal Çözümler", "Enterprise Solutions")} title={t("Kurumlar için ön-hakemlik altyapısı", "Pre-review infrastructure for institutions")} sub={t("Dergi, üniversite, koordinatörlük ve yayınevleri için güvenli, yerli altyapı — kurum geneli erişim, merkezi raporlama ve REST API.", "Secure, local infrastructure for journals, universities, research offices and publishers — institution-wide access, central reporting and a REST API.")}>
        <StartBtn onClick={() => { window.location.href = "mailto:info@scitera.net?subject=Kurumsal%20Çözüm"; }}>{t("Görüşme planla →", "Book a call →")}</StartBtn>
        <StartBtn onClick={onStart} variant="ghost">{t("Önce dene", "Try it first")}</StartBtn>
      </PageHero>
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 24px" }}>
        <div className="corp-split">
          <div className="corp-pitch" style={{ background: `linear-gradient(160deg,${T.tealMid},${T.teal} 62%,#072423)`, borderRadius: 20, padding: "34px 30px", color: "#fff", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -80, right: -60, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(232,151,10,.2),transparent 70%)" }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontFamily: F.d, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{t("Ne sağlıyoruz?", "What you get")}</div>
              <p style={{ fontFamily: F.u, fontSize: 14, color: "#B7CCC3", lineHeight: 1.6, margin: "0 0 22px" }}>{t("Gelen makaleleri masaya almadan önce ön-hakem taramasından geçirin; hakem yükünü azaltın, kaliteyi kurumsal ölçekte standartlaştırın.", "Run incoming manuscripts through a pre-review scan before desk assessment; reduce reviewer load and standardize quality at institutional scale.")}</p>
              <div style={{ display: "grid", gap: 13 }}>
                {CORP_CAPS.map((c) => (
                  <div key={c.tr} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><Check c={T.amber3} s={17} /><span style={{ fontFamily: F.u, fontSize: 13.5, color: "#EAF2EE", lineHeight: 1.5 }}>{L(c)}</span></div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            {CORP.map((c) => (
              <div key={c.title.tr} className="corp-row">
                <span style={{ width: 46, height: 46, borderRadius: 12, background: "#D8EDE8", display: "flex", alignItems: "center", justifyContent: "center", color: T.teal, flexShrink: 0 }}><c.Ic size={21} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.d, fontSize: 17, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{L(c.title)}</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: T.textMut, lineHeight: 1.55 }}>{L(c.d)}</div>
                </div>
                <ArrowRight size={18} className="corp-row-arrow" />
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* API */}
      <section style={{ background: T.ink }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "72px 24px" }}>
          <div className="corp-split" style={{ alignItems: "center" }}>
            <div>
              <Eyebrow>REST API</Eyebrow>
              <h2 style={{ fontFamily: F.d, fontSize: "clamp(24px,3vw,32px)", fontWeight: 700, color: "#fff", margin: "6px 0 14px", lineHeight: 1.15 }}>{t("Akışınıza tek çağrıyla gömün", "Embed it into your flow with one call")}</h2>
              <p style={{ fontFamily: F.u, fontSize: 14.5, color: "#8FA89D", lineHeight: 1.65, marginBottom: 20 }}>{t("OJS, DergiPark veya kendi gönderim sisteminizde her makaleyi otomatik tarayın; puanı ve kararı JSON olarak alın.", "Automatically scan every manuscript in OJS, DergiPark or your own submission system; get the score and decision as JSON.")}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[t("KVKK · yerli", "KVKK · local"), t("Kurum raporlama", "Institution reporting"), t("SLA & öncelik", "SLA & priority"), t("Tekil oturum", "Single sign-on")].map((x) => <span key={x} style={{ fontFamily: F.m, fontSize: 11, color: "#CFE0DA", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.13)", borderRadius: 20, padding: "5px 12px" }}>{x}</span>)}
              </div>
            </div>
            <div style={{ background: "rgba(0,0,0,.3)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: 20, fontFamily: F.m, fontSize: 12.5, lineHeight: 1.8 }}>
              <div><span style={{ color: T.amber3 }}>POST</span> <span style={{ color: "#E6F0EB" }}>/api/v1/scan</span></div>
              <div style={{ color: "#6F9086" }}>Authorization: Bearer •••</div>
              <div style={{ height: 1, background: "rgba(255,255,255,.1)", margin: "11px 0" }} />
              <div style={{ color: "#8FB0A5" }}>{"{"}</div>
              <div style={{ color: "#8FB0A5", paddingLeft: 16 }}>"score": <span style={{ color: T.amber3 }}>84</span>, "grade": <span style={{ color: "#EAF2EE" }}>"B+"</span>,</div>
              <div style={{ color: "#8FB0A5", paddingLeft: 16 }}>"decision": <span style={{ color: "#EAF2EE" }}>"minor_revision"</span>,</div>
              <div style={{ color: "#8FB0A5", paddingLeft: 16 }}>"gates": [<span style={{ color: "#EAF2EE" }}>"clear"</span>]</div>
              <div style={{ color: "#8FB0A5" }}>{"}"}</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* — SSS sayfası — */
const FAQ_EXTRA = [
  { q: { tr: "Puanı kim belirliyor — yapay zekâ mı?", en: "Who sets the score — the AI?" }, a: { tr: "Hayır. AI her boyutu kanıtla gözlemler; toplam puanı, harf notunu ve nihai kararı deterministik bir motor hesaplar. Böylece aynı metin her seferinde aynı sonucu verir ve karar açıklanabilir olur.", en: "No. The AI observes each dimension with evidence; a deterministic engine computes the total score, letter grade and final decision. So the same text always yields the same result, and the decision stays explainable." } },
  { q: { tr: "Sonuçlar ne kadar güvenilir?", en: "How reliable are the results?" }, a: { tr: "Her eleştiri makaledeki birebir alıntıya bağlanır (kanıt doğrulaması); metinde bulunamayan iddia raporlanmaz. Bilgi yetersizse sistem 'tespit edilemedi' der, uydurmaz.", en: "Every critique is anchored to a verbatim quote in the paper (evidence verification); a claim that can't be found in the text is not reported. If information is insufficient, the system says 'not detected' rather than inventing." } },
  { q: { tr: "Hangi çalışma türlerini destekliyor?", en: "Which study types are supported?" }, a: { tr: "Nicel/nitel/karma; RCT, ölçek geliştirme, sistematik derleme, fenomenoloji ve daha fazlası. Sistem önce çalışmayı sınıflandırır ve yöntem değerlendirmesini o tasarıma uygun kriterlerle yapar (CONSORT/PRISMA/STROBE).", en: "Quantitative/qualitative/mixed; RCT, scale development, systematic review, phenomenology and more. The system first classifies the study and evaluates the method with criteria fitting that design (CONSORT/PRISMA/STROBE)." } },
  { q: { tr: "İngilizce makale tarayabilir miyim?", en: "Can I scan an English paper?" }, a: { tr: "Evet; makale metni Türkçe veya İngilizce olabilir. Kaynakça denetimi APA 7 ve Vancouver biçimlerini destekler.", en: "Yes; the paper text can be Turkish or English. The reference check supports APA 7 and Vancouver formats." } },
];
function FaqPage() {
  const { t, L } = useLang();
  const [open, setOpen] = useState(0);
  const all = [...FAQ_DATA, ...FAQ_EXTRA];
  return (
    <>
      <PageHero kicker={t("SSS", "FAQ")} title={t("Sıkça sorulan sorular", "Frequently asked questions")} sub={t("Aradığını bulamazsan info@scitera.net'a yaz — genellikle aynı gün dönüş yapıyoruz.", "Can't find what you need? Email info@scitera.net — we usually reply the same day.")} />
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 20px" }}>
        {all.map((f, i) => (
          <div key={i} style={{ borderBottom: `1px solid ${T.line}` }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{ display: "flex", alignItems: "center", width: "100%", padding: "18px 0", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: T.ink, flex: 1 }}>{L(f.q)}</span>
              <span style={{ fontSize: 20, color: T.textFaint, transition: "transform .2s", transform: open === i ? "rotate(45deg)" : "none" }}>+</span>
            </button>
            {open === i && <div style={{ fontFamily: F.u, fontSize: 14, color: T.textMut, lineHeight: 1.65, padding: "0 0 18px", maxWidth: 660 }}>{L(f.a)}</div>}
          </div>
        ))}
      </section>
    </>
  );
}

/* — Kılavuz sayfası (görselli) — */
function GuideDropShot() {
  return (
    <MockCard label="1 · YÜKLE">
      <div style={{ border: `1.5px dashed ${T.line}`, borderRadius: 12, padding: "26px 16px", background: T.sage, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <span style={{ width: 42, height: 42, borderRadius: 11, background: "#D8EDE8", color: T.teal, display: "flex", alignItems: "center", justifyContent: "center" }}><UploadCloud size={22} /></span>
        <span style={{ fontFamily: F.u, fontSize: 13.5, fontWeight: 600, color: T.ink }}>Dosyanı buraya bırak</span>
        <span style={{ fontFamily: F.m, fontSize: 11, color: T.textFaint }}>.pdf · .docx · veya metin yapıştır</span>
      </div>
    </MockCard>
  );
}
function GuideToolShot() {
  const tools = [["Hakem Simülasyonu", "3"], ["Uyumluluk Taraması", "3"], ["Atıf Denetimi", "2"]];
  return (
    <MockCard label="2 · ARAÇ SEÇ">
      <div style={{ display: "grid", gap: 8 }}>
        {tools.map((t, i) => (
          <div key={t[0]} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 10, border: `1px solid ${i === 0 ? T.teal : T.line}`, background: i === 0 ? "#D8EDE8" : T.card }}>
            <span style={{ width: 26, height: 26, borderRadius: 7, background: i === 0 ? T.teal : T.sageDark, color: i === 0 ? "#fff" : T.teal, display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={13} /></span>
            <span style={{ fontFamily: F.u, fontSize: 12.5, fontWeight: 600, color: T.ink, flex: 1 }}>{t[0]}</span>
            <span style={{ fontFamily: F.m, fontSize: 10.5, color: T.amberDark }}>{t[1]} kr</span>
          </div>
        ))}
      </div>
    </MockCard>
  );
}
function GuideExportShot() {
  const btns = [["Yeniden tara", T.sageDark, T.teal], ["Kaydet", T.sageDark, T.teal], ["Paylaş", T.teal, "#fff"], ["İndir (PDF)", T.amber, T.teal]];
  return (
    <MockCard label="SONUÇ">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {btns.map((b) => <span key={b[0]} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, padding: "8px 13px", borderRadius: 9, background: b[1], color: b[2] }}>{b[0]}</span>)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", background: T.sage, border: `1px solid ${T.line}`, borderRadius: 8 }}>
        <Link2 size={13} color={T.textFaint} /><span style={{ fontFamily: F.m, fontSize: 11, color: T.textMut, flex: 1 }}>presubly.com/#share-a1b2</span><span style={{ fontFamily: F.m, fontSize: 10, color: T.success }}>kopyalandı</span>
      </div>
    </MockCard>
  );
}
const GUIDE = [
  { n: "1", kicker: { tr: "Başla", en: "Start" }, title: { tr: "Hesap oluştur, panele gir", en: "Create an account, open the app" }, desc: { tr: "E-posta ile ücretsiz kaydol; her ay 3 tarama hakkın hazır. Panelde sol menüden araçlara, üstten kredine ve raporlarına ulaşırsın.", en: "Sign up free with email; you get 3 scans a month. In the app you reach tools from the left menu, and your credits and reports from the top." }, visual: <GuideToolShot />,
    points: [{ tr: "Kredi kartı gerekmez", en: "No credit card required" }, { tr: "3 ücretsiz tarama / ay", en: "3 free scans / month" }] },
  { n: "2", kicker: { tr: "Yükle", en: "Upload" }, title: { tr: "Makaleni ekle", en: "Add your paper" }, desc: { tr: ".pdf veya .docx yükle ya da metni yapıştır. Presubly başlık, özet, yöntem ve kaynakça yapısını otomatik tanır. Taranmış (görsel) PDF'lerde metni yapıştırman gerekir.", en: "Upload .pdf or .docx, or paste the text. Presubly auto-detects the title, abstract, methods and reference structure. For scanned (image) PDFs you'll need to paste the text." }, visual: <GuideDropShot />,
    points: [{ tr: ".pdf · .docx · metin", en: ".pdf · .docx · text" }, { tr: "Yapı otomatik tanınır", en: "Structure detected automatically" }] },
  { n: "3", kicker: { tr: "Seç", en: "Select" }, title: { tr: "Araç, tür ve hedef dergi", en: "Tool, type and target journal" }, desc: { tr: "İşine uygun aracı seç (ör. Uyumluluk Taraması), çalışma türünü belirt. İstersen kütüphaneden hedef dergi profili seç ya da kendi yazar yönergeni yükle — kurallar ona göre uygulanır.", en: "Pick the right tool (e.g. Readiness Scan) and set your study type. Optionally choose a target-journal profile from the library or upload your own guidelines — the rules apply accordingly." }, visual: <ReadinessMock />,
    points: [{ tr: "10 araç arasından seç", en: "Choose from 10 tools" }, { tr: "Dergi profili opsiyonel", en: "Journal profile optional" }] },
  { n: "4", kicker: { tr: "Oku", en: "Read" }, title: { tr: "Raporu ve işaretli yorumları incele", en: "Review the report and anchored comments" }, desc: { tr: "Puanlı rapor, sorunlu alanları renk koduyla gösterir; her yorum makaledeki tam ifadeye bağlanır. Önce 'göndermeden önce yapılacaklar' listesine bak.", en: "The scored report color-codes problem areas; every comment links to the exact wording in the paper. Start with the 'before you submit' to-do list." }, visual: <ReviewMock />,
    points: [{ tr: "Puan + harf notu", en: "Score + letter grade" }, { tr: "Metne çapalı yorumlar", en: "Text-anchored comments" }] },
  { n: "5", kicker: { tr: "Düzelt & doğrula", en: "Fix & verify" }, title: { tr: "Revize et, tekrar tara", en: "Revise, then re-scan" }, desc: { tr: "Düzeltilmiş nüshayı yükle; Revizyon Doğrulama her bulgunun çözülüp çözülmediğini madde madde kontrol eder ve skor ilerlemeni gösterir.", en: "Upload the revised version; Revision Verification checks point by point whether each finding is resolved and shows your score progress." }, visual: <CiteMock />,
    points: [{ tr: "Madde madde doğrulama", en: "Point-by-point verification" }, { tr: "Skor ilerlemesi", en: "Score progress" }] },
  { n: "6", kicker: { tr: "Paylaş", en: "Share" }, title: { tr: "Kaydet, paylaş, indir", en: "Save, share, download" }, desc: { tr: "Raporu buluta kaydet, 7 günlük paylaşım linki oluştur veya PDF/Word olarak indir. Kapak mektubu ve hakem yanıtı araçlarıyla gönderimini tamamla.", en: "Save the report to the cloud, create a 7-day share link, or download as PDF/Word. Finish your submission with the cover-letter and reviewer-response tools." }, visual: <GuideExportShot />,
    points: [{ tr: "Bulut kayıt & paylaşım linki", en: "Cloud save & share link" }, { tr: "PDF / Word çıktı", en: "PDF / Word export" }] },
];
function GuidePage({ onStart }) {
  const { t, L } = useLang();
  return (
    <>
      <PageHero kicker={t("Kılavuz", "Guide")} title={t("Presubly'yi altı adımda kullan", "Use Presubly in six steps")} sub={t("Yüklemeden gönderime — her adımı ekran görselleriyle açıklıyoruz. İlk taramanı beş dakikada tamamla.", "From upload to submission — every step explained with screens. Finish your first scan in five minutes.")}>
        <StartBtn onClick={onStart}>{t("Hemen başla →", "Get started →")}</StartBtn>
      </PageHero>
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "72px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 72 }}>
          {GUIDE.map((g, i) => (
            <div key={g.n} className={`showcase-row${i % 2 === 1 ? " flip" : ""}`}>
              <div className="showcase-txt">
                <div style={{ display: "inline-flex", alignItems: "center", gap: 11, marginBottom: 13 }}>
                  <span style={{ width: 36, height: 36, borderRadius: "50%", background: T.teal, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.d, fontWeight: 700, fontSize: 17 }}>{g.n}</span>
                  <span style={{ fontFamily: F.m, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.amberDark, fontWeight: 500 }}>{L(g.kicker)}</span>
                </div>
                <h3 style={{ fontFamily: F.d, fontSize: "clamp(22px,3vw,29px)", fontWeight: 700, color: T.ink, margin: 0, lineHeight: 1.15, letterSpacing: "-0.02em" }}>{L(g.title)}</h3>
                <p style={{ fontFamily: F.u, fontSize: 15, color: T.textMut, lineHeight: 1.65, margin: "13px 0 18px", maxWidth: 470 }}>{L(g.desc)}</p>
                <div style={{ display: "grid", gap: 10 }}>
                  {g.points.map((p) => (
                    <div key={p.tr} style={{ display: "flex", gap: 10, alignItems: "center" }}><Check c={T.success} s={16} /><span style={{ fontFamily: F.u, fontSize: 13.5, color: T.text }}>{L(p)}</span></div>
                  ))}
                </div>
              </div>
              <div className="showcase-mock">{g.visual}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 64 }}>
          <StartBtn onClick={onStart}>{t("İlk taramanı başlat →", "Start your first scan →")}</StartBtn>
        </div>
      </section>
    </>
  );
}

/* — İletişim sayfası (Deskly tarzı — Turnstile korumalı) — */
const CONTACT_INFO = [
  { Ic: Mail, l: "E-posta", v: "info@scitera.net", href: "mailto:info@scitera.net" },
  { Ic: MapPin, l: "Adres", v: "Giresun Teknopark, Bulancak / Giresun" },
];
const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Giresun+Teknopark+Bulancak";
function ContactPage() {
  const { t } = useLang();
  const CL = { "E-posta": "Email", "Telefon": "Phone", "Adres": "Address" };
  const [f, setF] = useState({ ad: "", email: "", konu: "", tel: "", mesaj: "" });
  const [token, setToken] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  const [status, setStatus] = useState("idle"); // idle|sending|sent|error
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (TURNSTILE_ENABLED && !token) { setErr(t("Lütfen güvenlik doğrulamasını tamamlayın.", "Please complete the security check.")); return; }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: f.ad, email: f.email, subject: f.konu, phone: f.tel, message: f.mesaj, token }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "err"); }
      setStatus("sent");
    } catch (e2) {
      setStatus("error");
      setErr(e2?.message === "captcha_failed" ? t("Güvenlik doğrulaması başarısız, tekrar deneyin.", "Security check failed, please try again.") : t("Mesaj gönderilemedi, lütfen tekrar deneyin.", "Couldn't send the message, please try again."));
      setResetKey((k) => k + 1); setToken(null);
    }
  };

  const inp = { width: "100%", boxSizing: "border-box", background: T.card, border: `1px solid ${T.line}`, borderRadius: 10, padding: "12px 14px", fontFamily: F.u, fontSize: 14, color: T.ink, outline: "none" };
  const lbl = { display: "block", fontFamily: F.u, fontSize: 12.5, fontWeight: 600, color: T.textMut, marginBottom: 6 };
  return (
    <>
      <PageHero kicker={t("İletişim", "Contact")} title={t("Bize ulaşın", "Get in touch")} sub={t("Sorular, kurumsal talepler ve iş birlikleri için buradayız.", "We're here for questions, enterprise requests and partnerships.")} />
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 24px 72px" }}>
        <div className="corp-split">
          {/* SOL — bilgi kartları + harita */}
          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            {CONTACT_INFO.map((c) => (
              <a key={c.l} href={c.href || undefined} style={{ display: "flex", gap: 14, alignItems: "center", background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 16, textDecoration: "none", cursor: c.href ? "pointer" : "default" }}>
                <span style={{ width: 44, height: 44, borderRadius: 11, background: "#D8EDE8", color: T.teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><c.Ic size={20} /></span>
                <div>
                  <div style={{ fontFamily: F.m, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: T.amberDark, marginBottom: 3, fontWeight: 600 }}>{t(c.l, CL[c.l])}</div>
                  <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: T.ink }}>{c.v}</div>
                </div>
              </a>
            ))}
            <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ lineHeight: 0 }}>
                <iframe title="Giresun Teknopark" src="https://maps.google.com/maps?q=Giresun%20Teknopark%20Bulancak&z=13&output=embed" style={{ width: "100%", height: 200, border: 0, display: "block", filter: "grayscale(0.12)" }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <a href={MAPS_URL} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 14px", fontFamily: F.u, fontSize: 12.5, fontWeight: 600, color: T.teal, textDecoration: "none" }}><MapPin size={14} />{t("Haritalar'da aç →", "Open in Maps →")}</a>
            </div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: T.textFaint, lineHeight: 1.5 }}>{t("Mesajları e-posta ile alıyoruz; mesai saatlerinde genellikle aynı gün yanıt veriyoruz.", "We receive messages by email; during working hours we usually reply the same day.")}</div>
          </div>

          {/* SAĞ — form */}
          <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, padding: 26 }}>
            {status === "sent" ? (
              <div style={{ textAlign: "center", padding: "44px 10px" }}>
                <span style={{ width: 54, height: 54, borderRadius: "50%", background: "#E8F7EE", color: T.success, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><CheckCircle2 size={28} /></span>
                <div style={{ fontFamily: F.d, fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 8 }}>{t("Mesajınız alındı", "Message received")}</div>
                <p style={{ fontFamily: F.u, fontSize: 14, color: T.textMut, maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>{t("Teşekkürler! 24 saat içinde info@scitera.net üzerinden size dönüş yapacağız.", "Thanks! We'll get back to you within 24 hours via info@scitera.net.")}</p>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
                <div className="contact-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div><label style={lbl}>{t("Ad Soyad *", "Full name *")}</label><input required value={f.ad} onChange={set("ad")} placeholder={t("Adınız Soyadınız", "Your full name")} style={inp} /></div>
                  <div><label style={lbl}>{t("Konu *", "Subject *")}</label>
                    <select required value={f.konu} onChange={set("konu")} style={{ ...inp, appearance: "auto", cursor: "pointer" }}>
                      <option value="">{t("Seçin…", "Select…")}</option>
                      <option value="Genel soru">{t("Genel soru", "General question")}</option>
                      <option value="Kurumsal çözüm">{t("Kurumsal çözüm", "Enterprise solution")}</option>
                      <option value="Teknik destek">{t("Teknik destek", "Technical support")}</option>
                      <option value="İş birliği / basın">{t("İş birliği / basın", "Partnership / press")}</option>
                    </select>
                  </div>
                </div>
                <div className="contact-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div><label style={lbl}>{t("E-posta Adresi *", "Email address *")}</label><input required type="email" value={f.email} onChange={set("email")} placeholder="you@university.edu" style={inp} /></div>
                  <div><label style={lbl}>{t("Telefon", "Phone")}</label><input value={f.tel} onChange={set("tel")} placeholder="+90 (555) 000 00 00" style={inp} /></div>
                </div>
                <div>
                  <label style={lbl}>{t("Mesajınız *", "Your message *")}</label>
                  <textarea required rows={5} value={f.mesaj} onChange={set("mesaj")} placeholder={t("Talebinizi detaylı bir şekilde buraya not edebilirsiniz…", "Describe your request in detail here…")} maxLength={4000} style={{ ...inp, resize: "vertical" }} />
                  <div style={{ textAlign: "right", fontFamily: F.m, fontSize: 11, color: T.textFaint, marginTop: 5 }}>{f.mesaj.length} {t("karakter", "characters")}</div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", background: T.amberSoft, border: `1px solid ${T.amber3}`, borderRadius: 10, padding: "11px 14px" }}>
                  <AlertTriangle size={16} color={T.amberDark} style={{ flexShrink: 0 }} />
                  <span style={{ fontFamily: F.u, fontSize: 12.5, color: T.amberDark, lineHeight: 1.5 }}>{t("Mesajınız alındıktan sonra 24 saat içinde tarafınıza dönüş sağlanacaktır.", "You'll receive a reply within 24 hours of your message.")}</span>
                </div>
                {TURNSTILE_ENABLED && <Turnstile onVerify={setToken} resetKey={resetKey} />}
                {err && <div style={{ fontFamily: F.u, fontSize: 12.5, color: T.error }}>{err}</div>}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" disabled={status === "sending"} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: F.u, fontSize: 14.5, fontWeight: 700, padding: "12px 26px", borderRadius: 11, border: "none", background: T.teal, color: "#fff", cursor: status === "sending" ? "default" : "pointer", opacity: status === "sending" ? 0.65 : 1 }}><Send size={16} />{status === "sending" ? t("Gönderiliyor…", "Sending…") : t("Mesajı Gönder", "Send message")}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

/* — Hakkımızda sayfası — */
function AboutPage({ onStart }) {
  const { t, L } = useLang();
  const vals = [
    { Ic: ShieldCheck, t: { tr: "Kanıta dayalı", en: "Evidence-based" }, d: { tr: "Her yargı metindeki somut kanıta bağlanır; sistem uydurmaz.", en: "Every judgment is tied to concrete evidence in the text; the system doesn't invent." } },
    { Ic: Scale, t: { tr: "Deterministik", en: "Deterministic" }, d: { tr: "Kararı kurallar verir, AI değil — aynı metin, aynı sonuç.", en: "Rules make the decision, not the AI — same text, same result." } },
    { Ic: Library, t: { tr: "Yerli & güvenli", en: "Local & secure" }, d: { tr: "KVKK uyumlu; makale metni sunucuda saklanmaz.", en: "KVKK-compliant; paper text is not stored on servers." } },
  ];
  const eco = [
    { t: "Presubly", d: { tr: "Gönderim-öncesi hakem & uyumluluk (bu ürün)", en: "Pre-submission review & compliance (this product)" } },
    { t: "MisanpAIge", d: { tr: "AI destekli akademik dizgi & mizanpaj", en: "AI-assisted academic typesetting & layout" } },
    { t: "Deskly", d: { tr: "Dergiler için editöryal mesaj bankası", en: "Editorial message bank for journals" } },
    { t: "Issuely", d: { tr: "Dergi sayısı birleştirme & üretim", en: "Journal issue assembly & production" } },
  ];
  return (
    <>
      <PageHero kicker={t("Hakkımızda", "About")} title={t("Akademik gönderimi güvenli kılıyoruz", "Making academic submission safer")} sub={t("Presubly, araştırmacıların makalelerini editörün masasına oturmadan önce hakem gözüyle değerlendirmesini sağlar.", "Presubly lets researchers assess their papers through a reviewer's eyes before they reach the editor's desk.")}>
        <StartBtn onClick={onStart}>{t("Ücretsiz dene →", "Try free →")}</StartBtn>
      </PageHero>
      <section style={{ maxWidth: 820, margin: "0 auto", padding: "62px 24px 12px" }}>
        <p style={{ fontFamily: F.u, fontSize: 16, color: T.textMut, lineHeight: 1.75, marginTop: 0 }}>{t(<>Presubly, <b style={{ color: T.ink }}>Scitera Bilgi Teknolojileri Ltd. Şti.</b> tarafından Giresun Teknopark'ta geliştirilen bir gönderim-öncesi değerlendirme platformudur. Amacımız masa-başı red oranını düşürmek ve araştırmacıya gerçekten uygulanabilir, kanıta dayalı geri bildirim sunmaktır.</>, <>Presubly is a pre-submission assessment platform developed by <b style={{ color: T.ink }}>Scitera Bilgi Teknolojileri Ltd. Şti.</b> at Giresun Teknopark. Our goal is to reduce desk-rejection rates and give researchers genuinely actionable, evidence-based feedback.</>)}</p>
        <p style={{ fontFamily: F.u, fontSize: 16, color: T.textMut, lineHeight: 1.75 }}>{t("Sıradan bir \"AI özetleyici\" değiliz: yapay zekâ yalnızca gözlem yapar; puanı, kararı ve kritik kapıları deterministik bir motor hesaplar. Böylece sonuç açıklanabilir, tekrarlanabilir ve savunulabilir olur.", "We're not a plain \"AI summarizer\": the AI only observes; a deterministic engine computes the score, decision and critical gates. So the result is explainable, reproducible and defensible.")}</p>
      </section>
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
          {vals.map((v) => (
            <div key={v.t.tr} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 24 }}>
              <span style={{ width: 42, height: 42, borderRadius: 11, background: "#D8EDE8", color: T.teal, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><v.Ic size={20} /></span>
              <div style={{ fontFamily: F.d, fontSize: 17, fontWeight: 700, color: T.ink, marginBottom: 6 }}>{L(v.t)}</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: T.textMut, lineHeight: 1.6 }}>{L(v.d)}</div>
            </div>
          ))}
        </div>
      </section>
      <section style={{ background: T.card, borderTop: `1px solid ${T.line}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "64px 24px" }}>
          <SectionHead kicker={t("Scitera Ekosistemi", "Scitera Ecosystem")} title={t("Akademik yayın hattı için dört ürün", "Four products for the academic publishing pipeline")} sub={t("Presubly, Scitera'nın akademik yayıncılık ürün ailesinin bir parçasıdır.", "Presubly is part of Scitera's academic publishing product family.")} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginTop: 40 }}>
            {eco.map((e) => (
              <div key={e.t} style={{ background: T.sage, border: `1px solid ${T.line}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontFamily: F.d, fontSize: 17, fontWeight: 700, color: T.ink, marginBottom: 6 }}>{e.t}</div>
                <div style={{ fontFamily: F.u, fontSize: 12.5, color: T.textMut, lineHeight: 1.55 }}>{L(e.d)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* — Hukuki sayfalar (taslak / draft) — */
const LEGAL = {
  privacy: {
    kicker: { tr: "Gizlilik Politikası", en: "Privacy Policy" }, title: { tr: "Gizlilik Politikası", en: "Privacy Policy" }, updated: { tr: "Temmuz 2026", en: "July 2026" },
    intro: { tr: "Presubly (Scitera Bilgi Teknolojileri Ltd. Şti.) olarak kişisel verilerinizin gizliliğine önem veriyoruz. Bu politika hangi verileri, hangi amaçla işlediğimizi açıklar.", en: "At Presubly (Scitera Bilgi Teknolojileri Ltd. Şti.) we care about the privacy of your personal data. This policy explains what data we process and why." },
    sections: [
      { h: { tr: "Topladığımız veriler", en: "Data we collect" }, body: [{ tr: "Hesap verileri: e-posta adresi ve şifre (şifreler güvenli biçimde saklanır).", en: "Account data: email address and password (passwords are stored securely)." }, { tr: "Kullanım kayıtları: hangi aracı ne zaman kullandığınız — kredi ve faturalandırma için.", en: "Usage logs: which tool you used and when — for credits and billing." }, { tr: "İsteğe bağlı: yalnızca 'Kaydet' derseniz saklanan rapor özetleri.", en: "Optional: report summaries stored only if you click 'Save'." }] },
      { h: { tr: "Makale metniniz", en: "Your paper text" }, body: [{ tr: "Yüklediğiniz makale metni sunucularımızda kalıcı olarak saklanmaz; yalnızca tarama anında analiz için yapay zekâ sağlayıcısına iletilir.", en: "The paper text you upload is not stored permanently on our servers; it is sent to the AI provider for analysis only at scan time." }, { tr: "Makale metniniz model eğitiminde kullanılmaz.", en: "Your paper text is not used for model training." }] },
      { h: { tr: "Üçüncü taraf hizmetler", en: "Third-party services" }, body: [{ tr: "Kimlik doğrulama ve veritabanı: Supabase. Yapay zekâ analizi: Anthropic (Claude). Barındırma ve güvenlik: Cloudflare. Bu sağlayıcılar yalnızca hizmetin sunulması için gerekli verilere erişir.", en: "Authentication and database: Supabase. AI analysis: Anthropic (Claude). Hosting and security: Cloudflare. These providers access only the data needed to deliver the service." }] },
      { h: { tr: "Haklarınız", en: "Your rights" }, body: [{ tr: "KVKK ve GDPR kapsamında verilerinize erişme, düzeltme, silme ve işlemeye itiraz etme haklarına sahipsiniz. Başvuru için info@scitera.net.", en: "Under KVKK and GDPR you have the right to access, correct, delete and object to the processing of your data. To request, email info@scitera.net." }] },
    ],
  },
  terms: {
    kicker: { tr: "Kullanım Şartları", en: "Terms of Use" }, title: { tr: "Kullanım Şartları", en: "Terms of Use" }, updated: { tr: "Temmuz 2026", en: "July 2026" },
    intro: { tr: "Presubly'yi kullanarak aşağıdaki şartları kabul etmiş olursunuz.", en: "By using Presubly you accept the following terms." },
    sections: [
      { h: { tr: "Hizmetin tanımı", en: "Description of the service" }, body: [{ tr: "Presubly, akademik makaleleri dergi gereksinimleri açısından değerlendiren bir gönderim-öncesi analiz aracıdır. Çıktılar tavsiye niteliğindedir; nihai yayın kararı ilgili dergiye aittir.", en: "Presubly is a pre-submission analysis tool that evaluates academic papers against journal requirements. Outputs are advisory; the final publication decision belongs to the journal." }] },
      { h: { tr: "Hesap ve sorumluluk", en: "Account and responsibility" }, body: [{ tr: "Hesap bilgilerinizin gizliliğinden siz sorumlusunuz. Yüklediğiniz içerik üzerinde gerekli haklara sahip olduğunuzu beyan edersiniz.", en: "You are responsible for keeping your account details confidential. You confirm that you hold the necessary rights to the content you upload." }] },
      { h: { tr: "Kabul edilebilir kullanım", en: "Acceptable use" }, body: [{ tr: "Hizmeti hukuka aykırı, üçüncü kişilerin haklarını ihlal eden veya sistemin işleyişini bozacak biçimde kullanamazsınız. Otomatik toplu erişim yalnızca API planı kapsamında yapılabilir.", en: "You may not use the service unlawfully, to infringe third-party rights, or to disrupt its operation. Automated bulk access is permitted only under the API plan." }] },
      { h: { tr: "Krediler ve ödeme", en: "Credits and payment" }, body: [{ tr: "Araçlar kredi ile çalışır. Ücretsiz plan aylık sınırlı tarama sunar. Satın alınan krediler, aksi belirtilmedikçe iade edilmez.", en: "Tools run on credits. The free plan offers a limited number of monthly scans. Purchased credits are non-refundable unless stated otherwise." }] },
      { h: { tr: "Sorumluluğun sınırı", en: "Limitation of liability" }, body: [{ tr: "Hizmet 'olduğu gibi' sunulur. Presubly, analiz çıktılarının doğruluğu veya yayın başarısı hakkında garanti vermez ve dolaylı zararlardan sorumlu tutulamaz.", en: "The service is provided 'as is'. Presubly makes no warranty as to the accuracy of analysis outputs or publication success, and is not liable for indirect damages." }] },
      { h: { tr: "Uygulanacak hukuk", en: "Governing law" }, body: [{ tr: "Bu şartlar Türkiye Cumhuriyeti hukukuna tabidir; uyuşmazlıklarda Ordu/Giresun mahkemeleri yetkilidir.", en: "These terms are governed by the laws of the Republic of Türkiye; the courts of Ordu/Giresun have jurisdiction over disputes." }] },
    ],
  },
  cookies: {
    kicker: { tr: "Çerez Politikası", en: "Cookie Policy" }, title: { tr: "Çerez Politikası", en: "Cookie Policy" }, updated: { tr: "Temmuz 2026", en: "July 2026" },
    intro: { tr: "Presubly, hizmetin çalışması ve deneyiminizi iyileştirmek için sınırlı sayıda çerez kullanır.", en: "Presubly uses a limited number of cookies to operate the service and improve your experience." },
    sections: [
      { h: { tr: "Çerez nedir?", en: "What is a cookie?" }, body: [{ tr: "Çerezler, ziyaret ettiğiniz sitelerin cihazınıza kaydettiği küçük metin dosyalarıdır.", en: "Cookies are small text files that the sites you visit save on your device." }] },
      { h: { tr: "Kullandığımız çerezler", en: "Cookies we use" }, body: [{ tr: "Zorunlu çerezler: oturum ve güvenlik için gereklidir; kapatılamaz.", en: "Essential cookies: required for session and security; cannot be disabled." }, { tr: "Tercih çerezleri: dil ve arayüz ayarlarınızı hatırlar.", en: "Preference cookies: remember your language and interface settings." }, { tr: "Analitik (isteğe bağlı): kullanımı anonim ölçmek için; onayınıza tabidir.", en: "Analytics (optional): to measure usage anonymously; subject to your consent." }] },
      { h: { tr: "Çerezleri yönetme", en: "Managing cookies" }, body: [{ tr: "Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsiniz; ancak bazı işlevler beklendiği gibi çalışmayabilir.", en: "You can delete or block cookies in your browser settings; however, some features may not work as expected." }] },
    ],
  },
  kvkk: {
    kicker: { tr: "KVKK / GDPR", en: "KVKK / GDPR" }, title: { tr: "KVKK & GDPR Aydınlatma Metni", en: "KVKK & GDPR Privacy Notice" }, updated: { tr: "Temmuz 2026", en: "July 2026" },
    intro: { tr: "6698 sayılı KVKK ve GDPR kapsamında, veri sorumlusu sıfatıyla kişisel verilerinizi aşağıdaki esaslarla işliyoruz.", en: "As data controller under Turkish Law No. 6698 (KVKK) and the GDPR, we process your personal data on the following bases." },
    sections: [
      { h: { tr: "Veri sorumlusu", en: "Data controller" }, body: [{ tr: "Scitera Bilgi Teknolojileri Ltd. Şti. — Giresun Teknopark, Bulancak / Giresun. İletişim: info@scitera.net.", en: "Scitera Bilgi Teknolojileri Ltd. Şti. — Giresun Teknopark, Bulancak / Giresun. Contact: info@scitera.net." }] },
      { h: { tr: "İşlenen veriler ve amaç", en: "Data processed and purpose" }, body: [{ tr: "Kimlik/iletişim (e-posta) ve kullanım verileri; hesap yönetimi, hizmet sunumu ve faturalandırma amacıyla işlenir.", en: "Identity/contact (email) and usage data are processed for account management, service delivery and billing." }] },
      { h: { tr: "Hukuki sebep", en: "Legal basis" }, body: [{ tr: "Sözleşmenin kurulması/ifası ve meşru menfaat (KVKK m.5; GDPR m.6).", en: "Formation/performance of the contract and legitimate interest (KVKK Art. 5; GDPR Art. 6)." }] },
      { h: { tr: "Aktarım", en: "Transfers" }, body: [{ tr: "Veriler yalnızca hizmetin sunulması için gerekli altyapı sağlayıcılarıyla (barındırma, kimlik doğrulama, AI analizi) paylaşılır.", en: "Data is shared only with infrastructure providers needed to deliver the service (hosting, authentication, AI analysis)." }] },
      { h: { tr: "Saklama süresi", en: "Retention period" }, body: [{ tr: "Veriler, ilgili mevzuatta öngörülen ve işleme amacının gerektirdiği süre boyunca saklanır; ardından silinir veya anonim hâle getirilir.", en: "Data is retained for the period required by applicable law and the processing purpose, then deleted or anonymized." }] },
      { h: { tr: "Haklarınız (KVKK m.11 / GDPR)", en: "Your rights (KVKK Art. 11 / GDPR)" }, body: [{ tr: "Verilerinize erişme, düzeltme, silme, işlemeyi kısıtlama ve itiraz etme haklarına sahipsiniz. Başvuru: info@scitera.net.", en: "You have the right to access, correct, delete, restrict processing of and object to your data. Requests: info@scitera.net." }] },
    ],
  },
  security: {
    kicker: { tr: "Güvenlik Bildirimi", en: "Security Notice" }, title: { tr: "Güvenlik & Açık Bildirimi", en: "Security & Disclosure" }, updated: { tr: "Temmuz 2026", en: "July 2026" },
    intro: { tr: "Kullanıcı verilerinin güvenliği önceliğimizdir. Güvenlik açıklarını sorumlu biçimde bildiren araştırmacılara teşekkür ederiz.", en: "The security of user data is our priority. We thank researchers who report vulnerabilities responsibly." },
    sections: [
      { h: { tr: "Güvenlik yaklaşımımız", en: "Our security approach" }, body: [{ tr: "Tüm trafik TLS 1.3 ile şifrelenir. API anahtarları yalnızca sunucu tarafında, şifreli ortam değişkenlerinde tutulur. Veritabanı satır-düzeyi güvenlik (RLS) ile korunur.", en: "All traffic is encrypted with TLS 1.3. API keys are kept server-side only, in encrypted environment variables. The database is protected with row-level security (RLS)." }] },
      { h: { tr: "Açık bildirimi (responsible disclosure)", en: "Responsible disclosure" }, body: [{ tr: "Bir güvenlik açığı tespit ederseniz lütfen info@scitera.net adresine ayrıntılı biçimde bildirin. Açığı kamuya açıklamadan önce düzeltmemize makul süre tanıyın.", en: "If you find a vulnerability, please report it in detail to info@scitera.net. Give us reasonable time to fix it before public disclosure." }] },
      { h: { tr: "Kapsam", en: "Scope" }, body: [{ tr: "presubly.com ve API uç noktaları kapsamdadır. Hizmet dışı bırakma (DoS), sosyal mühendislik ve fiziksel saldırılar kapsam dışıdır.", en: "presubly.com and the API endpoints are in scope. Denial of service (DoS), social engineering and physical attacks are out of scope." }] },
      { h: { tr: "Teşekkür", en: "Acknowledgements" }, body: [{ tr: "Geçerli bir açığı sorumlu biçimde bildiren araştırmacıları, izinleri dahilinde teşekkür listemizde anarız.", en: "We credit researchers who responsibly report a valid vulnerability in our acknowledgements, with their permission." }] },
    ],
  },
};
function LegalPage({ slug }) {
  const { t, L } = useLang();
  const d = LEGAL[slug];
  if (!d) return null;
  return (
    <>
      <PageHero kicker={L(d.kicker)} title={L(d.title)} sub={`${t("Son güncelleme", "Last updated")}: ${L(d.updated)}`} />
      <section style={{ maxWidth: 780, margin: "0 auto", padding: "44px 24px 72px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: T.amberSoft, border: `1px solid ${T.amber3}`, borderRadius: 12, padding: "14px 16px", marginBottom: 30 }}>
          <AlertTriangle size={18} color={T.amberDark} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontFamily: F.u, fontSize: 13, color: T.amberDark, lineHeight: 1.55 }}>{t(<><b>TASLAK — hukuki incelemeden geçmedi.</b> Bu metin bilgilendirme amaçlıdır; nihai sürüm yayımlanana kadar bağlayıcı değildir.</>, <><b>DRAFT — not legally reviewed.</b> This text is informational and not binding until the final version is published. The Turkish version prevails.</>)}</div>
        </div>
        <p style={{ fontFamily: F.u, fontSize: 15, color: T.textMut, lineHeight: 1.7, margin: "0 0 30px" }}>{L(d.intro)}</p>
        {d.sections.map((s) => (
          <div key={s.h.tr} style={{ marginBottom: 26 }}>
            <h3 style={{ fontFamily: F.d, fontSize: 19, fontWeight: 700, color: T.ink, margin: "0 0 10px" }}>{L(s.h)}</h3>
            {s.body.map((p, i) => <p key={i} style={{ fontFamily: F.u, fontSize: 14.5, color: T.textMut, lineHeight: 1.7, margin: "0 0 8px" }}>{L(p)}</p>)}
          </div>
        ))}
        <div style={{ marginTop: 38, paddingTop: 24, borderTop: `1px solid ${T.line}`, fontFamily: F.u, fontSize: 13, color: T.textFaint }}>
          {t("Sorularınız için", "For questions")} <a href="mailto:info@scitera.net" style={{ color: T.teal, fontWeight: 600 }}>info@scitera.net</a>.
        </div>
      </section>
    </>
  );
}

export default function Landing({ onEnterApp }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [page, setPage] = useState("home"); // home|pricing|features|how|kurumsal|guide|faq
  const [yearly, setYearly] = useState(false);
  const [authMode, setAuthMode] = useState(null); // null | "signin" | "signup"
  const [subEmail, setSubEmail] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const { lang, setLang, t, L } = useLang();

  // In "preview" mode (signed-in user viewing the landing from the app), every
  // CTA returns to the app instead of opening the auth screen.
  const openSignup = () => { if (onEnterApp) return onEnterApp(); setAuthMode("signup"); window.scrollTo(0, 0); };
  const openSignin = () => { if (onEnterApp) return onEnterApp(); setAuthMode("signin"); window.scrollTo(0, 0); };
  const Start = ({ children }) => <span onClick={openSignup} style={{ display: "contents" }}>{children}</span>;

  const goPage = (p) => { setPage(p); setMobileNav(false); window.scrollTo(0, 0); };
  const goHome = () => goPage("home");
  const goPricing = () => goPage("pricing");
  const goSection = (id) => {
    if (page !== "home") { goPage("home"); setTimeout(() => scrollTo(id), 80); }
    else scrollTo(id);
  };
  const NAV = [
    [{ tr: "Özellikler", en: "Features" }, "features"],
    [{ tr: "Nasıl çalışır?", en: "How it works" }, "how"],
    [{ tr: "Kurumsal", en: "Enterprise" }, "kurumsal"],
    [{ tr: "Kılavuz", en: "Guide" }, "guide"],
    [{ tr: "Fiyatlar", en: "Pricing" }, "pricing"],
    [{ tr: "SSS", en: "FAQ" }, "faq"],
  ];

  const cell = (val) => (val === true ? <Check /> : val === false ? <span style={{ color: T.line, fontSize: 18, fontWeight: 700 }}>–</span> : <span style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, fontFamily: F.m }}>{L(val)}</span>);
  const colBg = (i) => (PRICING_TIERS[i] === POPULAR ? "rgba(232,151,10,.06)" : "transparent");

  const Nav = (
    <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(242,247,245,.9)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.line}` }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", padding: "0 24px", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={goHome}>
          <Wordmark size={19} />
        </div>
        <nav className="lnav-links" style={{ marginLeft: "auto", display: "flex", gap: 24, alignItems: "center" }}>
          {NAV.map(([label, pid]) => {
            const active = page === pid;
            return (
              <span key={pid} className="lnav-link" onClick={() => goPage(pid)} style={{ fontFamily: F.u, fontSize: 13.5, fontWeight: active ? 700 : 500, color: active ? T.teal : T.textMut, cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.color = T.teal)} onMouseLeave={(e) => (e.currentTarget.style.color = active ? T.teal : T.textMut)}>{L(label)}</span>
            );
          })}
        </nav>
        <div style={{ marginLeft: 22, display: "flex", gap: 10, alignItems: "center" }}>
          <div className="lnav-lang" style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, border: `1px solid ${T.line}`, background: T.card, overflow: "hidden" }}>
            {["tr", "en"].map((lc) => (
              <button key={lc} onClick={() => setLang(lc)} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, padding: "6px 11px", border: "none", cursor: "pointer", background: lang === lc ? T.teal : "transparent", color: lang === lc ? "#fff" : T.textMut }}>{lc.toUpperCase()}</button>
            ))}
          </div>
          {onEnterApp ? (
            <button onClick={onEnterApp} className="lnav-cta" style={{ fontFamily: F.u, fontSize: 13.5, fontWeight: 700, padding: "10px 20px", borderRadius: 999, border: "none", background: T.teal, color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }}>{t("Panele dön", "Back to app")}<ArrowRight size={16} /></button>
          ) : (
            <>
              <span className="lnav-signin" onClick={openSignin} style={{ fontFamily: F.u, fontSize: 13.5, fontWeight: 600, color: T.textMut, cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.color = T.teal)} onMouseLeave={(e) => (e.currentTarget.style.color = T.textMut)}>{t("Giriş", "Sign in")}</span>
              <button onClick={openSignup} className="lnav-cta" style={{ fontFamily: F.u, fontSize: 13.5, fontWeight: 700, padding: "10px 20px", borderRadius: 999, border: "none", background: T.teal, color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }}>{t("Uygulamaya git", "Open app")}<ArrowRight size={16} /></button>
            </>
          )}
          <button className="lnav-burger" onClick={() => setMobileNav((v) => !v)} aria-label="Menü">{mobileNav ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {mobileNav && (
        <div className="lnav-drawer">
          {NAV.map(([label, pid]) => (
            <button key={pid} className="lnav-drawer-item" onClick={() => goPage(pid)} style={{ color: page === pid ? T.teal : T.ink }}>{L(label)}</button>
          ))}
          <div style={{ borderTop: `1px solid ${T.line}`, margin: "8px 0" }} />
          <div style={{ display: "flex", gap: 8, padding: "4px 8px 8px" }}>
            {["tr", "en"].map((lc) => (
              <button key={lc} onClick={() => setLang(lc)} style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, padding: "8px 16px", borderRadius: 8, border: `1px solid ${lang === lc ? T.teal : T.line}`, cursor: "pointer", background: lang === lc ? T.teal : "transparent", color: lang === lc ? "#fff" : T.ink }}>{lc.toUpperCase()}</button>
            ))}
          </div>
          {onEnterApp ? (
            <button className="lnav-drawer-item" onClick={() => { setMobileNav(false); onEnterApp(); }} style={{ color: T.teal }}>{t("Panele dön →", "Back to app →")}</button>
          ) : (
            <>
              <button className="lnav-drawer-item" onClick={() => { setMobileNav(false); openSignin(); }} style={{ color: T.ink }}>{t("Giriş", "Sign in")}</button>
              <button className="lnav-drawer-item" onClick={() => { setMobileNav(false); openSignup(); }} style={{ color: T.teal }}>{t("Uygulamaya git →", "Open app →")}</button>
            </>
          )}
        </div>
      )}
    </header>
  );

  const Home = (
    <>
      {/* HERO */}
      <section style={{ position: "relative", background: `linear-gradient(160deg,${T.tealMid} 0%,${T.teal} 58%,#072423 100%)`, color: "#fff", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -120, right: -80, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,151,10,.26), transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -150, left: -110, width: 440, height: 440, borderRadius: "50%", background: "radial-gradient(circle, rgba(21,107,107,.5), transparent 70%)" }} />
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px 88px", textAlign: "center", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.16)", padding: "6px 14px", borderRadius: 30, fontFamily: F.m, fontSize: 11.5, letterSpacing: "0.08em", fontWeight: 500, color: "#CFE0DA", marginBottom: 22 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.amber }} />SCITERA EDITORIAL SUITE
          </div>
          <h1 style={{ fontFamily: F.d, fontSize: "clamp(36px,6.4vw,62px)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.04, margin: 0 }}>
            {t(<>Gönderimden önce<br /><span style={{ color: T.amber3, fontStyle: "italic" }}>her şeyi</span> kontrol et.</>, <>Check <span style={{ color: T.amber3, fontStyle: "italic" }}>everything</span><br />before you submit.</>)}
          </h1>
          <p style={{ fontFamily: F.u, fontSize: "clamp(15px,2.4vw,18px)", color: "#B7CCC3", maxWidth: 620, margin: "22px auto 0", lineHeight: 1.6 }}>
            {t("Presubly, akademik makaleleri dergi gereksinimlerine göre tarar — biçim, yapı, etik ve kaynakça uyumluluğunu saniyeler içinde puanlı raporlar. Masa başı red oranını düşür.", "Presubly scans academic papers against journal requirements — scoring format, structure, ethics and reference compliance in seconds. Cut your desk-rejection rate.")}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 30 }}>
            <Start><button style={{ fontFamily: F.u, fontSize: 15.5, fontWeight: 600, padding: "14px 28px", borderRadius: 12, border: "none", background: T.amber, color: T.teal, cursor: "pointer", boxShadow: "0 8px 24px rgba(232,151,10,.3)" }}>{t("Makale yükle →", "Upload paper →")}</button></Start>
            <button onClick={() => goSection("how")} style={{ fontFamily: F.u, fontSize: 15.5, fontWeight: 600, padding: "14px 26px", borderRadius: 12, background: "rgba(255,255,255,.1)", color: "#fff", border: "1px solid rgba(255,255,255,.18)", cursor: "pointer" }}>{t("Nasıl çalışır?", "How it works?")}</button>
          </div>
          <div style={{ marginTop: 18, fontFamily: F.u, fontSize: 13, color: "#8FA89D" }}>{t("Kredi kartı gerekmez · 3 ücretsiz tarama · KVKK uyumlu", "No credit card · 3 free scans · KVKK-compliant")}</div>
          <ReportDemo />
        </div>
      </section>

      {/* STANDARDS */}
      <div style={{ borderBottom: `1px solid ${T.line}`, background: T.card }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 22, flexWrap: "wrap" }}>
          <span style={{ fontFamily: F.m, fontSize: 11.5, letterSpacing: "0.06em", color: T.textFaint }}>{t("UYGULANAN STANDARTLAR", "STANDARDS APPLIED")}</span>
          {STANDARDS.map((x) => <span key={x} style={{ fontFamily: F.m, fontSize: 13, fontWeight: 500, color: T.ink, opacity: 0.7 }}>{x}</span>)}
        </div>
      </div>

      {/* TOOLS SHOWCASE */}
      <section id="features" style={{ maxWidth: 1080, margin: "0 auto", padding: "88px 24px" }}>
        <SectionHead kicker={t("Araçlar", "Tools")} title={t("Gönderime giden her adım için bir araç", "A tool for every step to submission")} sub={t("Simülasyondan atıf denetimine, hakem yanıtından kapak mektubuna — Presubly makaleni editörün masasına oturmadan önce baştan sona hazırlar.", "From reviewer simulation to citation checks, reviewer responses to cover letters — Presubly prepares your paper end to end before it reaches the editor's desk.")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 76, marginTop: 64 }}>
          {SHOWCASE.map((s, i) => <ToolShowcase key={s.kicker.tr} {...s} flip={i % 2 === 1} />)}
        </div>

        {/* Kalan araçlar */}
        <div style={{ marginTop: 80 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <Eyebrow>{t("+5 Araç Daha", "+5 More Tools")}</Eyebrow>
            <div style={{ fontFamily: F.d, fontSize: 23, fontWeight: 700, color: T.ink, letterSpacing: "-0.01em" }}>{t("Ve süreci tamamlayan yardımcılar", "And the helpers that complete the process")}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
            {MORE.map((m) => (
              <div key={m.title.tr} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 20 }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: T.sageDark, color: T.teal, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><m.Ic size={19} /></span>
                <div style={{ fontFamily: F.d, fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 6 }}>{L(m.title)}</div>
                <div style={{ fontFamily: F.u, fontSize: 12.5, color: T.textMut, lineHeight: 1.55 }}>{L(m.d)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW — bağlı stepper */}
      <section id="how" style={{ background: T.card, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "76px 24px" }}>
          <SectionHead kicker={t("Akış", "Flow")} title={t("Üç adımda uyumluluk raporu", "A readiness report in three steps")} sub={t("Yükle, hedef dergini seç, puanlı raporunu al — hepsi tek oturumda.", "Upload, pick your target journal, get a scored report — all in one session.")} />
          <StepFlow />
        </div>
      </section>

      {/* KURUMSAL — bölünmüş: koyu pitch paneli + kitle listesi */}
      <section id="kurumsal" style={{ background: T.sage }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "82px 24px" }}>
          <div className="corp-split">
            {/* SOL — sticky koyu ikna paneli */}
            <div className="corp-pitch" style={{ background: `linear-gradient(160deg,${T.tealMid},${T.teal} 62%,#072423)`, borderRadius: 20, padding: "34px 30px", color: "#fff", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -80, right: -60, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(232,151,10,.2),transparent 70%)" }} />
              <div style={{ position: "relative" }}>
                <div style={{ fontFamily: F.m, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.amber3, marginBottom: 14 }}>{t("Kurumsal Çözümler", "Enterprise Solutions")}</div>
                <h2 style={{ fontFamily: F.d, fontSize: "clamp(25px,3.2vw,33px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", margin: 0 }}>{t("Kurumlar için ön-hakemlik altyapısı", "Pre-review infrastructure for institutions")}</h2>
                <p style={{ fontFamily: F.u, fontSize: 14.5, color: "#B7CCC3", lineHeight: 1.65, margin: "16px 0 24px" }}>{t("Dergi, üniversite, koordinatörlük ve yayınevleri için güvenli, yerli altyapı — kurum geneli erişim, raporlama ve API.", "Secure, local infrastructure for journals, universities, research offices and publishers — institution-wide access, reporting and API.")}</p>
                <div style={{ display: "grid", gap: 13, marginBottom: 28 }}>
                  {CORP_CAPS.map((c) => (
                    <div key={c.tr} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <Check c={T.amber3} s={17} />
                      <span style={{ fontFamily: F.u, fontSize: 13.5, color: "#EAF2EE", lineHeight: 1.5 }}>{L(c)}</span>
                    </div>
                  ))}
                </div>
                <a href="mailto:info@scitera.net?subject=Kurumsal%20Çözüm" style={{ textDecoration: "none" }}>
                  <button style={{ fontFamily: F.u, fontSize: 14.5, fontWeight: 600, padding: "13px 26px", borderRadius: 12, border: "none", background: T.amber, color: T.teal, cursor: "pointer", boxShadow: "0 8px 24px rgba(232,151,10,.26)" }}>{t("Kurumsal görüşme planla →", "Book an enterprise call →")}</button>
                </a>
              </div>
            </div>

            {/* SAĞ — kitle listesi */}
            <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
              {CORP.map((c) => (
                <div key={c.title.tr} className="corp-row">
                  <span style={{ width: 46, height: 46, borderRadius: 12, background: "#D8EDE8", display: "flex", alignItems: "center", justifyContent: "center", color: T.teal, flexShrink: 0 }}><c.Ic size={21} /></span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.d, fontSize: 17, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{L(c.title)}</div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: T.textMut, lineHeight: 1.55 }}>{L(c.d)}</div>
                  </div>
                  <ArrowRight size={18} className="corp-row-arrow" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ background: T.card }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "82px 24px" }}>
          <SectionHead kicker={t("SSS", "FAQ")} title={t("Sıkça sorulan sorular", "Frequently asked questions")} />
          <div style={{ marginTop: 36 }}>
            {FAQ_DATA.map((f, i) => (
              <div key={i} style={{ borderBottom: `1px solid ${T.line}` }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ display: "flex", alignItems: "center", width: "100%", padding: "18px 0", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: T.ink, flex: 1 }}>{L(f.q)}</span>
                  <span style={{ fontSize: 20, color: T.textFaint, transition: "transform .2s", transform: openFaq === i ? "rotate(45deg)" : "none" }}>+</span>
                </button>
                {openFaq === i && <div style={{ fontFamily: F.u, fontSize: 14, color: T.textMut, lineHeight: 1.65, padding: "0 0 18px", maxWidth: 600 }}>{L(f.a)}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );

  const PL = (tier) => (lang === "en" ? PLAN_LABEL_EN : PLAN_LABEL)[tier];
  const Pricing = (
    <section style={{ background: T.sage }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 24px 82px" }}>
        <SectionHead kicker={t("Fiyatlandırma", "Pricing")} title={t("Basit, şeffaf, araştırmacıya uygun", "Simple, transparent, researcher-friendly")} sub={t("Ücretsiz başla, ihtiyaç oldukça büyüt. Kademe yükseldikçe daha güçlü araçlar açılır. Yıllık ödemede 2 ay bedava.", "Start free, grow as you need. Higher tiers unlock more powerful tools. Pay yearly and get 2 months free.")} />

        {/* monthly / yearly toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
          <div style={{ display: "inline-flex", border: `1px solid ${T.line}`, borderRadius: 11, background: T.card, padding: 3 }}>
            <button onClick={() => setYearly(false)} style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", background: !yearly ? T.teal : "transparent", color: !yearly ? "#fff" : T.textMut }}>{t("Aylık", "Monthly")}</button>
            <button onClick={() => setYearly(true)} style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", background: yearly ? T.teal : "transparent", color: yearly ? "#fff" : T.textMut }}>{t("Yıllık", "Yearly")} <span style={{ color: yearly ? T.amber3 : T.amberDark }}>−17%</span></button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18, marginTop: 32, alignItems: "stretch" }}>
          {PRICING_TIERS.map((tier) => {
            const hi = tier === POPULAR;
            const pr = PLAN_PRICE[tier];
            const isEnt = tier === "enterprise";
            const price = isEnt ? t("Teklif", "Custom") : (yearly ? pr.y : pr.m);
            const note = lang === "en" ? PLAN_PRICE_NOTE_EN[tier] : pr.note;
            const feats = (lang === "en" ? PLAN_FEATURES_EN : PLAN_FEATURES)[tier];
            const tagline = (lang === "en" ? PLAN_TAGLINE_EN : PLAN_TAGLINE)[tier];
            return (
              <div key={tier} style={{ background: T.card, border: hi ? `2px solid ${T.amber}` : `1px solid ${T.line}`, borderRadius: 18, padding: 26, position: "relative", display: "flex", flexDirection: "column", boxShadow: hi ? "0 24px 50px -30px rgba(232,151,10,.5)" : "none" }}>
                {hi && <span style={{ position: "absolute", top: -12, left: 26, background: T.amber, color: T.teal, fontFamily: F.m, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", padding: "4px 12px", borderRadius: 20 }}>{t("EN POPÜLER", "MOST POPULAR")}</span>}
                <div style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: hi ? T.amberDark : T.textMut }}>{PL(tier).toUpperCase()}</div>
                <div style={{ fontFamily: F.u, fontSize: 11.5, color: T.textFaint, marginTop: 3 }}>{tagline}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "16px 0 3px" }}>
                  <span style={{ fontFamily: F.d, fontSize: isEnt ? 26 : 38, fontWeight: 700, color: T.ink }}>{price}</span>
                  {!isEnt && tier !== "free" && <span style={{ fontFamily: F.u, fontSize: 14, color: T.textMut, fontWeight: 600 }}>/ {yearly ? t("yıl", "yr") : t("ay", "mo")}</span>}
                </div>
                <div style={{ fontFamily: F.u, fontSize: 11.5, color: T.amberDark, marginBottom: 16, minHeight: 15 }}>{tier !== "free" && !isEnt ? note : " "}</div>
                <div style={{ display: "grid", gap: 9, flex: 1 }}>
                  {feats.map((f) => (
                    <div key={f} style={{ display: "flex", gap: 9, fontFamily: F.u, fontSize: 13, color: T.text, lineHeight: 1.4 }}><Check c={hi ? T.amberDark : T.success} />{f}</div>
                  ))}
                </div>
                <div style={{ marginTop: 22 }}>
                  {isEnt ? (
                    <a href="mailto:info@scitera.net?subject=Kurumsal"><button style={btn(false)}>{t("Teklif Al", "Get a quote")}</button></a>
                  ) : (
                    <Start><button style={btn(hi)}>{tier === "free" ? t("Ücretsiz Başla", "Start free") : t(`${PL(tier)}'e Geç →`, `Go ${PL(tier)} →`)}</button></Start>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* comparison table */}
        <div style={{ marginTop: 60 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontFamily: F.d, fontSize: 24, fontWeight: 700, color: T.ink }}>{t("Paketleri karşılaştır", "Compare plans")}</div>
            <p style={{ fontFamily: F.u, fontSize: 14, color: T.textMut, margin: "8px auto 0", maxWidth: 600 }}>{t("Dergi kütüphanesi, ileri araçlar ve paylaşım/API özellikleri üst paketlerde açılır.", "Journal library, advanced tools and sharing/API features unlock in higher tiers.")}</p>
          </div>
          <div style={{ overflowX: "auto", border: `1px solid ${T.line}`, borderRadius: 16, background: T.card }}>
            <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse", fontFamily: F.u, fontSize: 13.5 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "16px 18px", position: "sticky", left: 0, background: T.card, minWidth: 260 }}></th>
                  {PRICING_TIERS.map((tier, i) => (
                    <th key={tier} style={{ padding: "16px 14px", textAlign: "center", background: colBg(i), fontFamily: F.d, fontSize: 15, fontWeight: 700, color: tier === POPULAR ? T.amberDark : T.ink, borderBottom: `1px solid ${T.line}`, minWidth: 118 }}>{PL(tier)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((grp) => (<FragmentRows key={grp.g.tr} grp={grp} cell={cell} colBg={colBg} L={L} />))}
              </tbody>
            </table>
          </div>
          <div style={{ textAlign: "center", marginTop: 16, fontFamily: F.u, fontSize: 12, color: T.textFaint }}>{t("Fiyatlar örnektir; kurumsal ve toplu lisanslar için", "Prices are indicative; for enterprise and volume licenses")} <a href="mailto:info@scitera.net" style={{ color: T.teal, fontWeight: 600 }}>{t("bize yazın", "contact us")}</a>.</div>
        </div>
      </div>
    </section>
  );

  const Cta = (
    <section style={{ background: T.sage, padding: "10px 24px 78px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 28, background: `linear-gradient(150deg,${T.tealMid} 0%,${T.teal} 58%,#072423 100%)`, padding: "clamp(46px,7vw,72px) 24px", textAlign: "center" }}>
          <div style={{ position: "absolute", top: -110, right: -70, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(232,151,10,.24),transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: -130, left: -90, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(21,107,107,.5),transparent 70%)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.08)", border: "1px solid rgba(232,151,10,.4)", padding: "6px 14px", borderRadius: 30, fontFamily: F.m, fontSize: 11, letterSpacing: "0.12em", fontWeight: 600, color: T.amber3, marginBottom: 22 }}>
              <Sparkles size={12} />{t("SIRA SENDE", "YOUR TURN")}
            </div>
            <h2 style={{ fontFamily: F.d, fontSize: "clamp(28px,5vw,46px)", fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              {t(<>Makaleni göndermeye<br /><span style={{ color: T.amber3 }}>hazır mısın?</span></>, <>Ready to <span style={{ color: T.amber3 }}>submit</span><br />your paper?</>)}
            </h2>
            <p style={{ fontFamily: F.u, fontSize: "clamp(14px,2vw,16px)", color: "#B7CCC3", margin: "18px auto 0", maxWidth: 500, lineHeight: 1.6 }}>{t("Yükle, tara, dakikalar içinde puanlı uyumluluk raporunu al. İlk 3 taraman ücretsiz.", "Upload, scan, and get a scored readiness report in minutes. Your first 3 scans are free.")}</p>
            <div style={{ marginTop: 30 }}>
              <Start>
                <button style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", color: T.teal, border: "none", borderRadius: 999, padding: "9px 9px 9px 28px", fontFamily: F.u, fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 12px 34px rgba(0,0,0,.22)" }}>
                  {t("Ücretsiz başla", "Start free")}
                  <span style={{ width: 40, height: 40, borderRadius: "50%", background: T.teal, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowRight size={19} /></span>
                </button>
              </Start>
            </div>
            <div style={{ marginTop: 30, fontFamily: F.m, fontSize: 11.5, letterSpacing: "0.08em", color: "#7FA398" }}>{t("10 ARAÇ · 7 RAPORLAMA STANDARDI · KANIT-BAĞLI RAPOR", "10 TOOLS · 7 REPORTING STANDARDS · EVIDENCE-BASED REPORT")}</div>
          </div>
        </div>
      </div>
    </section>
  );

  const Footer = (
    <footer style={{ background: T.card, color: T.textMut, padding: "58px 24px 28px", borderTop: `1px solid ${T.line}` }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div className="pb-footer-grid">
          {/* marka + bülten + iletişim */}
          <div className="pb-footer-brand">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><Wordmark size={20} /></div>
            <p style={{ fontFamily: F.u, fontSize: 13.5, color: T.textMut, lineHeight: 1.6, maxWidth: 300, margin: "0 0 20px" }}>{t("Akademik makaleler için gönderim-öncesi uyumluluk motoru — tara, düzelt, güvenle gönder.", "The pre-submission compliance engine for academic papers — scan, fix, submit with confidence.")}</p>
            <form onSubmit={(e) => { e.preventDefault(); window.location.href = `mailto:info@scitera.net?subject=B%C3%BClten%20aboneli%C4%9Fi&body=${encodeURIComponent(subEmail)}`; }} style={{ display: "flex", gap: 8, marginBottom: 22, maxWidth: 380 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: T.sage, border: `1px solid ${T.line}`, borderRadius: 10, padding: "0 12px" }}>
                <Mail size={15} color={T.textFaint} />
                <input value={subEmail} onChange={(e) => setSubEmail(e.target.value)} placeholder={t("Bültene e-posta ile abone ol", "Subscribe with your email")} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.ink, fontFamily: F.u, fontSize: 13, padding: "11px 0" }} />
              </div>
              <button type="submit" style={{ fontFamily: F.u, fontSize: 13.5, fontWeight: 700, padding: "0 18px", borderRadius: 10, border: "none", background: T.amber, color: T.teal, cursor: "pointer", whiteSpace: "nowrap" }}>{t("Abone Ol", "Subscribe")}</button>
            </form>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 22px", marginBottom: 12 }}>
              <a href="mailto:info@scitera.net" className="pb-flink" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: F.u, fontSize: 13 }}><Mail size={14} />info@scitera.net</a>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: F.u, fontSize: 12.5, color: T.textFaint }}><MapPin size={14} />Giresun Teknopark, Bulancak / Giresun</div>
          </div>
          {/* link sütunları */}
          {FOOT_COLS.map((col) => (
            <div key={col.h.tr}>
              <div style={{ fontFamily: F.m, fontSize: 11, letterSpacing: "0.12em", color: T.ink, fontWeight: 600, marginBottom: 16 }}>{L(col.h)}</div>
              {col.links.map((l) => <FooterLink key={l.t.tr} link={l} goPage={goPage} goPricing={goPricing} />)}
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${T.line}`, marginTop: 42, paddingTop: 22, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px 18px" }}>
          <div style={{ fontFamily: F.m, fontSize: 11, color: T.textFaint }}>{t("© 2026 Scitera Bilgi Teknolojileri Ltd. Şti. · Tüm hakları saklıdır.", "© 2026 Scitera Bilgi Teknolojileri Ltd. Şti. · All rights reserved.")}</div>
          <div style={{ fontFamily: F.m, fontSize: 11, color: T.textFaint }}>{t("TLS 1.3 · KVKK · GDPR uyumlu · Veriler AI eğitiminde kullanılmaz", "TLS 1.3 · KVKK · GDPR-compliant · Data never used for AI training")}</div>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="pb-flink" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "transparent", border: "none", cursor: "pointer", fontFamily: F.m, fontSize: 11 }}>{t("↑ Yukarı", "↑ Top")}</button>
        </div>
      </div>
    </footer>
  );

  if (authMode) return <Auth mode={authMode} setMode={setAuthMode} onBack={() => setAuthMode(null)} />;

  const PAGES = {
    pricing: Pricing,
    features: <FeaturesPage onStart={openSignup} />,
    how: <HowPage onStart={openSignup} />,
    kurumsal: <EnterprisePage onStart={openSignup} />,
    faq: <FaqPage />,
    guide: <GuidePage onStart={openSignup} />,
    contact: <ContactPage />,
    about: <AboutPage onStart={openSignup} />,
    privacy: <LegalPage slug="privacy" />,
    terms: <LegalPage slug="terms" />,
    cookies: <LegalPage slug="cookies" />,
    kvkk: <LegalPage slug="kvkk" />,
    security: <LegalPage slug="security" />,
  };

  return (
    <div style={{ background: T.sage, fontFamily: F.u, minHeight: "100vh" }}>
      {Nav}
      {PAGES[page] || Home}
      {Cta}
      {Footer}
    </div>
  );
}

function FragmentRows({ grp, cell, colBg, L }) {
  return (
    <>
      <tr><td colSpan={5} style={{ padding: "14px 18px 6px", fontFamily: F.m, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.textMut, background: T.sage }}>{L(grp.g)}</td></tr>
      {grp.rows.map((r) => (
        <tr key={r.l.tr} style={{ borderTop: `1px solid ${T.line}` }}>
          <td style={{ padding: "11px 18px", color: T.ink, position: "sticky", left: 0, background: T.card }}>{L(r.l)}</td>
          {r.v.map((val, i) => (
            <td key={i} style={{ padding: "11px 14px", textAlign: "center", background: colBg(i) }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{cell(val)}</span>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

const btn = (hi) => ({
  width: "100%", justifyContent: "center", display: "inline-flex", alignItems: "center", gap: 7,
  fontFamily: F.u, fontSize: 14.5, fontWeight: 600, padding: "12px", borderRadius: 11, cursor: "pointer",
  border: hi ? "none" : `1px solid ${T.line}`, background: hi ? T.amber : "#fff", color: hi ? T.teal : T.ink,
});
