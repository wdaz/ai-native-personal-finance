// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/src/shared/copy";
import type { BudgetItemDto, BudgetsDto } from "@/src/shared/schemas";
import { BudgetCard } from "@/src/ui/budgets/BudgetCard";
import { BudgetsEmpty } from "@/src/ui/budgets/BudgetsEmpty";
import { BudgetsError } from "@/src/ui/budgets/BudgetsError";
import { LatestSpending, seeAllHref } from "@/src/ui/budgets/LatestSpending";
import { SpendingSummary } from "@/src/ui/budgets/SpendingSummary";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

afterEach(() => {
  cleanup();
  refresh.mockClear();
});

/** Synthetic DTOs for the components, not seed data; seed figures are the E2E suite's. */
const row = (n: number, amount: number): BudgetItemDto["latest"][number] => ({
  id: `00000000-0000-4000-8000-00000000000${n}`,
  name: `Vendor ${n}`,
  avatar: "vendor",
  date: `2026-08-0${n}T12:00:00.000Z`,
  amount,
});

const budget = (over: Partial<BudgetItemDto> = {}): BudgetItemDto => ({
  id: "11111111-1111-4111-8111-111111111111",
  category: "Dining Out",
  theme: "Yellow",
  maximum: 5_000,
  spent: 1_500,
  remaining: 3_500,
  latest: [row(1, -1_000), row(2, 2_500)],
  ...over,
});

describe("BudgetCard (SPEC-budgets 2.4, US-14 AC1–AC2)", () => {
  it("a section labelled by its h2; Maximum of; Spent and Remaining as a dl", () => {
    render(<BudgetCard budget={budget()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    const card = screen.getByRole("region", { name: "Dining Out" });
    expect(within(card).getByRole("heading", { level: 2, name: "Dining Out" })).toBeTruthy();
    expect(within(card).getByText(COPY.budgetMaximumOf("$50.00"))).toBeTruthy();
    const terms = [...card.querySelectorAll("dt")].map((dt) => dt.textContent);
    const values = [...card.querySelectorAll("dd")].map((dd) => dd.textContent);
    expect(terms).toEqual([COPY.budgetSpent, COPY.budgetRemaining]);
    expect(values).toEqual(["$15.00", "$35.00"]);
  });

  it.each([
    [1_500, 5_000, "30%"],
    [5_000, 5_000, "100%"],
    [17_733, 10_000, "100%"],
    [0, 5_000, "0%"],
  ])(
    "the bar's fill: spent %i of %i → width %s; decorative, no style attribute (ADR-0006)",
    (spent, maximum, width) => {
      const { container } = render(
        <BudgetCard budget={budget({ spent, maximum })} onEdit={vi.fn()} onDelete={vi.fn()} />,
      );
      const rect = container.querySelector("rect");
      expect(rect?.getAttribute("width")).toBe(width);
      expect(rect?.getAttribute("fill")).toBe("var(--color-yellow)");
      expect(rect?.closest('[aria-hidden="true"]')).not.toBeNull();
      expect(container.querySelector("[style]")).toBeNull();
    },
  );

  it("BU-Q5 (a): an amount may break only after a comma", () => {
    const { container } = render(
      <BudgetCard
        budget={budget({ maximum: 99_999_999_999, spent: 123_456_789, remaining: 99_876_543_210 })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const spent = container.querySelectorAll("dd")[0];
    expect(spent?.textContent).toBe("$1,234,567.89");
    expect(spent?.querySelectorAll("wbr")).toHaveLength(2);
    expect(spent?.innerHTML).toMatch(/^\$1,<wbr>234,<wbr>567\.89$/);
  });

  it("the … menu names the budget and runs Edit and Delete with their trigger", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<BudgetCard budget={budget()} onEdit={onEdit} onDelete={onDelete} />);
    const trigger = screen.getByRole("button", { name: new RegExp(COPY.budgetOptions) });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: COPY.editBudget }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: COPY.deleteBudget }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

describe("LatestSpending (SPEC-budgets 2.5, US-18, US-19 AC1)", () => {
  it("See All links to Transactions filtered to the category, as URLSearchParams writes it", () => {
    expect(seeAllHref("Dining Out")).toBe("/transactions?category=Dining+Out&page=1");
    render(<LatestSpending category="Dining Out" latest={[]} />);
    const link = screen.getByRole("link", { name: COPY.seeAllCategory("Dining Out") });
    expect(link.getAttribute("href")).toBe("/transactions?category=Dining+Out&page=1");
  });

  it("a row per transaction: name, signed amount, date; the avatar is decorative", () => {
    const { container } = render(
      <LatestSpending category="Dining Out" latest={[row(1, -1_000), row(2, 2_500)]} />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual([
      "Vendor 1-$10.001 Aug 2026",
      "Vendor 2+$25.002 Aug 2026",
    ]);
    for (const img of container.querySelectorAll("img")) expect(img.getAttribute("alt")).toBe("");
    expect(screen.queryByText(COPY.budgetNoTransactions)).toBeNull();
  });

  it("with no transactions: the empty message and no list", () => {
    render(<LatestSpending category="General" latest={[]} />);
    expect(screen.getByText(COPY.budgetNoTransactions)).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });
});

const dto = (items: BudgetItemDto[]): BudgetsDto => ({
  items,
  limit: items.reduce((sum, b) => sum + b.maximum, 0),
  spent: items.reduce((sum, b) => sum + b.spent, 0),
});

describe("SpendingSummary (SPEC-budgets 2.3, US-20)", () => {
  it("the donut over every budget, then a list labelled Spending Summary in the DTO's order", () => {
    render(
      <SpendingSummary
        budgets={dto([
          budget(),
          budget({
            id: "22222222-2222-4222-8222-222222222222",
            category: "Bills",
            theme: "Cyan",
            maximum: 75_000,
            spent: 0,
            remaining: 75_000,
          }),
        ])}
      />,
    );
    expect(screen.getByRole("img", { name: "Spent $15.00 of $800.00 limit" })).toBeTruthy();
    const list = screen.getByRole("list", { name: COPY.spendingSummary });
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual([
      `Dining Out$15.00${COPY.budgetOfMaximum("$50.00")}`,
      `Bills$0.00${COPY.budgetOfMaximum("$750.00")}`,
    ]);
  });

  it("the donut's centre takes the Budgets fit (BU-11 (A)); Overview's does not", () => {
    const { container } = render(<SpendingSummary budgets={dto([budget()])} />);
    expect(container.querySelector("[data-limit-lines]")?.getAttribute("data-limit-lines")).toBe(
      "1",
    );
    expect(screen.getByText("$15.00", { selector: "p" }).className).toContain("text-preset-1");
  });

  it("with no budgets: the heading and no list (US-14 AC3)", () => {
    render(<SpendingSummary budgets={dto([])} />);
    expect(screen.getByRole("heading", { name: COPY.spendingSummary })).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });
});

describe("BudgetsEmpty and BudgetsError (SPEC-budgets 2.12)", () => {
  it("the empty card says No budgets yet, with no button of its own", () => {
    render(<BudgetsEmpty />);
    expect(screen.getByText(COPY.budgetsEmpty)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("the error card shows the message and Retry refreshes the page", () => {
    render(<BudgetsError />);
    expect(screen.getByText(COPY.budgetsLoadError)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: COPY.retry }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
