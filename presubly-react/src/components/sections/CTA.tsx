import { motion } from 'framer-motion'
import { ArrowRight, Check, ShieldCheck } from 'lucide-react'
import { useT } from '@/i18n/utils'
import { openApp } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function CTA() {
  const { t } = useT()

  return (
    <section className="bg-app-bg px-5 py-20 md:px-8 md:py-28">
      <motion.div
        variants={reveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        className="mx-auto max-w-5xl rounded-[20px] border border-white/10 bg-brand-dark px-8 py-16 text-center"
      >
        <div className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-accent">
          <span className="h-px w-6 bg-gold-accent" /> {t('cta.tag')} <span className="h-px w-6 bg-gold-accent" />
        </div>

        <h2
          className="font-display mx-auto mt-5 max-w-3xl text-[clamp(28px,4vw,46px)] font-bold leading-[1.06] tracking-[-0.02em] text-white [&_em]:not-italic [&_em]:text-gold-accent"
          dangerouslySetInnerHTML={{ __html: t('cta.h') }}
        />

        <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-white/70">{t('cta.sub')}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" className="bg-app-card text-brand hover:bg-white" onClick={() => openApp('home')}>
            {t('cta.btn1')} <ArrowRight size={17} />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
            onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t('cta.btn2')}
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-white/60">
          <span className="inline-flex items-center gap-1.5">
            <Check size={15} className="text-gold-accent" /> {t('cta.tr1')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-gold-accent" /> {t('cta.tr2')}
          </span>
        </div>
      </motion.div>
    </section>
  )
}
