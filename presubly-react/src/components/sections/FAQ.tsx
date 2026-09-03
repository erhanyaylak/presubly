import { motion } from 'framer-motion'
import { useT } from '@/i18n/utils'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'

const ITEMS = ['1', '2', '3', '4', '5']

export default function FAQ() {
  const { t } = useT()
  return (
    <section id="faq" className="border-b border-app-border bg-bg2/50 py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-accent">
            <span className="h-px w-6 bg-gold-accent" /> {t('faq.ey')}
          </div>
          <h2
            className="font-display mt-4 text-[clamp(28px,4vw,46px)] font-bold leading-[1.06] tracking-[-0.02em] text-ink [&_em]:not-italic [&_em]:text-gold-accent"
            dangerouslySetInnerHTML={{ __html: t('faq.h') }}
          />
          <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-ink-muted">{t('faq.sub')}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Accordion type="single" collapsible defaultValue="item-1" className="rounded-[12px] border border-app-border bg-app-card px-5">
            {ITEMS.map((n) => (
              <AccordionItem key={n} value={`item-${n}`}>
                <AccordionTrigger>{t(`faq.q${n}`)}</AccordionTrigger>
                <AccordionContent>{t(`faq.a${n}`)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
