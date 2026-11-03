import { createSpotcraftAuth } from "~/lib/spotcraft-auth";

// Every visitor gets a Spotcraft session, a guest at first, so progress can be
// saved before signing up. Runs only in the browser, so server renders and
// crawlers don't create guests. Not awaited: the app renders right away, and
// useAccount() and the token update once the session arrives.
export default defineNuxtPlugin(() => {
  const token = useSessionToken();
  const auth = createSpotcraftAuth(
    useRuntimeConfig().public.spotcraftUrl,
    token,
  );
  const account = useAccount();

  const startAsGuest = () =>
    auth
      .signInAnonymously()
      .then((guest) => {
        account.value = guest;
      })
      .catch((error: Error) =>
        console.error("Anonymous sign-in failed:", error.message),
      );

  // A stored token whose session is gone (expired, signed out elsewhere, or
  // its account deleted) answers null: start over as a new guest. Other
  // errors, like being offline, keep the token.
  if (!token.value) startAsGuest();
  else
    auth
      .session()
      .then((current) => {
        if (current) account.value = current;
        else {
          auth.forget();
          return startAsGuest();
        }
      })
      .catch((error: Error) =>
        console.error("Session check failed:", error.message),
      );

  return { provide: { spotcraftAuth: auth } };
});
