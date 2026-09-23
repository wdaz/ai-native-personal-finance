import { createSessionStore } from "./session-store";

/**
 * SPEC-app-shell §2.6: the reset banner's dismissal, for this browser tab. The stored value in
 * `sessionStorage["pf.banner"]` is the `lastResetAt` the user dismissed. A later reset has
 * another date, so the banner comes back with it (PR #20 review, finding 4). A reset also ends
 * the session, so after the new login the tab has not dismissed this reset. Read through
 * `useSyncExternalStore`; storage failures are handled by `createSessionStore`.
 */
export const BANNER_STORAGE_KEY = "pf.banner";

const store = createSessionStore(BANNER_STORAGE_KEY);

export function isBannerDismissed(lastResetAt: string): boolean {
  return store.read() === lastResetAt;
}

export function writeBannerDismissed(lastResetAt: string): void {
  store.write(lastResetAt);
}

export const subscribeBanner = store.subscribe;
