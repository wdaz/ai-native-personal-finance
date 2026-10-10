import { CATEGORIES, type Category } from "./enums";
import { cutSearch, firstParam as first, isOneOf, type QueryParams } from "./query-params";
import type { ErrorIssue } from "./schemas";

/**
 * SPEC-transactions 2.2–2.3: the Transactions URL contract, read once for the page (lenient)
 * and for `GET /api/transactions` and its tool (strict). Pure, with no Zod: the issues are
 * written by hand with the contract's two codes, so the API never depends on a Zod mapper.
 */

/** SPEC-transactions 4.1: ten rows a page; the DTO schema and `paginate` read it. */
export const TRANSACTIONS_PAGE_SIZE = 10;

/** SPEC-transactions 2.2: the search is at most 60 characters (the name limit, data-model.md). */
export const TRANSACTIONS_Q_MAX = 60;

/** SPEC-transactions 2.4: the six sorts, in the menu's order; `latest` is the default. */
export const TRANSACTION_SORTS = [
  "latest",
  "oldest",
  "a-to-z",
  "z-to-a",
  "highest",
  "lowest",
] as const;
export type TransactionSort = (typeof TRANSACTION_SORTS)[number];

/** The effective view: absent `q` and `category` mean no search and "All Transactions". */
export type TransactionsQuery = {
  q: string | undefined;
  category: Category | undefined;
  sort: TransactionSort;
  /** 1 or more; `paginate` clamps it to the last page, which only the total knows. */
  page: number;
};

/** A `URLSearchParams` (the route) or Next's awaited `searchParams` (the page). */
export type TransactionsParams = QueryParams;

export type ParsedTransactionsQuery = {
  query: TransactionsQuery;
  /** Strict mode only, in the order `q`, `category`, `sort`; always empty when lenient. */
  issues: ErrorIssue[];
  /** Each issue's sentence joined with "; " (v1.0.17); empty when there is no issue. */
  message: string;
};

const PAGE_PATTERN = /^[1-9]\d*$/;

export function parseTransactionsQuery(
  params: TransactionsParams,
  { strict }: { strict: boolean },
): ParsedTransactionsQuery {
  const issues: ErrorIssue[] = [];
  const messages: string[] = [];
  const refuse = (field: string, code: ErrorIssue["code"], message: string) => {
    issues.push({ path: [field], code });
    messages.push(message);
  };

  let q = first(params, "q")?.trim() || undefined;
  if (q !== undefined && q.length > TRANSACTIONS_Q_MAX) {
    if (strict) {
      refuse("q", "too_long", `q must be at most ${TRANSACTIONS_Q_MAX} characters`);
      q = undefined;
    } else {
      q = cutSearch(q, TRANSACTIONS_Q_MAX); // v1.0.17
    }
  }

  const rawCategory = first(params, "category");
  let category: Category | undefined;
  if (rawCategory !== undefined) {
    if (isOneOf(CATEGORIES, rawCategory)) category = rawCategory;
    else if (strict) {
      refuse("category", "invalid_format", `category must be one of: ${CATEGORIES.join(", ")}`);
    }
  }

  const rawSort = first(params, "sort");
  let sort: TransactionSort = "latest";
  if (rawSort !== undefined) {
    if (isOneOf(TRANSACTION_SORTS, rawSort)) sort = rawSort;
    else if (strict) {
      refuse("sort", "invalid_format", `sort must be one of: ${TRANSACTION_SORTS.join(", ")}`);
    }
  }

  // 2.3: `page` is never an error, in either mode (US-09 AC4).
  const rawPage = first(params, "page");
  const page = rawPage !== undefined && PAGE_PATTERN.test(rawPage) ? Number(rawPage) : 1;

  return { query: { q, category, sort, page }, issues, message: messages.join("; ") };
}

/**
 * SPEC-transactions 2.2: the URL the page's own controls write — `q`, `category`, `sort`,
 * `page` in that order, by `URLSearchParams` (a space becomes `+`), each left out at its default
 * (no search, "All Transactions", `latest`, page 1). Parameters outside the contract are dropped.
 */
export function transactionsSearch(query: TransactionsQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.sort !== "latest") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  const search = params.toString();
  return search ? `?${search}` : "";
}
