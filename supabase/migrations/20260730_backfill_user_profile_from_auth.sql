-- Backfill user profile fields from auth.users metadata into public.users
-- This migrates existing users whose cpf/phone/full_name were stored only in auth metadata.

UPDATE public.users p
SET
  full_name = COALESCE(NULLIF(p.full_name, ''), COALESCE((a.raw_user_meta_data->>'full_name'), p.full_name)),
  phone = COALESCE(NULLIF(p.phone, ''), (a.raw_user_meta_data->>'phone')),
  cpf = COALESCE(NULLIF(p.cpf, ''), (a.raw_user_meta_data->>'cpf'))
FROM auth.users a
WHERE a.id = p.id
  AND a.raw_user_meta_data IS NOT NULL
  AND (
    (p.full_name IS NULL OR p.full_name = '')
    OR (p.phone IS NULL OR p.phone = '')
    OR (p.cpf IS NULL OR p.cpf = '')
  );
