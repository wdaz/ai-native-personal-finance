// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "@/src/ui/useDebouncedValue";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const DELAY = 250; // SPEC-transactions 2.5 and 4.1 (US-10 AC1 allows at most 300)

describe("useDebouncedValue (SPEC-transactions 2.5, US-10 AC1)", () => {
  it("gives the new value 250 ms after the last change, not before", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, DELAY), {
      initialProps: { value: "" },
    });
    rerender({ value: "c" });
    act(() => vi.advanceTimersByTime(DELAY - 1));
    expect(result.current[0]).toBe("");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current[0]).toBe("c");
  });

  it("a keystroke restarts the wait: a burst of typing gives only its last value", () => {
    const seen: string[] = [];
    const { rerender } = renderHook(
      ({ value }) => {
        const [debounced] = useDebouncedValue(value, DELAY);
        if (seen.at(-1) !== debounced) seen.push(debounced);
      },
      { initialProps: { value: "" } },
    );
    for (const value of ["c", "co", "cof"]) {
      rerender({ value });
      act(() => vi.advanceTimersByTime(DELAY - 50));
    }
    act(() => vi.advanceTimersByTime(50));
    expect(seen).toEqual(["", "cof"]);
  });

  it("flush() ends the wait at once and returns the latest value; no late update follows", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, DELAY), {
      initialProps: { value: "" },
    });
    rerender({ value: "co" });
    let flushed = "";
    act(() => {
      flushed = result.current[1]();
    });
    expect(flushed).toBe("co");
    expect(result.current[0]).toBe("co");
    expect(vi.getTimerCount()).toBe(0);
  });
});
