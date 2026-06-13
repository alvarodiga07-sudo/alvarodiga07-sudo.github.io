// Configuración de Supabase.
// Estos dos valores son PÚBLICOS y seguros de incrustar en el cliente:
// la seguridad real la imponen las políticas RLS de la base de datos.
// Se rellenan en build time desde .env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Si no hay configuración, la app sigue funcionando con localStorage (modo demo).
export const isSupabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
