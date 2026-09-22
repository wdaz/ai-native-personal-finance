/**
 * ADR-0005: business time is fixed and reaches the domain only through a `Clock`. "Today" is
 * 19 Aug 2026 in production and in tests alike (NFR-D1, PRD OQ-4), so nothing in
 * `src/domain` or `src/server` reads the wall clock (lint rule, eslint.config.mjs).
 */
export type Clock = { today(): Date };

/** NFR-D1: "today" = 2026-08-19, current month = August 2026. */
export const BUSINESS_TODAY = "2026-08-19";

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A clock that always answers the same calendar day, at 00:00 UTC. Each call returns a new
 * `Date`, so a caller that mutates the one it was given cannot move the clock.
 */
export function fixedClock(isoDate: string): Clock {
  const [, year, month, day] = CALENDAR_DATE.exec(isoDate) ?? [];
  const ms = Date.UTC(Number(year), Number(month) - 1, Number(day));
  // Date.UTC rolls 2026-02-30 over into March; reading the date back refuses it instead.
  if (!year || !month || !day || new Date(ms).toISOString().slice(0, 10) !== isoDate) {
    throw new Error(`Clock date "${isoDate}" is not a calendar date (YYYY-MM-DD)`);
  }
  return { today: () => new Date(ms) };
}
