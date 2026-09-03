import { useState, useEffect } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { $credits, $isAdmin, $displayName } from '../../stores/auth-store';
import { callClaude } from '../../lib/claude';
import { deductCredits } from '../../lib/credits';

interface Props { lang: 'tr' | 'en' }

type View = 'home' | 'review' | 'editorial' | 'response' | 'checklist' | 'profile' | 'admin';

export default function ToolApp({ lang: initialLang }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('home');
  const [lang, setLang] = useState(initialLang);
  const credits = useStore($credits);
  const isAdmin = useStore($isAdmin);
  const name = useStore($displayName);
  const tr = lang === 'tr';

  // API key
  const [apiKey, setApiKey] = useState('');
  useEffect(() => { setApiKey(localStorage.getItem('psb_api_key') || ''); }, []);

  // Expose globals
  useEffect(() => {
    (window as any).__openToolApp = () => setOpen(true);
    (window as any).__showTool = (id: string) => setView(id as View);
    return () => { delete (window as any).__openToolApp; delete (window as any).__showTool; };
  }, []);

  function close() { setOpen(false); setView('home'); }

  if (!open) return null;

  return (
    <div class="app-overlay open" style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'var(--sg)', overflowY: 'auto' }}>
      {/* App Bar */}
      <div class="app-bar">
        <div class="app-bar-left">
          <button class="app-back" onClick={close}>← {tr ? 'Siteye Dön' : 'Back to Site'}</button>
          <div class="app-logo-sm">Pre<span>sub</span>ly</div>
        </div>
        <div class="app-bar-right">
          <span class={`credit-badge ${credits > 2 ? 'ok' : 'low'}`} style={{ fontSize: '10px' }}>{credits} ⚡</span>
          <div class={`api-dot${apiKey ? ' ok' : ''}`}></div>
          <button class="app-btn app-btn-s" onClick={() => {
            const key = prompt(tr ? 'Anthropic API Key:' : 'Anthropic API Key:', apiKey);
            if (key !== null) { setApiKey(key); localStorage.setItem('psb_api_key', key); }
          }}>⚙ API</button>
          <button class="app-btn app-btn-s" onClick={() => setLang(l => l === 'tr' ? 'en' : 'tr')}>{lang === 'tr' ? 'EN' : 'TR'}</button>
        </div>
      </div>

      <div class="app-main">
        {view === 'home' && <ToolHome lang={lang} onSelect={setView} isAdmin={isAdmin} />}
        {view === 'review' && <PeerReview lang={lang} apiKey={apiKey} onBack={() => setView('home')} />}
        {view === 'editorial' && <Editorial lang={lang} apiKey={apiKey} onBack={() => setView('home')} />}
        {view === 'response' && <ResponseAssistant lang={lang} apiKey={apiKey} onBack={() => setView('home')} />}
        {view === 'checklist' && <SubmissionChecklist lang={lang} apiKey={apiKey} onBack={() => setView('home')} />}
        {view === 'profile' && <ProfileView lang={lang} onBack={() => setView('home')} />}
        {view === 'admin' && <AdminView lang={lang} onBack={() => setView('home')} />}
      </div>
    </div>
  );
}

