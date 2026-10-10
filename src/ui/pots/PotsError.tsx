"use client";

import { useRouter } from "next/navigation";
import { COPY } from "@/src/shared/copy";
import { Button } from "../Button";
import styles from "./PotsError.module.css";

/**
 * SPEC-pots 2.9 (PO-Q1 (a) #2, PO-Q9 (a); the designer's changelog §18g, BU-7): one card in place
 * of the grid, with the Overview error card's look; Retry re-runs the page's read
 * (`overview.md` 2.8). The header has no "+ Add New Pot" in this state.
 */
export function PotsError() {
  const router = useRouter();
  return (
    <div className={styles.card}>
      <p className="text-preset-4">{COPY.potsLoadError}</p>
      <Button onClick={() => router.refresh()}>{COPY.retry}</Button>
    </div>
  );
}
