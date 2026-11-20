import { describe, expect, it } from "vitest";
import {
  DAILY_EPOCH,
  dailyLevel,
  dailyNumber,
  nextDailyAt,
  streak,
  utcDay,
} from "./daily.ts";

const ids = Array.from({ length: 10 }, (_, i) => `level-${i}`);
const dayAfter = (day: string, n: number) =>
  utcDay(new Date(Date.parse(day) + n * 86_400_000));

describe("dailyNumber", () => {
  it("starts at 1 on the epoch", () => {
    expect(dailyNumber(DAILY_EPOCH)).toBe(1);
    expect(dailyNumber(dayAfter(DAILY_EPOCH, 41))).toBe(42);
  });
});

describe("dailyLevel", () => {
  it("is the same for the same day, whatever the order of the ids", () => {
    const day = dayAfter(DAILY_EPOCH, 3);
    expect(dailyLevel(day, ids)).toBe(dailyLevel(day, [...ids].reverse()));
  });

  it("gives every level a day before any repeats", () => {
    for (const cycle of [0, 1, 7]) {
      const days = ids.map((_, i) =>
        dayAfter(DAILY_EPOCH, cycle * ids.length + i),
      );
      const chosen = days.map((day) => dailyLevel(day, ids));
      expect(new Set(chosen).size).toBe(ids.length);
    }
  });

  it("doesn't follow play order", () => {
    const days = ids.map((_, i) => dayAfter(DAILY_EPOCH, i));
    expect(days.map((day) => dailyLevel(day, ids))).not.toEqual(ids);
  });

  it("shuffles each cycle differently", () => {
    const cycle = (n: number) =>
      ids.map((_, i) => dailyLevel(dayAfter(DAILY_EPOCH, n * 10 + i), ids));
    expect(cycle(0)).not.toEqual(cycle(1));
  });

  it("has nothing to give without levels", () => {
    expect(dailyLevel(DAILY_EPOCH, [])).toBeUndefined();
  });
});

describe("streak", () => {
  const today = "2026-12-10";

  it("counts consecutive days ending today", () => {
    expect(streak(["2026-12-08", "2026-12-09", "2026-12-10"], today)).toBe(3);
  });

  it("is still alive on a day not solved yet", () => {
    expect(streak(["2026-12-08", "2026-12-09"], today)).toBe(2);
  });

  it("breaks on a missed day", () => {
    expect(streak(["2026-12-06", "2026-12-08", "2026-12-10"], today)).toBe(1);
    expect(streak(["2026-12-07", "2026-12-08"], today)).toBe(0);
  });

  it("crosses month and year ends", () => {
    expect(streak(["2026-12-31", "2027-01-01"], "2027-01-01")).toBe(2);
  });
});

describe("nextDailyAt", () => {
  it("is the coming UTC midnight", () => {
    expect(nextDailyAt(new Date("2026-12-10T23:59:59Z")).toISOString()).toBe(
      "2026-12-11T00:00:00.000Z",
    );
    expect(nextDailyAt(new Date("2026-12-10T00:00:00Z")).toISOString()).toBe(
      "2026-12-11T00:00:00.000Z",
    );
  });
});
