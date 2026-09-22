import type { Db } from "@/src/server/db";
import type { SeedRows } from "@/src/server/seed";

/**
 * Seed/reset helpers for the API tests (ADR-0003: "asserts … side effects via DB").
 * `storedRows` reads the database back in the terms of SeedRows — cents as numbers, dates
 * as ISO text, budgets and pots in creation order (`seq`) — and `insertedRows` is what it
 * returns once a reset has inserted `rows`. Transactions have no creation order of their
 * own, so both sides list them by date.
 */
const byDate = (a: { date: string }, b: { date: string }) =>
  a.date < b.date ? -1 : a.date > b.date ? 1 : 0;

export async function storedRows(db: Db) {
  const [balances, transactions, budgets, pots] = await Promise.all([
    db.balance.findMany(),
    db.transaction.findMany(),
    db.budget.findMany({ orderBy: { seq: "asc" } }),
    db.pot.findMany({ orderBy: { seq: "asc" } }),
  ]);
  return {
    balances: balances.map((b) => ({
      current: Number(b.current),
      income: Number(b.income),
      expenses: Number(b.expenses),
      seeded: b.seeded,
    })),
    transactions: transactions
      .map((t) => ({
        name: t.name,
        avatar: t.avatar,
        category: t.category,
        date: t.date.toISOString(),
        amount: Number(t.amount),
        recurring: t.recurring,
        seeded: t.seeded,
      }))
      .sort(byDate),
    budgets: budgets.map((b) => ({
      category: b.category,
      maximum: Number(b.maximum),
      theme: b.theme,
      seeded: b.seeded,
    })),
    pots: pots.map((p) => ({
      name: p.name,
      target: Number(p.target),
      total: Number(p.total),
      theme: p.theme,
      seeded: p.seeded,
    })),
  };
}

export function insertedRows(rows: SeedRows) {
  return {
    balances: [{ ...rows.balance, seeded: true }],
    transactions: rows.transactions
      .map((t) => ({ ...t, date: new Date(t.date).toISOString(), seeded: true }))
      .sort(byDate),
    budgets: rows.budgets.map((b) => ({ ...b, seeded: true })),
    pots: rows.pots.map((p) => ({ ...p, seeded: true })),
  };
}
