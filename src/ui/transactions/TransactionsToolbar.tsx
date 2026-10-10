"use client";

import { useId } from "react";
import { COPY } from "@/src/shared/copy";
import { CATEGORIES, type Category } from "@/src/shared/enums";
import {
  TRANSACTION_SORTS,
  TRANSACTIONS_Q_MAX,
  type TransactionSort,
} from "@/src/shared/transactions-query";
import { FilterIcon } from "../icons/FilterIcon";
import { SearchIcon } from "../icons/SearchIcon";
import { SortIcon } from "../icons/SortIcon";
import { Menu, type MenuOption } from "../Menu";
import { useTransactionsNav } from "./TransactionsNav";
import styles from "./TransactionsToolbar.module.css";

const SORT_OPTIONS: MenuOption<TransactionSort>[] = TRANSACTION_SORTS.map((sort) => ({
  value: sort,
  label: COPY.transactionSorts[sort],
}));

/** "All Transactions" is the menu's own value: an absent `category` (2.2). */
const ALL = "all";
const CATEGORY_OPTIONS: MenuOption<Category | typeof ALL>[] = [
  { value: ALL, label: COPY.allTransactions },
  ...CATEGORIES.map((category) => ({ value: category, label: category })),
];

/**
 * SPEC-transactions 2.5, 2.6, 2.9: the search field (inside `role="search"`, not a form, so Enter
 * never submits a page; a hidden label; no clear button) and the Sort and Category menus. The
 * row wraps at every width: the field never narrower than 160 px, the menus' group then on the
 * next line, right-aligned (§17b, TX-2).
 */
export function TransactionsToolbar() {
  const nav = useTransactionsNav();
  const searchId = useId();
  return (
    <div className={styles.toolbar}>
      <div role="search" className={styles.search}>
        <label htmlFor={searchId} className={styles.visuallyHidden}>
          {COPY.searchTransactionsLabel}
        </label>
        <input
          id={searchId}
          type="text"
          className={`text-preset-4 ${styles.input}`}
          placeholder={COPY.searchTransactionsPlaceholder}
          maxLength={TRANSACTIONS_Q_MAX}
          autoComplete="off"
          value={nav.text}
          onChange={(event) => nav.setText(event.target.value)}
          onKeyDown={(event) => {
            // An Enter that ends an IME composition (Chinese, Japanese, Korean) is not a submit.
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              nav.submitSearch();
            }
          }}
        />
        <span className={styles.searchIcon}>
          <SearchIcon />
        </span>
      </div>
      <div className={styles.menus}>
        <Menu
          label={COPY.sortBy}
          options={SORT_OPTIONS}
          value={nav.query.sort}
          onChange={nav.setSort}
          icon={<SortIcon />}
          className={styles.sort}
        />
        <Menu
          label={COPY.category}
          options={CATEGORY_OPTIONS}
          value={nav.query.category ?? ALL}
          onChange={(value) => nav.setCategory(value === ALL ? undefined : value)}
          icon={<FilterIcon />}
          className={styles.category}
        />
      </div>
    </div>
  );
}
