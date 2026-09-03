import { useEffect, useRef, useState } from 'react'
import { useStore } from '@nanostores/react'
import {
  LayoutGrid, UserCircle, Clock, SlidersHorizontal,
  Zap, FileText, BookOpen, MessageSquare, CheckSquare,
  Camera, Crown, ArrowRight, Moon, Sun, Languages, KeyRound, Check,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useT } from '@/i18n/utils'
import { $displayName, $credits, $initials, $user, $fullName, $isAdmin } from '@/stores/auth-store'
import { goToTool } from '@/stores/ui-store'
import { sbFetch } from '@/lib/supabase'
import { $theme, toggleTheme, $reduceMotion, setReduceMotion } from '@/stores/theme-store'
import { langStore, toggleLocale } from '@/stores/lang-store'
import { $apiKey, promptApiKey } from '@/lib/api-key'
import DashboardShell, { type DashSection } from '@/components/dashboard/DashboardShell'
import { Card, CardHead, KpiCard, EmptyState } from '@/components/dashboard/primitives'

interface ProfileMeta {
  institution?: string
  department?: string
  academicTitle?: string
  orcid?: string
  country?: string
  phone?: string
  bio?: string
}

interface UserStats {
  total_reviews?: number
  total_editorial?: number
  total_responses?: number
  total_checklists?: number
  total_usage?: number
  recent_activity?: { tool: string; credits_used: number; created_at: string }[]
}

const TOOL_META: Record<string, { icon: LucideIcon; tr: string; en: string; desc_tr: string; desc_en: string }> = {
  review: { icon: FileText, tr: 'Hakem İncelemesi', en: 'Peer Review', desc_tr: 'Makaleyi gönderim öncesi denetle', desc_en: 'Pre-submission manuscript review' },
  editorial: { icon: BookOpen, tr: 'Editöryal', en: 'Editorial', desc_tr: 'Dergi editörü değerlendirmesi', desc_en: 'Journal editor assessment' },
  response: { icon: MessageSquare, tr: 'Yanıt Asistanı', en: 'Response Assistant', desc_tr: 'Hakem yorumlarına yanıt', desc_en: 'Reply to reviewer comments' },
  checklist: { icon: CheckSquare, tr: 'Checklist', en: 'Checklist', desc_tr: 'CONSORT / STROBE / PRISMA', desc_en: 'CONSORT / STROBE / PRISMA' },
}

