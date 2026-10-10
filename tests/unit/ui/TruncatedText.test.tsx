// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TruncatedText } from "@/src/ui/TruncatedText";

/**
 * jsdom has no layout, so the widths `TruncatedText` measures are stubbed: `cut` makes every
 * element's content wider than its box (`scrollWidth > clientWidth`), as a name that does not fit.
 */
let cut = true;

beforeEach(() => {
  cut = true;
  vi.useFakeTimers();
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(() => (cut ? 300 : 100));
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => 100);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const NAME = "Savory Bites Bistro and Grill";

function renderName() {
  render(<TruncatedText text={NAME} />);
  return screen.getByText(NAME).parentElement!;
}

const tooltip = () => screen.queryByRole("tooltip");
const mouse = { pointerType: "mouse" } as const;
const touch = { pointerType: "touch" } as const;

function hoverOpen(name: HTMLElement) {
  fireEvent.pointerEnter(name, mouse);
  act(() => vi.advanceTimersByTime(400));
}

describe("TruncatedText (SPEC-transactions 2.9, SPEC-overview §2.3 §2.4 v1.4, H12)", () => {
  it("a name that fits is plain text: no focus stop, no tooltip on hover or focus", () => {
    cut = false;
    const name = renderName();
    expect(name.hasAttribute("tabindex")).toBe(false);
    fireEvent.pointerEnter(name, mouse);
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.focus(name);
    expect(tooltip()).toBeNull();
  });

  it("a cut name is a focus stop; the whole name stays in its text", () => {
    const name = renderName();
    expect(name.getAttribute("tabindex")).toBe("0");
    expect(name.textContent).toBe(NAME);
    expect(name.hasAttribute("aria-describedby")).toBe(false);
  });

  it("hover opens after 400 ms, not before; aria-describedby points at the tooltip only while open", () => {
    const name = renderName();
    fireEvent.pointerEnter(name, mouse);
    act(() => vi.advanceTimersByTime(399));
    expect(tooltip()).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    const open = screen.getByRole("tooltip");
    expect(open.textContent).toBe(NAME);
    expect(open.parentElement).toBe(document.body);
    expect(name.getAttribute("aria-describedby")).toBe(open.id);
  });

  it("leaving before 400 ms opens nothing", () => {
    const name = renderName();
    fireEvent.pointerEnter(name, mouse);
    act(() => vi.advanceTimersByTime(200));
    fireEvent.pointerLeave(name, mouse);
    act(() => vi.advanceTimersByTime(1000));
    expect(tooltip()).toBeNull();
  });

  it("stays open while the pointer moves from the name onto the tooltip; closes 150 ms after it leaves both", () => {
    const name = renderName();
    hoverOpen(name);
    fireEvent.pointerLeave(name, mouse);
    act(() => vi.advanceTimersByTime(100));
    fireEvent.pointerEnter(screen.getByRole("tooltip"), mouse);
    act(() => vi.advanceTimersByTime(1000));
    expect(tooltip()).not.toBeNull();

    fireEvent.pointerLeave(screen.getByRole("tooltip"), mouse);
    act(() => vi.advanceTimersByTime(149));
    expect(tooltip()).not.toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(tooltip()).toBeNull();
    expect(name.hasAttribute("aria-describedby")).toBe(false);
  });

  it("the pointer coming back onto the name cancels the close", () => {
    const name = renderName();
    hoverOpen(name);
    fireEvent.pointerLeave(name, mouse);
    act(() => vi.advanceTimersByTime(100));
    fireEvent.pointerEnter(name, mouse);
    act(() => vi.advanceTimersByTime(1000));
    expect(tooltip()).not.toBeNull();
  });

  it("keyboard: opens on focus at once; Escape closes it and focus stays on the name; blur closes it", () => {
    const name = renderName();
    act(() => name.focus());
    expect(tooltip()).not.toBeNull();
    fireEvent.keyDown(name, { key: "Escape" });
    expect(tooltip()).toBeNull();
    expect(document.activeElement).toBe(name);

    act(() => {
      name.blur();
      name.focus();
    });
    expect(tooltip()).not.toBeNull();
    act(() => name.blur());
    expect(tooltip()).toBeNull();
  });

  it("touch: a tap opens it, it is still open after 3 s and more (no timer), a second tap closes it", () => {
    const name = renderName();
    fireEvent.pointerDown(name, touch);
    fireEvent.pointerUp(name, touch);
    expect(tooltip()).not.toBeNull();
    act(() => vi.advanceTimersByTime(10_000));
    expect(tooltip()).not.toBeNull();
    fireEvent.pointerDown(name, touch);
    expect(tooltip()).toBeNull();
  });

  it("touch: a tap elsewhere closes it", () => {
    const name = renderName();
    fireEvent.pointerDown(name, touch);
    fireEvent.pointerUp(name, touch);
    fireEvent.pointerDown(document.body, touch);
    expect(tooltip()).toBeNull();
  });

  it("any input: a scroll or a resize closes it", () => {
    const name = renderName();
    hoverOpen(name);
    fireEvent.scroll(window);
    expect(tooltip()).toBeNull();

    act(() => name.focus());
    expect(tooltip()).not.toBeNull();
    fireEvent(window, new Event("resize"));
    expect(tooltip()).toBeNull();
  });

  it("one tooltip serves the page: opening a second name closes the first", () => {
    render(
      <>
        <TruncatedText text="First very long name" />
        <TruncatedText text="Second very long name" />
      </>,
    );
    hoverOpen(screen.getByText("First very long name").parentElement!);
    act(() => screen.getByText("Second very long name").parentElement!.focus());
    const open = screen.getAllByRole("tooltip");
    expect(open).toHaveLength(1);
    expect(open[0]!.textContent).toBe("Second very long name");
  });

  it("is placed above the name with an 8 px gap through element.style, and below it near the top", () => {
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(() => 120);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(() => 34);
    const rect = (top: number) =>
      ({ top, bottom: top + 21, left: 40, right: 140, width: 100, height: 21 }) as DOMRect;
    const name = renderName();
    const spy = vi.spyOn(name, "getBoundingClientRect").mockReturnValue(rect(300));
    hoverOpen(name);
    let open = screen.getByRole("tooltip");
    expect(open.style.top).toBe(`${300 - 8 - 34}px`);
    expect(open.style.left).toBe("40px");
    expect(open.dataset.side).toBe("above");
    expect(open.hasAttribute("style")).toBe(true);

    fireEvent.pointerLeave(name, mouse);
    act(() => vi.advanceTimersByTime(150));
    spy.mockReturnValue(rect(50));
    hoverOpen(name);
    open = screen.getByRole("tooltip");
    expect(open.style.top).toBe(`${50 + 21 + 8}px`);
    expect(open.dataset.side).toBe("below");
  });
});
