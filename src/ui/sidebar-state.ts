import { createSessionStore } from "./session-store";

/**
 * US-35: the sidebar's minimised state for this browser tab. `sessionStorage["pf.sidebar"]` is
 * "collapsed" while minimised and absent otherwise (SPEC-app-shell §2.3); the sidebar reads it
 * through `useSyncExternalStore`. Storage failures are handled by `createSessionStore`.
 */
export const SIDEBAR_STORAGE_KEY = "pf.sidebar";

const store = createSessionStore(SIDEBAR_STORAGE_KEY);

export function readSidebarCollapsed(): boolean {
  return store.read() === "collapsed";
}

export function writeSidebarCollapsed(collapsed: boolean): void {
  store.write(collapsed ? "collapsed" : null);
}

export const subscribeSidebar = store.subscribe;
