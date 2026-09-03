import { tr } from './tr';
import { en } from './en';
import type { Locale } from './config';

const dictionaries: Record<Locale, Record<string, string>> = { tr, en };

export function t(locale: Locale, key: string): string {
  return dictionaries[locale]?.[key] ?? dictionaries.tr[key] ?? key;
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === 'tr' ? 'en' : 'tr';
}

export function getLocalizedPath(locale: Locale, path: string = '/'): string {
  return `/${locale}${path === '/' ? '/' : path}`;
}
