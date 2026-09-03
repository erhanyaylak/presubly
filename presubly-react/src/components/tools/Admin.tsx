import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import { AnimatePresence } from 'framer-motion'
import {
  LayoutGrid, Users, MessageSquare, KeyRound, ShieldAlert,
  Activity, TrendingUp, UserPlus, Zap, Clock, Crown, Repeat, Rocket,
  Coins, DollarSign, Star, Search, BarChart3, Trophy, Check,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useT } from '@/i18n/utils'
import { $isAdmin } from '@/stores/auth-store'
import { sbFetch } from '@/lib/supabase'
import { $apiKey, setApiKey } from '@/lib/api-key'
import DashboardShell, { type DashSection } from '@/components/dashboard/DashboardShell'
import { Card, CardHead, KpiCard, BarList, Chip, EmptyState, Toast } from '@/components/dashboard/primitives'

interface AdminUser {
  id: string
  email?: string
  full_name?: string
  credits?: number
  is_admin?: boolean
  created_at?: string
  total_runs?: number
  runs_7d?: number
  last_active?: string | null
}

interface AdminStats {
  total_users?: number; total_admins?: number; active_7d?: number; dau?: number
  new_24h?: number; new_7d?: number; total_runs?: number; runs_7d?: number; runs_prev_7d?: number
  avg_per_active?: number; peak_hour?: number | null; power_pct?: number; retention_pct?: number
  activation_pct?: number; credits_7d?: number; est_cost_7d?: number; total_feedback?: number
  avg_rating?: number | string | null; usage_by_tool?: Record<string, number>
  recent_feedback?: { rating: number; tool: string; comment: string; full_name?: string; email?: string }[]
  daily_usage?: { day: string; count: number }[]
  recent_users?: { id: string; full_name?: string; email?: string; is_admin?: boolean; created_at?: string }[]
}

const TOOL_LABEL: Record<string, { label: string; icon: string; color: string }> = {
  review: { label: 'Review', icon: '📄', color: 'var(--color-brand)' },
  editorial: { label: 'Editorial', icon: '📚', color: '#B5740A' },
  response: { label: 'Response', icon: '💬', color: 'var(--color-ok)' },
  checklist: { label: 'Checklist', icon: '☑', color: 'var(--color-brand-light)' },
}

