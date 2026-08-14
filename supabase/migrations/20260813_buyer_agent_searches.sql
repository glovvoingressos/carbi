-- Buyer agent "Procure Meu Carro": saved searches (demand) + match events
create table if not exists public.buyer_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  contact_email text not null,
  status text not null default 'active' check (status in ('active', 'paused', 'resolved', 'cancelled')),
  original_query text not null,
  criteria jsonb not null default '{}'::jsonb,
  interpretation_source text not null default 'rules' check (interpretation_source in ('rules', 'llm')),
  view_token uuid not null default gen_random_uuid(),
  match_level_min text not null default 'possivel' check (match_level_min in ('exato', 'proximo', 'possivel')),
  matched_count integer not null default 0,
  last_scan_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_buyer_searches_active on public.buyer_searches(status, created_at);
create index if not exists idx_buyer_searches_email on public.buyer_searches(contact_email);
create index if not exists idx_buyer_searches_user on public.buyer_searches(user_id);
create index if not exists idx_buyer_searches_criteria on public.buyer_searches using gin (criteria);

create table if not exists public.search_matches (
  id uuid primary key default gen_random_uuid(),
  search_id uuid not null references public.buyer_searches(id) on delete cascade,
  listing_id uuid not null references public.vehicle_listings(id) on delete cascade,
  match_level text not null check (match_level in ('exato', 'proximo', 'possivel')),
  score numeric(5,2) not null default 0,
  criteria_matched jsonb not null default '[]'::jsonb,
  deviation jsonb not null default '[]'::jsonb,
  explanation text,
  notified_email boolean not null default false,
  notified_at timestamptz,
  in_app_read boolean not null default false,
  created_at timestamptz not null default now(),
  unique (search_id, listing_id)
);

create index if not exists idx_search_matches_search on public.search_matches(search_id, created_at desc);
create index if not exists idx_search_matches_listing on public.search_matches(listing_id);
create index if not exists idx_search_matches_unread on public.search_matches(search_id) where in_app_read = false;

alter table public.buyer_searches enable row level security;
alter table public.search_matches enable row level security;

-- Buyer: owner can read/update/delete own searches; insert allowed for authenticated users.
create policy "Buyer can read own searches"
  on public.buyer_searches for select
  using (auth.uid() = user_id);

create policy "Buyer can update own searches"
  on public.buyer_searches for update
  using (auth.uid() = user_id);

create policy "Buyer can delete own searches"
  on public.buyer_searches for delete
  using (auth.uid() = user_id);

create policy "Buyer can insert own searches"
  on public.buyer_searches for insert
  with check (auth.uid() = user_id);

-- Matches: read for owner of the search; writes are service-role only.
create policy "Owner can read matches"
  on public.search_matches for select
  using (
    exists (
      select 1 from public.buyer_searches s
      where s.id = search_id and s.user_id = auth.uid()
    )
  );

-- updated_at trigger, reusing the marketplace's existing set_updated_at function
create trigger set_updated_at_buyer_searches
  before update on public.buyer_searches
  for each row execute function public.set_updated_at();

grant select on public.buyer_searches to anon, authenticated;
grant select on public.search_matches to anon, authenticated;