import { COPY } from "@/src/shared/copy";
import { formatDate } from "@/src/shared/dates";
import { formatSignedMoney } from "@/src/shared/money";
import type { TransactionsDto } from "@/src/shared/schemas";
import { PAGE_NAMES } from "../nav";
import { cx } from "../cx";
import { TruncatedText } from "../TruncatedText";
import styles from "./TransactionTable.module.css";

/** Why there are no rows: none at all (`empty-all`), or none that match (2.10). */
export type TransactionsEmpty = "none" | "no-results";

/**
 * SPEC-transactions 2.9, 2.10: a real `<table>` with a hidden caption and a header row that
 * stays in the DOM at every width. Below 768 px CSS lays each row out as the design's card, so
 * every table element carries its explicit `role` (a changed `display` can drop the semantics).
 * Rows are not interactive; only a cut name is a focus stop, for its tooltip (`TruncatedText`).
 * With no rows, one cell across the four columns says why.
 */
export function TransactionTable({
  items,
  empty,
}: {
  items: TransactionsDto["items"];
  empty: TransactionsEmpty | null;
}) {
  return (
    <table role="table" className={styles.table}>
      <caption className={styles.visuallyHidden}>{PAGE_NAMES.transactions}</caption>
      <thead role="rowgroup" className={styles.head}>
        <tr role="row" className={styles.row}>
          <th role="columnheader" scope="col" className={`text-preset-5 ${styles.th}`}>
            {COPY.columnRecipient}
          </th>
          <th role="columnheader" scope="col" className={`text-preset-5 ${styles.th}`}>
            {COPY.columnCategory}
          </th>
          <th role="columnheader" scope="col" className={`text-preset-5 ${styles.th}`}>
            {COPY.columnDate}
          </th>
          <th
            role="columnheader"
            scope="col"
            className={cx("text-preset-5", styles.th, styles.amountCell)}
          >
            {COPY.columnAmount}
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup" className={styles.body}>
        {empty !== null ? (
          <tr role="row" className={styles.emptyRow}>
            <td role="cell" colSpan={4} className={`text-preset-4 ${styles.empty}`}>
              {empty === "none" ? COPY.transactionsEmpty : COPY.transactionsNoResults}
            </td>
          </tr>
        ) : (
          items.map((transaction) => (
            <tr key={transaction.id} role="row" className={cx(styles.row, styles.item)}>
              <td role="cell" className={styles.who}>
                {/* eslint-disable-next-line @next/next/no-img-element -- src/ui/README.md:
                    next/image writes an inline style attribute the CSP's style-src blocks
                    (ADR-0006). */}
                <img
                  className={styles.avatar}
                  src={`/avatars/${transaction.avatar}.jpg`}
                  alt=""
                  width={40}
                  height={40}
                />
                <span className={`text-preset-4-bold ${styles.name}`}>
                  <TruncatedText text={transaction.name} />
                </span>
              </td>
              <td role="cell" className={`text-preset-5 ${styles.category}`}>
                {transaction.category}
              </td>
              <td role="cell" className={`text-preset-5 ${styles.date}`}>
                {formatDate(transaction.date)}
              </td>
              <td
                role="cell"
                className={cx(
                  "text-preset-4-bold",
                  styles.amount,
                  styles.amountCell,
                  transaction.amount > 0 && styles.positive,
                )}
              >
                {formatSignedMoney(transaction.amount)}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
