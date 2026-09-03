import React, { useState } from 'react';
import { MessageSquare, Download, Copy, RefreshCw, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { generateResponse } from '../services/geminiService';

const T = {
  tr: { title: 'Yanit Asistani', desc: 'Hakem yorumlarina profesyonel yanit olusturun', paste: 'Hakem yorumlarini yapistirin...', strategy: 'Strateji', accept: 'Kabul Et', rebut: 'Kanitla Itiraz', partial: 'Kismi Kabul', run: 'Yanit Olustur', comment: 'Hakem Yorumu', response: 'Yazar Yaniti', revision: 'Revizyon', copy: 'Kopyala', dl: 'Tum Yanitlari Indir', redo: 'Yeniden', loading: 'Yanitlar hazirlaniyor...' },
  en: { title: 'Response Assistant', desc: 'Generate professional responses to reviewer comments', paste: 'Paste reviewer comments...', strategy: 'Strategy', accept: 'Accept', rebut: 'Rebut with Evidence', partial: 'Partial Accept', run: 'Generate Responses', comment: 'Reviewer Comment', response: 'Author Response', revision: 'Revision', copy: 'Copy', dl: 'Download All', redo: 'Redo', loading: 'Preparing responses...' }
};

export default function ResponseAssistant({ lang, apiKey }: { lang: Language; apiKey: string }) {
  const t = T[lang];
  const [text, setText] = useState('');
  const [strategy, setStrategy] = useState('accept');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRun = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await generateResponse(text, strategy, lang, apiKey);
      setResult(res);
    } catch (e: any) { alert(e.message || 'Error'); }
    setLoading(false);
  };

  const handleDownload = () => {
    if (!result) return;
    const txt = result.responses.map((r: any, i: number) =>
      `--- Comment ${i + 1} ---\nReviewer: ${r.comment}\nStrategy: ${r.strategy}\nResponse: ${r.response}\nRevision: ${r.revision}`
    ).join('\n\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'presubly-responses.txt';
    a.click();
  };

  if (result) {
    return (
      <div className="animate-fade-up space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">{t.title}</h2>
          <div className="flex gap-2">
            <button onClick={() => setResult(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm font-medium hover:bg-sage-200 transition"><RefreshCw size={14}/>{t.redo}</button>
            <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-950 text-white text-sm font-medium hover:bg-teal-900 transition"><Download size={14}/>{t.dl}</button>
          </div>
        </div>

        {result.responses.map((r: any, i: number) => (
          <div key={i} className="bg-white rounded-xl border border-line overflow-hidden shadow-sm">
            <div className="bg-sage-200 px-4 py-2.5 border-b border-line flex items-center justify-between">
              <span className="font-mono text-xs tracking-wider text-ink-400">COMMENT {i + 1}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.strategy === 'Accept' ? 'bg-ok-bg text-ok' : r.strategy === 'Rebut' ? 'bg-err-bg text-err' : 'bg-warn-bg text-warn'}`}>{r.strategy}</span>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="font-mono text-xs text-ink-400 tracking-wider mb-1">{t.comment.toUpperCase()}</div>
                <div className="text-sm text-ink-600 italic leading-relaxed">{r.comment}</div>
              </div>
              <div className="border-t border-line pt-3">
                <div className="font-mono text-xs text-ok tracking-wider mb-1">{t.response.toUpperCase()}</div>
                <div className="text-sm text-ink-600 leading-relaxed">{r.response}</div>
              </div>
              <div className="border-t border-line pt-3">
                <div className="font-mono text-xs text-teal-700 tracking-wider mb-1">{t.revision.toUpperCase()}</div>
                <div className="text-sm text-ink-600 leading-relaxed">{r.revision}</div>
              </div>
            </div>
          </div>
        ))}

        {result.summary && (
          <div className="bg-teal-100 rounded-xl border border-teal-700/15 p-4">
            <div className="text-sm text-ink-600">{result.summary}</div>
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
        <div className="font-mono text-xs text-ink-400 tracking-wider">{t.strategy.toUpperCase()}</div>
        {[['accept', t.accept], ['rebut', t.rebut], ['partial', t.partial]].map(([val, label]) => (
          <button key={val} onClick={() => setStrategy(val)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${strategy === val ? 'bg-teal-950 text-white border-teal-950' : 'border-line hover:bg-sage-200'}`}>{label}</button>
        ))}
      </div>
      <button
        onClick={handleRun}
        disabled={loading || !text.trim()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-950 text-white font-semibold text-sm hover:bg-teal-900 disabled:opacity-40 transition"
      >
        {loading ? <><Loader2 size={16} className="animate-spin"/>{t.loading}</> : <><MessageSquare size={16}/>{t.run}</>}
      </button>
    </div>
  );
}
