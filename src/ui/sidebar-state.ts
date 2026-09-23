/**
 * US-35: the sidebar's minimised state for this browser tab. `sessionStorage["pf.sidebar"]` is
 * "collapsed" while minimised and absent otherwise (SPEC-app-shell §2.3); the sidebar reads it
 * through `useSyncExternalStore`, so a write re-renders every subscriber. Storage that throws
 * (a privacy mode, a full or disabled store) must not break the toggle: from the first failure
 * on, the state lives in memory for the rest of the page.
 */
export const SIDEBAR_STORAGE_KEY = "pf.sidebar";

const listeners = new Set<() => void>();
let storageUsable = true;
let memory = false;

export function readSidebarCollapsed(): boolean {
  if (!storageUsable) return memory;
  try {
    return window.sessionStorage.getItem(SIDEBAR_STORAGE_KEY) === "collapsed";
  } catch {
    storageUsable = false;
    return memory;
  }
}

export function writeSidebarCollapsed(collapsed: boolean): void {
  memory = collapsed;
  if (storageUsable) {
    try {
      if (collapsed) window.sessionStorage.setItem(SIDEBAR_STORAGE_KEY, "collapsed");
      else window.sessionStorage.removeItem(SIDEBAR_STORAGE_KEY);
    } catch {
      storageUsable = false;
    }
  }
  for (const listener of listeners) listener();
}

export function subscribeSidebar(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
