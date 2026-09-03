import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

type Tint = 'brand' | 'gold' | 'red' | 'ok'

const TINT: Record<Tint, { icon: string; val: string }> = {
  brand: { icon: 'bg-brand/10 text-brand', val: 'text-ink' },
  gold: { icon: 'bg-gold-accent/15 text-gold-accent', val: 'text-gold-accent' },
  red: { icon: 'bg-red-brand/10 text-red-brand', val: 'text-red-brand' },
  ok: { icon: 'bg-ok/10 text-ok', val: 'text-ink' },
}

/** Card container with 1px border, no shadow (Lane B). */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[12px] border border-app-border bg-app-card shadow-card ${className}`}>{children}</div>
  )
}

export function CardHead({
  icon: Icon,
  title,
  right,
}: {
  icon?: LucideIcon
  title: string
  right?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-app-border px-4 py-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={15} className="text-brand" />}
        <span className="text-[13px] font-semibold text-ink">{title}</span>
      </div>
      {right}
    </div>
  )
}

/** KPI / stat card. Big value uses the display serif to keep Presubly's brand character. */
export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  delta,
  tint = 'brand',
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  sub?: ReactNode
  delta?: number
  tint?: Tint
}) {
  const t = TINT[tint]
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="relative rounded-[12px] border border-app-border bg-app-card p-4 shadow-card"
    >
      <div className={`absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-[7px] ${t.icon}`}>
        <Icon size={14} />
      </div>
      <div className="pr-8 text-[12px] font-semibold text-ink-subtle">{label}</div>
      <div className={`font-display mt-1 text-[clamp(26px,3vw,34px)] font-bold leading-none ${t.val}`}>{value}</div>
      {(sub != null || delta != null) && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-muted">
          {sub}
          {delta != null && (
            <span className={`font-semibold ${delta >= 0 ? 'text-ok' : 'text-red-brand'}`}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}

/** Ranked horizontal bar list (tool popularity, etc.). */
export function BarList({
  items,
}: {
  items: { key: string; label: string; value: number; icon?: ReactNode; color?: string }[]
}) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="flex flex-col">
      {items.map((it, idx) => (
        <div key={it.key} className="flex items-center gap-3 border-b border-app-border px-4 py-2.5 last:border-0">
          <span className="w-4 text-center text-[11px] font-semibold text-ink-subtle">{idx + 1}</span>
          {it.icon && <span className="grid h-7 w-7 place-items-center rounded-[5px] bg-bg2 text-[13px]">{it.icon}</span>}
          <span className="w-28 shrink-0 truncate text-[12.5px] font-medium text-ink">{it.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(it.value / max) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: it.color ?? 'var(--color-brand)' }}
            />
          </div>
          <span className="w-10 shrink-0 text-right font-mono text-[12px] text-ink-muted">{it.value}</span>
        </div>
      ))}
    </div>
  )
}

export function Chip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold transition-colors ${
        active
          ? 'bg-brand text-white'
          : 'border border-app-border bg-app-card text-ink-muted hover:bg-bg2'
      }`}
    >
      {children}
      {count != null && (
        <span className={`text-[10px] ${active ? 'text-white/80' : 'text-ink-subtle'}`}>{count}</span>
      )}
    </button>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  sub,
  action,
}: {
  icon: LucideIcon
  title: string
  sub?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-bg2 text-ink-subtle">
        <Icon size={22} />
      </div>
      <div className="text-[14px] font-semibold text-ink">{title}</div>
      {sub && <div className="max-w-xs text-[12px] text-ink-muted">{sub}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Small dismissable toast (e.g. undo). Render at bottom of panel. */
export function Toast({
  message,
  actionLabel,
  onAction,
  onClose,
}: {
  message: string
  actionLabel?: string
  onAction?: () => void
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-[8px] border border-app-border bg-app-card px-4 py-2.5 shadow-lg"
    >
      <span className="text-[12.5px] text-ink">{message}</span>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-[12px] font-semibold text-brand hover:text-brand-dark"
        >
          {actionLabel}
        </button>
      )}
      <button onClick={onClose} className="text-ink-subtle hover:text-ink">
        ✕
      </button>
    </motion.div>
  )
}
