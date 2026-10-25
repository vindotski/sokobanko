-- A user's best verified solution for a level. Written only by the server,
-- after it has replayed the solution; clients can read their own rows.
create table public.level_completions (
  user_id uuid not null references auth.users (id) on delete cascade,
  level_id uuid not null references public.levels (id) on delete cascade,
  moves integer not null,
  pushes integer not null,
  -- LURD letters; uppercase letters are pushes.
  solution text not null
    constraint level_completions_solution_format check (solution ~ '^[lurdLURD]+$'),
  completed_at timestamptz not null default now(),
  primary key (user_id, level_id),
  constraint level_completions_moves_match
    check (moves = char_length(solution)),
  constraint level_completions_pushes_match
    check (pushes = char_length(regexp_replace(solution, '[^LURD]', '', 'g')) and pushes > 0)
);

-- The primary key covers user_id; level_id needs its own index.
create index level_completions_level_id_idx on public.level_completions (level_id);

alter table public.level_completions enable row level security;

revoke all on public.level_completions from anon, authenticated;
grant select on public.level_completions to authenticated;
grant select, insert, update on public.level_completions to service_role;

create policy "Users can view their own completions"
on public.level_completions for select
to authenticated
using ((select auth.uid()) = user_id);

-- Stores a completion, keeping the existing row unless the new one has fewer
-- moves. Returns the user's best completion for the level.
create function public.record_level_completion(
  p_user_id uuid,
  p_level_id uuid,
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
revoke execute on function public.record_level_completion(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.record_level_completion(uuid, uuid, text)
  to service_role;
