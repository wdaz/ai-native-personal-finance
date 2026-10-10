// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { moneyPreview } from "@/src/domain/pots";
import { COPY } from "@/src/shared/copy";
import type { PotDto } from "@/src/shared/schemas";
import type { WriteAnswer } from "@/src/shared/write-feedback";
import { MoneyModal, type MoneyModalProps } from "@/src/ui/pots/MoneyModal";

vi.mock("@/src/ui/reload", () => ({ reloadPage: vi.fn() }));

/** Synthetic: 159 of 2,000 with a 4,836.00 balance — 4.3's first example's shape. */
const POT: PotDto = {
  id: "3f1c2b8e-5a7d-4c1e-9b2a-6d8e0f4a1c3b",
  name: "Savings",
  theme: "Green",
  target: 200_000,
  total: 15_900,
  percentBasisPoints: 795,
};
const BALANCE = 483_600;

let props: MoneyModalProps;
beforeEach(() => {
  props = {
    move: { kind: "add", pot: POT },
    balance: BALANCE,
    preview: (amount) => moneyPreview(POT, props.move?.kind ?? "add", amount, props.balance),
    onClose: vi.fn(),
    onSubmit: vi.fn(async (): Promise<WriteAnswer<unknown>> => ({ kind: "ok", data: null })),
    onDone: vi.fn(),
    onStale: vi.fn(),
  };
});
afterEach(cleanup);

function open(overrides: Partial<MoneyModalProps> = {}) {
  Object.assign(props, overrides);
  render(<MoneyModal {...props} />);
  const kind = props.move?.kind ?? "add";
  const field = screen.getByRole("textbox", {
    name: kind === "add" ? COPY.amountToAdd : COPY.amountToWithdraw,
  }) as HTMLInputElement;
  return { dialog: screen.getByRole("dialog"), field };
}

const type = (field: HTMLInputElement, text: string) => {
  fireEvent.change(field, { target: { value: text } });
  fireEvent.input(field, { target: { value: text } });
};
const segment = (name: string) =>
  document.querySelector(`[data-segment='${name}']`) as SVGRectElement;

