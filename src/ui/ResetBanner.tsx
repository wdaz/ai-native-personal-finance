"use client";

import { useSyncExternalStore } from "react";
import { COPY } from "@/src/shared/copy";
import { formatDate } from "@/src/shared/dates";
import { isBannerDismissed, subscribeBanner, writeBannerDismissed } from "./banner-state";
import { CloseCircleIcon } from "./icons/CloseCircleIcon";
import styles from "./ResetBanner.module.css";

/** The server cannot read sessionStorage; it renders the banner shown. */
const shownOnTheServer = () => false;

type ResetBannerProps = {
  /** `MetaDto.lastResetAt`, ISO-8601 UTC. */
  lastResetAt: string;
  resetIntervalDays: number;
  /** Called after a dismissal; the shell moves focus to the page (the button is gone). */
  onDismissed?: () => void;
};

/**
 * SPEC-app-shell §2.6, US-37 AC2: the demo-reset notice above the page — the reset interval
 * and the last reset's date, with a "Dismiss notice" button. The dismissal lasts for the tab,
 * and only for this reset: a later reset shows the banner again.
 */
export function ResetBanner({ lastResetAt, resetIntervalDays, onDismissed }: ResetBannerProps) {
  const dismissed = useSyncExternalStore(
    subscribeBanner,
    () => isBannerDismissed(lastResetAt),
    shownOnTheServer,
  );
  if (dismissed) return null;

  return (
    <div role="status" className={styles.banner}>
      <p className={styles.text}>{COPY.resetBanner(resetIntervalDays, formatDate(lastResetAt))}</p>
      <button
        type="button"
        className={styles.dismiss}
        aria-label={COPY.dismissNotice}
        onClick={() => {
          writeBannerDismissed(lastResetAt);
          onDismissed?.();
        }}
      >
        <CloseCircleIcon />
      </button>
    </div>
  );
}
