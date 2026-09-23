import type { ReactElement } from "react";
import { NavBudgetsIcon } from "./icons/NavBudgetsIcon";
import { NavOverviewIcon } from "./icons/NavOverviewIcon";
import { NavPotsIcon } from "./icons/NavPotsIcon";
import { NavRecurringBillsIcon } from "./icons/NavRecurringBillsIcon";
import { NavTransactionsIcon } from "./icons/NavTransactionsIcon";

/**
 * SPEC-app-shell §2.2, §2.5: each page's name — its navigation label, its `<h1>` and, through
 * the root layout's template, its document title ("Personal Finance - <name>"). Spec text,
 * like the other labels (T-07 plan D3).
 */
export const PAGE_NAMES = {
  overview: "Overview",
  transactions: "Transactions",
  budgets: "Budgets",
  pots: "Pots",
  recurringBills: "Recurring Bills",
} as const;

export type NavEntry = Readonly<{ href: string; label: string; Icon: () => ReactElement }>;

/** SPEC-app-shell §2.2: the five pages, in the order the sidebar and the bottom bar list them. */
export const NAV_ITEMS: readonly NavEntry[] = [
  { href: "/overview", label: PAGE_NAMES.overview, Icon: NavOverviewIcon },
  { href: "/transactions", label: PAGE_NAMES.transactions, Icon: NavTransactionsIcon },
  { href: "/budgets", label: PAGE_NAMES.budgets, Icon: NavBudgetsIcon },
  { href: "/pots", label: PAGE_NAMES.pots, Icon: NavPotsIcon },
  { href: "/recurring-bills", label: PAGE_NAMES.recurringBills, Icon: NavRecurringBillsIcon },
];

/** SPEC-app-shell §2.7: `href` is the current page, or a page below it (`/budgets/…`). */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
