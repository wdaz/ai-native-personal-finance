"use client";

import { useRouter } from "next/navigation";
import { COPY } from "@/src/shared/copy";
import { Button } from "../Button";
import styles from "./BillsError.module.css";

/**
 * SPEC-recurring-bills 2.10 (the designer's changelog §18g, BU-7): one card in place of the two
 * summary cards and the list card, with the Overview error card's look; Retry
 * re-runs the page's read (`overview.md` 2.8).
 */
export function BillsError() {
  const router = useRouter();
  return (
    <div className={styles.card}>
      <p className="text-preset-4">{COPY.billsLoadError}</p>
      <Button onClick={() => router.refresh()}>{COPY.retry}</Button>
    </div>
  );
}
