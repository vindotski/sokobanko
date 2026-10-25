-- Older stacks grant every privilege on new tables to anon and authenticated by
-- default, which made the grants in create_profiles additive. Reset them to
-- exactly what the API needs; RLS policies are unchanged.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant insert (id, username), update (username) on public.profiles to authenticated;
