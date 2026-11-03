-- Levels now live in Spotcraft, as Markdown in the sokobanko project, and the game's server
-- reads them from there (Spotcraft's roadmap, stage 2, step 13). Completions stay here, keyed
-- by the level's slug, the last segment of its path (levels/first-push → first-push).

alter table public.level_completions
  drop constraint level_completions_level_id_fkey;

drop index public.level_completions_level_id_idx;

-- The slugs are file names in Spotcraft's levels/ folder.
alter table public.level_completions
  alter column level_id type text using level_id::text,
  add constraint level_completions_level_id_format
    check (level_id ~ '^[a-z0-9][a-z0-9-]{0,99}$');

create index level_completions_level_id_idx on public.level_completions (level_id);

drop table public.levels;
drop function private.is_valid_level_map(text[]);

-- Same as before, with the level's slug instead of its uuid. The server checks that the level
-- exists in Spotcraft before calling it.
drop function public.record_level_completion(uuid, uuid, text);

create function public.record_level_completion(
  p_user_id uuid,
  p_level_id text,
  p_solution text
)
returns public.level_completions
language sql
security invoker
set search_path = ''
as $$
  insert into public.level_completions as c (user_id, level_id, moves, pushes, solution)
  values (
    p_user_id,
    p_level_id,
    char_length(p_solution),
    char_length(regexp_replace(p_solution, '[^LURD]', '', 'g')),
    p_solution
  )
  on conflict (user_id, level_id) do update
    set moves = excluded.moves,
        pushes = excluded.pushes,
        solution = excluded.solution,
        completed_at = now()
    where excluded.moves < c.moves;

  select * from public.level_completions
  where user_id = p_user_id and level_id = p_level_id;
$$;

-- Only the server, which verifies solutions first, may record them.
revoke execute on function public.record_level_completion(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.record_level_completion(uuid, text, text)
  to service_role;
