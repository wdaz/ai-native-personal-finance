/**
 * SPEC-app-shell §2.6: the reset banner's dismissal, for this browser tab —
 * `sessionStorage["pf.banner"] = "dismissed"`. Read through `useSyncExternalStore`, like the
 * sidebar's state (T-08 plan v0.5, correction 8). Storage that throws must not break the page:
 * a read that fails shows the banner; a write that fails still hides it until the page goes.
 */
export const BANNER_STORAGE_KEY = "pf.banner";

const listeners = new Set<() => void>();
let dismissedInMemory = false;

export function readBannerDismissed(): boolean {
  if (dismissedInMemory) return true;
  try {
    return window.sessionStorage.getItem(BANNER_STORAGE_KEY) === "dismissed";
  } catch {
    return false;
  }
}

export function writeBannerDismissed(): void {
  try {
    window.sessionStorage.setItem(BANNER_STORAGE_KEY, "dismissed");
  } catch {
    dismissedInMemory = true;
  }
  for (const listener of listeners) listener();
}

export function subscribeBanner(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
