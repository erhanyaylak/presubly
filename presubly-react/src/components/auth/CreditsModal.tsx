import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Zap, Lock, ArrowRight } from 'lucide-react'
import { useT } from '@/i18n/utils'
import { $creditsModal } from '@/stores/ui-store'
import { $credits } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Package {
  amount: number
  price: string
  unit: string
  popular?: boolean
}

const PACKAGES: Package[] = [
  { amount: 10, price: '$1.99', unit: '$0.20 / kredi' },
  { amount: 25, price: '$3.99', unit: '$0.16 / kredi' },
  { amount: 100, price: '$9.99', unit: '$0.10 / kredi', popular: true },
  { amount: 250, price: '$19.99', unit: '$0.08 / kredi' },
]

export default function CreditsModal() {
  const open = useStore($creditsModal)
  const credits = useStore($credits)
  const { locale } = useT()
  const tr = locale === 'tr'

  const [selectedIdx, setSelectedIdx] = useState(2)

  function close() {
    $creditsModal.set(false)
  }

  function buy() {
    // Stripe integration deferred until company setup completes.
    alert(
      tr
        ? 'Stripe ödeme entegrasyonu yakın zamanda aktif olacak. Şu an deneme döneminde bireysel API anahtarı ile çalışıyoruz.'
        : 'Stripe payment integration coming soon. We currently run on individual API keys during the trial period.',
    )
  }

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
            if (e.target === e.currentTarget) close()
          }}
        >
          <motion.div
            className="relative w-full max-w-[480px] rounded-[14px] border border-app-border bg-app-card p-7 shadow-card-lg"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-ink-subtle transition-colors hover:bg-bg2 hover:text-ink"
              onClick={close}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-accent">
              {tr ? 'Kredi' : 'Credits'}
            </div>
            <h2 className="font-display mt-2 text-[26px] font-bold leading-[1.1] tracking-[-0.02em] text-ink">
              {tr ? 'Kredi Satın Al' : 'Buy Credits'}
            </h2>

            <p className="mt-3 flex items-center gap-1.5 text-[13px] text-ink-muted">
              <Zap className="h-4 w-4 text-brand" />
              {tr ? 'Mevcut bakiye: ' : 'Current balance: '}
              <strong className="text-brand">{credits}</strong> {tr ? 'kredi' : 'credits'}
            </p>
            <p className="mt-1 text-[11px] text-ink-subtle">
              {tr
                ? 'Krediler süresi dolmaz · 1 kredi = 1 araç kullanımı'
                : 'Credits never expire · 1 credit = 1 tool use'}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {PACKAGES.map((p, i) => (
                <button
                  key={p.amount}
                  className={`relative rounded-[10px] border p-4 text-left transition-colors ${
                    selectedIdx === i
                      ? 'border-brand bg-brand/5'
                      : 'border-app-border bg-app-card hover:border-brand/40'
                  }`}
                  onClick={() => setSelectedIdx(i)}
                  type="button"
                >
                  {p.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge variant="accent">{tr ? 'Popüler' : 'Popular'}</Badge>
                    </div>
                  )}
                  <div className="font-display text-[28px] font-bold leading-none text-ink">
                    {p.amount}
                  </div>
                  <div className="mt-1 text-[15px] font-semibold text-brand">{p.price}</div>
                  <div className="mt-1 font-mono text-[11px] text-ink-subtle">{p.unit}</div>
                </button>
              ))}
            </div>

            <Button variant="primary" size="lg" className="mt-6 w-full" onClick={buy}>
              {tr ? 'Güvenli Ödemeye Geç' : 'Proceed to Secure Checkout'}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-ink-subtle">
              <Lock className="h-3 w-3" />
              {tr
                ? 'Stripe ile güvenli ödeme · Fatura kesilir (yakında)'
                : 'Secure payment via Stripe · Invoice issued (coming soon)'}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
