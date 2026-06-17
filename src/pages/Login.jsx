import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

const LOGO_URL = 'https://media.base44.com/images/public/user_69aea125734ce6b1da596dd5/ce9f50f11_IMG_05283.png';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41.2 35.7 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.36 1.43c0 1.14-.46 2.23-1.2 3.03-.8.86-2.1 1.52-3.18 1.43-.13-1.08.42-2.23 1.13-3 .8-.85 2.18-1.48 3.25-1.46zM20.8 17.1c-.6 1.38-.88 2-1.65 3.22-1.08 1.7-2.6 3.82-4.48 3.84-1.67.02-2.1-1.08-4.37-1.07-2.27.01-2.74 1.09-4.4 1.07-1.88-.02-3.32-1.93-4.4-3.63C-1.93 15.71-2.25 9.4.79 6.04 1.88 4.85 3.6 4.1 5.2 4.1c1.65 0 2.68 1.08 4.04 1.08 1.32 0 2.13-1.08 4.04-1.08 1.43 0 2.95.78 4.03 2.12-3.54 1.94-2.96 7-1.5 8.78z"/>
    </svg>
  );
}

export default function Login() {
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [mode, setMode] = useState('register'); // 'register' | 'login'
  const isRegister = mode === 'register';
  // Pon en true cuando Google/Apple OAuth estén configurados en Supabase
  const OAUTH_ENABLED = false;

  const signIn = async (provider) => {
    setError('');
    setLoading(provider);
    try {
      const fn = provider === 'apple' ? base44.auth.signInWithApple : base44.auth.signInWithGoogle;
      const { error } = await fn();
      if (error) throw error;
      // El navegador se redirige al proveedor; al volver, AuthContext detecta la sesión.
    } catch (e) {
      console.error('Login error:', e);
      setError(provider === 'apple'
        ? 'El acceso con Apple aún no está activado. Prueba con Google o email.'
        : 'El acceso con Google aún no está activado. Prueba con tu email.');
      setLoading('');
    }
  };

  const sendMagicLink = async (e) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setLoading('email');
    try {
      const { error } = await base44.auth.signInWithEmail(email.trim(), { shouldCreateUser: isRegister });
      if (error) throw error;
      setEmailSent(true);
    } catch (err) {
      console.error('Email login error:', err);
      // En modo "iniciar sesión", si el correo no tiene cuenta, Supabase no envía nada
      if (!isRegister && /signup|not allowed|user|exist/i.test(err?.message || '')) {
        setError('No existe ninguna cuenta con ese correo. Cambia a "Crear cuenta".');
      } else {
        setError('No se pudo enviar el enlace. Revisa el email e inténtalo de nuevo.');
      }
    }
    setLoading('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'radial-gradient(circle at 50% 0%, #fff7e0, #fafaf5 55%)' }}>
      <div className="w-full max-w-sm flex flex-col items-center">
        <img src={LOGO_URL} alt="Waddle" className="w-20 h-20 rounded-2xl shadow-lg mb-6" />
        <h1 className="text-3xl font-extrabold text-[#0f1117] tracking-tight">
          {isRegister ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
        </h1>
        <p className="mt-3 text-[#0f1117]/60 leading-relaxed">
          {isRegister
            ? 'Únete a Waddle: planifica viajes, colecciona países en tu pasaporte digital y comparte tus aventuras.'
            : 'Inicia sesión para volver a tus viajes, tu pasaporte y tu diario.'}
        </p>

        {/* #1 — Selector Iniciar sesión / Crear cuenta */}
        <div className="mt-6 w-full grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#0f1117]/5">
          <button
            onClick={() => { setMode('login'); setError(''); setEmailSent(false); }}
            className={`h-10 rounded-xl text-sm font-semibold transition ${!isRegister ? 'bg-white text-[#0f1117] shadow-sm' : 'text-[#0f1117]/50'}`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); setEmailSent(false); }}
            className={`h-10 rounded-xl text-sm font-semibold transition ${isRegister ? 'bg-white text-[#0f1117] shadow-sm' : 'text-[#0f1117]/50'}`}
          >
            Crear cuenta
          </button>
        </div>

        <div className="mt-6 w-full flex flex-col gap-3">
          {OAUTH_ENABLED && (
            <>
              <button
                onClick={() => signIn('google')}
                disabled={!!loading}
                className="w-full h-12 rounded-2xl bg-white border border-[#0f1117]/10 shadow-sm flex items-center justify-center gap-3 font-semibold text-[#0f1117] hover:border-[#eab308] hover:shadow-md transition disabled:opacity-50"
              >
                <GoogleIcon /> {loading === 'google' ? 'Conectando…' : 'Continuar con Google'}
              </button>

              <button
                onClick={() => signIn('apple')}
                disabled={!!loading}
                className="w-full h-12 rounded-2xl bg-[#0f1117] text-white flex items-center justify-center gap-3 font-semibold hover:bg-[#1a1d27] transition disabled:opacity-50"
              >
                <AppleIcon /> {loading === 'apple' ? 'Conectando…' : 'Continuar con Apple'}
              </button>

              {/* Separador */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-[#0f1117]/10" />
                <span className="text-xs text-[#0f1117]/40">o</span>
                <div className="flex-1 h-px bg-[#0f1117]/10" />
              </div>
            </>
          )}

          {emailSent ? (
            <div className="rounded-2xl bg-[#eab308]/10 border border-[#eab308]/30 p-4 text-sm text-[#0f1117]">
              ✉️ Te hemos enviado un enlace de acceso a <strong>{email}</strong>.
              Ábrelo desde este dispositivo para entrar.
            </div>
          ) : (
            <form onSubmit={sendMagicLink} className="flex flex-col gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full h-12 rounded-2xl border border-[#0f1117]/10 px-4 text-sm outline-none focus:border-[#eab308]"
              />
              <button
                type="submit"
                disabled={!!loading}
                className="w-full h-12 rounded-2xl bg-[#eab308] text-[#0f1117] font-bold hover:bg-[#f0c030] transition disabled:opacity-50"
              >
                {loading === 'email' ? 'Enviando…' : (isRegister ? 'Crear cuenta con mi email' : 'Entrar con mi email')}
              </button>
            </form>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

        <p className="mt-8 text-xs text-[#0f1117]/40 leading-relaxed">
          Al continuar, aceptas que guardemos tus viajes en tu cuenta para que te sigan
          en cualquier dispositivo. Tus datos son tuyos.
        </p>
      </div>
    </div>
  );
}
