// Adaptador Supabase con la MISMA interfaz que el cliente local (createLocalClient).
// Sustituye localStorage por Postgres + Auth + Storage en la nube, sin tocar el resto de la app.
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseEnabled } from './supabaseConfig';

// Solo se inicializa si hay configuración (si no, queda null y la app usa localStorage).
export const supabase = isSupabaseEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        flowType: 'pkce',          // evita el conflicto con HashRouter (usa ?code= en vez de #)
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Cada entidad se guarda como una fila { id, user_id, created_date, body(jsonb) }.
// "body" contiene todos los campos del objeto; al leer, lo aplanamos.
const TABLES = {
  trips: 'trips',
  stamps: 'stamps',
  tripPhotos: 'trip_photos',
  posts: 'posts',
  follows: 'follows',
  notifications: 'notifications',
  comments: 'comments',
};
const CANONICAL = ['id', 'user_id', 'created_date'];

function flatten(row) {
  if (!row) return row;
  const { body, ...rest } = row;
  return { ...(body || {}), ...rest }; // las columnas canónicas mandan sobre el body
}

function makeEntity(table) {
  return {
    list: async (sortKey) => {
      let q = supabase.from(table).select('*');
      const desc = typeof sortKey === 'string' && sortKey.startsWith('-');
      const key = sortKey ? (desc ? sortKey.slice(1) : sortKey) : 'created_date';
      q = CANONICAL.includes(key)
        ? q.order(key, { ascending: !desc })
        : q.order(`body->>${key}`, { ascending: !desc });
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(flatten);
    },

    filter: async (query = {}) => {
      let q = supabase.from(table).select('*');
      const bodyQuery = {};
      for (const [k, v] of Object.entries(query)) {
        if (CANONICAL.includes(k)) q = q.eq(k, v);
        else bodyQuery[k] = v;
      }
      if (Object.keys(bodyQuery).length) q = q.contains('body', bodyQuery);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(flatten);
    },

    get: async (id) => {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      return flatten(data);
    },

    create: async (data) => {
      // Fijamos user_id EXPLÍCITAMENTE (no dependemos del default auth.uid()),
      // para que el dueño siempre pueda leer/escribir su fila vía RLS.
      const { data: { user } } = await supabase.auth.getUser();
      const { data: row, error } = await supabase.from(table)
        .insert({ user_id: user?.id, body: data })
        .select().single();
      if (error) throw error;
      return flatten(row);
    },

    update: async (id, data) => {
      const { data: cur } = await supabase.from(table).select('body').eq('id', id).single();
      const merged = { ...(cur?.body || {}), ...data };
      const { data: row, error } = await supabase.from(table).update({ body: merged }).eq('id', id).select().single();
      if (error) throw error;
      return flatten(row);
    },

    delete: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return undefined;
    },
  };
}

// Columnas REALES de la tabla profiles. Cualquier otro campo se guarda en el jsonb "data".
const PROFILE_COLUMNS = ['full_name', 'username', 'avatar_url', 'bio', 'country_of_origin',
  'age', 'theme', 'onboarding_complete', 'countries_visited'];

function flattenProfile(p) {
  if (!p) return p;
  const { data, ...rest } = p;
  return { ...(data || {}), ...rest }; // las columnas reales mandan sobre el jsonb
}

// Separa los campos entrantes en columnas reales vs. campos extra (que van al jsonb)
function splitProfileFields(fields) {
  const cols = {}, extra = {};
  for (const [k, v] of Object.entries(fields)) {
    if (k === 'id' || k === 'email') continue;
    if (PROFILE_COLUMNS.includes(k)) cols[k] = v;
    else extra[k] = v;
  }
  return { cols, extra };
}

// Entidad "User" (perfiles públicos) — mapea a la tabla profiles.
const profilesEntity = {
  list: async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return (data || []).map(flattenProfile);
  },
  filter: async (query = {}) => {
    let q = supabase.from('profiles').select('*');
    for (const [k, v] of Object.entries(query)) {
      if (PROFILE_COLUMNS.includes(k) || k === 'id') q = q.eq(k, v);
      else q = q.contains('data', { [k]: v });
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(flattenProfile);
  },
  get: async (id) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw error;
    return flattenProfile(data);
  },
  update: async (id, fields) => {
    const { data: cur } = await supabase.from('profiles').select('data').eq('id', id).single();
    const { cols, extra } = splitProfileFields(fields);
    const merged = { ...(cur?.data || {}), ...extra };
    const { data: row, error } = await supabase.from('profiles')
      .update({ ...cols, data: merged }).eq('id', id).select().single();
    if (error) throw error;
    return flattenProfile(row);
  },
};

const baseUrl = () => `${window.location.origin}${window.location.pathname}`;

const authStore = {
  me: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null; // sin sesión → la app mostrará el login
    let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile) {
      const meta = user.user_metadata || {};
      const { data: inserted } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          onboarding_complete: false,
          full_name: meta.full_name || meta.name || '',
          avatar_url: meta.avatar_url || meta.picture || '',
          data: {},
        })
        .select()
        .single();
      profile = inserted;
    }
    return { ...flattenProfile(profile), id: user.id, email: user.email };
  },

  updateMe: async (fields) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No hay sesión');
    const { data: cur } = await supabase.from('profiles').select('data').eq('id', user.id).single();
    const { cols, extra } = splitProfileFields(fields);
    const merged = { ...(cur?.data || {}), ...extra };
    const { data: row, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...cols, data: merged })
      .select()
      .single();
    if (error) throw error;
    return { ...flattenProfile(row), id: user.id, email: user.email };
  },

  signInWithGoogle: () =>
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: baseUrl() } }),

  signInWithApple: () =>
    supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: baseUrl() } }),

  // Login por email sin contraseña (enlace mágico). shouldCreateUser=false → solo inicia sesión
  // (no crea cuenta), para distinguir "iniciar sesión" de "registrarse".
  signInWithEmail: (email, { shouldCreateUser = true } = {}) =>
    supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: baseUrl(), shouldCreateUser } }),

  // Comprueba si un nombre de usuario ya está cogido (case-insensitive)
  isUsernameTaken: async (username, exceptId) => {
    const uname = (username || '').trim().toLowerCase();
    if (!uname) return false;
    const { data } = await supabase.from('profiles').select('id').ilike('username', uname);
    return (data || []).some(u => u.id !== exceptId);
  },

  getSession: () => supabase.auth.getSession(),
  onAuthStateChange: (cb) => supabase.auth.onAuthStateChange(cb),

  logout: async () => {
    await supabase.auth.signOut();
    window.location.href = baseUrl();
  },
};

// Subida de archivos → Supabase Storage (bucket público "uploads")
const coreIntegration = {
  UploadFile: async ({ file }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const folder = user?.id || 'anon';
    const safeName = (file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${folder}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('uploads').getPublicUrl(path);
    return { file_url: data.publicUrl };
  },
};

export const createSupabaseClient = () => ({
  auth: authStore,
  entities: {
    Trip: makeEntity(TABLES.trips),
    PassportStamp: makeEntity(TABLES.stamps),
    TripPhoto: makeEntity(TABLES.tripPhotos),
    Post: makeEntity(TABLES.posts),
    Follow: makeEntity(TABLES.follows),
    Comment: makeEntity(TABLES.comments),
    Notification: makeEntity(TABLES.notifications),
    User: profilesEntity,
  },
  integrations: {
    Core: coreIntegration,
  },
});
