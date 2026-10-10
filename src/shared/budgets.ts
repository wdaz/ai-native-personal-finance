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

/**
 * SPEC-budgets 2.3 (BU-11 (A), the designer's changelog §24a and §25d; §9 BU-Q9 (a)): the donut
 * centre's fit on the Budgets page, chosen while the server renders it — no script measures the
 * text in the browser (NFR-P2). The text box is the 144 px hole less `--spacing-100` on each side.
 */
export const DONUT_TEXT_BOX = 128;
/**
 * The designer's changelog §31a (BU-11 correction): the spent total keeps `--text-preset-1` when
 * it fits the whole hole and "of {limit} limit" is on one line — there the spent line's cap top
 * has about 136 px of the circle's room, the layout Overview draws; so the seed's "$338.00"
 * (135.4 px) keeps 32 px as §24a says. Every other choice uses `DONUT_TEXT_BOX`.
 */
export const DONUT_HOLE = 144;

/** The spent total's presets, largest first; the centre never goes below the last (§24a). */
export const DONUT_SPENT_PRESETS = [
  "text-preset-1",
  "text-preset-2",
  "text-preset-3",
  "text-preset-4-bold",
  "text-preset-5-bold",
] as const;
export type DonutSpentPreset = (typeof DONUT_SPENT_PRESETS)[number];

/** Each preset's font size in px (`tokens.css`); all of them are bold (700). */
const PRESET_PX: Record<DonutSpentPreset, number> = {
  "text-preset-1": 32,
  "text-preset-2": 20,
  "text-preset-3": 16,
  "text-preset-4-bold": 14,
  "text-preset-5-bold": 12,
};
/** "of {limit} limit" is `--text-preset-5` (12 px, 400). */
const LIMIT_PX = 12;

/**
 * The app's font (`app/fonts/`, Public Sans 400 and 700), in em: the widest glyph of each kind a
 * formatted amount holds, and the limit line's two words with their space. Measured once with
 * the committed woff2 files in Chromium (`CanvasRenderingContext2D.measureText`, the T-24 plan),
 * so a text of a given length is never wider than the table says; kerning only narrows it.
 */
export const DONUT_FONT_EM = {
  bold: { digit: 0.675, dollar: 0.6805, comma: 0.277, point: 0.2695 },
  regular: { digit: 0.6475, dollar: 0.6585, comma: 0.2415, point: 0.225, of: 1.2045, limit: 2.295 },
} as const;

type Glyphs = { digit: number; dollar: number; comma: number; point: number };

/** The widest `formatMoney` text of `length` characters, in em: "$", digits, commas, ".", two digits. */
function widestAmountEm(length: number, glyphs: Glyphs): number {
  const integerChars = Math.max(1, length - 4);
  const digits = integerChars - Math.floor(integerChars / 4);
  const commas = integerChars - digits;
  return glyphs.dollar + (digits + 2) * glyphs.digit + commas * glyphs.comma + glyphs.point;
}

/**
 * The largest preset whose widest text of `length` characters fits (the table's rows): the hole
 * for preset 1 over a one-line limit (§31a), the 128 px box otherwise (§24a).
 */
export function donutSpentPreset(length: number, limitLines: 1 | 2 | 3 = 1): DonutSpentPreset {
  const em = widestAmountEm(length, DONUT_FONT_EM.bold);
  const box = (preset: DonutSpentPreset) =>
    preset === "text-preset-1" && limitLines === 1 ? DONUT_HOLE : DONUT_TEXT_BOX;
  return (
    DONUT_SPENT_PRESETS.find((preset) => em * PRESET_PX[preset] <= box(preset)) ??
    "text-preset-5-bold"
  );
}

/**
 * How many lines "of {limit} limit" takes: 1 on one line; 2 broken before "limit" (§24a); 3
 * broken after "of" too, when "of {limit}" is still wider than the box (§25d).
 */
export function donutLimitLines(length: number): 1 | 2 | 3 {
  const { of, limit } = DONUT_FONT_EM.regular;
  const amount = widestAmountEm(length, DONUT_FONT_EM.regular);
  if ((of + amount + limit) * LIMIT_PX <= DONUT_TEXT_BOX) return 1;
  if ((of + amount) * LIMIT_PX <= DONUT_TEXT_BOX) return 2;
  return 3;
}

/** The centre's fit for two formatted amounts (`formatMoney`), by their lengths alone. */
export function donutCentreFit(
  spentText: string,
  limitText: string,
): { spentPreset: DonutSpentPreset; limitLines: 1 | 2 | 3 } {
  const limitLines = donutLimitLines(limitText.length);
  return { spentPreset: donutSpentPreset(spentText.length, limitLines), limitLines };
}
