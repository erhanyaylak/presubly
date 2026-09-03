import { useEffect, useState } from 'react'
import { useStore } from '@nanostores/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, Zap, User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useT } from '@/i18n/utils'
import { langStore, setLocale } from '@/stores/lang-store'
import { $isLoggedIn, $credits, $displayName, $initials, $isAdmin } from '@/stores/auth-store'
import { openAuth, openApp, closeApp, $creditsModal } from '@/stores/ui-store'
import { logout } from '@/lib/auth'
import { Button } from '@/components/ui/button'

type NavLink = { key: string; href?: string; action?: 'app' }
const LINKS: NavLink[] = [
  { href: '#how', key: 'nav.how' },
  { action: 'app', key: 'nav.tools' },
  { href: '#standards', key: 'nav.standards' },
  { href: '#pricing', key: 'nav.pricing' },
  { href: '#faq', key: 'nav.faq' },
]
const SPY_IDS = ['how', 'standards', 'pricing', 'faq']

export default function Nav() {
  const { t } = useT()
  const lang = useStore(langStore)
  const loggedIn = useStore($isLoggedIn)
  const credits = useStore($credits)
  const displayName = useStore($displayName)
  const initials = useStore($initials)
  const isAdmin = useStore($isAdmin)

  const [scrolled, setScrolled] = useState(false)
  const [profOpen, setProfOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const els = SPY_IDS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    if (!els.length) return
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActiveSection(visible[0].target.id)
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5] },
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.prof-wrap')) setProfOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  function goHome(e: React.MouseEvent) {
    e.preventDefault()
    setMobileOpen(false)
    if ($isLoggedIn.get() && window.location.hash.startsWith('#/')) closeApp()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (window.location.hash) history.pushState(null, '', window.location.pathname)
  }

  return (
    <header className={`sticky top-0 z-40 transition-colors ${scrolled ? 'border-b border-app-border bg-app-bg/85 backdrop-blur' : 'border-b border-transparent bg-app-bg'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 md:px-8">
        <a href="/" onClick={goHome} className="flex items-center">
          <span className="font-display text-[20px] font-bold tracking-tight text-ink">
            Pre<span className="text-gold-accent">subly</span>
          </span>
        </a>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const isActive = !!l.href && activeSection === l.href.slice(1)
            const cls = `rounded-[8px] px-3 py-2 text-[13.5px] font-medium transition-colors ${isActive ? 'bg-brand/10 text-brand' : 'text-ink-muted hover:bg-bg2 hover:text-ink'}`
            return l.action === 'app' ? (
              <button key={l.key} onClick={() => openApp('home')} className={cls}>{t(l.key)}</button>
            ) : (
              <a key={l.key} href={l.href} className={cls}>{t(l.key)}</a>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center rounded-[8px] border border-app-border p-0.5 sm:flex">
            {(['tr', 'en'] as const).map((l) => (
              <button key={l} onClick={() => setLocale(l)}
                className={`rounded-[6px] px-2 py-1 text-[11px] font-semibold uppercase transition-colors ${lang === l ? 'bg-brand text-white' : 'text-ink-subtle hover:text-ink'}`}>
                {l}
              </button>
            ))}
          </div>

          {loggedIn ? (
            <>
              <button onClick={() => $creditsModal.set(true)}
                className={`hidden items-center gap-1 rounded-[8px] border px-2.5 py-1.5 text-[12px] font-semibold transition-colors sm:flex ${credits > 2 ? 'border-brand/25 bg-brand/8 text-brand' : 'border-red-brand/30 bg-red-brand/8 text-red-brand'}`}>
                <Zap size={13} /> {credits}
              </button>
              <div className="prof-wrap relative">
                <button onClick={() => setProfOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-[8px] py-1 pl-1 pr-2 transition-colors hover:bg-bg2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-[12px] font-bold text-white">{initials}</span>
                  <span className="hidden max-w-[120px] truncate text-[13px] font-medium text-ink sm:block">{displayName}</span>
                  <ChevronDown size={14} className="text-ink-subtle" />
                </button>
                <AnimatePresence>
                  {profOpen && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.14 }}
                      className="absolute right-0 mt-2 w-56 overflow-hidden rounded-[12px] border border-app-border bg-app-card shadow-card-lg">
                      <div className="flex items-center gap-2.5 border-b border-app-border px-3 py-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-[13px] font-bold text-white">{initials}</span>
                        <div className="min-w-0 truncate text-[13px] font-semibold text-ink">{displayName}</div>
                      </div>
                      <DropItem icon={Zap} label={t('nav.tools')} onClick={() => { setProfOpen(false); openApp('home') }} />
                      <DropItem icon={User} label={lang === 'tr' ? 'Profil' : 'Profile'} onClick={() => { setProfOpen(false); openApp('profile') }} />
                      {isAdmin && <DropItem icon={Settings} label={lang === 'tr' ? 'Yönetici Paneli' : 'Admin Panel'} onClick={() => { setProfOpen(false); openApp('admin') }} />}
                      <DropItem icon={Zap} label={lang === 'tr' ? 'Kredi Satın Al' : 'Buy Credits'} onClick={() => { setProfOpen(false); $creditsModal.set(true) }} />
                      <div className="border-t border-app-border">
                        <DropItem icon={LogOut} label={lang === 'tr' ? 'Çıkış Yap' : 'Sign Out'} danger onClick={() => { setProfOpen(false); logout() }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" size="sm" onClick={() => openAuth('login')}>{t('nav.signin')}</Button>
              <Button size="sm" onClick={() => openAuth('register')}>{t('nav.start')}</Button>
            </div>
          )}

          <button className="grid h-9 w-9 place-items-center rounded-[8px] text-ink-muted hover:bg-bg2 md:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-app-border bg-app-card md:hidden">
            <div className="flex flex-col gap-1 px-5 py-4">
              {LINKS.map((l) =>
                l.action === 'app' ? (
                  <button key={l.key} onClick={() => { setMobileOpen(false); openApp('home') }} className="rounded-[8px] px-3 py-2.5 text-left text-[14px] font-medium text-ink-muted hover:bg-bg2 hover:text-ink">{t(l.key)}</button>
                ) : (
                  <a key={l.key} href={l.href} onClick={() => setMobileOpen(false)} className="rounded-[8px] px-3 py-2.5 text-[14px] font-medium text-ink-muted hover:bg-bg2 hover:text-ink">{t(l.key)}</a>
                ),
              )}
              {!loggedIn && (
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setMobileOpen(false); openAuth('login') }}>{t('nav.signin')}</Button>
                  <Button className="flex-1" onClick={() => { setMobileOpen(false); openAuth('register') }}>{t('nav.start')}</Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function DropItem({ icon: Icon, label, onClick, danger }: { icon: typeof Zap; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-bg2 ${danger ? 'text-red-brand' : 'text-ink-muted hover:text-ink'}`}>
      <Icon size={15} /> {label}
    </button>
  )
}
