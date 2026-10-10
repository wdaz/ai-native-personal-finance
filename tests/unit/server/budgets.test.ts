import { afterEach, describe, expect, it, vi } from "vitest";
import { budgetsSummary } from "@/src/domain/budgets";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { prismaCategory, prismaTheme, toBudgetsDto } from "@/src/server/budgets";
import { CATEGORY_LABEL, THEME_LABEL } from "@/src/server/overview";
import { BudgetsDtoSchema } from "@/src/shared/schemas";
import { CATEGORIES, THEMES } from "@/src/shared/enums";

const getDb = vi.hoisted(() => vi.fn());
vi.mock("@/src/server/db", () => ({ getDb }));

const { GET } = await import("@/app/api/budgets/route");

afterEach(() => {
  vi.restoreAllMocks();
  getDb.mockReset();
});

const ID = (n: number) => `00000000-0000-4000-9000-00000000000${n}`;

describe("toBudgetItemDto and toBudgetsDto (SPEC-budgets 2.11)", () => {
  const summary = budgetsSummary(
    {
      budgets: [
        { id: ID(1), seq: 7, category: "Bills" as const, maximum: 75_000, theme: "Cyan" as const },
      ],
      transactions: [
        {
          id: ID(2),
          name: "Rina Sato",
          avatar: "rina-sato",
          category: "Bills" as const,
          date: new Date("2026-08-02T09:00:00Z"),
          amount: -5_000,
          recurring: false,
        },
      ],
    },
    fixedClock(BUSINESS_TODAY),
  );

  it("US-39 AC2 names every field: ids, ISO dates, no seq, no category or recurring on a row", () => {
    const dto = toBudgetsDto(summary);
    expect(dto).toEqual({
      items: [
        {
          id: ID(1),
          category: "Bills",
          theme: "Cyan",
          maximum: 75_000,
          spent: 5_000,
          remaining: 70_000,
          latest: [
            {
              id: ID(2),
              name: "Rina Sato",
              avatar: "rina-sato",
              date: "2026-08-02T09:00:00.000Z",
              amount: -5_000,
            },
          ],
        },
      ],
      spent: 5_000,
      limit: 75_000,
    });
    expect(BudgetsDtoSchema.parse(dto)).toEqual(dto);
  });
});

describe("the display names to the database's enums (T-23 plan F3)", () => {
  it("inverts CATEGORY_LABEL and THEME_LABEL for every value", () => {
    for (const category of CATEGORIES)
      expect(CATEGORY_LABEL.get(prismaCategory(category))).toBe(category);
    for (const theme of THEMES) expect(THEME_LABEL.get(prismaTheme(theme))).toBe(theme);
  });

  it("throws for a name that is not one of them", () => {
    expect(() => prismaCategory("Rent" as never)).toThrow('Unmapped category "Rent"');
    expect(() => prismaTheme("Teal" as never)).toThrow('Unmapped theme "Teal"');
  });
});

describe("GET /api/budgets when the database fails (2.11; the 500 is a unit test, T-18/T-20 Q2 (a))", () => {
  it("answers 500 server_error, no-store, and logs the failure", async () => {
    const failure = new Error("connection lost");
    getDb.mockReturnValue({
      transaction: { findMany: vi.fn().mockRejectedValue(failure) },
      budget: { findMany: vi.fn().mockResolvedValue([]) },
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await GET();
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: "server_error",
      message: "The budgets are unavailable",
    });
    expect(log).toHaveBeenCalledWith("GET /api/budgets failed", failure);
  });
});
