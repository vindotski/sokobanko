import type { Guest } from "@spotcraft/kit";
import { guestMiddleware } from "@spotcraft/kit/nuxt";

declare module "h3" {
  interface H3EventContext {
    /** The visitor's guest (Spotcraft's kit); null until they save something. */
    guest?: Guest | null;
  }
}

/**
 * Puts the visitor's guest on `event.context.guest`. Reads (GET, HEAD) never
 * create one; any write does, so a guest exists only once someone saves a
 * result. The kit sets the HttpOnly session cookie, takes the client address
 * from the X-Forwarded-For entry Spotcraft's Caddy adds (an IPv6 address
 * counts as its /64), and answers 429 over the guest limit.
 */
export default defineEventHandler(guestMiddleware(backend));
