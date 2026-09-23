/**
 * SPEC-auth §2.4, §2.10: the only paths a post-login redirect or a middleware `?next=` may
 * send the browser to. Anything else — an open-redirect attempt, an API path, the auth pages
 * themselves, a fragment — falls back to /overview. One function, shared between the
 * middleware's redirect (T-05) and the client's post-login navigation (T-06).
 */
const ALLOWED_NEXT = /^\/(overview|transactions|budgets|pots|recurring-bills)(\?[^#]*)?$/;

export function sanitizeNextPath(next: string | null): string {
  return next !== null && ALLOWED_NEXT.test(next) ? next : "/overview";
}
