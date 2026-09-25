/**
 * TD-9 (docs/03-specs/tech-debt.md): a bare `fr` track is `minmax(auto, Nfr)`, and its `auto`
 * minimum follows the widest item's min-content — one fixed-size item (Budgets' donut) then
 * forces every card in its column wider than the page at 320 px (US-33 AC2). A column track is
 * therefore written `minmax(<definite>, Nfr)`: `minmax(0, 1fr)`, or a length or a percentage
 * as the minimum. `auto`, `min-content`, `max-content`, `var()`, `calc()` and `min()` as the
 * minimum do not count as definite, so they are reported too.
 *
 * Scope, as TD-9 states it: the value of `grid-template-columns`. Not read: `grid-template-rows`
 * (a row's `auto` minimum is about height, not the 320 px width), `grid-auto-columns` and the
 * `grid` / `grid-template` shorthands — nothing under `app/` or `src/` uses them, and adding one
 * is a reason to extend this rule. `tests/unit/css-grid.test.ts` makes the rule fail on purpose
 * (DoD v1.1); `npm run lint:css` runs it over `app/` and `src/`.
 */
const DEFINITE_MINIMUM = String.raw`(?:0|\d*\.?\d+(?:px|rem|em|ch|vw|vh|vmin|vmax|%))`;

// A number followed by `fr` that is not the maximum of `minmax(<definite>, …)`. The first
// lookbehind starts the match at the number's first digit, so `11fr` is not read as `1fr`.
const BARE_FR = new RegExp(
  String.raw`(?<![\d.])(?<!minmax\(\s*${DEFINITE_MINIMUM}\s*,\s*)\d*\.?\d+fr\b`,
  "i",
);

/** @type {import("stylelint").Config} */
const config = {
  rules: {
    "declaration-property-value-disallowed-list": [
      { "grid-template-columns": [BARE_FR] },
      {
        message:
          "TD-9: a bare fr column track sizes as minmax(auto, Nfr) and can push a card past the page at 320 px; write minmax(0, Nfr).",
      },
    ],
  },
};

export default config;
