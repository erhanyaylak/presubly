import { useEffect } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { $isLoggedIn, $displayName, $initials, $credits, $isAdmin } from '../../stores/auth-store';
import { loadSession, logout } from '../../lib/auth';

interface Props { lang: 'tr' | 'en' }

export default function NavAuth({ lang }: Props) {
  const isLoggedIn = useStore($isLoggedIn);
  const name = useStore($displayName);
  const initials = useStore($initials);
  const credits = useStore($credits);
  const isAdmin = useStore($isAdmin);
  const tr = lang === 'tr';

  useEffect(() => { loadSession(); }, []);

  function openAuth(mode: 'login' | 'register') {
    (window as any).__authOpen?.(mode);
  }

  function openApp() {
    if (!isLoggedIn) { openAuth('login'); return; }
    (window as any).__openToolApp?.();
  }

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button class="nbg" onClick={() => openAuth('login')}>{tr ? 'Giriş Yap' : 'Sign In'}</button>
        <button class="nbp" onClick={() => openAuth('register')}>{tr ? 'Ücretsiz Başla' : 'Start Free'}</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span
        class={`credit-badge ${credits > 2 ? 'ok' : 'low'}`}
        style={{ cursor: 'pointer' }}
      >
        {credits} ⚡
      </span>
      <button class="nbg" onClick={openApp} style={{ fontSize: '12px', padding: '6px 14px' }}>
        {tr ? 'Araçlara Git' : 'Go to Tools'}
      </button>
      <div class="prof-wrap" style={{ position: 'relative' }}>
        <button
          class="prof-trigger"
          onClick={() => {
            const dd = document.getElementById('_profDD');
            dd?.classList.toggle('show');
          }}
        >
          <span class="prof-av">{initials}</span>
          <span class="prof-name">{name}</span>
        </button>
        <div class="prof-dd" id="_profDD">
          <div class="prof-dd-head">
            <div class="prof-dd-av">{initials}</div>
            <div class="prof-dd-info">
              <div class="prof-dd-name">{name}</div>
            </div>
          </div>
          <button class="prof-dd-item" onClick={openApp}>🔬 {tr ? 'Araçlar' : 'Tools'}</button>
          <button class="prof-dd-item" onClick={() => { openApp(); setTimeout(() => (window as any).__showTool?.('profile'), 150); }}>
            👤 {tr ? 'Profil' : 'Profile'}
          </button>
          {isAdmin && (
            <button class="prof-dd-item" onClick={() => { openApp(); setTimeout(() => (window as any).__showTool?.('admin'), 150); }}>
              ⚙️ Admin
            </button>
          )}
          <div class="prof-dd-sep"></div>
          <button class="prof-dd-item" onClick={() => { logout(); document.getElementById('_profDD')?.classList.remove('show'); }}>
            🚪 {tr ? 'Çıkış' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
