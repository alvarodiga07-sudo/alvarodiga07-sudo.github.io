-- ============================================================
--  WADDLE · Esquema de base de datos para Supabase
--  Pega TODO esto en: Supabase → SQL Editor → New query → Run
--  Seguro de ejecutar varias veces (todo usa IF NOT EXISTS / DROP POLICY IF EXISTS).
--
--  (Reescrito 2026-07-13: la versión anterior generaba las tablas con un
--  bucle dinámico "do $$ ... execute format(...) ..." y uno de esos format()
--  tenía 6 marcadores %s/%I pero solo recibía 2 argumentos (t, t) → error
--  "too few arguments for format()". Esta versión usa sentencias explícitas,
--  sin SQL dinámico, para que ese tipo de error no pueda volver a pasar.)
-- ============================================================

-- ---------- PERFILES (datos del usuario) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_date timestamptz default now(),
  full_name text,
  username text,
  avatar_url text,
  bio text,
  country_of_origin text,
  age int,
  theme text default 'system',
  onboarding_complete boolean default false,
  countries_visited jsonb default '[]'::jsonb,
  data jsonb default '{}'::jsonb
);
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- ---------- TRIPS ----------
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_date timestamptz default now(),
  body jsonb default '{}'::jsonb
);
alter table public.trips enable row level security;
drop policy if exists "trips_owner_read" on public.trips;
create policy "trips_owner_read" on public.trips for select using (auth.uid() = user_id);
drop policy if exists "trips_owner_write" on public.trips;
create policy "trips_owner_write" on public.trips for insert with check (auth.uid() = user_id);
drop policy if exists "trips_owner_update" on public.trips;
create policy "trips_owner_update" on public.trips for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "trips_owner_delete" on public.trips;
create policy "trips_owner_delete" on public.trips for delete using (auth.uid() = user_id);

-- ---------- STAMPS ----------
create table if not exists public.stamps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_date timestamptz default now(),
  body jsonb default '{}'::jsonb
);
alter table public.stamps enable row level security;
drop policy if exists "stamps_owner_read" on public.stamps;
create policy "stamps_owner_read" on public.stamps for select using (auth.uid() = user_id);
drop policy if exists "stamps_owner_write" on public.stamps;
create policy "stamps_owner_write" on public.stamps for insert with check (auth.uid() = user_id);
drop policy if exists "stamps_owner_update" on public.stamps;
create policy "stamps_owner_update" on public.stamps for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "stamps_owner_delete" on public.stamps;
create policy "stamps_owner_delete" on public.stamps for delete using (auth.uid() = user_id);

-- ---------- TRIP_PHOTOS ----------
create table if not exists public.trip_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_date timestamptz default now(),
  body jsonb default '{}'::jsonb
);
alter table public.trip_photos enable row level security;
drop policy if exists "trip_photos_owner_read" on public.trip_photos;
create policy "trip_photos_owner_read" on public.trip_photos for select using (auth.uid() = user_id);
drop policy if exists "trip_photos_owner_write" on public.trip_photos;
create policy "trip_photos_owner_write" on public.trip_photos for insert with check (auth.uid() = user_id);
drop policy if exists "trip_photos_owner_update" on public.trip_photos;
create policy "trip_photos_owner_update" on public.trip_photos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "trip_photos_owner_delete" on public.trip_photos;
create policy "trip_photos_owner_delete" on public.trip_photos for delete using (auth.uid() = user_id);

-- ---------- POSTS (público si visibility='public', si no solo el dueño) ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_date timestamptz default now(),
  body jsonb default '{}'::jsonb
);
alter table public.posts enable row level security;
drop policy if exists "posts_public_read" on public.posts;
create policy "posts_public_read" on public.posts for select
  using (coalesce(body->>'visibility','public') = 'public' or auth.uid() = user_id);
drop policy if exists "posts_owner_write" on public.posts;
create policy "posts_owner_write" on public.posts for insert with check (auth.uid() = user_id);
drop policy if exists "posts_owner_update" on public.posts;
create policy "posts_owner_update" on public.posts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "posts_owner_delete" on public.posts;
create policy "posts_owner_delete" on public.posts for delete using (auth.uid() = user_id);

-- ---------- FOLLOWS (cualquier autenticado puede leer, para contar seguidores/seguidos) ----------
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_date timestamptz default now(),
  body jsonb default '{}'::jsonb
);
alter table public.follows enable row level security;
drop policy if exists "follows_read_auth" on public.follows;
create policy "follows_read_auth" on public.follows for select using (auth.role() = 'authenticated');
drop policy if exists "follows_owner_write" on public.follows;
create policy "follows_owner_write" on public.follows for insert with check (auth.uid() = user_id);
drop policy if exists "follows_owner_delete" on public.follows;
create policy "follows_owner_delete" on public.follows for delete using (auth.uid() = user_id);

