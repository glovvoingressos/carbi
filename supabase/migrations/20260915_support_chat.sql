create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  visitor_token_hash text not null unique,
  visitor_name text null,
  visitor_email text null,
  status text not null default 'open',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_conversations_status_check
    check (status in ('open', 'waiting_visitor', 'closed'))
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  sender_type text not null,
  sender_name text null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint support_messages_sender_type_check
    check (sender_type in ('visitor', 'admin'))
);

create index if not exists idx_support_conversations_last_message_at
  on public.support_conversations (last_message_at desc);

create index if not exists idx_support_messages_conversation_id
  on public.support_messages (conversation_id, created_at asc);

create or replace function public.set_support_conversation_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_support_conversations_updated_at
  on public.support_conversations;

create trigger trg_support_conversations_updated_at
before update on public.support_conversations
for each row
execute function public.set_support_conversation_updated_at();

alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;

revoke all on table public.support_conversations, public.support_messages
  from public, anon, authenticated;
