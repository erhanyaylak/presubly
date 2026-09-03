import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Check, X } from 'lucide-react'
import { useT } from '@/i18n/utils'
import { callClaude } from '@/lib/claude'
import { deductCredits } from '@/lib/credits'
import { $apiKey } from '@/lib/api-key'
import { goToTool } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'
import type { EditorialResultData } from './types'

export default function Editorial() {
  const { locale } = useT()
  const tr = locale === 'tr'
  const apiKey = useStore($apiKey)

  const [text, setText] = useState('')
  const [journal, setJournal] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EditorialResultData | null>(null)
  const [error, setError] = useState('')

  async function run() {
    if (!text.trim() || !journal.trim()) return
    if (!apiKey) {
      setError(tr ? 'Lütfen API anahtarınızı ekleyin.' : 'Please add your API key first.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await deductCredits('editorial', locale)
      const sys = `You are a journal editor at "${journal}". Assess manuscripts editorially. Return ONLY valid JSON.`
      const user = `Assess this manuscript in ${tr ? 'Turkish' : 'English'}. Return JSON: {"scopeFit":"Compatible/Partial/Out of scope","scopeNotes":"...","decision":"Send to Reviewers/Direct Reject","decisionRationale":"...","ethicsCheck":["item - PASS/FAIL"],"letter":"Dear Author...","summary":"..."}\n\nMANUSCRIPT:\n${text}`
      const raw = await callClaude(apiKey, sys, user, 4096)
      const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw) as EditorialResultData
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
        <h1 className="font-display text-[24px] font-bold text-ink">
          {tr ? 'Editöryal Değerlendirme' : 'Editorial Assessment'}
        </h1>
        <p className="mt-1 text-[13.5px] text-ink-muted">
          {tr
            ? 'Hedef derginin editörü gibi kapsam ve karar analizi'
            : 'Scope and decision analysis from editor perspective'}
        </p>

        <input
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          placeholder={tr ? 'Hedef dergi adı...' : 'Target journal name...'}
          className="mt-5 w-full rounded-[8px] border border-app-border bg-app-bg px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={tr ? 'Makale metninizi yapıştırın...' : 'Paste your manuscript...'}
          className="mt-3 min-h-[200px] w-full resize-y rounded-[10px] border border-app-border bg-app-card p-4 text-[14px] leading-relaxed text-ink outline-none transition-colors focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={run} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {tr ? 'AI analiz ediyor...' : 'AI is analyzing...'}
              </>
            ) : tr ? (
              'Değerlendirmeyi Başlat'
            ) : (
              'Start Assessment'
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-3 rounded-[6px] border border-red-brand/25 bg-red-brand/5 px-3 py-2 text-[13px] text-red-brand">
            {error}
          </div>
        )}
        {result && <EditorialView data={result} tr={tr} />}
      </div>
    </motion.div>
  )
}

function EditorialView({ data: r, tr }: { data: EditorialResultData; tr: boolean }) {
  const lower = (s?: string) => (s ?? '').toLowerCase()
  const scopeFit = lower(r.scopeFit)
  const scopeColor = scopeFit.includes('compatible')
    ? 'text-ok'
    : scopeFit.includes('partial')
      ? 'text-gold-accent'
      : 'text-red-brand'
  const scopeBg = scopeFit.includes('compatible')
    ? 'border-ok/25 bg-ok/5'
    : scopeFit.includes('partial')
      ? 'border-gold-accent/25 bg-gold-accent/5'
      : 'border-red-brand/25 bg-red-brand/5'
  const decOk = lower(r.decision).includes('send') || lower(r.decision).includes('reviewer')

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="overflow-hidden rounded-[12px] border border-app-border bg-app-card p-4 shadow-card">
          <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
            {tr ? 'Kapsam Uyumu' : 'Scope Fit'}
          </div>
          <span
            className={`mt-2 inline-block rounded-[8px] border px-3 py-1 text-[13px] font-semibold ${scopeBg} ${scopeColor}`}
          >
            {r.scopeFit}
          </span>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">{r.scopeNotes}</p>
        </div>

        <div className="overflow-hidden rounded-[12px] border border-app-border bg-app-card p-4 shadow-card">
          <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
            {tr ? 'Editöryal Karar' : 'Editorial Decision'}
          </div>
          <div
            className={`mt-2 flex items-stretch gap-2.5 rounded-[8px] border px-3 py-2.5 ${
              decOk ? 'border-ok/20 bg-ok/5' : 'border-red-brand/20 bg-red-brand/5'
            }`}
          >
            <span className={`w-1 rounded-full ${decOk ? 'bg-ok' : 'bg-red-brand'}`} />
            <span className={`text-[15px] font-bold ${decOk ? 'text-ok' : 'text-red-brand'}`}>{r.decision}</span>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">{r.decisionRationale}</p>
        </div>
      </div>

      {r.ethicsCheck && r.ethicsCheck.length > 0 && (
        <div className="overflow-hidden rounded-[12px] border border-app-border bg-app-card shadow-card">
          <div className="flex items-center gap-2 border-b border-app-border px-4 py-2.5">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink">
              {tr ? 'Etik Kontrol' : 'Ethics Check'}
            </span>
          </div>
          <div className="divide-y divide-app-border">
            {r.ethicsCheck.map((item, i) => {
              const pass = lower(item).includes('pass')
              return (
                <div key={i} className="flex items-center gap-2 px-4 py-2.5 text-[13.5px] leading-relaxed">
                  {pass ? (
                    <Check size={15} className="shrink-0 text-ok" />
                  ) : (
                    <X size={15} className="shrink-0 text-red-brand" />
                  )}
                  <span className={pass ? 'text-ink-muted' : 'text-red-brand'}>{item}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {r.letter && (
        <div className="overflow-hidden rounded-[12px] border border-app-border bg-app-card shadow-card">
          <div className="flex items-center gap-2 border-b border-app-border px-4 py-2.5">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink">
              {tr ? 'Karar Mektubu' : 'Decision Letter'}
            </span>
          </div>
          <div className="whitespace-pre-wrap px-4 py-3 text-[13.5px] leading-relaxed text-ink-muted">{r.letter}</div>
        </div>
      )}

      {r.summary && (
        <div className="rounded-[12px] border border-app-border bg-app-card p-4 shadow-card">
          <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
            {tr ? 'Özet' : 'Summary'}
          </div>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">{r.summary}</p>
        </div>
      )}
    </div>
  )
}
