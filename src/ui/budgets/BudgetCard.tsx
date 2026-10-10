"use client";

import { COPY } from "@/src/shared/copy";
import { formatMoney } from "@/src/shared/money";
import type { BudgetItemDto } from "@/src/shared/schemas";
import { ActionMenu } from "../ActionMenu";
import { ThemeBar } from "../overview/ThemeBar";
import { ThemeSwatch } from "../ThemeSwatch";
import { BreakableAmount } from "./Amount";
import { BudgetBar } from "./BudgetBar";
import { LatestSpending } from "./LatestSpending";
import styles from "./BudgetCard.module.css";

/**
 * SPEC-budgets 2.4 (US-14 AC1, AC2): one budget — its swatch and category, the "…" menu (Edit
 * Budget, Delete Budget), "Maximum of", the bar, Spent and Remaining, and Latest Spending (2.5).
 * A `<section>` labelled by its title. Amounts break only after a comma (BU-Q5 (a)).
 */
export function BudgetCard({
  budget,
  onEdit,
  onDelete,
}: {
  budget: BudgetItemDto;
  onEdit: (trigger: HTMLButtonElement) => void;
  onDelete: (trigger: HTMLButtonElement) => void;
}) {
  const titleId = `budget-${budget.id}-title`;
  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <ThemeSwatch theme={budget.theme} />
          <h2 id={titleId} className={`text-preset-2 ${styles.title}`}>
            {budget.category}
          </h2>
        </div>
        <ActionMenu
          label={COPY.budgetOptions}
          name={budget.category}
          items={[
            { label: COPY.editBudget, onSelect: onEdit },
            { label: COPY.deleteBudget, onSelect: onDelete, destructive: true },
          ]}
        />
      </div>
      <div className={styles.group}>
        <p className={`text-preset-4 ${styles.maximum}`}>
          {COPY.budgetMaximumOf(formatMoney(budget.maximum))}
        </p>
        <BudgetBar spent={budget.spent} maximum={budget.maximum} theme={budget.theme} />
        <dl className={styles.figures}>
          {/* A `<dl>` holds only `<div>` groups of `<dt>` and `<dd>` (axe "definition-list"),
              so each figure's bar sits in its `<dt>`, pinned by CSS to the group's full height. */}
          <div className={styles.figure}>
            <dt className={`text-preset-5 ${styles.label}`}>
              <span className={styles.pin}>
                <ThemeBar theme={budget.theme} stretch />
              </span>
              {COPY.budgetSpent}
            </dt>
            <dd className={`text-preset-4-bold ${styles.value}`}>
              <BreakableAmount text={formatMoney(budget.spent)} />
            </dd>
          </div>
          <div className={styles.figure}>
            <dt className={`text-preset-5 ${styles.label}`}>
              <span className={styles.pin}>
                <span className={styles.remainingBar} aria-hidden="true" />
              </span>
              {COPY.budgetRemaining}
            </dt>
            <dd className={`text-preset-4-bold ${styles.value}`}>
              <BreakableAmount text={formatMoney(budget.remaining)} />
            </dd>
          </div>
        </dl>
      </div>
      <LatestSpending category={budget.category} latest={budget.latest} />
    </section>
  );
}
