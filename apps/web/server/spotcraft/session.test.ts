import { describe, expect, it, vi } from "vitest";
import { sessionUser } from "./session";

const guest = { id: "u_guest1", isAnonymous: true };

describe("sessionUser", () => {
  it("is null without a token, and doesn't ask Spotcraft", async () => {
    const fetchSession = vi.fn();
    expect(await sessionUser(undefined, fetchSession)).toBeNull();
    expect(await sessionUser("", fetchSession)).toBeNull();
    expect(fetchSession).not.toHaveBeenCalled();
  });

  it("is null when Spotcraft no longer knows the session", async () => {
    expect(await sessionUser("stale", async () => null)).toBeNull();
  });

  it("lets an unreachable Spotcraft through as an error, not a dead session", async () => {
    const down = async () => {
      throw new Error("fetch failed");
    };
    await expect(sessionUser("token", down)).rejects.toThrow("fetch failed");
  });

  it("is the session's user otherwise, asked with the token", async () => {
    const fetchSession = vi.fn(async () => ({ user: guest }));
    expect(await sessionUser("token", fetchSession)).toEqual(guest);
    expect(fetchSession).toHaveBeenCalledWith("token");
  });
});
