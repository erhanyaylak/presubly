import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { useT } from '@/i18n/utils'

const ROWS = ['cmp.r1', 'cmp.r2', 'cmp.r3', 'cmp.r4', 'cmp.r5']

export default function Comparison() {
  const { t } = useT()
  return (
    <section className="border-b border-app-border bg-bg2/50 py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-5 text-center md:px-8">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-accent">
          <span className="h-px w-6 bg-gold-accent" /> {t('cmp.ey')} <span className="h-px w-6 bg-gold-accent" />
        </div>
        <h2
          className="font-display mx-auto mt-4 max-w-2xl text-[clamp(28px,4vw,46px)] font-bold leading-[1.06] tracking-[-0.02em] text-ink [&_em]:not-italic [&_em]:text-gold-accent"
          dangerouslySetInnerHTML={{ __html: t('cmp.h') }}
        />
        <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-ink-muted">{t('cmp.sub')}</p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-[16px] border border-app-border bg-app-card text-left shadow-card"
        >
          {/* header */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-app-border bg-bg2/40 px-5 py-3.5 sm:gap-6 sm:px-7">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-subtle">{/* feature col */}</span>
            <span className="w-20 text-center text-[12.5px] font-bold text-brand sm:w-28">{t('cmp.col1')}</span>
            <span className="w-20 text-center text-[11.5px] font-medium text-ink-subtle sm:w-28">{t('cmp.col2')}</span>
          </div>
          {ROWS.map((r, i) => (
            <div key={r} className={`grid grid-cols-[1fr_auto_auto] items-center gap-3 px-5 py-4 sm:gap-6 sm:px-7 ${i < ROWS.length - 1 ? 'border-b border-app-border' : ''}`}>
              <span className="text-[13.5px] text-ink">{t(r)}</span>
              <span className="flex w-20 justify-center sm:w-28">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-ok/10 text-ok"><Check size={15} /></span>
              </span>
              <span className="flex w-20 justify-center sm:w-28">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-bg3 text-ink-subtle"><X size={15} /></span>
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
