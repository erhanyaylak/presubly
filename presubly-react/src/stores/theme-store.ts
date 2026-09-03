import { atom } from 'nanostores'

export type Theme = 'light' | 'dark'

const THEME_KEY = 'psb_theme'
const MOTION_KEY = 'psb_reduce_motion'

function detectInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const saved = window.localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function detectInitialMotion(): boolean {
  if (typeof window === 'undefined') return false
  const saved = window.localStorage.getItem(MOTION_KEY)
  if (saved != null) return saved === 'true'
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export const $theme = atom<Theme>(detectInitialTheme())
export const $reduceMotion = atom<boolean>(detectInitialMotion())

/** Apply current theme + reduce-motion to <html>. Call once on boot. */
export function applyTheme() {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', $theme.get())
  document.documentElement.setAttribute('data-reduce-motion', String($reduceMotion.get()))
}

export function setTheme(next: Theme) {
  $theme.set(next)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_KEY, next)
    document.documentElement.setAttribute('data-theme', next)
  }
}

export function toggleTheme() {
  setTheme($theme.get() === 'dark' ? 'light' : 'dark')
}

export function setReduceMotion(next: boolean) {
  $reduceMotion.set(next)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(MOTION_KEY, String(next))
    document.documentElement.setAttribute('data-reduce-motion', String(next))
  }
}
