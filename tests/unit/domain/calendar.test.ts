import { describe, expect, it } from "vitest";
import { isInMonthOf, isInMonthUpTo } from "@/src/domain/calendar";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";

// shiftYears and SEED_YEAR_SHIFT keep their tests in tests/unit/seed.test.ts, beside the
// seed they shift.
const today = fixedClock(BUSINESS_TODAY).today();

describe("the current month, in UTC (data-model.md, SPEC-overview §4.2)", () => {
  it.each([
    ["2026-08-01T00:00:00Z", true],
    ["2026-08-31T23:59:59.999Z", true],
    ["2026-07-31T23:59:59.999Z", false],
    ["2026-09-01T00:00:00Z", false],
    ["2025-08-15T12:00:00Z", false],
    // 23:30 at UTC−02:00 is already 1 September in UTC.
    ["2026-08-31T23:30:00-02:00", false],
  ])("%s is in the month of 19 Aug 2026: %s", (date, expected) => {
    expect(isInMonthOf(new Date(date), today)).toBe(expected);
  });
});

describe("on or before today, this month (US-27 AC2: calendar dates, time of day ignored)", () => {
  it.each([
    ["2026-08-01T00:00:00Z", true],
    ["2026-08-19T23:59:59.999Z", true],
    ["2026-08-20T00:00:00Z", false],
    ["2026-07-19T12:00:00Z", false],
  ])("%s counts: %s", (date, expected) => {
    expect(isInMonthUpTo(new Date(date), today)).toBe(expected);
  });
});
