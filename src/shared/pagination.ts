/**
 * SPEC-transactions 2.7: which page numbers the pagination shows. Pure, in `src/shared` because
 * a `ui` component calls it (`eslint.config.mjs`'s layers). 768 px and up show at most seven items;
 * below it at most three numbers (US-09 AC3), each list with `"gap"` where pages are hidden.
 */
export const PAGE_NUMBERS_WIDE = 7;
export const PAGE_NUMBERS_NARROW = 3;

export type PageItem = number | "gap";

const range = (from: number, to: number) =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

export function pageItems(current: number, count: number, maxNumbers: number): PageItem[] {
  const last = Math.max(1, count);
  const page = Math.min(Math.max(1, current), last);
  if (last <= maxNumbers) return range(1, last);

  if (maxNumbers < 5) {
    // Below 768 px: `maxNumbers` consecutive pages centred on the current one, shifted to stay
    // inside 1…count, with a gap at each end where pages are hidden.
    const start = Math.min(Math.max(1, page - Math.floor(maxNumbers / 2)), last - maxNumbers + 1);
    const end = start + maxNumbers - 1;
    return [
      ...(start > 1 ? ["gap" as const] : []),
      ...range(start, end),
      ...(end < last ? ["gap" as const] : []),
    ];
  }

  // 768 px and up: the first and last pages and the current one with a neighbour each side; a gap
  // of exactly one page shows that page instead of "…".
  const shown = [...new Set([1, page - 1, page, page + 1, last])]
    .filter((n) => n >= 1 && n <= last)
    .sort((a, b) => a - b);
  const items: PageItem[] = [];
  for (const n of shown) {
    const previous = items.at(-1);
    if (typeof previous === "number" && n - previous === 2) items.push(previous + 1);
    else if (typeof previous === "number" && n - previous > 2) items.push("gap");
    items.push(n);
  }
  return items;
}
