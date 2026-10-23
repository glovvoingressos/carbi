-- Cofre privado de placas + endurecimento da exposição pública dos anúncios.
--
-- Contexto: anúncios antigos gravaram a placa completa em vehicle_listings.plate_final
-- (campo exposto na view pública). Além disso, anon tinha SELECT na tabela base,
-- o que expunha VIN e outros campos internos. A leitura pública passa a ser
-- exclusivamente pela view vehicle_listings_public.

-- 1) Cofre privado: acessível apenas por service_role.
create table if not exists public.vehicle_private_identifiers (
  vehicle_id uuid primary key references public.vehicles(id) on delete cascade,
  listing_id uuid unique references public.vehicle_listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  plate_hash text not null,
  plate_encrypted text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vehicle_private_identifiers enable row level security;
revoke all on public.vehicle_private_identifiers from public, anon, authenticated;
grant select, insert, update, delete on public.vehicle_private_identifiers to service_role;

create index if not exists idx_vehicle_private_identifiers_plate_hash
  on public.vehicle_private_identifiers (plate_hash);
create index if not exists idx_vehicle_private_identifiers_user_id
  on public.vehicle_private_identifiers (user_id);

comment on table public.vehicle_private_identifiers is
  'Placas completas criptografadas. Nunca expor em views públicas; acesso somente por service_role.';

-- A chave canônica fica no Vault (criada operacionalmente). O app também aceita
-- PLATE_ENCRYPTION_KEY como fallback para ambientes locais.
create or replace function public.get_plate_encryption_key()
returns text
language sql
security definer
set search_path = vault, public
as $fn$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'plate_encryption_key'
  limit 1;
$fn$;

revoke all on function public.get_plate_encryption_key() from public, anon, authenticated;
grant execute on function public.get_plate_encryption_key() to service_role;

-- 2) Mascara qualquer placa completa remanescente antes de restringir a coluna.
update public.vehicle_listings
set plate_final = nullif(right(upper(regexp_replace(plate_final, '[^A-Za-z0-9]', '', 'g')), 1), '')
where plate_final is not null
  and (
    length(regexp_replace(plate_final, '[^A-Za-z0-9]', '', 'g')) > 1
    or btrim(plate_final) = ''
  );

-- 3) Restringe o campo público a 1 caractere. A view precisa ser recriada
--    porque depende da coluna alterada.
drop view if exists public.vehicle_listings_public;

alter table public.vehicle_listings
  alter column plate_final type varchar(1) using plate_final::varchar(1);

create view public.vehicle_listings_public as
 SELECT id,
    user_id,
    vehicle_id,
    title,
    description,
    brand,
    model,
    version,
    year,
    year_model,
    mileage,
    price,
    transmission,
    fuel,
    color,
    body_type,
    city,
    state,
    optional_items,
    engine,
    horsepower,
    plate_final,
    doors,
    fipe_price,
    fipe_difference_value,
    fipe_difference_percent,
    fipe_reference_month,
    status,
    slug,
    published_at,
    created_at,
    updated_at,
    price_updated_at,
    vehicle_type,
    truck_type,
    load_capacity,
    axles,
    truck_body_type,
    accepts_offers,
    negotiable,
    accepts_counter,
    accepts_trade,
    ( SELECT jsonb_agg(jsonb_build_object('id', img.id, 'url', img.public_url, 'sort_order', img.sort_order, 'is_primary', img.is_primary) ORDER BY img.sort_order) AS jsonb_agg
           FROM vehicle_listing_images img
          WHERE img.listing_id = l.id) AS images
   FROM vehicle_listings l
  WHERE status = 'active'::text;

alter view public.vehicle_listings_public owner to postgres;
revoke all on public.vehicle_listings_public from public, anon, authenticated;
grant select on public.vehicle_listings_public to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'vehicle_listings_plate_final_one_char'
  ) then
    alter table public.vehicle_listings
      add constraint vehicle_listings_plate_final_one_char
      check (plate_final is null or length(plate_final) = 1);
  end if;
end $$;

-- 4) A tabela base deixa de ser pública; leitura pública só pela view.
revoke all on public.vehicle_listings from anon;
revoke truncate, references, trigger on public.vehicle_listings from authenticated;

drop policy if exists "public can view active listings" on public.vehicle_listings;
drop policy if exists "owners can view own listings" on public.vehicle_listings;
create policy "owners can view own listings" on public.vehicle_listings
  for select to authenticated
  using (auth.uid() = user_id);

revoke all on public.vehicles from anon;
revoke truncate, references, trigger on public.vehicles from authenticated;

revoke insert, update, delete, truncate, references, trigger on public.vehicle_listing_images from anon;
revoke truncate, references, trigger on public.vehicle_listing_images from authenticated;

-- 5) TRUNCATE não respeita RLS; remove esse privilégio de todas as tabelas públicas.
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke truncate, references, trigger on public.%I from anon, authenticated', r.tablename);
  end loop;
  for r in select viewname from pg_views where schemaname = 'public' loop
    execute format('revoke truncate, references, trigger on public.%I from anon, authenticated', r.viewname);
  end loop;
end $$;
