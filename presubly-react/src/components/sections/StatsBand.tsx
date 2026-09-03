import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useT } from '@/i18n/utils'

const STATS: { count: number; suffix: string; key: string }[] = [
  { count: 80, suffix: 'K+', key: 'stat.l1' },
  { count: 70, suffix: '%', key: 'stat.l2' },
  { count: 13, suffix: '', key: 'stat.l3' },
  { count: 4, suffix: '', key: 'stat.l4' },
]

function Counter({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) => Math.round(v).toString() + suffix)

  useEffect(() => {
    if (inView) {
      const controls = animate(motionValue, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1] })
      return controls.stop
    }
  }, [inView, motionValue, to])

  return (
    <motion.div
      ref={ref}
      className="font-display text-[clamp(32px,5vw,52px)] font-bold leading-none tracking-[-0.02em] text-brand"
    >
      {rounded}
    </motion.div>
  )
}

export default function StatsBand() {
  const { t } = useT()

  return (
    <section className="border-b border-app-border bg-app-bg py-14 md:py-16">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center rounded-[14px] border border-app-border bg-app-card px-5 py-7 text-center shadow-card transition-transform duration-200 hover:-translate-y-1"
            >
              <Counter to={s.count} suffix={s.suffix} />
              <div className="mt-3 text-[13.5px] font-medium leading-snug text-ink-muted">
                {t(s.key)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
