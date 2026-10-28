// Every visitor gets a session so progress can be saved before signing up.
// Runs only in the browser, so server renders and crawlers don't create users.
export default defineNuxtPlugin({
  name: "anonymous-auth",
  dependsOn: ["supabase"],
  setup() {
    const auth = useSupabaseClient().auth;

    // Not awaited: the app renders right away and useSupabaseUser() updates
    // once the session arrives.
    const signIn = () =>
      auth.signInAnonymously().then(({ error }) => {
        if (error) console.error("Anonymous sign-in failed:", error.message);
      });

    // The supabase plugin has already restored any existing session.
    if (!useSupabaseSession().value) {
      signIn();
      return;
    }

    // A restored session can still belong to a user that no longer exists,
    // e.g. after a database reset or a deleted account. Its token stays valid,
    // so only the auth server can tell; start over as a new guest if so.
    // Other errors, like being offline, keep the session.
    auth.getUser().then(async ({ error }) => {
      if (error?.code !== "user_not_found") return;
      await auth.signOut({ scope: "local" });
      await signIn();
    });
  },
});
