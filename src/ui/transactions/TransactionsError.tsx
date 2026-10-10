"use client";

import { useRouter } from "next/navigation";
import { COPY } from "@/src/shared/copy";
import { Button } from "../Button";
import styles from "./TransactionsError.module.css";

/** SPEC-transactions 2.10: replaces the card; Retry re-runs the page's read (Overview §2.8). */
export function TransactionsError() {
  const router = useRouter();
  return (
    <div className={styles.card}>
      <p className="text-preset-4">{COPY.transactionsLoadError}</p>
      <Button onClick={() => router.refresh()}>{COPY.retry}</Button>
    </div>
  );
}
