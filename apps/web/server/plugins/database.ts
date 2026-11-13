/**
 * Migrates the database at boot (the migrations also write the levels), so
 * the first player doesn't wait for it; requests wait on the same promise
 * (databaseReady).
 */
export default defineNitroPlugin((nitroApp) => {
  databaseReady().then(
    () => console.info("Database ready"),
    (error: unknown) => console.error("Database not ready:", error),
  );
  nitroApp.hooks.hook("close", closeBackend);
});
