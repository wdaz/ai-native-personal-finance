import { describe, expect, it } from "vitest";
import {
  BILL_SORTS,
  BILL_STATUSES,
  parseRecurringBillsQuery,
  RECURRING_BILLS_Q_MAX,
} from "@/src/shared/recurring-bills-query";
import { TRANSACTION_SORTS } from "@/src/shared/transactions-query";

const lenient = (search: string) =>
  parseRecurringBillsQuery(new URLSearchParams(search), { strict: false });
const strict = (search: string) =>
  parseRecurringBillsQuery(new URLSearchParams(search), { strict: true });

const SORT_MESSAGE = `sort must be one of: ${BILL_SORTS.join(", ")}`;
const STATUS_MESSAGE = `status must be one of: ${BILL_STATUSES.join(", ")}`;
const Q_MESSAGE = `q must be at most ${RECURRING_BILLS_Q_MAX} characters`;
const DEFAULT = { q: undefined, sort: "latest", status: undefined };

describe("SPEC-recurring-bills 2.2–2.3: parseRecurringBillsQuery", () => {
  it("2.1: shares Transactions' six sort slugs, and the three statuses in US-27 AC2's order", () => {
    expect(BILL_SORTS).toBe(TRANSACTION_SORTS);
    expect(BILL_STATUSES).toEqual(["paid", "dueSoon", "upcoming"]);
  });

  it("2.3: the strict messages are the spec's words", () => {
    expect([SORT_MESSAGE, Q_MESSAGE, STATUS_MESSAGE]).toEqual([
      "sort must be one of: latest, oldest, a-to-z, z-to-a, highest, lowest",
      "q must be at most 60 characters",
      "status must be one of: paid, dueSoon, upcoming",
    ]);
  });

  it("US-30 reads no parameter as the default view: no search, latest, every status", () => {
    for (const parse of [lenient, strict]) {
      expect(parse("")).toEqual({ query: DEFAULT, issues: [], message: "" });
    }
  });

  it("US-29 US-30 reads every valid parameter; only the strict API reads status", () => {
    expect(strict("q=co&sort=highest&status=dueSoon").query).toEqual({
      q: "co",
      sort: "highest",
      status: "dueSoon",
    });
    expect(lenient("q=co&sort=highest&status=dueSoon").query).toEqual({
      q: "co",
      sort: "highest",
      status: undefined,
    });
  });

  it.each(BILL_SORTS)("US-30 AC1 reads sort=%s in both modes", (sort) => {
    for (const parse of [lenient, strict]) expect(parse(`sort=${sort}`).query.sort).toBe(sort);
  });

  it.each(["q=", "sort=", "status=", "q=%20%20%20", "q=+"])(
    "reads the empty value %s as absent in both modes",
    (search) => {
      for (const parse of [lenient, strict]) {
        expect(parse(search)).toEqual({ query: DEFAULT, issues: [], message: "" });
      }
    },
  );

  it("US-29 AC1 trims the search, keeps its inner spaces, and reads + and %20 alike", () => {
    for (const parse of [lenient, strict]) {
      expect(parse("q=%20%20spa%20%26%20w%20%20").query.q).toBe("spa & w");
      expect(parse("q=spa+%26+w").query.q).toBe("spa & w");
    }
  });

  it("reads a repeated parameter as its first value, from URLSearchParams and from a record", () => {
    expect(lenient("sort=oldest&sort=highest").query.sort).toBe("oldest");
    // The first value decides, even when it is empty: absent, never the second.
    expect(strict("sort=&sort=nope")).toMatchObject({ query: { sort: "latest" }, issues: [] });
    expect(strict("status=&status=late")).toMatchObject({
      query: { status: undefined },
      issues: [],
    });
    expect(
      parseRecurringBillsQuery(
        { q: ["data", "byte"], sort: ["lowest", "highest"], status: ["paid", "upcoming"] },
        { strict: true },
      ).query,
    ).toEqual({ q: "data", sort: "lowest", status: "paid" });
  });

  it("ignores parameters not in the contract, and a record's inherited keys", () => {
    expect(strict("page=2&category=Bills&sort=lowest")).toEqual({
      query: { ...DEFAULT, sort: "lowest" },
      issues: [],
      message: "",
    });
    expect(parseRecurringBillsQuery({}, { strict: true }).query).toEqual(DEFAULT);
    expect(parseRecurringBillsQuery({ q: undefined }, { strict: true }).query).toEqual(DEFAULT);
    const inherited = Object.create({ sort: "highest", status: "paid" }) as Record<string, string>;
    expect(parseRecurringBillsQuery(inherited, { strict: true }).query).toEqual(DEFAULT);
  });

  describe("lenient (the page)", () => {
    it.each(["nope", "Latest", "LATEST"])("US-30 reads an unknown sort %j as latest", (sort) => {
      expect(lenient(`sort=${sort}`)).toEqual({ query: DEFAULT, issues: [], message: "" });
    });

    it("§9 RB-Q3 (a) ignores status, valid or not", () => {
      for (const status of ["paid", "late"]) {
        expect(lenient(`status=${status}`)).toEqual({ query: DEFAULT, issues: [], message: "" });
      }
    });

    it("US-29 cuts a search longer than 60 characters to 60", () => {
      const result = lenient(`q=${"a".repeat(RECURRING_BILLS_Q_MAX + 1)}`);
      expect(result.query.q).toBe("a".repeat(RECURRING_BILLS_Q_MAX));
      expect(result.issues).toEqual([]);
    });

    it("US-29 trims again after the cut, and never keeps half of a surrogate pair (v0.7.1)", () => {
      expect(lenient(`q=${"a".repeat(RECURRING_BILLS_Q_MAX - 1)}%20b`).query.q).toBe(
        "a".repeat(RECURRING_BILLS_Q_MAX - 1),
      );
      const emoji = new URLSearchParams({ q: `${"a".repeat(59)}😀x` }).toString();
      expect(lenient(emoji).query.q).toBe("a".repeat(59));
    });
  });

  describe("strict (the API and the tool)", () => {
    it("US-30 refuses an unknown sort, naming the allowed values", () => {
      expect(strict("sort=nope")).toEqual({
        query: DEFAULT,
        issues: [{ path: ["sort"], code: "invalid_format" }],
        message: SORT_MESSAGE,
      });
    });

    it.each(["late", "Paid", "due-soon", "dueSoon "])(
      "§9 RB-Q3 refuses the status %j, naming the allowed values",
      (status) => {
        expect(strict(new URLSearchParams({ status }).toString())).toMatchObject({
          issues: [{ path: ["status"], code: "invalid_format" }],
          message: STATUS_MESSAGE,
        });
      },
    );

    it("US-29 accepts 60 characters and refuses 61, measured after trimming", () => {
      expect(strict(`q=${"a".repeat(RECURRING_BILLS_Q_MAX)}`).issues).toEqual([]);
      expect(strict(`q=%20${"a".repeat(RECURRING_BILLS_Q_MAX)}%20`).issues).toEqual([]);
      expect(strict(`q=${"a".repeat(RECURRING_BILLS_Q_MAX + 1)}`)).toEqual({
        query: DEFAULT,
        issues: [{ path: ["q"], code: "too_long" }],
        message: Q_MESSAGE,
      });
    });

    it("lists every invalid field in the order q, sort, status and joins their messages with '; ' (v0.7.1, Q1 (a))", () => {
      const result = strict(`status=late&sort=nope&q=${"a".repeat(RECURRING_BILLS_Q_MAX + 1)}`);
      expect(result.issues).toEqual([
        { path: ["q"], code: "too_long" },
        { path: ["sort"], code: "invalid_format" },
        { path: ["status"], code: "invalid_format" },
      ]);
      expect(result.message).toBe([Q_MESSAGE, SORT_MESSAGE, STATUS_MESSAGE].join("; "));
    });
  });
});
