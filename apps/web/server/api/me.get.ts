/** Whether the visitor has saved anything yet (a guest exists only after that). */
export default defineEventHandler((event) => {
  const guest = event.context.guest;
  return { guest: guest ? { since: guest.createdAt.toISOString() } : null };
});
