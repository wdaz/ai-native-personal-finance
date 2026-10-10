import { COPY } from "@/src/shared/copy";
import styles from "./BudgetsEmpty.module.css";

/**
 * SPEC-budgets 2.12 (US-14 AC3; §9 BU-Q2 (a), the designer's changelog §18f): one white card
 * "No budgets yet", centred, with no button of its own — the header's "+ Add New Budget" is the
 * story's action.
 */
export function BudgetsEmpty() {
  return (
    <div className={styles.card}>
      <p className={`text-preset-4 ${styles.text}`}>{COPY.budgetsEmpty}</p>
    </div>
  );
}
