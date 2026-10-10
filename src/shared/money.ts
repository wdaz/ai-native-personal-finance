import { AMOUNT_MAX_CENTS } from "./schemas";

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

/** SPEC-ui-kit 2.5, `write-path.md` 2.7: the codes a typed amount can fail with, in this order. */
export type AmountInputIssue = "required" | "invalid_format" | "too_small" | "too_large";

export type AmountInput = { ok: true; cents: number } | { ok: false; code: AmountInputIssue };

/** NFR-S3: the largest amount, `$999,999,999.99` (the same bound as `AMOUNT_MAX_CENTS`). */
const AMOUNT_MAX = BigInt(AMOUNT_MAX_CENTS);

/**
 * Plain digits (`1234`, `007`) or groups of three after a first group of one to three digits that
 * does not start with `0` (`1,234`; UK-Q8 (a) refuses `0,500`), then `.` and one or two digits —
 * or `.` and one or two digits alone (`.5`). ASCII digits only: no `u` flag, so `\d` is `[0-9]`.
 */
const AMOUNT = /^(?<whole>[1-9]\d{0,2}(?:,\d{3})+|\d+)?(?:\.(?<fraction>\d{1,2}))?$/;

/**
 * SPEC-ui-kit 2.5, US-15 AC2 (R-17): a typed amount as integer cents, or the first rule it breaks —
 * empty → `required`; not the grammar above after one leading `-` and then one leading `$` →
 * `invalid_format`; negative or 0 → `too_small`; above `$999,999,999.99` → `too_large`. The cents
 * are computed from the digits with `BigInt`, so a 20-digit input loses nothing (4.1).
 */
export function parseAmountInput(text: string): AmountInput {
  let rest = text.trim();
  if (rest === "") return { ok: false, code: "required" };
  const negative = rest.startsWith("-");
  if (negative) rest = rest.slice(1);
  if (rest.startsWith("$")) rest = rest.slice(1);
  const match = AMOUNT.exec(rest);
  const whole = match?.groups?.whole ?? "";
  const fraction = match?.groups?.fraction ?? "";
  if (match === null || whole + fraction === "") return { ok: false, code: "invalid_format" };
  const cents = BigInt(whole.replaceAll(",", "") || "0") * 100n + BigInt(fraction.padEnd(2, "0"));
  if (negative || cents === 0n) return { ok: false, code: "too_small" };
  if (cents > AMOUNT_MAX) return { ok: false, code: "too_large" };
  return { ok: true, cents: Number(cents) };
}

/**
 * SPEC-ui-kit 2.5: an edit form's pre-fill — whole dollars as digits only (`750`), otherwise two
 * decimals (`75.50`); no `$` and no separators, so `parseAmountInput` reads it back to the same cents.
 */
export function formatAmountInput(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error(`Amount ${String(cents)} is not a whole, non-negative number of cents`);
  }
  const dollars = Math.floor(cents / 100);
  const rest = cents % 100;
  return rest === 0 ? String(dollars) : `${dollars}.${String(rest).padStart(2, "0")}`;
}
