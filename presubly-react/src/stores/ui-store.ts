import { atom } from 'nanostores'
import { $user } from './auth-store'

/** Auth modal visibility + mode (login/register). */
export const $authModal = atom<{ open: boolean; mode: 'login' | 'register' }>({
  open: false,
  mode: 'login',
})

/** App overlay (tools dashboard) visibility. */
export const $appOpen = atom<boolean>(false)

/** Currently visible view inside app overlay. */
export const $activeTool = atom<string>('home')

/** Credits purchase modal visibility. */
export const $creditsModal = atom<boolean>(false)

/** Settings panel (API key) visibility. */
export const $settingsOpen = atom<boolean>(false)

export function openAuth(mode: 'login' | 'register' = 'login') {
  $authModal.set({ open: true, mode })
}
export function closeAuth() {
  $authModal.set({ ...$authModal.get(), open: false })
}

// ─────────────────────────────────────────────────────────────
// Hash router — gives the app overlay real browser history so the
// back/forward buttons, deep links (#/profile) and refresh all work.
// Landing anchors (#how, #pricing…) are left to the browser.
// ─────────────────────────────────────────────────────────────
const TOOL_TO_HASH: Record<string, string> = {
  home: '#/app',
  review: '#/review',
  editorial: '#/editorial',
  response: '#/response',
  checklist: '#/checklist',
  profile: '#/profile',
  admin: '#/admin',
}
const HASH_TO_TOOL: Record<string, string> = Object.fromEntries(
  Object.entries(TOOL_TO_HASH).map(([k, v]) => [v, k]),
)

function applyFromHash() {
  const tool = HASH_TO_TOOL[window.location.hash]
  if (tool) {
    if (!$user.get()) {
      history.replaceState(null, '', '#')
      $appOpen.set(false)
      openAuth('login')
      return
    }
    $activeTool.set(tool)
    $appOpen.set(true)
  } else {
    $appOpen.set(false)
  }
}

/** Call once on boot (after session is loaded). */
export function initRouter() {
  window.addEventListener('hashchange', applyFromHash)
  window.addEventListener('popstate', applyFromHash)
  applyFromHash()
}

/** Open the app overlay at a given view, pushing a history entry. */
export function openApp(tool: string = 'home') {
  if (!$user.get()) {
    openAuth('login')
    return
  }
  $activeTool.set(tool)
  $appOpen.set(true)
  const hash = TOOL_TO_HASH[tool] ?? '#/app'
  if (window.location.hash !== hash) history.pushState(null, '', hash)
}

/** Switch view inside the app overlay (adds history so Back returns to prev view). */
export function goToTool(tool: string) {
  $activeTool.set(tool)
  const hash = TOOL_TO_HASH[tool] ?? '#/app'
  if (window.location.hash !== hash) history.pushState(null, '', hash)
}

/** Leave the app overlay and return to the landing page. */
export function closeApp() {
  $appOpen.set(false)
  if (window.location.hash.startsWith('#/')) history.pushState(null, '', '#')
}
