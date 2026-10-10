// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/src/shared/copy";
import type { RecurringBillsPageQuery } from "@/src/shared/recurring-bills-query";
import { ResultsRegion } from "@/src/ui/ResultsRegion";
import { BillsNav, SEARCH_DEBOUNCE_MS } from "@/src/ui/recurring-bills/BillsNav";
import { BillsToolbar } from "@/src/ui/recurring-bills/BillsToolbar";

const router = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/recurring-bills",
}));

const DEFAULT: RecurringBillsPageQuery = { q: undefined, sort: "latest" };
const STATUS = COPY.billsStatus(8);

beforeEach(() => {
  vi.useFakeTimers();
  router.push.mockReset();
  router.replace.mockReset();
  Element.prototype.scrollIntoView = () => {};
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(0), 0),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function Page({ effective = DEFAULT }: { effective?: RecurringBillsPageQuery }) {
  return (
    <BillsNav effective={effective}>
      <BillsToolbar />
      <ResultsRegion status={STATUS}>
        <p>rows</p>
      </ResultsRegion>
    </BillsNav>
  );
}

const field = () => screen.getByRole("textbox", { name: COPY.searchBillsLabel });
const type = (text: string) => fireEvent.change(field(), { target: { value: text } });
const chooseSort = (label: string) => {
  fireEvent.click(screen.getByRole("button", { name: /^Sort by:/ }));
  fireEvent.click(screen.getByRole("option", { name: label }));
};

describe("BillsNav (SPEC-recurring-bills 2.5, 2.10, US-29 AC1, US-30 AC1)", () => {
  it("the field: a hidden label, the placeholder, maxLength 60 and autocomplete off", () => {
    render(<Page />);
    expect(field().getAttribute("placeholder")).toBe(COPY.searchBillsPlaceholder);
    expect(field().getAttribute("maxlength")).toBe("60");
    expect(field().getAttribute("autocomplete")).toBe("off");
    expect(field().closest('[role="search"]')).not.toBeNull();
  });

  it("a search writes the URL by replace 250 ms after the last keystroke, with scroll: false", () => {
    render(<Page effective={{ ...DEFAULT, sort: "highest" }} />);
    type("d");
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1));
    type("da");
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1));
    expect(router.replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith("/recurring-bills?q=da&sort=highest", {
      scroll: false,
    });
    expect(router.push).not.toHaveBeenCalled();
  });

  it("Enter applies the search at once; the needle is trimmed; the same needle again does nothing", () => {
    render(<Page />);
    type("  flow  ");
    fireEvent.keyDown(field(), { key: "Enter" });
    expect(router.replace).toHaveBeenCalledWith("/recurring-bills?q=flow", { scroll: false });
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    type("flow ");
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    expect(router.replace).toHaveBeenCalledTimes(1);
  });

  it("a sort choice during the debounce applies the typed q first and keeps it, by push", () => {
    render(<Page />);
    type("data");
    act(() => vi.advanceTimersByTime(100));
    chooseSort("Oldest");
    expect(router.push).toHaveBeenCalledWith("/recurring-bills?q=data&sort=oldest", {
      scroll: false,
    });
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 2));
    expect(router.replace).not.toHaveBeenCalled();
    expect(field()).toHaveProperty("value", "data");
    expect(screen.getByRole("button", { name: /^Sort by:/ }).getAttribute("aria-label")).toBe(
      COPY.menuTriggerName(COPY.sortBy, "Oldest"),
    );
  });

  it("the current option pushes nothing", () => {
    render(<Page effective={{ ...DEFAULT, sort: "lowest" }} />);
    chooseSort("Lowest");
    expect(router.push).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("popstate resets the field from the URL, even while it has focus", () => {
    const { rerender } = render(<Page effective={{ ...DEFAULT, q: "data" }} />);
    field().focus();
    type("datab");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    rerender(<Page effective={{ ...DEFAULT, q: "byte" }} />);
    expect(document.activeElement).toBe(field());
    expect(field()).toHaveProperty("value", "byte");
  });

  it("a server answer never rewrites the text the person is typing", () => {
    const { rerender } = render(<Page />);
    type("by");
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    type("byt");
    rerender(<Page effective={{ ...DEFAULT, q: "by" }} />);
    expect(field()).toHaveProperty("value", "byt");
  });

  it("the status line is empty on first render, then emptied and set again after a sort change", () => {
    const { rerender } = render(<Page />);
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("");
    chooseSort("Oldest");
    rerender(<Page effective={{ ...DEFAULT, sort: "oldest" }} />);
    act(() => vi.advanceTimersByTime(1));
    expect(status.textContent).toBe(STATUS);
    chooseSort("Latest");
    rerender(<Page effective={DEFAULT} />);
    expect(status.textContent).toBe("");
    act(() => vi.advanceTimersByTime(1));
    expect(status.textContent).toBe(STATUS);
  });
});
