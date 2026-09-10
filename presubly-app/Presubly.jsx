import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLang } from "./lang.jsx";
import {
  Coins, Crown, Search, Bell, Globe, FileText, CreditCard, SquareTerminal,
  UserRound, ShieldCheck, LogOut, ChevronDown, Settings2, Users, MessageSquare, Send, Trash2,
  Menu, Highlighter, Lock, X, Gauge, PenLine, ListChecks, Mail, Quote, ArrowRight, BarChart3, ChevronRight, Check,
  Download, FileType2, Building2, RefreshCw, ThumbsUp, ThumbsDown,
  ClipboardList, CalendarDays, CircleAlert, Save,
} from "lucide-react";

/* Manuscript uzunluk sınırı — sunucudaki MAX_MESSAGE (claude.ts) ile eşleşir. */
const MAX_CHARS = 200000;
/* §20 — açıklanabilir denetim izi: bir rapor hangi yönerge sürümüyle üretildi. */
const PROMPT_VERSION = "2.8.0";

/* Read an Anthropic SSE stream and accumulate the text deltas. Streaming keeps
   the connection alive so long manuscripts don't hit Cloudflare's ~100s origin
   limit (HTTP 524). */
async function readSSE(res) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      const s = line.trim();
      if (!s.startsWith("data:")) continue;
      const js = s.slice(5).trim();
      if (!js || js === "[DONE]") continue;
      try {
        const ev = JSON.parse(js);
        if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") out += ev.delta.text || "";
      } catch { /* partial frame — ignore */ }
    }
  }
  return out;
}

/* Kredi birimi — emoji yerine lucide Coins (topnav ile tutarlı). currentColor'ı miras alır. */
const Cr = ({ n, size = 12 }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
    {n != null && n}<Coins size={size} strokeWidth={2} style={{ opacity: 0.85 }} />
  </span>
);

/* per-tool icons for the launcher */
const TOOL_ICON = {
  sim: Gauge, readiness: ShieldCheck, review: FileText, editorial: PenLine,
  response: MessageSquare, stats: BarChart3, checklist: ListChecks, citecheck: Quote, coverletter: Mail,
  revision: RefreshCw,
};
const TOOL_GROUPS = [
  { g: "Analiz Araçları", ids: ["sim", "readiness", "review", "stats", "checklist", "revision"] },
  { g: "Yazım & Atıf", ids: ["editorial", "response", "citecheck", "coverletter"] },
];
const GROUP_EN = { "Analiz Araçları": "Analysis Tools", "Yazım & Atıf": "Writing & Citation" };
const groupT = (g, lang) => (lang === "en" && GROUP_EN[g] ? GROUP_EN[g] : g);
import { useAuth } from "./authContext.js";
import { Logo, Wordmark } from "./Brand.jsx";
import Landing from "./Landing.jsx";
import { renderMarkdown } from "./md.js";
import { ReadinessReport, ReportBrandHeader, extractReport, extractJSON, downloadReport, scoreColor } from "./Report.jsx";
import { SimReport, downloadSim, simToMarkdown } from "./SimReport.jsx";
import { reportToMarkdown } from "./Report.jsx";
import { exportWord, exportPdf, exportAnnotatedWord, exportAnnotatedPdf, TEMPLATES, makeQR } from "./exports.js";
import { getComments, sevKey, SEV_LABEL } from "./Comments.jsx";
import { computeSim } from "./simEngine.js";
import { normalizeSim, normalizeReadiness, normalizeEditorial, normalizeResponse, normalizeCoverletter } from "./validate.js";
import { EditorialReport, editorialToMarkdown } from "./EditorialReport.jsx";
import { ResponseReport, responseToMarkdown } from "./ResponseReport.jsx";
import { CoverLetterReport, coverletterToMarkdown } from "./CoverLetterReport.jsx";
import { extractFileText } from "./fileText.js";
import { can, planRank, PLAN_LABEL, PLAN_LABEL_EN, requiredPlanLabel, PLAN_FEATURES, PLAN_FEATURES_EN, PLAN_PRICE } from "./plans.js";
import {
  TOOLS, TOOL_BY_ID, DISCIPLINES, STUDY_TYPES, WORK_TYPES, CREDIT_PACKS,
} from "./presubly-config.js";

const ACTION_LABEL = Object.fromEntries(TOOLS.map((t) => [t.action, t.short]));
const TITLES = {
  dash: "Panel", history: "Raporlarım", operations: "Gönderim Operasyon Merkezi", api: "API Erişimi", team: "Ekip",
  billing: "Plan & Faturalama", settings: "Hesabım", admin: "Yönetim",
  ...Object.fromEntries(TOOLS.map((t) => [t.id, t.title])),
};

