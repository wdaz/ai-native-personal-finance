import { formatMoney } from "@/src/shared/money";
import { CardLink } from "./CardLink";
import styles from "./BillsCard.module.css";

/**
 * SPEC-overview §2.6, §2.7: always three rows (no empty state — a `no-recurring` seed still
 * hands this card three zero amounts, already computed by `src/domain/bills.ts`).
 */
export function BillsCard({
  paid,
  upcoming,
  dueSoon,
}: {
  paid: number;
  upcoming: number;
  dueSoon: number;
}) {
  const rows = [
    { key: "paid" as const, label: "Paid Bills", cents: paid },
    { key: "upcoming" as const, label: "Total Upcoming", cents: upcoming },
    { key: "dueSoon" as const, label: "Due Soon", cents: dueSoon },
  ];
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={`text-preset-3 ${styles.title}`}>Recurring Bills</h2>
        <CardLink href="/recurring-bills" label="See Details" />
      </div>
      <div className={styles.rows}>
        {rows.map((row) => (
          <div key={row.key} className={`${styles.row} ${styles[row.key]}`}>
            <p className="text-preset-5">{row.label}</p>
            <p className={`text-preset-4-bold ${styles.amount}`}>{formatMoney(row.cents)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
