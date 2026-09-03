import { useStore } from '@nanostores/react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  CheckSquare,
  FileText,
  MessageSquare,
  Settings,
  UserCircle,
  type LucideIcon,
} from 'lucide-react'
import { $isAdmin, $displayName } from '@/stores/auth-store'
import { goToTool } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n/utils'
import type { ToolView } from './types'

interface ToolCard {
  id: ToolView
  num: string
  icon: LucideIcon
  fallbackName: { tr: string; en: string }
  fallbackDesc: { tr: string; en: string }
}

const TOOLS: ToolCard[] = [
  {
    id: 'review',
    num: 'Tool 01',
    icon: FileText,
    fallbackName: { tr: 'Bilimsel Hakem İncelemesi', en: 'Scientific Peer Review' },
    fallbackDesc: { tr: '7 kriter, 100 puan, Kabul/Red tahmini.', en: '7 criteria, 100 points, Accept/Reject prediction.' },
  },
  {
    id: 'editorial',
    num: 'Tool 02',
    icon: BookOpen,
    fallbackName: { tr: 'Editöryal Değerlendirme', en: 'Editorial Assessment' },
    fallbackDesc: { tr: 'Kapsam uyumu, etik, karar mektubu.', en: 'Scope fit, ethics, decision letter.' },
  },
  {
    id: 'response',
    num: 'Tool 03',
    icon: MessageSquare,
    fallbackName: { tr: 'Yanıt Asistanı', en: 'Response Assistant' },
    fallbackDesc: { tr: 'Hakem yorumlarına profesyonel yanıt.', en: 'Professional responses to reviewer comments.' },
  },
  {
    id: 'checklist',
    num: 'Tool 04',
    icon: CheckSquare,
    fallbackName: { tr: 'Submission Checklist', en: 'Submission Checklist' },
    fallbackDesc: { tr: 'CONSORT, STROBE, PRISMA kontrolü.', en: 'CONSORT, STROBE, PRISMA checks.' },
  },
]

export default function AppHome() {
  const { locale } = useT()
  const tr = locale === 'tr'
  const isAdmin = useStore($isAdmin)
  const displayName = useStore($displayName)

  return (
    <motion.div
      className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-20"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="text-center">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-accent">
          <span className="h-px w-6 bg-gold-accent" />
          {tr ? 'Çalışma Alanı' : 'Workspace'}
          <span className="h-px w-6 bg-gold-accent" />
        </div>
        <h2 className="font-display mx-auto mt-4 max-w-2xl text-[clamp(28px,4vw,46px)] font-bold leading-[1.06] tracking-[-0.02em] text-ink">
          {tr ? `Hoş geldin, ${displayName}` : `Welcome, ${displayName}`}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-[15.5px] leading-relaxed text-ink-muted">
          {tr
            ? 'Makale metninizi yapıştırın, disiplini seçin — AI saniyeler içinde değerlendirir.'
            : 'Paste your manuscript, select discipline — AI evaluates in seconds.'}
        </p>
      </header>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => goToTool(tool.id)}
              className="group flex flex-col rounded-[14px] border border-app-border bg-app-card p-5 text-left shadow-card transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-brand/10 text-brand">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-accent">
                  {tool.num}
                </span>
              </div>
              <h3 className="font-display mt-4 text-[18px] font-bold leading-snug tracking-[-0.01em] text-ink">
                {tool.fallbackName[tr ? 'tr' : 'en']}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                {tool.fallbackDesc[tr ? 'tr' : 'en']}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand">
                {tr ? 'Aracı Aç' : 'Open Tool'}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button variant="outline" size="md" onClick={() => goToTool('profile')}>
          <UserCircle className="h-4 w-4" />
          {tr ? 'Profil' : 'Profile'}
        </Button>
        {isAdmin && (
          <Button variant="outline" size="md" onClick={() => goToTool('admin')}>
            <Settings className="h-4 w-4" />
            Admin
          </Button>
        )}
      </div>
    </motion.div>
  )
}
