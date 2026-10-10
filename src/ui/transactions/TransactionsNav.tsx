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
import type { Category } from "@/src/shared/enums";
import {
  transactionsSearch,
  type TransactionSort,
  type TransactionsQuery,
} from "@/src/shared/transactions-query";
import { useDebouncedValue } from "../useDebouncedValue";

/** SPEC-transactions 2.5 and 4.1 (US-10 AC1 allows at most 300 ms). */
export const SEARCH_DEBOUNCE_MS = 250;

type TransactionsNavValue = {
  /** The intended query: what the controls show at once, before the server answers (2.5). */
  query: TransactionsQuery;
  /** The search field's own text; a server answer never rewrites it (2.5). */
  text: string;
  setText: (text: string) => void;
  /** Enter in the search field: the typed text applies at once. */
  submitSearch: () => void;
  setSort: (sort: TransactionSort) => void;
  setCategory: (category: Category | undefined) => void;
  setPage: (page: number) => void;
  /** A navigation started by a control is pending: the results region is `aria-busy` (2.10). */
  pending: boolean;
  /** Counts the navigations controls started, so the status line speaks after each (2.10). */
  changes: number;
};

const TransactionsNavContext = createContext<TransactionsNavValue | null>(null);

export function useTransactionsNav(): TransactionsNavValue {
  const value = useContext(TransactionsNavContext);
  if (value === null) throw new Error("useTransactionsNav needs a <TransactionsNav>");
  return value;
}

const needle = (text: string) => text.trim() || undefined;
const sameQuery = (a: TransactionsQuery, b: TransactionsQuery) =>
  transactionsSearch(a) === transactionsSearch(b);

/**
 * SPEC-transactions 2.1, 2.5: owns the page's navigation. It holds one *intended query*, set
 * from the server's effective query on load and on every Back or Forward; every control changes
 * it synchronously and every URL is built from it (`transactionsSearch`), so a control never
 * drops what another has just set. A search writes the URL with `router.replace` after 250 ms
 * (or at once on Enter); a sort, a category or a page first applies a pending search, then uses
 * `router.push`. Each navigation runs in `startTransition` with `{ scroll: false }`; the latest
 * one wins.
 */
export function TransactionsNav({
  effective,
  children,
}: {
  /** The query the server rendered: the URL read leniently, the page clamped (2.3). */
  effective: TransactionsQuery;
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

  const go = useCallback(
    (next: TransactionsQuery, mode: "push" | "replace") => {
      intended.current = next;
      setQuery(next);
      setChanges((count) => count + 1);
      fromHistory.current = false;
      startTransition(() => {
        router[mode](`${pathname}${transactionsSearch(next)}`, { scroll: false });
      });
    },
    [pathname, router],
  );

  /** A search starts at page 1; when the needle is the current one nothing happens. */
  const applySearch = useCallback(
    (typed: string) => {
      const q = needle(typed);
      if (q === intended.current.q) return;
      go({ ...intended.current, q, page: 1 }, "replace");
    },
    [go],
  );

  useEffect(() => applySearch(debounced), [debounced, applySearch]);

  /**
   * A sort, a category or a page: the pending search first, then the change, by `push`.
   * Choosing the option or the page already current adds no history entry (2.5); only the typed
   * search, if any, applies.
   */
  const change = useCallback(
    (patch: Partial<TransactionsQuery>, current: boolean) => {
      const q = needle(flush());
      if (current) {
        applySearch(q ?? "");
        return;
      }
      go({ ...intended.current, q, ...patch }, "push");
    },
    [flush, applySearch, go],
  );

  // 2.5: Back and Forward re-render the view from the URL and reset the field's text, even
  // while it has focus; a link to this page with another view does the same (the text only when
  // its `q` differs). While a control's navigation is pending, an older answer is not a reset.
  useEffect(() => {
    const onPopState = () => {
      fromHistory.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const effectiveKey = transactionsSearch(effective);
  useEffect(() => {
    const history = fromHistory.current;
    if (!history && (pending || sameQuery(effective, intended.current))) return;
    fromHistory.current = false;
    const qChanged = effective.q !== intended.current.q;
    intended.current = effective;
    setQuery(effective);
    if (history || qChanged) setText(effective.q ?? "");
    // It runs when the server's answer changes, not when `pending` does: `effectiveKey` stands
    // for `effective`, whose object identity changes on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveKey]);

  const value = useMemo<TransactionsNavValue>(
    () => ({
      query,
      text,
      setText,
      submitSearch: () => applySearch(flush()),
      setSort: (sort) => change({ sort, page: 1 }, sort === intended.current.sort),
      setCategory: (category) =>
        change({ category, page: 1 }, category === intended.current.category),
      setPage: (page) => change({ page }, page === intended.current.page),
      pending,
      changes,
    }),
    [query, text, applySearch, flush, change, pending, changes],
  );

  return (
    <TransactionsNavContext.Provider value={value}>{children}</TransactionsNavContext.Provider>
  );
}
