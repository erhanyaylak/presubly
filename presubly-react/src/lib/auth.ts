import { sbFetch } from './supabase'
import { $session, $user, $credits, $isAdmin, $fullName } from '@/stores/auth-store'

const STORAGE_KEY = 'psb_session'

function saveSession() {
  const session = $session.get()
  const user = $user.get()
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ session, user, exp: Date.now() + 3600 * 1000 }),
  )
}

export async function loadUserCredits() {
  const user = $user.get()
  if (!user) return
  try {
    const d = await sbFetch(
      `/rest/v1/profiles?id=eq.${user.id}&select=credits,is_admin,full_name`,
      { headers: { Prefer: 'return=representation' } },
    )
    if (d?.[0]) {
      $credits.set(d[0].credits ?? 0)
      $isAdmin.set(d[0].is_admin ?? false)
      $fullName.set(d[0].full_name || '')
    }
  } catch {}
}

export async function sbRegister(email: string, pass: string, name: string) {
  const d = await sbFetch('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password: pass,
      data: { full_name: name },
      options: { emailRedirectTo: 'https://presubly.com' },
    }),
  })
  if (d?.session) {
    $session.set(d.session)
    $user.set(d.user)
    saveSession()
    await loadUserCredits()
  }
  return d
}

export async function sbLogin(email: string, pass: string) {
  const d = await sbFetch('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password: pass }),
  })
  $session.set(d)
  $user.set(d.user)
  saveSession()
  await loadUserCredits()
  return d
}

export async function sbRefresh() {
  const session = $session.get()
  if (!session?.refresh_token) return
  try {
    const d = await sbFetch('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    })
    $session.set(d)
    $user.set(d.user)
    saveSession()
  } catch {
    $session.set(null)
    $user.set(null)
    localStorage.removeItem(STORAGE_KEY)
  }
}

export async function sbResetPassword(email: string) {
  await sbFetch('/auth/v1/recover', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function loadSession() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    const p = JSON.parse(raw)
    $session.set(p.session)
    $user.set(p.user)
    if (Date.now() > p.exp) await sbRefresh()
    await loadUserCredits()
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function logout() {
  $session.set(null)
  $user.set(null)
  $credits.set(0)
  $isAdmin.set(false)
  $fullName.set('')
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem('psb_avatar')
}

// Auto-refresh every 50 minutes
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      if ($session.get()?.refresh_token) sbRefresh()
    },
    50 * 60 * 1000,
  )
}
