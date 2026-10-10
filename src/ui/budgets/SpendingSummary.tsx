import { COPY } from "@/src/shared/copy";
import { formatMoney } from "@/src/shared/money";
import type { BudgetsDto } from "@/src/shared/schemas";
import { Donut } from "../overview/Donut";
import { ThemeBar } from "../overview/ThemeBar";
import styles from "./SpendingSummary.module.css";

const HEADING_ID = "spending-summary-title";

/**
 * SPEC-budgets 2.3 (US-20): the app's one `Donut` over every budget, with the Budgets-only fit of
 * its centre (BU-11 (A)), and "Spending Summary" over a list of each budget's spent of its
 * maximum, in creation order. No `<ul>` with no budgets. Nothing in the card is interactive.
 */
export function SpendingSummary({ budgets }: { budgets: BudgetsDto }) {
  return (
    <div className={styles.card}>
      <div className={styles.donut}>
        <Donut items={budgets.items} total={budgets.limit} spent={budgets.spent} fitCentre />
      </div>
      <div className={styles.summary}>
        <h2 id={HEADING_ID} className={`text-preset-2 ${styles.title}`}>
          {COPY.spendingSummary}
        </h2>
        {budgets.items.length > 0 ? (
          <ul className={styles.rows} aria-labelledby={HEADING_ID}>
            {budgets.items.map((budget) => (
              <li key={budget.id} className={styles.row}>
                <div className={styles.category}>
                  <ThemeBar theme={budget.theme} stretch />
                  <span className={`text-preset-4 ${styles.name}`}>{budget.category}</span>
                </div>
                <span className={styles.amounts}>
                  <span className={`text-preset-3 ${styles.spent}`}>
                    {formatMoney(budget.spent)}
                  </span>
                  <span className={`text-preset-5 ${styles.of}`}>
                    {COPY.budgetOfMaximum(formatMoney(budget.maximum))}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