describe("MoneyModal (SPEC-pots 2.6; US-25, US-26, PO-Q2 (a), PO-Q5 (a))", () => {
  it("opens titled with the curly quotes, focus on the amount, the preview at the current total", () => {
    const { dialog, field } = open();
    expect(screen.getByRole("heading", { name: "Add to ‘Savings’" })).toBeTruthy();
    expect(document.activeElement).toBe(field);
    expect(dialog.textContent).toContain(COPY.newAmount);
    expect(dialog.textContent).toContain("$159.00");
    expect(dialog.textContent).toContain("7.95%");
    expect(segment("moving").getAttribute("width")).toBe("0%");
  });

  it("the preview follows the typed text with no message: $100 → $259.00, 12.95%, 7.95% + 5.00% (4.3)", () => {
    const { dialog, field } = open();
    type(field, "100");
    expect(dialog.textContent).toContain("$259.00");
    expect(dialog.textContent).toContain("12.95%");
    expect(segment("staying").getAttribute("width")).toBe("7.95%");
    expect(segment("moving").getAttribute("x")).toBe("7.95%");
    expect(segment("moving").getAttribute("width")).toBe("5.00%");
    expect(field.getAttribute("aria-invalid")).toBeNull();
    expect(screen.queryByText(COPY.depositOverBalance)).toBeNull();
  });

  it("the corners (§19e, §25f): the staying segment square, the moving one rounded with a square copy clipped to its inner edge", () => {
    const { field } = open();
    type(field, "100");
    const edge = segment("moving-edge");
    expect(segment("staying").getAttribute("rx")).toBeNull();
    expect(edge.getAttribute("clip-path")).toMatch(/^url\(#.+\)$/);
    expect(edge.getAttribute("x")).toBe(segment("moving").getAttribute("x"));
    expect(edge.getAttribute("width")).toBe(segment("moving").getAttribute("width"));
    const clip = document.querySelector("clipPath rect");
    expect(clip?.getAttribute("x")).toBe("7.95%");
    expect(clip?.getAttribute("width")).toBe("4");
    type(field, "");
    expect(segment("moving-edge").getAttribute("width")).toBe("0%");
  });

  it("text that is not an amount moves nothing; an amount over the balance is clamped in the preview", () => {
    const { dialog, field } = open();
    type(field, "abc");
    expect(dialog.textContent).toContain("$159.00");
    type(field, "4836.01");
    expect(dialog.textContent).toContain("$4,995.00");
    expect(dialog.textContent).toContain("249.75%");
  });

  it("a withdrawal is red and clamps at the pot's total", () => {
    const { dialog, field } = open({ move: { kind: "withdraw", pot: POT } });
    expect(screen.getByRole("heading", { name: "Withdraw from ‘Savings’" })).toBeTruthy();
    type(field, "500");
    expect(dialog.textContent).toContain("$0.00");
    expect(dialog.textContent).toContain("0.00%");
  });

  it("has no separate current-total line (PO-Q5 (a))", () => {
    const { dialog } = open();
    expect(dialog.textContent?.match(/\$159\.00/g)).toHaveLength(1);
  });

  it("checks on blur: over the balance → 'Amount exceeds your current balance'; equal is allowed", () => {
    const { field } = open();
    type(field, "4836.01");
    fireEvent.blur(field);
    expect(screen.getByText(COPY.depositOverBalance)).toBeTruthy();
    type(field, "4836.00");
    expect(screen.getByText(COPY.depositOverBalance)).toBeTruthy(); // typing does not clear it
    fireEvent.blur(field);
    expect(screen.queryByText(COPY.depositOverBalance)).toBeNull();
  });

  it.each([
    ["", COPY.required],
    ["abc", COPY.amountFormat],
    ["0", COPY.amountNotPositive],
    ["-5", COPY.amountNotPositive],
    ["1,000,000,000", COPY.amountTooLarge],
    ["0.01", COPY.depositOverBalance],
  ])("at a $0.00 balance, %j shows %j once checked (PO-Q2 (a))", (text, message) => {
    const { field } = open({ balance: 0 });
    type(field, text);
    fireEvent.blur(field);
    expect(screen.getByText(message)).toBeTruthy();
  });

  it("a withdrawal over the pot's total: 'Amount exceeds this pot's total'", () => {
    const { field } = open({ move: { kind: "withdraw", pot: POT } });
    type(field, "159.01");
    fireEvent.blur(field);
    expect(screen.getByText(COPY.withdrawalOverTotal)).toBeTruthy();
  });

  it("an invalid submit focuses the field and sends nothing; a valid one sends the cents", async () => {
    const { field } = open();
    fireEvent.click(screen.getByRole("button", { name: COPY.confirmAddition }));
    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(field);
    type(field, "100");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: COPY.confirmAddition }));
    });
    expect(props.onSubmit).toHaveBeenCalledWith(10_000);
    expect(props.onDone).toHaveBeenCalledWith({ kind: "ok", data: null });
  });

  it("a server exceeds_balance shows under the field, refreshes the page's data and stays open", async () => {
    props.onSubmit = vi.fn(async () => ({
      kind: "validation" as const,
      issues: [{ path: ["amount"], code: "exceeds_balance" as const }],
    }));
    const { field } = open();
    type(field, "100");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: COPY.confirmAddition }));
    });
    expect(screen.getByText(COPY.depositOverBalance)).toBeTruthy();
    expect(props.onStale).toHaveBeenCalledTimes(1);
    expect(props.onDone).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("a 400 whose issues name no amount shows in the form's error area; the field stays valid", async () => {
    props.onSubmit = vi.fn(async () => ({
      kind: "validation" as const,
      issues: [{ path: ["id"], code: "invalid_format" as const }],
    }));
    const { field } = open();
    type(field, "1");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: COPY.confirmAddition }));
    });
    expect(screen.getByRole("alert").textContent).toBe(COPY.signupFailed);
    expect(field.getAttribute("aria-invalid")).toBeNull();
  });

  it("a 404 is handed to the page (the notice); a 429 shows its message in the error area", async () => {
    props.onSubmit = vi.fn(async () => ({ kind: "gone" as const }));
    const { field } = open();
    type(field, "1");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: COPY.confirmAddition }));
    });
    expect(props.onDone).toHaveBeenCalledWith({ kind: "gone" });
    cleanup();
    props.onSubmit = vi.fn(async () => ({
      kind: "failed" as const,
      code: "rate_limited" as const,
      message: COPY.writeRateLimited(30),
    }));
    const again = open();
    type(again.field, "1");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: COPY.confirmAddition }));
    });
    expect(screen.getByRole("alert").textContent).toBe(COPY.writeRateLimited(30));
  });
});
