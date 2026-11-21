/**
 * Deletes the visitor's results (the right to erasure, Progress → Your
 * data). Their guest stays in Spotcraft's user pool, which only the pool may
 * delete; the browser signs out of it next.
 */
export default defineEventHandler(async (event) => {
  const guest = event.context.guest;
  if (!guest) return { deleted: 0 };
  return { deleted: await deleteProgress(db(), guest.id) };
});
