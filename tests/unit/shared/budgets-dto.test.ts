import { describe, expect, it } from "vitest";
import {
  BUDGET_LATEST_MAX,
  BUDGETS_MAX,
  BudgetCreateSchema,
  BudgetEditSchema,
  BudgetItemDtoSchema,
  BudgetsDtoSchema,
  BudgetWriteDtoSchema,
  ErrorIssueSchema,
  toWriteIssues,
} from "@/src/shared/schemas";
import { CATEGORIES, THEMES } from "@/src/shared/enums";

const VALID = { category: "Bills", maximum: 75_000, theme: "Cyan" };

/** The write family's issues of a body (SPEC-write-path 2.7), or `[]` when it parses. */
function issuesOf(schema: typeof BudgetCreateSchema, input: unknown) {
  const result = schema.safeParse(input);
  if (result.success) return [];
  const issues = toWriteIssues(result.error, input);
  expect(issues.every((issue) => ErrorIssueSchema.safeParse(issue).success)).toBe(true);
  return issues;
}

function codeFor(schema: typeof BudgetCreateSchema, field: keyof typeof VALID, value: unknown) {
  const input: Record<string, unknown> = { ...VALID };
  if (value === undefined) delete input[field];
  else input[field] = value;
  return issuesOf(schema, input).find((issue) => issue.path[0] === field)?.code;
}

describe.each([
  ["BudgetCreateSchema", BudgetCreateSchema],
  ["BudgetEditSchema", BudgetEditSchema],
] as const)("%s (SPEC-budgets 2.10, SPEC-write-path 2.7)", (_name, schema) => {
  it.each([
    [undefined, "required"],
    [null, "required"],
    ["100", "invalid_format"],
    [1.5, "invalid_format"],
    [true, "invalid_format"],
    [0, "too_small"],
    [-5, "too_small"],
    [1, undefined],
    [99_999_999_999, undefined],
    [100_000_000_000, "too_large"],
    [2 ** 60, "too_large"],
  ])("US-15 AC2 a maximum of %j is %s", (value, code) => {
    expect(codeFor(schema, "maximum", value)).toBe(code);
  });

  it.each([
    ["category", undefined, "required"],
    ["category", null, "required"],
    ["category", "Rent", "invalid_format"],
    ["category", "bills", "invalid_format"],
    ["category", "DiningOut", "invalid_format"],
    ["category", 3, "invalid_format"],
    ["theme", undefined, "required"],
    ["theme", null, "required"],
    ["theme", "Teal", "invalid_format"],
    ["theme", "NavyGrey", "invalid_format"],
    ["theme", "", "invalid_format"],
  ] as const)("US-16 AC1 a %s of %j is %s", (field, value, code) => {
    expect(codeFor(schema, field, value)).toBe(code);
  });

  it("accepts every category and every theme by its display name", () => {
    for (const category of CATEGORIES)
      expect(codeFor(schema, "category", category)).toBeUndefined();
    for (const theme of THEMES) expect(codeFor(schema, "theme", theme)).toBeUndefined();
  });

  it("US-31 {} is required on all three fields (SPEC-write-path 4.4)", () => {
    expect(issuesOf(schema, {})).toEqual([
      { path: ["category"], code: "required" },
      { path: ["maximum"], code: "required" },
      { path: ["theme"], code: "required" },
    ]);
  });

  it("refuses a body that is not an object on []", () => {
    for (const body of [null, [], "x", 3]) {
      expect(issuesOf(schema, body)).toEqual([{ path: [], code: "invalid_format" }]);
    }
  });

  it("strips unknown keys", () => {
    expect(schema.parse({ ...VALID, id: "x", seq: 9, spent: 1 })).toEqual(VALID);
  });
});

const ID = "6f1d3c1e-8a2b-4c3d-9e4f-5a6b7c8d9e0f";
const ITEM = {
  id: ID,
  category: "Bills",
  theme: "Cyan",
  maximum: 75_000,
  spent: 15_000,
  remaining: 60_000,
  latest: [
    {
      id: ID,
      name: "Rina Sato",
      avatar: "rina-sato",
      date: "2026-08-02T09:00:00.000Z",
      amount: -5_000,
    },
  ],
};

describe("BudgetItemDtoSchema, BudgetsDtoSchema and the writes' answer are strict (2.11)", () => {
  it("accepts the item, the list and { budget }", () => {
    expect(BudgetItemDtoSchema.parse(ITEM)).toEqual(ITEM);
    expect(BudgetsDtoSchema.parse({ items: [ITEM], spent: 15_000, limit: 75_000 })).toBeTruthy();
    expect(BudgetWriteDtoSchema.parse({ budget: ITEM })).toEqual({ budget: ITEM });
  });

  it("refuses a leaked field at every level", () => {
    expect(BudgetItemDtoSchema.safeParse({ ...ITEM, seq: 1 }).success).toBe(false);
    expect(
      BudgetItemDtoSchema.safeParse({ ...ITEM, latest: [{ ...ITEM.latest[0], category: "Bills" }] })
        .success,
    ).toBe(false);
    expect(BudgetsDtoSchema.safeParse({ items: [], spent: 0, limit: 0, total: 0 }).success).toBe(
      false,
    );
    expect(BudgetWriteDtoSchema.safeParse({ budget: ITEM, balance: 1 }).success).toBe(false);
  });

  it("bounds the lists: ten budgets, three latest rows", () => {
    expect(BUDGETS_MAX).toBe(CATEGORIES.length);
    expect(BUDGET_LATEST_MAX).toBe(3);
    const many = (n: number) => Array.from({ length: n }, () => ITEM);
    expect(BudgetsDtoSchema.safeParse({ items: many(11), spent: 0, limit: 0 }).success).toBe(false);
    expect(
      BudgetItemDtoSchema.safeParse({ ...ITEM, latest: Array(4).fill(ITEM.latest[0]) }).success,
    ).toBe(false);
  });

  it("refuses a negative remaining, a zero maximum and a date with an offset", () => {
    expect(BudgetItemDtoSchema.safeParse({ ...ITEM, remaining: -1 }).success).toBe(false);
    expect(BudgetItemDtoSchema.safeParse({ ...ITEM, maximum: 0 }).success).toBe(false);
    expect(
      BudgetItemDtoSchema.safeParse({
        ...ITEM,
        latest: [{ ...ITEM.latest[0], date: "2026-08-02T09:00:00+02:00" }],
      }).success,
    ).toBe(false);
  });
});
