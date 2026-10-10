import { transactionsPage, type TransactionsPage } from "@/src/domain/transactions";
import type { Category } from "@/src/shared/enums";
import type { TransactionsDto } from "@/src/shared/schemas";
import { TRANSACTIONS_PAGE_SIZE, type TransactionsQuery } from "@/src/shared/transactions-query";
import type { Db } from "./db";
import { categoryLabel } from "./overview";

type TransactionRow = {
  id: string;
  name: string;
  avatar: string;
  category: Category;
  date: Date;
  amount: number;
};

/**
 * SPEC-transactions 2.13: `TransactionsDtoSchema` is strict. Every field is named (the
 * `toOverviewDto` pattern), so nothing else on the caller's rows can reach the DTO.
 */
export function toTransactionsDto(page: TransactionsPage<TransactionRow>): TransactionsDto {
  return {
    items: page.items.map((transaction) => ({
      id: transaction.id,
      name: transaction.name,
      avatar: transaction.avatar,
      category: transaction.category,
      date: transaction.date.toISOString(),
      amount: transaction.amount,
    })),
    page: page.page,
    pageSize: TRANSACTIONS_PAGE_SIZE,
    pageCount: page.pageCount,
    total: page.total,
  };
}

/**
 * SPEC-transactions 2.1, 2.4: the one place the list is read, for the page (directly) and
 * `GET /api/transactions`. Every row is read (49 in the seed, read-only), with no `where`, no
 * `orderBy` and no `seeded` filter; the category becomes its display name first, so the
 * domain's filter compares display names (v1.0.17: no inverse of `CATEGORY_LABEL`).
 */
export async function getTransactions(db: Db, query: TransactionsQuery): Promise<TransactionsDto> {
  const rows = await db.transaction.findMany();
  return toTransactionsDto(
    transactionsPage(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        avatar: row.avatar,
        category: categoryLabel(row.category),
        date: row.date,
        amount: Number(row.amount),
      })),
      query,
    ),
  );
}