/* ═══ HOME ═══ */
function ToolHome({ lang, onSelect, isAdmin }: { lang: string; onSelect: (v: View) => void; isAdmin: boolean }) {
  const tr = lang === 'tr';
  const tools = [
    { id: 'review' as View, num: 'TOOL 01', name: tr ? 'Bilimsel Hakem İncelemesi' : 'Scientific Peer Review', desc: tr ? '7 kriter, 100 puan, Kabul/Red tahmini.' : '7 criteria, 100 points, Accept/Reject prediction.' },
    { id: 'editorial' as View, num: 'TOOL 02', name: tr ? 'Editöryal Değerlendirme' : 'Editorial Assessment', desc: tr ? 'Kapsam uyumu, etik, karar mektubu.' : 'Scope fit, ethics, decision letter.' },
    { id: 'response' as View, num: 'TOOL 03', name: tr ? 'Yanıt Asistanı' : 'Response Assistant', desc: tr ? 'Hakem yorumlarına profesyonel yanıt.' : 'Professional responses to reviewer comments.' },
    { id: 'checklist' as View, num: 'TOOL 04', name: 'Submission Checklist', desc: tr ? 'CONSORT, STROBE, PRISMA kontrolü.' : 'CONSORT, STROBE, PRISMA checks.' },
  ];

  return (
    <div style={{ animation: 'panelIn .35s ease' }}>
      <div class="app-home-hero">
        <h2 dangerouslySetInnerHTML={{ __html: tr ? 'Göndermeden önce <em>hazır ol.</em>' : 'Be ready before <em>you submit.</em>' }} />
        <p>{tr ? 'Makale metninizi yapıştırın, disiplini seçin — AI saniyeler içinde değerlendirir.' : 'Paste your manuscript, select discipline — AI evaluates in seconds.'}</p>
      </div>
      <div class="app-tools">
        {tools.map(t => (
          <div class="app-tc" key={t.id} onClick={() => onSelect(t.id)}>
            <div class="app-tc-num">{t.num}</div>
            <div class="app-tc-name">{t.name}</div>
            <div class="app-tc-desc">{t.desc}</div>
            <div class="app-tc-go">{tr ? 'Aracı Aç' : 'Open Tool'} ›</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button class="app-btn app-btn-s" onClick={() => onSelect('profile')}>👤 {tr ? 'Profil' : 'Profile'}</button>
        {isAdmin && <button class="app-btn app-btn-s" onClick={() => onSelect('admin')}>⚙️ Admin</button>}
      </div>
    </div>
  );
}

/* ═══ TOOL 1: PEER REVIEW ═══ */
function PeerReview({ lang, apiKey, onBack }: { lang: string; apiKey: string; onBack: () => void }) {
  const tr = lang === 'tr';
  const [text, setText] = useState('');
  const [disc, setDisc] = useState('Tıp');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function run() {
    if (!text.trim()) return;
    if (!apiKey) { setError(tr ? 'Lütfen API anahtarınızı ekleyin.' : 'Please add your API key first.'); return; }
    setLoading(true); setError('');
    try {
      await deductCredits('review', lang as any);
      const sys = `You are an expert academic peer reviewer specializing in ${disc}. Evaluate manuscripts on 7 criteria with a 100-point total. Return ONLY valid JSON.`;
      const user = `Evaluate this manuscript in ${tr ? 'Turkish' : 'English'}. Score 7 criteria: Originality(0-15), Methodology(0-20), Literature(0-15), Presentation(0-15), Ethics(0-10), Results(0-15), Statistics(0-10). Return JSON: {"totalScore":N,"decision":"...","criteria":[{"name":"...","score":N,"maxScore":N,"comments":["..."]}],"majorIssues":["..."],"minorIssues":["..."],"suggestions":["..."],"summary":"..."}\n\nMANUSCRIPT:\n${text}`;
      const raw = await callClaude(apiKey, sys, user, 4096);
      const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw);
      setResult(json);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  const discs = ['Tıp','Mühendislik','Eğitim','Hukuk','Sosyal Bilimler','Fen Bilimleri','İktisat','Psikoloji','Eczacılık','Diş Hekimliği','Veterinerlik','Mimarlık','İletişim'];

  return (
    <div style={{ animation: 'panelIn .35s ease' }}>
      <button class="app-back" onClick={onBack} style={{ marginBottom: '16px' }}>← {tr ? 'Ana Sayfa' : 'Home'}</button>
      <div class="tv-h">{tr ? 'Bilimsel Hakem İncelemesi' : 'Scientific Peer Review'}</div>
      <div class="tv-sub">{tr ? '7 kriter üzerinden 100 puanlık değerlendirme' : 'Assessment on a 100-point scale across 7 criteria'}</div>
      <textarea class="tv-ta" value={text} onInput={(e) => setText((e.target as HTMLTextAreaElement).value)} placeholder={tr ? 'Makale metninizi yapıştırın...' : 'Paste your manuscript...'} />
      <div class="tv-row">
        <select class="tv-sel" value={disc} onChange={(e) => setDisc((e.target as HTMLSelectElement).value)}>
          {discs.map(d => <option key={d}>{d}</option>)}
        </select>
        <button class="tv-run" onClick={run} disabled={loading}>
          <span>{loading ? (<><span class="spin"></span> {tr ? 'AI analiz ediyor...' : 'AI is analyzing...'}</>) : (tr ? 'Değerlendirmeyi Başlat' : 'Start Review')}</span>
        </button>
      </div>
      {error && <div style={{ color: 'var(--er)', fontSize: '13px', marginTop: '12px' }}>{error}</div>}
      {result && <ReviewResult data={result} lang={lang} />}
    </div>
  );
}

function ReviewResult({ data: r, lang }: { data: any; lang: string }) {
  const tr = lang === 'tr';
  const sc = r.totalScore >= 80 ? 'ok' : r.totalScore >= 60 ? 'wn' : 'er';

  return (
    <div class="res" style={{ marginTop: '24px' }}>
      <div class="res-score">
        <div class="res-score-top">
          <div class={`res-big ${sc}`}>{r.totalScore}<sub>/100</sub></div>
          <div>
            <div style={{ fontFamily: 'var(--fm)', fontSize: '9px', color: 'var(--k4)', letterSpacing: '.14em' }}>{tr ? 'KARAR' : 'DECISION'}</div>
            <div class="res-dec">{r.decision}</div>
          </div>
        </div>
        <div class="res-bars">
          {(r.criteria || []).map((c: any) => (
            <div class="res-bar-item" key={c.name}>
              <div class="res-bar-lbl">{c.name}</div>
              <div class="res-bar-bg"><div class="res-bar-fill" style={{ width: `${Math.round((c.score / c.maxScore) * 100)}%` }}></div></div>
              <div class="res-bar-val">{c.score}/{c.maxScore}</div>
            </div>
          ))}
        </div>
      </div>
      {r.majorIssues?.length > 0 && <IssueBox type="major" label={tr ? 'MAJÖR SORUNLAR' : 'MAJOR ISSUES'} items={r.majorIssues} icon="✗" />}
      {r.minorIssues?.length > 0 && <IssueBox type="minor" label={tr ? 'MİNÖR SORUNLAR' : 'MINOR ISSUES'} items={r.minorIssues} icon="⚠" />}
      {r.suggestions?.length > 0 && <IssueBox type="suggest" label={tr ? 'ÖNERİLER' : 'SUGGESTIONS'} items={r.suggestions} icon="ℹ" />}
      {r.summary && <div class="res-box neutral"><div class="res-box-h">{tr ? 'ÖZET' : 'SUMMARY'}</div><div class="res-item">{r.summary}</div></div>}
    </div>
  );
}

function IssueBox({ type, label, items, icon }: { type: string; label: string; items: string[]; icon: string }) {
  return (
    <div class={`res-box ${type}`}>
      <div class="res-box-h">{label}</div>
      {items.map((item, i) => <div class="res-item" key={i}>{icon} {item}</div>)}
    </div>
  );
}

/* ═══ TOOL 2: EDITORIAL ═══ */
function Editorial({ lang, apiKey, onBack }: { lang: string; apiKey: string; onBack: () => void }) {
  const tr = lang === 'tr';
  const [text, setText] = useState('');
  const [journal, setJournal] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function run() {
    if (!text.trim() || !journal.trim()) return;
    if (!apiKey) { setError(tr ? 'Lütfen API anahtarınızı ekleyin.' : 'Please add your API key first.'); return; }
    setLoading(true); setError('');
    try {
      await deductCredits('editorial', lang as any);
      const sys = `You are a journal editor at "${journal}". Assess manuscripts editorially. Return ONLY valid JSON.`;
      const user = `Assess this manuscript in ${tr ? 'Turkish' : 'English'}. Return JSON: {"scopeFit":"Compatible/Partial/Out of scope","scopeNotes":"...","decision":"Send to Reviewers/Direct Reject","decisionRationale":"...","ethicsCheck":["item - PASS/FAIL"],"letter":"Dear Author...","summary":"..."}\n\nMANUSCRIPT:\n${text}`;
      const raw = await callClaude(apiKey, sys, user, 4096);
      const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw);
      setResult(json);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ animation: 'panelIn .35s ease' }}>
      <button class="app-back" onClick={onBack} style={{ marginBottom: '16px' }}>← {tr ? 'Ana Sayfa' : 'Home'}</button>
      <div class="tv-h">{tr ? 'Editöryal Değerlendirme' : 'Editorial Assessment'}</div>
      <div class="tv-sub">{tr ? 'Hedef derginin editörü gibi kapsam ve karar analizi' : 'Scope and decision analysis from editor perspective'}</div>
      <input class="tv-inp" value={journal} onInput={(e) => setJournal((e.target as HTMLInputElement).value)} placeholder={tr ? 'Hedef dergi adı...' : 'Target journal name...'} style={{ width: '100%', marginBottom: '10px' }} />
      <textarea class="tv-ta" value={text} onInput={(e) => setText((e.target as HTMLTextAreaElement).value)} placeholder={tr ? 'Makale metninizi yapıştırın...' : 'Paste your manuscript...'} />
      <div class="tv-row">
        <button class="tv-run" onClick={run} disabled={loading}>
          <span>{loading ? (<><span class="spin"></span> {tr ? 'AI analiz ediyor...' : 'AI is analyzing...'}</>) : (tr ? 'Değerlendirmeyi Başlat' : 'Start Assessment')}</span>
        </button>
      </div>
      {error && <div style={{ color: 'var(--er)', fontSize: '13px', marginTop: '12px' }}>{error}</div>}
      {result && <EditorialResult data={result} lang={lang} />}
    </div>
  );
}

function EditorialResult({ data: r, lang }: { data: any; lang: string }) {
  const tr = lang === 'tr';
  const scopeCls = r.scopeFit?.toLowerCase().includes('compatible') ? 'ok' : r.scopeFit?.toLowerCase().includes('partial') ? 'wn' : 'er';
  const decOk = r.decision?.toLowerCase().includes('send') || r.decision?.toLowerCase().includes('reviewer');

  return (
    <div class="res" style={{ marginTop: '24px' }}>
      <div class="res-grid2">
        <div class="res-cell">
          <div class="res-cell-h">{tr ? 'KAPSAM UYUMU' : 'SCOPE FIT'}</div>
          <span class={`res-badge ${scopeCls}`}>{r.scopeFit}</span>
          <p style={{ fontSize: '13px', color: 'var(--k3)', marginTop: '8px' }}>{r.scopeNotes}</p>
        </div>
        <div class="res-cell">
          <div class="res-cell-h">{tr ? 'EDİTÖRYAL KARAR' : 'EDITORIAL DECISION'}</div>
          <div style={{ fontWeight: 700, fontSize: '16px', color: `var(${decOk ? '--ok' : '--er'})` }}>{r.decision}</div>
          <p style={{ fontSize: '13px', color: 'var(--k3)', marginTop: '8px' }}>{r.decisionRationale}</p>
        </div>
      </div>
      {r.letter && <div class="res-box neutral"><div class="res-box-h">{tr ? 'KARAR MEKTUBU' : 'DECISION LETTER'}</div><div class="res-item" style={{ whiteSpace: 'pre-wrap' }}>{r.letter}</div></div>}
    </div>
  );
}

/* ═══ TOOL 3: RESPONSE ASSISTANT ═══ */
function ResponseAssistant({ lang, apiKey, onBack }: { lang: string; apiKey: string; onBack: () => void }) {
  const tr = lang === 'tr';
  const [text, setText] = useState('');
  const [strat, setStrat] = useState('accept');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function run() {
    if (!text.trim()) return;
    if (!apiKey) { setError(tr ? 'Lütfen API anahtarınızı ekleyin.' : 'Please add your API key first.'); return; }
    setLoading(true); setError('');
    try {
      await deductCredits('response', lang as any);
      const stratLabel = { accept: 'Accept all', rebut: 'Rebut with evidence', partial: 'Partial accept' }[strat];
      const sys = 'You are helping an academic author respond to reviewer comments using ICMJE format. Return ONLY valid JSON.';
      const user = `Generate responses in ${tr ? 'Turkish' : 'English'}. Strategy: ${stratLabel}. Return JSON: {"responses":[{"comment":"...","strategy":"Accept/Rebut/Partial","response":"...","revision":"..."}],"summary":"..."}\n\nREVIEWER COMMENTS:\n${text}`;
      const raw = await callClaude(apiKey, sys, user, 4096);
      const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw);
      setResult(json);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  const strats = [
    { id: 'accept', label: tr ? 'Kabul Et' : 'Accept' },
    { id: 'rebut', label: tr ? 'Kanıtla İtiraz' : 'Rebut' },
    { id: 'partial', label: tr ? 'Kısmi Kabul' : 'Partial' },
  ];

  return (
    <div style={{ animation: 'panelIn .35s ease' }}>
      <button class="app-back" onClick={onBack} style={{ marginBottom: '16px' }}>← {tr ? 'Ana Sayfa' : 'Home'}</button>
      <div class="tv-h">{tr ? 'Yanıt Asistanı' : 'Response Assistant'}</div>
      <div class="tv-sub">{tr ? 'Hakem yorumlarına profesyonel yanıt oluşturun' : 'Generate professional responses to reviewer comments'}</div>
      <textarea class="tv-ta" value={text} onInput={(e) => setText((e.target as HTMLTextAreaElement).value)} placeholder={tr ? 'Hakem yorumlarını yapıştırın...' : 'Paste reviewer comments...'} />
      <div class="tv-row">
        <span style={{ fontFamily: 'var(--fm)', fontSize: '10px', color: 'var(--k4)', letterSpacing: '.12em' }}>{tr ? 'STRATEJİ' : 'STRATEGY'}</span>
        <div class="tv-strat">
          {strats.map(s => (
            <button key={s.id} class={strat === s.id ? 'on' : ''} onClick={() => setStrat(s.id)}>{s.label}</button>
          ))}
        </div>
      </div>
      <div class="tv-row">
        <button class="tv-run" onClick={run} disabled={loading}>
          <span>{loading ? (<><span class="spin"></span> {tr ? 'AI analiz ediyor...' : 'AI is analyzing...'}</>) : (tr ? 'Yanıt Oluştur' : 'Generate Responses')}</span>
        </button>
      </div>
      {error && <div style={{ color: 'var(--er)', fontSize: '13px', marginTop: '12px' }}>{error}</div>}
      {result && <ResponseResult data={result} lang={lang} />}
    </div>
  );
}

function ResponseResult({ data: r, lang }: { data: any; lang: string }) {
  const tr = lang === 'tr';
  return (
    <div class="res" style={{ marginTop: '24px' }}>
      {(r.responses || []).map((resp: any, i: number) => {
        const stCls = resp.strategy === 'Accept' ? 'background:var(--okl);color:var(--ok)' : resp.strategy === 'Rebut' ? 'background:var(--erl);color:var(--er)' : 'background:var(--wnl);color:var(--wn)';
        return (
          <div class="resp-card" key={i}>
            <div class="resp-card-h"><span>COMMENT {i + 1}</span><span class="resp-card-badge" style={stCls}>{resp.strategy}</span></div>
            <div class="resp-card-body">
              <div class="resp-section"><div class="resp-section-h">{tr ? 'HAKEM YORUMU' : 'REVIEWER COMMENT'}</div><p style={{ fontStyle: 'italic' }}>{resp.comment}</p></div>
              <div class="resp-section"><div class="resp-section-h ok">{tr ? 'YAZAR YANITI' : 'AUTHOR RESPONSE'}</div><p>{resp.response}</p></div>
              <div class="resp-section"><div class="resp-section-h tl">{tr ? 'REVİZYON' : 'REVISION'}</div><p>{resp.revision}</p></div>
            </div>
          </div>
        );
      })}
      {r.summary && <div class="res-box suggest"><div class="res-box-h">{tr ? 'ÖZET' : 'SUMMARY'}</div><div class="res-item">{r.summary}</div></div>}
    </div>
  );
}

/* ═══ TOOL 4: SUBMISSION CHECKLIST ═══ */
function SubmissionChecklist({ lang, apiKey, onBack }: { lang: string; apiKey: string; onBack: () => void }) {
  const tr = lang === 'tr';
  const [text, setText] = useState('');
  const [studyType, setStudyType] = useState('RCT');
  const [standard, setStandard] = useState('CONSORT');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function run() {
    if (!text.trim()) return;
    if (!apiKey) { setError(tr ? 'Lütfen API anahtarınızı ekleyin.' : 'Please add your API key first.'); return; }
    setLoading(true); setError('');
    try {
      await deductCredits('checklist', lang as any);
      const sys = `You are an academic compliance checker. Check manuscripts against ${standard} reporting standard. Return ONLY valid JSON.`;
      const user = `Check this ${studyType} manuscript in ${tr ? 'Turkish' : 'English'} against ${standard}. Return JSON: {"standard":"${standard}","studyType":"${studyType}","totalItems":N,"passed":N,"warnings":N,"failed":N,"items":[{"id":"M.1","description":"...","status":"pass/warn/fail","note":"..."}],"verdict":"Submit now/Fix first","summary":"..."}\n\nMANUSCRIPT:\n${text}`;
      const raw = await callClaude(apiKey, sys, user, 4096);
      const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw);
      setResult(json);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  const types = ['RCT','Kohort','Vaka-Kontrol','Kesitsel','Sistematik Derleme','Meta-Analiz','Nitel'];
  const stds = ['CONSORT','STROBE','PRISMA','COREQ','ARRIVE','COPE'];

  return (
    <div style={{ animation: 'panelIn .35s ease' }}>
      <button class="app-back" onClick={onBack} style={{ marginBottom: '16px' }}>← {tr ? 'Ana Sayfa' : 'Home'}</button>
      <div class="tv-h">Submission Checklist</div>
      <div class="tv-sub">{tr ? 'Makaleyi uluslararası standartlara göre kontrol edin' : 'Check your manuscript against international standards'}</div>
      <textarea class="tv-ta" value={text} onInput={(e) => setText((e.target as HTMLTextAreaElement).value)} placeholder={tr ? 'Makale metninizi yapıştırın...' : 'Paste your manuscript...'} />
      <div class="tv-row">
        <select class="tv-sel" value={studyType} onChange={(e) => setStudyType((e.target as HTMLSelectElement).value)}>
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
        <select class="tv-sel" value={standard} onChange={(e) => setStandard((e.target as HTMLSelectElement).value)}>
          {stds.map(s => <option key={s}>{s}</option>)}
        </select>
        <button class="tv-run" onClick={run} disabled={loading}>
          <span>{loading ? (<><span class="spin"></span> {tr ? 'AI analiz ediyor...' : 'AI is analyzing...'}</>) : (tr ? 'Kontrol Başlat' : 'Run Check')}</span>
        </button>
      </div>
      {error && <div style={{ color: 'var(--er)', fontSize: '13px', marginTop: '12px' }}>{error}</div>}
      {result && <ChecklistResult data={result} lang={lang} />}
    </div>
  );
}

function ChecklistResult({ data: r, lang }: { data: any; lang: string }) {
  const tr = lang === 'tr';
  const verdictOk = r.verdict?.toLowerCase().includes('submit');

  return (
    <div class="res" style={{ marginTop: '24px' }}>
      <div class="res-score" style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ fontFamily: 'var(--fm)', fontSize: '11px', color: 'var(--k4)', letterSpacing: '.14em', marginBottom: '8px' }}>{r.standard}</div>
        <span class={`res-badge ${verdictOk ? 'ok' : 'er'}`} style={{ fontSize: '14px', padding: '6px 20px' }}>{r.verdict}</span>
      </div>
      <div class="chk-summary">
        <div class="chk-stat ok"><div class="chk-stat-n">{r.passed}</div><div class="chk-stat-l">{tr ? 'Geçti' : 'Passed'}</div></div>
        <div class="chk-stat wn"><div class="chk-stat-n">{r.warnings}</div><div class="chk-stat-l">{tr ? 'Uyarı' : 'Warning'}</div></div>
        <div class="chk-stat er"><div class="chk-stat-n">{r.failed}</div><div class="chk-stat-l">{tr ? 'Başarısız' : 'Failed'}</div></div>
      </div>
      {r.items?.length > 0 && (
        <div class="res-box neutral" style={{ padding: 0 }}>
          <div class="res-box-h" style={{ padding: '12px 16px' }}>{tr ? 'KONTROL MADDELERİ' : 'CHECKLIST ITEMS'}</div>
          {r.items.map((it: any, i: number) => {
            const st = it.status?.toLowerCase();
            const icon = st === 'pass' ? '✓' : st === 'warn' ? '⚠' : '✗';
            const cls = st === 'pass' ? 'ok' : st === 'warn' ? 'wn' : 'er';
            return (
              <div class="chk-item" key={i}>
                <span class={`chk-icon ${cls}`}>{icon}</span>
                <div><div class="chk-item-id">{it.id} — {it.description}</div><div class="chk-item-note">{it.note}</div></div>
              </div>
            );
          })}
        </div>
      )}
      {r.summary && <div class="res-box neutral" style={{ marginTop: '12px' }}><div class="res-box-h">{tr ? 'ÖZET' : 'SUMMARY'}</div><div class="res-item">{r.summary}</div></div>}
    </div>
  );
}

/* ═══ PROFILE (placeholder) ═══ */
function ProfileView({ lang, onBack }: { lang: string; onBack: () => void }) {
  const tr = lang === 'tr';
  const name = useStore($displayName);
  const credits = useStore($credits);

  return (
    <div style={{ animation: 'panelIn .35s ease' }}>
      <button class="app-back" onClick={onBack} style={{ marginBottom: '16px' }}>← {tr ? 'Ana Sayfa' : 'Home'}</button>
      <div class="pp-hero" style={{ background: 'var(--t)', borderRadius: '16px', padding: '32px', color: 'var(--sg)', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <div class="prof-av" style={{ width: '56px', height: '56px', fontSize: '20px' }}>{(name[0] || '?').toUpperCase()}</div>
        <div>
          <div style={{ fontFamily: 'var(--fd)', fontSize: '22px', fontWeight: 700 }}>{name}</div>
          <div style={{ fontSize: '13px', opacity: .5 }}>{credits} {tr ? 'kredi' : 'credits'}</div>
        </div>
      </div>
      <div class="res-box neutral"><div class="res-box-h">{tr ? 'PROFİL' : 'PROFILE'}</div><div class="res-item">{tr ? 'Profil düzenleme yakında eklenecek.' : 'Profile editing coming soon.'}</div></div>
    </div>
  );
}

/* ═══ ADMIN (placeholder) ═══ */
function AdminView({ lang, onBack }: { lang: string; onBack: () => void }) {
  const tr = lang === 'tr';
  return (
    <div style={{ animation: 'panelIn .35s ease' }}>
      <button class="app-back" onClick={onBack} style={{ marginBottom: '16px' }}>← {tr ? 'Ana Sayfa' : 'Home'}</button>
      <div class="tv-h">{tr ? 'Yönetici Paneli' : 'Admin Panel'}</div>
      <div class="res-box neutral"><div class="res-box-h">ADMIN</div><div class="res-item">{tr ? 'Admin paneli yakında eklenecek.' : 'Admin panel coming soon.'}</div></div>
    </div>
  );
}