export default function Admin() {
  const { locale } = useT()
  const tr = locale === 'tr'
  const isAdmin = useStore($isAdmin)
  const apiKey = useStore($apiKey)

  const [section, setSection] = useState('overview')
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const [apiKeyDraft, setApiKeyDraft] = useState(apiKey)
  const [apiSaved, setApiSaved] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => setApiKeyDraft(apiKey), [apiKey])

  useEffect(() => {
    if (!isAdmin) return
    if ((section === 'overview' || section === 'feedback') && stats === null) {
      ;(async () => {
        try {
          const d = await sbFetch('/rest/v1/rpc/admin_get_stats', { method: 'POST', body: '{}' })
          setStats((d as AdminStats) ?? {})
        } catch (e) { setLoadErr(e instanceof Error ? e.message : String(e)) }
      })()
    }
    if (section === 'users' && users === null) {
      ;(async () => {
        try {
          const d = await sbFetch('/rest/v1/rpc/admin_list_users', { method: 'POST', body: '{}' })
          setUsers((d as AdminUser[]) ?? [])
        } catch (e) { setLoadErr(e instanceof Error ? e.message : String(e)) }
      })()
    }
  }, [isAdmin, section, stats, users])

  async function saveCredits(uid: string, val: string) {
    try {
      await sbFetch(`/rest/v1/profiles?id=eq.${uid}`, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ credits: Math.max(0, parseInt(val, 10) || 0) }),
      })
      setToast(tr ? 'Kredi güncellendi' : 'Credits updated')
    } catch (e) { setToast(e instanceof Error ? e.message : String(e)) }
  }

  async function toggleAdmin(u: AdminUser) {
    try {
      await sbFetch(`/rest/v1/profiles?id=eq.${u.id}`, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ is_admin: !u.is_admin }),
      })
      setUsers((prev) => prev?.map((x) => (x.id === u.id ? { ...x, is_admin: !x.is_admin } : x)) ?? null)
      setToast(tr ? 'Rol güncellendi' : 'Role updated')
    } catch (e) { setToast(e instanceof Error ? e.message : String(e)) }
  }

  function saveAdminApiKey() {
    setApiKey(apiKeyDraft.trim())
    setApiSaved(true)
    setTimeout(() => setApiSaved(false), 2000)
  }

  const sections: DashSection[] = [
    { id: 'overview', label: tr ? 'Genel Bakış' : 'Overview', icon: LayoutGrid, group: tr ? 'İçgörüler' : 'Insights' },
    { id: 'users', label: tr ? 'Kullanıcılar' : 'Users', icon: Users, badge: users?.length, group: tr ? 'Yönetim' : 'Management' },
    { id: 'feedback', label: tr ? 'Geri Bildirim' : 'Feedback', icon: MessageSquare, badge: stats?.recent_feedback?.length, group: tr ? 'Yönetim' : 'Management' },
    { id: 'api', label: 'API', icon: KeyRound, group: tr ? 'Sistem' : 'System' },
  ]

  if (!isAdmin) {
    return (
      <DashboardShell title={tr ? 'Yönetici' : 'Admin'} sections={[]} active="" onSelect={() => {}}>
        <EmptyState icon={ShieldAlert} title={tr ? 'Yetkisiz erişim' : 'Unauthorized'} sub={tr ? 'Bu sayfaya erişim yetkiniz yok.' : 'You do not have access to this page.'} />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell title={tr ? 'Yönetici' : 'Admin'} subtitle={tr ? 'Platform yönetimi' : 'Platform management'} sections={sections} active={section} onSelect={setSection}>
      {loadErr && <div className="mb-3 rounded-[8px] border border-red-brand/30 bg-red-brand/5 px-3 py-2 text-[12px] text-red-brand">{loadErr}</div>}

      {section === 'overview' && <Overview stats={stats} tr={tr} />}
      {section === 'users' && <UsersView users={users} tr={tr} onSaveCredits={saveCredits} onToggleAdmin={toggleAdmin} />}
      {section === 'feedback' && <FeedbackView stats={stats} tr={tr} />}
      {section === 'api' && (
        <div className="mx-auto max-w-xl">
          <Card>
            <CardHead icon={KeyRound} title="Anthropic API" />
            <div className="space-y-3 p-5">
              <input type="password" value={apiKeyDraft} onChange={(e) => setApiKeyDraft(e.target.value)} placeholder="sk-ant-api03-..." autoComplete="off"
                className="w-full rounded-[8px] border border-app-border bg-app-bg px-3 py-2 text-[13px] text-ink outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
              <p className="text-[11px] text-ink-subtle">
                {tr ? 'Anahtar tarayıcıda saklanır, sunucuya gönderilmez.' : 'Key is stored locally in your browser, not sent to a server.'}{' '}
                <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-brand hover:underline">console.anthropic.com</a>
              </p>
              <button onClick={saveAdminApiKey} className="inline-flex items-center gap-2 rounded-[10px] bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-dark">
                <Check size={15} /> {apiSaved ? (tr ? 'Kaydedildi' : 'Saved') : (tr ? 'Kaydet' : 'Save')}
              </button>
            </div>
          </Card>
        </div>
      )}

      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast('')} />}
      </AnimatePresence>
    </DashboardShell>
  )
}

