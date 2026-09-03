import { motion } from 'framer-motion'
import { Check, Minus } from 'lucide-react'
import { useT } from '@/i18n/utils'
import { openAuth } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

function Feature({ label, excluded = false }: { label: string; excluded?: boolean }) {
  return (
    <li className="flex items-start gap-2.5 text-[13.5px] leading-snug">
      {excluded ? (
        <Minus size={16} className="mt-px shrink-0 text-ink-subtle" />
      ) : (
        <Check size={16} className="mt-px shrink-0 text-brand" />
      )}
      <span className={excluded ? 'text-ink-subtle line-through' : 'text-ink-muted'}>{label}</span>
    </li>
  )
}

export default function Pricing() {
  const { t, locale } = useT()
  const perMonth = locale === 'tr' ? '/ay' : '/mo'

  return (
    <section className="border-t border-app-border bg-app-bg py-20 md:py-28" id="pricing">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* Centered header */}
        <motion.div
          variants={reveal}
          custom={0}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-accent">
            <span className="h-px w-6 bg-gold-accent" /> {t('pr.ey')} <span className="h-px w-6 bg-gold-accent" />
          </div>
          <h2
            className="font-display mx-auto mt-4 max-w-2xl text-[clamp(28px,4vw,46px)] font-bold leading-[1.06] tracking-[-0.02em] text-ink [&_em]:not-italic [&_em]:text-gold-accent"
            dangerouslySetInnerHTML={{ __html: t('pr.h') }}
          />
          <p className="mx-auto mt-4 max-w-2xl text-[15.5px] leading-relaxed text-ink-muted">{t('pr.sub')}</p>
        </motion.div>

        {/* Pricing grid: 1 / 2 / 4 */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Free */}
          <motion.div
            variants={reveal}
            custom={1}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            <Card className="flex h-full flex-col p-6 transition-transform duration-200 hover:-translate-y-1">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                {t('pr.p1n')}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-[40px] font-bold leading-none tracking-[-0.02em] text-ink">$0</span>
              </div>
              <p className="mt-2 text-[13px] text-ink-muted">{t('pr.p1note')}</p>
              <div className="my-5 h-px w-full bg-app-border" />
              <ul className="flex flex-1 flex-col gap-3">
                {['pr.p1f1', 'pr.p1f2', 'pr.p1f3'].map((k) => (
                  <Feature key={k} label={t(k)} />
                ))}
                {['pr.p1f4', 'pr.p1f5'].map((k) => (
                  <Feature key={k} label={t(k)} excluded />
                ))}
              </ul>
              <Button variant="outline" size="lg" className="mt-6 w-full" onClick={() => openAuth('register')}>
                {t('pr.p1btn')}
              </Button>
            </Card>
          </motion.div>

          {/* Academic (Most Popular) */}
          <motion.div
            variants={reveal}
            custom={2}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            <Card className="relative flex h-full flex-col border-brand p-6 shadow-card-lg transition-transform duration-200 lg:scale-[1.03]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="brand" size="md">
                  {t('pr.pop')}
                </Badge>
              </div>
              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
                {t('pr.p2n')}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-[40px] font-bold leading-none tracking-[-0.02em] text-ink">$15</span>
                <span className="text-[14px] font-medium text-ink-subtle">{perMonth}</span>
              </div>
              <p className="mt-2 text-[13px] text-ink-muted">{t('pr.p2note')}</p>
              <div className="my-5 h-px w-full bg-app-border" />
              <ul className="flex flex-1 flex-col gap-3">
                {['pr.p2f1', 'pr.p2f2', 'pr.p2f3', 'pr.p2f4', 'pr.p2f5'].map((k) => (
                  <Feature key={k} label={t(k)} />
                ))}
              </ul>
              <Button
                variant="primary"
                size="lg"
                className="mt-6 w-full"
                onClick={() => openAuth('register')}
                dangerouslySetInnerHTML={{ __html: t('pr.p2btn') }}
              />
            </Card>
          </motion.div>

          {/* Pro */}
          <motion.div
            variants={reveal}
            custom={3}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            <Card className="flex h-full flex-col p-6 transition-transform duration-200 hover:-translate-y-1">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Pro</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-[40px] font-bold leading-none tracking-[-0.02em] text-ink">$35</span>
                <span className="text-[14px] font-medium text-ink-subtle">{perMonth}</span>
              </div>
              <p className="mt-2 text-[13px] text-ink-muted">{t('pr.p3note')}</p>
              <div className="my-5 h-px w-full bg-app-border" />
              <ul className="flex flex-1 flex-col gap-3">
                {['pr.p3f1', 'pr.p3f2', 'pr.p3f3', 'pr.p3f4', 'pr.p3f5'].map((k) => (
                  <Feature key={k} label={t(k)} />
                ))}
              </ul>
              <Button variant="outline" size="lg" className="mt-6 w-full" onClick={() => openAuth('register')}>
                {t('pr.p3btn')}
              </Button>
            </Card>
          </motion.div>

          {/* Enterprise */}
          <motion.div
            variants={reveal}
            custom={4}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            <Card className="flex h-full flex-col border-gold-accent/30 p-6 transition-transform duration-200 hover:-translate-y-1">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-accent">
                {t('pr.p4n')}
              </div>
              <div className="mt-3 flex items-baseline">
                <span
                  className="font-display text-[22px] font-bold leading-[1.3] tracking-[-0.01em] text-gold-accent"
                  dangerouslySetInnerHTML={{ __html: t('pr.p4price') }}
                />
              </div>
              <p className="mt-2 text-[13px] text-ink-muted">{t('pr.p4note')}</p>
              <div className="my-5 h-px w-full bg-app-border" />
              <ul className="flex flex-1 flex-col gap-3">
                {['pr.p4f1', 'pr.p4f2', 'pr.p4f3', 'pr.p4f4'].map((k) => (
                  <Feature key={k} label={t(k)} />
                ))}
              </ul>
              <Button variant="outline" size="lg" className="mt-6 w-full" asChild>
                <a href="mailto:hello@presubly.com">{t('pr.p4btn')}</a>
              </Button>
            </Card>
          </motion.div>
        </div>

        {/* Trust row */}
        <motion.div
          variants={reveal}
          custom={5}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
        >
          {['pr.tr1', 'pr.tr2', 'pr.tr3', 'pr.tr4'].map((k) => (
            <span key={k} className="inline-flex items-center gap-2 text-[13px] text-ink-muted">
              <Check size={15} className="text-brand" /> {t(k)}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
