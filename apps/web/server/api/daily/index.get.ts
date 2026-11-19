/** Today's daily puzzle: the same level for everyone, by UTC date. */
export default defineEventHandler(async () => {
  const daily = dailyFor(await getLevels());
  if (!daily) {
    throw createError({ statusCode: 404, message: "No daily puzzle" });
  }
  return daily;
});
