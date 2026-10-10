"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTransactionsNav } from "./TransactionsNav";
import styles from "./ResultsRegion.module.css";

/**
 * SPEC-transactions 2.1, 2.10: the results region — the server-rendered table as `children`,
 * `aria-busy` while a control's navigation is pending (the previous rows stay; no skeleton) —
 * and the visually hidden status line. The line is empty on first render; after each change a
 * control made, once the answer has arrived, it is emptied and then set again, so the same text
 * is announced again (a sort change keeps "49 transactions, page 1 of 5").
 */
export function ResultsRegion({ status, children }: { status: string; children: ReactNode }) {
  const { pending, changes } = useTransactionsNav();
  const [announced, setAnnounced] = useState("");
  const spoken = useRef(0);

  useEffect(() => {
    if (pending || changes === spoken.current) return;
    spoken.current = changes;
    setAnnounced("");
    const frame = requestAnimationFrame(() => setAnnounced(status));
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
