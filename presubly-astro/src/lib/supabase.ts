import { SB_URL, SB_ANON } from './constants';
import { $session } from '../stores/auth-store';

export async function sbFetch(path: string, opts: RequestInit & { headers?: Record<string, string> } = {}) {
  const session = $session.get();
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SB_ANON,
    ...(opts.headers || {}),
  };
  if (session?.access_token) {
    h['Authorization'] = 'Bearer ' + session.access_token;
  }
  const r = await fetch(SB_URL + path, { ...opts, headers: h });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error_description || e.msg || e.message || 'Error ' + r.status);
  }
  const txt = await r.text();
  if (!txt) return null;
  try { return JSON.parse(txt); } catch { return txt; }
}
