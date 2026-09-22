/**
 * Money is integer cents (ADR-0005, NFR-D2): every amount in the domain is a whole number
 * of cents in a JavaScript number, exact up to 9 × 10¹⁵ — far above NFR-S3's
 * 99,999,999,999. It becomes text only at the edge (`src/shared/money.ts`).
 */

/**
 * Dollars as data.json writes them to integer cents (ADR-0005, NFR-D2). A value finer than
 * a cent is refused rather than rounded away.
 */
export function toCents(dollars: number): number {
  const cents = Math.round(dollars * 100);
  if (!Number.isFinite(dollars) || Math.abs(cents - dollars * 100) > 1e-6) {
    throw new Error(`Seed amount ${dollars} is not a whole number of cents`);
  }
  return cents;
}

/**
 * The sum of whole-cent amounts. Anything else is refused, so a dollar amount or a database
 * `BigInt` that was not converted at the repository edge fails here instead of summing to a
 * wrong figure.
 */
export function sumCents(amounts: readonly number[]): number {
  let total = 0;
  for (const amount of amounts) {
    if (!Number.isSafeInteger(amount)) {
      throw new Error(`Amount ${String(amount)} is not a whole number of cents`);
    }
    total += amount;
  }
  if (!Number.isSafeInteger(total)) {
    throw new Error(`Total ${total} is beyond the exact range of a number`);
  }
  return total;
}
