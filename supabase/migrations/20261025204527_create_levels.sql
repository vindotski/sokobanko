-- Helpers that must not be callable through the Data API.
create schema if not exists private;

-- Same rules as parseLevel() in packages/core: XSB glyphs only, at most 50x50,
-- exactly one player, at least one box, and as many goals as boxes.
create function private.is_valid_level_map(map text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  with glyphs as (select array_to_string(map, '') as s)
  select
    cardinality(map) between 1 and 50
    and array_position(map, null) is null
    and not exists (select 1 from unnest(map) as r where char_length(r) > 50)
    and s ~ '^[ #.$@*+]+$'
    -- Counts by removing the glyphs and measuring how much shorter it got.
    and char_length(s) - char_length(translate(s, '@+', '')) = 1
    and char_length(s) - char_length(translate(s, '$*', '')) >= 1
    and char_length(s) - char_length(translate(s, '$*', ''))
      = char_length(s) - char_length(translate(s, '.*+', ''))
  from glyphs
$$;

create table public.levels (
  id uuid primary key default gen_random_uuid(),
  title text not null
    constraint levels_title_length check (char_length(title) between 1 and 80),
  -- Rows of XSB glyphs, the same shape as LevelJson.map.
  map text[] not null
    constraint levels_map_valid check (private.is_valid_level_map(map)),
  -- Null for official levels; set once players can create levels.
  author_id uuid references public.profiles (id) on delete cascade,
  status text not null default 'draft'
    constraint levels_status_valid check (status in ('draft', 'published')),
  -- Curated order; levels without one sort last, by created_at.
  position integer,
  created_at timestamptz not null default now()
);

create index levels_author_id_idx on public.levels (author_id);

alter table public.levels enable row level security;

-- Read-only through the API for now; levels are added by migrations and seeds.
-- Revoke first: older stacks grant everything on new tables by default.
revoke all on public.levels from anon, authenticated;
grant select on public.levels to anon, authenticated;

create policy "Published levels are viewable by everyone"
on public.levels for select
to anon, authenticated
using (status = 'published' or author_id = (select auth.uid()));
