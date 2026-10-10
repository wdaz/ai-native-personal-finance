# Design tokens

Status: **Approved** (v1.7 — 2026-10-10: T-26, hand-off H16 (3): a "Progress bars" table with `--radius-50`, `--duration-progress`, `--spacing-bar-text`, `--spacing-25` and `--duration-preview` (the designer's changelog §18a, §18c, §19c, §19d, §25c; SPEC-pots PO-Q6 (a), PO-Q10 (a)); approved by its pull request's merge under the owner's Release 2 delegation; v1.6 — 2026-10-10: T-22, hand-off H13 (3) and (6): a "Modals and forms" table with `--color-backdrop`, `--modal-max-width`, `--action-menu-width`, `--field-menu-max-height` and `--duration-modal`, an "Opacity" table with `--opacity-unavailable` (SPEC-ui-kit §9 UK-Q4 (a); the designer's changelog §10, §12a), the destroy button's and the "…" menu Delete item's hover (UK-Q5 (a); the designer's changelog §11), and the `dots-three-outline` icon copied from the designer's export; approved by its pull request's merge under the owner's Release 2 delegation; v1.5 — 2026-10-10: T-19, hand-off H11 (2), (6)–(8): a "Shadow" table with `--shadow-popover` and the owner's note (SPEC-transactions §9 Q2), `--duration-popover` and `--filter-menu-max-height` (the designer's changelog §10, §12b), beige-500 for borders only (the designer's changelog §8a), and the Transactions toolbar's and pagination's five icons, copied from the designer's export; approved by the owner's merge of its pull request; v1.4 — 2026-09-24: Public Sans is served by `next/font/local` from committed files, TD-11, owner decision "a"; v1.3 — 2026-09-23: the close-circle icon, T-08; v1.2 — 2026-09-23: app shell tokens and the sign-out icon, owner decision at the T-07 plan gate; v1.1 — 2026-09-23: auth layout and line tokens, owner decision at the T-06 plan gate; v1.0, owner approval 2026-09-13) · Author(s): Agent (extracted), Owner (approval) · Date: 2026-09-13
Changelog: v1.4 (2026-09-24, T-13c, owner decision "a" on TD-11) — the Typography section names
`next/font/local` instead of `next/font/google`. The Google loader downloads the font while
`next build` runs, and a Google Fonts outage failed CI builds (PR #36). The two files, their
source, version and licence are in `app/fonts/README.md`. No token changes: the CSS variable
`next/font` sets, the weights 400 and 700 and `display: swap` stay, so `src/ui/tokens.css` and
the presets are untouched. (`scaffold.test.ts` reads every backticked double-dash name in this
file as a documented token, so the font variable is not written that way here.) v1.3 (2026-09-23, T-08, owner decision at its plan gate, Q2 (d)) — the Icons
section adds `close-circle`, used by the reset banner's dismiss button. It is not a Figma icon
and not a Phosphor file: the Claude Design prototype draws it inline as its modals' close
control (a 32 × 32 viewBox, a circle of radius 12.25 and an x, stroke 1.5, round caps). No new
token: its colours are grey-500 and grey-900. v1.2 (2026-09-23, owner decision at the T-07 plan
gate, Q3/Q4) — new table "App shell": nine values the sidebar and the bottom bar need and the style guide never named, each read from the design export (the sidebar, tablet and mobile bar markup of `app-prototype.html` and `style-guide.html`) or from SPEC-app-shell §2.3/§4 rather than chosen; two are durations, so the value column now accepts `ms` and the header rule covers millisecond values too. The Icons section adds Phosphor `sign-out` (fill) as a project addition (28 icons) and notes that the navigation icons and the minimise caret are the challenge's starter assets. `src/ui/tokens.css` mirrors the table; `tests/unit/scaffold.test.ts` parses `px` and `ms` values and pins each one. v1.1 (2026-09-23, owner decision at the T-06 plan gate, Q2) — new table "Auth layout and lines": seven values the auth screens need and the style guide never named, each read from the design export (the Auth screen of `app-prototype.html`, the input and button samples of `style-guide.html`) rather than chosen; `src/ui/tokens.css` mirrors them and `tests/unit/scaffold.test.ts` pins each one.
Source: `../00-discovery/inputs/design/style-guide.html` (Claude Design export of the Figma style guide); the 22 colours were cross-checked against the Figma-extracted tokens of 2026-09-01 — identical. These are the **only** source for UI values (`src/ui/tokens.css`); no hard-coded hex, pixel or millisecond values elsewhere.

## Colours

| Token | Name | HEX | RGB | Use |
|-------|------|-----|-----|-----|
| `--color-beige-500` | Beige 500 | `#98908B` | 152, 144, 139 | input and control borders only — never text, never under white text (3.14:1; placeholders are grey-500, the designer's changelog §8a) |
| `--color-beige-100` | Beige 100 | `#F8F4F0` | 248, 244, 240 | page background, secondary button |
| `--color-grey-900` | Grey 900 | `#201F24` | 32, 31, 36 | primary text, sidebar, primary button |
| `--color-grey-500` | Grey 500 | `#696868` | 105, 104, 104 | secondary text |
| `--color-grey-300` | Grey 300 | `#B3B3B3` | 179, 179, 179 | disabled text, sidebar inactive |
| `--color-grey-100` | Grey 100 | `#F2F2F2` | 242, 242, 242 | dividers, progress track |
| `--color-white` | White | `#FFFFFF` | 255, 255, 255 | cards |
| `--color-green` | Green | `#277C78` | 39, 124, 120 | positive amounts, paid, theme |
| `--color-yellow` | Yellow | `#F2CDAC` | 242, 205, 172 | theme |
| `--color-cyan` | Cyan | `#82C9D7` | 130, 201, 215 | theme, due-soon summary |
| `--color-navy` | Navy | `#626070` | 98, 96, 112 | theme |
| `--color-red` | Red | `#C94736` | 201, 71, 54 | errors, destructive, due soon, theme |
| `--color-purple` | Purple | `#826CB0` | 130, 108, 176 | theme |
| `--color-turquoise` | Turquoise | `#597C7C` | 89, 124, 124 | theme |
| `--color-brown` | Brown | `#93674F` | 147, 103, 79 | theme |
| `--color-magenta` | Magenta | `#934F6F` | 147, 79, 111 | theme |
| `--color-blue` | Blue | `#3F82B2` | 63, 130, 178 | theme |
| `--color-navy-grey` | Navy Grey | `#97A0AC` | 151, 160, 172 | theme |
| `--color-army-green` | Army Green | `#7F9161` | 127, 145, 97 | theme |
| `--color-gold` | Gold | `#CAB361` | 202, 179, 97 | theme |
| `--color-orange` | Orange | `#BE6C49` | 190, 108, 73 | theme |
| `--color-pink` | Pink | `#AF81BA` | 175, 129, 186 | theme |

The 15 theme colours (Green … Pink) are the `Theme` enum in `src/shared/enums.ts`; `data.json` stores them as hex, the seed maps hex → enum name.

## Typography — Public Sans (`next/font/local`, weights 400 and 700, latin; files in `app/fonts/`)

| Token | Preset | Weight | Size | Line height |
|-------|--------|--------|------|-------------|
| `--text-preset-1` | Text Preset 1 | 700 | 32px | 120% |
| `--text-preset-2` | Text Preset 2 | 700 | 20px | 120% |
| `--text-preset-3` | Text Preset 3 | 700 | 16px | 150% |
| `--text-preset-4` | Text Preset 4 | 400 | 14px | 150% |
| `--text-preset-4-bold` | Text Preset 4 Bold | 700 | 14px | 150% |
| `--text-preset-5` | Text Preset 5 | 400 | 12px | 150% |
| `--text-preset-5-bold` | Text Preset 5 Bold | 700 | 12px | 150% |

Implemented as utility classes `.text-preset-1` … `.text-preset-5-bold` setting `font`, `line-height` and `letter-spacing: 0`.

## Spacing

| Token | Value |
|-------|-------|
| `--spacing-50` | 4px |
| `--spacing-100` | 8px |
| `--spacing-150` | 12px |
| `--spacing-200` | 16px |
| `--spacing-250` | 20px |
| `--spacing-300` | 24px |
| `--spacing-400` | 32px |
| `--spacing-500` | 40px |
| `--spacing-600` | 48px |
| `--spacing-1000` | 80px |
| `--spacing-1600` | 128px |

## Radii, layout, breakpoints (from the prototype and design)

| Token | Value | Use |
|-------|-------|-----|
| `--radius-100` | 8px | buttons, inputs |
| `--radius-150` | 12px | cards |
| `--radius-200` | 16px | sidebar outer corner |
| `--sidebar-width` | 300px | desktop expanded |
| `--sidebar-width-min` | 88px | desktop collapsed |
| `--page-max-width` | 1440px | design frame |
| `--bp-tablet` | 768px | ≥ tablet |
| `--bp-desktop` | 1024px | ≥ desktop |

## Auth layout and lines (v1.1)

Source: the design export, read 2026-09-23 at the T-06 plan gate — the Auth screen of `app-prototype.html` (panel, card, headline, body, link) and the input and button samples of `style-guide.html` (border width); SPEC-auth §6 also names the 560 px panel. The prototype's modal card uses the same 560 px maximum.

| Token | Value | Use |
|-------|-------|-----|
| `--auth-panel-width` | 560px | auth illustration panel, ≥ 1024 px |
| `--auth-card-max-width` | 560px | login / sign-up card |
| `--auth-panel-min-height` | 700px | auth illustration panel |
| `--auth-headline-max-width` | 400px | auth panel headline |
| `--auth-body-max-width` | 440px | auth panel body copy |
| `--border-width` | 1px | input and outlined-control borders |
| `--underline-offset` | 3px | underlined text links |

## App shell (v1.2)

Source: the design export, read 2026-09-23 at the T-07 plan gate — the sidebar, tablet and mobile bar markup of `app-prototype.html` (row height, bar width and gaps, transitions, `max-width: 104px`) and of `style-guide.html`'s "Sidebar" section; SPEC-app-shell §2.3 (200 ms) and §4 (bar heights 52 / 74 px, 44 px tap target).

| Token | Value | Use |
|-------|-------|-----|
| `--nav-item-height` | 56px | sidebar navigation row and footer rows |
| `--nav-indicator-width` | 4px | the current page's green bar (left in the sidebar, bottom in the bottom bar) |
| `--nav-icon-size` | 24px | the icon box in navigation items and sidebar controls |
| `--bottom-nav-height-mobile` | 52px | bottom bar, below 768 px |
| `--bottom-nav-height-tablet` | 74px | bottom bar, 768–1023 px |
| `--bottom-nav-item-max-width` | 104px | bottom-bar tab |
| `--tap-target-min` | 44px | minimum control size, e.g. the header's "Log out" |
| `--duration-sidebar` | 200ms | sidebar width and caret transition |
| `--duration-hover` | 150ms | colour transition on navigation items and controls |

## Menus and popovers (v1.5)

Source: SPEC-transactions 2.8 (v1.0.14, v1.0.15) and the designer's changelog §10 ("Layout and motion tokens (UK-Q4)") and §12b; added by T-19 (hand-off H11 (7), (8)).

| Token | Value | Use |
|-------|-------|-----|
| `--duration-popover` | 150ms | a menu panel's fade-in (`fadeIn .15s ease`); never for colour changes, which use `--duration-hover` |
| `--filter-menu-max-height` | 360px | the Category filter menu's panel, which scrolls past it |

## Shadow (v1.5)

Source: the prototype's popover panels and the designer's style guide of 2026-10-04 ("Shadow", the designer's changelog §5); the owner's answer to SPEC-transactions §9 Q2. Added by T-19 (hand-off H11 (2)).

| Token | Value | Use |
|-------|-------|-----|
| `--shadow-popover` | `0 4px 24px rgba(0, 0, 0, 0.25)` | for popovers and dropdown menus only — not for cards or modals (cards are flat; a modal is set apart by its dark backdrop): the Sort by and Category menus and the pot "…" menu |

## Modals and forms (v1.6)

Source: SPEC-ui-kit §9 UK-Q4 (a), the owner's answer of 2026-10-05 taken from the designer's project — the designer's changelog §10, "Layout and motion tokens (UK-Q4)", and the style guide's "Layout & Motion Tokens"; a token named for another use is never reused, even where the number matches (`--auth-card-max-width`, `--sidebar-width`, `--duration-sidebar`, `--duration-hover`). Added by T-22 (hand-off H13 (3)); `--duration-popover` came with T-19.

| Token | Value | Use |
|-------|-------|-----|
| `--color-backdrop` | `rgba(0, 0, 0, 0.5)` | the layer behind an open modal |
| `--modal-max-width` | 560px | a modal's panel, at most |
| `--action-menu-width` | 134px | the Budgets and Pots "…" menu's panel |
| `--field-menu-max-height` | 300px | a form's Theme or Budget Category options panel, which scrolls past it |
| `--duration-modal` | 200ms | a modal's fade-in |

## Opacity (v1.6)

Source: the designer's changelog §12a (SPEC-ui-kit §9 UK-Q4's last part, answered (a)). Added by T-22 (hand-off H13 (3)).

| Token | Value | Use |
|-------|-------|-----|
| `--opacity-unavailable` | 0.25 | the theme swatch of an "Already used" option — the swatch alone; its label stays grey-500 and says "Already used" (not Overview's donut tint, a `color-mix`) |

## Progress bars (v1.7)

Source: the designer's changelog §18a (BU-1), §18c (BU-3), §19c (PO-3), §19d (PO-4) and §25c, approved by the owner on 2026-10-10; SPEC-pots 2.2, 2.6, 2.11 (PO-Q6 (a), PO-Q10 (a)). `--radius-50` and `--duration-progress` are shared with Budgets (SPEC-budgets 2.4, BU-Q7) and added by whichever of T-24 and T-26 lands first; the other three are Pots only. Added by T-26 (hand-off H16 (3)). Nothing animates under `prefers-reduced-motion: reduce`.

| Token | Value | Use |
|-------|-------|-----|
| `--radius-50` | 4px | a progress bar's track and fill (8 px tall: half its height) |
| `--duration-progress` | 400ms | a card's bar width, ease |
| `--spacing-bar-text` | 13px | Pots only: a pot's bar to its text row, and the money modal's preview (Budgets keeps 16 px, §25c) |
| `--spacing-25` | 2px | Pots only: the money modal preview's two segments apart |
| `--duration-preview` | 300ms | Pots only: the money modal preview's segments, ease |

## Icons

Phosphor Icons (27 used, listed in the style guide, plus `sign-out` (fill) added by T-07 as a project addition — the design has no logout control; MIT-licensed, taken from `github.com/phosphor-icons/core`: arrow-fat-lines-left, arrows-down-up, barbell, book-open-text, caret-down/right/up, chart-donut, check-circle, dots-three-outline, eye, eye-slash, filter, house, jar-fill, list-bullets, magnifying-glass, music-note, network, potted-plant, receipt, shield-plus, sort, video, warehouse, warning-circle, wrench). The five navigation icons and the minimise caret are the challenge's starter SVGs (`icon-nav-*.svg`, `icon-minimize-menu.svg`), the same Phosphor glyphs. `close-circle` (T-08) is the prototype's own modal close control, drawn inline in `app-prototype.html` and not among the 27, reused for the reset banner's dismiss button. `jar-fill` (T-10) is the Pots card's left tile (SPEC-overview §2.3), fetched from `github.com/phosphor-icons/core`'s own `assets/fill/jar-fill.svg` — the real Phosphor asset the design already names, rather than a substitute drawn without the (unavailable to this session) design export. `sort`, `filter`, `magnifying-glass`, `caret-down` and `caret-right` (T-19) are copied from the designer's Claude Design export (`components/icons/icon-data.js`, read 2026-10-10), the glyphs `Finance App.dc.html` draws: the Transactions page's mobile Sort and Category triggers, its search field, its menu triggers and its pagination (Prev is `caret-right` turned 180°, as the design draws it). `dots-three-outline` (T-22) is copied from the same export, the Budgets and Pots "…" button. Inlined as SVG components in `src/ui/icons/` with `aria-hidden` unless interactive.

## Component states (style guide)

Buttons: primary (grey-900 → grey-500 on hover), secondary (beige-100 → white with beige-500 border on hover), tertiary (text + caret, grey-500 → grey-900), destroy (red; on hover the background stays red and the text is underlined, `text-underline-offset: 3px`, with no transition — v1.6, SPEC-ui-kit §9 UK-Q5 (a), the designer's changelog §11). A pending button (`aria-disabled="true"`) shows no hover, like a disabled one. The "…" menu's Delete item (v1.6): red, on hover still red and underlined (offset 3px), with no transition. Inputs: default beige-500 border, hover grey-500, active/focus grey-900 border, filled grey-900 text; helper text preset-5 grey-500 right-aligned; error text preset-5 red. Focus indicator (project addition, NFR-A2): 2px `--color-grey-900` outline with 2px offset on light surfaces, `--color-white` on the sidebar.
