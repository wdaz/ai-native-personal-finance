/**
 * The id of the page's `<main>` (SPEC-app-shell §2.8's skip link target). Focus goes there when
 * the element it would return to is gone: the reset banner's and the notice's dismissal, and a
 * modal whose opener was deleted (SPEC-ui-kit 2.2, 2.9).
 */
export const MAIN_CONTENT_ID = "main-content";

/** Focuses `<main>`; never leaves focus on `<body>` when the page has one. */
export function focusMain(): void {
  document.getElementById(MAIN_CONTENT_ID)?.focus();
}
