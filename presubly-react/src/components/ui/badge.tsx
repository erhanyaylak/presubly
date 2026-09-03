import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-[0.08em]',
  {
    variants: {
      variant: {
        brand: 'bg-brand/10 text-brand',
        accent: 'bg-gold-light text-gold-accent',
        outline: 'border border-app-border text-ink-muted',
        ok: 'bg-ok/10 text-ok',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-1 text-[11px]',
      },
    },
    defaultVariants: { variant: 'brand', size: 'md' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
}
