import { COPY } from "@/src/shared/copy";
import { formatMoney } from "@/src/shared/money";
import type { RecurringBillsDto } from "@/src/shared/schemas";
import { cx } from "../cx";
import styles from "./BillsSummaryCard.module.css";

type Summary = RecurringBillsDto["summary"];

/**
 * SPEC-recurring-bills 2.6 (US-28 AC1): the heading "Summary" and three rows — Paid Bills, Total
 * Upcoming (every bill not paid, due soon included) and Due Soon — each "{count} ({amount})",
 * over all bills (2.4). A description list, so a screen reader pairs each label with its value.
 * The Due Soon row is red; a value that does not fit beside its label moves, whole, to a second
 * line, right-aligned (§18e, BU-5).
 */
export function BillsSummaryCard({ summary }: { summary: Summary }) {
  const rows = [
    { key: "paid", label: COPY.billsPaid, total: summary.paid },
    { key: "totalUpcoming", label: COPY.billsTotalUpcoming, total: summary.totalUpcoming },
    { key: "dueSoon", label: COPY.billsDueSoon, total: summary.dueSoon },
  ] as const;
  return (
    <section className={styles.card}>
      <h2 className={`text-preset-3 ${styles.title}`}>{COPY.billsSummaryTitle}</h2>
      <dl className={styles.rows}>
        {rows.map((row) => (
          <div key={row.key} className={cx(styles.row, row.key === "dueSoon" && styles.dueSoon)}>
            <dt className="text-preset-5">{row.label}</dt>
            <dd className={`text-preset-5-bold ${styles.value}`}>
              {COPY.billsCountAmount(row.total.count, formatMoney(row.total.amount))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