export default function Profile() {
  const { locale } = useT()
  const tr = locale === 'tr'
  const name = useStore($displayName)
  const credits = useStore($credits)
  const initials = useStore($initials)
  const user = useStore($user)
  const isAdmin = useStore($isAdmin)
  const theme = useStore($theme)
  const lang = useStore(langStore)
  const reduceMotion = useStore($reduceMotion)
  const apiKey = useStore($apiKey)

  const [section, setSection] = useState('overview')
  const [fn, setFn] = useState('')
  const [ln, setLn] = useState('')
  const [meta, setMeta] = useState<ProfileMeta>({})
  const [memberSince, setMemberSince] = useState('')
  const [stats, setStats] = useState<UserStats | null>(null)
  const [avatar, setAvatar] = useState<string | null>(localStorage.getItem('psb_avatar'))
  const [msg, setMsg] = useState<{ kind: 'ok' | 'er'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      try {
        const d = await sbFetch(`/rest/v1/profiles?id=eq.${user.id}&select=*`, {
          headers: { Prefer: 'return=representation' },
        })
        if (cancelled) return
        if (d?.[0]) {
          const p = d[0] as { full_name?: string; metadata?: ProfileMeta; created_at?: string }
          const parts = (p.full_name ?? '').split(' ')
          setFn(parts[0] ?? '')
          setLn(parts.slice(1).join(' '))
          setMeta(p.metadata ?? {})
          if (p.created_at) {
            setMemberSince(new Date(p.created_at).toLocaleDateString(tr ? 'tr-TR' : 'en-US', { month: 'short', year: 'numeric' }))
          }
        }
      } catch {}
      try {
        const s = await sbFetch('/rest/v1/rpc/psb_user_stats', {
          method: 'POST',
          body: JSON.stringify({ p_user_id: user.id }),
        })
        if (!cancelled && s) setStats(s as UserStats)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [user, tr])

  function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      localStorage.setItem('psb_avatar', dataUrl)
      setAvatar(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  async function save() {
    if (!user) return
    setSaving(true)
    setMsg(null)
    try {
      const fullName = `${fn} ${ln}`.trim()
      await sbFetch(`/rest/v1/profiles?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ full_name: fullName, metadata: meta }),
      })
      $fullName.set(fullName)
      setMsg({ kind: 'ok', text: tr ? '✓ Kaydedildi' : '✓ Saved' })
    } catch (e) {
      setMsg({ kind: 'er', text: e instanceof Error ? e.message : String(e) })
    }
    setSaving(false)
  }

  function upd<K extends keyof ProfileMeta>(key: K, value: string) {
    setMeta((m) => ({ ...m, [key]: value }))
  }

  const reviews = stats?.total_reviews ?? 0
  const checklists = stats?.total_checklists ?? 0
  const responses = (stats?.total_responses ?? 0) + (stats?.total_editorial ?? 0)

  const sections: DashSection[] = [
    { id: 'overview', label: tr ? 'Genel Bakış' : 'Overview', icon: LayoutGrid },
    { id: 'account', label: tr ? 'Hesabım' : 'Account', icon: UserCircle },
    { id: 'activity', label: tr ? 'Aktivite' : 'Activity', icon: Clock, badge: stats?.recent_activity?.length },
    { id: 'settings', label: tr ? 'Ayarlar' : 'Settings', icon: SlidersHorizontal, group: tr ? 'Ayarlar' : 'Settings' },
  ]

  const identity = (
    <div className="rounded-[12px] border border-app-border bg-app-card p-4 shadow-card">
      <div className="flex items-center gap-3">
        <label htmlFor="avatarInput" className="group relative cursor-pointer">
          <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-brand text-[15px] font-bold text-white">
            {avatar ? <img src={avatar} alt={name} className="h-full w-full object-cover" /> : initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-app-card bg-gold-accent text-white">
            <Camera size={10} />
          </span>
        </label>
        <input ref={fileRef} id="avatarInput" type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
        <div className="min-w-0">
          <div className="flex items-center gap-1 truncate text-[14px] font-semibold text-ink">
            {name}
            {isAdmin && <Crown size={13} className="text-gold-accent" />}
          </div>
          <div className="truncate text-[11px] text-ink-subtle">{user?.email}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
          <Zap size={12} /> {credits} {tr ? 'kredi' : 'credits'}
        </span>
        <span className="rounded-full bg-bg2 px-2.5 py-1 text-[11px] font-semibold text-ink-muted">Free</span>
      </div>
      {memberSince && (
        <div className="mt-2 text-[10.5px] text-ink-subtle">{tr ? 'Üye: ' : 'Member since '}{memberSince}</div>
      )}
    </div>
  )

  return (
    <DashboardShell
      title={tr ? 'Profil' : 'Profile'}
      subtitle={tr ? 'Hesap & aktivite' : 'Account & activity'}
      sections={sections}
      active={section}
      onSelect={setSection}
      identity={identity}
    >
      {section === 'overview' && (
        <div className="space-y-7">
          <div>
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-accent">
              {tr ? 'Genel Bakış' : 'Overview'}
            </div>
            <h1 className="font-display mt-1.5 text-[24px] font-bold text-ink">
              {tr ? `Merhaba, ${fn || name}` : `Welcome, ${fn || name}`}
            </h1>
            <p className="mt-1 text-[13.5px] text-ink-muted">
              {tr ? 'Gönderim öncesi araç kullanımının özeti.' : 'A snapshot of your pre-submission activity.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard icon={Zap} tint="gold" label={tr ? 'Kredi' : 'Credits'} value={credits} sub={tr ? 'kullanılabilir' : 'available'} />
            <KpiCard icon={FileText} label={tr ? 'İnceleme' : 'Reviews'} value={reviews} sub={tr ? 'toplam' : 'all time'} />
            <KpiCard icon={CheckSquare} label="Checklist" value={checklists} sub={tr ? 'toplam' : 'all time'} />
            <KpiCard icon={MessageSquare} label={tr ? 'Yanıt' : 'Responses'} value={responses} sub={tr ? 'yanıt + editör' : 'response + editorial'} />
          </div>

          <div>
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-subtle">
              {tr ? 'Hızlı Başlat' : 'Quick Launch'}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Object.entries(TOOL_META).map(([id, m]) => {
                const Icon = m.icon
                return (
                  <button
                    key={id}
                    onClick={() => goToTool(id)}
                    className="group flex items-center gap-3 rounded-[12px] border border-app-border bg-app-card p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-brand/10 text-brand">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-semibold text-ink">{tr ? m.tr : m.en}</span>
                      <span className="block truncate text-[11.5px] text-ink-muted">{tr ? m.desc_tr : m.desc_en}</span>
                    </span>
                    <ArrowRight size={15} className="text-ink-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {section === 'account' && (
        <div className="mx-auto max-w-2xl space-y-4">
          <Card>
            <CardHead icon={UserCircle} title={tr ? 'Akademik Bilgiler' : 'Academic Info'} />
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <Field label={tr ? 'Ad' : 'First name'} value={fn} onChange={setFn} />
              <Field label={tr ? 'Soyad' : 'Last name'} value={ln} onChange={setLn} />
              <Field label={tr ? 'Kurum' : 'Institution'} value={meta.institution ?? ''} onChange={(v) => upd('institution', v)} placeholder={tr ? 'Üniversite' : 'University'} />
              <Field label={tr ? 'Bölüm' : 'Department'} value={meta.department ?? ''} onChange={(v) => upd('department', v)} />
              <div>
                <FieldLabel>{tr ? 'Akademik Unvan' : 'Academic Title'}</FieldLabel>
                <select value={meta.academicTitle ?? ''} onChange={(e) => upd('academicTitle', e.target.value)} className={inputCls}>
                  <option value="">{tr ? 'Seçiniz' : 'Select'}</option>
                  <option>Araş. Gör.</option><option>Dr.</option><option>Doç. Dr.</option>
                  <option>Prof. Dr.</option><option>Postdoc</option><option>{tr ? 'Diğer' : 'Other'}</option>
                </select>
              </div>
              <Field label="ORCID" value={meta.orcid ?? ''} onChange={(v) => upd('orcid', v)} placeholder="0000-0000-0000-0000" />
              <Field label={tr ? 'Ülke' : 'Country'} value={meta.country ?? ''} onChange={(v) => upd('country', v)} />
              <Field label={tr ? 'Telefon' : 'Phone'} value={meta.phone ?? ''} onChange={(v) => upd('phone', v)} placeholder="+90..." />
              <div className="sm:col-span-2">
                <FieldLabel>{tr ? 'Biyografi' : 'Bio'}</FieldLabel>
                <textarea rows={3} value={meta.bio ?? ''} onChange={(e) => upd('bio', e.target.value)}
                  placeholder={tr ? 'Araştırma alanları, uzmanlık...' : 'Research areas, expertise...'}
                  className={`${inputCls} resize-y`} />
              </div>
            </div>
          </Card>
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving}
              className="inline-flex items-center gap-2 rounded-[10px] bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60">
              <Check size={15} /> {saving ? (tr ? 'Kaydediliyor...' : 'Saving...') : (tr ? 'Profili Kaydet' : 'Save Profile')}
            </button>
            {msg && <span className={`text-[12px] ${msg.kind === 'ok' ? 'text-ok' : 'text-red-brand'}`}>{msg.text}</span>}
          </div>
        </div>
      )}

      {section === 'activity' && (
        <Card>
          <CardHead icon={Clock} title={tr ? 'Son Aktivite' : 'Recent Activity'} />
          {stats?.recent_activity && stats.recent_activity.length > 0 ? (
            <div className="divide-y divide-app-border">
              {stats.recent_activity.map((a, i) => {
                const m = TOOL_META[a.tool]
                const Icon = m?.icon ?? FileText
                const dt = a.created_at
                  ? new Date(a.created_at).toLocaleDateString(tr ? 'tr-TR' : 'en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : ''
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-brand/10 text-brand"><Icon size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] text-ink"><strong className="font-semibold">{m ? (tr ? m.tr : m.en) : a.tool}</strong> {tr ? 'kullanıldı' : 'used'}</div>
                      <div className="text-[11px] text-ink-subtle">{a.credits_used} {tr ? 'kredi' : 'credits'}</div>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-ink-muted">{dt}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState icon={Clock} title={tr ? 'Henüz aktivite yok' : 'No activity yet'} sub={tr ? 'Bir araç kullanarak başlayın.' : 'Start by using a tool.'} />
          )}
        </Card>
      )}

      {section === 'settings' && (
        <div className="mx-auto max-w-2xl space-y-4">
          <Card>
            <CardHead icon={SlidersHorizontal} title={tr ? 'Tercihler' : 'Preferences'} />
            <div className="divide-y divide-app-border">
              <ToggleRow icon={theme === 'dark' ? Sun : Moon} title={tr ? 'Koyu tema' : 'Dark theme'} desc={tr ? 'Açık / koyu arası geçiş' : 'Toggle light / dark'} on={theme === 'dark'} onToggle={toggleTheme} />
              <ToggleRow icon={Languages} title={tr ? 'Dil' : 'Language'} desc={tr ? 'Arayüz dili' : 'Interface language'} valueLabel={lang.toUpperCase()} onToggle={toggleLocale} />
              <ToggleRow icon={SlidersHorizontal} title={tr ? 'Hareketi azalt' : 'Reduce motion'} desc={tr ? 'Animasyonları kıs' : 'Minimize animations'} on={reduceMotion} onToggle={() => setReduceMotion(!reduceMotion)} />
            </div>
          </Card>
          <Card>
            <CardHead icon={KeyRound} title="Anthropic API" />
            <div className="flex items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <div className="text-[13px] text-ink">{apiKey ? (tr ? 'Anahtar ayarlı' : 'Key configured') : (tr ? 'Anahtar yok' : 'No key set')}</div>
                <div className="text-[11px] text-ink-subtle">{tr ? 'Tarayıcıda saklanır, sunucuya gönderilmez.' : 'Stored locally, never sent to a server.'}</div>
              </div>
              <button onClick={() => promptApiKey(locale)} className="shrink-0 rounded-[8px] border border-app-border px-3 py-1.5 text-[12px] font-semibold text-ink-muted hover:bg-bg2">
                {tr ? 'Düzenle' : 'Edit'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </DashboardShell>
  )
}

const inputCls =
  'w-full rounded-[8px] border border-app-border bg-app-bg px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-brand/50 focus:ring-1 focus:ring-brand/20'

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">{children}</label>
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </div>
  )
}

function ToggleRow({ icon: Icon, title, desc, on, valueLabel, onToggle }: { icon: LucideIcon; title: string; desc: string; on?: boolean; valueLabel?: string; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-[8px] bg-bg2 text-ink-muted"><Icon size={15} /></span>
        <div>
          <div className="text-[13px] font-medium text-ink">{title}</div>
          <div className="text-[11px] text-ink-subtle">{desc}</div>
        </div>
      </div>
      {valueLabel != null ? (
        <button onClick={onToggle} className="rounded-[8px] border border-app-border px-3 py-1 text-[12px] font-semibold text-ink-muted hover:bg-bg2">{valueLabel}</button>
      ) : (
        <button onClick={onToggle} role="switch" aria-checked={on}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? 'bg-brand' : 'bg-bg3'}`}>
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
        </button>
      )}
    </div>
  )
}
