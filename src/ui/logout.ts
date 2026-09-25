/**
 * SPEC-auth §2.7 (v1.0.6), US-03 AC2: logout always completes. `POST /api/auth/logout` clears
 * the session cookie. If it fails — no answer within LOGOUT_TIMEOUT_MS, or a non-2xx answer —
 * the failure is logged and the caller goes to AFTER_FAILED_LOGOUT instead: a same-origin
 * navigation the proxy answers by clearing the cookie itself (§2.8). The cookie is
 * httpOnly, so no script can (T-07 plan Q1).
 */
export const AFTER_LOGOUT = "/login";
export const AFTER_FAILED_LOGOUT = "/login?reason=logout";
export const LOGOUT_TIMEOUT_MS = 10_000;

/** Returns the path to navigate to. Never throws. */
export async function logOut(
  fetcher: typeof fetch = fetch,
  log: (...data: unknown[]) => void = console.error,
): Promise<string> {
  try {
    const response = await fetcher("/api/auth/logout", {
      method: "POST",
      signal: AbortSignal.timeout(LOGOUT_TIMEOUT_MS),
    });
    if (response.ok) return AFTER_LOGOUT;
    log(
      `[logout] POST /api/auth/logout answered ${response.status}; completing the logout client-side`,
    );
  } catch (error) {
    log("[logout] POST /api/auth/logout failed; completing the logout client-side", error);
  }
  return AFTER_FAILED_LOGOUT;
}
