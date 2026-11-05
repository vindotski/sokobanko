import type { H3Event } from "h3";
import { type SessionUser, sessionUser } from "../spotcraft/session";

/** The cookie the browser keeps its Spotcraft session token in. */
export const SESSION_COOKIE = "sokobanko-token";

/**
 * The player's Spotcraft session token: `Authorization: Bearer …`, or else the
 * session cookie, which the browser sends with every request to this server
 * (server renders included).
 */
export function sessionToken(event: H3Event): string | undefined {
  const bearer = getHeader(event, "authorization")?.match(/^Bearer (.+)$/)?.[1];
  return bearer ?? getCookie(event, SESSION_COOKIE);
}

/**
 * The account behind the request's session token (sessionToken), as Spotcraft
 * says, or a 401.
 * Each call is one request to Spotcraft's `/v1/auth/get-session`; if Spotcraft
 * can't be reached, it's a 503 rather than a 401.
 */
export async function requireUser(event: H3Event): Promise<SessionUser> {
  const token = sessionToken(event);
  if (!token) throw createError({ statusCode: 401, message: "No session" });
  const { spotcraftUrl } = useRuntimeConfig(event);
  const user = await sessionUser(token, (t) =>
    $fetch("/v1/auth/get-session", {
      baseURL: spotcraftUrl,
      headers: { authorization: `Bearer ${t}` },
    }),
  ).catch(() => {
    throw createError({ statusCode: 503, message: "Spotcraft unavailable" });
  });
  if (!user) throw createError({ statusCode: 401, message: "Session expired" });
  return user;
}
