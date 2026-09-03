import { useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Zap, Settings, Moon, Sun } from 'lucide-react'
import { useT } from '@/i18n/utils'
import { $appOpen, $activeTool, closeApp, goToTool, $creditsModal } from '@/stores/ui-store'
import { $credits } from '@/stores/auth-store'
import { $apiKey, promptApiKey } from '@/lib/api-key'
import { langStore, toggleLocale } from '@/stores/lang-store'
import { $theme, toggleTheme } from '@/stores/theme-store'
import AppHome from './AppHome'
import PeerReview from './PeerReview'
import Editorial from './Editorial'
import ResponseAssistant from './ResponseAssistant'
import Checklist from './Checklist'
import Profile from './Profile'
import Admin from './Admin'

export default function AppOverlay() {
  const open = useStore($appOpen)
  const view = useStore($activeTool)
  const credits = useStore($credits)
  const apiKey = useStore($apiKey)
  const lang = useStore(langStore)
  const theme = useStore($theme)
  const { locale } = useT()
  const tr = locale === 'tr'

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const isDash = view === 'profile' || view === 'admin'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'var(--color-app-bg)', overflowY: 'auto' }}
        >
          {isDash ? (
            view === 'profile' ? <Profile /> : <Admin />
          ) : (
            <>
              <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-app-border bg-app-card/90 px-4 backdrop-blur md:px-6">
                <button
                  onClick={() => (view === 'home' ? closeApp() : goToTool('home'))}
                  className="inline-flex items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:bg-bg2 hover:text-ink"
                >
                  <ArrowLeft size={15} /> {view === 'home' ? (tr ? 'Siteye Dön' : 'Back to Site') : (tr ? 'Araçlar' : 'Tools')}
                </button>
                <button onClick={() => goToTool('home')} className="font-display text-[16px] font-bold tracking-tight text-ink">
                  Pre<span className="text-gold-accent">subly</span>
                </button>

                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    onClick={() => $creditsModal.set(true)}
                    className={`flex items-center gap-1 rounded-[8px] border px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${credits > 2 ? 'border-brand/25 bg-brand/8 text-brand' : 'border-red-brand/30 bg-red-brand/8 text-red-brand'}`}
                  >
                    <Zap size={13} /> {credits}
                  </button>
                  <button onClick={() => promptApiKey(locale)} className="relative grid h-8 w-8 place-items-center rounded-[8px] text-ink-muted hover:bg-bg2" title="API key">
                    <Settings size={16} />
                    <span className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${apiKey ? 'bg-ok' : 'bg-red-brand'}`} />
                  </button>
                  <button onClick={toggleTheme} className="grid h-8 w-8 place-items-center rounded-[8px] text-ink-muted hover:bg-bg2" title={theme === 'dark' ? 'Light' : 'Dark'}>
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  </button>
                  <button onClick={toggleLocale} className="grid h-8 min-w-8 place-items-center rounded-[8px] px-1.5 text-[12px] font-semibold text-ink-muted hover:bg-bg2">
                    {lang === 'tr' ? 'EN' : 'TR'}
                  </button>
                </div>
              </header>

              <div className="px-5 py-6 md:px-8">
                {view === 'home' && <AppHome />}
                {view === 'review' && <PeerReview />}
                {view === 'editorial' && <Editorial />}
                {view === 'response' && <ResponseAssistant />}
                {view === 'checklist' && <Checklist />}
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
