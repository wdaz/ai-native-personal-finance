"use client";

import { useRouter } from "next/navigation";
import { COPY } from "@/src/shared/copy";
import { Button } from "../Button";
import styles from "../overview/OverviewError.module.css";

/**
 * SPEC-budgets 2.12 (§9 BU-Q1 (a) #1; BU-7, the designer's changelog §18g): one card in place of
 * both columns, drawn as `OverviewError` is; Retry re-runs the page's `getBudgets`.
 */
export function BudgetsError() {
  const router = useRouter();
  return (
    <div className={styles.card}>
      <p className="text-preset-4">{COPY.budgetsLoadError}</p>
      <Button onClick={() => router.refresh()}>{COPY.retry}</Button>
    </div>
  );
}
