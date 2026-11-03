-- Accounts now live in Spotcraft (its decisions 45 and 47): every visitor is a Spotcraft guest,
-- and Sokobanko's server checks the session with Spotcraft before it touches completions. So
-- completions belong to Spotcraft user ids, and only the server reads and writes them, with
-- the secret key. Supabase Auth isn't used any more.

-- The old rows belong to Supabase guests no one can sign in as again.
truncate public.level_completions;

-- The browser no longer reads completions; the server does, as the service role.
drop policy "Users can view their own completions" on public.level_completions;
revoke select on public.level_completions from authenticated;

-- Spotcraft's ids, not Supabase's auth.users.
alter table public.level_completions
  drop constraint level_completions_user_id_fkey,
  alter column user_id type text,
  add constraint level_completions_user_id_format
    check (user_id ~ '^[A-Za-z0-9_-]{1,64}$');

-- The same function, taking a Spotcraft id.
drop function public.record_level_completion(uuid, text, text);

create function public.record_level_completion(
  p_user_id text,
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

-- Only the server, which checks the session and replays the solution first, may record them.
revoke execute on function public.record_level_completion(text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_level_completion(text, text, text)
  to service_role;

-- Usernames were for Supabase accounts, and nothing reads them.
drop table public.profiles;
