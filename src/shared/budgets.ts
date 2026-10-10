/**
 * SPEC-budgets 4.1: the bar's fill = `min(100, spent ÷ maximum × 100)`, with at most two
 * decimals, rounded half up (as R-08 rounds a pot's percentage). In integers: `spent × 10,000`
 * passes 2⁵³ at NFR-S3's largest amounts, so the basis points are computed with `BigInt`. The
 * bar is a `ui` component, which may import only `ui` and `shared` (SPEC-budgets 2.1).
 */
export function budgetFillPercent(spent: number, maximum: number): number {
  if (!Number.isSafeInteger(spent) || spent < 0) {
    throw new Error(`Spent ${String(spent)} is not a whole, non-negative number of cents`);
  }
  if (!Number.isSafeInteger(maximum) || maximum < 1) {
    throw new Error(`Maximum ${String(maximum)} is not a whole number of cents of at least 1`);
  }
  const max = BigInt(maximum);
  // Basis points, half up: ⌊(spent × 10,000 × 2 + maximum) ÷ (2 × maximum)⌋.
  const basisPoints = (BigInt(spent) * 20_000n + max) / (2n * max);
  return Number(basisPoints > 10_000n ? 10_000n : basisPoints) / 100;
}
