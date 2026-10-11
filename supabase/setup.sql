-- Tales & Tidings: one-time Supabase setup.
-- Supabase dashboard -> SQL Editor -> New query -> paste this whole file -> Run.
-- Safe to run more than once.

create extension if not exists pgcrypto with schema extensions;

-- 1. Where published pages live ------------------------------------------------
create table if not exists public.pages (
  id         text primary key check (id ~ '^[A-Za-z0-9]{6,20}$'),
  data       jsonb not null check (pg_column_size(data) < 300000),
  edit_hash  text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Nobody can read or write the table directly. All access goes through the three functions below,
-- so nobody can list other people's pages, and only the maker (who holds the secret edit key) can change one.
alter table public.pages enable row level security;
revoke all on table public.pages from anon, authenticated;

create or replace function public.get_page(p_id text)
returns jsonb language sql security definer stable set search_path = public as $$
  select data from public.pages where id = p_id;
$$;

create or replace function public.create_page(p_id text, p_key text, p_data jsonb)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_id !~ '^[A-Za-z0-9]{6,20}$' then raise exception 'bad id'; end if;
  if length(coalesce(p_key, '')) < 16 then raise exception 'bad key'; end if;
  if pg_column_size(p_data) >= 300000 then raise exception 'page too large'; end if;
  insert into public.pages (id, data, edit_hash) values (p_id, p_data, encode(digest(p_key, 'sha256'), 'hex'));
end $$;

create or replace function public.update_page(p_id text, p_key text, p_data jsonb)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if pg_column_size(p_data) >= 300000 then raise exception 'page too large'; end if;
  update public.pages set data = p_data, updated_at = now()
   where id = p_id and edit_hash = encode(digest(p_key, 'sha256'), 'hex');
  return found;
end $$;

revoke all on function public.get_page(text), public.create_page(text, text, jsonb), public.update_page(text, text, jsonb) from public;
grant execute on function public.get_page(text), public.create_page(text, text, jsonb), public.update_page(text, text, jsonb) to anon, authenticated;

-- 2. Where photos and songs live ----------------------------------------------
-- Public bucket: anyone with a file's address can view it (that is how the pages show them).
-- Limits: 12 MB per file, pictures and audio only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 12582912,
        array['image/jpeg','image/png','image/webp','audio/mpeg','audio/mp3','audio/mp4','audio/x-m4a','audio/aac','audio/ogg','audio/wav','audio/x-wav'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "keepsake upload" on storage.objects;
create policy "keepsake upload" on storage.objects for insert to anon, authenticated with check (bucket_id = 'media');
