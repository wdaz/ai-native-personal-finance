import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { formatDate } from "@/src/shared/dates";

// SPEC-overview §4.2 writes dates in UTC. Run in a zone where 20:23Z is already the next
// local day (UTC+14), so a formatter that used local time would fail here and not only on
// a machine east of Greenwich.
const zone = process.env.TZ;
beforeAll(() => {
  process.env.TZ = "Pacific/Kiritimati";
});
afterAll(() => {
  // Assigning `undefined` would store the text "undefined".
  if (zone === undefined) delete process.env.TZ;
  else process.env.TZ = zone;
});

describe("formatDate (SPEC-overview §4.2: `d MMM yyyy`, UTC)", () => {
  it("writes 20:23Z on the UTC day, though it is the next day locally", () => {
    expect(new Date("2026-08-19T20:23:11Z").getDate()).toBe(20);
    expect(formatDate("2026-08-19T20:23:11Z")).toBe("19 Aug 2026");
  });

  it("converts an offset to UTC first", () => {
    expect(formatDate("2026-08-19T23:30:00-02:00")).toBe("20 Aug 2026");
  });

  it("accepts a Date as well as ISO text", () => {
    expect(formatDate(new Date(Date.UTC(2026, 6, 2, 9, 25, 51)))).toBe("2 Jul 2026");
  });

  it.each([
    [1, "Jan"],
    [2, "Feb"],
    [3, "Mar"],
    [4, "Apr"],
    [5, "May"],
    [6, "Jun"],
    [7, "Jul"],
    [8, "Aug"],
    [9, "Sep"],
    [10, "Oct"],
    [11, "Nov"],
    [12, "Dec"],
  ])("writes month %d with three letters: %s", (month, name) => {
    const iso = `2026-${String(month).padStart(2, "0")}-01T00:00:00Z`;
    expect(formatDate(iso)).toBe(`1 ${name} 2026`);
  });

  it("writes September with three letters, not Intl en-GB's 'Sept' (owner decision, T-03 plan gate)", () => {
    expect(formatDate("2026-09-30T23:59:59Z")).toBe("30 Sep 2026");
  });

  it("keeps the last moment of December in December and in its year", () => {
    expect(formatDate("2026-12-31T23:59:59.999Z")).toBe("31 Dec 2026");
  });

  it("accepts a date without a time", () => {
    expect(formatDate("2026-08-19")).toBe("19 Aug 2026");
  });

  it.each([
    // JavaScript's own parser reads this as a day in 2001.
    "19 August, maybe",
    // …rolls this into 2 March…
    "2026-02-30T00:00:00Z",
    // …and reads a time without a zone as local time.
    "2026-08-19T20:23:11",
    "2026-08-19T25:00:00Z",
    "",
  ])("refuses %j, which is not an ISO-8601 date with its zone", (text) => {
    expect(() => formatDate(text)).toThrow(
      `Date ${JSON.stringify(text)} is not a valid ISO-8601 date`,
    );
  });

  it("refuses an invalid Date", () => {
    expect(() => formatDate(new Date(Number.NaN))).toThrow("is not a valid ISO-8601 date");
  });
});
