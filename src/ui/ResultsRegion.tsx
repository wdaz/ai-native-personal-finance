"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./ResultsRegion.module.css";

/** What a list page's navigation provider tells its results region (`TransactionsNav`, `BillsNav`). */
export type ResultsNavState = {
  /** A navigation started by a control is pending: the region is `aria-busy`. */
  pending: boolean;
  /** Counts the navigations controls started, so the status line speaks after each. */
  changes: number;
};

/**
 * Provided by each list page's navigation provider beside its own context, so the region
 * depends on no one page (SPEC-recurring-bills §6: moved here from `src/ui/transactions/`).
 */
export const ResultsNavContext = createContext<ResultsNavState | null>(null);

/**
 * SPEC-transactions 2.1, 2.10 and SPEC-recurring-bills 2.1, 2.10: the results region — the
 * server-rendered table as `children`, `aria-busy` while a control's navigation is pending (the
 * previous rows stay; no skeleton) — and the visually hidden status line. The line is empty on
 * first render; after each change a control made, once the answer has arrived, it is emptied and
 * then set again, so the same text is announced again (a sort change keeps "8 bills").
 */
export function ResultsRegion({ status, children }: { status: string; children: ReactNode }) {
  const nav = useContext(ResultsNavContext);
  if (nav === null) throw new Error("ResultsRegion needs a list page's navigation provider");
  const { pending, changes } = nav;
  const [announced, setAnnounced] = useState("");
  const spoken = useRef(0);

  useEffect(() => {
    if (pending || changes === spoken.current) return;
    setAnnounced("");
    // Marked as spoken only when the frame runs: an effect re-run inside the frame cancels it
    // and must still speak this change.
    const frame = requestAnimationFrame(() => {
      spoken.current = changes;
      setAnnounced(status);
    });
    return () => cancelAnimationFrame(frame);
  }, [pending, changes, status]);

  return (
    <>
      <div className={styles.region} aria-busy={pending}>
        {children}
      </div>
      <p role="status" className={styles.status}>
        {announced}
      </p>
    </>
  );
}
