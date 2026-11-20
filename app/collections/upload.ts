/**
 * What to do after the server answers an upload, by its status: `done` keeps
 * the run; `drop` gives up on it (the server says it doesn't solve the level,
 * breaks the undo budget, or the level is gone), so the browser drops it too;
 * `retry` tries again later (offline, the server or user pool down, too many
 * requests, or an earlier level of its collection not saved yet).
 */
export function uploadOutcome(
  status: number | undefined,
): "done" | "retry" | "drop" {
  if (status !== undefined && status >= 200 && status < 300) return "done";
  if (status === 400 || status === 404 || status === 422) return "drop";
  return "retry";
}

/**
 * How often an upload refused as locked (403) is tried again: an earlier level
 * of its collection may still be on its way, but if that one was dropped, this
 * one never unlocks on the server, and is dropped too.
 */
export const LOCKED_RETRIES = 5;

/** An upload that failed for now; the outbox tries it again later. */
export class RetryLater extends Error {
  constructor(readonly status: number | undefined) {
    super(
      status ? `Upload failed with HTTP status ${status}` : "Upload failed",
    );
    this.name = "RetryLater";
  }
}

/** The outbox's retry decision for a failed upload. */
export function shouldRetryUpload(
  error: Error,
  retries: number,
): boolean | undefined {
  if (!(error instanceof RetryLater)) return undefined;
  return error.status === 403 ? retries < LOCKED_RETRIES : true;
}
