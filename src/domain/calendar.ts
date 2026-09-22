/**
 * Calendar arithmetic in UTC (SPEC-overview §4.2: dates are UTC). Business rules compare
 * calendar dates, not instants: US-27 AC2 says "calendar dates; time of day ignored".
 */

/** NFR-D3: "all dates shifted +2 years (2024 → 2026) at seed time". */
export const SEED_YEAR_SHIFT = 2;

const UTC_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})(T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)$/;

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/**
 * Adds whole calendar years to a UTC timestamp written as text. 29 February lands on
 * 28 February when the target year has no leap day (SPEC-reset-and-test-support §2.1).
 */
export function shiftYears(timestamp: string, years: number): string {
  const [, year, month, day, time] = UTC_TIMESTAMP.exec(timestamp) ?? [];
  if (!year || !month || !day || !time) {
    throw new Error(`Seed date "${timestamp}" is not a UTC ISO-8601 timestamp`);
  }
  const shifted = Number(year) + years;
  const shiftedDay = month === "02" && day === "29" && !isLeapYear(shifted) ? "28" : day;
  return `${String(shifted).padStart(4, "0")}-${month}-${shiftedDay}${time}`;
}

/** True when `date` falls in the same UTC calendar month as `today`. */
export const isInMonthOf = (date: Date, today: Date): boolean =>
  date.getUTCFullYear() === today.getUTCFullYear() && date.getUTCMonth() === today.getUTCMonth();

/** True when `date` falls in `today`'s UTC month, on or before `today`'s day (US-27 AC2). */
export const isInMonthUpTo = (date: Date, today: Date): boolean =>
  isInMonthOf(date, today) && date.getUTCDate() <= today.getUTCDate();
