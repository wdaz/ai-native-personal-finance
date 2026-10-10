// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResultsNavContext, ResultsRegion, type ResultsNavState } from "@/src/ui/ResultsRegion";

beforeEach(() => {
  vi.useFakeTimers();
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

function Region({ state, status }: { state: ResultsNavState; status: string }) {
  return (
    <ResultsNavContext.Provider value={state}>
      <ResultsRegion status={status}>
        <p>rows</p>
      </ResultsRegion>
    </ResultsNavContext.Provider>
  );
}

describe("ResultsRegion (SPEC-recurring-bills §6: shared by the list pages; SPEC-transactions 2.10)", () => {
  it("needs a list page's navigation provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <ResultsRegion status="8 bills">
          <p>rows</p>
        </ResultsRegion>,
      ),
    ).toThrow("ResultsRegion needs a list page's navigation provider");
  });

  it("is aria-busy while a control's navigation is pending, and keeps its rows", () => {
    const { rerender } = render(<Region state={{ pending: true, changes: 1 }} status="8 bills" />);
    expect(screen.getByText("rows").parentElement?.getAttribute("aria-busy")).toBe("true");
    rerender(<Region state={{ pending: false, changes: 1 }} status="8 bills" />);
    expect(screen.getByText("rows").parentElement?.getAttribute("aria-busy")).toBe("false");
  });

  it("says nothing on first render, then the status after each change, emptied first so a repeat is heard", () => {
    const { rerender } = render(<Region state={{ pending: false, changes: 0 }} status="8 bills" />);
    expect(screen.getByRole("status").textContent).toBe("");
    rerender(<Region state={{ pending: false, changes: 1 }} status="8 bills" />);
    expect(screen.getByRole("status").textContent).toBe("");
    act(() => vi.runAllTimers());
    expect(screen.getByRole("status").textContent).toBe("8 bills");
    rerender(<Region state={{ pending: false, changes: 2 }} status="8 bills" />);
    expect(screen.getByRole("status").textContent).toBe("");
    act(() => vi.runAllTimers());
    expect(screen.getByRole("status").textContent).toBe("8 bills");
  });
});
