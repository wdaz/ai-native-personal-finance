"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  recurringBillsSearch,
  type BillSort,
  type RecurringBillsPageQuery,
} from "@/src/shared/recurring-bills-query";
import { ResultsNavContext, type ResultsNavState } from "../ResultsRegion";
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from "../useDebouncedValue";

export { SEARCH_DEBOUNCE_MS };

type BillsNavValue = {
  /** The intended query: what the controls show at once, before the server answers (2.5). */
  query: RecurringBillsPageQuery;
  /** The search field's own text; a server answer never rewrites it (2.5). */
  text: string;
  setText: (text: string) => void;
  /** Enter in the search field: the typed text applies at once. */
  submitSearch: () => void;
  setSort: (sort: BillSort) => void;
};

const BillsNavContext = createContext<BillsNavValue | null>(null);

export function useBillsNav(): BillsNavValue {
  const value = useContext(BillsNavContext);
  if (value === null) throw new Error("useBillsNav needs a <BillsNav>");
  return value;
}

const needle = (text: string) => text.trim() || undefined;
const sameQuery = (a: RecurringBillsPageQuery, b: RecurringBillsPageQuery) =>
  recurringBillsSearch(a) === recurringBillsSearch(b);

/**
 * SPEC-recurring-bills 2.1, 2.5: owns the page's navigation — `TransactionsNav` with two
 * parameters (`transactions.md` 2.5). It holds one *intended query*, set from the server's
 * effective query on load and on every Back or Forward; every control changes it synchronously
 * and every URL is built from it (`recurringBillsSearch`). A search writes the URL with
 * `router.replace` after 250 ms (or at once on Enter); a sort first applies a pending search,
 * then uses `router.push`; choosing the current sort adds no history entry. Each navigation runs
 * in `startTransition` with `{ scroll: false }`; the latest one wins.
 */
export function BillsNav({
  effective,
  children,
}: {
  /** The query the server rendered: the URL read leniently (2.3). */
  effective: RecurringBillsPageQuery;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(effective);
  const intended = useRef(effective);
  const [text, setText] = useState(effective.q ?? "");
  const [debounced, flush] = useDebouncedValue(text, SEARCH_DEBOUNCE_MS);
  const [changes, setChanges] = useState(0);
  const fromHistory = useRef(false);
  // Bumped on every Back or Forward, so the resync below runs even when the server's answer
  // does not change (a pending push was abandoned).
  const [historyTick, setHistoryTick] = useState(0);

  const go = useCallback(
    (next: RecurringBillsPageQuery, mode: "push" | "replace") => {
      intended.current = next;
      setQuery(next);
      setChanges((count) => count + 1);
      fromHistory.current = false;
      startTransition(() => {
        router[mode](`${pathname}${recurringBillsSearch(next)}`, { scroll: false });
      });
    },
    [pathname, router],
  );

  /** When the needle is the current one nothing happens. */
  const applySearch = useCallback(
    (typed: string) => {
      const q = needle(typed);
      if (q === intended.current.q) return;
      go({ ...intended.current, q }, "replace");
    },
    [go],
  );

  useEffect(() => applySearch(debounced), [debounced, applySearch]);

  /** A sort: the pending search first, then the sort, by `push`; the current sort adds nothing. */
  const setSort = useCallback(
    (sort: BillSort) => {
      const q = needle(flush());
      if (sort === intended.current.sort) {
        applySearch(q ?? "");
        return;
      }
      go({ ...intended.current, q, sort }, "push");
    },
    [flush, applySearch, go],
  );

  // 2.5: Back and Forward re-render the view from the URL and reset the field's text, even
  // while it has focus; a link to this page with another view does the same (the text only when
  // its `q` differs). While a control's navigation is pending, an older answer is not a reset.
  useEffect(() => {
    const onPopState = () => {
      fromHistory.current = true;
      setHistoryTick((tick) => tick + 1);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const effectiveKey = recurringBillsSearch(effective);
  useEffect(() => {
    const history = fromHistory.current;
    if (!history && (pending || sameQuery(effective, intended.current))) return;
    fromHistory.current = false;
    const qChanged = effective.q !== intended.current.q;
    intended.current = effective;
    setQuery(effective);
    if (history || qChanged) setText(effective.q ?? "");
    // It runs when the server's answer changes or on Back and Forward, not when `pending` does:
    // `effectiveKey` stands for `effective`, whose object identity changes on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveKey, historyTick]);

  const value = useMemo<BillsNavValue>(
    () => ({
      query,
      text,
      setText,
      submitSearch: () => applySearch(flush()),
      setSort,
    }),
    [query, text, applySearch, flush, setSort],
  );
  const results = useMemo<ResultsNavState>(() => ({ pending, changes }), [pending, changes]);

  return (
    <BillsNavContext.Provider value={value}>
      <ResultsNavContext.Provider value={results}>{children}</ResultsNavContext.Provider>
    </BillsNavContext.Provider>
  );
}
