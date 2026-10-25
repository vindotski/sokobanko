begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

-- Map rules, matching packages/core/src/level.test.ts (as the table owner, so
-- RLS is not involved). $sql$ quoting because maps contain "$$".
select lives_ok(
  $sql$ insert into public.levels (title, map) values ('ok', array['#####', '#.$$#', '# *+#', '#####']) $sql$,
  'accepts a map using every glyph'
);
select throws_ok(
  $sql$ insert into public.levels (title, map) values ('t', '{}') $sql$,
  '23514', null, 'rejects an empty map'
);
select throws_ok(
  $sql$ insert into public.levels (title, map) values ('t', array['#####', '#$. #', '#####']) $sql$,
  '23514', null, 'rejects a map with no player'
);
select throws_ok(
  $sql$ insert into public.levels (title, map) values ('t', array['#####', '#@$.@#', '#####']) $sql$,
  '23514', null, 'rejects a map with two players'
);
select throws_ok(
  $sql$ insert into public.levels (title, map) values ('t', array['#####', '#@$.x#', '#####']) $sql$,
  '23514', null, 'rejects unknown glyphs'
);
select throws_ok(
  $sql$ insert into public.levels (title, map) values ('t', array['####', '#@ #', '####']) $sql$,
  '23514', null, 'rejects a map with no boxes'
);
select throws_ok(
  $sql$ insert into public.levels (title, map) values ('t', array['#####', '#@$$.#', '#####']) $sql$,
  '23514', null, 'rejects more boxes than goals'
);
select throws_ok(
  $sql$ insert into public.levels (title, map) values ('t', array['#@$.#', repeat('#', 51)]) $sql$,
  '23514', null, 'rejects rows longer than 50'
);
select throws_ok(
  $sql$ insert into public.levels (title, map) values ('t', array['#@$.#'] || array_fill('#'::text, array[50])) $sql$,
  '23514', null, 'rejects more than 50 rows'
);
select throws_ok(
  $sql$ insert into public.levels (title, map) values ('t', array['#@$.#', null]) $sql$,
  '23514', null, 'rejects null rows'
);
select throws_ok(
  $sql$ insert into public.levels (title, map) values ('', array['#@$.#']) $sql$,
  '23514', null, 'rejects an empty title'
);
select throws_ok(
  $sql$ insert into public.levels (title, map) values (repeat('a', 81), array['#@$.#']) $sql$,
  '23514', null, 'rejects titles longer than 80'
);

-- Visibility.
delete from public.levels;
insert into auth.users (id, is_anonymous) values
  ('00000000-0000-0000-0000-000000000001', false),
  ('00000000-0000-0000-0000-000000000002', false),
  ('00000000-0000-0000-0000-000000000003', true);
insert into public.profiles (id, username) values
  ('00000000-0000-0000-0000-000000000001', 'author');
insert into public.levels (title, map, status, author_id) values
  ('Official', array['#@$.#'], 'published', null),
  ('Official draft', array['#@$.#'], 'draft', null),
  ('My draft', array['#@$.#'], 'draft', '00000000-0000-0000-0000-000000000001');

set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select results_eq(
  $sql$ select title from public.levels order by title $sql$,
  array['Official'],
  'signed-out visitors see only published levels'
);
select throws_ok(
  $sql$ insert into public.levels (title, map) values ('t', array['#@$.#']) $sql$,
  '42501', null, 'signed-out visitors cannot create levels'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000003", "role": "authenticated", "is_anonymous": true}';
select results_eq(
  $sql$ select title from public.levels order by title $sql$,
  array['Official'],
  'anonymous users see only published levels'
);

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated", "is_anonymous": false}';
select results_eq(
  $sql$ select title from public.levels order by title $sql$,
  array['Official'],
  'users do not see other authors'' drafts'
);

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated", "is_anonymous": false}';
select results_eq(
  $sql$ select title from public.levels order by title $sql$,
  array['My draft', 'Official'],
  'authors see their own drafts'
);
select throws_ok(
  $sql$ insert into public.levels (title, map) values ('t', array['#@$.#']) $sql$,
  '42501', null, 'users cannot create levels yet'
);
select throws_ok(
  $sql$ update public.levels set title = 'edited' $sql$,
  '42501', null, 'users cannot edit levels, even their own'
);
select throws_ok(
  $sql$ delete from public.levels $sql$,
  '42501', null, 'users cannot delete levels, even their own'
);
select throws_ok(
  $sql$ select private.is_valid_level_map(array['#@$.#']) $sql$,
  '42501', null, 'the validation helper is not reachable by API roles'
);

select * from finish();
rollback;
