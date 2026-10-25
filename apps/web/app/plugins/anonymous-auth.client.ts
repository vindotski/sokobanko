// Every visitor gets a session so progress can be saved before signing up.
// Runs only in the browser, so server renders and crawlers don't create users.
export default defineNuxtPlugin({
  name: "anonymous-auth",
  dependsOn: ["supabase"],
  setup() {
    // The supabase plugin has already restored any existing session.
    if (useSupabaseSession().value) return;

    // Not awaited: the app renders right away and useSupabaseUser() updates
    // once the session arrives.
    useSupabaseClient()
      .auth.signInAnonymously()
      .then(({ error }) => {
        if (error) console.error("Anonymous sign-in failed:", error.message);
      });
  },
});
