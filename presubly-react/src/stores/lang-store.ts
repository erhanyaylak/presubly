import { atom } from 'nanostores'
import { defaultLocale, locales, type Locale } from '@/i18n/config'

const STORAGE_KEY = 'psb_lang'

function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved && (locales as readonly string[]).includes(saved)) return saved as Locale
  const browser = (navigator.language || 'tr').toLowerCase()
  return browser.startsWith('tr') ? 'tr' : 'en'
}

export const langStore = atom<Locale>(detectInitialLocale())

export function setLocale(next: Locale) {
  langStore.set(next)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.lang = next
  }
}

export function toggleLocale() {
  setLocale(langStore.get() === 'tr' ? 'en' : 'tr')
}
