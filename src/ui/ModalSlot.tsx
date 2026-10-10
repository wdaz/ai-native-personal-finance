"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * SPEC-ui-kit 2.2, "One at a time — who holds it": one per page, provided by the page's client
 * container, so the header button, the cards' "…" menus, Pots' money buttons and the delete
 * tool's handler — in different subtrees — share it. `claim()` checks and sets in one
 * synchronous step, so two calls in the same tick get one modal and the second `null`;
 * `isBusy()` is true while a modal is held or a tracked write is in flight (2.3 item 2).
 */
export interface ModalSlot {
  /** A release function, or `null` when a modal is already open. */
  claim(): (() => void) | null;
  isBusy(): boolean;
  /** The page's write function counts each request in and out. */
  trackWrite<T>(run: () => Promise<T>): Promise<T>;
}

export function createModalSlot(): ModalSlot {
  let holder: object | null = null;
  let writes = 0;
  return {
    claim() {
      if (holder !== null) return null;
      const claim = {};
      holder = claim;
      return () => {
        if (holder === claim) holder = null;
      };
    },
    isBusy: () => holder !== null || writes > 0,
    async trackWrite(run) {
      writes += 1;
      try {
        return await run();
      } finally {
        writes -= 1;
      }
    },
  };
}

const ModalSlotContext = createContext<ModalSlot | null>(null);

export function ModalSlotProvider({ children }: { children: ReactNode }) {
  const [slot] = useState(createModalSlot);
  return <ModalSlotContext.Provider value={slot}>{children}</ModalSlotContext.Provider>;
}

export function useModalSlot(): ModalSlot {
  const slot = useContext(ModalSlotContext);
  if (slot === null) throw new Error("useModalSlot needs the page's ModalSlotProvider");
  return slot;
}
