# src/ui

Design-system primitives: `tokens.css`, Button, Input, Modal, Menu, icons (ADR-0002).

- **Imports allowed:** `src/shared`.
- `tokens.css` is generated from `docs/02-architecture/design-tokens.md` and is the only
  place design values are written. No hard-coded hex or pixel values anywhere else.

T-06: `Button` (primary), `Field` (label, input, helper, error — `aria-describedby`,
`aria-invalid`, a polite live region), `PasswordField` (show/hide toggle), `Logo`
(`LogoLarge`), `icons/EyeIcon`, `icons/EyeSlashIcon` (challenge assets, drawn in
`currentColor`). No `style` prop and no `next/image` anywhere: the CSP's `style-src` blocks
inline style attributes (ADR-0006).

T-07: the app shell — `Shell` (skip link, `<main>`, the back/forward-cache session re-check in
`session-recheck.ts`), `Sidebar` (minimise; `sidebar-state.ts` keeps
`sessionStorage["pf.sidebar"]`), `BottomNav`, `NavItem`, `PageHeader`, `LogoutButton`
(sidebar row or header icon; `logout.ts` completes the logout even when the request fails),
`OriginTrialMeta`; `nav.ts` (`PAGE_NAMES`, `NAV_ITEMS`, `isActive`); `cx.ts`. `icons/` gains
the five navigation icons and the minimise caret (challenge assets) and `SignOutIcon`
(Phosphor, MIT); `Logo` gains `LogoSmall`. Their component tests are in `tests/unit/ui/`.
