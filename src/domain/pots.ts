import { THEMES, type Theme } from "@/src/shared/enums";

/** SPEC-pots 2.3: a full bar, in basis points (hundredths of a percent). */
export const FULL_BAR = 10_000;

/**
 * data-model.md's `potPercent(total, target)` (SPEC-pots 2.3, US-21 AC1, R-08): `total ÷ target × 100`
 * rounded half up to two decimals, returned as basis points (795 is 7.95 %). In integers —
 * `⌊(2 · total · 10,000 + target) ÷ (2 · target)⌋` with `BigInt` — because floating point rounds some
 * ties down (4.4: 3 cents of $200.00 is 0.015 %, which `toFixed(2)` prints as 0.01 %). Not capped: a
 * total above its target shows its real percentage.
 */
export function potPercent(total: number, target: number): number {
  if (!Number.isSafeInteger(total) || total < 0) {
    throw new Error(`Total ${String(total)} is not a whole, non-negative number of cents`);
  }
  if (!Number.isSafeInteger(target) || target < 1) {
    throw new Error(`Target ${String(target)} is not a whole number of cents of at least 1`);
  }
  const t = BigInt(target);
  return Number((2n * BigInt(total) * 10_000n + t) / (2n * t));
}

/** SPEC-pots 2.3: the bar is capped — full at 100 % and beyond. */
export const potFill = (total: number, target: number): number =>
  Math.min(FULL_BAR, potPercent(total, target));

export type MoneyMoveKind = "add" | "withdraw";

export type MoneyPreview = {
  /** What the move takes: the amount, clamped to the balance (add) or the pot's total (withdraw). */
  moved: number;
  /** "New Amount": the total ± `moved`. */
  newTotal: number;
  /** The segment that stays, in basis points of the track. */
  staying: number;
  /** The segment that moves (green or red), never past the track's end. */
  moving: number;
  /** The new percentage, uncapped. */
  percent: number;
};

/**
 * SPEC-pots 2.6 (US-25 AC1, AC3; US-26 AC1): the money modal's preview. `amount` is the cents
 * `parseAmountInput` read from the field, or `null` when the text reads as no amount — which moves
 * nothing, so the preview shows the current total. A readable amount is clamped as the design clamps it
 * (`min(amount, balance)` for an addition, `min(amount, total)` for a withdrawal); the confirm, not the
 * preview, refuses an amount over the limit.
 */
export function moneyPreview(
  pot: { total: number; target: number },
  kind: MoneyMoveKind,
  amount: number | null,
  balance: number,
): MoneyPreview {
  const limit = kind === "add" ? balance : pot.total;
  const moved = amount === null ? 0 : Math.max(0, Math.min(amount, limit));
  const newTotal = kind === "add" ? pot.total + moved : pot.total - moved;
  const staying = potFill(Math.min(pot.total, newTotal), pot.target);
  const moving = Math.min(FULL_BAR - staying, potFill(moved, pot.target));
  return { moved, newTotal, staying, moving, percent: potPercent(newTotal, pot.target) };
}

/**
 * SPEC-pots 2.5 (US-22 AC2, US-23 AC1): a name is taken when another pot has it, trimmed and compared
 * case-insensitively; the pot being edited (`exceptId`) keeps its own name. The database's `citext`
 * unique index stays the rule; this is the form's convenience.
 */
export function isPotNameTaken(
  name: string,
  pots: readonly { id: string; name: string }[],
  exceptId?: string,
): boolean {
  const wanted = name.trim().toLowerCase();
  return pots.some((pot) => pot.id !== exceptId && pot.name.trim().toLowerCase() === wanted);
}

/**
 * SPEC-pots 2.5: the add form's opening theme — the first of `THEMES` no pot holds, or `null` when all
 * fifteen are used (PO-Q4 (a): the form then opens with no theme).
 */
export function firstFreeTheme(used: Iterable<Theme>): Theme | null {
  const taken = new Set(used);
  return THEMES.find((theme) => !taken.has(theme)) ?? null;
}
