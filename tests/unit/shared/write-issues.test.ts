import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  AMOUNT_MAX_CENTS,
  AmountCentsSchema,
  CategorySchema,
  ErrorIssueSchema,
  PotNameSchema,
  RecordIdSchema,
  ThemeSchema,
  toWriteIssues,
} from "@/src/shared/schemas";

/**
 * SPEC-write-path 2.7's table, row by row, through the shared field schemas the Budgets and
 * Pots bodies are built from (T-23, T-25). Each case is `[input, code]`; `undefined` as the
 * input means the property is absent. Failing first (T-17): before T-17 the mapper read `1.5`,
 * `"100"` and `0` as `required`, an over-maximum as `too_long`, and threw on an enum.
 */
const Body = z.object({
  amount: AmountCentsSchema,
  name: PotNameSchema,
  category: CategorySchema,
  theme: ThemeSchema,
  id: RecordIdSchema,
});
const VALID = {
  amount: 100,
  name: "Holiday",
  category: "Bills",
  theme: "Green",
  id: "6f1d3c1e-8a2b-4c3d-9e4f-5a6b7c8d9e0f",
};

function codeFor(field: keyof typeof VALID, value: unknown): string | undefined {
  const input: Record<string, unknown> = { ...VALID };
  if (value === undefined) delete input[field];
  else input[field] = value;
  const result = Body.safeParse(input);
  if (result.success) return undefined;
  const issues = toWriteIssues(result.error, input);
  expect(issues.every((issue) => ErrorIssueSchema.safeParse(issue).success)).toBe(true);
  return issues.find((issue) => issue.path[0] === field)?.code;
}

describe("toWriteIssues — SPEC-write-path 2.7 (US-31: the server's issue codes)", () => {
  it.each([
    [undefined, "required"],
    [null, "required"],
    ["100", "invalid_format"],
    [1.5, "invalid_format"],
    [true, "invalid_format"],
    [{ cents: 1 }, "invalid_format"],
    [0, "too_small"],
    [-5, "too_small"],
    [1, undefined],
    [99_999_999_999, undefined],
    [100_000_000_000, "too_large"],
    [2 ** 60, "too_large"],
  ])("an amount of %j is %s", (value, code) => {
    expect(codeFor("amount", value)).toBe(code);
  });

  it.each([
    [undefined, "required"],
    [null, "required"],
    ["", "required"],
    ["   ", "required"],
    [5, "invalid_format"],
    [false, "invalid_format"],
    [{}, "invalid_format"],
    [["a"], "invalid_format"],
    ["n".repeat(30), undefined],
    ["n".repeat(31), "too_long"],
  ])("a pot name of %j is %s", (value, code) => {
    expect(codeFor("name", value)).toBe(code);
  });

  it.each([
    ["category", undefined, "required"],
    ["category", null, "required"],
    ["category", 7, "invalid_format"],
    ["category", "Food", "invalid_format"],
    ["category", "Dining Out", undefined],
    ["theme", undefined, "required"],
    ["theme", "green", "invalid_format"],
    ["theme", "Navy Grey", undefined],
  ] as const)("a %s of %j is %s", (field, value, code) => {
    expect(codeFor(field, value)).toBe(code);
  });

  it("an id that is not a UUID is invalid_format, not a 404 (4.4)", () => {
    expect(codeFor("id", "not-a-uuid")).toBe("invalid_format");
    expect(codeFor("id", 42)).toBe("invalid_format");
  });

  it("a body that is absent, not JSON or not an object is invalid_format on [] (4.4)", () => {
    for (const input of [undefined, null, "text", 3, ["a"]]) {
      const result = Body.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(toWriteIssues(result.error, input)).toEqual([{ path: [], code: "invalid_format" }]);
      }
    }
  });

  it("{} is required on each missing field (4.4)", () => {
    const result = Body.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toWriteIssues(result.error, {})).toEqual(
        ["amount", "name", "category", "theme", "id"].map((field) => ({
          path: [field],
          code: "required",
        })),
      );
    }
  });

  it("gives one issue per field, the first, when Zod reports two", () => {
    const result = AmountCentsSchema.safeParse(2 ** 60);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.length).toBeGreaterThan(1);
  });

  it("keeps a name that looks like a script tag as plain text (NFR-S7)", () => {
    expect(PotNameSchema.parse("<script>alert(1)</script>")).toBe("<script>alert(1)</script>");
  });

  it("holds NFR-S3's bounds: 1 to 99,999,999,999 cents, names of 1–30 after trim", () => {
    expect(AMOUNT_MAX_CENTS).toBe(99_999_999_999);
    expect(PotNameSchema.parse("  Holiday  ")).toBe("Holiday");
    expect(RecordIdSchema.safeParse("6f1d3c1e-8a2b-4c3d-9e4f-5a6b7c8d9e0f").success).toBe(true);
  });
});
