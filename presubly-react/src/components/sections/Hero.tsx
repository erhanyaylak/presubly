import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { ArrowRight, Play } from 'lucide-react'
import { useT } from '@/i18n/utils'
import { openApp } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] as const } }),
}

const CRITERIA: [string, string, string, string][] = [
  ['mock.b1', 'var(--color-brand)', '9.1', '91%'],
  ['mock.b2', 'var(--color-brand)', '8.8', '88%'],
  ['mock.b3', 'var(--color-gold-accent)', '7.9', '79%'],
  ['mock.b4', 'var(--color-gold-accent)', '7.4', '74%'],
  ['mock.b5', 'var(--color-ok)', '9.6', '96%'],
]

const AVATARS = [
  { i: 'AK', bg: 'var(--color-brand)' },
  { i: 'MY', bg: 'var(--color-gold-accent)' },
  { i: 'SÇ', bg: 'var(--color-brand-light)' },
]

export default function Hero() {
  const { t } = useT()

  useEffect(() => {
    const timers = CRITERIA.map(([, , , w], i) =>
      window.setTimeout(() => {
        const el = document.getElementById(`rb${i + 1}`)
        if (el) el.style.width = w
      }, 600 + i * 130),
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <section className="relative overflow-hidden border-b border-app-border bg-app-bg">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--color-ink) 1px, transparent 0)', backgroundSize: '28px 28px' }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-5 pt-16 text-center md:px-8 md:pt-24">
        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show"
          className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-card px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-accent shadow-card">
          Presubly · AI Pre-Submission Review
        </motion.div>

        <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="show"
          className="font-display mx-auto mt-6 max-w-2xl text-[clamp(38px,6vw,64px)] font-bold leading-[1.04] tracking-[-0.03em] text-ink [&_em]:not-italic [&_em]:text-gold-accent"
          dangerouslySetInnerHTML={{ __html: t('hero.h1') }} />

        <motion.p variants={fadeUp} custom={2} initial="hidden" animate="show"
          className="mx-auto mt-6 max-w-xl text-[16.5px] leading-relaxed text-ink-muted">
          {t('hero.p')}
        </motion.p>

        <motion.div variants={fadeUp} custom={3} initial="hidden" animate="show" className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => openApp('home')}>
            {t('hero.btn1')} <ArrowRight size={17} />
          </Button>
          <Button size="lg" variant="outline" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
            <Play size={15} /> {t('hero.btn2')}
          </Button>
        </motion.div>

        <motion.div variants={fadeUp} custom={4} initial="hidden" animate="show" className="mt-8 flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {AVATARS.map((a) => (
              <span key={a.i} className="grid h-8 w-8 place-items-center rounded-full border-2 border-app-bg text-[11px] font-bold text-white" style={{ background: a.bg }}>{a.i}</span>
            ))}
          </div>
          <span className="text-[13px] font-medium text-ink-muted">{t('hero.social')}</span>
        </motion.div>
      </div>

      {/* Product mockup */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto mt-14 max-w-xl px-5 pb-16 md:pb-24"
      >
        <div className="overflow-hidden rounded-[16px] border border-app-border bg-app-card shadow-card-lg">
          <div className="flex items-center gap-3 border-b border-app-border bg-bg2/60 px-4 py-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-brand/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-gold-accent/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-ok/60" />
            </div>
            <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">{t('mock.title')}</div>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-wide text-ink-subtle">{t('mock.id')}</div>
                <div className="mt-1 text-[13.5px] font-semibold leading-snug text-ink">{t('mock.paper')}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-display text-[34px] font-bold leading-none text-brand">87</div>
                <div className="font-mono text-[10px] text-ink-subtle">/100</div>
              </div>
            </div>
            <div className="mt-5 space-y-2.5">
              {CRITERIA.map(([key, color, val], i) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-24 shrink-0 text-[12px] text-ink-muted">{t(key)}</div>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg2">
                    <div id={`rb${i + 1}`} className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: 0, background: color }} />
                  </div>
                  <div className="w-7 shrink-0 text-right font-mono text-[11.5px] font-semibold" style={{ color }}>{val}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-[10px] border border-brand/20 bg-brand/5 px-4 py-3">
              <div className="h-8 w-1 rounded-full bg-brand" />
              <div>
                <div className="text-[13px] font-semibold text-ink">{t('mock.dec')}</div>
                <div className="font-mono text-[10.5px] text-ink-subtle">{t('mock.decsub')}</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
