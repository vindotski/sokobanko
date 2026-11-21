-- Roles and schemas, as Spotcraft's servers and `spotcraft dev` make them: one
-- shared database, `apps`, where the user pool's role owns `auth` and the
-- app's role owns `app_sokobanko`. Postgres runs this once, on a fresh volume.

-- Every app role joins this group. The pool grants it SELECT and REFERENCES on
-- auth.users, so the app can read guests and point its foreign key at them.
CREATE ROLE spotcraft_app NOLOGIN;
CREATE ROLE spotcraft_auth LOGIN PASSWORD 'self-host-auth-password';
CREATE ROLE app_sokobanko LOGIN CONNECTION LIMIT 20 PASSWORD 'self-host-app-password';
GRANT spotcraft_app TO app_sokobanko;

CREATE DATABASE apps;
REVOKE ALL ON DATABASE apps FROM PUBLIC;
GRANT CONNECT ON DATABASE apps TO spotcraft_auth, app_sokobanko;
ALTER ROLE app_sokobanko IN DATABASE apps SET search_path = app_sokobanko;

\c apps
REVOKE ALL ON SCHEMA public FROM PUBLIC;
CREATE SCHEMA auth AUTHORIZATION spotcraft_auth;
CREATE SCHEMA app_sokobanko AUTHORIZATION app_sokobanko;
