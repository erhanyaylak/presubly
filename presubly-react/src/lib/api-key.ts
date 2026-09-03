import { atom } from 'nanostores'

const STORAGE_KEY = 'psb_api_key'

function load(): string {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(STORAGE_KEY) ?? ''
}

export const $apiKey = atom<string>(load())

export function setApiKey(next: string) {
  $apiKey.set(next)
  if (typeof window !== 'undefined') {
    if (next) window.localStorage.setItem(STORAGE_KEY, next)
    else window.localStorage.removeItem(STORAGE_KEY)
  }
}

export function promptApiKey(currentLang: 'tr' | 'en' = 'tr') {
  const cur = $apiKey.get()
  const msg =
    currentLang === 'tr'
      ? 'Anthropic API anahtarınızı girin (sk-ant-api03-...). Anahtar tarayıcıda saklanır, sunucuya gönderilmez.'
      : 'Enter your Anthropic API key (sk-ant-api03-...). The key is stored locally in your browser, never sent to a server.'
  const next = window.prompt(msg, cur)
  if (next === null) return
  setApiKey(next.trim())
}
