-- Fix 401 on signup: add INSERT policy for public.users

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'users' and policyname = 'users can insert own profile'
  ) then
    create policy "users can insert own profile"
    on public.users
    for insert
    to authenticated
    with check (auth.uid() = id);
  end if;
end $$;
