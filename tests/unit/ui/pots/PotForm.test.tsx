// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { firstFreeTheme, isPotNameTaken } from "@/src/domain/pots";
import { COPY } from "@/src/shared/copy";
import { THEMES } from "@/src/shared/enums";
import type { PotDto } from "@/src/shared/schemas";
import type { WriteAnswer } from "@/src/shared/write-feedback";
import { PotForm, type PotFormProps } from "@/src/ui/pots/PotForm";

vi.mock("@/src/ui/reload", () => ({ reloadPage: vi.fn() }));

const uuid = (n: number) => `3f1c2b8e-5a7d-4c1e-9b2a-${String(n).padStart(12, "0")}`;
/** Synthetic pots on the first five themes, not seed data. */
const POTS: PotDto[] = THEMES.slice(0, 5).map((theme, i) => ({
  id: uuid(i),
  name: `Pot ${i}`,
  theme,
  target: 100_000,
  total: 0,
  percentBasisPoints: 0,
}));

let props: PotFormProps;
beforeEach(() => {
  props = {
    mode: "add",
    pots: POTS,
    isNameTaken: isPotNameTaken,
    firstFreeTheme,
    onClose: vi.fn(),
    onSubmit: vi.fn(async (): Promise<WriteAnswer<unknown>> => ({ kind: "ok", data: null })),
    onDone: vi.fn(),
    onStale: vi.fn(),
  };
});
afterEach(cleanup);

function open(overrides: Partial<PotFormProps> = {}) {
  Object.assign(props, overrides);
  render(<PotForm {...props} />);
  return {
    name: screen.getByRole("textbox", { name: COPY.potName }) as HTMLInputElement,
    target: screen.getByRole("textbox", { name: COPY.target }) as HTMLInputElement,
    theme: screen.getByRole("button", { name: /^Theme/ }),
  };
}
const type = (field: HTMLInputElement, text: string) => {
  fireEvent.change(field, { target: { value: text } });
  fireEvent.input(field, { target: { value: text } });
};
const submit = (label: string) =>
  act(async () => {
    fireEvent.click(screen.getByRole("button", { name: label }));
  });

describe("PotForm (SPEC-pots 2.5; US-22, US-23, PO-Q4 (a))", () => {
  it("add: the title, the fields in order, focus on Pot Name, the first free theme", () => {
    const { name, target, theme } = open();
    expect(screen.getByRole("heading", { name: COPY.addNewPot })).toBeTruthy();
    expect(document.activeElement).toBe(name);
    expect(name.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(target.compareDocumentPosition(theme) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(name.getAttribute("maxlength")).toBe("30");
    expect(name.getAttribute("placeholder")).toBe(COPY.potNamePlaceholder);
    expect(target.getAttribute("placeholder")).toBe(COPY.amountPlaceholder);
    expect(theme.textContent).toContain(THEMES[5]);
  });

  it("the counter is the field's helper, follows the typed text and is singular at 1 (US-22 AC1)", () => {
    const { name } = open();
    const helper = () => document.getElementById(`${name.id}-helper`);
    expect(helper()?.textContent).toBe("30 characters left");
    expect(name.getAttribute("aria-describedby")).toContain(`${name.id}-helper`);
    expect(helper()?.getAttribute("aria-live")).toBeNull();
    type(name, "a".repeat(29));
    expect(helper()?.textContent).toBe("1 character left");
    type(name, "Savings");
    expect(helper()?.textContent).toBe("23 characters left");
  });

  it("input → counter → message in the DOM (§19g)", () => {
    const { name } = open();
    fireEvent.blur(name);
    const helper = document.getElementById(`${name.id}-helper`);
    const error = document.getElementById(`${name.id}-error`);
    expect(error?.textContent).toBe(COPY.required);
    expect(name.compareDocumentPosition(helper!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(helper!.compareDocumentPosition(error!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("another pot's name, trimmed and in any case, is taken (US-22 AC2); typing does not clear it", () => {
    const { name } = open();
    type(name, "  pot 1  ");
    fireEvent.blur(name);
    expect(screen.getByText(COPY.potNameTaken)).toBeTruthy();
    type(name, "Pot 9");
    expect(screen.getByText(COPY.potNameTaken)).toBeTruthy();
    fireEvent.blur(name);
    expect(screen.queryByText(COPY.potNameTaken)).toBeNull();
  });

  it("an invalid submit shows the messages, focuses the first invalid field and sends nothing", async () => {
    const { name, target } = open();
    await submit(COPY.addPotSubmit);
    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(name);
    type(name, "New");
    await submit(COPY.addPotSubmit);
    expect(document.activeElement).toBe(target);
    expect(screen.getByText(COPY.required)).toBeTruthy();
  });

  it("a valid add sends the trimmed name, the cents and the theme", async () => {
    const { name, target } = open();
    type(name, "  Rainy Days ");
    type(target, "2,000.50");
    await submit(COPY.addPotSubmit);
    expect(props.onSubmit).toHaveBeenCalledWith({
      name: "Rainy Days",
      target: 200_050,
      theme: THEMES[5],
    });
    expect(props.onDone).toHaveBeenCalledWith({ kind: "ok", data: null });
  });

  it("edit: pre-filled; its own name and theme are valid (US-23 AC1)", async () => {
    const pot = POTS[1]!;
    const { name, target, theme } = open({ mode: { edit: pot } });
    expect(screen.getByRole("heading", { name: COPY.editPot })).toBeTruthy();
    expect(name.value).toBe(pot.name);
    expect(target.value).toBe("1000");
    expect(theme.textContent).toContain(pot.theme);
    type(name, pot.name.toUpperCase());
    await submit(COPY.saveChanges);
    expect(props.onSubmit).toHaveBeenCalledWith({
      name: pot.name.toUpperCase(),
      target: 100_000,
      theme: pot.theme,
    });
  });

  it("with every theme used (PO-Q4 (a)): no theme, 'All themes already have a pot' at once, submit sends nothing", async () => {
    const all: PotDto[] = THEMES.map((theme, i) => ({
      ...POTS[0]!,
      id: uuid(i),
      name: `P${i}`,
      theme,
    }));
    const { name, target } = open({ pots: all });
    expect(screen.getByText(COPY.allThemesUsed)).toBeTruthy();
    type(name, "New");
    type(target, "10");
    await submit(COPY.addPotSubmit);
    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByText(COPY.allThemesUsed)).toHaveLength(1);
    expect(document.activeElement?.getAttribute("aria-haspopup")).toBe("listbox");
  });

  it("a 400 under no field shows in the form's error area, never silence", async () => {
    props.onSubmit = vi.fn(async () => ({
      kind: "validation" as const,
      issues: [{ path: [], code: "invalid_format" as const }],
    }));
    const { name, target } = open();
    type(name, "New");
    type(target, "10");
    await submit(COPY.addPotSubmit);
    expect(screen.getByRole("alert").textContent).toBe(COPY.signupFailed);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("a server `taken` shows under its field and refreshes the page's data; the form stays open", async () => {
    props.onSubmit = vi.fn(async () => ({
      kind: "validation" as const,
      issues: [
        { path: ["name"], code: "taken" as const },
        { path: ["theme"], code: "taken" as const },
      ],
    }));
    const { name, target } = open();
    type(name, "New");
    type(target, "10");
    await submit(COPY.addPotSubmit);
    expect(screen.getByText(COPY.potNameTaken)).toBeTruthy();
    expect(screen.getByText(COPY.alreadyUsed)).toBeTruthy();
    expect(props.onStale).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(document.activeElement).toBe(name);
  });
});
