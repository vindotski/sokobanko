import { describe, expect, it } from "vitest";
import {
  LOCKED_RETRIES,
  RetryLater,
  shouldRetryUpload,
  uploadOutcome,
} from "./upload";

describe("uploadOutcome", () => {
  it("keeps a saved run", () => {
    expect(uploadOutcome(200)).toBe("done");
  });

  it("drops a run the server refuses for good", () => {
    for (const status of [400, 404, 422]) {
      expect(uploadOutcome(status)).toBe("drop");
    }
  });

  it("retries what may work later", () => {
    for (const status of [undefined, 401, 403, 429, 500, 502, 503]) {
      expect(uploadOutcome(status)).toBe("retry");
    }
  });
});

describe("shouldRetryUpload", () => {
  it("keeps retrying while offline or the server is down", () => {
    expect(shouldRetryUpload(new RetryLater(undefined), 50)).toBe(true);
    expect(shouldRetryUpload(new RetryLater(503), 50)).toBe(true);
  });

  it("gives up on a locked level after a few tries", () => {
    expect(shouldRetryUpload(new RetryLater(403), 0)).toBe(true);
    expect(shouldRetryUpload(new RetryLater(403), LOCKED_RETRIES)).toBe(false);
  });

  it("leaves other errors to the outbox's default", () => {
    expect(shouldRetryUpload(new Error("boom"), 0)).toBeUndefined();
  });
});
