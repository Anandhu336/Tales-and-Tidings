-- Tales & Blooms: the admin page (admin/). Run once, after setup.sql.
-- Supabase dashboard -> SQL Editor -> New query -> paste this whole file -> Run. Safe to run more than once.
-- Then make yourself an admin (see SETUP.md, "The admin page").

-- 1. Who is an admin ------------------------------------------------------------
create table if not exists public.admins (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on table public.admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select auth.uid() is not null and exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 2. Site content the admin edits (the bouquet shop lives under the key 'blooms') ----------
-- Everyone can read it (the shop page shows it); only admins can change it.
create table if not exists public.site_content (
  key        text primary key check (key ~ '^[a-z0-9-]{1,40}$'),
  data       jsonb not null check (pg_column_size(data) < 500000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.site_content enable row level security;
revoke all on table public.site_content from anon, authenticated;

create or replace function public.get_content(p_key text)
returns jsonb language sql security definer stable set search_path = public as $$
  select data from public.site_content where key = p_key;
$$;

create or replace function public.admin_save_content(p_key text, p_data jsonb)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare t timestamptz := now();
begin
  if not public.is_admin() then raise exception 'Only admins can do this.'; end if;
  if p_key !~ '^[a-z0-9-]{1,40}$' then raise exception 'bad key'; end if;
  if pg_column_size(p_data) >= 500000 then raise exception 'Too much to save at once.'; end if;
  insert into public.site_content (key, data, updated_at, updated_by) values (p_key, p_data, t, auth.uid())
  on conflict (key) do update set data = excluded.data, updated_at = t, updated_by = auth.uid();
  return t;
end $$;

-- Remove saved content, so the page goes back to the built-in file (blooms/shop-data.js).
create or replace function public.admin_reset_content(p_key text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only admins can do this.'; end if;
  delete from public.site_content where key = p_key;
  return found;
end $$;

-- When the content was last saved, and by whom (shown on the admin page).
create or replace function public.admin_content_info(p_key text)
returns table (updated_at timestamptz, updated_by_email text)
language sql security definer stable set search_path = public as $$
  select c.updated_at, u.email::text from public.site_content c left join auth.users u on u.id = c.updated_by
   where c.key = p_key and public.is_admin();
$$;

-- 3. Invitation pages, for the admin ------------------------------------------------
create or replace function public.admin_stats()
returns jsonb language plpgsql security definer stable set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only admins can do this.'; end if;
  return jsonb_build_object(
    'pages',       (select count(*) from public.pages),
    'pages_30d',   (select count(*) from public.pages where created_at > now() - interval '30 days'),
    'drafts',      (select count(*) from public.drafts),
    'accounts',    (select count(*) from auth.users),
    'accounts_30d',(select count(*) from auth.users where created_at > now() - interval '30 days'));
end $$;

-- Every published page, newest first. p_search matches the page id, the owner's email or any text in the page.
create or replace function public.admin_pages(p_search text default '', p_limit int default 30, p_offset int default 0)
returns table (id text, data jsonb, owner_email text, created_at timestamptz, updated_at timestamptz, total bigint)
language plpgsql security definer stable set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only admins can do this.'; end if;
  return query
    select p.id, p.data, u.email::text, p.created_at, p.updated_at, count(*) over ()
      from public.pages p left join auth.users u on u.id = p.owner
     where coalesce(p_search, '') = ''
        or p.id ilike '%' || p_search || '%'
        or u.email ilike '%' || p_search || '%'
        or p.data::text ilike '%' || p_search || '%'
     order by p.updated_at desc
     limit least(greatest(coalesce(p_limit, 30), 1), 100) offset greatest(coalesce(p_offset, 0), 0);
end $$;

create or replace function public.admin_delete_page(p_id text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only admins can do this.'; end if;
  delete from public.pages where id = p_id;
  return found;
end $$;

revoke all on function public.get_content(text) from public;
grant execute on function public.get_content(text) to anon, authenticated;
revoke all on function public.admin_save_content(text, jsonb), public.admin_reset_content(text), public.admin_content_info(text),
  public.admin_stats(), public.admin_pages(text, int, int), public.admin_delete_page(text) from public, anon;
grant execute on function public.admin_save_content(text, jsonb), public.admin_reset_content(text), public.admin_content_info(text),
  public.admin_stats(), public.admin_pages(text, int, int), public.admin_delete_page(text) to authenticated;

-- 4. Photos: admins can list and remove any file (to clean up a deleted page's photos and songs) ----
-- Uploading bouquet photos uses the normal upload rule from setup.sql (they go in media/blooms/).
drop policy if exists "admin media read" on storage.objects;
create policy "admin media read" on storage.objects for select to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists "admin media delete" on storage.objects;
create policy "admin media delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());

notify pgrst, 'reload schema';
