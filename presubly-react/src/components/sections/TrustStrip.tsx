import { useT } from '@/i18n/utils'

const STANDARDS = ['COPE', 'ICMJE', 'CONSORT', 'STROBE', 'PRISMA', 'COREQ']

export default function TrustStrip() {
  const { t } = useT()
  return (
    <section className="border-b border-app-border bg-app-bg py-8 md:py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-5 md:flex-row md:gap-8 md:px-8">
        <span className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">
          {t('trust.cap')}
        </span>
        <div className="flex flex-1 flex-wrap items-center justify-center gap-x-7 gap-y-3 md:justify-between">
          {STANDARDS.map((s) => (
            <span
              key={s}
              className="font-display text-[17px] font-bold tracking-tight text-ink-muted/70 transition-colors hover:text-gold-accent"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
