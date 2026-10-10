"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { COPY } from "@/src/shared/copy";
import { CloseCircleIcon } from "./icons/CloseCircleIcon";
import { focusMain } from "./main-content";
import styles from "./Modal.module.css";

export type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  /** The person asked to close it: Escape, the close button, a backdrop click. */
  onClose: () => void;
  /** False while a request is pending (2.7): nothing closes it then. */
  dismissible?: boolean;
  /** The element that gets focus first (a form's first field; the delete dialog's "No, Go Back"). */
  initialFocus?: () => HTMLElement | null;
  /**
   * The element that gets focus back, read when the modal closes; otherwise the one that had
   * focus when it opened. A page names `<main>` when that element is inside a record just
   * deleted or a list being refreshed (2.2, 2.3).
   */
  returnFocus?: () => HTMLElement | null;
  children: ReactNode;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * SPEC-ui-kit 2.2 (US-15 AC4, US-32 AC2, NFR-A3): one modal for every form and for the delete
 * confirmation, in a portal on `document.body`. While open, every other child of the body is
 * `inert` and the page's scroll is locked (through `element.style`, ADR-0006); Tab and Shift+Tab
 * wrap inside the dialog; Escape, the close button and a press-and-release on the backdrop each
 * ask to close, when `dismissible`. Focus goes to the named element, else to the first focusable
 * one after Close (the design's rule, the designer's changelog §8d); on close it returns to the
 * named element, else to the opener, and to `<main>` when that element is gone or disabled.
 * The page holds the `ModalSlot` claim that opened it (one modal at a time).
 */
export function Modal(props: ModalProps) {
  if (!props.open || typeof document === "undefined") return null;
  return createPortal(<ModalLayer {...props} />, document.body);
}

function ModalLayer({
  title,
  description,
  onClose,
  dismissible = true,
  initialFocus,
  returnFocus,
  children,
}: ModalProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const layerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pressedOnBackdrop = useRef(false);
  // Read when the modal closes, so the latest props decide (2.2: "gone" is decided then).
  const returnFocusRef = useRef(returnFocus);
  const initialFocusRef = useRef(initialFocus);
  useLayoutEffect(() => {
    returnFocusRef.current = returnFocus;
    initialFocusRef.current = initialFocus;
  });

  const focusables = () =>
    [...(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter(
      (element) => !element.closest("[inert]"),
    );

  useLayoutEffect(() => {
    const layer = layerRef.current;
    const panel = panelRef.current;
    if (layer === null || panel === null) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // The attribute, not the property: it is what the browser reads, and jsdom reflects it too.
    const madeInert = [...document.body.children].filter(
      (element) => element !== layer && !element.hasAttribute("inert"),
    );
    for (const element of madeInert) element.setAttribute("inert", "");
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";

    const first = initialFocusRef.current?.() ?? focusables()[1] ?? focusables()[0] ?? panel;
    first.focus();

    return () => {
      for (const element of madeInert) element.removeAttribute("inert");
      html.style.overflow = overflow;
      const target = returnFocusRef.current?.() ?? opener;
      if (target !== null && target.isConnected && !target.matches(":disabled")) target.focus();
      else focusMain();
    };
    // Runs once per opening; the latest focus props are read through refs.
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (dismissible) onClose();
      return;
    }
    if (event.key !== "Tab") return;
    // The list is read at each press: an open `Menu` adds elements (2.2).
    const list = focusables();
    const firstElement = list[0];
    const lastElement = list[list.length - 1];
    if (firstElement === undefined || lastElement === undefined) {
      event.preventDefault();
      return;
    }
    const active = document.activeElement;
    const inList = list.some((element) => element === active);
    if (event.shiftKey && (active === firstElement || !inList)) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && (active === lastElement || !inList)) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  // 2.2: a backdrop click counts only when the press also started on the backdrop, so selecting
  // text in a field and releasing outside the panel does not close the form.
  const onMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    pressedOnBackdrop.current = event.target === event.currentTarget;
  };
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const fromBackdrop = pressedOnBackdrop.current && event.target === event.currentTarget;
    pressedOnBackdrop.current = false;
    if (fromBackdrop && dismissible) onClose();
  };

  return (
    // The backdrop's click is a pointer shortcut; Escape and the close button are the keyboard's.
    <div
      ref={layerRef}
      className={styles.layer}
      onKeyDown={onKeyDown}
      onMouseDown={onMouseDown}
      onClick={onClick}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description === undefined ? undefined : descriptionId}
        tabIndex={-1}
        className={styles.panel}
      >
        <div className={styles.titleRow}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label={COPY.close}
            onClick={() => {
              if (dismissible) onClose();
            }}
          >
            <CloseCircleIcon />
          </button>
        </div>
        {description === undefined ? null : (
          <p id={descriptionId} className={`text-preset-4 ${styles.description}`}>
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
