begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

insert into auth.users (id, is_anonymous) values
  ('00000000-0000-0000-0000-000000000001', false),
  ('00000000-0000-0000-0000-000000000002', false),
  ('00000000-0000-0000-0000-000000000003', true);

-- Username format (checked as the table owner, so RLS is not involved).
select throws_ok(
  $$ insert into public.profiles values ('00000000-0000-0000-0000-000000000001', 'ab') $$,
  '23514', null, 'rejects usernames shorter than 3 characters'
);
select throws_ok(
  $$ insert into public.profiles values ('00000000-0000-0000-0000-000000000001', repeat('a', 21)) $$,
  '23514', null, 'rejects usernames longer than 20 characters'
);
select throws_ok(
  $$ insert into public.profiles values ('00000000-0000-0000-0000-000000000001', 'has space') $$,
  '23514', null, 'rejects spaces'
);
select throws_ok(
  $$ insert into public.profiles values ('00000000-0000-0000-0000-000000000001', 'dot.name') $$,
  '23514', null, 'rejects punctuation other than _ and -'
);
select throws_ok(
  $$ insert into public.profiles values ('00000000-0000-0000-0000-000000000001', 'émile') $$,
  '23514', null, 'rejects non-ASCII letters'
);

-- A permanent user.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated", "is_anonymous": false}';

select lives_ok(
  $$ insert into public.profiles values ('00000000-0000-0000-0000-000000000001', 'Some_User-1') $$,
  'permanent users can claim a username'
);
select throws_ok(
  $$ insert into public.profiles values ('00000000-0000-0000-0000-000000000002', 'not_mine') $$,
  '42501', null, 'users cannot create a profile for someone else'
);
select lives_ok(
  $$ update public.profiles set username = 'Renamed' where id = '00000000-0000-0000-0000-000000000001' $$,
  'users can rename themselves'
);
select throws_ok(
  $$ update public.profiles set id = '00000000-0000-0000-0000-000000000002' $$,
  '42501', null, 'users cannot change the profile id'
);

-- A second permanent user.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated", "is_anonymous": false}';

select throws_ok(
  $$ insert into public.profiles values ('00000000-0000-0000-0000-000000000002', 'rEnAmEd') $$,
  '23505', null, 'usernames are unique regardless of case'
);
select lives_ok(
  $$ insert into public.profiles values ('00000000-0000-0000-0000-000000000002', 'abc') $$,
  'accepts 3-character usernames'
);
update public.profiles set username = 'hijacked' where id = '00000000-0000-0000-0000-000000000001';
select is(
  (select username from public.profiles where id = '00000000-0000-0000-0000-000000000001'),
  'Renamed',
  'users cannot rename someone else'
);

-- An anonymous user.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000003", "role": "authenticated", "is_anonymous": true}';

select throws_ok(
  $$ insert into public.profiles values ('00000000-0000-0000-0000-000000000003', 'guest') $$,
  '42501', null, 'anonymous users cannot claim a username'
);
select is(
  -- Only this test's users, so seeded profiles don't affect the count.
  (select count(*)::int from public.profiles where id::text like '00000000-0000-0000-0000-%'),
  2,
  'anonymous users can read profiles'
);

-- Signed-out visitors.
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select is(
  -- Only this test's users, so seeded profiles don't affect the count.
  (select count(*)::int from public.profiles where id::text like '00000000-0000-0000-0000-%'),
  2,
  'signed-out visitors can read profiles'
);
select throws_ok(
  $$ insert into public.profiles values ('00000000-0000-0000-0000-000000000003', 'sneaky') $$,
  '42501', null, 'signed-out visitors cannot create profiles'
);

select * from finish();
rollback;
