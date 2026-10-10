/**
 * SPEC-transactions 2.8 and SPEC-ui-kit 2.4: opening one menu closes whichever other is open —
 * a `Menu` or an `ActionMenu` — so at most one panel is ever in the DOM.
 */
let closeOpenMenu: (() => void) | null = null;

/** Called by a menu as it opens, with its own close function. */
export function claimOpenMenu(close: () => void): void {
  if (closeOpenMenu !== null && closeOpenMenu !== close) closeOpenMenu();
  closeOpenMenu = close;
}

/** Called by a menu as it unmounts; a closed menu may stay registered until then. */
export function releaseOpenMenu(close: () => void): void {
  if (closeOpenMenu === close) closeOpenMenu = null;
}
