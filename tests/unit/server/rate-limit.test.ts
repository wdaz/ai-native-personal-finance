import { describe, expect, it } from "vitest";
import { RATE_LIMIT_WINDOW_MS, evaluateAttempts } from "@/src/server/rate-limit";

const now = new Date("2026-08-19T12:00:00Z");

describe("evaluateAttempts", () => {
  it("allows the 10th failure (not yet limited)", () => {
    const result = evaluateAttempts(10, now, new Date(now.getTime() - 60_000));
    expect(result.limited).toBe(false);
  });

  it("limits on the 11th failure", () => {
    const result = evaluateAttempts(11, now, new Date(now.getTime() - 60_000));
    expect(result.limited).toBe(true);
  });

  it("retryAfter counts from the oldest counted failure, rounded up to whole seconds", () => {
    const oldest = new Date(now.getTime() - 1_000); // 1s into the 15m window
    const result = evaluateAttempts(11, now, oldest);
    const expectedMs = RATE_LIMIT_WINDOW_MS - 1_000;
    expect(result.retryAfter).toBe(Math.ceil(expectedMs / 1000));
  });

  it("zero failures is never limited, regardless of oldestFailureAt", () => {
    expect(evaluateAttempts(0, now, null).limited).toBe(false);
  });
});
