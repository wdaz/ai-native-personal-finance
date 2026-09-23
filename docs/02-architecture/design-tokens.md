# Design tokens

Status: **Approved** (v1.2 — 2026-09-23: app shell tokens and the sign-out icon, owner decision at the T-07 plan gate; v1.1 — 2026-09-23: auth layout and line tokens, owner decision at the T-06 plan gate; v1.0, owner approval 2026-09-13) · Author(s): Agent (extracted), Owner (approval) · Date: 2026-09-13
Changelog: v1.2 (2026-09-23, owner decision at the T-07 plan gate, Q3/Q4) — new table "App shell": nine values the sidebar and the bottom bar need and the style guide never named, each read from the design export (the sidebar, tablet and mobile bar markup of `app-prototype.html` and `style-guide.html`) or from SPEC-app-shell §2.3/§4 rather than chosen; two are durations, so the value column now accepts `ms` and the header rule covers millisecond values too. The Icons section adds Phosphor `sign-out` (fill) as a project addition (28 icons) and notes that the navigation icons and the minimise caret are the challenge's starter assets. `src/ui/tokens.css` mirrors the table; `tests/unit/scaffold.test.ts` parses `px` and `ms` values and pins each one. v1.1 (2026-09-23, owner decision at the T-06 plan gate, Q2) — new table "Auth layout and lines": seven values the auth screens need and the style guide never named, each read from the design export (the Auth screen of `app-prototype.html`, the input and button samples of `style-guide.html`) rather than chosen; `src/ui/tokens.css` mirrors them and `tests/unit/scaffold.test.ts` pins each one.
Source: `../00-discovery/inputs/design/style-guide.html` (Claude Design export of the Figma style guide); the 22 colours were cross-checked against the Figma-extracted tokens of 2026-09-01 — identical. These are the **only** source for UI values (`src/ui/tokens.css`); no hard-coded hex, pixel or millisecond values elsewhere.

## Colours

| Token | Name | HEX | RGB | Use |
|-------|------|-----|-----|-----|
| `--color-beige-500` | Beige 500 | `#98908B` | 152, 144, 139 | input borders, placeholder text |
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

## Typography — Public Sans (`next/font/google`, weights 400 and 700)

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

## Icons

Phosphor Icons (27 used, listed in the style guide, plus `sign-out` (fill) added by T-07 as a project addition — the design has no logout control; MIT-licensed, taken from `github.com/phosphor-icons/core`: arrow-fat-lines-left, arrows-down-up, barbell, book-open-text, caret-down/right/up, chart-donut, check-circle, dots-three-outline, eye, eye-slash, filter, house, jar-fill, list-bullets, magnifying-glass, music-note, network, potted-plant, receipt, shield-plus, sort, video, warehouse, warning-circle, wrench). The five navigation icons and the minimise caret are the challenge's starter SVGs (`icon-nav-*.svg`, `icon-minimize-menu.svg`), the same Phosphor glyphs. Inlined as SVG components in `src/ui/icons/` with `aria-hidden` unless interactive.

## Component states (style guide)

Buttons: primary (grey-900 → grey-500 on hover), secondary (beige-100 → white with beige-500 border on hover), tertiary (text + caret, grey-500 → grey-900), destroy (red → red at 80 % opacity). Inputs: default beige-500 border, hover grey-500, active/focus grey-900 border, filled grey-900 text; helper text preset-5 grey-500 right-aligned; error text preset-5 red. Focus indicator (project addition, NFR-A2): 2px `--color-grey-900` outline with 2px offset on light surfaces, `--color-white` on the sidebar.
