"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { COPY } from "@/src/shared/copy";
import { CloseCircleIcon } from "./icons/CloseCircleIcon";
import { focusMain } from "./main-content";
import styles from "./Notice.module.css";

/** One notice to show; `id` changes each time, so the same text is announced again. */
export type NoticeState = { text: string; id: number } | null;

/**
 * SPEC-ui-kit 2.9: the page's notice state — `show` after the modal has closed (a 404), `clear`
 * when it is dismissed or the next write of the page succeeds.
 */
export function useNotice() {
  const [notice, setNotice] = useState<NoticeState>(null);
  // Only ever goes up, also across a dismissal, so a new notice never reuses a spoken id.
  const nextId = useRef(0);
  const show = useCallback((text: string) => {
    nextId.current += 1;
    setNotice({ text, id: nextId.current });
  }, []);
  const clear = useCallback(() => setNotice(null), []);
  return { notice, show, clear };
}

/**
 * SPEC-ui-kit 2.9 (UK-Q3 (a)): "This budget no longer exists" at the top of the page's content,
 * drawn as the reset banner is. The `role="status"` region is always in the page, empty and
 * taking no space, so its text is announced (a region inserted already holding its text is not
 * reliably read); each new notice empties it first and sets the text a frame later. Dismissing
 * empties it and moves focus to `<main>`, as the reset banner's dismissal does.
 */
export function Notice({ notice, onDismiss }: { notice: NoticeState; onDismiss: () => void }) {
  // The notice whose text the region holds; a new one renders empty until the next frame.
  const [spoken, setSpoken] = useState<NoticeState>(null);

  useEffect(() => {
    if (notice === null) return;
    const frame = requestAnimationFrame(() => setSpoken(notice));
    return () => cancelAnimationFrame(frame);
  }, [notice]);

  const shown = notice !== null && spoken?.id === notice.id;
  const text = shown ? notice.text : "";
  return (
    <div className={shown ? styles.notice : styles.idle}>
      <p role="status" className={styles.text}>
        {text}
      </p>
      {shown ? (
        <button
          type="button"
          className={styles.dismiss}
          aria-label={COPY.dismissNotice}
          onClick={() => {
            onDismiss();
            focusMain();
          }}
        >
          <CloseCircleIcon />
        </button>
      ) : null}
    </div>
  );
}
