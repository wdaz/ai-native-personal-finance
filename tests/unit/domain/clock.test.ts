import { describe, expect, it } from "vitest";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";

describe("Clock (ADR-0005, NFR-D1)", () => {
  it("fixes business time at 19 Aug 2026 (NFR-D1)", () => {
    expect(BUSINESS_TODAY).toBe("2026-08-19");
  });

  it("answers the calendar day it was given, at 00:00 UTC", () => {
    expect(fixedClock(BUSINESS_TODAY).today().toISOString()).toBe("2026-08-19T00:00:00.000Z");
  });

  it("cannot be moved by a caller that mutates the date it was given", () => {
    const clock = fixedClock("2026-08-19");
    clock.today().setUTCFullYear(1999);
    expect(clock.today().toISOString()).toBe("2026-08-19T00:00:00.000Z");
  });

  it("accepts 29 February in a leap year", () => {
    expect(fixedClock("2028-02-29").today().toISOString()).toBe("2028-02-29T00:00:00.000Z");
  });

  it.each([
    "2026-02-29",
    "2026-02-30",
    "2026-13-01",
    "2026-8-19",
    "19 Aug 2026",
    "2026-08-19T00:00:00Z",
    "",
  ])("refuses %j, which is not a calendar date", (isoDate) => {
    expect(() => fixedClock(isoDate)).toThrow("is not a calendar date (YYYY-MM-DD)");
  });
});
