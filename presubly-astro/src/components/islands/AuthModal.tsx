import { useState, useRef, useEffect } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { $isLoggedIn } from '../../stores/auth-store';
import { sbLogin, sbRegister, sbResetPassword } from '../../lib/auth';
import { TURNSTILE_KEY } from '../../lib/constants';

declare const turnstile: any;

interface Props { lang: 'tr' | 'en' }

export default function AuthModal({ lang }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);
  const [tsToken, setTsToken] = useState<string | null>(null);
  const tsRef = useRef<HTMLDivElement>(null);
  const tsWidgetId = useRef<string | null>(null);
  const isLoggedIn = useStore($isLoggedIn);

  const tr = lang === 'tr';

  // Expose open function globally
  useEffect(() => {
    (window as any).__authOpen = (m: 'login' | 'register') => {
      setMode(m);
      setOpen(true);
      setErr('');
      setOk('');
    };
    return () => { delete (window as any).__authOpen; };
  }, []);

  // Close on login
  useEffect(() => {
    if (isLoggedIn && open) { setOpen(false); }
  }, [isLoggedIn]);

  // Render turnstile when modal opens
  useEffect(() => {
    if (!open || !tsRef.current) return;
    setTsToken(null);

    const tryRender = () => {
      if (typeof turnstile === 'undefined') return false;
      if (tsWidgetId.current !== null) {
        try { turnstile.remove(tsWidgetId.current); } catch {}
        tsWidgetId.current = null;
      }
      tsRef.current!.innerHTML = '';
      tsWidgetId.current = turnstile.render(tsRef.current!, {
        sitekey: TURNSTILE_KEY,
        callback: (tok: string) => setTsToken(tok),
        'expired-callback': () => setTsToken(null),
        theme: 'light',
        size: 'normal',
      });
      return true;
    };

    // Wait for turnstile to load
    if (!tryRender()) {
      const iv = setInterval(() => {
        if (tryRender()) clearInterval(iv);
      }, 400);
      return () => clearInterval(iv);
    }
  }, [open]);

  async function handleSubmit() {
    setErr('');
    setOk('');
    const email = (document.getElementById('_authEmail') as HTMLInputElement)?.value.trim();
    const pass = (document.getElementById('_authPass') as HTMLInputElement)?.value;
    const name = (document.getElementById('_authName') as HTMLInputElement)?.value.trim() || '';

    if (!email || !pass) { setErr(tr ? 'E-posta ve şifre zorunludur.' : 'Email and password are required.'); return; }
    if (pass.length < 8) { setErr(tr ? 'Şifre en az 8 karakter olmalı.' : 'Password must be at least 8 characters.'); return; }
    if (!tsToken) { setErr(tr ? 'Güvenlik doğrulamasını tamamlayın.' : 'Please complete security verification.'); return; }

    setLoading(true);
    try {
      if (mode === 'register') {
        await sbRegister(email, pass, name);
        setOk(tr ? '✓ Hesap oluşturuldu!' : '✓ Account created!');
        setTimeout(() => setOpen(false), 1500);
      } else {
        await sbLogin(email, pass);
        setOpen(false);
      }
    } catch (e: any) {
      setErr(e.message);
    }
    setLoading(false);
  }

  async function handleForgot() {
    const email = (document.getElementById('_authEmail') as HTMLInputElement)?.value.trim();
    if (!email) { setErr(tr ? 'E-posta adresinizi girin.' : 'Enter your email.'); return; }
    try {
      await sbResetPassword(email);
      setOk(tr ? 'Şifre sıfırlama bağlantısı gönderildi.' : 'Password reset link sent.');
    } catch (e: any) { setErr(e.message); }
  }

  if (!open) return null;

  return (
    <div class="modal-bg show" onClick={(e) => { if ((e.target as HTMLElement).classList.contains('modal-bg')) setOpen(false); }}>
      <div class="modal">
        <button class="modal-close" onClick={() => setOpen(false)}>&times;</button>
        <h2>{mode === 'register' ? (tr ? 'Kayıt Ol' : 'Sign Up') : (tr ? 'Giriş Yap' : 'Sign In')}</h2>

        {mode === 'register' && (
          <>
            <label class="fla">{tr ? 'Ad Soyad' : 'Full Name'}</label>
            <input class="fi" type="text" id="_authName" placeholder={tr ? 'Ad Soyad' : 'Full Name'} />
          </>
        )}

        <label class="fla">E-posta</label>
        <input class="fi" type="email" id="_authEmail" placeholder="ornek@email.com" />

        <label class="fla">{tr ? 'Şifre' : 'Password'}</label>
        <input class="fi" type="password" id="_authPass" placeholder={tr ? 'En az 8 karakter' : 'At least 8 characters'} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }} />

        {mode === 'login' && (
          <div class="auth-forgot"><a onClick={handleForgot}>{tr ? 'Şifremi unuttum' : 'Forgot password'}</a></div>
        )}

        <div id="turnstileBox" style={{ margin: '10px 0', minHeight: '65px' }}>
          <div ref={tsRef}></div>
        </div>

        <button class="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading
            ? (tr ? 'Yükleniyor...' : 'Loading...')
            : mode === 'register'
              ? (tr ? 'Kayıt Ol' : 'Sign Up')
              : (tr ? 'Giriş Yap' : 'Sign In')}
        </button>

        {err && <div class="auth-err" style={{ display: 'block' }}>{err}</div>}
        {ok && <div class="auth-ok" style={{ display: 'block' }}>{ok}</div>}

        <div class="auth-toggle">
          {mode === 'register'
            ? (<>{tr ? 'Zaten hesabınız var mı? ' : 'Already have an account? '}<a onClick={() => { setMode('login'); setErr(''); setOk(''); }}>{tr ? 'Giriş Yap' : 'Sign In'}</a></>)
            : (<>{tr ? 'Hesabınız yok mu? ' : "Don't have an account? "}<a onClick={() => { setMode('register'); setErr(''); setOk(''); }}>{tr ? 'Kayıt Ol' : 'Sign Up'}</a></>)}
        </div>
      </div>
    </div>
  );
}
