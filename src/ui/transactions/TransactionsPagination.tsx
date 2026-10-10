"use client";

import { useEffect, useRef } from "react";
import { COPY } from "@/src/shared/copy";
import { PAGE_NUMBERS_NARROW, PAGE_NUMBERS_WIDE, pageItems } from "@/src/shared/pagination";
import { cx } from "../cx";
import { CaretRightIcon } from "../icons/CaretRightIcon";
import { useTransactionsNav } from "./TransactionsNav";
import styles from "./TransactionsPagination.module.css";

/** The visible one of the two number lists (CSS hides the other with `display: none`). */
const isShown = (element: Element) => getComputedStyle(element).display !== "none";

/**
 * SPEC-transactions 2.7: Previous, the page numbers and Next, all `type="button"`, inside
 * `<nav aria-label="Pagination">`. Hidden when there are no results; with one page both ends are
 * disabled (native `disabled`, out of the tab order, no hover). Two number lists are rendered —
 * up to seven items from 768 px, three numbers below — and CSS shows one, so the other is out of
 * the accessibility tree. The current page shows the intended value at once (2.5).
 */
export function TransactionsPagination({ pageCount, total }: { pageCount: number; total: number }) {
  const nav = useTransactionsNav();
  const navRef = useRef<HTMLElement>(null);
  const current = Math.min(Math.max(1, nav.query.page), pageCount);

  // 2.7 "Focus": an activated control keeps focus when it is still there and enabled; otherwise
  // focus goes to the current page's number in the visible list, never to <body>.
  // Only after a control here was activated: Back, Forward or another control never moves focus
  // (and never scrolls the page to the pagination).
  const activated = useRef(false);
  const go = (page: number) => {
    activated.current = true;
    nav.setPage(page);
  };
  const shownPage = useRef(current);
  useEffect(() => {
    if (shownPage.current === current) return;
    shownPage.current = current;
    if (!activated.current) return;
    activated.current = false;
    const root = navRef.current;
    const active = document.activeElement;
    if (root === null) return;
    const lost =
      active === null ||
      active === document.body ||
      (root.contains(active) && (active as HTMLButtonElement).disabled) ||
      (active instanceof HTMLElement && !active.isConnected);
    if (!lost) return;
    const list = [...root.querySelectorAll("[data-pages]")].find(isShown);
    list?.querySelector<HTMLButtonElement>('[aria-current="page"]')?.focus({ preventScroll: true });
  }, [current]);

  if (total < 1) return null;

  const numbers = (max: number, width: "wide" | "narrow") => (
    <ol className={cx(styles.numbers, styles[width])} data-pages={width}>
      {pageItems(current, pageCount, max).map((item, index) =>
        item === "gap" ? (
          <li key={`gap-${index}`} className={`text-preset-4 ${styles.gap}`} aria-hidden="true">
            …
          </li>
        ) : (
          <li key={item}>
            <button
              type="button"
              className={cx("text-preset-4", styles.button, styles.number)}
              aria-label={COPY.pageNumber(item)}
              aria-current={item === current ? "page" : undefined}
              onClick={() => {
                if (item !== current) go(item);
              }}
            >
              {item}
            </button>
          </li>
        ),
      )}
    </ol>
  );

  return (
    <nav ref={navRef} aria-label={COPY.pagination} className={styles.pagination}>
      <button
        type="button"
        className={cx("text-preset-4", styles.button, styles.end)}
        aria-label={COPY.previousPage}
        disabled={current <= 1}
        onClick={() => go(current - 1)}
      >
        {/* The design turns Next's caret 180° for Prev. */}
        <span className={styles.flip}>
          <CaretRightIcon />
        </span>
        <span className={styles.endText}>{COPY.prev}</span>
      </button>
      {numbers(PAGE_NUMBERS_WIDE, "wide")}
      {numbers(PAGE_NUMBERS_NARROW, "narrow")}
      <button
        type="button"
        className={cx("text-preset-4", styles.button, styles.end)}
        aria-label={COPY.nextPage}
        disabled={current >= pageCount}
        onClick={() => go(current + 1)}
      >
        <span className={styles.endText}>{COPY.next}</span>
        <CaretRightIcon />
      </button>
    </nav>
  );
}
