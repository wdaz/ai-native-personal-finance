// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { potFill } from "@/src/domain/pots";
import { COPY } from "@/src/shared/copy";
import { formatMoney, formatPercent } from "@/src/shared/money";
import type { PotDto } from "@/src/shared/schemas";
import { PotCard } from "@/src/ui/pots/PotCard";
import { PotsError } from "@/src/ui/pots/PotsError";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/** Synthetic pots, not seed data: 159 of 2,000 → 795 basis points; 160 of 150 → past the target. */
const pot = (overrides: Partial<PotDto> = {}): PotDto => ({
  id: "3f1c2b8e-5a7d-4c1e-9b2a-6d8e0f4a1c3b",
  name: "Savings",
  theme: "Green",
  target: 200_000,
  total: 15_900,
  percentBasisPoints: 795,
  ...overrides,
});

const actions = () => ({
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onAddMoney: vi.fn(),
  onWithdraw: vi.fn(),
});

function renderCard(p: PotDto, handlers = actions()) {
  const view = render(<PotCard pot={p} fill={potFill(p.total, p.target)} {...handlers} />);
  return { ...view, handlers };
}

describe("PotCard (SPEC-pots 2.2, 2.3; US-21 AC1, US-23 AC2, PO-Q1 (a))", () => {
  it("a section named by its h2, the name in TruncatedText, the total, the percentage and the target", () => {
    const p = pot();
    renderCard(p);
    const section = screen.getByRole("region", { name: p.name });
    expect(section.querySelector("h2")?.textContent).toBe(p.name);
    expect(section.textContent).toContain(COPY.totalSaved);
    expect(section.textContent).toContain(formatMoney(p.total));
    expect(section.textContent).toContain(formatPercent(p.percentBasisPoints));
    expect(section.textContent).toContain(COPY.targetOf(formatMoney(p.target)));
  });

  it("the buttons' names say which pot they act on; the '+' is aria-hidden", () => {
    const { handlers } = renderCard(pot());
    expect(screen.getByRole("button", { name: "Pot options: Savings" })).toBeTruthy();
    const add = screen.getByRole("button", { name: "Add Money to Savings" });
    const withdraw = screen.getByRole("button", { name: "Withdraw from Savings" });
    expect(add.querySelector("[aria-hidden='true']")?.textContent?.trim()).toBe("+");
    fireEvent.click(add);
    fireEvent.click(withdraw);
    expect(handlers.onAddMoney).toHaveBeenCalledWith(add);
    expect(handlers.onWithdraw).toHaveBeenCalledWith(withdraw);
  });

  it("the bar is an aria-hidden SVG whose rect takes potFill as a presentation attribute", () => {
    const { container } = renderCard(pot());
    const rect = container.querySelector("svg rect");
    expect(rect?.closest("[aria-hidden='true']")).toBeTruthy();
    expect(rect?.getAttribute("width")).toBe("7.95%");
    expect(rect?.hasAttribute("style")).toBe(false);
    expect(rect?.getAttribute("fill")).toBe("var(--color-green)");
  });

  it("past the target the bar is full while the percentage shows the real value (US-23 AC2)", () => {
    const { container } = renderCard(
      pot({ total: 16_000, target: 15_000, percentBasisPoints: 10_667 }),
    );
    expect(container.querySelector("svg rect")?.getAttribute("width")).toBe("100.00%");
    expect(container.textContent).toContain("106.67%");
  });

  it("an empty pot: $0.00, 0.00% and an empty bar (US-22 AC3)", () => {
    const { container } = renderCard(pot({ total: 0, percentBasisPoints: 0 }));
    expect(container.querySelector("svg rect")?.getAttribute("width")).toBe("0%");
    expect(container.textContent).toContain("0.00%");
    expect(container.textContent).toContain("$0.00");
  });

  it("the '…' menu offers Edit Pot and Delete Pot", () => {
    const { handlers } = renderCard(pot());
    fireEvent.click(screen.getByRole("button", { name: "Pot options: Savings" }));
    fireEvent.click(screen.getByRole("menuitem", { name: COPY.editPot }));
    expect(handlers.onEdit).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Pot options: Savings" }));
    fireEvent.click(screen.getByRole("menuitem", { name: COPY.deletePot }));
    expect(handlers.onDelete).toHaveBeenCalledTimes(1);
  });
});

describe("PotsError (SPEC-pots 2.9; PO-Q1 (a) #2)", () => {
  it("says it couldn't load the pots, and Retry calls router.refresh()", () => {
    render(<PotsError />);
    expect(screen.getByText(COPY.potsLoadError)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: COPY.retry }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
