// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/src/shared/copy";
import { CATEGORIES, THEMES } from "@/src/shared/enums";
import type { BudgetItemDto } from "@/src/shared/schemas";
import { BudgetForm, type BudgetFormMode, type BudgetSubmit } from "@/src/ui/budgets/BudgetForm";

beforeEach(() => {
  Element.prototype.scrollIntoView = () => {};
});
afterEach(cleanup);

/** Synthetic budgets, not seed data. */
const budget = (
  n: number,
  category: BudgetItemDto["category"],
  theme: BudgetItemDto["theme"],
): BudgetItemDto => ({
  id: `00000000-0000-4000-8000-00000000000${n}`,
  category,
  theme,
  maximum: 5_000,
  spent: 0,
  remaining: 5_000,
  latest: [],
});
const BUDGETS = [budget(1, "Entertainment", "Green"), budget(2, "Bills", "Yellow")];

function open(
  mode: BudgetFormMode,
  {
    budgets = BUDGETS,
    submit = vi.fn<BudgetSubmit>(() => Promise.resolve({ kind: "ok", data: {} })),
    onSaved = vi.fn(),
    onTaken = vi.fn(),
    onGone = vi.fn(),
  }: {
    budgets?: BudgetItemDto[];
    submit?: BudgetSubmit;
    onSaved?: () => void;
    onTaken?: () => void;
    onGone?: () => void;
  } = {},
) {
  render(
    <BudgetForm
      mode={mode}
      budgets={budgets}
      submit={submit}
      onClose={vi.fn()}
      onSaved={onSaved}
      onGone={onGone}
      onTaken={onTaken}
    />,
  );
  return { submit, onSaved, onTaken, onGone };
}

const trigger = (label: string) =>
  screen.getByRole("button", { name: new RegExp(`^${label}(:|$)`) });
const maximum = () => screen.getByRole("textbox", { name: COPY.maximumSpend }) as HTMLInputElement;
const send = (label: string = COPY.addBudgetSubmit) => screen.getByRole("button", { name: label });

describe("BudgetForm (SPEC-budgets 2.6, 2.7; US-15, US-16, US-31)", () => {
  it("add: opens on the first free category and theme, an empty maximum", () => {
    open({ kind: "add" });
    expect(screen.getByRole("heading", { name: COPY.addNewBudget })).toBeTruthy();
    const firstCategory = CATEGORIES.find((c) => c !== "Entertainment" && c !== "Bills");
    const firstTheme = THEMES.find((t) => t !== "Green" && t !== "Yellow");
    expect(trigger(COPY.budgetCategory).textContent).toContain(String(firstCategory));
    expect(trigger(COPY.theme).textContent).toContain(String(firstTheme));
    expect(maximum().value).toBe("");
  });

  it("add with every category used: no value, and the message under the field from the start", () => {
    const all = CATEGORIES.map((category, i) => budget(i, category, THEMES[i] ?? "Green"));
    open({ kind: "add" }, { budgets: all });
    expect(screen.getByText(COPY.budgetCategoriesUsed)).toBeTruthy();
  });

  it("edit: pre-filled; its own category and theme are not 'Already used'", () => {
    open({ kind: "edit", budget: BUDGETS[0] as BudgetItemDto });
    expect(screen.getByRole("heading", { name: COPY.editBudget })).toBeTruthy();
    expect(trigger(COPY.budgetCategory).textContent).toContain("Entertainment");
    expect(trigger(COPY.theme).textContent).toContain("Green");
    expect(maximum().value).toBe("50");
    fireEvent.click(trigger(COPY.budgetCategory));
    const options = screen.getAllByRole("option").map((o) => o.textContent ?? "");
    expect(options.find((o) => o.startsWith("Entertainment"))).not.toContain(COPY.alreadyUsed);
    expect(options.find((o) => o.startsWith("Bills"))).toContain(COPY.alreadyUsed);
  });

  it("UK-Q9 (a): typing shows nothing; blur checks the field; submit checks all and sends nothing", async () => {
    const { submit } = open({ kind: "add" });
    fireEvent.change(maximum(), { target: { value: "abc" } });
    expect(screen.queryByText(COPY.required)).toBeNull();
    fireEvent.change(maximum(), { target: { value: "" } });
    fireEvent.blur(maximum());
    expect(screen.getByText(COPY.required)).toBeTruthy();
    await act(async () => {
      fireEvent.click(send());
    });
    expect(submit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(maximum());
  });

  it("a valid add sends the parsed cents and reports the save", async () => {
    const { submit, onSaved } = open({ kind: "add" });
    fireEvent.change(maximum(), { target: { value: "1,234.5" } });
    await act(async () => {
      fireEvent.click(send());
    });
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ maximum: 123_450 }));
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("a server 'taken' marks the field Already used and asks the page to refresh", async () => {
    const { onTaken } = open(
      { kind: "add" },
      {
        submit: () =>
          Promise.resolve({
            kind: "validation",
            issues: [{ path: ["category"], code: "taken", message: "taken" }],
          }),
      },
    );
    fireEvent.change(maximum(), { target: { value: "20" } });
    await act(async () => {
      fireEvent.click(send());
    });
    expect(screen.getByText(COPY.alreadyUsed)).toBeTruthy();
    expect(onTaken).toHaveBeenCalledTimes(1);
  });

  it("an edit answered 404 hands over to the page (onGone)", async () => {
    const { onGone } = open(
      { kind: "edit", budget: BUDGETS[1] as BudgetItemDto },
      { submit: () => Promise.resolve({ kind: "gone" }) },
    );
    await act(async () => {
      fireEvent.click(send(COPY.saveChanges));
    });
    expect(onGone).toHaveBeenCalledTimes(1);
  });

  it("a failed write shows its message under the footer and keeps the form", async () => {
    open(
      { kind: "add" },
      { submit: () => Promise.resolve({ kind: "failed", code: "server_error", message: "Nope" }) },
    );
    fireEvent.change(maximum(), { target: { value: "20" } });
    await act(async () => {
      fireEvent.click(send());
    });
    expect(screen.getByText("Nope")).toBeTruthy();
    expect(send()).toBeTruthy();
  });
});
