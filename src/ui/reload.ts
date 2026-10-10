/**
 * SPEC-write-path §3: a 409 ("Data was reset — reloading") and a 401 reload the page, whose
 * request then meets the proxy's redirect to the login page. One function, so the write UI's
 * tests can replace it (jsdom has no `location.reload`).
 */
export function reloadPage(): void {
  window.location.reload();
}
