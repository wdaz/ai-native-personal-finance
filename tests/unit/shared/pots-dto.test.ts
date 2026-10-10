import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { THEMES } from "@/src/shared/enums";
import {
  ErrorIssueSchema,
  POT_NAME_MAX,
  POTS_MAX,
  PotCreateSchema,
  PotDtoSchema,
  PotMoneyMoveDtoSchema,
  PotMoneyMoveSchema,
  PotsDtoSchema,
  PotUpdateSchema,
  PotWriteDtoSchema,
  toWriteIssues,
} from "@/src/shared/schemas";

const VALID = { name: "Savings", target: 200_000, theme: "Green" };

/** The write family's issues of a body (SPEC-write-path 2.7), or `[]` when it parses. */
function issuesOf(schema: z.ZodType, input: unknown) {
  const result = schema.safeParse(input);
  if (result.success) return [];
  const issues = toWriteIssues(result.error, input);
  expect(issues.every((issue) => ErrorIssueSchema.safeParse(issue).success)).toBe(true);
  return issues;
}

function codeFor(schema: typeof PotCreateSchema, field: keyof typeof VALID, value: unknown) {
  const input: Record<string, unknown> = { ...VALID };
  if (value === undefined) delete input[field];
  else input[field] = value;
  return issuesOf(schema, input).find((issue) => issue.path[0] === field)?.code;
}

const AMOUNT_PAIRS = [
  [undefined, "required"],
  [null, "required"],
  ["100", "invalid_format"],
  [1.5, "invalid_format"],
  [true, "invalid_format"],
  [{}, "invalid_format"],
  [0, "too_small"],
  [-5, "too_small"],
  [1, undefined],
  [99_999_999_999, undefined],
  [100_000_000_000, "too_large"],
] as const;

describe.each([
  ["PotCreateSchema", PotCreateSchema],
  ["PotUpdateSchema", PotUpdateSchema],
] as const)("%s (SPEC-pots 2.12, SPEC-write-path 2.7)", (_name, schema) => {
  it.each([
    [undefined, "required"],
    [null, "required"],
    ["", "required"],
    ["   ", "required"],
    [3, "invalid_format"],
    [true, "invalid_format"],
    [{}, "invalid_format"],
    [["Savings"], "invalid_format"],
    ["A".repeat(POT_NAME_MAX), undefined],
    ["A".repeat(POT_NAME_MAX + 1), "too_long"],
    [`  ${"A".repeat(POT_NAME_MAX)}  `, undefined],
    ["🎉".repeat(15), undefined],
    ["🎉".repeat(15) + "A", "too_long"],
  ])("US-22 AC2 US-23 AC1 a name of %j is %s", (value, code) => {
    expect(codeFor(schema, "name", value)).toBe(code);
  });

  it.each(AMOUNT_PAIRS)("US-22 AC2 a target of %j is %s", (value, code) => {
    expect(codeFor(schema, "target", value)).toBe(code);
  });

  it.each([
    [undefined, "required"],
    [null, "required"],
    ["Teal", "invalid_format"],
    ["NavyGrey", "invalid_format"],
    [3, "invalid_format"],
  ] as const)("US-22 AC1 a theme of %j is %s", (value, code) => {
    expect(codeFor(schema, "theme", value)).toBe(code);
  });

  it("accepts every theme by its display name", () => {
    for (const theme of THEMES) expect(codeFor(schema, "theme", theme)).toBeUndefined();
  });

  it("US-31 {} is required on all three fields (SPEC-write-path 4.4)", () => {
    expect(issuesOf(schema, {})).toEqual([
      { path: ["name"], code: "required" },
      { path: ["target"], code: "required" },
      { path: ["theme"], code: "required" },
    ]);
  });

  it("refuses a body that is not an object on []", () => {
    for (const body of [null, [], "x", 3]) {
      expect(issuesOf(schema, body)).toEqual([{ path: [], code: "invalid_format" }]);
    }
  });

  it("trims the name and strips unknown keys, a total among them (a total changes only by a move)", () => {
    expect(schema.parse({ ...VALID, name: "  Savings  ", total: 5, id: "x", seq: 2 })).toEqual(
      VALID,
    );
  });

  it("returns a name that looks like markup unchanged, as text (NFR-S7)", () => {
    const name = "<script>alert(1)</script>";
    expect(schema.parse({ ...VALID, name }).name).toBe(name);
  });
});

