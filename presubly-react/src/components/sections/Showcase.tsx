import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FileText, BookOpen, MessageSquare, CheckSquare, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useT } from '@/i18n/utils'
import { openApp } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'

type ToolId = 'review' | 'editorial' | 'response' | 'checklist'
const TABS: { id: ToolId; icon: LucideIcon; nameKey: string; tagKey: string }[] = [
  { id: 'review', icon: FileText, nameKey: 'tab.n1', tagKey: 'tab.t1' },
  { id: 'editorial', icon: BookOpen, nameKey: 'tab.n2', tagKey: 'tab.t2' },
  { id: 'response', icon: MessageSquare, nameKey: 'tab.n3', tagKey: 'tab.t3' },
  { id: 'checklist', icon: CheckSquare, nameKey: 'tab.n4', tagKey: 'tab.t4' },
]

export default function Showcase() {
  const { t, locale } = useT()
  const tr = locale === 'tr'
  const [active, setActive] = useState<ToolId>('review')
  const tab = TABS.find((x) => x.id === active)!

  return (
    <section className="border-b border-app-border bg-app-bg py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-accent">
          <span className="h-px w-6 bg-gold-accent" /> {t('tools.ey')}
        </div>
        <h2
          className="font-display mt-4 max-w-2xl text-[clamp(28px,4vw,46px)] font-bold leading-[1.06] tracking-[-0.02em] text-ink [&_em]:not-italic [&_em]:text-gold-accent"
          dangerouslySetInnerHTML={{ __html: t('tools.h') }}
        />
        <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-ink-muted">{t('tools.sub')}</p>

        {/* Tab bar */}
        <div className="mt-9 flex flex-wrap gap-2">
          {TABS.map((x) => {
            const on = x.id === active
            const Icon = x.icon
            return (
              <button
                key={x.id}
                onClick={() => setActive(x.id)}
                className={`inline-flex items-center gap-2 rounded-[8px] border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                  on ? 'border-brand bg-brand/10 text-brand' : 'border-app-border text-ink-muted hover:bg-bg2 hover:text-ink'
                }`}
              >
                <Icon size={15} /> {t(x.nameKey)}
              </button>
            )
          })}
        </div>

        {/* Panel */}
        <div className="mt-5 grid items-stretch gap-6 rounded-[14px] border border-app-border bg-app-card p-5 md:p-7 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex flex-col justify-center">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-gold-accent">{t(tab.tagKey)}</div>
            <h3 className="font-display mt-2 text-[24px] font-bold text-ink">{t(tab.nameKey)}</h3>
            <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-muted">{DESC[active][tr ? 'tr' : 'en']}</p>
            <div className="mt-5">
              <Button onClick={() => openApp('home')}>
                {tr ? 'Aracı Aç' : 'Open Tool'} <ArrowRight size={16} />
              </Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="rounded-[10px] border border-app-border bg-app-bg p-4 md:p-5"
            >
              {PANELS[active](tr)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

const DESC: Record<ToolId, { tr: string; en: string }> = {
  review: { tr: '7 akademik kritere göre 100 puanlık değerlendirme, sorun şiddeti ve kabul/red tahmini.', en: '100-point evaluation across 7 academic criteria, issue severity and accept/reject prediction.' },
  editorial: { tr: 'Kapsam uyumu, etik denetimi ve editör karar mektubu — saniyeler içinde.', en: 'Scope fit, ethics check and an editor decision letter — in seconds.' },
  response: { tr: 'Hakem yorumlarına ICMJE biçiminde, kanıta dayalı profesyonel yanıtlar.', en: 'Evidence-based, ICMJE-style professional responses to reviewer comments.' },
  checklist: { tr: 'CONSORT / STROBE / PRISMA gibi raporlama standartlarına madde madde uyum.', en: 'Item-by-item compliance with reporting standards like CONSORT / STROBE / PRISMA.' },
}

function Bar({ label, val, w, color }: { label: string; val: string; w: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 shrink-0 text-[12px] text-ink-muted">{label}</div>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg2">
        <div className="h-full rounded-full" style={{ width: w, background: color }} />
      </div>
      <div className="w-7 shrink-0 text-right font-mono text-[11.5px] font-semibold" style={{ color }}>{val}</div>
    </div>
  )
}

const C = { brand: 'var(--color-brand)', gold: 'var(--color-gold-accent)', ok: 'var(--color-ok)', red: 'var(--color-red-brand)' }

const PANELS: Record<ToolId, (tr: boolean) => ReactNode> = {
  review: () => (
    <div>
      <div className="flex items-start justify-between">
        <div className="font-mono text-[10px] uppercase tracking-wide text-ink-subtle">PSB-2025-0142 · BIOMEDICAL</div>
        <div className="text-right"><span className="font-display text-[28px] font-bold leading-none text-brand">87</span><span className="font-mono text-[10px] text-ink-subtle">/100</span></div>
      </div>
      <div className="mt-4 space-y-2.5">
        <Bar label="Originality" val="9.1" w="91%" color={C.brand} />
        <Bar label="Methodology" val="8.8" w="88%" color={C.brand} />
        <Bar label="Literature" val="7.9" w="79%" color={C.gold} />
        <Bar label="Ethics" val="9.6" w="96%" color={C.ok} />
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-[8px] border border-brand/20 bg-brand/5 px-3 py-2">
        <span className="h-7 w-1 rounded-full bg-brand" />
        <span className="text-[12.5px] font-semibold text-ink">Accept After Minor Revision</span>
      </div>
    </div>
  ),
  editorial: (tr) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-[8px] bg-bg2/60 px-3 py-2">
        <span className="text-[12px] text-ink-muted">{tr ? 'Kapsam uyumu' : 'Scope fit'}</span>
        <span className="rounded-full bg-ok/10 px-2 py-0.5 text-[11px] font-semibold text-ok">{tr ? 'Uyumlu' : 'Compatible'}</span>
      </div>
      {[['Author contributions', true], ['Conflict of interest', true], ['Data availability', false]].map(([k, ok]) => (
        <div key={k as string} className="flex items-center gap-2 text-[12.5px] text-ink-muted">
          <span className={`font-mono text-[12px] font-bold ${ok ? 'text-ok' : 'text-gold-accent'}`}>{ok ? '✓' : '!'}</span> {k}
        </div>
      ))}
      <div className="flex items-center gap-2 rounded-[8px] border border-brand/20 bg-brand/5 px-3 py-2">
        <span className="h-7 w-1 rounded-full bg-brand" />
        <span className="text-[12.5px] font-semibold text-ink">{tr ? 'Hakemlere gönder' : 'Send to reviewers'}</span>
      </div>
    </div>
  ),
  response: (tr) => (
    <div className="space-y-3">
      <div className="rounded-[8px] bg-bg2/60 px-3 py-2">
        <div className="font-mono text-[9.5px] uppercase tracking-wide text-ink-subtle">{tr ? 'Hakem 2 · Yorum' : 'Reviewer 2 · Comment'}</div>
        <div className="mt-1 text-[12px] italic text-ink-muted">"The randomization procedure is not clearly described."</div>
      </div>
      <div className="rounded-[8px] border border-ok/25 bg-ok/5 px-3 py-2">
        <div className="font-mono text-[9.5px] uppercase tracking-wide text-ok">{tr ? 'Önerilen yanıt' : 'Suggested response'}</div>
        <div className="mt-1 text-[12px] text-ink">{tr ? 'Teşekkür ederiz. Randomizasyon prosedürü Yöntem 2.3’te (s. 6) blok randomizasyonu olarak detaylandırılmıştır…' : 'We thank the reviewer. The randomization is now detailed as block randomization in Methods 2.3 (p. 6)…'}</div>
      </div>
    </div>
  ),
  checklist: (tr) => (
    <div>
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-brand/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-brand">CONSORT 2010</span>
        <span className="text-[11px] text-ink-subtle">RCT · 25 {tr ? 'madde' : 'items'}</span>
      </div>
      <div className="mt-4 space-y-2">
        {[['Trial design', 'ok'], ['Sample size', 'ok'], ['Randomization', 'warn'], ['Blinding', 'fail']].map(([k, st]) => (
          <div key={k} className="flex items-center gap-2 text-[12.5px] text-ink-muted">
            <span className={`font-mono text-[12px] font-bold ${st === 'ok' ? 'text-ok' : st === 'warn' ? 'text-gold-accent' : 'text-red-brand'}`}>{st === 'ok' ? '✓' : st === 'warn' ? '!' : '✕'}</span> {k}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-[8px] bg-bg2/60 px-3 py-2 text-[12px]">
        <span className="text-ink-muted">{tr ? 'Sonuç' : 'Verdict'}</span>
        <span className="font-semibold text-gold-accent">{tr ? 'Önce düzelt' : 'Fix first'}</span>
      </div>
    </div>
  ),
}
