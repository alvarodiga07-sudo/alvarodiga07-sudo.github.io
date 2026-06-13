import { createLocalClient } from '@/lib/localDB';
import { createSupabaseClient } from '@/lib/supabaseClient';
import { isSupabaseEnabled } from '@/lib/supabaseConfig';

// Si hay configuración de Supabase → cuentas reales + nube.
// Si no → modo demo con localStorage (la app sigue funcionando sin backend).
export const base44 = isSupabaseEnabled ? createSupabaseClient() : createLocalClient();
