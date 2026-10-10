"use client";

import { useId } from "react";
import { COPY } from "@/src/shared/copy";
import {
  BILL_SORTS,
  RECURRING_BILLS_Q_MAX,
  type BillSort,
} from "@/src/shared/recurring-bills-query";
import { SearchIcon } from "../icons/SearchIcon";
import { SortIcon } from "../icons/SortIcon";
import { Menu, type MenuOption } from "../Menu";
import { useBillsNav } from "./BillsNav";
import styles from "./BillsToolbar.module.css";

/** 2.4: the six sorts, Transactions' slugs and labels (one list). */
const SORT_OPTIONS: MenuOption<BillSort>[] = BILL_SORTS.map((sort) => ({
  value: sort,
  label: COPY.transactionSorts[sort],
}));

/**
 * SPEC-recurring-bills 2.5, 2.8, 2.9: the search field (inside `role="search"`, not a form, so
 * Enter never submits a page; a hidden label; no clear button) and the Sort menu. The row wraps
 * at every width (§17b, TX-2): the field is never narrower than 160 px, and the Sort group then
 * moves to the next line, right-aligned — with one trigger it never needs to (2.9).
 */
export function BillsToolbar() {
  const nav = useBillsNav();
  const searchId = useId();
  return (
    <div className={styles.toolbar}>
      <div role="search" className={styles.search}>
        <label htmlFor={searchId} className={styles.visuallyHidden}>
          {COPY.searchBillsLabel}
        </label>
        <input
          id={searchId}
          type="text"
          className={`text-preset-4 ${styles.input}`}
          placeholder={COPY.searchBillsPlaceholder}
          maxLength={RECURRING_BILLS_Q_MAX}
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
      </div>
    </div>
  );
}
