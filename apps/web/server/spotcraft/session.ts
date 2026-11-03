/** The account behind a Spotcraft session, as `/v1/auth/get-session` returns it. */
export interface SessionUser {
  id: string;
  isAnonymous: boolean;
  email?: string;
  name?: string;
}

/**
 * The user behind `token`, or null: no token, or a session Spotcraft no
 * longer knows (it answers null). If Spotcraft can't be asked, the error goes
 * through, so it isn't mistaken for a dead session. Spotcraft checks the
 * token; this only asks (Spotcraft's decision 47).
 */
export async function sessionUser(
  token: string | null | undefined,
  fetchSession: (
    token: string,
  ) => Promise<{ user: SessionUser } | null | undefined>,
): Promise<SessionUser | null> {
  if (!token) return null;
  return (await fetchSession(token))?.user ?? null;
}
