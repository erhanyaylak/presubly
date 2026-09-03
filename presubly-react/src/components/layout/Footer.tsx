import { ShieldCheck, Trash2 } from 'lucide-react'
import { useT } from '@/i18n/utils'

export default function Footer() {
  const { t, locale } = useT()
  const brandStoryLink = locale === 'tr' ? '/tr/marka-hikayesi' : '/en/brand-story'
  const brandStoryLabel = locale === 'tr' ? 'Marka Hikayesi' : 'Brand Story'

  const columns: { head: string; links: [string, string][] }[] = [
    { head: t('ft.c1'), links: [['#how', t('ft.c1a')], ['#standards', t('ft.c1b')], ['#pricing', t('ft.c1c')], ['#pricing', 'API']] },
    { head: t('ft.c2'), links: [['#how', t('ft.c2a')], ['#standards', t('ft.c2b')], [brandStoryLink, brandStoryLabel], ['mailto:hello@presubly.com', t('ft.c2c')]] },
    { head: t('ft.c3'), links: [['#', t('ft.c3a')], ['mailto:hello@presubly.com', t('ft.c3b')], ['#', t('ft.c3c')], ['#', t('ft.c3d')]] },
  ]

  return (
    <footer className="border-t border-app-border bg-app-card">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid gap-12 py-16 md:grid-cols-12 md:py-20">
          <div className="md:col-span-5 lg:col-span-4">
            <a href="/" className="inline-flex items-center">
              <span className="font-display text-[20px] font-bold tracking-tight text-ink">
                Pre<span className="text-gold-accent">subly</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-ink-muted">{t('ft.desc')}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['EthicsKit', 'MisanpAIge', 'JournalKit', 'CVita'].map((b) => (
                <span key={b} className="rounded-full border border-app-border bg-bg2 px-2.5 py-1 text-[11px] font-medium text-ink-muted">{b}</span>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.head} className="md:col-span-2 lg:col-span-2 xl:col-span-2">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">{col.head}</div>
              <div className="mt-4 flex flex-col gap-2.5">
                {col.links.map(([href, label], i) => (
                  <a key={`${href}-${i}`} href={href} className="text-[13.5px] text-ink-muted transition-colors hover:text-brand">{label}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-app-border py-6 sm:flex-row">
          <div className="text-[12px] text-ink-subtle" dangerouslySetInnerHTML={{ __html: t('ft.copy') }} />
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-bg2 px-2.5 py-1 text-[11px] font-medium text-ink-muted"><Trash2 size={12} /> {t('ft.b1')}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-bg2 px-2.5 py-1 text-[11px] font-medium text-ink-muted"><ShieldCheck size={12} /> {t('ft.b2')}</span>
            <span className="rounded-full bg-bg2 px-2.5 py-1 text-[11px] font-medium text-ink-muted">Anthropic DPA</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