function Overview({ stats, tr }: { stats: AdminStats | null; tr: boolean }) {
  if (stats === null) return <Loading tr={tr} />
  const s = stats
  const delta = s.runs_prev_7d && s.runs_prev_7d > 0
    ? Math.round(((s.runs_7d ?? 0) - s.runs_prev_7d) / s.runs_prev_7d * 100)
    : undefined
  const peak = s.peak_hour != null ? `${String(s.peak_hour).padStart(2, '0')}:00` : '—'

  type Kpi = { icon: LucideIcon; label: string; value: React.ReactNode; sub?: string; delta?: number; tint?: 'brand' | 'gold' | 'red' | 'ok' }
  const groups: { title: string; items: Kpi[] }[] = [
    {
      title: tr ? 'Kullanıcılar' : 'Users',
      items: [
        { icon: Users, label: tr ? 'Toplam kullanıcı' : 'Total users', value: s.total_users ?? 0, sub: `${s.total_admins ?? 0} admin` },
        { icon: Activity, label: tr ? 'Aktif (7g)' : 'Active (7d)', value: s.active_7d ?? 0, sub: tr ? '≥1 çalışma' : 'with ≥1 run' },
        { icon: TrendingUp, label: tr ? 'Aktif (bugün)' : 'Active (today)', value: s.dau ?? 0, sub: tr ? 'son 24s' : 'last 24h' },
        { icon: UserPlus, label: tr ? 'Yeni (bugün)' : 'New (today)', value: s.new_24h ?? 0, sub: tr ? `7g: ${s.new_7d ?? 0}` : `7d: ${s.new_7d ?? 0}`, tint: (s.new_24h ?? 0) > 0 ? 'gold' : 'brand' },
      ],
    },
    {
      title: tr ? 'Kullanım' : 'Usage',
      items: [
        { icon: Zap, label: tr ? 'Toplam çalışma' : 'Total runs', value: s.total_runs ?? 0, sub: tr ? 'tüm zamanlar' : 'all time' },
        { icon: TrendingUp, label: tr ? '7g çalışma' : '7d runs', value: s.runs_7d ?? 0, sub: tr ? 'son 7 gün' : 'last 7 days', delta },
        { icon: Clock, label: tr ? 'Tepe saat (UTC)' : 'Peak hour (UTC)', value: peak, sub: tr ? 'en yoğun' : 'busiest', tint: 'gold' },
        { icon: Coins, label: tr ? '7g kredi' : '7d credits', value: s.credits_7d ?? 0, sub: tr ? 'harcanan' : 'spent' },
      ],
    },
    {
      title: tr ? 'Sağlık & gelir' : 'Health & revenue',
      items: [
        { icon: Crown, label: tr ? 'Power user %' : 'Power users %', value: `${s.power_pct ?? 0}%`, sub: '≥5 / 7d', tint: (s.power_pct ?? 0) >= 25 ? 'gold' : 'brand' },
        { icon: Repeat, label: tr ? 'Geri dönüş %' : 'Retention %', value: `${s.retention_pct ?? 0}%`, sub: tr ? 'haftalık' : 'wk-over-wk', tint: (s.retention_pct ?? 0) >= 40 ? 'gold' : (s.retention_pct ?? 0) < 15 ? 'red' : 'brand' },
        { icon: Rocket, label: tr ? 'Aktivasyon %' : 'Activation %', value: `${s.activation_pct ?? 0}%`, sub: tr ? '30g kayıt' : '30d signups', tint: (s.activation_pct ?? 0) >= 40 ? 'gold' : (s.activation_pct ?? 0) < 15 ? 'red' : 'brand' },
        { icon: DollarSign, label: tr ? '7g API (tahmini)' : '7d API (est.)', value: `$${(s.est_cost_7d ?? 0).toFixed(2)}`, sub: tr ? 'Anthropic tahmini' : 'Anthropic est.' },
      ],
    },
  ]

  const usage = s.usage_by_tool ?? {}
  const toolItems = Object.entries(usage).map(([k, v]) => ({
    key: k, label: TOOL_LABEL[k]?.label ?? k, value: v, icon: TOOL_LABEL[k]?.icon, color: TOOL_LABEL[k]?.color,
  }))

  return (
    <div className="space-y-7">
      {groups.map((g) => (
        <section key={g.title}>
          <h3 className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-accent">{g.title}</h3>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {g.items.map((k, i) => <KpiCard key={i} {...k} />)}
          </div>
        </section>
      ))}

      <Card>
        <CardHead icon={BarChart3} title={tr ? 'Günlük kullanım — son 14 gün' : 'Daily usage — last 14 days'} />
        <DailyChart data={s.daily_usage ?? []} />
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHead icon={Trophy} title={tr ? 'Araç popülerliği' : 'Tool popularity'} />
          {toolItems.length > 0 ? <BarList items={toolItems} /> : <EmptyState icon={Trophy} title={tr ? 'Veri yok' : 'No data'} />}
        </Card>
        <Card>
          <CardHead icon={UserPlus} title={tr ? 'Son kullanıcılar' : 'Recent users'} />
          {s.recent_users && s.recent_users.length > 0 ? (
            <div className="divide-y divide-app-border">
              {s.recent_users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-[12px] font-bold text-white">
                    {((u.full_name ?? u.email ?? '?')[0] ?? '?').toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 truncate text-[13px] font-medium text-ink">
                      {u.full_name || (u.email ?? '').split('@')[0]}
                      {u.is_admin && <Crown size={12} className="text-gold-accent" />}
                    </div>
                    <div className="truncate text-[11px] text-ink-subtle">{u.email}</div>
                  </div>
                  <span className="shrink-0 font-mono text-[10.5px] text-ink-muted">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString(tr ? 'tr-TR' : 'en-US', { day: '2-digit', month: 'short' }) : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={UserPlus} title={tr ? 'Kullanıcı yok' : 'No users'} />}
        </Card>
      </div>
    </div>
  )
}

function DailyChart({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  if (data.length === 0) return <div className="px-4 py-8 text-center text-[12px] text-ink-subtle">—</div>
  return (
    <div className="flex items-end gap-1.5 px-4 py-5" style={{ height: 140 }}>
      {data.map((d) => (
        <div key={d.day} className="group flex flex-1 flex-col items-center justify-end gap-1" title={`${d.day}: ${d.count}`}>
          <span className="text-[10px] text-ink-subtle opacity-0 group-hover:opacity-100">{d.count}</span>
          <div className="w-full rounded-t-[3px] bg-brand/80 transition-colors group-hover:bg-brand" style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }} />
          <span className="text-[9px] text-ink-subtle">{new Date(d.day).getDate()}</span>
        </div>
      ))}
    </div>
  )
}

type SortKey = 'recent' | 'runs' | 'credits' | 'name'
type FilterKey = 'all' | 'admin' | 'active' | 'credits'

function UsersView({ users, tr, onSaveCredits, onToggleAdmin }: {
  users: AdminUser[] | null; tr: boolean
  onSaveCredits: (uid: string, val: string) => void
  onToggleAdmin: (u: AdminUser) => void
}) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortKey>('recent')

  const filtered = useMemo(() => {
    if (!users) return []
    let list = users.filter((u) =>
      !q || (u.full_name ?? '').toLowerCase().includes(q.toLowerCase()) || (u.email ?? '').toLowerCase().includes(q.toLowerCase()))
    if (filter === 'admin') list = list.filter((u) => u.is_admin)
    if (filter === 'active') list = list.filter((u) => (u.runs_7d ?? 0) > 0)
    if (filter === 'credits') list = list.filter((u) => (u.credits ?? 0) > 0)
    const sorted = [...list]
    if (sort === 'runs') sorted.sort((a, b) => (b.total_runs ?? 0) - (a.total_runs ?? 0))
    else if (sort === 'credits') sorted.sort((a, b) => (b.credits ?? 0) - (a.credits ?? 0))
    else if (sort === 'name') sorted.sort((a, b) => (a.full_name ?? a.email ?? '').localeCompare(b.full_name ?? b.email ?? ''))
    else sorted.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    return sorted
  }, [users, q, filter, sort])

  if (users === null) return <Loading tr={tr} />

  const counts = {
    all: users.length,
    admin: users.filter((u) => u.is_admin).length,
    active: users.filter((u) => (u.runs_7d ?? 0) > 0).length,
    credits: users.filter((u) => (u.credits ?? 0) > 0).length,
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-app-border p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr ? 'İsim veya e-posta ara…' : 'Search name or email…'}
              className="w-full rounded-[8px] border border-app-border bg-app-bg py-1.5 pl-8 pr-3 text-[12.5px] text-ink outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-[8px] border border-app-border bg-app-bg px-2 py-1.5 text-[12px] text-ink-muted outline-none">
            <option value="recent">{tr ? 'En yeni' : 'Recent'}</option>
            <option value="runs">{tr ? 'Çok çalışma' : 'Most runs'}</option>
            <option value="credits">{tr ? 'Çok kredi' : 'Most credits'}</option>
            <option value="name">{tr ? 'İsim A-Z' : 'Name A-Z'}</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')} count={counts.all}>{tr ? 'Tümü' : 'All'}</Chip>
          <Chip active={filter === 'admin'} onClick={() => setFilter('admin')} count={counts.admin}>Admin</Chip>
          <Chip active={filter === 'active'} onClick={() => setFilter('active')} count={counts.active}>{tr ? 'Aktif 7g' : 'Active 7d'}</Chip>
          <Chip active={filter === 'credits'} onClick={() => setFilter('credits')} count={counts.credits}>{tr ? 'Kredili' : 'Has credits'}</Chip>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[640px] text-[12.5px]">
          <thead>
            <tr className="border-b border-app-border text-left text-[10px] uppercase tracking-wider text-ink-subtle">
              <th className="px-4 py-3 font-semibold">{tr ? 'Kullanıcı' : 'User'}</th>
              <th className="px-3 py-3 font-semibold">{tr ? 'Çalışma' : 'Runs'}</th>
              <th className="px-3 py-3 font-semibold">{tr ? 'Kredi' : 'Credits'}</th>
              <th className="px-3 py-3 font-semibold">{tr ? 'Rol' : 'Role'}</th>
              <th className="px-4 py-3 font-semibold">{tr ? 'Kayıt' : 'Joined'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-bg2/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-[12px] font-bold text-white">
                      {((u.full_name ?? u.email ?? '?')[0] ?? '?').toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-ink">{u.full_name || '—'}</div>
                      <div className="truncate font-mono text-[10.5px] text-ink-subtle">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-ink-muted">
                  <span className="font-mono">{u.total_runs ?? 0}</span>
                  <span className="text-[10px] text-ink-subtle"> · {u.runs_7d ?? 0}/7g</span>
                </td>
                <td className="px-3 py-3">
                  <input type="number" defaultValue={u.credits ?? 0} onBlur={(e) => onSaveCredits(u.id, e.target.value)}
                    className="w-16 rounded-[6px] border border-app-border bg-app-bg px-2 py-1 text-[12px] text-ink outline-none focus:border-brand/50" />
                </td>
                <td className="px-3 py-3">
                  <button onClick={() => onToggleAdmin(u)}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold transition-colors ${
                      u.is_admin ? 'bg-gold-accent/15 text-gold-accent' : 'border border-app-border text-ink-subtle hover:bg-bg2'
                    }`}>
                    {u.is_admin ? <><Crown size={11} /> Admin</> : (tr ? 'Kullanıcı' : 'User')}
                  </button>
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-ink-muted">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString(tr ? 'tr-TR' : 'en-US', { day: '2-digit', month: 'short', year: '2-digit' }) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="px-4 py-8 text-center text-[12px] text-ink-subtle">{tr ? 'Sonuç yok' : 'No results'}</div>}
      </div>
    </Card>
  )
}

function FeedbackView({ stats, tr }: { stats: AdminStats | null; tr: boolean }) {
  if (stats === null) return <Loading tr={tr} />
  const fb = stats.recent_feedback ?? []
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard icon={MessageSquare} label={tr ? 'Toplam' : 'Total'} value={stats.total_feedback ?? 0} />
        <KpiCard icon={Star} tint="gold" label={tr ? 'Ort. puan' : 'Avg rating'} value={stats.avg_rating ? Number(stats.avg_rating).toFixed(1) : '—'} />
      </div>
      <Card>
        <CardHead icon={MessageSquare} title={tr ? 'Son geri bildirimler' : 'Recent feedback'} />
        {fb.length > 0 ? (
          <div className="divide-y divide-app-border">
            {fb.map((f, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] tracking-wide text-gold-accent">{'★'.repeat(f.rating ?? 0)}<span className="text-ink-subtle">{'★'.repeat(5 - (f.rating ?? 0))}</span></span>
                  <span className="rounded-[6px] bg-bg2 px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">{f.tool}</span>
                </div>
                {f.comment && <div className="mt-1 text-[13px] text-ink">{f.comment}</div>}
                <div className="mt-1 text-[10.5px] text-ink-subtle">{f.full_name || '—'} · {f.email}</div>
              </div>
            ))}
          </div>
        ) : <EmptyState icon={MessageSquare} title={tr ? 'Henüz geri bildirim yok' : 'No feedback yet'} />}
      </Card>
    </div>
  )
}

function Loading({ tr }: { tr: boolean }) {
  return <div className="px-4 py-16 text-center text-[13px] text-ink-subtle">{tr ? 'Yükleniyor…' : 'Loading…'}</div>
}
