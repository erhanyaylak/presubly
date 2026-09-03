import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Check, AlertTriangle, X } from 'lucide-react'
import { useT } from '@/i18n/utils'
import { callClaude } from '@/lib/claude'
import { deductCredits } from '@/lib/credits'
import { $apiKey } from '@/lib/api-key'
import { goToTool } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'
import type { ChecklistResultData } from './types'

const STUDY_TYPES_TR = ['RCT', 'Kohort', 'Vaka-Kontrol', 'Kesitsel', 'Sistematik Derleme', 'Meta-Analiz', 'Nitel']
const STUDY_TYPES_EN = ['RCT', 'Cohort', 'Case-Control', 'Cross-sectional', 'Systematic Review', 'Meta-Analysis', 'Qualitative']
const STANDARDS = ['CONSORT', 'STROBE', 'PRISMA', 'COREQ', 'ARRIVE', 'COPE']

export default function Checklist() {
  const { locale } = useT()
  const tr = locale === 'tr'
  const apiKey = useStore($apiKey)
  const studyTypes = tr ? STUDY_TYPES_TR : STUDY_TYPES_EN

  const [text, setText] = useState('')
  const [studyType, setStudyType] = useState(studyTypes[0])
  const [standard, setStandard] = useState('CONSORT')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ChecklistResultData | null>(null)
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
      await deductCredits('checklist', locale)
      const sys = `You are an academic compliance checker. Check manuscripts against ${standard} reporting standard. Return ONLY valid JSON.`
      const user = `Check this ${studyType} manuscript in ${tr ? 'Turkish' : 'English'} against ${standard}. Return JSON: {"standard":"${standard}","studyType":"${studyType}","totalItems":N,"passed":N,"warnings":N,"failed":N,"items":[{"id":"M.1","description":"...","status":"pass/warn/fail","note":"..."}],"verdict":"Submit now/Fix first","summary":"..."}\n\nMANUSCRIPT:\n${text}`
      const raw = await callClaude(apiKey, sys, user, 4096)
      const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw) as ChecklistResultData
      setResult(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
    setLoading(false)
  }

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
        <h1 className="font-display text-[24px] font-bold text-ink">Submission Checklist</h1>
        <p className="mt-1 text-[13.5px] text-ink-muted">
          {tr ? 'Makaleyi uluslararası standartlara göre kontrol edin' : 'Check your manuscript against international standards'}
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
            value={studyType}
            onChange={(e) => setStudyType(e.target.value)}
          >
            {studyTypes.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select
            className="rounded-[8px] border border-app-border bg-app-bg px-3 py-2.5 text-[13.5px] text-ink outline-none focus:border-brand/50"
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
          >
            {STANDARDS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <Button onClick={run} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {tr ? 'AI analiz ediyor...' : 'AI is analyzing...'}
              </>
            ) : tr ? 'Kontrol Başlat' : 'Run Check'}
          </Button>
        </div>

        {error && (
          <div className="mt-3 rounded-[6px] border border-red-brand/25 bg-red-brand/5 px-3 py-2 text-[13px] text-red-brand">
            {error}
          </div>
        )}

        {result && <ChecklistView data={result} tr={tr} />}
      </div>
    </motion.div>
  )
}

function ChecklistView({ data: r, tr }: { data: ChecklistResultData; tr: boolean }) {
  const verdictOk = (r.verdict ?? '').toLowerCase().includes('submit')

  return (
    <div className="mt-6">
      {/* Summary stat row */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-[12px] border border-app-border bg-app-card px-4 py-4 text-center shadow-card">
          <div className="flex items-center justify-center gap-1.5">
            <Check size={16} className="text-ok" />
            <span className="font-display text-[28px] font-bold text-ink">{r.passed}</span>
          </div>
          <div className="mt-1 text-[12px] text-ink-muted">{tr ? 'Geçti' : 'Passed'}</div>
        </div>
        <div className="rounded-[12px] border border-app-border bg-app-card px-4 py-4 text-center shadow-card">
          <div className="flex items-center justify-center gap-1.5">
            <AlertTriangle size={16} className="text-gold-accent" />
            <span className="font-display text-[28px] font-bold text-ink">{r.warnings}</span>
          </div>
          <div className="mt-1 text-[12px] text-ink-muted">{tr ? 'Uyarı' : 'Warning'}</div>
        </div>
        <div className="rounded-[12px] border border-app-border bg-app-card px-4 py-4 text-center shadow-card">
          <div className="flex items-center justify-center gap-1.5">
            <X size={16} className="text-red-brand" />
            <span className="font-display text-[28px] font-bold text-ink">{r.failed}</span>
          </div>
          <div className="mt-1 text-[12px] text-ink-muted">{tr ? 'Başarısız' : 'Failed'}</div>
        </div>
      </div>

      {/* Checklist items */}
      {r.items && r.items.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-[12px] border border-app-border bg-app-card shadow-card">
          <div className="flex items-center gap-2 border-b border-app-border px-4 py-2.5">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-accent">
              {r.standard}
            </span>
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink">
              {tr ? 'Kontrol Maddeleri' : 'Checklist Items'}
            </span>
          </div>
          <div className="divide-y divide-app-border">
            {r.items.map((it, i) => {
              const st = (it.status ?? '').toLowerCase()
              const Icon = st === 'pass' ? Check : st === 'warn' ? AlertTriangle : X
              const color = st === 'pass' ? 'text-ok' : st === 'warn' ? 'text-gold-accent' : 'text-red-brand'
              return (
                <div className="flex gap-3 px-4 py-3" key={i}>
                  <Icon size={16} className={`mt-0.5 shrink-0 ${color}`} />
                  <div>
                    <div className="text-[13.5px] font-medium text-ink">
                      {it.id} — {it.description}
                    </div>
                    {it.note && <div className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">{it.note}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Verdict badge */}
      <div
        className={`mt-4 flex items-center gap-3 rounded-[12px] border px-4 py-3 shadow-card ${
          verdictOk ? 'border-ok/25 bg-ok/5' : 'border-gold-accent/25 bg-gold-accent/5'
        }`}
      >
        <div className={`h-8 w-1 rounded-full ${verdictOk ? 'bg-ok' : 'bg-gold-accent'}`} />
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            {tr ? 'Karar' : 'Verdict'}
          </div>
          <div className={`text-[15px] font-semibold ${verdictOk ? 'text-ok' : 'text-gold-accent'}`}>
            {r.verdict}
          </div>
        </div>
      </div>

      {/* Summary box */}
      {r.summary && (
        <div className="mt-4 overflow-hidden rounded-[12px] border border-app-border bg-app-card shadow-card">
          <div className="flex items-center gap-2 border-b border-app-border px-4 py-2.5">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink">{tr ? 'Özet' : 'Summary'}</span>
          </div>
          <div className="px-4 py-3 text-[13.5px] leading-relaxed text-ink-muted">{r.summary}</div>
        </div>
      )}
    </div>
  )
}
