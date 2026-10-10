"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The list pages' search debounce: SPEC-transactions 2.5 and 4.1, SPEC-recurring-bills 2.5 ("as on
 * Transactions"); US-10 AC1 allows at most 300 ms. One constant, so the two pages cannot drift.
 */
export const SEARCH_DEBOUNCE_MS = 250;

/**
 * SPEC-transactions 2.5: `value`, `delayMs` after its last change. `flush()` ends a pending wait at
 * once and returns the latest value, so a control that acts before the wait is over (Enter, a
 * menu choice, a page change) uses the typed text instead of dropping it.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): [T, () => T] {
  const [debounced, setDebounced] = useState(value);
  const latest = useRef(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latest.current = value;
    timer.current = setTimeout(() => {
      timer.current = null;
      setDebounced(value);
    }, delayMs);
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
    };
  }, [value, delayMs]);

  const flush = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    setDebounced(latest.current);
    return latest.current;
  }, []);

  return [debounced, flush];
}
