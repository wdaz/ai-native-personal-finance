/**
 * One `sessionStorage` value for this browser tab, read through `useSyncExternalStore`: the
 * sidebar's `pf.sidebar` (SPEC-app-shell §2.3) and the reset banner's `pf.banner` (§2.6) share
 * it (PR #20 review). A write re-renders every subscriber. Storage that throws (a privacy mode,
 * a full or disabled store) must not break the page: from the first failure on, the value lives
 * in memory for the rest of the page.
 */
export type SessionStore = {
  read: () => string | null;
  /** `null` removes the key. */
  write: (value: string | null) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createSessionStore(key: string): SessionStore {
  const listeners = new Set<() => void>();
  let storageUsable = true;
  let memory: string | null = null;

  return {
    read() {
      if (!storageUsable) return memory;
      try {
        return window.sessionStorage.getItem(key);
      } catch {
        storageUsable = false;
        return memory;
      }
    },
    write(value) {
      memory = value;
      if (storageUsable) {
        try {
          if (value === null) window.sessionStorage.removeItem(key);
          else window.sessionStorage.setItem(key, value);
        } catch {
          storageUsable = false;
        }
      }
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
