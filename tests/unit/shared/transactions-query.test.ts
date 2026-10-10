import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/src/shared/enums";
import {
  parseTransactionsQuery,
  TRANSACTION_SORTS,
  TRANSACTIONS_Q_MAX,
  transactionsSearch,
} from "@/src/shared/transactions-query";

const lenient = (search: string) =>
  parseTransactionsQuery(new URLSearchParams(search), { strict: false });
const strict = (search: string) =>
  parseTransactionsQuery(new URLSearchParams(search), { strict: true });

const SORT_MESSAGE = `sort must be one of: ${TRANSACTION_SORTS.join(", ")}`;
const CATEGORY_MESSAGE = `category must be one of: ${CATEGORIES.join(", ")}`;
const Q_MESSAGE = `q must be at most ${TRANSACTIONS_Q_MAX} characters`;

describe("SPEC-transactions 2.2–2.3: parseTransactionsQuery", () => {
  it("US-09 reads no parameter as the default view: no search, all categories, latest, page 1", () => {
    for (const parse of [lenient, strict]) {
      expect(parse("")).toEqual({
        query: { q: undefined, category: undefined, sort: "latest", page: 1 },
        issues: [],
        message: "",
      });
    }
  });

  it("US-09 AC4 reads every valid parameter in both modes", () => {
    for (const parse of [lenient, strict]) {
      expect(parse("q=co&category=Dining+Out&sort=a-to-z&page=3").query).toEqual({
        q: "co",
        category: "Dining Out",
        sort: "a-to-z",
        page: 3,
      });
    }
  });

  it.each(["0", "-3", "1.5", "abc", "02", "+2", "2abc", "1e1", " 2"])(
    "US-09 AC4 reads page=%j as page 1 in both modes, never an error",
    (page) => {
      for (const parse of [lenient, strict]) {
        const result = parse(new URLSearchParams({ page }).toString());
        expect(result.query.page).toBe(1);
        expect(result.issues).toEqual([]);
      }
    },
  );

  it("US-09 AC4 keeps a page beyond the end for paginate to clamp", () => {
    expect(lenient("page=99").query.page).toBe(99);
    expect(strict("page=99").issues).toEqual([]);
  });

  it.each(["q=", "category=", "sort=", "page=", "q=%20%20%20"])(
    "reads the empty value %s as absent in both modes",
    (search) => {
      for (const parse of [lenient, strict]) {
        expect(parse(search)).toEqual(parse(""));
      }
    },
  );

  it("US-10 trims the search and keeps its inner spaces", () => {
    expect(lenient("q=%20%20Emma%20Rich%20%20").query.q).toBe("Emma Rich");
    expect(strict("q=%20%20Emma%20Rich%20%20").query.q).toBe("Emma Rich");
  });

  it("US-12 AC2 reads + and %20 as the same space, in both modes", () => {
    for (const parse of [lenient, strict]) {
      expect(parse("category=Dining+Out").query.category).toBe("Dining Out");
      expect(parse("category=Dining%20Out").query.category).toBe("Dining Out");
    }
  });

  it("reads a repeated parameter as its first value, from URLSearchParams and from a record", () => {
    expect(lenient("sort=oldest&sort=highest").query.sort).toBe("oldest");
    // The first value decides, even when it is empty: absent, so the default, never the second.
    expect(strict("sort=&sort=nope")).toMatchObject({ query: { sort: "latest" }, issues: [] });
    expect(
      parseTransactionsQuery(
        { sort: ["oldest", "highest"], category: ["Bills", "General"], page: ["2", "3"] },
        { strict: true },
      ).query,
    ).toEqual({ q: undefined, category: "Bills", sort: "oldest", page: 2 });
  });

  it("ignores parameters not in the contract, and a record's inherited keys", () => {
    expect(lenient("view=grid&sort=lowest").query.sort).toBe("lowest");
    expect(parseTransactionsQuery({}, { strict: true }).query.sort).toBe("latest");
    expect(parseTransactionsQuery({ page: undefined }, { strict: true }).query.page).toBe(1);
  });

  describe("lenient (the page)", () => {
    it.each(["nope", "Latest", "LATEST"])("US-11 reads an unknown sort %j as latest", (sort) => {
      expect(lenient(`sort=${sort}`)).toEqual({
        query: { q: undefined, category: undefined, sort: "latest", page: 1 },
        issues: [],
        message: "",
      });
    });

    it.each(["Nope", "dining out", "DINING OUT"])(
      "US-12 reads an unknown category %j as all transactions",
      (category) => {
        const result = lenient(new URLSearchParams({ category }).toString());
        expect(result.query.category).toBeUndefined();
        expect(result.issues).toEqual([]);
      },
    );

    it("US-10 trims again after the cut, so the search never ends in a space (v1.0.17)", () => {
      const cut = lenient(`q=${"a".repeat(TRANSACTIONS_Q_MAX - 1)}%20b`).query.q;
      expect(cut).toBe("a".repeat(TRANSACTIONS_Q_MAX - 1));
    });

    it("US-10 never keeps half of a surrogate pair at the cut (60 UTF-16 units)", () => {
      const cut = lenient(new URLSearchParams({ q: `${"a".repeat(59)}😀x` }).toString()).query.q;
      expect(cut).toBe("a".repeat(59));
    });

    it("US-10 cuts a search longer than 60 characters to 60", () => {
      const result = lenient(`q=${"a".repeat(TRANSACTIONS_Q_MAX + 1)}`);
      expect(result.query.q).toBe("a".repeat(TRANSACTIONS_Q_MAX));
      expect(result.issues).toEqual([]);
    });
  });

  describe("strict (the API and the tool)", () => {
    it("US-11 refuses an unknown sort, naming the allowed values", () => {
      expect(strict("sort=nope")).toMatchObject({
        issues: [{ path: ["sort"], code: "invalid_format" }],
        message: SORT_MESSAGE,
      });
    });

    it("US-12 refuses a category in another case, naming the allowed values", () => {
      expect(strict("category=dining+out")).toMatchObject({
        issues: [{ path: ["category"], code: "invalid_format" }],
        message: CATEGORY_MESSAGE,
      });
    });

    it("US-10 accepts 60 characters and refuses 61, measured after trimming", () => {
      expect(strict(`q=${"a".repeat(TRANSACTIONS_Q_MAX)}`).issues).toEqual([]);
      expect(strict(`q=%20${"a".repeat(TRANSACTIONS_Q_MAX)}%20`).issues).toEqual([]);
      expect(strict(`q=${"a".repeat(TRANSACTIONS_Q_MAX + 1)}`)).toMatchObject({
        issues: [{ path: ["q"], code: "too_long" }],
        message: Q_MESSAGE,
      });
    });

    it("lists every invalid field in the order q, category, sort and joins their messages with '; ' (v1.0.17)", () => {
      const result = strict(`sort=nope&category=Nope&q=${"a".repeat(TRANSACTIONS_Q_MAX + 1)}`);
      expect(result.issues).toEqual([
        { path: ["q"], code: "too_long" },
        { path: ["category"], code: "invalid_format" },
        { path: ["sort"], code: "invalid_format" },
      ]);
      expect(result.message).toBe([Q_MESSAGE, CATEGORY_MESSAGE, SORT_MESSAGE].join("; "));
    });
  });
});

describe("SPEC-transactions 2.2: transactionsSearch, the URL the controls write", () => {
  const base = { q: undefined, category: undefined, sort: "latest", page: 1 } as const;

  it("writes nothing for the default view", () => {
    expect(transactionsSearch(base)).toBe("");
  });

  it("writes q, category, sort, page in that order, a space as +", () => {
    expect(
      transactionsSearch({ q: "co ffee", category: "Dining Out", sort: "a-to-z", page: 3 }),
    ).toBe("?q=co+ffee&category=Dining+Out&sort=a-to-z&page=3");
  });

  it("leaves out latest and page 1", () => {
    expect(transactionsSearch({ ...base, category: "Bills" })).toBe("?category=Bills");
    expect(transactionsSearch({ ...base, sort: "oldest" })).toBe("?sort=oldest");
    expect(transactionsSearch({ ...base, page: 2 })).toBe("?page=2");
  });

  it("round-trips through the lenient parser", () => {
    const query = { q: "a & b", category: "Personal Care", sort: "lowest", page: 4 } as const;
    expect(lenient(transactionsSearch(query).slice(1)).query).toEqual(query);
  });
});
