-- ============================================================
-- QRCraft — Schéma Supabase
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ============================================================

-- Table profiles (extension de auth.users)
create table if not exists profiles (
  id uuid references auth.users primary key,
  display_name text,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'pro', 'business')),
  qr_count integer default 0,
  created_at timestamptz default now()
);

-- Trigger : créer un profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS profiles
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- ============================================================

-- Table qr_codes
create table if not exists qr_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  content_type text not null,
  content_data jsonb not null default '{}',
  style_config jsonb not null default '{}',
  logo_path text,
  thumbnail_url text,
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index pour performance
create index if not exists qr_codes_user_id_idx on qr_codes(user_id);
create index if not exists qr_codes_updated_at_idx on qr_codes(updated_at desc);

-- RLS qr_codes
alter table qr_codes enable row level security;

create policy "Users CRUD own QR codes"
  on qr_codes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger : updated_at auto
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger qr_codes_updated_at
  before update on qr_codes
  for each row execute procedure public.handle_updated_at();

-- ============================================================

-- Supabase Storage bucket
insert into storage.buckets (id, name, public)
values ('qr-assets', 'qr-assets', false)
on conflict (id) do nothing;

-- Storage policies
create policy "Users upload own logos"
  on storage.objects for insert
  with check (
    bucket_id = 'qr-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users read own assets"
  on storage.objects for select
  using (
    bucket_id = 'qr-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own assets"
  on storage.objects for delete
  using (
    bucket_id = 'qr-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
