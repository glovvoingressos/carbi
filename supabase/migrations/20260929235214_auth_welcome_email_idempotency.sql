-- Keep the post-confirmation welcome email idempotent.
-- This marker is only written by the server with the service role; clients
-- should never use it as a source of truth for account state.
alter table public.users
  add column if not exists welcome_email_sent_at timestamptz;
