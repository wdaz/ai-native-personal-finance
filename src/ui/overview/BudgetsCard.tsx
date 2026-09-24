import type { Category, Theme } from "@/src/shared/enums";
import { formatMoney } from "@/src/shared/money";
import { COPY } from "@/src/shared/copy";
import { CardLink } from "./CardLink";
import { Donut } from "./Donut";
import { ThemeBar } from "./ThemeBar";
import styles from "./BudgetsCard.module.css";

export type BudgetItem = { id: string; category: Category; maximum: number; theme: Theme };

/**
 * SPEC-overview §2.5, US-07: the donut plus a legend of the first four budgets (already
 * capped server-side, T-09); `total`/`spent` cover all budgets (§2.5 "totals always include
 * all budgets"). §2.7: no budgets — a single empty ring and a link to create one.
 */
export function BudgetsCard({
  spent,
  total,
  items,
}: {
  spent: number;
  total: number;
  items: readonly BudgetItem[];
}) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className="text-preset-3">Budgets</h2>
        <CardLink href="/budgets" label="See Details" />
      </div>
      <div className={styles.body}>
        <Donut items={items} total={total} spent={spent} />
        {items.length > 0 ? (
          <ul className={styles.legend}>
            {items.map((budget) => (
              <li key={budget.id} className={styles.legendItem}>
                <ThemeBar theme={budget.theme} />
                <p className={`text-preset-5 ${styles.category}`}>{budget.category}</p>
                <p className={`text-preset-4-bold ${styles.maximum}`}>
                  {formatMoney(budget.maximum)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <p className="text-preset-4">{COPY.budgetsEmpty}</p>
            <a className="text-preset-4-bold" href="/budgets">
              {COPY.addBudget}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
