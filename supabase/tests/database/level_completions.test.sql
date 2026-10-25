begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

insert into auth.users (id, is_anonymous) values
  ('00000000-0000-0000-0000-000000000001', false),
  ('00000000-0000-0000-0000-000000000002', true);
insert into public.levels (id, title, map, status) values
  ('00000000-0000-0000-0000-00000000000a', 'Test', array['#@ $.#'], 'published');

-- Recording (as the server's service role).
set local role service_role;

select is(
  (select moves from public.record_level_completion(
    '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'rrlrR')),
  5,
  'records a first completion'
);
select is(
  (select pushes from public.level_completions
   where user_id = '00000000-0000-0000-0000-000000000001'),
  1,
  'derives pushes from the uppercase letters'
);
select is(
  (select solution from public.record_level_completion(
    '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'rrrlrlR')),
  'rrlrR',
  'keeps the existing result when the new one has more moves'
);
select is(
  (select solution from public.record_level_completion(
    '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'rlrrR')),
  'rrlrR',
  'keeps the existing result on a tie'
);
select is(
  (select solution from public.record_level_completion(
    '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'rR')),
  'rR',
  'replaces the result when the new one has fewer moves'
);
select lives_ok(
  $sql$ select public.record_level_completion(
    '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', 'rR') $sql$,
  'anonymous users can have completions'
);
select throws_ok(
  $sql$ select public.record_level_completion(
    '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'rx') $sql$,
  '23514', null, 'rejects letters outside LURD'
);
select throws_ok(
  $sql$ select public.record_level_completion(
    '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000b', 'rR') $sql$,
  '23503', null, 'rejects unknown levels'
);

-- Direct writes must keep moves and pushes consistent with the solution.
reset role;
select throws_ok(
  $sql$ insert into public.level_completions (user_id, level_id, moves, pushes, solution)
        values ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', 1, 1, 'rR') $sql$,
  '23514', null, 'moves must match the solution length'
);
select throws_ok(
  $sql$ insert into public.level_completions (user_id, level_id, moves, pushes, solution)
        values ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', 2, 0, 'rR') $sql$,
  '23514', null, 'pushes must match the uppercase letters'
);

-- Reading and writing as a signed-in user.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated", "is_anonymous": false}';

select results_eq(
  $sql$ select user_id from public.level_completions $sql$,
  array['00000000-0000-0000-0000-000000000001'::uuid],
  'users see only their own completions'
);
select throws_ok(
  $sql$ select public.record_level_completion(
    '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'R') $sql$,
  '42501', null, 'users cannot call record_level_completion'
);
select throws_ok(
  $sql$ insert into public.level_completions (user_id, level_id, moves, pushes, solution)
        values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 1, 1, 'R') $sql$,
  '42501', null, 'users cannot insert completions'
);
select throws_ok(
  $sql$ update public.level_completions set moves = 1 $sql$,
  '42501', null, 'users cannot edit completions'
);
select throws_ok(
  $sql$ delete from public.level_completions $sql$,
  '42501', null, 'users cannot delete completions'
);

-- Signed-out visitors.
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select throws_ok(
  $sql$ select * from public.level_completions $sql$,
  '42501', null, 'signed-out visitors cannot read completions'
);

select * from finish();
rollback;
