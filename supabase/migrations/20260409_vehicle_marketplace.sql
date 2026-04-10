-- Vehicle marketplace production schema
-- Apply in Supabase SQL editor or migration runner

create extension if not exists pgcrypto;

-- Utilities
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.generate_listing_slug(input_title text, input_id uuid)
returns text
language sql
immutable
as $$
  select lower(
    regexp_replace(
      coalesce(nullif(trim(input_title), ''), 'anuncio') || '-' || substring(input_id::text, 1, 8),
      '[^a-zA-Z0-9]+',
      '-',
      'g'
    )
  );
$$;

create table if not exists public.vehicle_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  brand text not null,
  model text not null,
  version text,
  year smallint not null check (year between 1950 and 2100),
  year_model smallint not null check (year_model between 1950 and 2100),
  mileage integer not null check (mileage >= 0),
  price numeric(12,2) not null check (price > 0),
  transmission text not null,
  fuel text not null,
  color text not null,
  body_type text not null,
  city text not null,
  state char(2) not null,
  optional_items text[] not null default '{}',
  engine text,
  horsepower smallint,
  plate_final char(1),
  doors smallint,
  fipe_brand_code text,
  fipe_model_code text,
  fipe_year_code text,
  fipe_reference_month text,
  fipe_price numeric(12,2),
  fipe_difference_value numeric(12,2),
  fipe_difference_percent numeric(8,3),
  structured_data jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('draft', 'active', 'sold', 'archived')),
  slug text unique,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vehicle_listings_brand_model_year on public.vehicle_listings (brand, model, year_model);
create index if not exists idx_vehicle_listings_status_published on public.vehicle_listings (status, published_at desc);
create index if not exists idx_vehicle_listings_city_state on public.vehicle_listings (city, state);
create index if not exists idx_vehicle_listings_user on public.vehicle_listings (user_id);
create index if not exists idx_vehicle_listings_price on public.vehicle_listings (price);
create index if not exists idx_vehicle_listings_created_at on public.vehicle_listings (created_at desc);

create trigger trg_vehicle_listings_updated_at
before update on public.vehicle_listings
for each row
execute function public.set_updated_at();

create or replace function public.set_listing_defaults()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null then
    new.slug := public.generate_listing_slug(new.title, new.id);
  end if;

  if new.status = 'active' and new.published_at is null then
    new.published_at := now();
  end if;

  if new.fipe_price is not null then
    new.fipe_difference_value := round((new.price - new.fipe_price)::numeric, 2);
    if new.fipe_price > 0 then
      new.fipe_difference_percent := round((((new.price - new.fipe_price) / new.fipe_price) * 100)::numeric, 3);
    else
      new.fipe_difference_percent := null;
    end if;
  else
    new.fipe_difference_value := null;
    new.fipe_difference_percent := null;
  end if;

  return new;
end;
$$;

create trigger trg_vehicle_listings_defaults
before insert or update on public.vehicle_listings
for each row
execute function public.set_listing_defaults();

create table if not exists public.vehicle_listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.vehicle_listings(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  sort_order smallint not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_vehicle_listing_images_listing_sort on public.vehicle_listing_images (listing_id, sort_order);

create or replace function public.ensure_single_primary_image()
returns trigger
language plpgsql
as $$
begin
  if new.is_primary then
    update public.vehicle_listing_images
      set is_primary = false
      where listing_id = new.listing_id
        and id <> new.id
        and is_primary = true;
  end if;

  return new;
end;
$$;

create trigger trg_listing_single_primary
before insert or update on public.vehicle_listing_images
for each row
execute function public.ensure_single_primary_image();

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.vehicle_listings(id) on delete cascade,
  seller_user_id uuid not null references auth.users(id) on delete cascade,
  buyer_user_id uuid not null references auth.users(id) on delete cascade,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now(),
  unique (listing_id, seller_user_id, buyer_user_id),
  check (seller_user_id <> buyer_user_id)
);

create index if not exists idx_conversations_seller_last_message on public.conversations (seller_user_id, last_message_at desc nulls last);
create index if not exists idx_conversations_buyer_last_message on public.conversations (buyer_user_id, last_message_at desc nulls last);
create index if not exists idx_conversations_listing on public.conversations (listing_id);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_conversation_messages_conversation_created on public.conversation_messages (conversation_id, created_at asc);
create index if not exists idx_conversation_messages_sender on public.conversation_messages (sender_user_id);

