import { Fragment } from "react";
import { COPY } from "@/src/shared/copy";
import { formatMoney } from "@/src/shared/money";
import { ReceiptIcon } from "../icons/ReceiptIcon";
import styles from "./TotalBillsCard.module.css";

/**
 * SPEC-recurring-bills 2.6 (the designer's changelog §18e, BU-5): the total breaks only after a
 * comma — a `<wbr>` after each comma of the `formatMoney` text — never inside a group of digits.
 */
function breakAfterCommas(text: string) {
  const parts = text.split(",");
  return parts.map((part, index) => (
    <Fragment key={index}>
      {part}
      {index < parts.length - 1 && (
        <>
          ,<wbr />
        </>
      )}
    </Fragment>
  ));
}

/**
 * SPEC-recurring-bills 2.6 (US-28 AC1): the dark card with the receipt icon, the label "Total
 * Bills" and the sum of every bill — never filtered by the search (2.4). Not a heading. Below
 * 768 px the icon sits beside the label and the total, vertically centred (2.13).
 */
export function TotalBillsCard({ amount }: { amount: number }) {
  return (
    <section className={styles.card}>
      <span className={styles.icon}>
        <ReceiptIcon />
      </span>
      <div className={styles.text}>
        <p className="text-preset-4">{COPY.totalBills}</p>
        <p className="text-preset-1">{breakAfterCommas(formatMoney(amount))}</p>
      </div>
    </section>
  );
}
