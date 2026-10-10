// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/src/shared/copy";
import { AmountField, AMOUNT_MAX_LENGTH } from "@/src/ui/AmountField";
import { FormFooter } from "@/src/ui/FormFooter";
import { HeaderAddButton, PageHeader } from "@/src/ui/PageHeader";
import { Notice, useNotice } from "@/src/ui/Notice";
import { SelectField, type SelectOption } from "@/src/ui/SelectField";
import { ThemeSwatch } from "@/src/ui/ThemeSwatch";
import { MAIN_CONTENT_ID } from "@/src/ui/main-content";

afterEach(cleanup);

describe("AmountField (SPEC-ui-kit 2.5; US-15 AC2, US-22 AC2, US-25 AC2, US-26 AC2)", () => {
  it("is a labelled text field with a decimal keyboard, no autocomplete, 32 characters and a hidden '$'", () => {
    const { container } = render(
      <AmountField id="max" name="maximum" label="Maximum Spend" placeholder="e.g. 2000" />,
    );
    const input = screen.getByRole("textbox", { name: "Maximum Spend" });
    expect(input.getAttribute("type")).toBe("text");
    expect(input.getAttribute("inputmode")).toBe("decimal");
    expect(input.getAttribute("autocomplete")).toBe("off");
    expect(input.getAttribute("maxlength")).toBe(String(AMOUNT_MAX_LENGTH));
    expect(input.getAttribute("placeholder")).toBe("e.g. 2000");
    const dollar = [...container.querySelectorAll("[aria-hidden='true']")].find(
      (el) => el.textContent === "$",
    );
    expect(dollar).toBeTruthy();
  });

  it("pre-fills an edit form and shows its error tied to the field", () => {
    const onBlur = vi.fn();
    render(
      <AmountField
        id="t"
        name="target"
        label="Target"
        defaultValue="2,000.00"
        error="Enter a valid amount"
        onBlur={onBlur}
      />,
    );
    const input = screen.getByRole("textbox", { name: "Target" }) as HTMLInputElement;
    expect(input.value).toBe("2,000.00");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Enter a valid amount")).toBeTruthy();
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});

const CATEGORIES: SelectOption<string>[] = [
  { value: "Bills", label: "Bills", used: true },
  { value: "Dining Out", label: "Dining Out" },
  { value: "Groceries", label: "Groceries" },
];

function Category({ error, onBlur = () => {} }: { error?: string; onBlur?: () => void }) {
  const [value, setValue] = useState<string | undefined>(undefined);
  return (
    <>
      <SelectField
        label="Budget Category"
        options={CATEGORIES}
        value={value}
        onChange={setValue}
        error={error}
        onBlur={onBlur}
      />
      <button type="button">next</button>
    </>
  );
}

describe("SelectField (SPEC-ui-kit 2.6; US-15 AC1, US-16 AC1, US-22 AC1, US-23 AC1)", () => {
  it("with no value the trigger is named by its label alone; a choice names it '{label}: {value}'", () => {
    render(<Category />);
    const trigger = screen.getByRole("button", { name: "Budget Category" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("option", { name: "Dining Out" }));
    expect(screen.getByRole("button", { name: "Budget Category: Dining Out" })).toBeTruthy();
  });

  it("a used option is aria-disabled, says 'Already used' in its name, and cannot be chosen", () => {
    render(<Category />);
    fireEvent.click(screen.getByRole("button", { name: "Budget Category" }));
    // jsdom's name joins the inline spans with spaces; a browser reads "Bills, Already used".
    const used = screen.getByRole("option", { name: /^Bills\s*,\s*Already used$/ });
    expect(used.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(used);
    expect(screen.queryByRole("button", { name: /Budget Category: Bills/ })).toBeNull();
  });

  it("an error is described on the trigger and announced politely; none means no description", () => {
    const { rerender } = render(<Category />);
    const trigger = screen.getByRole("button", { name: "Budget Category" });
    expect(trigger.getAttribute("aria-describedby")).toBeNull();
    rerender(<Category error="This field is required" />);
    const id = trigger.getAttribute("aria-describedby");
    const message = document.getElementById(id ?? "");
    expect(message?.textContent).toBe("This field is required");
    expect(message?.getAttribute("aria-live")).toBe("polite");
    expect(trigger.getAttribute("aria-invalid")).toBe("true");
  });

  it("onBlur runs when focus leaves the field as a whole, not while it moves into its list", () => {
    const onBlur = vi.fn();
    render(<Category onBlur={onBlur} />);
    const trigger = screen.getByRole("button", { name: "Budget Category" });
    fireEvent.click(trigger);
    const option = screen.getByRole("option", { name: "Groceries" });
    fireEvent.blur(trigger, { relatedTarget: option });
    expect(onBlur).not.toHaveBeenCalled();
    fireEvent.blur(trigger, { relatedTarget: screen.getByRole("button", { name: "next" }) });
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("a theme list draws a swatch per option and a check on the current theme", () => {
    const { container } = render(
      <SelectField
        label="Theme"
        themes
        options={[
          { value: "Green", label: "Green" },
          { value: "Cyan", label: "Cyan", used: true },
        ]}
        value="Green"
        onChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Theme: Green" }));
    expect(container.querySelectorAll("[data-theme]").length).toBe(3);
    const selected = screen.getByRole("option", { name: "Green" });
    expect(selected.querySelector("svg")).toBeTruthy();
  });
});

describe("ThemeSwatch (SPEC-ui-kit 2.10; US-25 AC1)", () => {
  it("is decorative, coloured through data-theme with no inline style", () => {
    const { container } = render(<ThemeSwatch theme="Navy Grey" unavailable />);
    const swatch = container.firstElementChild as HTMLElement;
    expect(swatch.getAttribute("aria-hidden")).toBe("true");
    expect(swatch.getAttribute("data-theme")).toBe("Navy Grey");
    expect(swatch.getAttribute("style")).toBeNull();
  });
});

describe("FormFooter (SPEC-ui-kit 2.7; US-15 AC3, US-22 AC3, US-31 AC3)", () => {
  it("the submit button is always enabled, with an empty role=alert area above it", () => {
    render(
      <form>
        <FormFooter label={COPY.addBudget} pending={false} error={undefined} />
      </form>,
    );
    const button = screen.getByRole("button", { name: COPY.addBudget });
    expect(button.getAttribute("type")).toBe("submit");
    expect(button.hasAttribute("disabled")).toBe(false);
    expect(button.getAttribute("aria-disabled")).toBeNull();
    expect(screen.getByRole("alert").textContent).toBe("");
  });

  it("pending: 'Saving…', aria-disabled, and a click does not submit", () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <FormFooter
          label={COPY.addBudget}
          pending
          error="Too many changes. Try again in 2 seconds"
        />
      </form>,
    );
    const button = screen.getByRole("button", { name: COPY.saving });
    expect(button.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("Too many changes. Try again in 2 seconds");
  });
});

describe("PageHeader's primary action (SPEC-ui-kit 2.8; US-15 AC1, US-22 AC1)", () => {
  it("renders the action in the header row; its '+' is hidden from the name", () => {
    const onClick = vi.fn();
    render(
      <PageHeader
        title="Budgets"
        primaryAction={<HeaderAddButton label={COPY.addNewBudget} onClick={onClick} />}
      />,
    );
    const button = screen.getByRole("button", { name: COPY.addNewBudget });
    expect(button.textContent?.startsWith("+")).toBe(true);
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Budgets");
  });
});

function NoticePage() {
  const { notice, show, clear } = useNotice();
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1}>
      <Notice notice={notice} onDismiss={clear} />
      <button type="button" onClick={() => show(COPY.budgetGone)}>
        show
      </button>
    </main>
  );
}

describe("Notice (SPEC-ui-kit 2.9; US-17 AC3, US-24 AC2)", () => {
  it("the status region is in the page, empty; the text arrives a frame later; dismissing empties it and focuses <main>", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
    try {
      render(<NoticePage />);
      const region = screen.getByRole("status");
      expect(region.textContent).toBe("");
      fireEvent.click(screen.getByRole("button", { name: "show" }));
      expect(region.textContent).toBe("");
      act(() => vi.advanceTimersToNextFrame());
      expect(region.textContent).toBe(COPY.budgetGone);
      fireEvent.click(screen.getByRole("button", { name: COPY.dismissNotice }));
      expect(screen.getByRole("status").textContent).toBe("");
      expect(document.activeElement?.id).toBe(MAIN_CONTENT_ID);
    } finally {
      vi.useRealTimers();
    }
  });

  it("the same text shown again is emptied first and announced again", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
    try {
      render(<NoticePage />);
      fireEvent.click(screen.getByRole("button", { name: "show" }));
      act(() => vi.advanceTimersToNextFrame());
      fireEvent.click(screen.getByRole("button", { name: "show" }));
      expect(screen.getByRole("status").textContent).toBe("");
      act(() => vi.advanceTimersToNextFrame());
      expect(screen.getByRole("status").textContent).toBe(COPY.budgetGone);
    } finally {
      vi.useRealTimers();
    }
  });
});