-- ---------- COMMENTS (cualquier autenticado puede leer, para los hilos del feed) ----------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_date timestamptz default now(),
  body jsonb default '{}'::jsonb
);
alter table public.comments enable row level security;
drop policy if exists "comments_read_auth" on public.comments;
create policy "comments_read_auth" on public.comments for select using (auth.role() = 'authenticated');
drop policy if exists "comments_owner_write" on public.comments;
create policy "comments_owner_write" on public.comments for insert with check (auth.uid() = user_id);
drop policy if exists "comments_owner_delete" on public.comments;
create policy "comments_owner_delete" on public.comments for delete using (auth.uid() = user_id);

-- ---------- NOTIFICATIONS (dueño de la fila = quien la creó; cualquier
-- autenticado puede leer, porque el destinatario se guarda en body.recipient_email,
-- no en user_id — la app filtra por email en el cliente) ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_date timestamptz default now(),
  body jsonb default '{}'::jsonb
);
alter table public.notifications enable row level security;
drop policy if exists "notifications_read_auth" on public.notifications;
create policy "notifications_read_auth" on public.notifications for select using (auth.role() = 'authenticated');
drop policy if exists "notifications_insert_auth" on public.notifications;
create policy "notifications_insert_auth" on public.notifications for insert with check (auth.role() = 'authenticated');
drop policy if exists "notifications_owner_delete" on public.notifications;
create policy "notifications_owner_delete" on public.notifications for delete using (auth.uid() = user_id);

-- ---------- Storage: bucket público "uploads" para fotos y vídeos ----------
-- file_size_limit en bytes: 52428800 = 50MB — tope REAL confirmado en el proyecto
-- (Dashboard → Storage → Settings): el plan Free de Supabase fija el límite global
-- de subida en 50MB sin excepción, no editable. Solo pasando a plan Pro ($25/mes)
-- se puede subir este número; hasta entonces, subirlo aquí no tendría efecto.
insert into storage.buckets (id, name, public, file_size_limit)
values ('uploads', 'uploads', true, 52428800)
on conflict (id) do update set file_size_limit = 52428800;

drop policy if exists "uploads_public_read" on storage.objects;
create policy "uploads_public_read" on storage.objects for select using (bucket_id = 'uploads');
drop policy if exists "uploads_auth_insert" on storage.objects;
create policy "uploads_auth_insert" on storage.objects for insert
  with check (bucket_id = 'uploads' and auth.role() = 'authenticated');
drop policy if exists "uploads_auth_update" on storage.objects;
create policy "uploads_auth_update" on storage.objects for update
  using (bucket_id = 'uploads' and auth.role() = 'authenticated');

-- ---------- SHARED_TRIPS (enlace de "Compartir viaje") ----------
-- Antes el viaje entero viajaba comprimido en la URL (podía superar 20.000
-- caracteres) y apps como WhatsApp/Mensajes lo truncaban o rompían al pegarlo,
-- dando "enlace no válido". Ahora se guarda aquí y el enlace solo lleva el id
-- (corto), que cualquiera puede leer sin necesidad de sesión.
create table if not exists public.shared_trips (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  body jsonb not null default '{}'::jsonb
);
alter table public.shared_trips enable row level security;
drop policy if exists "shared_trips_public_read" on public.shared_trips;
create policy "shared_trips_public_read" on public.shared_trips for select using (true);
drop policy if exists "shared_trips_auth_insert" on public.shared_trips;
create policy "shared_trips_auth_insert" on public.shared_trips for insert
  with check (auth.role() = 'authenticated');

-- ---------- BILLING (freemium: 1 viaje gratis/mes, luego pago o suscripción) ----------
-- Solo las Edge Functions (con la service role key, que salta RLS) pueden escribir
-- aquí: ni insert ni update están permitidos para 'authenticated'. Así ningún
-- usuario puede darse a sí mismo una suscripción o créditos falsos desde el cliente.
create table if not exists public.billing (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text not null default 'none', -- 'none' | 'active' | 'canceled' | 'past_due'
  current_period_end timestamptz,
  extra_trip_credits int not null default 0,
  updated_at timestamptz default now()
);
alter table public.billing enable row level security;
drop policy if exists "billing_owner_read" on public.billing;
create policy "billing_owner_read" on public.billing for select using (auth.uid() = user_id);

-- ============================================================
--  FIN. Si todo sale en verde, la base de datos está lista.
-- ============================================================
