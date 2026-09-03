import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, X, AlertTriangle, Info, FileText } from 'lucide-react'
import { useT } from '@/i18n/utils'
import { callClaude } from '@/lib/claude'
import { deductCredits } from '@/lib/credits'
import { $apiKey } from '@/lib/api-key'
import { goToTool } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'
import type { ReviewResult } from './types'

const DISCIPLINES_TR = [
  'Tıp', 'Mühendislik', 'Eğitim', 'Hukuk', 'Sosyal Bilimler', 'Fen Bilimleri',
  'İktisat', 'Psikoloji', 'Eczacılık', 'Diş Hekimliği', 'Veterinerlik', 'Mimarlık', 'İletişim',
]
const DISCIPLINES_EN = [
  'Medicine', 'Engineering', 'Education', 'Law', 'Social Sciences', 'Natural Sciences',
  'Economics', 'Psychology', 'Pharmacy', 'Dentistry', 'Veterinary', 'Architecture', 'Communications',
]

export default function PeerReview() {
  const { locale } = useT()
  const tr = locale === 'tr'
  const apiKey = useStore($apiKey)
  const disciplines = tr ? DISCIPLINES_TR : DISCIPLINES_EN

  const [text, setText] = useState('')
  const [disc, setDisc] = useState(disciplines[0])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReviewResult | null>(null)
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
      await deductCredits('review', locale)
      const sys = `You are an expert academic peer reviewer specializing in ${disc}. Evaluate manuscripts on 7 criteria with a 100-point total. Return ONLY valid JSON.`
      const user = `Evaluate this manuscript in ${tr ? 'Turkish' : 'English'}. Score 7 criteria: Originality(0-15), Methodology(0-20), Literature(0-15), Presentation(0-15), Ethics(0-10), Results(0-15), Statistics(0-10). Return JSON: {"totalScore":N,"decision":"...","criteria":[{"name":"...","score":N,"maxScore":N,"comments":["..."]}],"majorIssues":["..."],"minorIssues":["..."],"suggestions":["..."],"summary":"..."}\n\nMANUSCRIPT:\n${text}`
      const raw = await callClaude(apiKey, sys, user, 4096)
      const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw) as ReviewResult
      setResult(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => goToTool('home')}
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-brand"
        >
          <ArrowLeft size={15} /> {tr ? 'Araçlar' : 'Tools'}
        </button>

        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-accent">
          {tr ? 'Hakem İncelemesi' : 'Peer Review'}
        </div>
        <h1 className="font-display text-[24px] font-bold text-ink">
          {tr ? 'Bilimsel Hakem İncelemesi' : 'Scientific Peer Review'}
        </h1>
        <p className="mt-1 text-[13.5px] text-ink-muted">
          {tr ? '7 kriter üzerinden 100 puanlık değerlendirme' : 'Assessment on a 100-point scale across 7 criteria'}
        </p>

        <textarea
          className="mt-5 min-h-[200px] w-full resize-y rounded-[10px] border border-app-border bg-app-card p-4 text-[14px] leading-relaxed text-ink outline-none transition-colors focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={tr ? 'Makale metninizi yapıştırın...' : 'Paste your manuscript...'}
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            className="rounded-[8px] border border-app-border bg-app-bg px-3 py-2.5 text-[13.5px] text-ink outline-none focus:border-brand/50"
            value={disc}
            onChange={(e) => setDisc(e.target.value)}
          >
            {disciplines.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <Button onClick={run} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {tr ? 'AI analiz ediyor...' : 'AI is analyzing...'}
              </>
            ) : tr ? 'Değerlendirmeyi Başlat' : 'Start Review'}
          </Button>
        </div>

        {error && (
          <div className="mt-3 rounded-[6px] border border-red-brand/25 bg-red-brand/5 px-3 py-2 text-[13px] text-red-brand">
            {error}
          </div>
        )}

        {result && <ReviewView data={result} tr={tr} />}
      </div>
    </motion.div>
  )
}

function ReviewView({ data: r, tr }: { data: ReviewResult; tr: boolean }) {
  const scoreColor = r.totalScore >= 80 ? 'text-ok' : r.totalScore >= 60 ? 'text-gold-accent' : 'text-red-brand'
  return (
    <div className="mt-6">
      <div className="rounded-[12px] border border-app-border bg-app-card p-5 shadow-card">
        <div className="flex items-center gap-5">
          <div className={`font-display text-[44px] font-bold leading-none ${scoreColor}`}>
            {r.totalScore}
            <span className="ml-0.5 text-[18px] font-semibold text-ink-muted">/100</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-stretch gap-3 rounded-[8px] border border-brand/20 bg-brand/5 px-4 py-3">
              <div className="w-1 shrink-0 rounded-full bg-brand" />
              <div>
                <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  {tr ? 'KARAR' : 'DECISION'}
                </div>
                <div className="mt-0.5 text-[14px] font-semibold text-ink">{r.decision}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {(r.criteria ?? []).map((c) => (
            <div className="flex items-center gap-3" key={c.name}>
              <div className="w-40 shrink-0 truncate text-[12.5px] text-ink-muted">{c.name}</div>
              <div className="h-1.5 flex-1 rounded-full bg-bg2">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${Math.round((c.score / c.maxScore) * 100)}%` }}
                />
              </div>
              <div className="w-14 shrink-0 text-right font-mono text-[12px] text-ink">
                {c.score}/{c.maxScore}
              </div>
            </div>
          ))}
        </div>
      </div>

      {r.majorIssues && r.majorIssues.length > 0 && (
        <IssueBox
          label={tr ? 'MAJÖR SORUNLAR' : 'MAJOR ISSUES'}
          items={r.majorIssues}
          icon={<X size={14} className="text-red-brand" />}
        />
      )}
      {r.minorIssues && r.minorIssues.length > 0 && (
        <IssueBox
          label={tr ? 'MİNÖR SORUNLAR' : 'MINOR ISSUES'}
          items={r.minorIssues}
          icon={<AlertTriangle size={14} className="text-gold-accent" />}
        />
      )}
      {r.suggestions && r.suggestions.length > 0 && (
        <IssueBox
          label={tr ? 'ÖNERİLER' : 'SUGGESTIONS'}
          items={r.suggestions}
          icon={<Info size={14} className="text-brand" />}
        />
      )}
      {r.summary && (
        <IssueBox
          label={tr ? 'ÖZET' : 'SUMMARY'}
          items={[r.summary]}
          icon={<FileText size={14} className="text-ink-muted" />}
        />
      )}
    </div>
  )
}

function IssueBox({ label, items, icon }: { label: string; items: string[]; icon: React.ReactNode }) {
  return (
    <div className="mt-4 overflow-hidden rounded-[12px] border border-app-border bg-app-card shadow-card">
      <div className="flex items-center gap-2 border-b border-app-border px-4 py-2.5">
        {icon}
        <span className="text-[12px] font-semibold uppercase tracking-wide text-ink">{label}</span>
      </div>
      <div className="divide-y divide-app-border">
        {items.map((item, i) => (
          <div className="px-4 py-2.5 text-[13.5px] leading-relaxed text-ink-muted" key={i}>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
