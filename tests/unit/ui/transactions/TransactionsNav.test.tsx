// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/src/shared/copy";
import type { TransactionsQuery } from "@/src/shared/transactions-query";
import { ResultsRegion } from "@/src/ui/transactions/ResultsRegion";
import { SEARCH_DEBOUNCE_MS, TransactionsNav } from "@/src/ui/transactions/TransactionsNav";
import { TransactionsPagination } from "@/src/ui/transactions/TransactionsPagination";
import { TransactionsToolbar } from "@/src/ui/transactions/TransactionsToolbar";

const router = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/transactions",
}));

const DEFAULT: TransactionsQuery = { q: undefined, category: undefined, sort: "latest", page: 1 };

beforeEach(() => {
  vi.useFakeTimers();
  router.push.mockReset();
  router.replace.mockReset();
  Element.prototype.scrollIntoView = () => {};
  // jsdom has no animation frames under fake timers' control unless stubbed.
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

function Page({ effective = DEFAULT, status = "49 transactions, page 1 of 5" }) {
  return (
    <TransactionsNav effective={effective}>
      <TransactionsToolbar />
      <ResultsRegion status={status}>
        <p>rows</p>
      </ResultsRegion>
      <TransactionsPagination pageCount={5} total={49} />
    </TransactionsNav>
  );
}

const field = () => screen.getByRole("textbox", { name: COPY.searchTransactionsLabel });
const type = (text: string) => fireEvent.change(field(), { target: { value: text } });
const chooseSort = (label: string) => {
  fireEvent.click(screen.getByRole("button", { name: /^Sort by:/ }));
  fireEvent.click(screen.getByRole("option", { name: label }));
};

describe("TransactionsNav (SPEC-transactions 2.5, 2.10, US-10 AC1, US-11 AC2)", () => {
  it("a search writes the URL by replace 250 ms after the last keystroke, from page 1, with scroll: false", () => {
    render(<Page effective={{ ...DEFAULT, page: 3 }} />);
    type("c");
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1));
    type("co");
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1));
    expect(router.replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith("/transactions?q=co", { scroll: false });
    expect(router.push).not.toHaveBeenCalled();
  });

  it("Enter applies the search at once; the needle is trimmed; the same needle again does nothing", () => {
    render(<Page />);
    type("  co  ");
    fireEvent.keyDown(field(), { key: "Enter" });
    expect(router.replace).toHaveBeenCalledWith("/transactions?q=co", { scroll: false });
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    type("co ");
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    expect(router.replace).toHaveBeenCalledTimes(1);
  });

  it("only spaces is an empty search: nothing to write", () => {
    render(<Page />);
    type("   ");
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("a menu choice during the debounce applies the typed q first and keeps it; no debounce fires after it", () => {
    render(<Page />);
    type("co");
    act(() => vi.advanceTimersByTime(100));
    chooseSort("Oldest");
    expect(router.push).toHaveBeenCalledWith("/transactions?q=co&sort=oldest", { scroll: false });
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 2));
    expect(router.replace).not.toHaveBeenCalled();
    expect(field()).toHaveProperty("value", "co");
  });

  it("a page change during the debounce applies the typed q first", () => {
    render(<Page />);
    type("a");
    fireEvent.click(screen.getAllByRole("button", { name: "Page 2" })[0]!);
    expect(router.push).toHaveBeenCalledWith("/transactions?q=a&page=2", { scroll: false });
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 2));
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("a sort or category choice clears the page; controls keep each other's values", () => {
    render(<Page effective={{ ...DEFAULT, q: "a", page: 2 }} />);
    fireEvent.click(screen.getByRole("button", { name: /^Category:/ }));
    fireEvent.click(screen.getByRole("option", { name: "Dining Out" }));
    expect(router.push).toHaveBeenLastCalledWith("/transactions?q=a&category=Dining+Out", {
      scroll: false,
    });
    chooseSort("A to Z");
    expect(router.push).toHaveBeenLastCalledWith(
      "/transactions?q=a&category=Dining+Out&sort=a-to-z",
      { scroll: false },
    );
    expect(screen.getByRole("button", { name: /^Sort by:/ }).getAttribute("aria-label")).toBe(
      "Sort by: A to Z",
    );
  });

  it("the current option or the current page pushes nothing", () => {
    render(<Page effective={{ ...DEFAULT, page: 2 }} />);
    chooseSort("Latest");
    fireEvent.click(screen.getByRole("button", { name: /^Category:/ }));
    fireEvent.click(screen.getByRole("option", { name: "All Transactions" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Page 2" })[0]!);
    expect(router.push).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("popstate resets the field from the URL, even while it has focus", () => {
    const { rerender } = render(<Page effective={{ ...DEFAULT, q: "co" }} />);
    field().focus();
    type("cof");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    rerender(<Page effective={{ ...DEFAULT, q: "emma" }} />);
    expect(document.activeElement).toBe(field());
    expect(field()).toHaveProperty("value", "emma");
  });

  it("a server answer never rewrites the text the person is typing", () => {
    const { rerender } = render(<Page />);
    type("co");
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    type("cof");
    rerender(<Page effective={{ ...DEFAULT, q: "co" }} />);
    expect(field()).toHaveProperty("value", "cof");
  });

  it("the status line is empty on first render, then emptied and set again after each change", () => {
    const { rerender } = render(<Page />);
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("");
    chooseSort("Oldest");
    rerender(<Page effective={{ ...DEFAULT, sort: "oldest" }} />);
    act(() => vi.advanceTimersByTime(1));
    expect(status.textContent).toBe("49 transactions, page 1 of 5");
    chooseSort("Latest");
    rerender(<Page effective={DEFAULT} />);
    expect(status.textContent).toBe("");
    act(() => vi.advanceTimersByTime(1));
    expect(status.textContent).toBe("49 transactions, page 1 of 5");
  });
});
