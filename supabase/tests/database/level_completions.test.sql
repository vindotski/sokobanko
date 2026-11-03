begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

-- Players are Spotcraft accounts, so their ids are Spotcraft's (text), not auth.users'.

-- Recording (as the server's service role, after it has checked the Spotcraft session).
set local role service_role;

select is(
  (select moves from public.record_level_completion('player_one', 'test-level', 'rrlrR')),
  5,
  'records a first completion'
);
select is(
  (select pushes from public.level_completions where user_id = 'player_one'),
  1,
  'derives pushes from the uppercase letters'
);
select is(
  (select solution from public.record_level_completion('player_one', 'test-level', 'rrrlrlR')),
  'rrlrR',
  'keeps the existing result when the new one has more moves'
);
select is(
  (select solution from public.record_level_completion('player_one', 'test-level', 'rlrrR')),
  'rrlrR',
  'keeps the existing result on a tie'
);
select is(
  (select solution from public.record_level_completion('player_one', 'test-level', 'rR')),
  'rR',
  'replaces the result when the new one has fewer moves'
);
select lives_ok(
  $sql$ select public.record_level_completion('guest_two', 'test-level', 'rR') $sql$,
  'a second player has their own completions'
);
select is(
  (select count(*)::int from public.level_completions where level_id = 'test-level'),
  2,
  'one row per player and level'
);
select throws_ok(
  $sql$ select public.record_level_completion('player_one', 'test-level', 'rx') $sql$,
  '23514', null, 'rejects letters outside LURD'
);
select throws_ok(
  $sql$ select public.record_level_completion('guest_two', 'Not A Slug', 'rR') $sql$,
  '23514', null, 'rejects a level id that is not a slug'
);
select throws_ok(
  $sql$ select public.record_level_completion('not an id!', 'test-level', 'rR') $sql$,
  '23514', null, 'rejects a user id that is not a Spotcraft id'
);

-- Direct writes must keep moves and pushes consistent with the solution.
reset role;
select throws_ok(
  $sql$ insert into public.level_completions (user_id, level_id, moves, pushes, solution)
        values ('guest_two', 'other-level', 1, 1, 'rR') $sql$,
  '23514', null, 'moves must match the solution length'
);
select throws_ok(
  $sql$ insert into public.level_completions (user_id, level_id, moves, pushes, solution)
        values ('guest_two', 'other-level', 2, 0, 'rR') $sql$,
  '23514', null, 'pushes must match the uppercase letters'
);

-- The browser's roles get nothing: only the server reads and writes completions.
set local role authenticated;
select throws_ok(
  $sql$ select * from public.level_completions $sql$,
  '42501', null, 'signed-in users cannot read completions'
);
select throws_ok(
  $sql$ select public.record_level_completion('player_one', 'test-level', 'R') $sql$,
  '42501', null, 'signed-in users cannot call record_level_completion'
);
select throws_ok(
  $sql$ insert into public.level_completions (user_id, level_id, moves, pushes, solution)
        values ('player_one', 'test-level', 1, 1, 'R') $sql$,
  '42501', null, 'signed-in users cannot insert completions'
);

reset role;
set local role anon;
select throws_ok(
  $sql$ select * from public.level_completions $sql$,
  '42501', null, 'signed-out visitors cannot read completions'
);
select throws_ok(
  $sql$ select public.record_level_completion('player_one', 'test-level', 'R') $sql$,
  '42501', null, 'signed-out visitors cannot call record_level_completion'
);

select * from finish();
rollback;
