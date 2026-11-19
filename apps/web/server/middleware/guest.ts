declare module "h3" {
  interface H3EventContext {
    /** The visitor's guest in Spotcraft's user pool; null before their first save. */
    guest?: { id: string } | null;
  }
}

/** Built files and other static assets need no session. */
const ASSET = /^\/(?:_nuxt\/|__nuxt|favicon)|\.[a-z0-9]+$/i;

/**
 * Puts the visitor's guest on `event.context.guest`, from the user pool's
 * session cookie (spotkit asks the pool once per session, then keeps the
 * answer until its token expires). The browser makes the guest itself, before
 * the first save (pages/play/[id].vue). If the pool can't answer, pages still
 * render as for a new visitor, but saving fails.
 */
export default defineEventHandler(async (event) => {
  if (ASSET.test(event.path.split("?")[0] ?? "")) return;
  const request = new Request(getRequestURL(event), { headers: event.headers });
  try {
    const user = await userPool().user(request);
    event.context.guest = user ? { id: user.id } : null;
  } catch (error) {
    if (event.method !== "GET" && event.method !== "HEAD") {
      throw createError({
        statusCode: 503,
        message: "Can't reach the user pool; try again soon",
      });
    }
    console.error("The user pool did not answer:", error);
    event.context.guest = null;
  }
});
