-- Keep the authentication confirmation timestamp on the profile row so the
-- restricted admin directory can paginate and filter without exposing auth.users.
alter table public.users
  add column if not exists email_confirmed_at timestamptz;

create index if not exists idx_public_users_created_at
  on public.users (created_at desc);

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, phone, cpf, email_confirmed_at)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'cpf', ''),
    new.email_confirmed_at
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.users.full_name),
        phone = coalesce(excluded.phone, public.users.phone),
        cpf = coalesce(excluded.cpf, public.users.cpf),
        email_confirmed_at = excluded.email_confirmed_at,
        updated_at = now();
  return new;
end;
$$;

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
      email_confirmed_at = new.email_confirmed_at,
      updated_at = now()
  where id = new.id;
  return new;
end;
$$;

update public.users as profile
set email = auth_user.email,
    full_name = coalesce(profile.full_name, nullif(auth_user.raw_user_meta_data ->> 'full_name', '')),
    phone = coalesce(profile.phone, nullif(auth_user.raw_user_meta_data ->> 'phone', '')),
    cpf = coalesce(profile.cpf, nullif(auth_user.raw_user_meta_data ->> 'cpf', '')),
    email_confirmed_at = auth_user.email_confirmed_at
from auth.users as auth_user
where auth_user.id = profile.id;

-- The profile table is user-editable, but these columns are authored by Auth.
-- Keep its email, creation date, and confirmation date authoritative for admin views.
create or replace function public.protect_user_auth_fields_from_profile_updates()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select auth.uid()) is not null then
    new.email := old.email;
    new.created_at := old.created_at;
    new.email_confirmed_at := old.email_confirmed_at;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_user_auth_fields on public.users;
create trigger trg_protect_user_auth_fields
before update on public.users
for each row execute function public.protect_user_auth_fields_from_profile_updates();

-- A server-only ledger prevents repeated browser requests from sending duplicate
-- signup notifications to the admin inbox.
create table if not exists public.admin_signup_notification_events (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'processing'
    check (status in ('processing', 'sent', 'failed')),
  attempts integer not null default 1 check (attempts > 0),
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.admin_signup_notification_events enable row level security;
revoke all on table public.admin_signup_notification_events from anon, authenticated;
grant all on table public.admin_signup_notification_events to service_role;
