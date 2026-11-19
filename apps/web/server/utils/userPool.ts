import { spotkit } from "@kodentuzo/spotkit";

let instance: ReturnType<typeof spotkit> | undefined;

/**
 * Spotcraft's user pool, as seen from this server: who a request comes from
 * (spotkit). Made on first use from AUTH_URL, AUTH_ISSUER and AUTH_JWKS_URL,
 * which Spotcraft sets and `spotcraft dev` writes to .env.
 */
export function userPool(): ReturnType<typeof spotkit> {
  instance ??= spotkit();
  return instance;
}
