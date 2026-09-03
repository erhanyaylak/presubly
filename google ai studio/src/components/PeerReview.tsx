import React, { useState } from 'react';
import { FileText, Download, Copy, RefreshCw, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { runPeerReview } from '../services/geminiService';

const DISCIPLINES = {
  tr: ['Tip', 'Muhendislik', 'Egitim', 'Hukuk', 'Sosyal Bilimler', 'Fen Bilimleri', 'Iktisat', 'Psikoloji', 'Eczacilik', 'Dis Hekimligi', 'Veterinerlik', 'Mimarlik', 'Iletisim'],
  en: ['Medicine', 'Engineering', 'Education', 'Law', 'Social Sciences', 'Natural Sciences', 'Economics', 'Psychology', 'Pharmacy', 'Dentistry', 'Veterinary', 'Architecture', 'Communication']
};

const T = {
  tr: { title: 'Bilimsel Hakem Incelemesi', desc: '7 kriter uzerinden 100 puanlik olcekte degerlendirme', paste: 'Makale metninizi yapistirin...', disc: 'Disiplin secin', run: 'Degerlendirmeyi Baslat', score: 'Toplam Puan', decision: 'Karar', major: 'Major Sorunlar', minor: 'Minor Sorunlar', suggestions: 'Oneriler', summary: 'Ozet', copy: 'Kopyala', dl: 'Rapor Indir', redo: 'Yeniden', loading: 'AI analiz ediyor...' },
  en: { title: 'Scientific Peer Review', desc: 'Assessment on a 100-point scale across 7 criteria', paste: 'Paste your manuscript text...', disc: 'Select discipline', run: 'Start Review', score: 'Total Score', decision: 'Decision', major: 'Major Issues', minor: 'Minor Issues', suggestions: 'Suggestions', summary: 'Summary', copy: 'Copy', dl: 'Download Report', redo: 'Redo', loading: 'AI is analyzing...' }
};

export default function PeerReview({ lang, apiKey }: { lang: Language; apiKey: string }) {
  const t = T[lang];
  const [text, setText] = useState('');
  const [disc, setDisc] = useState(DISCIPLINES[lang][0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRun = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await runPeerReview(text, disc, lang, apiKey);
      setResult(res);
    } catch (e: any) {
      alert(e.message || 'Error');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (!result) return;
    const txt = `${t.score}: ${result.totalScore}/100\n${t.decision}: ${result.decision}\n\n${t.major}:\n${result.majorIssues.map((i: string) => `- ${i}`).join('\n')}\n\n${t.minor}:\n${result.minorIssues.map((i: string) => `- ${i}`).join('\n')}\n\n${t.suggestions}:\n${result.suggestions.map((i: string) => `- ${i}`).join('\n')}\n\n${t.summary}:\n${result.summary}`;
    navigator.clipboard?.writeText(txt);
  };

  const handleDownload = () => {
    if (!result) return;
    const txt = `PRESUBLY — SCIENTIFIC PEER REVIEW REPORT\n${'='.repeat(50)}\n\n${t.score}: ${result.totalScore}/100\n${t.decision}: ${result.decision}\n\nCRITERIA:\n${result.criteria.map((c: any) => `  ${c.name}: ${c.score}/${c.maxScore}\n${c.comments.map((cm: string) => `    - ${cm}`).join('\n')}`).join('\n\n')}\n\n${t.major.toUpperCase()}:\n${result.majorIssues.map((i: string) => `  [MAJOR] ${i}`).join('\n')}\n\n${t.minor.toUpperCase()}:\n${result.minorIssues.map((i: string) => `  [MINOR] ${i}`).join('\n')}\n\n${t.suggestions.toUpperCase()}:\n${result.suggestions.map((i: string) => `  [SUGGESTION] ${i}`).join('\n')}\n\n${t.summary.toUpperCase()}:\n${result.summary}`;
    const blob = new Blob([txt], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'presubly-peer-review.txt';
    a.click();
  };

  if (result) {
    const scoreColor = result.totalScore >= 80 ? 'text-ok' : result.totalScore >= 60 ? 'text-warn' : 'text-err';
    return (
      <div className="animate-fade-up space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">{t.title}</h2>
          <div className="flex gap-2">
            <button onClick={() => setResult(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm font-medium hover:bg-sage-200 transition"><RefreshCw size={14}/>{t.redo}</button>
            <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm font-medium hover:bg-sage-200 transition"><Copy size={14}/>{t.copy}</button>
            <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-950 text-white text-sm font-medium hover:bg-teal-900 transition"><Download size={14}/>{t.dl}</button>
          </div>
        </div>

        {/* Score card */}
        <div className="bg-white rounded-2xl border border-line p-6 shadow-sm">
          <div className="flex items-center gap-6 mb-6">
            <div className={`font-display text-5xl font-bold ${scoreColor}`}>{result.totalScore}<span className="text-xl text-ink-400">/100</span></div>
            <div>
              <div className="text-sm font-mono text-ink-400 tracking-wider uppercase">{t.decision}</div>
              <div className="font-bold text-lg">{result.decision}</div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {result.criteria.map((c: any) => (
              <div key={c.name} className="text-center">
                <div className="text-xs font-mono text-ink-400 mb-1 truncate">{c.name}</div>
                <div className="h-2 rounded-full bg-sage-200 overflow-hidden">
                  <div className="h-full rounded-full bg-teal-700 transition-all duration-700" style={{ width: `${(c.score / c.maxScore) * 100}%` }}></div>
                </div>
                <div className="text-xs font-bold mt-1">{c.score}/{c.maxScore}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Issues */}
        {result.majorIssues.length > 0 && (
          <div className="bg-err-bg rounded-xl border border-err/20 p-4">
            <div className="font-mono text-xs font-semibold tracking-wider text-err mb-2">{t.major.toUpperCase()}</div>
            {result.majorIssues.map((i: string, idx: number) => <div key={idx} className="text-sm text-ink-600 py-1">&#10007; {i}</div>)}
          </div>
        )}
        {result.minorIssues.length > 0 && (
          <div className="bg-warn-bg rounded-xl border border-warn/20 p-4">
            <div className="font-mono text-xs font-semibold tracking-wider text-warn mb-2">{t.minor.toUpperCase()}</div>
            {result.minorIssues.map((i: string, idx: number) => <div key={idx} className="text-sm text-ink-600 py-1">&#9888; {i}</div>)}
          </div>
        )}
        {result.suggestions.length > 0 && (
          <div className="bg-teal-100 rounded-xl border border-teal-700/15 p-4">
            <div className="font-mono text-xs font-semibold tracking-wider text-teal-700 mb-2">{t.suggestions.toUpperCase()}</div>
            {result.suggestions.map((i: string, idx: number) => <div key={idx} className="text-sm text-ink-600 py-1">&#8505; {i}</div>)}
          </div>
        )}

        {/* Summary */}
        <div className="bg-white rounded-xl border border-line p-4">
          <div className="font-mono text-xs font-semibold tracking-wider text-ink-400 mb-2">{t.summary.toUpperCase()}</div>
          <div className="text-sm text-ink-600 leading-relaxed">{result.summary}</div>
        </div>
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
        className="w-full h-64 p-4 rounded-xl border border-line bg-white text-sm leading-relaxed resize-none outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 transition"
      />

      <div className="flex items-center gap-3">
        <select value={disc} onChange={e => setDisc(e.target.value)} className="flex-1 px-3 py-2.5 rounded-lg border border-line bg-white text-sm outline-none focus:border-teal-700">
          {DISCIPLINES[lang].map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <button
          onClick={handleRun}
          disabled={loading || !text.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-950 text-white font-semibold text-sm hover:bg-teal-900 disabled:opacity-40 transition"
        >
          {loading ? <><Loader2 size={16} className="animate-spin"/>{t.loading}</> : <><FileText size={16}/>{t.run}</>}
        </button>
      </div>
    </div>
  );
}
