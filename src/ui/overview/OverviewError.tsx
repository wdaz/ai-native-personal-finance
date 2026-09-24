"use client";

import { useRouter } from "next/navigation";
import { COPY } from "@/src/shared/copy";
import { Button } from "../Button";
import styles from "./OverviewError.module.css";

/** SPEC-overview §2.8: replaces the grid; Retry re-runs the server component's data fetch. */
export function OverviewError() {
  const router = useRouter();
  return (
    <div className={styles.card}>
      <p className="text-preset-4">{COPY.overviewLoadError}</p>
      <Button onClick={() => router.refresh()}>{COPY.retry}</Button>
    </div>
  );
}
