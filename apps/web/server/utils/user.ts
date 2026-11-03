import type { H3Event } from "h3";
import { type SessionUser, sessionUser } from "../spotcraft/session";

/** The cookie the browser keeps its Spotcraft session token in. */
export const SESSION_COOKIE = "sokobanko-token";

/**
 * The account behind the request, as Spotcraft says, or a 401. The token comes
 * from `Authorization: Bearer …`, or else the session cookie, which the
 * browser sends with every request to this server (server renders included).
 * Each call is one request to Spotcraft's `/v1/auth/get-session`; if Spotcraft
 * can't be reached, it's a 503 rather than a 401.
 */
export async function requireUser(event: H3Event): Promise<SessionUser> {
  const bearer = getHeader(event, "authorization")?.match(/^Bearer (.+)$/)?.[1];
  const token = bearer ?? getCookie(event, SESSION_COOKIE);
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
