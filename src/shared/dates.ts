/**
 * SPEC-overview §4.2, "Dates": `d MMM yyyy` in **UTC** — `2026-08-19T20:23:11Z` is
 * `19 Aug 2026` in every time zone. The month names are spelled out here rather than taken
 * from `Intl`: its en-GB data writes September as "Sept" (CLDR 48), while the format and
 * SPEC-app-shell §2.6 ("12 Sep 2026") use three letters, and Node and the three browser
 * engines need not ship the same data.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const ISO_8601 =
  /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2}))?$/;

/**
 * ISO-8601 text as the API sends it: a date, or a date and a time with its zone. The
 * built-in parser is lenient — it reads "19 August, maybe" as a day in 2001, rolls
 * 30 February into March and reads a time without a zone as local time — so anything else
 * is refused rather than written as a wrong day.
 */
function parseIso(text: string): Date | undefined {
  const [, year, month, day] = ISO_8601.exec(text) ?? [];
  if (!year || !month || !day) return undefined;
  const calendarDay = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return calendarDay.toISOString().slice(0, 10) === `${year}-${month}-${day}`
    ? new Date(text)
    : undefined;
}

/** ISO-8601 text or a `Date`, written `d MMM yyyy` in UTC. */
export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? parseIso(value) : value;
  const month = date && MONTHS[date.getUTCMonth()];
  if (!date || month === undefined) {
    throw new Error(`Date ${String(value)} is not a valid ISO-8601 date`);
  }
  return `${date.getUTCDate()} ${month} ${date.getUTCFullYear()}`;
}
