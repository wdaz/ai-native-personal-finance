import type { TransactionInput } from "@/src/domain/types";

/**
 * A hand-built transaction for the domain's unit tests: an August 2026 bill of $10.00
 * unless the test says otherwise. Values here are invented for one rule at a time — the
 * seed's own figures come from scripts/seed-figures.ts, never from here.
 */
export function transaction({
  date = "2026-08-10T12:00:00Z",
  ...fields
}: Partial<Omit<TransactionInput, "date">> & { date?: string } = {}): TransactionInput {
  return {
    name: "Vendor",
    category: "Bills",
    amount: -1_000,
    recurring: false,
    ...fields,
    date: new Date(date),
  };
}
