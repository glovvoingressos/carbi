create or replace function public.fipe_reference_sort_key(p_reference text)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  v_reference text;
  v_parts text[];
  v_month integer;
  v_year integer;
begin
  if p_reference is null then return null; end if;

  v_reference := translate(lower(trim(p_reference)), 'áàâãéêíóôõúç', 'aaaaeeiooouc');
  v_parts := regexp_match(v_reference, '^([0-9]{4})-([0-9]{2})$');
  if v_parts is not null then
    v_year := v_parts[1]::integer;
    v_month := v_parts[2]::integer;
  else
    v_parts := regexp_match(v_reference, '^([0-9]{2})/([0-9]{4})$');
    if v_parts is not null then
      v_month := v_parts[1]::integer;
      v_year := v_parts[2]::integer;
    else
      v_parts := regexp_match(v_reference, '^([a-z]+)(?:/| de )([0-9]{4})$');
      if v_parts is null then return null; end if;
      v_year := v_parts[2]::integer;
      v_month := case v_parts[1]
        when 'janeiro' then 1 when 'fevereiro' then 2 when 'marco' then 3
        when 'abril' then 4 when 'maio' then 5 when 'junho' then 6
        when 'julho' then 7 when 'agosto' then 8 when 'setembro' then 9
        when 'outubro' then 10 when 'novembro' then 11 when 'dezembro' then 12
        else null end;
    end if;
  end if;

  if v_year < 1900 or v_year > 2200 or v_month < 1 or v_month > 12 then return null; end if;
  return v_year * 100 + v_month;
end;
$$;

create or replace function public.claim_due_private_vehicle_fipe_refreshes(p_limit integer)
returns table (
  vehicle_id uuid,
  plate text,
  fipe_last_refresh_attempt_at timestamptz,
  fipe_next_refresh_at timestamptz,
  fipe_refresh_attempt_count smallint,
  fipe_refresh_attempt_month text
)
language sql
security definer
set search_path = public
as $$
  with due as (
    select p.vehicle_id
      from public.vehicle_private_identifiers p
     where p.fipe_next_refresh_at <= now()
       and exists (
         select 1 from public.vehicle_listings l
          where l.vehicle_id = p.vehicle_id and l.status = 'active'
       )
     order by p.fipe_next_refresh_at asc, p.vehicle_id asc
     limit least(greatest(coalesce(p_limit, 25), 1), 100)
     for update of p skip locked
  )
  update public.vehicle_private_identifiers p
     set fipe_next_refresh_at = now() + interval '30 minutes'
    from due
   where p.vehicle_id = due.vehicle_id
  returning p.vehicle_id, p.plate, p.fipe_last_refresh_attempt_at,
            p.fipe_next_refresh_at, p.fipe_refresh_attempt_count,
            p.fipe_refresh_attempt_month;
$$;

create or replace function public.apply_monthly_fipe_snapshot(
  p_vehicle_id uuid,
  p_expected_vehicle_price numeric,
  p_expected_vehicle_reference text,
  p_fipe_price numeric,
  p_fipe_reference_month text,
  p_allow_same_reference boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_vehicle_reference text;
  v_current_vehicle_price numeric;
  v_expected_key integer;
  v_next_key integer;
begin
  if p_fipe_price is null or p_fipe_price <= 0 then return false; end if;
  v_next_key := public.fipe_reference_sort_key(p_fipe_reference_month);
  if v_next_key is null then return false; end if;

  select fipe_price, fipe_reference_month
    into v_current_vehicle_price, v_current_vehicle_reference
    from public.vehicles
   where id = p_vehicle_id
   for update;
  if not found then return false; end if;

  if v_current_vehicle_price is distinct from p_expected_vehicle_price
     or v_current_vehicle_reference is distinct from p_expected_vehicle_reference then
    return false;
  end if;

  v_expected_key := public.fipe_reference_sort_key(v_current_vehicle_reference);
  if p_allow_same_reference then
    if v_expected_key is null or v_next_key <> v_expected_key then return false; end if;
  elsif v_expected_key is not null and v_next_key <= v_expected_key then
    return false;
  end if;

  -- Lock active listing rows and refuse to replace any snapshot that is newer
  -- than the incoming month or has an unknown month with a positive price.
  perform l.id
    from public.vehicle_listings l
   where l.vehicle_id = p_vehicle_id and l.status = 'active'
   order by l.id
   for update;

  if not exists (select 1 from public.vehicle_listings l where l.vehicle_id = p_vehicle_id and l.status = 'active')
     or exists (
       select 1 from public.vehicle_listings l
        where l.vehicle_id = p_vehicle_id and l.status = 'active'
          and l.fipe_price > 0
          and (public.fipe_reference_sort_key(l.fipe_reference_month) is null
            or public.fipe_reference_sort_key(l.fipe_reference_month) > v_next_key)
     ) then
    return false;
  end if;

  update public.vehicles
     set fipe_price = p_fipe_price,
         fipe_reference_month = p_fipe_reference_month
   where id = p_vehicle_id;

  update public.vehicle_listings
     set fipe_price = p_fipe_price,
         fipe_reference_month = p_fipe_reference_month
   where vehicle_id = p_vehicle_id and status = 'active';

  return true;
end;
$$;

revoke all on function public.fipe_reference_sort_key(text) from public, anon, authenticated;
revoke all on function public.claim_due_private_vehicle_fipe_refreshes(integer) from public, anon, authenticated;
revoke all on function public.apply_monthly_fipe_snapshot(uuid, numeric, text, numeric, text, boolean) from public, anon, authenticated;
grant execute on function public.claim_due_private_vehicle_fipe_refreshes(integer) to service_role;
grant execute on function public.apply_monthly_fipe_snapshot(uuid, numeric, text, numeric, text, boolean) to service_role;
