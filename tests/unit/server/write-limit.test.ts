import { describe, expect, it } from "vitest";
import { evaluateWrites } from "@/src/server/write-limit";

const NOW = new Date("2026-08-19T12:00:00.000Z");
const WINDOW = 60_000;
const ago = (ms: number) => new Date(NOW.getTime() - ms);

describe("evaluateWrites — SPEC-write-path 2.10 (NFR-S4)", () => {
  it("lets the max-th write through: 29 prior writes of 30", () => {
    expect(evaluateWrites(29, ago(10_000), NOW, 30, WINDOW)).toEqual({
      limited: false,
      retryAfter: 0,
    });
  });

  it("limits the next one, until the oldest counted write leaves the window", () => {
    expect(evaluateWrites(30, ago(10_000), NOW, 30, WINDOW)).toEqual({
      limited: true,
      retryAfter: 50,
    });
  });

  it("rounds the wait up and never says 0 seconds at the window's edge", () => {
    expect(evaluateWrites(30, ago(59_500), NOW, 30, WINDOW).retryAfter).toBe(1);
    expect(evaluateWrites(30, ago(60_000), NOW, 30, WINDOW).retryAfter).toBe(1);
    expect(evaluateWrites(30, ago(10_001), NOW, 30, WINDOW).retryAfter).toBe(50);
  });

  it("is never limited with no write counted", () => {
    expect(evaluateWrites(0, null, NOW, 1, WINDOW).limited).toBe(false);
  });
});
