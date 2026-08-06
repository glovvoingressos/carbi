-- Sync public.users profile fields (full_name, phone, cpf) from auth.users.raw_user_meta_data.
-- Root cause: handle_auth_user_created only copied id + email, so data entered at signup
-- (which lives in raw_user_meta_data) never reached public.users.

-- 1) Rewrite the insert trigger to copy metadata into the profile
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, phone, cpf)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'cpf', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.users.full_name),
        phone = coalesce(excluded.phone, public.users.phone),
        cpf = coalesce(excluded.cpf, public.users.cpf),
        updated_at = now();
  return new;
end;
$$;

-- 2) Also sync when auth.users metadata changes (e.g. admin edits, future signup flows)
create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set email = new.email,
      full_name = coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), public.users.full_name),
      phone = coalesce(nullif(new.raw_user_meta_data ->> 'phone', ''), public.users.phone),
      cpf = coalesce(nullif(new.raw_user_meta_data ->> 'cpf', ''), public.users.cpf),
      updated_at = now()
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_auth_user_updated on auth.users;
create trigger trg_auth_user_updated
after update on auth.users
for each row execute function public.handle_auth_user_updated();

-- 3) Backfill existing users from auth metadata
update public.users p
set
  full_name = coalesce(nullif(p.full_name, ''), nullif(a.raw_user_meta_data ->> 'full_name', '')),
  phone = coalesce(nullif(p.phone, ''), nullif(a.raw_user_meta_data ->> 'phone', '')),
  cpf = coalesce(nullif(p.cpf, ''), nullif(a.raw_user_meta_data ->> 'cpf', ''))
from auth.users a
where a.id = p.id;
