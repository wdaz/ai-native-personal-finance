import Link from "next/link";
import { COPY } from "@/src/shared/copy";
import { formatDate } from "@/src/shared/dates";
import type { Category } from "@/src/shared/enums";
import { formatSignedMoney } from "@/src/shared/money";
import type { BudgetItemDto } from "@/src/shared/schemas";
import { CaretRightIcon } from "../icons/CaretRightIcon";
import { TruncatedText } from "../TruncatedText";
import styles from "./LatestSpending.module.css";

/** SPEC-budgets 2.5 (US-19 AC1; `transactions.md` 2.2): the URL contract, as `URLSearchParams` writes it. */
export function seeAllHref(category: Category): string {
  return `/transactions?${new URLSearchParams({ category, page: "1" }).toString()}`;
}

/**
 * SPEC-budgets 2.5 (US-18, US-19 AC1; H12): the card's beige panel — "Latest Spending", the
 * "See All" link to Transactions filtered to the category, and the category's three latest
 * transactions in any month and of any sign (`latestSpending`, computed on the server). Rows
 * are not interactive; only a cut name is a stop (`TruncatedText`).
 */
export function LatestSpending({
  category,
  latest,
}: {
  category: Category;
  latest: BudgetItemDto["latest"];
}) {
  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <h3 className={`text-preset-3 ${styles.title}`}>{COPY.latestSpending}</h3>
        <Link
          href={seeAllHref(category)}
          className={`text-preset-4 ${styles.seeAll}`}
          aria-label={COPY.seeAllCategory(category)}
        >
          {COPY.seeAll}
          <CaretRightIcon size={12} />
        </Link>
      </div>
      {latest.length > 0 ? (
        <ul className={styles.rows}>
          {latest.map((transaction) => (
            <li key={transaction.id} className={styles.row}>
              <div className={styles.who}>
                {/* eslint-disable-next-line @next/next/no-img-element -- src/ui/README.md:
                    next/image writes an inline style attribute the CSP's style-src blocks
                    (ADR-0006). */}
                <img
                  className={styles.avatar}
                  src={`/avatars/${transaction.avatar}.jpg`}
                  alt=""
                  width={32}
                  height={32}
                />
                <p className={`text-preset-5-bold ${styles.name}`}>
                  <TruncatedText text={transaction.name} />
                </p>
              </div>
              <div className={styles.figures}>
                <p className={`text-preset-5-bold ${styles.amount}`}>
                  {formatSignedMoney(transaction.amount)}
                </p>
                <p className={`text-preset-5 ${styles.date}`}>{formatDate(transaction.date)}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={`text-preset-5 ${styles.empty}`}>{COPY.budgetNoTransactions}</p>
      )}
    </div>
  );
}
