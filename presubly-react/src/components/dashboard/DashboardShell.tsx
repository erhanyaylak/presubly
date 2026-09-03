import { type ReactNode, useEffect, useState } from 'react'
import { useStore } from '@nanostores/react'
import { AnimatePresence, motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Menu, X, Moon, Sun, Zap, ArrowLeft } from 'lucide-react'
import { useT } from '@/i18n/utils'
import { $credits } from '@/stores/auth-store'
import { $creditsModal, closeApp } from '@/stores/ui-store'
import { langStore, toggleLocale } from '@/stores/lang-store'
import { $theme, toggleTheme } from '@/stores/theme-store'

export interface DashSection {
  id: string
  label: string
  icon: LucideIcon
  badge?: number | string
  group?: string
}

interface Props {
  title: string
  subtitle?: string
  sections: DashSection[]
  active: string
  onSelect: (id: string) => void
  identity?: ReactNode
  children: ReactNode
}

export default function DashboardShell({ title, subtitle, sections, active, onSelect, identity, children }: Props) {
  const { locale } = useT()
  const tr = locale === 'tr'
  const credits = useStore($credits)
  const lang = useStore(langStore)
  const theme = useStore($theme)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [active])

  // Group sections preserving order
  const groups: { name: string | null; items: DashSection[] }[] = []
  for (const s of sections) {
    const g = s.group ?? null
    const last = groups[groups.length - 1]
    if (last && last.name === g) last.items.push(s)
    else groups.push({ name: g, items: [s] })
  }

  const activeSection = sections.find((s) => s.id === active) ?? sections[0]
  const ActiveIcon = activeSection?.icon

  const SidebarBody = (
    <>
      <div className="px-2 py-1">
        <div className="font-display text-[15px] font-bold text-ink">
          Pre<span className="text-gold-accent">subly</span>
        </div>
        <div className="text-[12px] font-semibold text-ink-subtle">{title}</div>
        {subtitle && <div className="mt-0.5 text-[11.5px] leading-snug text-ink-muted">{subtitle}</div>}
      </div>

      {identity}

      <nav className="flex flex-col gap-0.5">
        {groups.map((g, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-3 border-t border-app-border/70 pt-3' : ''}>
            {g.name && <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-subtle">{g.name}</div>}
            {g.items.map((s) => {
              const on = s.id === active
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  className={`group relative flex items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-[13px] font-semibold transition-colors ${
                    on ? 'bg-brand/10 text-brand' : 'text-ink-muted hover:bg-bg2 hover:text-ink'
                  }`}
                >
                  {on && <motion.span layoutId="psb-rail" className="absolute left-0 h-5 w-0.5 rounded-r bg-brand" transition={{ type: 'spring', stiffness: 350, damping: 28 }} />}
                  <Icon size={15} strokeWidth={1.75} />
                  <span className="flex-1 truncate">{s.label}</span>
                  {s.badge != null && s.badge !== 0 && s.badge !== '' && (
                    <span className={`grid h-[18px] min-w-[20px] place-items-center rounded-full px-1 text-[10px] font-semibold ${on ? 'bg-brand text-white' : 'bg-bg3 text-ink-subtle'}`}>{s.badge}</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer chrome — quiet, not in the top bar */}
      <div className="mt-auto flex flex-col gap-2 border-t border-app-border pt-3">
        <button onClick={() => $creditsModal.set(true)}
          className={`flex items-center justify-between rounded-[6px] border px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${credits > 2 ? 'border-brand/25 bg-brand/8 text-brand' : 'border-red-brand/30 bg-red-brand/8 text-red-brand'}`}>
          <span className="inline-flex items-center gap-1.5"><Zap size={13} /> {credits} {tr ? 'kredi' : 'credits'}</span>
          <span className="text-[11px] opacity-70">{tr ? 'Al' : 'Buy'}</span>
        </button>
        <div className="flex items-center gap-1.5">
          <button onClick={toggleTheme} className="grid h-8 flex-1 place-items-center rounded-[6px] border border-app-border text-ink-muted hover:bg-bg2" aria-label="Theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button onClick={toggleLocale} className="h-8 flex-1 rounded-[6px] border border-app-border text-[12px] font-semibold text-ink-muted hover:bg-bg2">
            {lang === 'tr' ? 'EN' : 'TR'}
          </button>
          <button onClick={closeApp} className="grid h-8 flex-1 place-items-center rounded-[6px] border border-app-border text-ink-muted hover:bg-bg2" aria-label={tr ? 'Siteye dön' : 'Back to site'}>
            <ArrowLeft size={15} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 md:px-6 md:py-6">
      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        {/* Desktop sidebar */}
        <aside className="sticky top-4 hidden max-h-[calc(100vh-2rem)] flex-col gap-2 self-start overflow-y-auto pb-2 lg:flex custom-scrollbar">
          {SidebarBody}
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
              <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-2 overflow-y-auto border-r border-app-border bg-app-bg p-4 lg:hidden custom-scrollbar">
                <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-[6px] text-ink-muted hover:bg-bg2" aria-label="Close"><X size={16} /></button>
                {SidebarBody}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="sticky top-0 z-10 -mx-3 flex items-center gap-3 border-b border-app-border bg-app-bg/85 px-3 py-3 backdrop-blur-md md:-mx-6 md:px-6">
            <button onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-[6px] bg-bg2 text-ink hover:bg-bg3 lg:hidden" aria-label="Menu"><Menu size={16} /></button>
            <div className="flex min-w-0 items-center gap-2.5">
              {ActiveIcon && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] bg-brand/10 text-brand"><ActiveIcon size={15} strokeWidth={1.75} /></div>
              )}
              <div className="min-w-0">
                <div className="truncate text-[11.5px] font-semibold text-ink-subtle">{title}</div>
                <div className="truncate text-[14px] font-semibold text-ink">{activeSection?.label}</div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }} className="min-w-0">
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
