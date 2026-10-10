"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx";
import styles from "./TruncatedText.module.css";

/** SPEC-transactions 2.9: the designer's timings and placement numbers. */
const OPEN_DELAY_MS = 400;
const CLOSE_DELAY_MS = 150;
const GAP = 8;
const FLIP_BELOW_TOP = 72;
const EDGE = 16;
/** The arrow sits this far in from the tooltip's start, pointing at the start of the name. */
const ARROW_INSET = 12;

/**
 * 2.9's "one tooltip element serves the page": opening one closes whichever other is open, so
 * at most one tooltip is ever in the DOM.
 */
let closeOpenTooltip: (() => void) | null = null;

/**
 * SPEC-transactions 2.9 (and SPEC-overview §2.3, §2.4 v1.4, H12): a name on one line, cut with
 * an ellipsis when it does not fit. Only a cut name is a focus stop with a tooltip showing the
 * whole name — opened by 400 ms of hover, focus or a tap, closed 150 ms after the pointer leaves
 * the name and the tooltip, on blur, Escape, a second tap, a tap elsewhere, a scroll or a
 * resize, and never by itself on a timer. The full name stays in the text either way.
 */
export function TruncatedText({ text, className }: { text: string; className?: string }) {
  const id = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** A pointer press is under way, so the focus it causes is not a keyboard focus. */
  const pressing = useRef(false);
  const [cut, setCut] = useState(false);
  const [opened, setOpen] = useState(false);
  /** A name that fits again (a wider box) has no tooltip; `measure` also drops `opened` then. */
  const open = opened && cut;

  const clearTimers = useCallback(() => {
    if (openTimer.current !== null) clearTimeout(openTimer.current);
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  const close = useCallback(() => {
    clearTimers();
    setOpen(false);
  }, [clearTimers]);

  /** One pending close at a time: the name and the tooltip can both report the pointer leaving. */
  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimer.current = setTimeout(close, CLOSE_DELAY_MS);
  }, [clearTimers, close]);

  const show = useCallback(() => {
    clearTimers();
    if (closeOpenTooltip !== null && closeOpenTooltip !== close) closeOpenTooltip();
    closeOpenTooltip = close;
    setOpen(true);
  }, [clearTimers, close]);

  // A cut name is measured, not guessed: `scrollWidth > clientWidth`, again whenever its box
  // changes size (a resize, the sidebar, a font that loads late).
  useLayoutEffect(() => {
    const element = textRef.current;
    if (element === null) return;
    const measure = () => {
      const isCut = element.scrollWidth > element.clientWidth;
      setCut(isCut);
      if (!isCut) setOpen(false);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current?.contains(target) || tooltipRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    // Capture: a scroll of any scrolling box, not only the window, moves the name.
    window.addEventListener("scroll", close, { capture: true, passive: true });
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
    };
  }, [open, close]);

  useEffect(
    () => () => {
      clearTimers();
      if (closeOpenTooltip === close) closeOpenTooltip = null;
    },
    [clearTimers, close],
  );

  // 2.9 "Placement and the CSP": computed in the browser and set through `element.style`.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const tooltip = tooltipRef.current;
    const arrow = arrowRef.current;
    if (!open || root === null || tooltip === null || arrow === null) return;
    const name = root.getBoundingClientRect();
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const below = name.top < FLIP_BELOW_TOP;
    const maxLeft = Math.max(EDGE, window.innerWidth - EDGE - width);
    const left = Math.min(Math.max(name.left, EDGE), maxLeft);
    const top = below ? name.bottom + GAP : name.top - GAP - height;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${Math.max(EDGE, top)}px`;
    tooltip.dataset.side = below ? "below" : "above";
    const arrowLeft = Math.min(
      Math.max(name.left - left + ARROW_INSET, ARROW_INSET),
      width - 2 * ARROW_INSET,
    );
    arrow.style.left = `${arrowLeft}px`;
  }, [open]);

  const onPointerEnter = (event: PointerEvent) => {
    if (!cut || event.pointerType === "touch") return;
    if (open) {
      clearTimers();
      return;
    }
    clearTimers();
    openTimer.current = setTimeout(show, OPEN_DELAY_MS);
  };

  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    if (openTimer.current !== null) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (open) scheduleClose();
  };

  const onPointerDown = (event: PointerEvent) => {
    pressing.current = true;
    if (event.pointerType === "touch" && cut) {
      if (open) close();
      else show();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && open) close();
  };

  return (
    <span
      ref={rootRef}
      className={cx(styles.root, cut && styles.cut, className)}
      tabIndex={cut ? 0 : undefined}
      aria-describedby={open ? id : undefined}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerUp={() => (pressing.current = false)}
      onPointerCancel={() => (pressing.current = false)}
      onFocus={() => {
        if (cut && !pressing.current) show();
      }}
      onBlur={close}
      onKeyDown={onKeyDown}
    >
      <span ref={textRef} className={styles.text}>
        {text}
      </span>
      {open
        ? createPortal(
            <span
              ref={tooltipRef}
              id={id}
              role="tooltip"
              className={`text-preset-5 ${styles.tooltip}`}
              onPointerEnter={(event) => {
                if (event.pointerType !== "touch") clearTimers();
              }}
              onPointerLeave={(event) => {
                if (event.pointerType !== "touch") scheduleClose();
              }}
            >
              {text}
              <span ref={arrowRef} className={styles.arrow} aria-hidden="true" />
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
