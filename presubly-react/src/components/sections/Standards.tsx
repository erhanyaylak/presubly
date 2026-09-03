import { motion } from 'framer-motion'
import { useT } from '@/i18n/utils'

const CARDS: { ab: string; nm?: string; nmKey?: string; dKey: string; dotKey: string }[] = [
  { ab: 'COPE', nm: 'Committee on Publication Ethics', dKey: 'std.c1d', dotKey: 'std.c1dot' },
  { ab: 'ICMJE', nm: 'International Committee of Medical Journal Editors', dKey: 'std.c2d', dotKey: 'std.c2dot' },
  { ab: 'CONSORT', nm: 'Consolidated Standards of Reporting Trials', dKey: 'std.c3d', dotKey: 'std.c3dot' },
  { ab: 'STROBE', nm: 'Strengthening the Reporting of Observational Studies', dKey: 'std.c4d', dotKey: 'std.c4dot' },
  { ab: 'PRISMA', nm: 'Preferred Reporting Items for Systematic Reviews', dKey: 'std.c5d', dotKey: 'std.c5dot' },
  { ab: 'COREQ / ARRIVE', nmKey: 'std.c6n', dKey: 'std.c6d', dotKey: 'std.c6dot' },
]

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export default function Standards() {
  const { t } = useT()

  return (
    <section id="standards" className="bg-app-bg py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* Centered header */}
        <motion.div
          variants={reveal}
          custom={0}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-accent">
            <span className="h-px w-6 bg-gold-accent" /> {t('std.ey')} <span className="h-px w-6 bg-gold-accent" />
          </div>
          <h2
            className="font-display mx-auto mt-4 max-w-2xl text-[clamp(28px,4vw,46px)] font-bold leading-[1.06] tracking-[-0.02em] text-ink [&_em]:not-italic [&_em]:text-gold-accent"
            dangerouslySetInnerHTML={{ __html: t('std.h') }}
          />
          <p className="mx-auto mt-4 max-w-2xl text-[15.5px] leading-relaxed text-ink-muted">{t('std.sub')}</p>
        </motion.div>

        {/* 6-card grid */}
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c, i) => (
            <motion.div
              key={c.ab}
              variants={reveal}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              className="group rounded-[14px] border border-app-border bg-app-card p-6 shadow-card transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-display text-[19px] font-bold leading-tight tracking-[-0.01em] text-ink">
                  {c.nmKey ? t(c.nmKey) : c.ab}
                </div>
                <span className="shrink-0 rounded-[6px] border border-brand/20 bg-brand/10 px-2 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand">
                  {c.ab}
                </span>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">{t(c.dKey)}</p>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-subtle">{t(c.dotKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
