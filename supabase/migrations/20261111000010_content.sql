-- Source: docs/GEARAWAI_DB_SCHEMA_DRAFT.sql (section 0010) — split verbatim, logic unchanged
-- ---------------------------------------------------------------------
-- 0010  CONTENT
-- ---------------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  subject text not null check (char_length(subject) between 1 and 150),
  message text not null check (char_length(message) between 10 and 2000),
  status public.message_status not null default 'new',
  admin_note text, read_at timestamptz, replied_at timestamptz,
  created_at timestamptz not null default now()
);
create index contact_messages_status_idx on public.contact_messages(status, created_at desc);
create index contact_messages_email_idx on public.contact_messages(lower(email), created_at desc);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null, position text not null, description text, image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger team_members_updated_at before update on public.team_members for each row execute function public.set_updated_at();

create table public.site_settings (
  key text primary key check (key ~ '^[a-z_]+$'),
  value jsonb not null,
  description text,
  is_public boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now()
);
create trigger site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();

create or replace function public.get_setting(p_key text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select value from public.site_settings where key = p_key
$$;
