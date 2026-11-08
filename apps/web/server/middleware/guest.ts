import { type Guest, GuestLimitError } from "@spotcraft/kit";

declare module "h3" {
  interface H3EventContext {
    /** The visitor's guest (Spotcraft's kit); null until they save something. */
    guest?: Guest | null;
  }
}

/** Built files and other static assets need no session. */
const ASSET = /^\/(?:_nuxt\/|__nuxt|favicon)|\.[a-z0-9]+$/i;

/**
 * Finds the visitor's guest from the session cookie, and puts it on
 * `event.context.guest`. Reads (GET, HEAD) never create one; any write does,
 * so a guest exists only once someone saves a result. The kit's headers
 * set or refresh the cookie (HttpOnly; the browser never sees the token).
 */
export default defineEventHandler(async (event) => {
  if (ASSET.test(event.path.split("?")[0] ?? "")) return;
  const request = new Request(getRequestURL(event), { headers: event.headers });
  const reading = event.method === "GET" || event.method === "HEAD";
  let session: Awaited<ReturnType<ReturnType<typeof backend>["currentGuest"]>>;
  try {
    session = reading
      ? await backend().currentGuest(request)
      : await backend().guest(request, {
          // Behind Spotcraft's Caddy, which sets X-Forwarded-For itself.
          clientAddress:
            getRequestIP(event, { xForwardedFor: true }) ?? "unknown",
        });
  } catch (error) {
    if (error instanceof GuestLimitError) {
      setResponseHeader(event, "retry-after", error.retryAfterSeconds);
      throw createError({
        statusCode: 429,
        message: "Too many new players from here; try again soon",
      });
    }
    throw error;
  }
  event.context.guest = session.guest;
  for (const cookie of session.headers.getSetCookie()) {
    appendResponseHeader(event, "set-cookie", cookie);
  }
});
