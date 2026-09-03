import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import { useT } from '@/i18n/utils'

const REVIEWS: { qKey: string; nKey: string; rKey: string }[] = [
  { qKey: 'tm.q1', nKey: 'tm.n1', rKey: 'tm.r1' },
  { qKey: 'tm.q2', nKey: 'tm.n2', rKey: 'tm.r2' },
  { qKey: 'tm.q3', nKey: 'tm.n3', rKey: 'tm.r3' },
]

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Testimonials() {
  const { t } = useT()

  return (
    <section className="bg-app-bg py-20 md:py-28" id="testimonials">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.div
          variants={reveal}
          custom={0}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-accent">
            <span className="h-px w-6 bg-gold-accent" /> {t('tm.ey')} <span className="h-px w-6 bg-gold-accent" />
          </div>
          <h2
            className="font-display mx-auto mt-4 max-w-2xl text-[clamp(28px,4vw,46px)] font-bold leading-[1.06] tracking-[-0.02em] text-ink [&_em]:not-italic [&_em]:text-gold-accent"
            dangerouslySetInnerHTML={{ __html: t('tm.h') }}
          />
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {REVIEWS.map((r, i) => {
            const name = t(r.nKey)
            return (
              <motion.div
                key={r.qKey}
                variants={reveal}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                className="flex flex-col rounded-[14px] border border-app-border bg-app-card p-6 shadow-card transition-transform duration-200 hover:-translate-y-1"
              >
                <Quote size={26} className="text-gold-accent" aria-hidden />

                <p className="mt-4 flex-1 text-[15px] leading-relaxed text-ink">{t(r.qKey)}</p>

                <div className="mt-6 flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-[13px] font-bold text-white">
                    {initials(name)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-ink">{name}</div>
                    <div className="text-[12px] text-ink-subtle">{t(r.rKey)}</div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
