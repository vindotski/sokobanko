-- Public profile for a permanent (non-anonymous) user. A row exists only once
-- the user has claimed a username.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- Reddit-style: 3-20 characters, letters, digits, underscores and hyphens.
  username text not null
    constraint profiles_username_format check (username ~ '^[A-Za-z0-9_-]{3,20}$')
);

-- Usernames are unique regardless of case; the chosen case is kept for display.
create unique index profiles_username_lower_key on public.profiles (lower(username));

alter table public.profiles enable row level security;

-- New tables are not exposed to the Data API automatically.
grant select on public.profiles to anon, authenticated;
grant insert (id, username), update (username) on public.profiles to authenticated;

create policy "Profiles are viewable by everyone"
on public.profiles for select
to anon, authenticated
using (true);

create policy "Permanent users can create their own profile"
on public.profiles for insert
to authenticated
with check (
  (select auth.uid()) = id
  and ((select auth.jwt()) ->> 'is_anonymous')::boolean is false
);

create policy "Permanent users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check (
  (select auth.uid()) = id
  and ((select auth.jwt()) ->> 'is_anonymous')::boolean is false
);
