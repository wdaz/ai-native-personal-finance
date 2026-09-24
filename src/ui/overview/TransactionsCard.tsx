import { formatDate } from "@/src/shared/dates";
import { formatSignedMoney } from "@/src/shared/money";
import { COPY } from "@/src/shared/copy";
import { cx } from "../cx";
import { CardLink } from "./CardLink";
import styles from "./TransactionsCard.module.css";

export type TransactionItem = {
  id: string;
  name: string;
  avatar: string;
  amount: number;
  date: string;
};

/**
 * SPEC-overview §2.4, US-06: up to five most-recent transactions (already capped server-side,
 * T-09). §2.7: fewer than five renders just the given rows; none renders the empty message.
 */
export function TransactionsCard({ items }: { items: readonly TransactionItem[] }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className="text-preset-3">Transactions</h2>
        <CardLink href="/transactions" label="View All" />
      </div>
      {items.length > 0 ? (
        <div className={styles.rows}>
          {items.map((transaction) => (
            <div key={transaction.id} className={styles.row}>
              <div className={styles.who}>
                {/* eslint-disable-next-line @next/next/no-img-element -- src/ui/README.md:
                    next/image writes an inline style attribute the CSP's style-src blocks
                    (ADR-0006). */}
                <img
                  className={styles.avatar}
                  src={`/avatars/${transaction.avatar}.jpg`}
                  alt={transaction.name}
                  width={40}
                  height={40}
                />
                <p className={`text-preset-4-bold ${styles.name}`}>{transaction.name}</p>
              </div>
              <div className={styles.figures}>
                <p
                  className={cx(
                    "text-preset-4-bold",
                    styles.amount,
                    transaction.amount > 0 && styles.positive,
                  )}
                >
                  {formatSignedMoney(transaction.amount)}
                </p>
                <p className={`text-preset-5 ${styles.date}`}>{formatDate(transaction.date)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={`text-preset-4 ${styles.empty}`}>{COPY.transactionsEmpty}</p>
      )}
    </div>
  );
}
