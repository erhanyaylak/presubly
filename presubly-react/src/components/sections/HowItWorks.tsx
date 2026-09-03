import { motion } from 'framer-motion'
import { Upload, ScanSearch, FileCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useT } from '@/i18n/utils'

const STEPS: { num: string; hKey: string; dKey: string; Icon: LucideIcon }[] = [
  { num: '01', hKey: 'how.s1h', dKey: 'how.s1d', Icon: Upload },
  { num: '02', hKey: 'how.s2h', dKey: 'how.s2d', Icon: ScanSearch },
  { num: '03', hKey: 'how.s3h', dKey: 'how.s3d', Icon: FileCheck },
]

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export default function HowItWorks() {
  const { t } = useT()

  return (
    <section id="how" className="border-b border-app-border bg-app-bg py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <motion.div
          variants={reveal}
          custom={0}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-accent">
            <span className="h-px w-6 bg-gold-accent" /> {t('how.ey')} <span className="h-px w-6 bg-gold-accent" />
          </div>
          <h2
            className="font-display mx-auto mt-4 max-w-2xl text-[clamp(28px,4vw,46px)] font-bold leading-[1.06] tracking-[-0.02em] text-ink [&_em]:not-italic [&_em]:text-gold-accent"
            dangerouslySetInnerHTML={{ __html: t('how.h') }}
          />
          <p className="mx-auto mt-4 max-w-2xl text-[15.5px] leading-relaxed text-ink-muted">
            {t('how.sub')}
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => {
            const { Icon } = s
            return (
              <motion.div
                key={s.num}
                variants={reveal}
                custom={i + 1}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                className="group rounded-[14px] border border-app-border bg-app-card p-7 shadow-card transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-[44px] font-bold leading-none tracking-[-0.03em] text-ink-subtle/40">
                    {s.num}
                  </span>
                  <span className="grid h-11 w-11 place-items-center rounded-[10px] border border-brand/20 bg-brand/10 text-brand">
                    <Icon size={20} strokeWidth={1.9} />
                  </span>
                </div>
                <h3 className="mt-5 text-[18px] font-bold leading-snug text-ink">{t(s.hKey)}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-muted">{t(s.dKey)}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
