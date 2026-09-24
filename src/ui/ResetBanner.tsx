"use client";

import { useSyncExternalStore } from "react";
import { COPY } from "@/src/shared/copy";
import { formatDate } from "@/src/shared/dates";
import { TEST_IDS } from "@/src/shared/test-ids";
import { isBannerDismissed, subscribeBanner, writeBannerDismissed } from "./banner-state";
import { CloseCircleIcon } from "./icons/CloseCircleIcon";
import styles from "./ResetBanner.module.css";

/**
 * The server cannot read sessionStorage; it renders the banner shown. Known cost, accepted (T-08
 * plan D8; PR #20 review): after a dismissal, a full load (a reload, the login redirect) paints
 * the banner and removes it once hydrated — a flash and a shift of the page by the banner's
 * height. First visits, far more common, get no shift. Avoiding it needs a cookie the server
 * can read, and SPEC-app-shell §2.6 names sessionStorage.
 */
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
    <div role="status" data-testid={TEST_IDS.resetBanner} className={styles.banner}>
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
