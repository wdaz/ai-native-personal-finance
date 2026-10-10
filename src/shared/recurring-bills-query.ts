import { cutSearch, firstParam, isOneOf, type QueryParams } from "./query-params";
import type { ErrorIssue } from "./schemas";
import { TRANSACTION_SORTS, type TransactionSort } from "./transactions-query";

/**
 * SPEC-recurring-bills 2.2–2.3: the Recurring Bills URL contract, read once for the page
 * (lenient) and for `GET /api/recurring-bills` and its tool (strict). Pure, with no Zod, as
 * `transactions-query.ts`: the issues are written by hand with the contract's two codes.
 */

/**
 * 2.1: a bill's three exclusive statuses (US-27 AC2) — the one list the domain's `BillStatus`,
 * `RecurringBillsDtoSchema`, this parser and the tool's `z.enum` read.
 */
export const BILL_STATUSES = ["paid", "dueSoon", "upcoming"] as const;
export type BillStatus = (typeof BILL_STATUSES)[number];

/** 2.2: the search is at most 60 characters (the name limit, data-model.md). */
export const RECURRING_BILLS_Q_MAX = 60;

/** 2.1, 2.4: the six sorts are Transactions' — one list of slugs, one of labels. */
export const BILL_SORTS = TRANSACTION_SORTS;
export type BillSort = TransactionSort;

/** The effective view: absent `q` and `status` mean no search and every status. */
export type RecurringBillsQuery = {
  q: string | undefined;
  sort: BillSort;
  /** The API's and the tool's only (§9 RB-Q3 (a)); the page always reads `undefined`. */
  status: BillStatus | undefined;
};

export type ParsedRecurringBillsQuery = {
  query: RecurringBillsQuery;
  /** Strict mode only, in the order `q`, `sort`, `status`; always empty when lenient. */
  issues: ErrorIssue[];
  /** Each issue's sentence joined with "; " (v0.7.1); empty when there is no issue. */
  message: string;
};

export function parseRecurringBillsQuery(
  params: QueryParams,
  { strict }: { strict: boolean },
): ParsedRecurringBillsQuery {
  const issues: ErrorIssue[] = [];
  const messages: string[] = [];
  const refuse = (field: string, code: ErrorIssue["code"], message: string) => {
    issues.push({ path: [field], code });
    messages.push(message);
  };

  let q = firstParam(params, "q")?.trim() || undefined;
  if (q !== undefined && q.length > RECURRING_BILLS_Q_MAX) {
    if (strict) {
      refuse("q", "too_long", `q must be at most ${RECURRING_BILLS_Q_MAX} characters`);
      q = undefined;
    } else {
      q = cutSearch(q, RECURRING_BILLS_Q_MAX);
    }
  }

  const rawSort = firstParam(params, "sort");
  let sort: BillSort = "latest";
  if (rawSort !== undefined) {
    if (isOneOf(BILL_SORTS, rawSort)) sort = rawSort;
    else if (strict) {
      refuse("sort", "invalid_format", `sort must be one of: ${BILL_SORTS.join(", ")}`);
    }
  }

  // 2.3: the page has no status control and ignores the parameter.
  let status: BillStatus | undefined;
  const rawStatus = strict ? firstParam(params, "status") : undefined;
  if (rawStatus !== undefined) {
    if (isOneOf(BILL_STATUSES, rawStatus)) status = rawStatus;
    else refuse("status", "invalid_format", `status must be one of: ${BILL_STATUSES.join(", ")}`);
  }

  return { query: { q, sort, status }, issues, message: messages.join("; ") };
}
