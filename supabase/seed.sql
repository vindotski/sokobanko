-- Local development data, applied by `supabase db reset`. Never run in production.

-- admin@example.com / 0000, email already confirmed. The password is below
-- minimum_password_length, which is only enforced on sign-up, not on login.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  -- Auth expects empty strings here, not NULL.
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'admin@example.com',
  extensions.crypt('0000', extensions.gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

insert into auth.identities (
  user_id,
  provider_id,
  provider,
  identity_data,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'email',
  '{"sub": "a0000000-0000-4000-8000-000000000001", "email": "admin@example.com", "email_verified": true}',
  now(),
  now(),
  now()
);

insert into public.profiles (id, username) values
  ('a0000000-0000-4000-8000-000000000001', 'admin');

-- Official levels.
insert into public.levels (id, title, map, status, position) values
  (
    'b0000000-0000-4000-8000-000000000001',
    'First Push',
    array['#######', '#@ $ .#', '#######'],
    'published',
    1
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    'Two Boxes',
    array[' #####', '##   #', '#@$$ #', '#  ..#', '######'],
    'published',
    2
  ),
  (
    -- From DoctorLai/sokoban-web (MIT).
    'b0000000-0000-4000-8000-000000000003',
    'Hello World!',
    array['##########', '####....##', '#  $$$$###', '#  @   ###', '##########'],
    'published',
    3
  ),
  (
    -- 30x20 and mostly empty: bigger than the screen, for testing the camera.
    'b0000000-0000-4000-8000-000000000004',
    'Big Room',
    array[
      '##############################',
      '#@                           #',
      '#  $                         #',
      '#                            #',
      '#                            #',
      '#                            #',
      '#                            #',
      '#                            #',
      '#                            #',
      '#                            #',
      '#                            #',
      '#                            #',
      '#                            #',
      '#                            #',
      '#                            #',
      '#                            #',
      '#                            #',
      '#                            #',
      '#                           .#',
      '##############################'
    ],
    'published',
    4
  );
