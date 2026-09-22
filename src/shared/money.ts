/**
 * SPEC-overview §4.2, "All money": `$` + thousands separators + two decimals; negative as
 * `-$55.50`; transaction rows prefix positives with `+`. Money is integer cents everywhere
 * else and becomes text only here, at the edge (Definition of Done). The digits are built
 * from the integer, so no amount NFR-S3 allows loses a cent to floating point, and every
 * engine prints the same text.
 */

const THOUSANDS = /\B(?=(\d{3})+(?!\d))/g;

export function formatMoney(cents: number): string {
  if (!Number.isSafeInteger(cents)) {
    throw new Error(`Amount ${String(cents)} is not a whole number of cents`);
  }
  const abs = Math.abs(cents);
  const dollars = String(Math.floor(abs / 100)).replace(THOUSANDS, ",");
  const rest = String(abs % 100).padStart(2, "0");
  return `${cents < 0 ? "-" : ""}$${dollars}.${rest}`;
}

/** SPEC-overview §2.4: a transaction row shows `+$75.50` for money in, `-$55.50` for money out. */
export const formatSignedMoney = (cents: number): string =>
  cents > 0 ? `+${formatMoney(cents)}` : formatMoney(cents);
