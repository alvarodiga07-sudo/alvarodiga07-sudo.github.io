import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

const LOGO_URL = '/brand/logo.png';

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

export default function Login() {
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [mode, setMode] = useState('register'); // 'register' | 'login'
  const isRegister = mode === 'register';
  const [password, setPassword] = useState('');
  // Pon en false si Google OAuth aún no está configurado en Supabase
  // (Dashboard → Authentication → Providers) — con false se oculta el botón y solo
  // queda email+contraseña, para no mostrar un botón que falla siempre.
  const OAUTH_ENABLED = true;

  const signIn = async (provider) => {
    setError('');
    setLoading(provider);
    try {
      const { error } = await base44.auth.signInWithGoogle();
      if (error) throw error;
      // El navegador se redirige a Google; al volver, AuthContext detecta la sesión.
    } catch (e) {
      console.error('Login error:', e);
      setError('El acceso con Google aún no está activado. Prueba con tu email.');
      setLoading('');
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (!email || password.length < 6) return;
    setError('');
    setLoading('email');
    try {
      if (isRegister) {
        const { data, error } = await base44.auth.signUpWithPassword(email.trim(), password);
        if (error) throw error;
        // Si hay sesión inmediata (confirmación de email desactivada) → AuthContext entra solo.
        if (!data?.session) {
          setError('Cuenta creada. Si pide confirmación por email, ábrelo. (Recomendado: desactivar confirmación en Supabase.)');
          setLoading('');
        }
      } else {
        const { error } = await base44.auth.signInWithPassword(email.trim(), password);
        if (error) throw error;
        // Sesión iniciada → AuthContext detecta el cambio y entra a la app.
      }
    } catch (err) {
      console.error('Auth error:', err);
      const msg = err?.message || '';
      if (/already registered|already exists/i.test(msg)) {
        setError('Ese email ya tiene cuenta. Cambia a "Iniciar sesión".');
      } else if (/invalid login credentials/i.test(msg)) {
        setError('Email o contraseña incorrectos.');
      } else if (/password/i.test(msg) && /6/.test(msg)) {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('No se pudo completar. Revisa los datos e inténtalo de nuevo.');
      }
      setLoading('');
    }
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

              {/* Separador */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-[#0f1117]/10" />
                <span className="text-xs text-[#0f1117]/40">o</span>
                <div className="flex-1 h-px bg-[#0f1117]/10" />
              </div>
            </>
          )}

          <form onSubmit={submitPassword} className="flex flex-col gap-2">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full h-12 rounded-2xl border border-[#0f1117]/10 px-4 text-sm bg-white text-[#0f1117] placeholder:text-[#0f1117]/40 outline-none focus:border-[#eab308]"
            />
            <input
              type="password"
              required
              minLength={6}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? 'Crea una contraseña (mín. 6)' : 'Tu contraseña'}
              className="w-full h-12 rounded-2xl border border-[#0f1117]/10 px-4 text-sm bg-white text-[#0f1117] placeholder:text-[#0f1117]/40 outline-none focus:border-[#eab308]"
            />
            <button
              type="submit"
              disabled={!!loading}
              className="w-full h-12 rounded-2xl bg-[#eab308] text-[#0f1117] font-bold hover:bg-[#f0c030] transition disabled:opacity-50"
            >
              {loading === 'email' ? 'Un momento…' : (isRegister ? 'Crear cuenta' : 'Iniciar sesión')}
            </button>
          </form>
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
