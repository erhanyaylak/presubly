import React, { useState } from 'react';
import { BookOpen, Download, Copy, RefreshCw, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { runEditorialAssessment } from '../services/geminiService';

const T = {
  tr: { title: 'Editoryal Degerlendirme', desc: 'Hedef derginin editoru gibi kapsam ve karar analizi', paste: 'Makale metninizi yapistirin...', journal: 'Hedef dergi adi', run: 'Degerlendirmeyi Baslat', scope: 'Kapsam Uyumu', decision: 'Editoryal Karar', rationale: 'Gerekce', ethics: 'Etik Kontrol', letter: 'Karar Mektubu', copy: 'Kopyala', dl: 'Mektup Indir', redo: 'Yeniden', loading: 'AI analiz ediyor...' },
  en: { title: 'Editorial Assessment', desc: 'Scope fit and decision analysis from the editor\'s perspective', paste: 'Paste your manuscript text...', journal: 'Target journal name', run: 'Start Assessment', scope: 'Scope Fit', decision: 'Editorial Decision', rationale: 'Rationale', ethics: 'Ethics Check', letter: 'Decision Letter', copy: 'Copy', dl: 'Download Letter', redo: 'Redo', loading: 'AI is analyzing...' }
};

export default function EditorialAssessment({ lang, apiKey }: { lang: Language; apiKey: string }) {
  const t = T[lang];
  const [text, setText] = useState('');
  const [journal, setJournal] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRun = async () => {
    if (!text.trim() || !journal.trim()) return;
    setLoading(true);
    try {
      const res = await runEditorialAssessment(text, journal, lang, apiKey);
      setResult(res);
    } catch (e: any) { alert(e.message || 'Error'); }
    setLoading(false);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.letter], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'presubly-editorial-letter.txt';
    a.click();
  };

  if (result) {
    const scopeColor = result.scopeFit?.toLowerCase().includes('compatible') ? 'bg-ok-bg text-ok' : result.scopeFit?.toLowerCase().includes('partial') ? 'bg-warn-bg text-warn' : 'bg-err-bg text-err';
    const decColor = result.decision?.toLowerCase().includes('send') || result.decision?.toLowerCase().includes('reviewer') ? 'text-ok' : 'text-err';
    return (
      <div className="animate-fade-up space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">{t.title}</h2>
          <div className="flex gap-2">
            <button onClick={() => setResult(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm font-medium hover:bg-sage-200 transition"><RefreshCw size={14}/>{t.redo}</button>
            <button onClick={() => navigator.clipboard?.writeText(result.letter)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm font-medium hover:bg-sage-200 transition"><Copy size={14}/>{t.copy}</button>
            <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-950 text-white text-sm font-medium hover:bg-teal-900 transition"><Download size={14}/>{t.dl}</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-line p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="font-mono text-xs text-ink-400 tracking-wider mb-1">{t.scope.toUpperCase()}</div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${scopeColor}`}>{result.scopeFit}</span>
              <p className="text-sm text-ink-600 mt-2">{result.scopeNotes}</p>
            </div>
            <div>
              <div className="font-mono text-xs text-ink-400 tracking-wider mb-1">{t.decision.toUpperCase()}</div>
              <div className={`font-bold text-lg ${decColor}`}>{result.decision}</div>
              <p className="text-sm text-ink-600 mt-2">{result.decisionRationale}</p>
            </div>
          </div>
        </div>

        {result.ethicsCheck?.length > 0 && (
          <div className="bg-white rounded-xl border border-line p-4">
            <div className="font-mono text-xs font-semibold tracking-wider text-ink-400 mb-3">{t.ethics.toUpperCase()}</div>
            {result.ethicsCheck.map((item: string, i: number) => {
              const pass = item.toLowerCase().includes('pass');
              return <div key={i} className={`text-sm py-1 ${pass ? 'text-ok' : 'text-err'}`}>{pass ? '\u2713' : '\u2717'} {item}</div>;
            })}
          </div>
        )}

        <div className="bg-white rounded-xl border border-line p-4">
          <div className="font-mono text-xs font-semibold tracking-wider text-ink-400 mb-3">{t.letter.toUpperCase()}</div>
          <div className="text-sm text-ink-600 leading-relaxed whitespace-pre-wrap font-body">{result.letter}</div>
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
      <input
        value={journal}
        onChange={e => setJournal(e.target.value)}
        placeholder={t.journal}
        className="w-full px-4 py-2.5 rounded-lg border border-line bg-white text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 transition"
      />
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={t.paste}
        className="w-full h-56 p-4 rounded-xl border border-line bg-white text-sm leading-relaxed resize-none outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 transition"
      />
      <button
        onClick={handleRun}
        disabled={loading || !text.trim() || !journal.trim()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-950 text-white font-semibold text-sm hover:bg-teal-900 disabled:opacity-40 transition"
      >
        {loading ? <><Loader2 size={16} className="animate-spin"/>{t.loading}</> : <><BookOpen size={16}/>{t.run}</>}
      </button>
    </div>
  );
}
