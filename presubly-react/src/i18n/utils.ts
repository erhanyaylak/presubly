import { useStore } from '@nanostores/react'
import { tr } from './tr'
import { en } from './en'
import type { Locale } from './config'
import { langStore } from '@/stores/lang-store'

const dictionaries: Record<Locale, Record<string, string>> = { tr, en }

export function translate(locale: Locale, key: string): string {
  return dictionaries[locale]?.[key] ?? dictionaries.tr[key] ?? key
}

/** Hook returning a `t(key)` function bound to the current locale. */
export function useT() {
  const locale = useStore(langStore)
  return {
    locale,
    t: (key: string) => translate(locale, key),
  }
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === 'tr' ? 'en' : 'tr'
}