/* ───────────────────────── shell ───────────────────────── */
export default function Presubly() {
  const auth = useAuth();
  const { lang, setLang, t } = useLang();
  const [view, setView] = useState("sim");
  const [toast, setToast] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(false);
  const [sbOpen, setSbOpen] = useState(false);
  const [toolQ, setToolQ] = useState("");
  const [revSeed, setRevSeed] = useState("");   // §20 linked re-review: prev findings → revision tool
  const [banner, setBanner] = useState(() => { try { return localStorage.getItem("psb_welcome") !== "0"; } catch { return true; } });
  const toastTimer = useRef(null);
  const startRevision = useCallback((seed) => { setRevSeed(seed || ""); setView("revision"); setSbOpen(false); window.scrollTo(0, 0); }, []);
  const dismissBanner = () => { setBanner(false); try { localStorage.setItem("psb_welcome", "0"); } catch { /* ignore */ } };

  const flash = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const nav = useCallback((v) => { setView(v); setSbOpen(false); window.scrollTo(0, 0); }, []);

  const isAdmin = !!auth?.isAdmin;
  const isPro = !!auth?.isPro;
  const plan = auth?.plan || "free";
  const credits = auth?.credits ?? 0;
  const email = auth?.user?.primaryEmailAddress?.emailAddress || "";
  const name = auth?.user?.fullName || email.split("@")[0] || "Kullanıcı";
  const initial = (name[0] || "K").toUpperCase();
  const planLabel = isAdmin ? "Süper Admin" : PLAN_LABEL[plan] || "Ücretsiz";

  const tool = TOOL_BY_ID[view];
  const isWs = !!tool;
  const clerk = null; // (kept for shape; UserMenu uses its own)

  if (showLanding) return <Landing onEnterApp={() => { setShowLanding(false); window.scrollTo(0, 0); }} />;

  const clean = (s) => (s || "").toLocaleLowerCase("tr");

  return (
    <div className="dkapp">
      {/* ── TOP NAV (dark) ── */}
      <header className="topnav">
        <div className="topnav-in">
          {isWs && <button className="hamburger topnav-burger" onClick={() => setSbOpen(true)} title={t("Araçlar", "Tools")}><Menu size={19} /></button>}
          <div className="topnav-logo" onClick={() => setShowLanding(true)} title={t("Anasayfa", "Home")}><Wordmark size={19} variant="dark" /></div>
          <div className="topnav-r">
            <button className="tn-pill tn-ws tb-hide" onClick={() => nav("operations")} title={t("Gönderim hazırlığını yönet", "Manage submission readiness")}><ClipboardList size={14} />{t("Gönderim Merkezi", "Submission Center")}</button>
            <button className="tn-pill tn-ws tb-hide" onClick={() => nav("team")} title={t("Çalışma alanı / ekip", "Workspace / team")}><Building2 size={14} />{t("Çalışma Alanı", "Workspace")}<ChevronDown size={12} style={{ opacity: 0.7 }} /></button>
            <button className="tn-pill" onClick={() => nav("billing")} title={t("Kredi bakiyesi", "Credit balance")}><Coins size={14} color="var(--a3)" />{isAdmin ? "∞" : credits}</button>
            <span className={`tn-badge ${isAdmin ? "adm" : isPro ? "pro" : "free"}`}>{isAdmin ? <><Crown size={12} />ADMIN</> : isPro ? <><Crown size={12} />PRO</> : "FREE"}</span>
            <button className="tn-ic tn-search tb-hide" onClick={() => flash(t("Komut paleti yakında.", "Command palette coming soon."))} title={t("Ara", "Search")}><Search size={15} /><kbd className="tn-kbd">⌘K</kbd></button>
            <button className="tn-ic tb-hide" onClick={() => flash(t("Yeni bildirim yok.", "No new notifications."))} title={t("Bildirimler", "Notifications")}><Bell size={16} /></button>
            <button className="tn-ic tn-lang tb-hide" onClick={() => setLang(lang === "tr" ? "en" : "tr")} title={t("Dil", "Language")}><Globe size={14} />{lang.toUpperCase()}<ChevronDown size={12} /></button>
            <div style={{ position: "relative" }}>
              <button className="av" style={{ cursor: "pointer", border: 0 }} onClick={() => setMenuOpen((v) => !v)} title={t("Hesap", "Account")}>{initial}</button>
              {menuOpen && <UserMenu auth={auth} flash={flash} nav={(v) => { setMenuOpen(false); nav(v); }} close={() => setMenuOpen(false)} />}
            </div>
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="dkbody">
        {isWs ? (
          <>
            {banner && (
              <div className="welcome">
                <button className="welcome-x" onClick={dismissBanner} title={t("Kapat", "Close")}><X size={16} /></button>
                <div className="welcome-l">
                  <div className="welcome-ey">{t("HOŞ GELDİN", "WELCOME")}</div>
                  <div className="welcome-t">{t(<>Üç adımda <em>ilk analizin</em> hazır.</>, <>Your <em>first analysis</em> in three steps.</>)}</div>
                  <div className="welcome-s">{isAdmin ? t("Sınırsız kredin var.", "You have unlimited credits.") : t(`${credits} kredin hazır.`, `${credits} credits ready.`)}</div>
                </div>
                <div className="welcome-steps">
                  {[[t("Çalışmanı yükle", "Upload your work"), t(".pdf / .docx yükle veya yapıştır", "Upload .pdf / .docx or paste")], [t("Araç & türü seç", "Pick tool & type"), t("Sol menüden araç, sonra tür", "Tool from the left menu, then type")], [t("AI ile analiz et", "Analyze with AI"), t("Radar + puanlı rapor", "Radar + scored report")]].map((s, i) => (
                    <div className="wstep" key={i}>
                      <span className="wstep-n">{i + 1}</span>
                      <span className="wstep-txt"><span className="wstep-t">{s[0]}</span><span className="wstep-d">{s[1]}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="dkws">
              {sbOpen && <div className="sb-backdrop" onClick={() => setSbOpen(false)} />}
              {/* LEFT — tool list */}
              <aside className={`dkleft${sbOpen ? " open" : ""}`}>
                <div className="dkleft-search">
                  <Search size={14} />
                  <input placeholder={t("Araç ara…", "Search tools…")} value={toolQ} onChange={(e) => setToolQ(e.target.value)} />
                </div>
                <div className="dkleft-list">
                  {TOOL_GROUPS.map((grp) => {
                    const items = grp.ids.map((id) => TOOL_BY_ID[id]).filter((t) => t && (!toolQ || clean(t.short + " " + t.desc).includes(clean(toolQ))));
                    if (!items.length) return null;
                    return (
                      <div key={grp.g}>
                        <div className="dkleft-sec">{groupT(grp.g, lang)}</div>
                        {items.map((t) => {
                          const Ic = TOOL_ICON[t.id] || FileText;
                          const locked = t.feature && !can(auth.plan, isAdmin, t.feature);
                          return (
                            <button key={t.id} className={`dkitem${view === t.id ? " on" : ""}`} onClick={() => { setView(t.id); setSbOpen(false); window.scrollTo(0, 0); }}>
                              <span className="dkitem-ic"><Ic size={16} /></span>
                              <span className="dkitem-t">{toolT(t, "short", lang)}</span>
                              {locked ? <Lock size={12} color="var(--a2)" /> : <span className="dkitem-cost"><Cr n={t.cost} size={11} /></span>}
                              <ChevronRight size={15} className="dkitem-chev" />
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </aside>
              {/* RIGHT — active tool */}
              <section className="dkright">
                {tool && <ToolView key={tool.id} tool={tool} auth={auth} nav={nav} flash={flash} seed={tool.id === "revision" ? revSeed : ""} onSeedUsed={() => setRevSeed("")} />}
              </section>
            </div>
          </>
        ) : (
          <div className="dkfull">
            <button className="mini-btn" style={{ alignSelf: "flex-start", marginBottom: 4 }} onClick={() => nav("sim")}>← {t("Araçlar", "Tools")}</button>
            {view === "history" && <HistoryView auth={auth} nav={nav} flash={flash} startRevision={startRevision} />}
            {view === "operations" && <SubmissionOperationsView auth={auth} nav={nav} flash={flash} startRevision={startRevision} />}
            {view === "team" && <TeamView auth={auth} nav={nav} flash={flash} />}
            {view === "api" && <ApiView auth={auth} nav={nav} flash={flash} />}
            {view === "billing" && <BillingView auth={auth} flash={flash} />}
            {view === "admin" && isAdmin && <AdminView auth={auth} flash={flash} />}
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

/* ───────────────────────── dashboard ───────────────────────── */
function Dashboard({ auth, nav }) {
  const isAdmin = !!auth?.isAdmin;
  const isPro = !!auth?.isPro;
  const credits = auth?.credits ?? 0;
  const uses = auth?.uses ?? 0;
  const name = (auth?.user?.firstName) || (auth?.user?.fullName || "").split(" ")[0] || "araştırmacı";
  const [logs, setLogs] = useState(null);
  const [banner, setBanner] = useState(() => { try { return localStorage.getItem("psb_welcome") !== "0"; } catch { return true; } });
  const dismiss = () => { setBanner(false); try { localStorage.setItem("psb_welcome", "0"); } catch { /* ignore */ } };
  const STEPS = [
    { t: "Çalışmanı yükle", d: ".pdf / .docx yükle veya metni yapıştır", to: "sim" },
    { t: "Araç & türü seç", d: "Hakem Simülasyonu, çalışma türü, disiplin", to: "sim" },
    { t: "AI ile analiz et", d: "Radar + puanlı rapor + yayın potansiyeli", to: "sim" },
  ];

  useEffect(() => {
    (async () => {
      try {
        const token = await auth.getToken();
        const r = await fetch("/api/usage", { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) { const d = await r.json(); setLogs(d.logs || []); } else setLogs([]);
      } catch { setLogs([]); }
    })();
  }, [auth]);

  const planLabel = isAdmin ? "Süper Admin" : isPro ? "Akademik" : "Ücretsiz";

  return (
    <div className="view on">
      {banner && (
        <div className="welcome">
          <button className="welcome-x" onClick={dismiss} title="Kapat"><X size={16} /></button>
          <div className="welcome-l">
            <div className="welcome-ey">HOŞ GELDİN</div>
            <div className="welcome-t">Üç adımda <em>ilk analizin</em> hazır.</div>
            <div className="welcome-s">{isAdmin ? "Sınırsız kredin var." : `${credits} kredin hazır.`}</div>
          </div>
          <div className="welcome-steps">
            {STEPS.map((s, i) => (
              <button className="wstep" key={i} onClick={() => nav(s.to)}>
                <span className="wstep-n">{i + 1}</span>
                <span className="wstep-txt"><span className="wstep-t">{s.t}</span><span className="wstep-d">{s.d}</span></span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="home">
        {/* LEFT — tool launcher */}
        <div className="home-main">
          {TOOL_GROUPS.map((grp) => (
            <div key={grp.g}>
              <div className="home-sec">{grp.g}</div>
              <div className="tool-cards">
                {grp.ids.map((id) => {
                  const t = TOOL_BY_ID[id]; if (!t) return null;
                  const Ic = TOOL_ICON[id] || FileText;
                  const locked = t.feature && !can(auth.plan, isAdmin, t.feature);
                  return (
                    <button className="tcard" key={id} onClick={() => nav(id)}>
                      <div className="tcard-head">
                        <div className="tcard-ic"><Ic size={19} /></div>
                        <span className="tcard-cost"><Cr n={t.cost} size={12} /></span>
                      </div>
                      <div className="tcard-t">{t.short}{locked && <Lock size={11} style={{ marginLeft: 6, color: "var(--a2)" }} />}</div>
                      <div className="tcard-d">{t.desc}</div>
                      <div className="tcard-go">Başlat <ArrowRight size={14} className="tcard-arrow" /></div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT — stats + recent + upsell */}
        <div className="home-side">
          <div className="statrow">
            <div className="statmini"><div className="sm-l">KREDİ</div><div className="sm-v">{isAdmin ? "∞" : credits}</div></div>
            <div className="statmini"><div className="sm-l">ANALİZ</div><div className="sm-v">{uses}</div></div>
            <div className="statmini"><div className="sm-l">PLAN</div><div className="sm-v" style={{ fontSize: 13 }}>{planLabel}</div></div>
          </div>
          <div className="card">
            <div className="card-h"><b>Son Analizler</b><a onClick={() => nav("history")}>Tümü →</a></div>
            {logs === null ? <div className="empty">Yükleniyor…</div>
              : logs.length === 0 ? <div className="empty">Henüz analiz yok. Bir araçla başla.</div>
              : (
                <div>
                  {logs.slice(0, 7).map((l, i) => (
                    <div className="row" key={i}>
                      <span className="row-tag" style={{ background: "var(--tll)", color: "var(--tl)" }}>{(ACTION_LABEL[l.action] || l.action || "İŞLEM").slice(0, 3).toUpperCase()}</span>
                      <div className="row-t">{ACTION_LABEL[l.action] || l.action}</div>
                      <span className="row-d">{fmtDate(l.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>
          {!isPro && (
            <div className="upsell">
              <div className="upsell-l">PRO'YA YÜKSELT</div>
              <div className="upsell-t">Sınırsız analiz, ekip & yorum, tüm araçlar</div>
              <button onClick={() => nav("billing")}>Planları Gör</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── generic AI tool ───────────────────────── */
/* Araç adları/açıklamaları — EN (config'i şişirmemek için burada). */
const TOOL_EN = {
  sim: { title: "Reviewer Simulation", short: "Reviewer Simulation", desc: "Scores your work across 8 dimensions like a real reviewer: content, format, structure, argument, literature, citations, risk, readability. Radar chart + overall score + publication potential." },
  readiness: { title: "Readiness Scan", short: "Readiness Scan", desc: "Scans the paper across 4 categories and dozens of checkpoints; produces a scored Readiness Report (format, references, ethics, language)." },
  review: { title: "Scientific Peer Review", short: "Peer Review", desc: "7 academic criteria on a 100-point scale. Major/minor prioritization and a concrete revision guide." },
  editorial: { title: "Editorial Assessment", short: "Editorial Assessment", desc: "Scope fit, ethics analysis and a structural desk-editor decision + author notification letter draft." },
  response: { title: "Response Assistant", short: "Response Assistant", desc: "Parses reviewer comments; classifies each (accept/partial/rebut/clarify) and produces a structured point-by-point response + change summary." },
  stats: { title: "Statistical Report Auditor", short: "Statistics Auditor", desc: "Reviews test selection, assumption checks, p-values / effect sizes / CIs and multiple-comparison corrections." },
  checklist: { title: "Submission Checklist", short: "Submission Checklist", desc: "The reporting standard fitting your study type is auto-selected; a clear color-coded decision per item." },
  citecheck: { title: "Citation–Reference Check", short: "Citation–Reference Check", desc: "Matches in-text citations against the reference list; finds unmatched, missing or extra entries and DOI/format issues." },
  coverletter: { title: "Cover Letter Generator", short: "Cover Letter", desc: "A professional cover-letter draft for the editor + fields to fill + a highlights list (one-tap copy)." },
  revision: { title: "Revision Verification", short: "Revision Verification", desc: "Verifies point by point whether findings from the previous assessment are truly resolved in the revised paper: Resolved / Partial / Unresolved / New issue." },
};
const toolT = (x, field, lang) => (lang === "en" && TOOL_EN[x?.id]?.[field] ? TOOL_EN[x.id][field] : x?.[field]);

const EN_DIRECTIVE =
  "\n\n=== LANGUAGE OVERRIDE (HIGHEST PRIORITY) ===\n" +
  "Write EVERY natural-language string value in the JSON output in fluent, academic ENGLISH " +
  "(summary, strengths, findings, suggestions, issue, suggestion, concern, note, notes, priority, decision, value fields, etc.).\n" +
  "BUT keep ALL JSON KEYS and ALL ENUM/CODE tokens EXACTLY as written in the schema above — do NOT translate them: " +
  "decisionCode (ACCEPT/MINOR_REVISION/MAJOR_REVISION/REJECT), status (clear/triggered/not_determinable/pass/warn/fail/unknown), " +
  "gate codes, severity (kritik/uyarı/öneri), and the section enum (Giriş/Yöntem/Bulgular/Tartışma/Sonuç/Kaynakça/Genel) stay verbatim.\n" +
  "The 'quote' fields must remain the exact verbatim text copied from the (possibly Turkish) manuscript — never translate quotes.";

function ToolView({ tool, auth, nav, flash, seed, onSeedUsed }) {
  const { lang, t } = useLang();
  const isAdmin = !!auth?.isAdmin;
  const credits = auth?.credits ?? 0;
  const [text, setText] = useState(seed ? `${seed}\n\n=== DÜZELTİLMİŞ MAKALE ===\n` : "");
  // §20 — linked re-review: seed the revision tool with the previous findings.
  useEffect(() => { if (seed) { setText(`${seed}\n\n=== DÜZELTİLMİŞ MAKALE ===\n`); onSeedUsed?.(); } }, []); // eslint-disable-line
  const [discipline, setDiscipline] = useState(DISCIPLINES[0]);
  const [study, setStudy] = useState(STUDY_TYPES[0]);
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState(null);
  const [report, setReport] = useState(null);
  const [sim, setSim] = useState(null);
  const [editorial, setEditorial] = useState(null);
  const [respObj, setRespObj] = useState(null);
  const [coverObj, setCoverObj] = useState(null);
  const [annComments, setAnnComments] = useState([]);   // anchored comments for text tools
  const [work, setWork] = useState(WORK_TYPES[0]);
  const [journals, setJournals] = useState([]);
  const [journalId, setJournalId] = useState("");
  const [saved, setSaved] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);
  const [prog, setProg] = useState(0);
  const [stage, setStage] = useState("");
  const [shareModal, setShareModal] = useState(null);
  const fileRef = useRef(null);

  // real-time-feel staged progress while the analysis runs
  useEffect(() => {
    if (!busy) { setProg(0); setStage(""); return; }
    const stages = tool.kind === "sim"
      ? ["İçerik çözümleniyor", "Biçim & dil", "Yapı & organizasyon", "Argüman tutarlılığı", "Literatür taranıyor", "Atıf & kaynakça", "Risk taraması", "Okunabilirlik", "Rapor derleniyor"]
      : tool.kind === "readiness"
        ? ["Yapı & biçim", "Kaynakça & atıf", "Etik & uyumluluk", "Dil & sunum", "Rapor derleniyor"]
        : ["Metin çözümleniyor", "Değerlendiriliyor", "Rapor derleniyor"];
    let i = 0; setProg(6); setStage(stages[0]);
    const iv = setInterval(() => {
      setProg((p) => Math.min(93, p + Math.random() * 6 + 2));
      i = (i + 1) % stages.length; setStage(stages[i]);
    }, 950);
    return () => clearInterval(iv);
  }, [busy, tool]);

  const wants = (k) => tool.selects.includes(k);
  const wantsJournal = tool.kind === "readiness" || tool.id === "checklist";
  const canJournals = can(auth.plan, isAdmin, "journals");
  const canDocx = can(auth.plan, isAdmin, "docx");
  const canHistory = can(auth.plan, isAdmin, "history");

  useEffect(() => {
    if (!wantsJournal || !canJournals) return;
    (async () => {
      try {
        const token = await auth.getToken();
        const r = await fetch("/api/journals", { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) { const d = await r.json(); setJournals(d.journals || []); }
      } catch { /* ignore */ }
    })();
  }, [auth, wantsJournal, canJournals]);

  /* Run `fn` only if the plan allows `feature`; otherwise nudge to Billing. */
  function gate(feature, fn) {
    if (can(auth.plan, isAdmin, feature)) return fn();
    flash(`Bu özellik ${requiredPlanLabel(feature)} plan gerektirir.`);
    nav("billing");
  }

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const name = (f.name || "").toLowerCase();
    const isText = /\.(txt|md|markdown)$/.test(name);
    const isRich = /\.(docx|pdf)$/.test(name);
    if (!isText && !isRich) { flash("Desteklenen formatlar: .pdf, .docx, .txt, .md"); return; }
    // .docx / .pdf require the docx feature (Academic+); admins pass.
    if (isRich && !canDocx) { flash(`.pdf / .docx yükleme ${requiredPlanLabel("docx")} plan gerektirir.`); nav("billing"); return; }

    setFileBusy(true);
    flash(t(`${name.split(".").pop().toUpperCase()} okunuyor…`, `Reading ${name.split(".").pop().toUpperCase()}…`));
    try {
      // Guard: never let a hung parser (e.g. a worker that fails to load) lock the
      // upload button forever. Generous — a long PDF legitimately takes a while.
      const text = await Promise.race([
        extractFileText(f),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 120000)),
      ]);
      if (!text || text.trim().length < 20) {
        flash(t("Dosyadan metin çıkarılamadı (taranmış/görsel PDF olabilir). Metni yapıştırın.", "Couldn't extract text from the file (it may be a scanned/image PDF). Please paste the text."));
      } else {
        setText(text);
        flash(t("Belge yüklendi", "Document loaded"));
      }
    } catch (err) {
      console.error("[upload] extract failed:", err);
      const timedOut = String(err?.message || "") === "timeout";
      flash(timedOut
        ? t("Belge çok büyük/karmaşık — okuma zaman aşımına uğradı. Daha kısa bir bölüm deneyin.", "Document too large/complex — reading timed out. Try a shorter section.")
        : isRich ? t("Belge okunamadı. Metni kopyalayıp yapıştırmayı deneyin.", "Couldn't read the document. Try copying and pasting the text.") : t("Dosya okunamadı.", "Couldn't read the file."));
    } finally {
      setFileBusy(false);
    }
  };

  async function run() {
    if (busy) return;
    setError("");
    if (tool.feature && !can(auth.plan, isAdmin, tool.feature)) {
      flash(t(`Bu araç ${requiredPlanLabel(tool.feature)} plan gerektirir.`, `This tool requires the ${requiredPlanLabel(tool.feature)} plan.`));
      nav("billing");
      return;
    }
    if (text.trim().length < 40) { flash(t("Lütfen daha uzun bir metin girin.", "Please enter a longer text.")); return; }
    if (text.length > MAX_CHARS) { flash(t(`Metin çok uzun (~${MAX_CHARS / 1000}k karakter sınırı). Çok uzun bir tez ise bölüm bölüm gönderin.`, `Text is too long (~${MAX_CHARS / 1000}k character limit). For a very long thesis, submit it section by section.`)); return; }
    if (!isAdmin && credits < tool.cost) {
      flash(t("Yetersiz kredi. Kredi yükleyin.", "Not enough credits. Please top up."));
      nav("billing");
      return;
    }
    setBusy(true);
    setOutput("");
    setParsed(null);
    setReport(null);
    setSim(null);
    setEditorial(null);
    setRespObj(null);
    setCoverObj(null);
    setAnnComments([]);
    setSaved(false);

    const ctx = [];
    if (wants("work")) ctx.push(`Çalışma türü: ${work}`);
    if (wants("discipline")) ctx.push(`Disiplin: ${discipline}`);
    if (wants("study")) ctx.push(`Çalışma tasarımı: ${study}`);
    const jr = journalRules(journals, journalId);
    if (jr) ctx.push(`Hedef dergi profili: ${jr}`);
    const userContent = (ctx.length ? `[${ctx.join(" · ")}]\n\n` : "") + text.trim();

    try {
      const token = await auth.getToken();
      const r = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          action: tool.action,
          system: tool.system + (lang === "en" ? EN_DIRECTIVE : ""),
          max_tokens: tool.kind === "sim" ? 12000 : tool.kind === "readiness" ? 8000 : 4000,
          stream: true,   // avoids Cloudflare's ~100s origin timeout (524) on long manuscripts
          messages: [{ role: "user", content: userContent }],
        }),
      });
      if (r.status === 402) {
        const d = await r.json().catch(() => ({}));
        setError(d.error || "Yetersiz kredi. Lütfen kredi yükleyin.");
        nav("billing"); return;
      }
      if (r.status === 401) { setError("Oturum doğrulanamadı. Sayfayı yenileyip tekrar deneyin."); return; }
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        console.error(`[${tool.action}] proxy ${r.status}`, d);
        // Clean message for end-users; append the raw provider/fallback detail for
        // unexpected failures OR when the current user is an admin (owner debugging).
        const showDetail = (!d.code || isAdmin) && d.detail;
        setError((d.error || `Sunucu hatası (${r.status}).`) + (showDetail ? ` — [tanı: ${String(d.detail).slice(0, 160)}]` : ""));
        return;
      }
      // Streaming returns SSE; non-stream returns the Anthropic JSON. Either way we
      // need the full TEXT block(s) — never assume content[0] is the answer.
      let data = {}, outText = "";
      if ((r.headers.get("content-type") || "").includes("event-stream")) {
        outText = await readSSE(r);
        data = { model: r.headers.get("X-Model") || "claude-sonnet-5", stop_reason: "end_turn" };
      } else {
        data = await r.json();
        outText = (Array.isArray(data?.content)
          ? data.content.filter((c) => c?.type === "text").map((c) => c.text || "").join("")
          : "") || "";
      }
      // annotate tools carry a trailing ```presubly-comments``` block — strip & parse it
      let displayText = outText;
      if (tool.annotate) {
        const ex = extractCommentsBlock(outText);
        displayText = ex.body;
        setAnnComments(getComments({ comments: ex.comments }));
      }
      // §4 — validate & normalise the AI JSON before it reaches the engine/renderer.
      const rdy = tool.kind === "readiness" ? normalizeReadiness(extractReport(displayText)) : null;
      const simObj = tool.kind === "sim" ? normalizeSim(extractJSON(displayText)) : null;
      const edu = tool.kind === "editorial" ? normalizeEditorial(extractJSON(displayText)) : null;
      const resp = tool.kind === "response" ? normalizeResponse(extractJSON(displayText)) : null;
      const cov = tool.kind === "coverletter" ? normalizeCoverletter(extractJSON(displayText)) : null;
      // §20 audit trail — stamp which model/engine/prompt version produced this.
      const meta = { model: data?.model || "claude-sonnet-5", engine: data?.engine || "anthropic", promptVersion: PROMPT_VERSION, at: new Date().toISOString() };
      if (rdy) rdy._meta = meta;
      if (simObj) simObj._meta = meta;
      if (edu) edu._meta = meta;
      if (resp) resp._meta = meta;
      if (cov) cov._meta = meta;
      setOutput(displayText);
      if (data?.engine === "workers-ai") flash("Ekonomik AI motoru kullanıldı — Anthropic bakiyesi yüklenince tam kaliteye döner.");
      if (rdy) setReport(rdy);
      else if (simObj) setSim(simObj);
      else if (edu) setEditorial(edu);
      else if (resp) setRespObj(resp);
      else if (cov) setCoverObj(cov);
      else if (tool.kind === "sim" || tool.kind === "readiness" || tool.kind === "editorial" || tool.kind === "response" || tool.kind === "coverletter") {
        console.error(`[${tool.kind}] JSON parse failed. len=${outText.length} stop=${data?.stop_reason} head=${JSON.stringify(outText.slice(0, 160))} tail=${JSON.stringify(outText.slice(-160))}`);
        setError(outText.trim()
          ? "Rapor yanıtı işlenemedi — model geçerli JSON döndürmedi. Lütfen tekrar deneyin (genelde 2. denemede düzelir); sorun sürerse metni biraz kısaltın."
          : "Model boş yanıt döndürdü. Lütfen tekrar deneyin.");
      }
      else if (tool.hasScore) setParsed(parseReview(displayText, tool));
      auth.refreshProfile?.();
      autoSave(displayText, rdy || simObj || edu || resp || cov); // persist to Raporlarım so nothing is lost
    } catch {
      setError(t("Bağlantı hatası. İnternetinizi kontrol edin.", "Connection error. Please check your internet."));
    } finally {
      setBusy(false);
    }
  }

  function download() {
    const md = `# Presubly · ${toolT(tool, "title", lang)}\n\n${output}\n\n---\nPresubly · presubly.com — ${new Date().toLocaleDateString(lang === "en" ? "en-US" : "tr-TR")}`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `presubly-${tool.id}.md`; a.click();
    URL.revokeObjectURL(url);
  }

  const reportTitle = () => (text.trim().split("\n")[0] || "Adsız makale").slice(0, 80);

  /* Sim reports no longer carry an AI total — compute it deterministically for
     the archive/score column. Others keep their own score/grade. */
  const scoreOf = (obj) => {
    if (!obj) return { score: null, grade: null };
    if (Array.isArray(obj.dimensions)) { const R = computeSim(obj); return { score: R.total, grade: R.grade }; }
    return { score: obj.score ?? null, grade: obj.grade ?? null };
  };

  /* Silently persist every successful run to the archive (paid/admin only) so
     the user can always find it again under "Raporlarım". */
  async function autoSave(outText, structured) {
    if (!canHistory) return;
    try {
      const token = await auth.getToken();
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: reportTitle(),
          tool: tool.id,
          ...scoreOf(structured),
          data: structured || { text: outText, toolTitle: tool.title },
        }),
      });
      if (res.ok) setSaved(true);
    } catch { /* non-blocking */ }
  }

  async function saveStructured(obj) {
    if (!obj) return;
    try {
      const token = await auth.getToken();
      const r = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: reportTitle(), tool: tool.id, ...scoreOf(obj), data: obj }),
      });
      if (r.ok) { setSaved(true); flash("Rapor arşive kaydedildi."); }
      else if (r.status === 402) { flash("Rapor arşivi Akademik plan gerektirir."); nav("billing"); }
      else flash("Kaydedilemedi.");
    } catch { flash("Bağlantı hatası."); }
  }

  async function shareStructured(obj) {
    if (!obj) return;
    try {
      const token = await auth.getToken();
      const r = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: reportTitle(), data: obj }),
      });
      if (r.status === 402) { flash(t("Paylaşım linki Kurumsal plan gerektirir.", "Share links require the Enterprise plan.")); nav("billing"); return; }
      if (!r.ok) { flash(t("Link oluşturulamadı.", "Couldn't create the link.")); return; }
      const d = await r.json();
      const url = `${location.origin}/#share-${d.id}`;
      let qr = null;
      try { qr = await makeQR(url); } catch { /* qr optional */ }
      try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
      setShareModal({ url, qr });
    } catch { flash("Bağlantı hatası."); }
  }

  return (
    <div className="view on">
      <div>
        <div className="tool-h">{toolT(tool, "title", lang)}</div>
        <div className="tool-sub">{toolT(tool, "desc", lang)} · <em><Cr n={tool.cost} size={12} /></em></div>
      </div>

      <div className="tool-grid">
        <div className="card composer">
          <div className="upload" onClick={() => !fileBusy && fileRef.current?.click()}>
            {fileBusy ? <span className="spin" style={{ borderColor: "rgba(10,61,61,.25)", borderTopColor: "var(--tl)" }} /> : <i>⇪</i>}
            <span>{fileBusy ? <strong>{t("Dosya okunuyor…", "Reading file…")}</strong> : <><strong>{canDocx ? t(".pdf / .docx / .txt / .md yükle", "Upload .pdf / .docx / .txt / .md") : t(".txt / .md yükle", "Upload .txt / .md")}</strong> {t("veya metni aşağıya yapıştır", "or paste text below")}{!canDocx && <em style={{ color: "var(--a2)", fontStyle: "normal" }}> · {t(".pdf/.docx için Akademik", ".pdf/.docx on Academic")}</em>}</>}</span>
          </div>
          <input ref={fileRef} type="file" accept={canDocx ? ".pdf,.docx,.txt,.md,.markdown" : ".txt,.md,.markdown"} style={{ display: "none" }} onChange={onFile} />
          <textarea className="ta" value={text} onChange={(e) => setText(e.target.value)} placeholder={tool.placeholder} />
          <div className="ta-count" style={{ color: text.length > MAX_CHARS ? "var(--er)" : text.length > MAX_CHARS * 0.9 ? "var(--a2)" : "var(--k5)" }}>
            {text.length.toLocaleString(lang === "en" ? "en-US" : "tr-TR")} / {MAX_CHARS.toLocaleString(lang === "en" ? "en-US" : "tr-TR")} {t("karakter", "characters")}{text.length > MAX_CHARS ? t(" · sınır aşıldı", " · limit exceeded") : ""}
          </div>
          <div className="composer-row">
            {wants("work") && (
              <select className="sel" value={work} onChange={(e) => setWork(e.target.value)} title={t("Çalışma türü", "Work type")}>
                {WORK_TYPES.map((w) => <option key={w}>{w}</option>)}
              </select>
            )}
            {wantsJournal && (canJournals ? (
              <select className="sel" value={journalId} onChange={(e) => setJournalId(e.target.value)} title={t("Hedef dergi profili", "Target journal profile")}>
                <option value="">{t("Dergi profili (genel)", "Journal profile (general)")}</option>
                {journals.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            ) : (
              <button className="sel" style={{ color: "var(--a2)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }} onClick={() => nav("billing")} title={t("Akademik plan", "Academic plan")}><Lock size={12} /> {t("Dergi profili", "Journal profile")}</button>
            ))}
            {wants("discipline") && (
              <select className="sel" value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
                {DISCIPLINES.map((d) => <option key={d}>{d}</option>)}
              </select>
            )}
            {wants("study") && (
              <select className="sel" value={study} onChange={(e) => setStudy(e.target.value)}>
                {STUDY_TYPES.map((s) => <option key={s}>{s}</option>)}
              </select>
            )}
            <button className="run-btn" onClick={run} disabled={busy}>
              {busy ? <><span className="spin" /> {tool.kind === "sim" ? t("Simüle ediliyor…", "Simulating…") : t("Taranıyor…", "Scanning…")}</> : (tool.kind === "sim" ? t("Simüle Et →", "Simulate →") : tool.kind === "readiness" ? t("Tara →", "Scan →") : t("Değerlendir →", "Evaluate →"))}
            </button>
          </div>
        </div>

        <div className="card crit-card">
          <b>{tool.hasScore ? t("DEĞERLENDİRME KRİTERLERİ", "EVALUATION CRITERIA") : t("NASIL ÇALIŞIR", "HOW IT WORKS")}</b>
          <div className="crit-list">
            {tool.criteria
              ? tool.criteria.map((c, i) => <span key={c}>{i + 1} · {c}</span>)
              : tool.tags.map((tg) => <span key={tg}>· {tg}</span>)}
          </div>
          <div className="crit-note">
            {t("Metin sunucuda saklanmaz; sadece değerlendirme için Anthropic Claude'a iletilir.", "Text is not stored on servers; it is sent to Anthropic Claude for evaluation only.")}
            {isAdmin ? t(" Admin: sınırsız kullanım.", " Admin: unlimited use.") : t(` Bu araç ${tool.cost} kredi harcar.`, ` This tool costs ${tool.cost} credits.`)}
          </div>
        </div>
      </div>

      {busy && (
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12.5 }}>
            <span style={{ color: "var(--k3)", fontWeight: 600 }}><span className="spin" style={{ borderColor: "rgba(10,61,61,.2)", borderTopColor: "var(--tl)", marginRight: 8, verticalAlign: "middle" }} />{stage}…</span>
            <span style={{ fontFamily: "var(--fm)", color: "var(--k4)" }}>%{Math.round(prog)}</span>
          </div>
          <div className="prog-bar"><i style={{ width: `${prog}%` }} /></div>
        </div>
      )}

      {error && <div className="card" style={{ padding: 18 }}><div className="err-box">{error}</div></div>}

      {tool.kind === "sim" && sim && (
        <>
          <SimReport
            sim={sim}
            onDownload={() => downloadSim(sim)}
            actions={
              <>
                <button className="res-dl" onClick={() => gate("history", () => saveStructured(sim))} disabled={saved}>{saved ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Check size={13} />{t("Kaydedildi", "Saved")}</span> : t("Kaydet", "Save")}</button>
                <button className="res-dl" onClick={() => gate("share", () => shareStructured(sim))}>{t("Paylaş", "Share")}</button>
              </>
            }
          />
          <DownloadBar md={simToMarkdown(sim)} title="Hakem Simülasyonu" filenameBase="presubly-hakem-simulasyonu" gate={(fn) => gate("pdf", fn)} />
        </>
      )}

      {tool.kind === "sim" && sim && text && (
        <AnnotatedManuscript text={text} comments={getComments(sim)} filenameBase="presubly-yorumlu-nusha" gate={(fn) => gate("pdf", fn)} />
      )}

      {tool.kind === "readiness" && report && text && (
        <AnnotatedManuscript text={text} comments={getComments(report)} filenameBase="presubly-yorumlu-nusha" gate={(fn) => gate("pdf", fn)} />
      )}

      {annComments.length > 0 && text && (
        <AnnotatedManuscript text={text} comments={annComments} filenameBase="presubly-yorumlu-nusha" gate={(fn) => gate("pdf", fn)} />
      )}

      {tool.kind === "readiness" && report && (
        <>
          <ReadinessReport
            report={report}
            onDownload={() => downloadReport(report)}
            actions={
              <>
                <button className="res-dl" onClick={() => gate("history", () => saveStructured(report))} disabled={saved}>{saved ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Check size={13} />{t("Kaydedildi", "Saved")}</span> : t("Kaydet", "Save")}</button>
                <button className="res-dl" onClick={() => gate("share", () => shareStructured(report))}>{t("Paylaş", "Share")}</button>
              </>
            }
          />
          <DownloadBar md={reportToMarkdown(report)} title="Uyumluluk Raporu" filenameBase="presubly-uyumluluk-raporu" gate={(fn) => gate("pdf", fn)} />
        </>
      )}

      {tool.kind === "editorial" && editorial && (
        <>
          <EditorialReport
            report={editorial}
            onDownload={() => { const md = editorialToMarkdown(editorial); const b = new Blob([md], { type: "text/markdown;charset=utf-8" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "presubly-editoryal.md"; a.click(); URL.revokeObjectURL(u); }}
            actions={<button className="res-dl" onClick={() => gate("history", () => saveStructured(editorial))} disabled={saved}>{saved ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Check size={13} />{t("Kaydedildi", "Saved")}</span> : t("Kaydet", "Save")}</button>}
          />
          <DownloadBar md={editorialToMarkdown(editorial)} title="Editöryal Değerlendirme" filenameBase="presubly-editoryal-degerlendirme" gate={(fn) => gate("pdf", fn)} />
        </>
      )}

      {tool.kind === "response" && respObj && (
        <>
          <ResponseReport
            report={respObj}
            onDownload={() => { const md = responseToMarkdown(respObj); const b = new Blob([md], { type: "text/markdown;charset=utf-8" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "presubly-hakem-yaniti.md"; a.click(); URL.revokeObjectURL(u); }}
            actions={<button className="res-dl" onClick={() => gate("history", () => saveStructured(respObj))} disabled={saved}>{saved ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Check size={13} />{t("Kaydedildi", "Saved")}</span> : t("Kaydet", "Save")}</button>}
          />
          <DownloadBar md={responseToMarkdown(respObj)} title="Hakem Yanıtı" filenameBase="presubly-hakem-yaniti" gate={(fn) => gate("pdf", fn)} />
        </>
      )}

      {tool.kind === "coverletter" && coverObj && (
        <>
          <CoverLetterReport
            report={coverObj}
            onDownload={() => { const md = coverletterToMarkdown(coverObj); const b = new Blob([md], { type: "text/markdown;charset=utf-8" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "presubly-kapak-mektubu.md"; a.click(); URL.revokeObjectURL(u); }}
            actions={<button className="res-dl" onClick={() => gate("history", () => saveStructured(coverObj))} disabled={saved}>{saved ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Check size={13} />{t("Kaydedildi", "Saved")}</span> : t("Kaydet", "Save")}</button>}
          />
          <DownloadBar md={coverletterToMarkdown(coverObj)} title="Kapak Mektubu" filenameBase="presubly-kapak-mektubu" gate={(fn) => gate("pdf", fn)} />
        </>
      )}

      {output && !(tool.kind === "readiness" && report) && !(tool.kind === "sim" && sim) && !(tool.kind === "editorial" && editorial) && !(tool.kind === "response" && respObj) && !(tool.kind === "coverletter" && coverObj) && (
        <>
        <div className="card result on">
          <ReportBrandHeader title={toolT(tool, "title", lang)} />
          {parsed && (
            <>
              <div className="res-top">
                <div className="res-score">
                  <b style={{ color: scoreColor(parsed.score) }}>{parsed.score ?? "—"}</b><span>/100</span>
                </div>
                <div className="res-dec">
                  <b>{parsed.decision || t("Değerlendirme", "Assessment")}</b>
                  <p>{toolT(tool, "title", lang)}</p>
                </div>
                <span className="res-actions"><button className="res-dl" onClick={download} title={t("Markdown indir", "Download Markdown")}>.md</button></span>
              </div>
              {parsed.bars.length > 0 && (
                <div className="res-bars" style={{ gridTemplateColumns: `repeat(${parsed.bars.length},1fr)` }}>
                  {parsed.bars.map((b) => (
                    <div className="rb" key={b.label}>
                      <div className="rb-l" title={b.label}>{b.label.toUpperCase()}</div>
                      <div className="rb-bar"><i className={b.value < 70 ? "low" : ""} style={{ width: `${b.value}%` }} /></div>
                      <div className="rb-v">{b.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {!parsed && (
            <div className="res-top">
              <div className="res-dec"><b>{t("Sonuç hazır", "Result ready")}</b><p>{toolT(tool, "title", lang)}</p></div>
              <button className="res-dl" onClick={download}>{t("Raporu İndir (.md)", "Download report (.md)")}</button>
            </div>
          )}
          <div className="ai-out" dangerouslySetInnerHTML={{ __html: renderMarkdown(output) }} />
        </div>
        <DownloadBar md={output} title={toolT(tool, "title", lang)} filenameBase={`presubly-${tool.id}`} gate={(fn) => gate("pdf", fn)} />
        </>
      )}

      {output && saved && canHistory && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--tl)", fontWeight: 600, cursor: "pointer" }} onClick={() => nav("history")}>
          <Check size={15} style={{ flexShrink: 0 }} /><span>{t(<>Bu analiz <b>Raporlarım</b>'a kaydedildi — görüntüle / indir</>, <>Saved to <b>My Reports</b> — view / download</>)}</span><ArrowRight size={14} style={{ flexShrink: 0 }} />
        </div>
      )}

      {shareModal && <ShareModal data={shareModal} close={() => setShareModal(null)} />}
    </div>
  );
}

/* ── Share modal with QR verification ── */
function ShareModal({ data, close }) {
  const { t } = useLang();
  return (
    <>
      <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,26,20,.4)", zIndex: 90 }} />
      <div style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", zIndex: 91, width: 380, maxWidth: "calc(100vw - 32px)", background: "var(--card)", border: "1px solid var(--ln)", borderRadius: 16, boxShadow: "0 24px 60px rgba(10,61,61,.3)", padding: 24, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--fd)", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{t("Rapor paylaşıldı", "Report shared")}</div>
        <div style={{ fontSize: 12.5, color: "var(--k4)", marginBottom: 16 }}>{t("Link 7 gün geçerli · QR ile doğrulanabilir", "Link valid for 7 days · verifiable via QR")}</div>
        {data.qr && <img src={data.qr} alt="QR" style={{ width: 180, height: 180, border: "1px solid var(--ln)", borderRadius: 12, padding: 8, background: "#fff" }} />}
        <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
          <input className="inp" style={{ margin: 0, fontSize: 12, fontFamily: "var(--fm)" }} value={data.url} readOnly onFocus={(e) => e.target.select()} />
          <button className="btn btn-a" style={{ padding: "9px 14px", borderRadius: 9, fontSize: 12.5 }} onClick={() => { navigator.clipboard?.writeText(data.url); }}>{t("Kopyala", "Copy")}</button>
        </div>
        <button className="mini-btn" style={{ marginTop: 12 }} onClick={close}>{t("Kapat", "Close")}</button>
      </div>
    </>
  );
}

/* ── Presubly Yorumlu Nüsha: manuscript marked with anchored referee comments ── */
function escHtml(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
/* Text tools with `annotate` append a ```presubly-comments``` JSON block; pull it
   out, return the visible body (block stripped) and the parsed comment array. */
function extractCommentsBlock(text) {
  const m = String(text || "").match(/```presubly-comments\s*([\s\S]*?)```/i);
  if (!m) return { body: text, comments: [] };
  const body = String(text).replace(m[0], "").trim();
  const raw = m[1].trim();
  let arr = [];
  try { arr = JSON.parse(raw); }
  catch {
    const s = raw.indexOf("["), e = raw.lastIndexOf("]");
    if (s !== -1 && e > s) { try { arr = JSON.parse(raw.slice(s, e + 1)); } catch { arr = []; } }
  }
  return { body, comments: Array.isArray(arr) ? arr : [] };
}
const sevCls = (s) => (s === "kritik" ? "hl-fail" : s === "uyarı" ? "hl-warn" : "hl-note");
function buildAnnotated(text, comments) {
  let esc = escHtml(text);
  comments.forEach((c, i) => {
    const q = escHtml(String(c.quote).trim());
    const idx = esc.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) { c._matched = false; return; }
    c._matched = true;
    esc = esc.slice(0, idx) + `<mark class="${sevCls(c.severity)}">` + esc.slice(idx, idx + q.length) + `</mark><sup class="pc-mark pc-${sevKey(c.severity)}">P${i + 1}</sup>` + esc.slice(idx + q.length);
  });
  return esc.replace(/\n/g, "<br/>");
}
/* Plain-text annotated copy for Word/PDF export: manuscript with [P#] markers + appendix. */
function annotatedMarkdown(text, comments) {
  let body = text;
  comments.forEach((c, i) => {
    const q = String(c.quote).trim();
    const idx = body.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return;
    const end = idx + q.length;
    body = body.slice(0, end) + ` [P${i + 1}]` + body.slice(end);
  });
  const lines = [`# Presubly · Yorumlu Nüsha`, ``, body, ``, `---`, ``, `## Presubly Hakem Yorumları`, ``];
  comments.forEach((c, i) => {
    lines.push(`**P${i + 1} · ${SEV_LABEL[c.severity]} · ${c.section}** — "${String(c.quote).trim()}"`);
    if (c.issue) lines.push(`Sorun: ${c.issue}`);
    if (c.suggestion) lines.push(`Öneri: ${c.suggestion}`);
    lines.push("");
  });
  return lines.join("\n");
}
/* §20 — per-finding feedback (localStorage tally; feeds future quality tuning). */
function CommentFeedback({ ckey }) {
  const [v, setV] = useState(() => { try { return localStorage.getItem("pcf_" + ckey) || ""; } catch { return ""; } });
  const set = (val) => { const nv = v === val ? "" : val; setV(nv); try { nv ? localStorage.setItem("pcf_" + ckey, nv) : localStorage.removeItem("pcf_" + ckey); } catch { /* ignore */ } };
  return (
    <div className="pc-fb" title="Bu yorum işine yaradı mı?">
      <button className={v === "up" ? "on" : ""} onClick={() => set("up")} aria-label="Faydalı"><ThumbsUp size={12} /></button>
      <button className={v === "down" ? "on" : ""} onClick={() => set("down")} aria-label="Faydasız"><ThumbsDown size={12} /></button>
    </div>
  );
}

function AnnotatedManuscript({ text, comments, filenameBase, gate }) {
  const [open, setOpen] = useState(true);
  if (!comments.length || !text) return null;
  const html = buildAnnotated(text, comments);   // also sets c._matched (evidence check)
  const verified = comments.filter((c) => c._matched).length;
  const run = (fn) => (gate ? gate(fn) : fn());
  const base = filenameBase || "presubly-yorumlu-nusha";
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
        <Highlighter size={17} color="var(--tl)" />
        <b style={{ fontFamily: "var(--fd)", fontSize: 15, flex: 1 }}>Presubly Yorumlu Nüsha <span style={{ color: "var(--k4)", fontWeight: 400, fontSize: 13 }}>· {comments.length} hakem yorumu</span></b>
        <span style={{ color: "var(--k5)", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: "0 18px 18px" }}>
          <div className="dlbar" style={{ marginBottom: 14 }}>
            <div className="dlbar-l"><Download size={16} /><span>Yorumlu nüshayı indir</span></div>
            <div className="dlbar-r">
              <button className="dlbar-btn word" onClick={() => run(() => exportAnnotatedWord(text, comments, base))} title="Yorumlu nüsha — Word"><FileText size={15} />Word</button>
              <button className="dlbar-btn pdf" onClick={() => run(() => exportAnnotatedPdf(text, comments, base))} title="Yorumlu nüsha — PDF (kenar notlu)"><FileType2 size={15} />PDF</button>
            </div>
          </div>
          <div className="pc-legend">
            <span><span className="pc-dot pc-krit" />Kritik</span>
            <span><span className="pc-dot pc-uyar" />Uyarı</span>
            <span><span className="pc-dot pc-oner" />Öneri</span>
            <span className="pc-verify" title="Alıntısı metinde birebir bulunan (kanıtı doğrulanan) yorum sayısı">🛡 {verified}/{comments.length} kanıt doğrulandı</span>
          </div>
          <div className="pc-split">
            <div className="hl-doc" dangerouslySetInnerHTML={{ __html: html }} />
            <div className="pc-list">
              {comments.map((c, i) => (
                <div key={i} className={`pc-card pc-b-${sevKey(c.severity)}`}>
                  <div className="pc-chead">
                    <span className={`pc-badge pc-bg-${sevKey(c.severity)}`}>P{i + 1} · {SEV_LABEL[c.severity]}</span>
                    <span className="pc-sec">{c.section}</span>
                    {c._matched
                      ? <span className="pc-ev pc-ev-ok" title="Alıntı metinde birebir doğrulandı">kanıt ✓</span>
                      : <span className="pc-ev pc-ev-no" title="Alıntı metinde birebir bulunamadı — doğrulanamadı">kanıt ✕</span>}
                  </div>
                  <div className="pc-quote">"{String(c.quote).trim()}"</div>
                  {c.issue && <div className="pc-issue">{c.issue}</div>}
                  {c.suggestion && <div className="pc-sug"><b>Öneri:</b> {c.suggestion}</div>}
                  <div className="pc-cfoot">
                    <CommentFeedback ckey={`${sevKey(c.severity)}-${String(c.quote).trim().slice(0, 48).toLowerCase()}`} />
                    <span className="pc-brand">— Presubly Hakem</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Multi-format export: template + Word + PDF ── */
/* Amaca özel indirme çubuğu — her raporun hemen altında Word + PDF.
   Marka renkleri: Word = teal (birincil), PDF = amber (aksan). `gate` verilirse
   dışa aktarım o özellik kapısından geçer (yoksa doğrudan indirir). */
function DownloadBar({ md, title, filenameBase, gate, note }) {
  const [tpl, setTpl] = useState("bilimsel");
  if (!md || !md.trim()) return null;                 // boş içerikte indirme çubuğu gösterme
  const run = (fn) => (gate ? gate(fn) : fn());
  return (
    <div className="dlbar">
      <div className="dlbar-l"><Download size={16} /><span>{note || "Bu raporu indir"}</span></div>
      <div className="dlbar-r">
        <select className="dlbar-tpl" value={tpl} onChange={(e) => setTpl(e.target.value)} title="Belge şablonu">
          {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button className="dlbar-btn word" onClick={() => run(() => exportWord(md, title, tpl, filenameBase))} title="Word (.doc) indir"><FileText size={15} />Word</button>
        <button className="dlbar-btn pdf" onClick={() => run(() => exportPdf(md, title, tpl, filenameBase))} title="PDF indir"><FileType2 size={15} />PDF</button>
      </div>
    </div>
  );
}

/* ───────────────────────── billing ───────────────────────── */
const BILLING_TIERS = ["free", "academic", "pro", "enterprise"];

function BillingView({ auth, flash }) {
  const { t, lang } = useLang();
  const en = lang === "en";
  const PL = (tier) => (en ? PLAN_LABEL_EN : PLAN_LABEL)[tier];
  const PF = (tier) => (en ? PLAN_FEATURES_EN : PLAN_FEATURES)[tier];
  const isAdmin = !!auth?.isAdmin;
  const plan = isAdmin ? "enterprise" : (auth?.plan || "free");
  const credits = auth?.credits ?? 0;
  const [yearly, setYearly] = useState(false);
  const [pack, setPack] = useState(2);
  const soon = () => flash(t("Ödeme entegrasyonu yakında (Phase 2).", "Payment integration coming soon (Phase 2)."));

  return (
    <div className="view on">
      <div className="bill-hero">
        <div className="bill-hero-l">
          <div className="l">{t("MEVCUT PLAN", "CURRENT PLAN")}</div>
          <div className="n">{isAdmin ? t("Süper Admin", "Super Admin") : PL(plan)} {plan !== "enterprise" && <small>{PLAN_PRICE[plan].m}{plan !== "free" ? t("/ay", "/mo") : ""}</small>}</div>
          <div className="s">{PF(plan).slice(0, 3).join(" · ")}</div>
        </div>
        <div className="bill-hero-r">
          <div className="l">{t("Kredi bakiyesi", "Credit balance")}</div>
          <div className="n"><Cr n={isAdmin ? "∞" : credits} size={16} /></div>
        </div>
      </div>

      <div className="bill-row">
        <b>{t("Paketler", "Plans")}</b>
        <div className="cycle">
          <button className={!yearly ? "on" : ""} onClick={() => setYearly(false)}>{t("Aylık", "Monthly")}</button>
          <button className={yearly ? "on" : ""} onClick={() => setYearly(true)}>{t("Yıllık −17%", "Yearly −17%")}</button>
        </div>
      </div>
      <div className="bill-plans" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {BILLING_TIERS.map((tier) => {
          const cur = tier === plan;
          const pr = PLAN_PRICE[tier];
          const isEnt = tier === "enterprise";
          return (
            <div className={`bplan${cur ? " cur" : ""}`} key={tier}>
              {cur && <div className="cur-badge">{t("MEVCUT", "CURRENT")}</div>}
              <div className={`bplan-n${tier === "pro" ? " pro" : ""}`}>{PL(tier).toUpperCase()}</div>
              <div className="bplan-pr">{isEnt ? t("Teklif", "Custom") : (yearly && tier !== "free" ? pr.y : pr.m)}<small>{isEnt ? "" : tier === "free" ? "" : (yearly ? t(" / yıl", " / yr") : t(" / ay", " / mo"))}</small></div>
              <div className="bplan-d">{PF(tier).map((f, i) => <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}><Check size={13} style={{ marginTop: 2, flexShrink: 0, color: "var(--ok)" }} /><span>{f}</span></div>)}</div>
              <button
                className={cur ? "b active" : tier === "free" ? "b" : "b up"}
                onClick={() => { if (cur) return; isEnt ? (location.href = "mailto:info@scitera.net?subject=Kurumsal") : soon(); }}
              >
                {cur ? t("Aktif", "Active") : tier === "free" ? t("Ücretsiz", "Free") : isEnt ? t("Teklif Al", "Get a quote") : t(`${PL(tier)}'e Geç →`, `Go ${PL(tier)} →`)}
              </button>
            </div>
          );
        })}
      </div>

      <div className="card packs-card">
        <div className="packs-card-h">
          <b>{t("Ek Kredi Paketi", "Add-on Credit Pack")}</b>
          <span>{t("Krediler süresiz geçerli · 1 kredi = 1 araç kullanımı", "Credits never expire · 1 credit = 1 tool run")}</span>
        </div>
        <div className="packs-grid">
          {CREDIT_PACKS.map((p, i) => (
            <button key={p.n} className={`pack${pack === i ? " sel" : ""}`} onClick={() => setPack(i)}>
              <b><Cr n={p.n} size={14} /></b><span className="p">{p.price}</span><span className="u">{p.unit}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-a pay-btn" onClick={soon}>{t("Güvenli Ödemeye Geç →", "Proceed to secure checkout →")}</button>
      </div>
    </div>
  );
}

/* ───────────────────────── User dashboard (top-right dropdown) ─────────────────────────
   Deskly-style account menu. Headings reflect Presubly's function (pre-submission
   review): "Tarama Hakkın", "Araştırmacı Profili", "Abonelik & Krediler". */
function UserMenu({ auth, nav, flash, close }) {
  const { t, lang } = useLang();
  const isAdmin = !!auth?.isAdmin;
  const plan = auth?.plan || "free";
  const credits = auth?.credits ?? 0;
  const uses = auth?.uses ?? 0;
  const canApi = can(plan, isAdmin, "api");
  const canTeam = can(plan, isAdmin, "team");
  const email = auth?.user?.primaryEmailAddress?.emailAddress || "";
  const name = auth?.user?.fullName || email.split("@")[0] || (lang === "en" ? "User" : "Kullanıcı");
  const initial = (name[0] || "K").toUpperCase();
  const planLabel = isAdmin ? t("Süper Admin", "Super Admin") : (lang === "en" ? PLAN_LABEL_EN : PLAN_LABEL)[plan] || (lang === "en" ? "Free" : "Ücretsiz");

  const meta = auth?.user?.unsafeMetadata || {};
  const [inst, setInst] = useState(meta.institution || "");
  const [orcid, setOrcid] = useState(meta.orcid || "");
  const [saving, setSaving] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  async function saveProfile() {
    if (!auth?.user?.update) { flash(t("Profil güncellenemedi.", "Couldn't update profile.")); return; }
    setSaving(true);
    try {
      await auth.user.update({ unsafeMetadata: { ...meta, institution: inst, orcid } });
      flash(t("Profil kaydedildi", "Profile saved"));
    } catch { flash(t("Kaydedilemedi.", "Couldn't save.")); }
    setSaving(false);
  }

  const manageAccount = () => setProfileOpen(true);

  return (
    <>
      <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 55 }} />
      <div className="usermenu">
        {/* header — text only, like the suite's shared menu */}
        <div className="um-head2">
          <div className="um-name">{name}</div>
          <div className="um-mail">{email}</div>
          <div className="um-meta">{planLabel} · {isAdmin ? "∞" : credits} {t("kredi", "credits")}</div>
        </div>

        <div className="um-menu">
        <div className="um-list">
          <button className="um-row" onClick={() => nav("history")}><FileText size={17} className="um-i" /><span className="um-lbl">{t("Raporlarım", "My Reports")}</span></button>
          <button className="um-row" onClick={() => nav("operations")}><ClipboardList size={17} className="um-i" /><span className="um-lbl">{t("Gönderim Merkezi", "Submission Center")}</span></button>
          <button className="um-row" onClick={() => nav("billing")}><CreditCard size={17} className="um-i" /><span className="um-lbl">{t("Plan & Faturalama", "Plan & Billing")}</span></button>
          {canTeam && <button className="um-row" onClick={() => nav("team")}><Users size={17} className="um-i" /><span className="um-lbl">{t("Ekip", "Team")}</span></button>}
          {canApi && <button className="um-row" onClick={() => nav("api")}><SquareTerminal size={17} className="um-i" /><span className="um-lbl">{t("API Erişimi", "API Access")}</span></button>}
          <button className="um-row" onClick={() => setProfileOpen((v) => !v)}><UserRound size={17} className="um-i" /><span className="um-lbl">{t("Araştırmacı Profili", "Researcher Profile")}</span><ChevronDown size={15} className="um-chev" style={{ transform: profileOpen ? "rotate(180deg)" : "none" }} /></button>
          {profileOpen && (
            <div className="um-profile">
              <div className="fg" style={{ marginBottom: 8 }}><label>{t("KURUM", "INSTITUTION")}</label><input value={inst} onChange={(e) => setInst(e.target.value)} placeholder={t("ör. Giresun Üniversitesi", "e.g. Giresun University")} /></div>
              <div className="fg" style={{ marginBottom: 10 }}><label>ORCID</label><input className="mono" value={orcid} onChange={(e) => setOrcid(e.target.value)} placeholder="0000-0000-0000-0000" /></div>
              <button className="btn btn-a" style={{ width: "100%", padding: 9, borderRadius: 9, fontSize: 12.5 }} onClick={saveProfile} disabled={saving}>{saving ? t("Kaydediliyor…", "Saving…") : t("Profili Kaydet", "Save Profile")}</button>
            </div>
          )}
          <button className="um-row" onClick={manageAccount}><Settings2 size={17} className="um-i" /><span className="um-lbl">{t("Hesabım", "My Account")}</span></button>
          {isAdmin && <button className="um-row" onClick={() => nav("admin")}><ShieldCheck size={17} className="um-i" /><span className="um-lbl">{t("Admin Paneli", "Admin Panel")}</span></button>}
        </div>

        <div className="um-divider" />
        <button className="um-row um-out" onClick={() => { close(); auth?.signOut?.(); }}><LogOut size={17} /><span className="um-lbl">{t("Çıkış yap", "Sign out")}</span></button>
        </div>
      </div>
    </>
  );
}

/* ───────────────────────── admin ───────────────────────── */
function AdminView({ auth, flash }) {
  const { t, lang } = useLang();
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    try {
      const token = await auth.getToken();
      const r = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setData(await r.json()); else { setData({ users: [], stats: {} }); flash(t("Yönetim verisi alınamadı.", "Couldn't load admin data.")); }
    } catch { setData({ users: [], stats: {} }); }
  }, [auth, flash]);

  useEffect(() => { load(); }, [load]);

  async function mutate(id, body) {
    try {
      const token = await auth.getToken();
      const r = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, ...body }),
      });
      if (r.ok) { flash(t("Güncellendi.", "Updated.")); load(); } else flash(t("İşlem başarısız.", "Operation failed."));
    } catch { flash(t("Bağlantı hatası.", "Connection error.")); }
  }

  if (!data) return <div className="view on"><div className="card"><div className="empty">{t("Yükleniyor…", "Loading…")}</div></div></div>;
  const s = data.stats || {};

  // estimated MRR (monthly) from plan counts + estimated AI cost for last 7 days
  const mrr = (s.academic ?? 0) * 9 + (s.pro_plan ?? 0) * 19 + (s.enterprise ?? 0) * 99;
  const cost7 = ((s.uses7 ?? 0) * 0.02); // ~$0.02 / analiz (kaba tahmin)

  // build a 14-day usage series (fill gaps with 0)
  const dailyMap = {};
  (data.daily || []).forEach((d) => { dailyMap[d.d] = d.n; });
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const dt = new Date(); dt.setDate(dt.getDate() - i);
    const key = dt.toISOString().slice(0, 10);
    days.push({ key, n: dailyMap[key] || 0, label: dt.toLocaleDateString(lang === "en" ? "en-US" : "tr-TR", { day: "2-digit", month: "2-digit" }) });
  }
  const maxN = Math.max(1, ...days.map((d) => d.n));

  const users = (data.users || []).filter((u) => !q || (u.email || u.id || "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="view on">
      <div className="dash-head">
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: 9 }}><ShieldCheck size={22} color="var(--tl)" /><em>{t("Yönetim Paneli", "Admin Panel")}</em></h2>
          <p>{t("Kullanıcılar, planlar, kullanım ve gelir tahmini — yalnızca yöneticiler.", "Users, plans, usage and revenue estimates — admins only.")}</p>
        </div>
        <button className="btn btn-ghost btn-new" onClick={load}>{t("Yenile ↻", "Refresh ↻")}</button>
      </div>

      <div className="adm-grid">
        <Stat l={t("KULLANICI", "USERS")} n={s.users ?? 0} />
        <Stat l={t("AKTİF (7G)", "ACTIVE (7D)")} n={s.active7 ?? 0} />
        <Stat l={t("YENİ ÜYE (7G)", "NEW (7D)")} n={s.new7 ?? 0} />
        <Stat l={t("7G İŞLEM", "7D RUNS")} n={s.uses7 ?? 0} />
      </div>
      <div className="adm-grid">
        <Stat l={t("TOPLAM İŞLEM", "TOTAL RUNS")} n={s.uses ?? 0} />
        <Stat l={t("TAHMİNİ MRR", "EST. MRR")} n={`$${mrr}`} sub="academic·pro·enterprise" />
        <Stat l={t("7G AI MALİYET (TAH.)", "7D AI COST (EST.)")} n={`$${cost7.toFixed(2)}`} sub={t("~$0.02/analiz", "~$0.02/scan")} />
        <Stat l={t("TOPLAM KREDİ", "TOTAL CREDITS")} n={s.credits ?? 0} />
      </div>

      {/* daily usage chart */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <b style={{ fontFamily: "var(--fd)", fontSize: 15 }}>{t("Günlük İşlem (14 gün)", "Daily Runs (14 days)")}</b>
          <span style={{ fontFamily: "var(--fm)", fontSize: 11, color: "var(--k4)" }}>{t("toplam", "total")} {days.reduce((a, b) => a + b.n, 0)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 120 }}>
          {days.map((d) => (
            <div key={d.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }} title={`${d.label}: ${d.n}`}>
              <div style={{ fontFamily: "var(--fm)", fontSize: 9, color: "var(--k4)", height: 12 }}>{d.n || ""}</div>
              <div style={{ width: "100%", height: `${(d.n / maxN) * 82}px`, minHeight: d.n ? 3 : 0, background: "var(--tl3)", borderRadius: "3px 3px 0 0" }} />
              <div style={{ fontFamily: "var(--fm)", fontSize: 8.5, color: "var(--k5)" }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-h" style={{ gap: 12 }}>
          <b>{t("Kullanıcılar", "Users")} ({users.length})</b>
          <input className="inp" style={{ margin: 0, maxWidth: 220, padding: "7px 11px" }} placeholder={t("E-posta ara…", "Search email…")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="adm-tbl">
            <thead><tr><th>{t("E-POSTA", "EMAIL")}</th><th>{t("KREDİ", "CREDITS")}</th><th>{t("KULLANIM", "USAGE")}</th><th>{t("PLAN", "PLAN")}</th><th>{t("İŞLEM", "ACTIONS")}</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email || <span style={{ color: "var(--k5)" }}>{u.id.slice(0, 14)}…</span>}</td>
                  <td><Cr n={u.credits} size={12} /></td>
                  <td>{u.uses ?? 0}</td>
                  <td>
                    {u.is_admin
                      ? <span className="chip adm">ADMIN</span>
                      : <select className="mini-btn" value={u.plan || "free"} onChange={(e) => mutate(u.id, { plan: e.target.value })}>
                          <option value="free">free</option><option value="academic">academic</option>
                          <option value="pro">pro</option><option value="enterprise">enterprise</option>
                        </select>}
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="mini-btn" onClick={() => mutate(u.id, { addCredits: 20 })}><Cr n="+20" size={11} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ l, n, sub }) {
  return <div className="kpi"><div className="kpi-l">{l}</div><div className="kpi-n">{n}</div>{sub && <div className="kpi-s">{sub}</div>}</div>;
}

/* ───────────────────────── Raporlarım — master-detail workspace ───────────────────────── */
function parseData(row) { try { return JSON.parse(row.data); } catch { return null; } }
const isReadinessD = (d) => !!(d && Array.isArray(d.categories));
const isSimD = (d) => !!(d && Array.isArray(d.dimensions));
const isEditorialD = (d) => !!(d && d.decisionCode && !Array.isArray(d.dimensions));
const isResponseD = (d) => !!(d && Array.isArray(d.responses));
const isCoverD = (d) => !!(d && typeof d.letter === "string" && Array.isArray(d.placeholders));
/* §20 — group saved evaluations by manuscript (title) into version timelines. */
function groupByManuscript(reports) {
  const map = new Map();
  (reports || []).forEach((r) => { const t = (r.title || "Adsız makale").trim(); if (!map.has(t)) map.set(t, []); map.get(t).push(r); });
  const groups = [...map.entries()].map(([title, items]) => {
    const sorted = items.slice().sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0)); // oldest→newest = version order
    const scored = sorted.filter((x) => typeof x.score === "number");
    const first = scored[0], last = scored[scored.length - 1];
    return { title, items: sorted, latest: sorted[sorted.length - 1].created_at, firstScore: first?.score ?? null, lastScore: last?.score ?? null, scoredCount: scored.length };
  });
  groups.sort((a, b) => (a.latest < b.latest ? 1 : a.latest > b.latest ? -1 : 0));  // recent activity first
  return groups;
}

/* §20 — condense a saved sim/readiness report into a "previous findings" seed
   for the Revision Verification tool (linked re-review). */
function revisionSeed(d) {
  const L = ["ÖNCEKİ DEĞERLENDİRME — düzeltilmiş makalede ele alınması gereken bulgular:", ""];
  (Array.isArray(d?.priority) ? d.priority : []).forEach((p, i) => L.push(`${i + 1}. ${p}`));
  (Array.isArray(d?.comments) ? d.comments : []).forEach((c) => { const issue = c.issue || c.note; if (issue) L.push(`- ${issue}${c.suggestion ? ` → ${c.suggestion}` : ""}`); });
  (Array.isArray(d?.categories) ? d.categories : []).forEach((cat) => (cat.checks || []).forEach((k) => { if (k.status === "fail" || k.status === "warn") L.push(`- [${k.status}] ${k.label}${k.note ? `: ${k.note}` : ""}`); }));
  return L.join("\n");
}
/* Kayıtlı bir satırı Word/PDF için markdown gövdesine çevir. */
function reportMd(row) {
  const d = parseData(row);
  if (isSimD(d)) return simToMarkdown(d);
  if (isReadinessD(d)) return reportToMarkdown(d);
  if (isEditorialD(d)) return editorialToMarkdown(d);
  if (isResponseD(d)) return responseToMarkdown(d);
  if (isCoverD(d)) return coverletterToMarkdown(d);
  return (d && d.text) || row.data || "";
}

/* ───────────────────────── PSB-IMP-013 — Gönderim Operasyon Merkezi ─────────────────────────
   Saved analyses remain the evidence source. Operational fields are stored separately,
   so changing a deadline or target journal never mutates an immutable report snapshot. */
const OPS_STATUSES = ["preparing", "ready", "submitted", "revision", "accepted", "closed"];
function operationStatusLabel(status, lang) {
  const tr = { preparing: "Hazırlanıyor", ready: "Gönderime hazır", submitted: "Gönderildi", revision: "Revizyonda", accepted: "Kabul edildi", closed: "Kapandı" };
  const en = { preparing: "Preparing", ready: "Ready to submit", submitted: "Submitted", revision: "In revision", accepted: "Accepted", closed: "Closed" };
  return (lang === "en" ? en : tr)[status] || status;
}
function reportBlockers(row) {
  const d = parseData(row);
  if (!d) return 0;
  let n = 0;
  (d.categories || []).forEach((cat) => (cat.checks || []).forEach((x) => { if (x.status === "fail") n += 1; }));
  (d.comments || []).forEach((x) => { if (["critical", "major", "high"].includes(String(x.severity || "").toLowerCase())) n += 1; });
  return n;
}
function daysUntil(date) {
  if (!date) return null;
  const end = new Date(`${date}T23:59:59`);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

function SubmissionOperationsView({ auth, nav, flash, startRevision }) {
  const { t, lang } = useLang();
  const isAdmin = !!auth?.isAdmin;
  const canHistory = can(auth.plan, isAdmin, "history");
  const [reports, setReports] = useState(null);
  const [operations, setOperations] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!canHistory) { setReports([]); return; }
    try {
      const token = await auth.getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [rr, ro] = await Promise.all([fetch("/api/reports", { headers }), fetch("/api/operations", { headers })]);
      const rd = rr.ok ? await rr.json() : { reports: [] };
      const od = ro.ok ? await ro.json() : { operations: [] };
      setReports(rd.reports || []);
      setOperations(od.operations || []);
    } catch {
      setReports([]); setOperations([]);
      flash(t("Gönderim verileri alınamadı.", "Submission data couldn't be loaded."));
    }
  }, [auth, canHistory, flash, t]);
  useEffect(() => { load(); }, [load]);

  if (!canHistory) return <UpgradeCard feature="history" nav={nav} title={t("Gönderim Operasyon Merkezi", "Submission Operations Center")} desc={t("Makalelerini hedef dergi, son tarih, kritik engel ve sıradaki eylem bilgileriyle tek ekranda yönet.", "Manage manuscripts, target journals, deadlines, blockers and next actions in one place.")} />;
  if (reports === null) return <div className="view on"><div className="card"><div className="empty">{t("Gönderim merkezi hazırlanıyor…", "Preparing submission center…")}</div></div></div>;

  const opByTitle = new Map(operations.map((x) => [x.manuscript_title, x]));
  const reportGroups = groupByManuscript(reports);
  const known = new Set(reportGroups.map((g) => g.title));
  const groups = [
    ...reportGroups,
    ...operations.filter((o) => !known.has(o.manuscript_title)).map((o) => ({ title: o.manuscript_title, items: [], latest: o.updated_at, lastScore: null })),
  ];
  const rows = groups.map((g) => {
    const op = opByTitle.get(g.title) || {};
    const latestRow = g.items?.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
    const blockers = latestRow ? reportBlockers(latestRow) : 0;
    const suggested = blockers === 0 && (g.lastScore ?? 0) >= 80 ? "ready" : "preparing";
    return { ...g, ...op, manuscript_title: g.title, blockers, status: op.status || suggested, deadlineDays: daysUntil(op.deadline), latestRow };
  });
  const activeStatuses = new Set(["preparing", "ready", "submitted", "revision"]);
  const filtered = rows.filter((r) => {
    const matchesText = !query || `${r.manuscript_title} ${r.target_journal || ""} ${r.next_action || ""}`.toLocaleLowerCase(lang === "tr" ? "tr" : "en").includes(query.toLocaleLowerCase(lang === "tr" ? "tr" : "en"));
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? activeStatuses.has(r.status) : r.status === statusFilter);
    return matchesText && matchesStatus;
  });
  const ready = rows.filter((r) => r.status === "ready").length;
  const blocked = rows.filter((r) => r.blockers > 0 && activeStatuses.has(r.status)).length;
  const approaching = rows.filter((r) => r.deadlineDays != null && r.deadlineDays >= 0 && r.deadlineDays <= 7 && activeStatuses.has(r.status)).length;

  function selectRow(row) {
    setSelected(row.manuscript_title);
    setDraft({
      id: row.id || null,
      manuscript_title: row.manuscript_title,
      target_journal: row.target_journal || "",
      status: row.status || "preparing",
      deadline: row.deadline || "",
      next_action: row.next_action || "",
      notes: row.notes || "",
    });
  }
  async function saveOperation() {
    if (!draft) return;
    setSaving(true);
    try {
      const token = await auth.getToken();
      const res = await fetch("/api/operations", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(draft) });
      if (!res.ok) throw new Error("save");
      flash(t("Gönderim planı kaydedildi.", "Submission plan saved."));
      await load();
      setSelected(null); setDraft(null);
    } catch { flash(t("Gönderim planı kaydedilemedi.", "Submission plan couldn't be saved.")); }
    setSaving(false);
  }

  return (
    <div className="view on ops-view">
      <div className="ops-head">
        <div>
          <div className="ops-ey">PSB-IMP-013</div>
          <h2><ClipboardList size={24} />{t("Gönderim Operasyon Merkezi", "Submission Operations Center")}</h2>
          <p>{t("Analiz bulgularını gönderim planına dönüştür; engelleri, tarihleri ve sıradaki eylemi tek yerden izle.", "Turn analysis findings into a submission plan; track blockers, deadlines and the next action in one place.")}</p>
        </div>
        <button className="btn btn-a ops-primary" onClick={() => nav("sim")}>{t("Yeni analiz", "New analysis")}<ArrowRight size={15} /></button>
      </div>

      <div className="ops-kpis">
        <div className="ops-kpi"><span>{t("AKTİF DOSYA", "ACTIVE FILES")}</span><b>{rows.filter((r) => activeStatuses.has(r.status)).length}</b><small>{t("gönderim hattında", "in the pipeline")}</small></div>
        <div className="ops-kpi ready"><span>{t("GÖNDERİME HAZIR", "READY")}</span><b>{ready}</b><small>{t("son kontrol tamam", "final check complete")}</small></div>
        <div className="ops-kpi blocked"><span>{t("KRİTİK ENGEL", "BLOCKED")}</span><b>{blocked}</b><small>{t("eylem gerekiyor", "needs action")}</small></div>
        <div className="ops-kpi due"><span>{t("7 GÜN İÇİNDE", "DUE IN 7 DAYS")}</span><b>{approaching}</b><small>{t("yaklaşan tarih", "approaching deadline")}</small></div>
      </div>

      <div className="ops-toolbar card">
        <label className="ops-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Makale, dergi veya eylem ara…", "Search manuscript, journal or action…")} /></label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label={t("Duruma göre filtrele", "Filter by status")}>
          <option value="active">{t("Aktif dosyalar", "Active files")}</option><option value="all">{t("Tüm durumlar", "All statuses")}</option>
          {OPS_STATUSES.map((s) => <option value={s} key={s}>{operationStatusLabel(s, lang)}</option>)}
        </select>
        <button className="mini-btn" onClick={load}><RefreshCw size={13} />{t("Yenile", "Refresh")}</button>
      </div>

      {rows.length === 0 ? (
        <div className="ops-empty card"><ClipboardList size={28} /><b>{t("Gönderim hattın henüz boş", "Your submission pipeline is empty")}</b><p>{t("Bir analizi kaydettiğinde makalen burada otomatik görünür.", "A manuscript appears here automatically after you save an analysis.")}</p><button className="btn btn-a" onClick={() => nav("sim")}>{t("İlk analizi başlat", "Start first analysis")}</button></div>
      ) : (
        <div className={`ops-layout${selected ? " editing" : ""}`}>
          <div className="card ops-table-wrap">
            <div className="ops-table-head"><b>{t("Gönderim hattı", "Submission pipeline")}</b><span>{filtered.length} / {rows.length}</span></div>
            <div className="ops-table" role="table" aria-label={t("Gönderim operasyonları", "Submission operations")}>
              <div className="ops-tr ops-th" role="row"><span>{t("Makale", "Manuscript")}</span><span>{t("Durum", "Status")}</span><span>{t("Hazırlık", "Readiness")}</span><span>{t("Son tarih", "Deadline")}</span><span></span></div>
              {filtered.map((row) => (
                <button className={`ops-tr${selected === row.manuscript_title ? " on" : ""}`} role="row" key={row.manuscript_title} onClick={() => selectRow(row)}>
                  <span className="ops-manuscript"><b>{row.manuscript_title}</b><small>{row.target_journal || t("Hedef dergi belirlenmedi", "Target journal not set")}</small></span>
                  <span><i className={`ops-status ${row.status}`}>{operationStatusLabel(row.status, lang)}</i></span>
                  <span className="ops-readiness">{row.lastScore != null ? <><b style={{ color: scoreColor(row.lastScore) }}>{row.lastScore}</b><small>/100</small></> : <small>—</small>}{row.blockers > 0 && <em><CircleAlert size={12} />{row.blockers}</em>}</span>
                  <span className={`ops-deadline${row.deadlineDays != null && row.deadlineDays <= 7 ? " urgent" : ""}`}>{row.deadline ? <><CalendarDays size={13} />{new Date(`${row.deadline}T12:00:00`).toLocaleDateString(lang === "en" ? "en-US" : "tr-TR", { day: "2-digit", month: "short" })}</> : "—"}</span>
                  <ChevronRight size={16} />
                </button>
              ))}
              {filtered.length === 0 && <div className="empty">{t("Bu filtreyle eşleşen dosya yok.", "No files match this filter.")}</div>}
            </div>
          </div>

          {draft && (
            <aside className="card ops-editor" aria-label={t("Gönderim planını düzenle", "Edit submission plan")}>
              <div className="ops-editor-head"><div><span>{t("GÖNDERİM PLANI", "SUBMISSION PLAN")}</span><b>{draft.manuscript_title}</b></div><button onClick={() => { setSelected(null); setDraft(null); }} aria-label={t("Kapat", "Close")}><X size={17} /></button></div>
              <div className="ops-form">
                <label><span>{t("Hedef dergi", "Target journal")}</span><input value={draft.target_journal} onChange={(e) => setDraft({ ...draft, target_journal: e.target.value })} placeholder={t("Dergi adını yazın", "Enter journal name")} /></label>
                <div className="ops-form-row">
                  <label><span>{t("Durum", "Status")}</span><select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>{OPS_STATUSES.map((s) => <option value={s} key={s}>{operationStatusLabel(s, lang)}</option>)}</select></label>
                  <label><span>{t("Son tarih", "Deadline")}</span><input type="date" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} /></label>
                </div>
                <label><span>{t("Sıradaki eylem", "Next action")}</span><input value={draft.next_action} onChange={(e) => setDraft({ ...draft, next_action: e.target.value })} placeholder={t("Örn. yöntem bölümünü düzelt", "e.g. revise Methods section")} /></label>
                <label><span>{t("Operasyon notu", "Operations note")}</span><textarea rows="4" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder={t("Editör, dosya veya süreç notları…", "Editor, file or process notes…")} /></label>
              </div>
              <div className="ops-evidence">
                <b>{t("Analiz kanıtı", "Analysis evidence")}</b>
                <div><span>{t("Son puan", "Latest score")}</span><strong>{rows.find((r) => r.manuscript_title === selected)?.lastScore ?? "—"}</strong></div>
                <div><span>{t("Kritik engel", "Critical blockers")}</span><strong>{rows.find((r) => r.manuscript_title === selected)?.blockers ?? 0}</strong></div>
                <div><span>{t("Kayıtlı analiz", "Saved analyses")}</span><strong>{rows.find((r) => r.manuscript_title === selected)?.items?.length ?? 0}</strong></div>
              </div>
              <div className="ops-editor-actions">
                {rows.find((r) => r.manuscript_title === selected)?.latestRow && startRevision && <button className="btn btn-ghost" onClick={() => { const d = parseData(rows.find((r) => r.manuscript_title === selected).latestRow); if (isSimD(d) || isReadinessD(d)) startRevision(revisionSeed(d)); else nav("revision"); }}>{t("Revizyonu doğrula", "Verify revision")}</button>}
                <button className="btn btn-a" onClick={saveOperation} disabled={saving}><Save size={15} />{saving ? t("Kaydediliyor…", "Saving…") : t("Planı kaydet", "Save plan")}</button>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryView({ auth, nav, flash, startRevision }) {
  const { t, lang } = useLang();
  const isAdmin = !!auth?.isAdmin;
  const canHistory = can(auth.plan, isAdmin, "history");
  const canDiff = can(auth.plan, isAdmin, "diff");
  const canTeam = can(auth.plan, isAdmin, "team");
  const [reports, setReports] = useState(null);
  const [open, setOpen] = useState(null);   // parsed report to view (full screen)
  const [cmp, setCmp] = useState(null);     // { a, b } compare
  const [grouped, setGrouped] = useState(false); // §20 manuscript-grouped view

  const load = useCallback(async () => {
    if (!canHistory) { setReports([]); return; }
    try {
      const token = await auth.getToken();
      const r = await fetch("/api/reports", { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const d = await r.json();
        const list = (d.reports || []).slice().sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0)); // en yeni üstte
        setReports(list);
      } else setReports([]);
    } catch { setReports([]); }
  }, [auth, canHistory]);
  useEffect(() => { load(); }, [load]);

  async function del(id) {
    try {
      const token = await auth.getToken();
      await fetch(`/api/reports?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      load();
    } catch { flash(t("Silinemedi.", "Couldn't delete.")); }
  }

  function openItem(r) {
    const d = parseData(r);
    if (isSimD(d)) setOpen({ sim: d, title: r.title, id: r.id });
    else if (isReadinessD(d)) setOpen({ readiness: d, title: r.title, id: r.id });
    else if (isEditorialD(d)) setOpen({ editorial: d, title: r.title, id: r.id });
    else if (isResponseD(d)) setOpen({ response: d, title: r.title, id: r.id });
    else if (isCoverD(d)) setOpen({ cover: d, title: r.title, id: r.id });
    else setOpen({ text: (d && d.text) || r.data || "", title: r.title, id: r.id });
  }

  function downloadRow(r) {
    const d = parseData(r);
    if (isSimD(d)) return downloadSim(d);
    if (isReadinessD(d)) return downloadReport(d);
    const md = isEditorialD(d) ? editorialToMarkdown(d) : isResponseD(d) ? responseToMarkdown(d) : isCoverD(d) ? coverletterToMarkdown(d) : (d && d.text) || r.data || "";
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `presubly-${(r.title || "rapor").slice(0, 40).replace(/[^\w-]+/g, "-")}.md`; a.click();
    URL.revokeObjectURL(url);
  }

  function compareTitle(title) {
    const same = reports.filter((r) => r.title === title).sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
    if (same.length < 2) { flash(t("Karşılaştırma için aynı başlıkta en az 2 kayıt gerekir.", "Comparison needs at least 2 records with the same title.")); return; }
    setCmp({ a: same[0], b: same[same.length - 1] });
    setOpen(null);
  }

  if (!canHistory) return <UpgradeCard feature="history" nav={nav} title={t("Rapor Arşivi", "Report Archive")} desc={t("Analizlerini buluta kaydet, ilerlemeni takip et, ekibinle yorumla ve karşılaştır.", "Save analyses to the cloud, track progress, comment with your team and compare.")} />;
  if (reports === null) return <div className="view on"><div className="card"><div className="empty">{t("Yükleniyor…", "Loading…")}</div></div></div>;

  if (cmp) {
    return <div className="view on"><button className="mini-btn" style={{ alignSelf: "flex-start" }} onClick={() => setCmp(null)}>← {t("Geri", "Back")}</button><CompareView a={cmp} parse={parseData} /></div>;
  }
  if (open) {
    return (
      <div className="view on">
        <div style={{ display: "flex", gap: 8, alignSelf: "flex-start" }}>
          <button className="mini-btn" onClick={() => setOpen(null)}>← {t("Geri", "Back")}</button>
          {startRevision && (open.sim || open.readiness) && <button className="mini-btn" onClick={() => startRevision(revisionSeed(open.sim || open.readiness))} title={t("Bu bulgularla düzeltilmiş nüshayı doğrula", "Verify the revised version against these findings")}>{t("Revizyon Doğrula →", "Verify Revision →")}</button>}
        </div>
        {open.sim
          ? <SimReport sim={open.sim} onDownload={() => downloadSim(open.sim)} />
          : open.readiness
          ? <ReadinessReport report={open.readiness} onDownload={() => downloadReport(open.readiness)} />
          : open.editorial
          ? <EditorialReport report={open.editorial} onDownload={() => { const md = editorialToMarkdown(open.editorial); const b = new Blob([md], { type: "text/markdown;charset=utf-8" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `presubly-${slugify(open.title || "editoryal")}.md`; a.click(); URL.revokeObjectURL(u); }} />
          : open.response
          ? <ResponseReport report={open.response} onDownload={() => { const md = responseToMarkdown(open.response); const b = new Blob([md], { type: "text/markdown;charset=utf-8" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `presubly-${slugify(open.title || "yanit")}.md`; a.click(); URL.revokeObjectURL(u); }} />
          : open.cover
          ? <CoverLetterReport report={open.cover} onDownload={() => { const md = coverletterToMarkdown(open.cover); const b = new Blob([md], { type: "text/markdown;charset=utf-8" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `presubly-${slugify(open.title || "kapak-mektubu")}.md`; a.click(); URL.revokeObjectURL(u); }} />
          : (
            <div className="card result on">
              <ReportBrandHeader title={open.title} />
              <div className="res-top">
                <div className="res-dec"><b>{open.title}</b><p>{t("Kayıtlı analiz", "Saved analysis")}</p></div>
                <span className="res-actions">
                  <button className="res-dl" onClick={() => { const blob = new Blob([open.text], { type: "text/markdown;charset=utf-8" }); const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = `presubly-${slugify(open.title || "rapor")}.md`; a.click(); URL.revokeObjectURL(u); }} title={t("Markdown indir", "Download Markdown")}>.md</button>
                </span>
              </div>
              <div className="ai-out" dangerouslySetInnerHTML={{ __html: renderMarkdown(open.text) }} />
            </div>
          )}
        <DownloadBar
          md={open.sim ? simToMarkdown(open.sim) : open.readiness ? reportToMarkdown(open.readiness) : open.editorial ? editorialToMarkdown(open.editorial) : open.response ? responseToMarkdown(open.response) : open.cover ? coverletterToMarkdown(open.cover) : (open.text || "")}
          title={open.title || "Analiz"}
          filenameBase={`presubly-${slugify(open.title || "rapor")}`} />
        {open.id && canTeam && <CommentsPanel reportId={open.id} auth={auth} />}
      </div>
    );
  }

  const renderRow = (r, ver) => {
    const label = toolT(TOOL_BY_ID[r.tool], "short", lang) || r.tool || t("Analiz", "Analysis");
    const hasScore = typeof r.score === "number";
    return (
      <div className="row" key={r.id}>
        {ver && <span className="row-ver">{ver}</span>}
        <span className="row-tag" style={{ background: "var(--tll)", color: "var(--tl)" }}>{hasScore ? (r.grade || "—") : label.slice(0, 10)}</span>
        <div className="row-t" style={{ cursor: "pointer" }} onClick={() => openItem(r)} title={r.title}>{ver ? label : r.title}</div>
        {hasScore
          ? <span className="row-v" style={{ color: scoreColor(r.score) }}>{r.score}/100</span>
          : <span className="row-v" style={{ color: "var(--k4)", fontWeight: 500 }}>{label}</span>}
        <span className="row-d">{fmtDate(r.created_at)}</span>
        <button className="row-dl word" onClick={() => exportWord(reportMd(r), r.title || "Analiz", "bilimsel", `presubly-${slugify(r.title || "rapor")}`)} title={t("Word indir", "Download Word")}><FileText size={13} />Word</button>
        <button className="row-dl pdf" onClick={() => exportPdf(reportMd(r), r.title || "Analiz", "bilimsel", `presubly-${slugify(r.title || "rapor")}`)} title={t("PDF indir", "Download PDF")}><FileType2 size={13} />PDF</button>
        {!ver && canDiff && hasScore && <button className="mini-btn" onClick={() => compareTitle(r.title)} title={t("Aynı başlıktaki ilk↔son", "First↔last with the same title")}>{t("Karşılaştır", "Compare")}</button>}
        {startRevision && (() => { const d = parseData(r); return (isSimD(d) || isReadinessD(d)) ? <button className="mini-btn" onClick={() => startRevision(revisionSeed(d))} title={t("Düzeltilmiş nüshayı doğrula", "Verify the revised version")}>{t("Revizyon →", "Revision →")}</button> : null; })()}
        <button className="mini-btn" onClick={() => del(r.id)}>{t("Sil", "Delete")}</button>
      </div>
    );
  };

  return (
    <div className="view on">
      <div className="card">
        <div className="card-h">
          <b>{t("Kayıtlı Analizler", "Saved Analyses")}</b>
          <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span className="hist-toggle">
              <button className={!grouped ? "on" : ""} onClick={() => setGrouped(false)}>{t("Liste", "List")}</button>
              <button className={grouped ? "on" : ""} onClick={() => setGrouped(true)}>{t("Makaleye göre", "By paper")}</button>
            </span>
            <a onClick={load}>{t("Yenile ↻", "Refresh ↻")}</a>
          </span>
        </div>
        {reports.length === 0 ? (
          <div className="empty">{t("Henüz kayıtlı analiz yok. Bir araç çalıştır — sonuç otomatik olarak buraya kaydedilir.", "No saved analyses yet. Run a tool — the result is saved here automatically.")}</div>
        ) : grouped ? (
          <div className="ms-groups">
            {groupByManuscript(reports).map((g) => {
              const delta = g.firstScore != null && g.lastScore != null ? g.lastScore - g.firstScore : null;
              return (
                <div className="ms-group" key={g.title}>
                  <div className="ms-head">
                    <div className="ms-title" title={g.title} onClick={() => openItem(g.items[g.items.length - 1])}>{g.title}</div>
                    <span className="ms-count">{g.items.length} {t("değerlendirme", "assessments")}</span>
                    {g.scoredCount >= 2 && (
                      <span className="ms-trend" style={{ color: scoreColor(g.lastScore) }}>{g.firstScore} → {g.lastScore}
                        {delta != null && <em style={{ color: delta > 0 ? "var(--ok)" : delta < 0 ? "var(--er)" : "var(--k4)", marginLeft: 5 }}>{delta > 0 ? `+${delta}` : delta}</em>}
                      </span>
                    )}
                    {canDiff && g.scoredCount >= 2 && <button className="mini-btn" onClick={() => compareTitle(g.title)} title={t("İlk↔son karşılaştır", "Compare first↔last")}>{t("Karşılaştır", "Compare")}</button>}
                  </div>
                  {g.items.map((r, i) => renderRow(r, `S${i + 1}`))}
                </div>
              );
            })}
          </div>
        ) : (
          <div>{reports.map((r) => renderRow(r))}</div>
        )}
      </div>
      {!canDiff && reports.length > 1 && (
        <div className="crit-note" style={{ border: "none", padding: 0 }}>{t(<>Yeniden tarama & karşılaştırma <b>Pro</b> planla açılır.</>, <>Re-scan & comparison unlock with the <b>Pro</b> plan.</>)}</div>
      )}
    </div>
  );
}

function CompareView({ a, parse }) {
  const { t } = useLang();
  const ra = parse(a.a), rb = parse(a.b);
  if (!ra || !rb) return <div className="card"><div className="empty">{t("Karşılaştırma yüklenemedi.", "Couldn't load the comparison.")}</div></div>;
  const idx = (rep) => {
    const m = {};
    (rep.categories || []).forEach((c) => (c.checks || []).forEach((k) => { m[k.label] = k.status; }));
    return m;
  };
  const A = idx(ra), B = idx(rb);
  const labels = [...new Set([...Object.keys(A), ...Object.keys(B)])];
  const resolved = labels.filter((l) => A[l] !== "pass" && B[l] === "pass");
  const regressed = labels.filter((l) => A[l] === "pass" && B[l] && B[l] !== "pass");
  const delta = (clampScore(rb.score) ?? 0) - (clampScore(ra.score) ?? 0);

  return (
    <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="res-top">
        <div className="res-score"><b style={{ color: scoreColor(rb.score) }}>{clampScore(rb.score)}</b><span>/100</span></div>
        <div className="res-dec">
          <b style={{ color: delta >= 0 ? "var(--ok)" : "var(--er)" }}>{delta >= 0 ? "▲ +" : "▼ "}{delta} {t("puan", "pts")}</b>
          <p>{a.a.title} · {t("ilk", "first")} {clampScore(ra.score)} → {t("son", "last")} {clampScore(rb.score)}</p>
        </div>
      </div>
      <div className="rpt-cat">
        <div className="rpt-cat-h"><b>{t("Çözülen sorunlar", "Resolved issues")} ({resolved.length})</b></div>
        {resolved.length ? resolved.map((l) => <div className="chk" key={l}><span className="chk-dot" style={{ background: "var(--ok)" }} /><span className="chk-l">{l}</span></div>) : <div className="empty" style={{ padding: 8 }}>—</div>}
      </div>
      {regressed.length > 0 && (
        <div className="rpt-cat">
          <div className="rpt-cat-h"><b>{t("Yeni gerileyen", "Newly regressed")} ({regressed.length})</b></div>
          {regressed.map((l) => <div className="chk" key={l}><span className="chk-dot" style={{ background: "var(--er)" }} /><span className="chk-l">{l}</span></div>)}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── API (enterprise) ───────────────────────── */
function ApiView({ auth, nav }) {
  const { t } = useLang();
  const isAdmin = !!auth?.isAdmin;
  const canApi = can(auth.plan, isAdmin, "api");
  const [keys, setKeys] = useState(null);
  const [fresh, setFresh] = useState(null); // full key shown once

  const load = useCallback(async () => {
    try {
      const token = await auth.getToken();
      const r = await fetch("/api/apikeys", { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); setKeys(d.keys || []); } else setKeys([]);
    } catch { setKeys([]); }
  }, [auth]);
  useEffect(() => { if (canApi) load(); }, [load, canApi]);

  async function create() {
    try {
      const token = await auth.getToken();
      const r = await fetch("/api/apikeys", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ label: "Anahtar" }) });
      if (r.ok) { const d = await r.json(); setFresh(d.key); load(); }
    } catch { /* ignore */ }
  }
  async function revoke(id) {
    try {
      const token = await auth.getToken();
      await fetch("/api/apikeys", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ revoke: id }) });
      load();
    } catch { /* ignore */ }
  }

  if (!canApi) return <UpgradeCard feature="api" nav={nav} title={t("API Erişimi", "API Access")} desc={t("OJS / DergiPark akışına Presubly taramasını gömün. REST API ile programatik uyumluluk kontrolü.", "Embed a Presubly scan into your OJS / DergiPark flow. Programmatic compliance checks via REST API.")} />;

  const curl = `curl -X POST ${typeof location !== "undefined" ? location.origin : "https://app.presubly.com"}/api/v1/scan \\
  -H "x-api-key: psb_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"text":"${t("<makale metni>", "<paper text>")}"}'`;

  return (
    <div className="view on">
      {fresh && (
        <div className="card" style={{ padding: 18, borderColor: "var(--tl)" }}>
          <b style={{ fontFamily: "var(--fd)" }}>{t("Yeni anahtarın (yalnızca bir kez gösterilir)", "Your new key (shown only once)")}</b>
          <div style={{ fontFamily: "var(--fm)", fontSize: 12.5, background: "var(--paper)", padding: "10px 12px", borderRadius: 8, margin: "8px 0", wordBreak: "break-all" }}>{fresh}</div>
          <button className="mini-btn" onClick={() => { navigator.clipboard?.writeText(fresh); }}>{t("Kopyala", "Copy")}</button>
        </div>
      )}
      <div className="card">
        <div className="card-h"><b>{t("API Anahtarları", "API Keys")}</b><a onClick={create}>{t("+ Yeni anahtar", "+ New key")}</a></div>
        {keys === null ? <div className="empty">{t("Yükleniyor…", "Loading…")}</div> : keys.length === 0 ? (
          <div className="empty">{t("Henüz anahtar yok. “+ Yeni anahtar” ile oluştur.", "No keys yet. Create one with “+ New key”.")}</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="adm-tbl">
              <thead><tr><th>{t("ANAHTAR", "KEY")}</th><th>{t("ETİKET", "LABEL")}</th><th>{t("SON KULLANIM", "LAST USED")}</th><th>{t("DURUM", "STATUS")}</th><th></th></tr></thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td style={{ fontFamily: "var(--fm)" }}>{k.prefix}</td>
                    <td>{k.label}</td>
                    <td>{k.last_used ? fmtDate(k.last_used) : "—"}</td>
                    <td>{k.revoked ? <span style={{ color: "var(--er)", fontSize: 11 }}>{t("iptal", "revoked")}</span> : <span className="chip pro">{t("aktif", "active")}</span>}</td>
                    <td>{!k.revoked && <button className="mini-btn" onClick={() => revoke(k.id)}>{t("İptal", "Revoke")}</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="card" style={{ padding: 18 }}>
        <b style={{ fontFamily: "var(--fd)", fontSize: 15 }}>{t("Kullanım", "Usage")} — POST /api/v1/scan</b>
        <pre style={{ fontFamily: "var(--fm)", fontSize: 12, background: "var(--paper)", padding: 14, borderRadius: 10, overflowX: "auto", marginTop: 10, lineHeight: 1.6 }}>{curl}</pre>
        <div className="crit-note" style={{ border: "none", padding: "8px 0 0" }}>{t(<>Her tarama 3 kredi harcar. Yanıt: readiness report JSON. Anahtar başlığı: <code>x-api-key</code> veya <code>Authorization: Bearer</code>.</>, <>Each scan costs 3 credits. Response: readiness report JSON. Key header: <code>x-api-key</code> or <code>Authorization: Bearer</code>.</>)}</div>
      </div>
    </div>
  );
}

function UpgradeCard({ feature, nav, title, desc }) {
  const { t, lang } = useLang();
  const rp = requiredPlanLabel(feature);
  const rpL = lang === "en" ? ({ "Akademik": "Academic", "Pro": "Pro", "Kurumsal": "Enterprise", "Ücretsiz": "Free" }[rp] || rp) : rp;
  return (
    <div className="view on">
      <div className="card" style={{ padding: 34, textAlign: "center", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        <Lock size={26} color="var(--k4)" />
        <div style={{ fontFamily: "var(--fd)", fontSize: 20, fontWeight: 600 }}>{title}</div>
        <p style={{ fontSize: 13.5, color: "var(--k3)", maxWidth: 420, lineHeight: 1.6 }}>{desc}</p>
        <div style={{ fontSize: 12, color: "var(--a2)", fontWeight: 700 }}>{t(`${rpL} planla açılır`, `Unlocks with the ${rpL} plan`)}</div>
        <button className="btn btn-a" style={{ padding: "11px 22px", borderRadius: 10 }} onClick={() => nav("billing")}>{t("Planları Gör", "See Plans")}</button>
      </div>
    </div>
  );
}

/* ───────────────────────── Ekip (team collaboration) ───────────────────────── */
function TeamView({ auth, nav, flash }) {
  const { t: tr } = useLang();
  const isAdmin = !!auth?.isAdmin;
  const canTeam = can(auth.plan, isAdmin, "team");
  const [data, setData] = useState(null);
  const [newName, setNewName] = useState("");
  const [invite, setInvite] = useState({});

  const load = useCallback(async () => {
    if (!canTeam) { setData({ teams: [] }); return; }
    try {
      const token = await auth.getToken();
      const r = await fetch("/api/team", { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setData(await r.json()); else setData({ teams: [] });
    } catch { setData({ teams: [] }); }
  }, [auth, canTeam]);
  useEffect(() => { load(); }, [load]);

  async function post(body, ok) {
    try {
      const token = await auth.getToken();
      const r = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { flash(ok || tr("Tamam.", "Done.")); load(); } else flash(d.error || tr("İşlem başarısız.", "Operation failed."));
    } catch { flash(tr("Bağlantı hatası.", "Connection error.")); }
  }

  if (!canTeam) return <UpgradeCard feature="team" nav={nav} title={tr("Ekip & Yorum", "Team & Comments")} desc={tr("Ekip üyelerini davet edin, raporları birlikte inceleyin ve üzerine yorum yapın.", "Invite team members, review reports together and comment on them.")} />;
  if (!data) return <div className="view on"><div className="card"><div className="empty">{tr("Yükleniyor…", "Loading…")}</div></div></div>;

  const CreateBox = ({ ghost }) => (
    <div className="card set-card">
      <b style={{ fontFamily: "var(--fd)", fontSize: 14 }}>{ghost ? tr("Yeni ekip", "New team") : tr("İlk ekibini oluştur", "Create your first team")}</b>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="inp" style={{ margin: 0 }} placeholder={tr("Ekip adı (ör. Endokrinoloji Lab)", "Team name (e.g. Endocrinology Lab)")} value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button className={ghost ? "btn btn-ghost" : "btn btn-a"} style={{ padding: "9px 18px", borderRadius: 9 }} onClick={() => { if (newName.trim()) { post({ action: "create", name: newName }, tr("Ekip oluşturuldu.", "Team created.")); setNewName(""); } }}>{tr("Oluştur", "Create")}</button>
      </div>
    </div>
  );

  return (
    <div className="view on">
      <div className="dash-head">
        <div><h2 style={{ display: "flex", alignItems: "center", gap: 9 }}><Users size={22} color="var(--tl)" /><em>{tr("Ekip", "Team")}</em></h2><p>{tr("Üyeleri davet et, raporları birlikte incele ve yorumla.", "Invite members, review reports together and comment.")}</p></div>
      </div>

      {data.teams.length === 0 && <CreateBox />}

      {data.teams.map((t) => (
        <div className="card set-card" key={t.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Users size={18} color="var(--tl)" />
            <b style={{ fontFamily: "var(--fd)", fontSize: 16, flex: 1 }}>{t.name}</b>
            <span className={t.role === "owner" ? "chip adm" : "chip pro"}>{t.role === "owner" ? tr("Sahip", "Owner") : tr("Üye", "Member")}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {(t.members || []).map((m) => (
              <div key={m.id} className="row" style={{ padding: "9px 0" }}>
                <div className="av" style={{ width: 26, height: 26, fontSize: 11 }}>{(m.email[0] || "?").toUpperCase()}</div>
                <div className="row-t">{m.email}</div>
                <span className="row-d">{m.role === "owner" ? tr("sahip", "owner") : tr("üye", "member")}</span>
                {t.role === "owner" && m.role !== "owner" && <button className="mini-btn" onClick={() => post({ action: "remove", team_id: t.id, member_id: m.id }, tr("Çıkarıldı.", "Removed."))}>{tr("Çıkar", "Remove")}</button>}
              </div>
            ))}
          </div>
          {t.role === "owner" ? (
            <div style={{ display: "flex", gap: 8 }}>
              <input className="inp" style={{ margin: 0 }} placeholder={tr("Üye e-postası ile davet et…", "Invite by member email…")} value={invite[t.id] || ""} onChange={(e) => setInvite((s) => ({ ...s, [t.id]: e.target.value }))} />
              <button className="btn btn-a" style={{ padding: "9px 16px", borderRadius: 9 }} onClick={() => { const em = invite[t.id]; if (em) { post({ action: "invite", team_id: t.id, email: em }, tr("Davet edildi.", "Invited.")); setInvite((s) => ({ ...s, [t.id]: "" })); } }}>{tr("Davet Et", "Invite")}</button>
            </div>
          ) : (
            <button className="mini-btn" style={{ alignSelf: "flex-start" }} onClick={() => post({ action: "leave", team_id: t.id }, tr("Ekipten ayrıldın.", "You left the team."))}>{tr("Ekipten Ayrıl", "Leave Team")}</button>
          )}
          {t.role === "owner" && <button className="danger-btn" style={{ margin: 0 }} onClick={() => post({ action: "delete", team_id: t.id }, tr("Ekip silindi.", "Team deleted."))}>{tr("Ekibi Sil", "Delete Team")}</button>}
        </div>
      ))}

      {data.teams.length > 0 && <CreateBox ghost />}
      <div className="crit-note" style={{ border: "none", padding: 0 }}>{tr(<>Davet edilen kişi <b>aynı e-posta</b> ile Presubly'ye giriş yaptığında ekipte görünür ve paylaşılan raporlara yorum yapabilir.</>, <>An invited person appears in the team once they sign in to Presubly with the <b>same email</b>, and can comment on shared reports.</>)}</div>
    </div>
  );
}

/* ── Comments on a saved report (near-real-time via polling) ── */
function CommentsPanel({ reportId, auth }) {
  const { t: tc } = useLang();
  const [state, setState] = useState({ comments: null });
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await auth.getToken();
      const r = await fetch(`/api/comments?report=${encodeURIComponent(reportId)}`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setState(await r.json());
      else { const d = await r.json().catch(() => ({})); setState({ comments: [], error: d.error }); }
    } catch { setState({ comments: [] }); }
  }, [auth, reportId]);

  useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, [load]);

  async function add() {
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      const token = await auth.getToken();
      const r = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ report_id: reportId, body }) });
      if (r.ok) { setBody(""); load(); }
    } catch { /* ignore */ } finally { setBusy(false); }
  }
  async function del(id) {
    try {
      const token = await auth.getToken();
      await fetch(`/api/comments?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      load();
    } catch { /* ignore */ }
  }

  const list = state.comments;
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <MessageSquare size={17} color="var(--tl)" />
        <b style={{ fontFamily: "var(--fd)", fontSize: 15 }}>{tc("Ekip Yorumları", "Team Comments")}{Array.isArray(list) ? ` · ${list.length}` : ""}</b>
      </div>
      {list === null ? <div className="empty" style={{ padding: 10 }}>{tc("Yükleniyor…", "Loading…")}</div>
        : list.length === 0 ? <div className="empty" style={{ padding: 10 }}>{tc("Henüz yorum yok. İlk yorumu ekle.", "No comments yet. Add the first one.")}</div>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
            {list.map((c) => (
              <div key={c.id} style={{ display: "flex", gap: 10 }}>
                <div className="av" style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0 }}>{(c.author?.[0] || "?").toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "var(--k4)", display: "flex", gap: 8, alignItems: "center" }}>
                    <b style={{ color: "var(--ink)", fontWeight: 700 }}>{c.author}</b>
                    <span>{fmtDate(c.created_at)}</span>
                    {(c.user_id === state.me || state.isOwner) && <Trash2 size={12} style={{ cursor: "pointer", marginLeft: "auto" }} onClick={() => del(c.id)} />}
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--ink2)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{c.body}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      <div style={{ display: "flex", gap: 8 }}>
        <input className="inp" style={{ margin: 0 }} placeholder={tc("Yorum yaz…", "Write a comment…")} value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className="btn btn-a" style={{ padding: "9px 14px", borderRadius: 9, display: "flex", alignItems: "center", gap: 6 }} onClick={add} disabled={busy}><Send size={14} />{tc("Gönder", "Send")}</button>
      </div>
    </div>
  );
}

/* ───────────────────────── helpers ───────────────────────── */
function journalRules(journals, id) {
  if (!id) return "";
  const j = (journals || []).find((x) => x.id === id);
  if (!j) return "";
  const parts = [j.name];
  if (j.discipline) parts.push(`alan/kapsam: ${j.discipline}`);
  if (j.ref_style) parts.push(`kaynakça biçimi ${j.ref_style}`);
  if (j.word_limit) parts.push(`özet ≤${j.word_limit} kelime`);
  if (j.similarity_max) parts.push(`benzerlik ≤%${j.similarity_max}`);
  if (j.study_standard) parts.push(`${j.study_standard} standardı`);
  if (j.notes) parts.push(j.notes);
  return parts.join("; ");
}

const TR_MAP = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u" };
function slugify(s) {
  return String(s || "rapor").replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => TR_MAP[c] || c)
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "rapor";
}

function fmtDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
    const diff = (Date.now() - d.getTime()) / 86400000;
    if (diff < 1) return "bugün";
    if (diff < 2) return "dün";
    return `${Math.floor(diff)} gün`;
  } catch { return ""; }
}

/* Extract the headline score, decision, and per-criterion bars from the review
   markdown. Best-effort: if a piece can't be found, the UI simply omits it. */
function parseReview(text, tool) {
  const scoreM = text.match(/GENEL\s*SKOR[:\s]*(\d{1,3})/i) || text.match(/(\d{1,3})\s*\/\s*100/);
  const score = scoreM ? Math.min(100, parseInt(scoreM[1], 10)) : null;

  let decision = "";
  const decM = text.match(/GENEL\s*SKOR[^\n]*?—\s*([^\n.(]+)/i);
  if (decM) decision = decM[1].trim();
  else if (/major\s*revision/i.test(text)) decision = "Major Revision";
  else if (/minor\s*revision/i.test(text)) decision = "Minor Revision";
  else if (/\bret\b|reject/i.test(text)) decision = "Ret";
  else if (/kabul|accept/i.test(text)) decision = "Kabul";

  const bars = [];
  const seen = new Set();
  const re = /([A-Za-zÇĞİÖŞÜçğıöşü&\s]{3,40}?):\s*(\d{1,3})\s*\/\s*100/g;
  let m;
  while ((m = re.exec(text)) && bars.length < 7) {
    const label = m[1].replace(/\s+/g, " ").trim();
    if (/genel/i.test(label)) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    bars.push({ label: label.length > 12 ? label.slice(0, 11) + "…" : label, value: Math.min(100, parseInt(m[2], 10)) });
  }
  return { score, decision, bars };
}
