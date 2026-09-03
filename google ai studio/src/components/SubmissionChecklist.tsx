import React, { useState } from 'react';
import { ClipboardCheck, Download, RefreshCw, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { runChecklist } from '../services/geminiService';

const STUDY_TYPES = {
  tr: ['RCT (Randomize Kontrollu)', 'Gozlemsel Kohort', 'Vaka-Kontrol', 'Kesitsel', 'Sistematik Derleme', 'Meta-Analiz', 'Nitel Arastirma'],
  en: ['RCT (Randomized Controlled)', 'Observational Cohort', 'Case-Control', 'Cross-Sectional', 'Systematic Review', 'Meta-Analysis', 'Qualitative Research']
};

const STANDARDS = ['CONSORT', 'STROBE', 'PRISMA', 'COREQ', 'ARRIVE', 'COPE'];

const T = {
  tr: { title: 'Submission Checklist', desc: 'Makaleyi uluslararasi standartlara gore kontrol edin', paste: 'Makale metninizi yapistirin...', type: 'Calisma turu', std: 'Standart', run: 'Kontrol Baslat', pass: 'Gecti', warn: 'Uyari', fail: 'Basarisiz', verdict: 'Sonuc', dl: 'Rapor Indir', redo: 'Yeniden', loading: 'Kontrol ediliyor...' },
  en: { title: 'Submission Checklist', desc: 'Check your manuscript against international reporting standards', paste: 'Paste your manuscript text...', type: 'Study type', std: 'Standard', run: 'Run Check', pass: 'Passed', warn: 'Warning', fail: 'Failed', verdict: 'Verdict', dl: 'Download Report', redo: 'Redo', loading: 'Checking...' }
};

export default function SubmissionChecklist({ lang, apiKey }: { lang: Language; apiKey: string }) {
  const t = T[lang];
  const [text, setText] = useState('');
  const [studyType, setStudyType] = useState(STUDY_TYPES[lang][0]);
  const [standard, setStandard] = useState('CONSORT');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRun = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await runChecklist(text, studyType, standard, lang, apiKey);
      setResult(res);
    } catch (e: any) { alert(e.message || 'Error'); }
    setLoading(false);
  };

  const handleDownload = () => {
    if (!result) return;
    const txt = `PRESUBLY — ${result.standard} CHECKLIST REPORT\n${'='.repeat(50)}\nStudy Type: ${result.studyType}\nPassed: ${result.passed}/${result.totalItems} | Warnings: ${result.warnings} | Failed: ${result.failed}\nVerdict: ${result.verdict}\n\nITEMS:\n${result.items.map((it: any) => `  [${it.status.toUpperCase()}] ${it.id} — ${it.description}\n    ${it.note}`).join('\n\n')}\n\nSUMMARY:\n${result.summary}`;
    const blob = new Blob([txt], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `presubly-${result.standard}-checklist.txt`;
    a.click();
  };

  if (result) {
    const verdictOk = result.verdict?.toLowerCase().includes('submit');
    return (
      <div className="animate-fade-up space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">{t.title}</h2>
          <div className="flex gap-2">
            <button onClick={() => setResult(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm font-medium hover:bg-sage-200 transition"><RefreshCw size={14}/>{t.redo}</button>
            <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-950 text-white text-sm font-medium hover:bg-teal-900 transition"><Download size={14}/>{t.dl}</button>
          </div>
        </div>

        {/* Summary bar */}
        <div className="bg-white rounded-2xl border border-line p-6 shadow-sm">
          <div className="flex items-center gap-6 mb-4">
            <div className="font-mono text-sm tracking-wider text-ink-400">{result.standard}</div>
            <div className={`px-4 py-1.5 rounded-full font-bold text-sm ${verdictOk ? 'bg-ok-bg text-ok' : 'bg-err-bg text-err'}`}>{result.verdict}</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-ok-bg">
              <div className="font-display text-2xl font-bold text-ok">{result.passed}</div>
              <div className="text-xs text-ok">{t.pass}</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-warn-bg">
              <div className="font-display text-2xl font-bold text-warn">{result.warnings}</div>
              <div className="text-xs text-warn">{t.warn}</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-err-bg">
              <div className="font-display text-2xl font-bold text-err">{result.failed}</div>
              <div className="text-xs text-err">{t.fail}</div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl border border-line overflow-hidden shadow-sm">
          {result.items.map((it: any, i: number) => {
            const st = it.status?.toLowerCase();
            const icon = st === 'pass' ? '\u2713' : st === 'warn' ? '\u26A0' : '\u2717';
            const cls = st === 'pass' ? 'text-ok' : st === 'warn' ? 'text-warn' : 'text-err';
            return (
              <div key={i} className={`flex items-start gap-3 px-4 py-3 ${i < result.items.length - 1 ? 'border-b border-line' : ''}`}>
                <span className={`text-lg ${cls} flex-shrink-0 mt-0.5`}>{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{it.id} — {it.description}</div>
                  <div className="text-xs text-ink-400 mt-0.5">{it.note}</div>
                </div>
              </div>
            );
          })}
        </div>

        {result.summary && (
          <div className="bg-white rounded-xl border border-line p-4">
            <div className="font-mono text-xs font-semibold tracking-wider text-ink-400 mb-2">SUMMARY</div>
            <div className="text-sm text-ink-600 leading-relaxed">{result.summary}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold mb-1">{t.title}</h2>
        <p className="text-sm text-ink-400">{t.desc}</p>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={t.paste}
        className="w-full h-56 p-4 rounded-xl border border-line bg-white text-sm leading-relaxed resize-none outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 transition"
      />
      <div className="flex items-center gap-3">
        <select value={studyType} onChange={e => setStudyType(e.target.value)} className="flex-1 px-3 py-2.5 rounded-lg border border-line bg-white text-sm outline-none focus:border-teal-700">
          {STUDY_TYPES[lang].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={standard} onChange={e => setStandard(e.target.value)} className="px-3 py-2.5 rounded-lg border border-line bg-white text-sm outline-none focus:border-teal-700">
          {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <button
        onClick={handleRun}
        disabled={loading || !text.trim()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-950 text-white font-semibold text-sm hover:bg-teal-900 disabled:opacity-40 transition"
      >
        {loading ? <><Loader2 size={16} className="animate-spin"/>{t.loading}</> : <><ClipboardCheck size={16}/>{t.run}</>}
      </button>
    </div>
  );
}
