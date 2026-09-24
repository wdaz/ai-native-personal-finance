// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { COPY } from "@/src/shared/copy";
import { BudgetsCard, type BudgetItem } from "@/src/ui/overview/BudgetsCard";

afterEach(cleanup);

const items: BudgetItem[] = [
  { id: "1", category: "Entertainment", maximum: 5_000, theme: "Green" as const },
  { id: "2", category: "Bills", maximum: 75_000, theme: "Yellow" as const },
  { id: "3", category: "Dining Out", maximum: 7_500, theme: "Cyan" as const },
  { id: "4", category: "Personal Care", maximum: 10_000, theme: "Navy" as const },
];

describe("BudgetsCard (US-07, SPEC-overview §2.5)", () => {
  it("AC1: donut + legend for the first four budgets", () => {
    render(<BudgetsCard spent={33_800} total={97_500} items={items} />);
    expect(screen.getByRole("img", { name: "Spent $338.00 of $975.00 limit" })).toBeTruthy();
    expect(screen.getByText("Entertainment")).toBeTruthy();
    expect(screen.getByText("$50.00")).toBeTruthy();
    expect(screen.getByText("Bills")).toBeTruthy();
    expect(screen.getByText("$750.00")).toBeTruthy();
  });

  it("AC3: 'See Details' links to /budgets", () => {
    render(<BudgetsCard spent={33_800} total={97_500} items={items} />);
    expect(screen.getByRole("link", { name: "See Details ›" }).getAttribute("href")).toBe(
      "/budgets",
    );
  });

  it("AC2: no budgets — a single grey ring, $0.00, 'No budgets yet' + 'Add a budget'", () => {
    render(<BudgetsCard spent={0} total={0} items={[]} />);
    expect(screen.getByRole("img", { name: "Spent $0.00 of $0.00 limit" })).toBeTruthy();
    expect(screen.getByText(COPY.budgetsEmpty)).toBeTruthy();
    expect(screen.getByRole("link", { name: COPY.addBudget }).getAttribute("href")).toBe(
      "/budgets",
    );
    expect(screen.queryByText("Entertainment")).toBeNull();
  });
});
