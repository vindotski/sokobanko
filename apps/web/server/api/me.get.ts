/** The visitor's guest, if they've saved anything yet (one is made only then). */
export interface Me {
  guest: { since: string } | null;
}

export default defineEventHandler((event): Me => {
  const guest = event.context.guest;
  return { guest: guest ? { since: guest.createdAt.toISOString() } : null };
});
