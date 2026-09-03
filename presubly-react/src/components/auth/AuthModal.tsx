import { useEffect, useRef, useState } from 'react'
import { useStore } from '@nanostores/react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { $authModal, closeAuth } from '@/stores/ui-store'
import { $isLoggedIn } from '@/stores/auth-store'
import { sbLogin, sbRegister, sbResetPassword } from '@/lib/auth'
import { TURNSTILE_KEY } from '@/lib/constants'
import { useT } from '@/i18n/utils'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: TurnstileOptions) => string
      remove: (id: string) => void
    }
  }
}

interface TurnstileOptions {
  sitekey: string
  callback: (token: string) => void
  'expired-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact'
}

export default function AuthModal() {
  const { open, mode } = useStore($authModal)
  const { locale } = useT()
  const tr = locale === 'tr'
  const isLoggedIn = useStore($isLoggedIn)

  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)
  const [tsToken, setTsToken] = useState<string | null>(null)

  const emailRef = useRef<HTMLInputElement>(null)
  const passRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const tsBoxRef = useRef<HTMLDivElement>(null)
  const tsWidgetId = useRef<string | null>(null)

  // Auto-close on successful login
  useEffect(() => {
    if (isLoggedIn && open) closeAuth()
  }, [isLoggedIn, open])

  // Reset state on open
  useEffect(() => {
    if (open) {
      setErr('')
      setOk('')
      setTsToken(null)
    }
  }, [open, mode])

  // Render Turnstile widget when modal opens
  useEffect(() => {
    if (!open || !tsBoxRef.current) return

    const tryRender = () => {
      if (typeof window.turnstile === 'undefined') return false
      if (tsWidgetId.current !== null) {
        try {
          window.turnstile.remove(tsWidgetId.current)
        } catch {}
        tsWidgetId.current = null
      }
      tsBoxRef.current!.innerHTML = ''
      tsWidgetId.current = window.turnstile.render(tsBoxRef.current!, {
        sitekey: TURNSTILE_KEY,
        callback: (tok: string) => setTsToken(tok),
        'expired-callback': () => setTsToken(null),
        theme: 'light',
        size: 'normal',
      })
      return true
    }

    if (!tryRender()) {
      const iv = setInterval(() => {
        if (tryRender()) clearInterval(iv)
      }, 400)
      return () => clearInterval(iv)
    }
  }, [open, mode])

  function setMode(next: 'login' | 'register') {
    $authModal.set({ open: true, mode: next })
  }

  async function handleSubmit() {
    setErr('')
    setOk('')
    const email = emailRef.current?.value.trim() ?? ''
    const pass = passRef.current?.value ?? ''
    const name = nameRef.current?.value.trim() ?? ''

    if (!email || !pass) {
      setErr(tr ? 'E-posta ve şifre zorunludur.' : 'Email and password are required.')
      return
    }
    if (pass.length < 8) {
      setErr(tr ? 'Şifre en az 8 karakter olmalı.' : 'Password must be at least 8 characters.')
      return
    }
    if (!tsToken) {
      setErr(tr ? 'Güvenlik doğrulamasını tamamlayın.' : 'Please complete security verification.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'register') {
        await sbRegister(email, pass, name)
        setOk(tr ? '✓ Hesap oluşturuldu!' : '✓ Account created!')
        setTimeout(() => closeAuth(), 1500)
      } else {
        await sbLogin(email, pass)
        closeAuth()
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    }
    setLoading(false)
  }

  async function handleForgot() {
    const email = emailRef.current?.value.trim() ?? ''
    if (!email) {
      setErr(tr ? 'E-posta adresinizi girin.' : 'Enter your email.')
      return
    }
    try {
      await sbResetPassword(email)
      setOk(tr ? 'Şifre sıfırlama bağlantısı gönderildi.' : 'Password reset link sent.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    }
  }

  const inputCls =
    'w-full rounded-[8px] border border-app-border bg-app-bg px-3 py-2.5 text-[14px] text-ink outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20'
  const labelCls = 'mb-1.5 mt-3.5 block text-[12px] font-semibold text-ink-muted'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[600] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAuth()
          }}
        >
          <motion.div
            className="relative w-full max-w-[420px] rounded-[14px] border border-app-border bg-app-card p-7 shadow-card-lg"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-ink-muted transition-colors hover:bg-bg2 hover:text-ink"
              onClick={closeAuth}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-accent">
              {mode === 'register'
                ? tr
                  ? 'Hesap Oluştur'
                  : 'Create Account'
                : tr
                  ? 'Tekrar Hoş Geldiniz'
                  : 'Welcome Back'}
            </div>
            <h2 className="font-display mt-2 text-[26px] font-bold leading-[1.1] tracking-[-0.02em] text-ink">
              {mode === 'register' ? (tr ? 'Kayıt Ol' : 'Sign Up') : tr ? 'Giriş Yap' : 'Sign In'}
            </h2>

            {mode === 'register' && (
              <>
                <label className={labelCls}>{tr ? 'Ad Soyad' : 'Full Name'}</label>
                <input
                  ref={nameRef}
                  className={inputCls}
                  type="text"
                  placeholder={tr ? 'Ad Soyad' : 'Full Name'}
                  autoComplete="name"
                />
              </>
            )}

            <label className={labelCls}>E-posta</label>
            <input
              ref={emailRef}
              className={inputCls}
              type="email"
              placeholder="ornek@email.com"
              autoComplete="email"
            />

            <label className={labelCls}>{tr ? 'Şifre' : 'Password'}</label>
            <input
              ref={passRef}
              className={inputCls}
              type="password"
              placeholder={tr ? 'En az 8 karakter' : 'At least 8 characters'}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit()
              }}
            />

            {mode === 'login' && (
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={handleForgot}
                  className="text-[12px] font-medium text-brand transition-colors hover:text-brand-dark"
                >
                  {tr ? 'Şifremi unuttum' : 'Forgot password'}
                </button>
              </div>
            )}

            <div id="turnstileBox" className="my-3" style={{ minHeight: 65 }}>
              <div ref={tsBoxRef} />
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? tr
                  ? 'Yükleniyor...'
                  : 'Loading...'
                : mode === 'register'
                  ? tr
                    ? 'Kayıt Ol'
                    : 'Sign Up'
                  : tr
                    ? 'Giriş Yap'
                    : 'Sign In'}
            </Button>

            {err && (
              <div className="mt-3 rounded-[8px] border border-red-brand/20 bg-red-brand/10 px-3 py-2.5 text-[13px] text-red-brand">
                {err}
              </div>
            )}
            {ok && (
              <div className="mt-3 rounded-[8px] border border-ok/20 bg-ok/10 px-3 py-2.5 text-[13px] text-ok">
                {ok}
              </div>
            )}

            <div className="mt-5 border-t border-app-border pt-4 text-center text-[13px] text-ink-muted">
              {mode === 'register' ? (
                <>
                  {tr ? 'Zaten hesabınız var mı? ' : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-semibold text-brand transition-colors hover:text-brand-dark"
                  >
                    {tr ? 'Giriş Yap' : 'Sign In'}
                  </button>
                </>
              ) : (
                <>
                  {tr ? 'Hesabınız yok mu? ' : "Don't have an account? "}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="font-semibold text-brand transition-colors hover:text-brand-dark"
                  >
                    {tr ? 'Kayıt Ol' : 'Sign Up'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