describe("PotMoneyMoveSchema (SPEC-pots 2.12)", () => {
  it.each(AMOUNT_PAIRS)("US-25 AC2 US-26 AC2 an amount of %j is %s", (value, code) => {
    const input = value === undefined ? {} : { amount: value };
    expect(issuesOf(PotMoneyMoveSchema, input)[0]?.code).toBe(code);
  });

  it("strips unknown keys", () => {
    expect(PotMoneyMoveSchema.parse({ amount: 100, id: "x" })).toEqual({ amount: 100 });
  });
});

const ID = "6f1d3c1e-8a2b-4c3d-9e4f-5a6b7c8d9e0f";
const POT = {
  id: ID,
  name: "Savings",
  theme: "Green",
  target: 200_000,
  total: 15_900,
  percentBasisPoints: 795,
};

describe("PotDtoSchema, PotsDtoSchema and the writes' answers are strict (2.12)", () => {
  it("accepts a pot, the list, { pot } and { pot, balance }", () => {
    expect(PotDtoSchema.parse(POT)).toEqual(POT);
    const list = { balance: { current: 483_600 }, items: [POT] };
    expect(PotsDtoSchema.parse(list)).toEqual(list);
    expect(PotWriteDtoSchema.parse({ pot: POT })).toEqual({ pot: POT });
    const move = { pot: POT, balance: { current: 0 } };
    expect(PotMoneyMoveDtoSchema.parse(move)).toEqual(move);
  });

  it("US-21 AC1 accepts a total above the target and a 0 total", () => {
    expect(
      PotDtoSchema.safeParse({ ...POT, total: 500_000, percentBasisPoints: 25_000 }).success,
    ).toBe(true);
    expect(PotDtoSchema.safeParse({ ...POT, total: 0, percentBasisPoints: 0 }).success).toBe(true);
  });

  it("refuses a leaked field at every level", () => {
    for (const leaked of ["seq", "seeded", "createdAt"]) {
      expect(PotDtoSchema.safeParse({ ...POT, [leaked]: 1 }).success, leaked).toBe(false);
    }
    expect(PotsDtoSchema.safeParse({ balance: { current: 0, income: 1 }, items: [] }).success).toBe(
      false,
    );
    expect(PotsDtoSchema.safeParse({ balance: { current: 0 }, items: [], total: 0 }).success).toBe(
      false,
    );
    expect(PotWriteDtoSchema.safeParse({ pot: POT, balance: { current: 0 } }).success).toBe(false);
    expect(PotMoneyMoveDtoSchema.safeParse({ pot: POT }).success).toBe(false);
  });

  it("refuses a negative total or balance, a 0 target and a name over 30", () => {
    expect(PotDtoSchema.safeParse({ ...POT, total: -1 }).success).toBe(false);
    expect(PotDtoSchema.safeParse({ ...POT, target: 0 }).success).toBe(false);
    expect(PotDtoSchema.safeParse({ ...POT, name: "A".repeat(31) }).success).toBe(false);
    expect(PotsDtoSchema.safeParse({ balance: { current: -1 }, items: [] }).success).toBe(false);
  });

  it("bounds the list at fifteen pots, one per theme", () => {
    expect(POTS_MAX).toBe(THEMES.length);
    const items = Array.from({ length: POTS_MAX + 1 }, () => POT);
    expect(PotsDtoSchema.safeParse({ balance: { current: 0 }, items }).success).toBe(false);
  });
});
