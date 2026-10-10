// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Menu, type MenuOption } from "@/src/ui/Menu";

const OPTIONS: MenuOption<string>[] = [
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
  { value: "a-to-z", label: "A to Z" },
  { value: "z-to-a", label: "Z to A" },
];

let scrolled: string[] = [];
beforeEach(() => {
  scrolled = [];
  Element.prototype.scrollIntoView = function (this: Element) {
    scrolled.push(this.id);
  };
});
afterEach(cleanup);

function Harness({
  options = OPTIONS,
  initial = "latest",
  onChange = () => {},
  label = "Sort by",
}: {
  options?: MenuOption<string>[];
  initial?: string;
  onChange?: (value: string) => void;
  label?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <Menu
      label={label}
      options={options}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

const trigger = (name = /^Sort by:/) => screen.getByRole("button", { name });
const listbox = () => screen.queryByRole("listbox");
const highlighted = () => {
  const id = listbox()?.getAttribute("aria-activedescendant");
  return id ? document.getElementById(id)?.textContent : undefined;
};
const key = (element: Element, k: string, init: object = {}) =>
  fireEvent.keyDown(element, { key: k, ...init });

describe("Menu (SPEC-transactions 2.8, US-32 AC1, NFR-A4)", () => {
  it("the trigger: a button with aria-haspopup, aria-expanded, aria-controls and one name '{label}: {current}'", () => {
    render(<Harness />);
    const button = trigger();
    expect(button.getAttribute("aria-label")).toBe("Sort by: Latest");
    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("aria-haspopup")).toBe("listbox");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.getAttribute("aria-controls")).toBeTruthy();
    expect(listbox()).toBeNull();
  });

  it("the open panel: a listbox labelled by the label, one option each, the current one aria-selected", () => {
    render(<Harness initial="oldest" />);
    fireEvent.click(trigger());
    const list = listbox()!;
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(trigger().getAttribute("aria-controls")).toBe(list.id);
    expect(document.getElementById(list.getAttribute("aria-labelledby")!)?.textContent).toBe(
      "Sort by",
    );
    const options = screen.getAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual(OPTIONS.map((o) => o.label));
    expect(options.map((option) => option.getAttribute("aria-selected"))).toEqual([
      "false",
      "true",
      "false",
      "false",
    ]);
    expect(document.activeElement).toBe(list);
  });

  it.each(["Enter", " ", "ArrowDown"])(
    "%j on the trigger opens it and highlights the current option",
    (k) => {
      render(<Harness initial="a-to-z" />);
      key(trigger(), k);
      expect(listbox()).not.toBeNull();
      expect(highlighted()).toBe("A to Z");
    },
  );

  it("ArrowUp on the trigger opens it and highlights the current option", () => {
    render(<Harness initial="oldest" />);
    key(trigger(), "ArrowUp");
    expect(highlighted()).toBe("Oldest");
  });

  it("with no current option, opening highlights the first", () => {
    render(<Harness initial="nope" />);
    expect(trigger(/^Sort by/).getAttribute("aria-label")).toBe("Sort by: ");
    key(trigger(/^Sort by/), "Enter");
    expect(highlighted()).toBe("Latest");
  });

  it("ArrowDown and ArrowUp move the highlight without wrapping; Home and End jump; each move scrolls into view", () => {
    render(<Harness />);
    key(trigger(), "Enter");
    const list = listbox()!;
    key(list, "ArrowUp");
    expect(highlighted()).toBe("Latest");
    key(list, "ArrowDown");
    key(list, "ArrowDown");
    expect(highlighted()).toBe("A to Z");
    key(list, "End");
    expect(highlighted()).toBe("Z to A");
    key(list, "ArrowDown");
    expect(highlighted()).toBe("Z to A");
    key(list, "Home");
    expect(highlighted()).toBe("Latest");
    expect(scrolled.at(-1)).toBe(list.getAttribute("aria-activedescendant"));
    expect(scrolled.length).toBeGreaterThanOrEqual(4);
  });

  it.each(["Enter", " "])(
    "%j chooses the highlighted option, closes, returns focus to the trigger",
    (k) => {
      const onChange = vi.fn();
      render(<Harness onChange={onChange} />);
      key(trigger(), "Enter");
      key(listbox()!, "ArrowDown");
      key(listbox()!, k);
      expect(onChange).toHaveBeenCalledWith("oldest");
      expect(listbox()).toBeNull();
      expect(document.activeElement).toBe(trigger(/^Sort by: Oldest$/));
    },
  );

  it("Escape closes without choosing and returns focus to the trigger", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    key(trigger(), "Enter");
    key(listbox()!, "ArrowDown");
    key(listbox()!, "Escape");
    expect(onChange).not.toHaveBeenCalled();
    expect(listbox()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it.each([{}, { shiftKey: true }])(
    "Tab %o closes without choosing and puts focus on the trigger first (the browser moves on from there)",
    (init) => {
      const onChange = vi.fn();
      render(<Harness onChange={onChange} />);
      key(trigger(), "Enter");
      const event = fireEvent.keyDown(listbox()!, { key: "Tab", ...init });
      expect(event).toBe(true); // not prevented: the browser's own Tab move follows
      expect(onChange).not.toHaveBeenCalled();
      expect(listbox()).toBeNull();
      expect(document.activeElement).toBe(trigger());
    },
  );

  it("a click on the trigger opens and closes; a click on an option chooses it", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(trigger());
    expect(listbox()).not.toBeNull();
    fireEvent.click(trigger());
    expect(listbox()).toBeNull();
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole("option", { name: "Z to A" }));
    expect(onChange).toHaveBeenCalledWith("z-to-a");
    expect(trigger().getAttribute("aria-label")).toBe("Sort by: Z to A");
  });

  it("a press anywhere outside closes it", () => {
    render(
      <>
        <Harness />
        <p>outside</p>
      </>,
    );
    fireEvent.click(trigger());
    fireEvent.pointerDown(screen.getByText("outside"));
    expect(listbox()).toBeNull();
  });

  it("opening one menu closes the other", () => {
    render(
      <>
        <Harness />
        <Harness
          label="Category"
          options={[{ value: "all", label: "All Transactions" }]}
          initial="all"
        />
      </>,
    );
    fireEvent.click(trigger());
    expect(screen.getAllByRole("listbox")).toHaveLength(1);
    fireEvent.click(trigger(/^Category:/));
    const lists = screen.getAllByRole("listbox");
    expect(lists).toHaveLength(1);
    expect(document.getElementById(lists[0]!.getAttribute("aria-labelledby")!)?.textContent).toBe(
      "Category",
    );
  });

  it("a disabled option is shown with aria-disabled, skipped by the arrow keys and Home/End, and never chosen", () => {
    const onChange = vi.fn();
    const options = [
      { value: "a", label: "A", disabled: true },
      { value: "b", label: "B" },
      { value: "c", label: "C", disabled: true },
      { value: "d", label: "D" },
      { value: "e", label: "E", disabled: true },
    ];
    render(<Harness options={options} initial="a" onChange={onChange} label="Theme" />);
    key(trigger(/^Theme:/), "Enter");
    expect(highlighted()).toBe("B"); // the current option is disabled → the first enabled one
    const list = listbox()!;
    expect(screen.getByRole("option", { name: "C" }).getAttribute("aria-disabled")).toBe("true");
    key(list, "ArrowDown");
    expect(highlighted()).toBe("D");
    key(list, "ArrowDown");
    expect(highlighted()).toBe("D");
    key(list, "Home");
    expect(highlighted()).toBe("B");
    key(list, "End");
    expect(highlighted()).toBe("D");
    fireEvent.click(screen.getByRole("option", { name: "C" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(listbox()).not.toBeNull();
  });
});
