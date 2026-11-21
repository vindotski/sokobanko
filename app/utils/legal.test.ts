import { describe, expect, it } from "vitest";
import { addressLines } from "./legal";

describe("addressLines", () => {
  it("splits on newlines or a literal \\n", () => {
    expect(addressLines("Ulica 1\n10000 Zagreb")).toEqual([
      "Ulica 1",
      "10000 Zagreb",
    ]);
    expect(addressLines("Ulica 1\\n10000 Zagreb\\nCroatia")).toEqual([
      "Ulica 1",
      "10000 Zagreb",
      "Croatia",
    ]);
  });

  it("drops blank lines and spaces", () => {
    expect(addressLines("  Ulica 1 \r\n\n 10000 Zagreb ")).toEqual([
      "Ulica 1",
      "10000 Zagreb",
    ]);
  });

  it("is empty when not set", () => {
    expect(addressLines("")).toEqual([]);
    expect(addressLines(undefined)).toEqual([]);
  });
});
