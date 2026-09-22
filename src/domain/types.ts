/**
 * What the domain needs to know about each entity of docs/02-architecture/data-model.md.
 * Money is integer cents; dates are `Date`s. The domain cannot import the Prisma client
 * (ADR-0002), so these are structural: a repository row with more fields (`id`, `theme`,
 * `avatar`) is accepted as it is, and the functions that return rows return the caller's
 * own type.
 */

export type BalanceInput = { current: number; income: number; expenses: number };

export type TransactionInput = {
  name: string;
  category: string;
  date: Date;
  /** Signed: negative is money out. */
  amount: number;
  recurring: boolean;
};

/** `seq` is the creation order the database assigns (data-model.md v1.1). */
export type BudgetInput = { seq: number; category: string; maximum: number };

/** `seq` is the creation order the database assigns (data-model.md v1.1). */
export type PotInput = { seq: number; total: number };