create table if not exists public.conversation_reads (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create or replace function public.touch_conversation_after_message()
returns trigger
language plpgsql
as $$
declare
  sanitized text;
begin
  sanitized := regexp_replace(new.message, '\s+', ' ', 'g');

  update public.conversations
    set last_message_at = new.created_at,
        last_message_preview = left(sanitized, 140)
    where id = new.conversation_id;

  -- mark sender as read at send-time
  insert into public.conversation_reads (conversation_id, user_id, last_read_at)
  values (new.conversation_id, new.sender_user_id, new.created_at)
  on conflict (conversation_id, user_id)
  do update set last_read_at = excluded.last_read_at;

  return new;
end;
$$;

create trigger trg_touch_conversation_after_message
after insert on public.conversation_messages
for each row
execute function public.touch_conversation_after_message();

create or replace function public.sanitize_chat_message(raw text)
returns text
language plpgsql
immutable
as $$
declare
  cleaned text;
begin
  cleaned := regexp_replace(raw, '(?i)[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}', '[email oculto]', 'g');
  cleaned := regexp_replace(cleaned, '(?i)(\+?55\s?)?(\(?\d{2}\)?\s?)?(9?\d{4})[-\s]?(\d{4})', '[telefone oculto]', 'g');
  cleaned := regexp_replace(cleaned, '(?i)wa\.me/\S+|t\.me/\S+|instagram\.com/\S+|facebook\.com/\S+', '[contato externo removido]', 'g');
  return trim(cleaned);
end;
$$;

-- Read model for listings with images and seller public profile
create or replace view public.vehicle_listings_public as
select
  l.id,
  l.user_id,
  l.title,
  l.description,
  l.brand,
  l.model,
  l.version,
  l.year,
  l.year_model,
  l.mileage,
  l.price,
  l.transmission,
  l.fuel,
  l.color,
  l.body_type,
  l.city,
  l.state,
  l.optional_items,
  l.engine,
  l.horsepower,
  l.plate_final,
  l.doors,
  l.fipe_price,
  l.fipe_difference_value,
  l.fipe_difference_percent,
  l.fipe_reference_month,
  l.status,
  l.slug,
  l.published_at,
  l.created_at,
  l.updated_at,
  (
    select jsonb_agg(
      jsonb_build_object(
        'id', img.id,
        'url', img.public_url,
        'sort_order', img.sort_order,
        'is_primary', img.is_primary
      ) order by img.sort_order asc
    )
    from public.vehicle_listing_images img
    where img.listing_id = l.id
  ) as images
from public.vehicle_listings l
where l.status = 'active';

alter table public.vehicle_listings enable row level security;
alter table public.vehicle_listing_images enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.conversation_reads enable row level security;

-- Listings policies
create policy "public can view active listings"
on public.vehicle_listings
for select
using (status = 'active' or auth.uid() = user_id);

create policy "authenticated users create listings"
on public.vehicle_listings
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "owner can update own listings"
on public.vehicle_listings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "owner can delete own listings"
on public.vehicle_listings
for delete
to authenticated
using (auth.uid() = user_id);

-- Listing image policies
create policy "public can view listing images"
on public.vehicle_listing_images
for select
using (
  exists (
    select 1 from public.vehicle_listings l
    where l.id = vehicle_listing_images.listing_id
      and (l.status = 'active' or l.user_id = auth.uid())
  )
);

create policy "owner inserts listing images"
on public.vehicle_listing_images
for insert
to authenticated
with check (
  exists (
    select 1 from public.vehicle_listings l
    where l.id = vehicle_listing_images.listing_id
      and l.user_id = auth.uid()
  )
);

create policy "owner updates listing images"
on public.vehicle_listing_images
for update
to authenticated
using (
  exists (
    select 1 from public.vehicle_listings l
    where l.id = vehicle_listing_images.listing_id
      and l.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.vehicle_listings l
    where l.id = vehicle_listing_images.listing_id
      and l.user_id = auth.uid()
  )
);

create policy "owner deletes listing images"
on public.vehicle_listing_images
for delete
to authenticated
using (
  exists (
    select 1 from public.vehicle_listings l
    where l.id = vehicle_listing_images.listing_id
      and l.user_id = auth.uid()
  )
);

-- Conversations policies
create policy "participants can view conversations"
on public.conversations
for select
to authenticated
using (auth.uid() in (seller_user_id, buyer_user_id));

create policy "buyers can create conversation"
on public.conversations
for insert
to authenticated
with check (
  auth.uid() = buyer_user_id
  and auth.uid() <> seller_user_id
  and exists (
    select 1 from public.vehicle_listings l
    where l.id = conversations.listing_id
      and l.user_id = conversations.seller_user_id
      and l.status = 'active'
  )
);

create policy "participants can update conversation"
on public.conversations
for update
to authenticated
using (auth.uid() in (seller_user_id, buyer_user_id))
with check (auth.uid() in (seller_user_id, buyer_user_id));

-- Messages policies
create policy "participants can read messages"
on public.conversation_messages
for select
to authenticated
using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_messages.conversation_id
      and auth.uid() in (c.seller_user_id, c.buyer_user_id)
  )
);

create policy "participants can send messages"
on public.conversation_messages
for insert
to authenticated
with check (
  auth.uid() = sender_user_id
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_messages.conversation_id
      and auth.uid() in (c.seller_user_id, c.buyer_user_id)
  )
);

-- Reads policies
create policy "participants manage read receipts"
on public.conversation_reads
for all
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_reads.conversation_id
      and auth.uid() in (c.seller_user_id, c.buyer_user_id)
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_reads.conversation_id
      and auth.uid() in (c.seller_user_id, c.buyer_user_id)
  )
);

-- Storage bucket and policies
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-listings',
  'vehicle-listings',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "public read listing images bucket"
on storage.objects
for select
using (bucket_id = 'vehicle-listings');

create policy "authenticated upload listing images bucket"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'vehicle-listings'
  and auth.uid()::text = split_part(name, '/', 1)
);

create policy "owners update listing images bucket"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'vehicle-listings'
  and auth.uid()::text = split_part(name, '/', 1)
)
with check (
  bucket_id = 'vehicle-listings'
  and auth.uid()::text = split_part(name, '/', 1)
);

create policy "owners delete listing images bucket"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'vehicle-listings'
  and auth.uid()::text = split_part(name, '/', 1)
);
