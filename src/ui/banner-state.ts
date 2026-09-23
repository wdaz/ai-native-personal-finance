/**
 * SPEC-app-shell §2.6: the reset banner's dismissal, for this browser tab. The stored value in
 * `sessionStorage["pf.banner"]` is the `lastResetAt` the user dismissed. A later reset has
 * another date, so the banner comes back with it (PR #20 review, finding 4). A reset also ends
 * the session, so after the new login the tab has not dismissed this reset. Read through
 * `useSyncExternalStore`, like the sidebar's state. Storage that throws must not break the
 * page: a failed read shows the banner, and a failed write still hides it until the page goes.
 */
export const BANNER_STORAGE_KEY = "pf.banner";

const listeners = new Set<() => void>();
let dismissedInMemory: string | null = null;

export function isBannerDismissed(lastResetAt: string): boolean {
  if (dismissedInMemory === lastResetAt) return true;
  try {
    return window.sessionStorage.getItem(BANNER_STORAGE_KEY) === lastResetAt;
  } catch {
    return false;
  }
}

export function writeBannerDismissed(lastResetAt: string): void {
  try {
    window.sessionStorage.setItem(BANNER_STORAGE_KEY, lastResetAt);
  } catch {
    dismissedInMemory = lastResetAt;
  }
  for (const listener of listeners) listener();
}

export function subscribeBanner(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
