-- ============================================================
--  WADDLE · Esquema de base de datos para Supabase
--  Pega TODO esto en: Supabase → SQL Editor → New query → Run
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

-- ---------- Entidades genéricas (id, user_id, created_date, body jsonb) ----------
do $$
declare t text;
begin
  foreach t in array array['trips','stamps','trip_photos','posts','follows','comments','notifications']
  loop
    execute format($f$
      create table if not exists public.%I (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
        created_date timestamptz default now(),
        body jsonb default '{}'::jsonb
      );
      alter table public.%I enable row level security;
    $f$, t, t);
  end loop;
end $$;

-- ---------- Políticas: el dueño tiene acceso total a sus filas ----------
do $$
declare t text;
begin
  foreach t in array array['trips','stamps','trip_photos','posts','follows','comments','notifications']
  loop
    -- SELECT: el dueño puede ver sus propias filas
    execute format('drop policy if exists "%s_owner_read" on public.%I;', t, t);
    execute format($f$
      create policy "%s_owner_read" on public.%I for select
      using (auth.uid() = user_id);
    $f$, t, t);
    -- INSERT, UPDATE, DELETE: solo el dueño
    execute format('drop policy if exists "%s_owner_write" on public.%I;', t, t);
    execute format($f$
      create policy "%s_owner_write" on public.%I for insert with check (auth.uid() = user_id);
      create policy "%s_owner_update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
      create policy "%s_owner_delete" on public.%I for delete using (auth.uid() = user_id);
    $f$, t, t);
  end loop;
end $$;

-- ---------- Lectura pública para lo social ----------
-- Posts: visibles para todos si son públicos (o del propio usuario)
drop policy if exists "posts_public_read" on public.posts;
create policy "posts_public_read" on public.posts for select
  using (coalesce(body->>'visibility','public') = 'public' or auth.uid() = user_id);

-- Comentarios y follows: lectura para usuarios autenticados (para feeds y contadores)
drop policy if exists "comments_read_auth" on public.comments;
create policy "comments_read_auth" on public.comments for select using (auth.role() = 'authenticated');
drop policy if exists "follows_read_auth" on public.follows;
create policy "follows_read_auth" on public.follows for select using (auth.role() = 'authenticated');

-- ---------- Storage: bucket público "uploads" para fotos ----------
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

drop policy if exists "uploads_public_read" on storage.objects;
create policy "uploads_public_read" on storage.objects for select using (bucket_id = 'uploads');
drop policy if exists "uploads_auth_insert" on storage.objects;
create policy "uploads_auth_insert" on storage.objects for insert
  with check (bucket_id = 'uploads' and auth.role() = 'authenticated');
drop policy if exists "uploads_auth_update" on storage.objects;
create policy "uploads_auth_update" on storage.objects for update
  using (bucket_id = 'uploads' and auth.role() = 'authenticated');

-- ============================================================
--  FIN. Si todo sale en verde, la base de datos está lista.
-- ============================================================
