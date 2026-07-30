-- Backfill email from auth.users into public.users for existing users
UPDATE public.users p
SET email = COALESCE(NULLIF(p.email, ''), a.email)
FROM auth.users a
WHERE a.id = p.id
  AND (p.email IS NULL OR p.email = '');
