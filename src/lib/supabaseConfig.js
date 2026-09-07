// Configuración de Supabase.
// Estos dos valores son PÚBLICOS y seguros de incrustar en el cliente:
// la seguridad real la imponen las políticas RLS de la base de datos.
// Se rellenan en build time desde .env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// INTERRUPTOR MAESTRO de login/cuentas.
// false = app abierta sin registro (datos en localStorage del navegador).
// true  = login + cuentas en la nube (Supabase).  ← ponlo en true para reactivar.
export const AUTH_ENABLED = false;

// Si no hay configuración o el login está apagado, la app funciona con localStorage (sin login).
export const isSupabaseEnabled = AUTH_ENABLED && Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
