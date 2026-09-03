import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, MessageSquareQuote, Check, X, AlertTriangle, FileText } from 'lucide-react'
import { useT } from '@/i18n/utils'
import { callClaude } from '@/lib/claude'
import { deductCredits } from '@/lib/credits'
import { $apiKey } from '@/lib/api-key'
import { goToTool } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'
import type { ResponseResultData } from './types'

type Strategy = 'accept' | 'rebut' | 'partial'

const STRATEGY_LABELS: Record<Strategy, string> = {
  accept: 'Accept all',
  rebut: 'Rebut with evidence',
  partial: 'Partial accept',
}

export default function ResponseAssistant() {
  const { locale } = useT()
  const tr = locale === 'tr'
  const apiKey = useStore($apiKey)

  const [text, setText] = useState('')
  const [strat, setStrat] = useState<Strategy>('accept')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResponseResultData | null>(null)
  const [error, setError] = useState('')

  async function run() {
    if (!text.trim()) return
    if (!apiKey) {
      setError(tr ? 'Lütfen API anahtarınızı ekleyin.' : 'Please add your API key first.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await deductCredits('response', locale)
      const sys = 'You are helping an academic author respond to reviewer comments using ICMJE format. Return ONLY valid JSON.'
      const user = `Generate responses in ${tr ? 'Turkish' : 'English'}. Strategy: ${STRATEGY_LABELS[strat]}. Return JSON: {"responses":[{"comment":"...","strategy":"Accept/Rebut/Partial","response":"...","revision":"..."}],"summary":"..."}\n\nREVIEWER COMMENTS:\n${text}`
      const raw = await callClaude(apiKey, sys, user, 4096)
      const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw) as ResponseResultData
      setResult(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
    setLoading(false)
  }

  const strats: { id: Strategy; label: string }[] = [
    { id: 'accept', label: tr ? 'Kabul Et' : 'Accept' },
    { id: 'rebut', label: tr ? 'Kanıtla İtiraz' : 'Rebut' },
    { id: 'partial', label: tr ? 'Kısmi Kabul' : 'Partial' },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => goToTool('home')}
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-brand"
        >
          <ArrowLeft size={15} /> {tr ? 'Araçlar' : 'Tools'}
        </button>

        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-accent">
          {tr ? 'Araç' : 'Tool'}
        </div>
        <h1 className="font-display text-[24px] font-bold text-ink">
          {tr ? 'Yanıt Asistanı' : 'Response Assistant'}
        </h1>
        <p className="mt-1 text-[13.5px] text-ink-muted">
          {tr ? 'Hakem yorumlarına profesyonel yanıt oluşturun' : 'Generate professional responses to reviewer comments'}
        </p>

        <textarea
          className="mt-5 min-h-[200px] w-full resize-y rounded-[10px] border border-app-border bg-app-card p-4 text-[14px] leading-relaxed text-ink outline-none transition-colors focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={tr ? 'Hakem yorumlarını yapıştırın...' : 'Paste reviewer comments...'}
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            {tr ? 'Strateji' : 'Strategy'}
          </span>
          <div className="flex flex-wrap gap-2">
            {strats.map((s) => (
              <button
                key={s.id}
                onClick={() => setStrat(s.id)}
                className={
                  strat === s.id
                    ? 'rounded-[8px] border border-brand bg-brand/5 px-3.5 py-2 text-[13px] font-medium text-brand transition-colors'
                    : 'rounded-[8px] border border-app-border bg-app-card px-3.5 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:border-brand/40 hover:text-ink'
                }
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={run} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {tr ? 'AI analiz ediyor...' : 'AI is analyzing...'}
              </>
            ) : (
              tr ? 'Yanıt Oluştur' : 'Generate Responses'
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-3 rounded-[6px] border border-red-brand/25 bg-red-brand/5 px-3 py-2 text-[13px] text-red-brand">
            {error}
          </div>
        )}

        {result && <ResponseView data={result} tr={tr} />}
      </div>
    </motion.div>
  )
}

function strategyMeta(strategy: string): { Icon: typeof Check; color: string; tint: string; border: string } {
  if (strategy === 'Accept') return { Icon: Check, color: 'text-ok', tint: 'bg-ok/5', border: 'border-ok/25' }
  if (strategy === 'Rebut') return { Icon: X, color: 'text-red-brand', tint: 'bg-red-brand/5', border: 'border-red-brand/25' }
  return { Icon: AlertTriangle, color: 'text-gold-accent', tint: 'bg-gold-accent/5', border: 'border-gold-accent/30' }
}

function ResponseView({ data: r, tr }: { data: ResponseResultData; tr: boolean }) {
  return (
    <div className="mt-6 space-y-4">
      {(r.responses ?? []).map((resp, i) => {
        const { Icon, color, tint, border } = strategyMeta(resp.strategy)
        return (
          <div key={i} className="overflow-hidden rounded-[12px] border border-app-border bg-app-card shadow-card">
            <div className="flex items-center justify-between border-b border-app-border px-4 py-2.5">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-ink">
                {tr ? 'YORUM' : 'COMMENT'} {i + 1}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${color} ${tint} ${border}`}>
                <Icon size={12} /> {resp.strategy}
              </span>
            </div>
            <div className="space-y-3 px-4 py-3.5">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                  <MessageSquareQuote size={12} /> {tr ? 'HAKEM YORUMU' : 'REVIEWER COMMENT'}
                </div>
                <p className="mt-1 text-[13.5px] italic leading-relaxed text-ink-muted">{resp.comment}</p>
              </div>
              <div className="rounded-[8px] border border-ok/20 bg-ok/5 px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ok">
                  <Check size={12} /> {tr ? 'YAZAR YANITI' : 'AUTHOR RESPONSE'}
                </div>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink">{resp.response}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand">
                  <FileText size={12} /> {tr ? 'REVİZYON' : 'REVISION'}
                </div>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink">{resp.revision}</p>
              </div>
            </div>
          </div>
        )
      })}
      {r.summary && (
        <div className="overflow-hidden rounded-[12px] border border-app-border bg-app-card shadow-card">
          <div className="flex items-center gap-2 border-b border-app-border px-4 py-2.5">
            <FileText size={14} className="text-brand" />
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink">{tr ? 'ÖZET' : 'SUMMARY'}</span>
          </div>
          <div className="px-4 py-3 text-[13.5px] leading-relaxed text-ink-muted">{r.summary}</div>
        </div>
      )}
    </div>
  )
}
