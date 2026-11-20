/**
 * The daily puzzle: one level a day, the same for everyone, by UTC date.
 *
 * Days are counted from DAILY_EPOCH, puzzle #1. The levels are shuffled once
 * per cycle (every `ids.length` days) with a seed from the cycle's number, so
 * the order doesn't follow play order, and no level repeats until every one
 * has had its day.
 */

/** The day of puzzle #1, in UTC. */
export const DAILY_EPOCH = "2026-11-19";

const DAY_MS = 86_400_000;

/** A UTC date as `YYYY-MM-DD`. */
export function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Days from DAILY_EPOCH to `day` (`YYYY-MM-DD`): 0 for puzzle #1. */
export function dayIndex(day: string): number {
  return Math.round((Date.parse(day) - Date.parse(DAILY_EPOCH)) / DAY_MS);
}

/** The puzzle's number, from 1, as shown and shared. */
export function dailyNumber(day: string): number {
  return dayIndex(day) + 1;
}

/** When the next day's puzzle starts: the coming UTC midnight. */
export function nextDailyAt(now: Date): Date {
  return new Date(Date.parse(utcDay(now)) + DAY_MS);
}

/**
 * The level for `day`, from `ids` (any order: they're sorted first, so the
 * choice doesn't depend on how they were listed). Undefined with no levels.
 */
export function dailyLevel(day: string, ids: readonly string[]) {
  if (ids.length === 0) return undefined;
  const index = dayIndex(day);
  const cycle = Math.floor(index / ids.length);
  const order = shuffle([...ids].sort(), cycle);
  return order[index - cycle * ids.length];
}

/**
 * Consecutive days solved, ending today, or yesterday when today's isn't
 * solved yet (the streak is still alive until the day ends). `days` are the
 * solved days, as `YYYY-MM-DD`, in any order.
 */
export function streak(days: readonly string[], today: string): number {
  const solved = new Set(days);
  let day = solved.has(today) ? today : previousDay(today);
  let count = 0;
  while (solved.has(day)) {
    count++;
    day = previousDay(day);
  }
  return count;
}

function previousDay(day: string): string {
  return utcDay(new Date(Date.parse(day) - DAY_MS));
}

/** Fisher–Yates with a small seeded generator (mulberry32). */
function shuffle<T>(items: T[], seed: number): T[] {
  let state = (seed + 0x5eed) >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j] as T, items[i] as T];
  }
  return items;
}
