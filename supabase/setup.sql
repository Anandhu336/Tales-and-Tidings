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
-- Which account a page belongs to (empty for pages made without signing in).
alter table public.pages add column if not exists owner uuid references auth.users(id) on delete set null;
create index if not exists pages_owner_idx on public.pages (owner);

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
  insert into public.pages (id, data, edit_hash, owner) values (p_id, p_data, encode(digest(p_key, 'sha256'), 'hex'), auth.uid());
end $$;

create or replace function public.update_page(p_id text, p_key text, p_data jsonb)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if pg_column_size(p_data) >= 300000 then raise exception 'page too large'; end if;
  -- the maker can save with the secret edit key, or by being signed in to the account that owns the page
  update public.pages set data = p_data, updated_at = now()
   where id = p_id and (edit_hash = encode(digest(coalesce(p_key, ''), 'sha256'), 'hex')
                        or (owner is not null and owner = auth.uid()));
  return found;
end $$;

revoke all on function public.get_page(text), public.create_page(text, text, jsonb), public.update_page(text, text, jsonb) from public;
grant execute on function public.get_page(text), public.create_page(text, text, jsonb), public.update_page(text, text, jsonb) to anon, authenticated;

-- 1b. Accounts: the dashboard of pages that belong to the signed-in person --------
create or replace function public.my_pages()
returns table (id text, data jsonb, created_at timestamptz, updated_at timestamptz)
language sql security definer stable set search_path = public as $$
  select id, data, created_at, updated_at from public.pages
   where auth.uid() is not null and owner = auth.uid()
   order by updated_at desc limit 200;
$$;

-- Move a page made on this device (proved by its secret edit key) into the signed-in account.
create or replace function public.claim_page(p_id text, p_key text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  update public.pages set owner = auth.uid()
   where id = p_id and owner is null and edit_hash = encode(digest(coalesce(p_key, ''), 'sha256'), 'hex');
  return found or exists (select 1 from public.pages where id = p_id and owner = auth.uid());
end $$;

create or replace function public.delete_my_page(p_id text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  delete from public.pages where id = p_id and owner = auth.uid();
  return found;
end $$;

revoke all on function public.my_pages(), public.claim_page(text, text), public.delete_my_page(text) from public, anon;
grant execute on function public.my_pages(), public.claim_page(text, text), public.delete_my_page(text) to authenticated;

-- 1c. Drafts: unfinished pages saved to the signed-in account ---------------------
create table if not exists public.drafts (
  id         text primary key check (id ~ '^[A-Za-z0-9]{6,20}$'),
  owner      uuid not null references auth.users(id) on delete cascade,
  data       jsonb not null check (pg_column_size(data) < 300000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists drafts_owner_idx on public.drafts (owner);
alter table public.drafts enable row level security;
revoke all on table public.drafts from anon, authenticated;

create or replace function public.save_draft(p_id text, p_data jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  if p_id !~ '^[A-Za-z0-9]{6,20}$' then raise exception 'bad id'; end if;
  if pg_column_size(p_data) >= 300000 then raise exception 'draft too large'; end if;
  if not exists (select 1 from public.drafts where id = p_id)
     and (select count(*) from public.drafts where owner = auth.uid()) >= 50 then
    raise exception 'You have 50 drafts already. Delete a few from your dashboard first.';
  end if;
  insert into public.drafts (id, owner, data) values (p_id, auth.uid(), p_data)
  on conflict (id) do update set data = excluded.data, updated_at = now() where drafts.owner = auth.uid();
  return found;
end $$;

create or replace function public.get_draft(p_id text)
returns jsonb language sql security definer stable set search_path = public as $$
  select data from public.drafts where id = p_id and owner = auth.uid();
$$;

create or replace function public.my_drafts()
returns table (id text, data jsonb, created_at timestamptz, updated_at timestamptz)
language sql security definer stable set search_path = public as $$
  select id, data, created_at, updated_at from public.drafts
   where auth.uid() is not null and owner = auth.uid()
   order by updated_at desc;
$$;

create or replace function public.delete_draft(p_id text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  delete from public.drafts where id = p_id and owner = auth.uid();
  return found;
end $$;

revoke all on function public.save_draft(text, jsonb), public.get_draft(text), public.my_drafts(), public.delete_draft(text) from public, anon;
grant execute on function public.save_draft(text, jsonb), public.get_draft(text), public.my_drafts(), public.delete_draft(text) to authenticated;

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

-- Signed-in people can clean up the photos and songs they uploaded (used when they delete a page or draft).
-- Files uploaded without an account have no owner and can only be removed from the Supabase dashboard.
drop policy if exists "own media read" on storage.objects;
create policy "own media read" on storage.objects for select to authenticated using (bucket_id = 'media' and owner_id = (select auth.uid())::text);
drop policy if exists "own media delete" on storage.objects;
create policy "own media delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and owner_id = (select auth.uid())::text);
