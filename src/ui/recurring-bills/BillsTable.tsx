import type { ComponentType } from "react";
import { COPY } from "@/src/shared/copy";
import { formatDueDay } from "@/src/shared/dates";
import { formatMoney } from "@/src/shared/money";
import type { BillStatus } from "@/src/shared/recurring-bills-query";
import type { RecurringBillsDto } from "@/src/shared/schemas";
import { cx } from "../cx";
import { CheckCircleIcon } from "../icons/CheckCircleIcon";
import { WarningCircleIcon } from "../icons/WarningCircleIcon";
import { PAGE_NAMES } from "../nav";
import { TruncatedText } from "../TruncatedText";
import styles from "./BillsTable.module.css";

/** Why there are no rows: no bills at all (US-30 AC2), or none that match the search (2.10). */
export type BillsEmpty = "none" | "no-results";

/** 2.9: the icon after the due text — none for Upcoming, whose hidden word is its only mark. */
const STATUS_ICON: Record<BillStatus, ComponentType | null> = {
  paid: CheckCircleIcon,
  dueSoon: WarningCircleIcon,
  upcoming: null,
};

/**
 * SPEC-recurring-bills 2.9, 2.10: a real `<table>` with a hidden caption and a header row that
 * stays in the DOM at every width. Below 768 px CSS lays each row out as the design's two-line
 * card, so every table element carries its explicit `role` (a changed `display` can drop the
 * semantics; `transactions.md` 2.9). The status is never colour alone (US-27 AC2, NFR-A7): the
 * due cell reads "Monthly - 2nd Paid" — the due text, one space, the visually hidden status, then
 * the decorative icon. Rows are not interactive; only a cut name is a focus stop, for its tooltip.
 */
export function BillsTable({
  items,
  empty,
}: {
  items: RecurringBillsDto["items"];
  empty: BillsEmpty | null;
}) {
  return (
    <table role="table" className={styles.table}>
      <caption className={styles.visuallyHidden}>{PAGE_NAMES.recurringBills}</caption>
      <thead role="rowgroup" className={styles.head}>
        <tr role="row" className={styles.row}>
          <th role="columnheader" scope="col" className={`text-preset-5 ${styles.th}`}>
            {COPY.columnBillTitle}
          </th>
          <th role="columnheader" scope="col" className={`text-preset-5 ${styles.th}`}>
            {COPY.columnDueDate}
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
            <td role="cell" colSpan={3} className={`text-preset-4 ${styles.empty}`}>
              {empty === "none" ? COPY.billsEmpty : COPY.billsNoResults}
            </td>
          </tr>
        ) : (
          items.map((bill) => {
            const Icon = STATUS_ICON[bill.status];
            return (
              <tr key={bill.name} role="row" className={cx(styles.row, styles.item)}>
                <td role="cell" className={styles.who}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- src/ui/README.md:
                      next/image writes an inline style attribute the CSP's style-src blocks
                      (ADR-0006). */}
                  <img
                    className={styles.avatar}
                    src={`/avatars/${bill.avatar}.jpg`}
                    alt=""
                    width={32}
                    height={32}
                  />
                  <span className={`text-preset-4-bold ${styles.name}`}>
                    <TruncatedText text={bill.name} />
                  </span>
                </td>
                <td
                  role="cell"
                  className={cx("text-preset-5", styles.due, bill.status === "paid" && styles.paid)}
                >
                  <span>{formatDueDay(bill.day)}</span>{" "}
                  <span className={styles.visuallyHidden}>{COPY.billStatuses[bill.status]}</span>
                  {Icon !== null && (
                    <span className={cx(styles.icon, styles[bill.status])}>
                      <Icon />
                    </span>
                  )}
                </td>
                <td
                  role="cell"
                  className={cx(
                    "text-preset-4-bold",
                    styles.amount,
                    styles.amountCell,
                    bill.status === "dueSoon" && styles.dueSoonAmount,
                  )}
                >
                  {formatMoney(bill.amount)}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
