"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { COPY } from "@/src/shared/copy";
import { cx } from "./cx";
import { DotsThreeOutlineIcon } from "./icons/DotsThreeOutlineIcon";
import { claimOpenMenu, releaseOpenMenu } from "./open-menu";
import styles from "./ActionMenu.module.css";

export type ActionMenuItem = {
  label: string;
  /** Called with the trigger, the element the modal it opens returns focus to (2.2). */
  onSelect: (trigger: HTMLButtonElement) => void;
  /** The Delete item: red, underlined on hover (UK-Q5 (a)). */
  destructive?: boolean;
};

/**
 * SPEC-ui-kit 2.4 (US-32 AC1, NFR-A4): the "…" menu of actions on one record — a menu button
 * (`aria-haspopup="menu"`, `aria-expanded`, `aria-controls`) named "{label}: {name}" ("Budget
 * options: Entertainment", UK-Q1), whose popup is a `role="menu"` of `menuitem` buttons. Focus
 * moves onto the items; the arrows move without wrapping, Home and End jump, Enter and Space
 * activate, Escape closes to the trigger, and Tab closes to the trigger and lets the browser move
 * on. A click outside closes it; opening it closes any other menu on the page.
 */
export function ActionMenu({
  label,
  name,
  items,
}: {
  label: string;
  name: string;
  items: readonly ActionMenuItem[];
}) {
  const id = useId();
  const triggerId = `${id}-trigger`;
  const menuId = `${id}-menu`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);

  const close = useCallback(() => setOpen(false), []);

  const openAt = (index: number) => {
    claimOpenMenu(close);
    setFocusIndex(index);
    setOpen(true);
  };

  const closeToTrigger = () => {
    close();
    triggerRef.current?.focus();
  };

  // Focus follows the highlighted item while open.
  useEffect(() => {
    if (open) itemRefs.current[focusIndex]?.focus();
  }, [open, focusIndex]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node | null)) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  useEffect(() => () => releaseOpenMenu(close), [close]);

  const activate = (index: number) => {
    const item = items[index];
    const trigger = triggerRef.current;
    if (item === undefined || trigger === null) return;
    closeToTrigger();
    item.onSelect(trigger);
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (open) return;
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      openAt(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openAt(items.length - 1);
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusIndex((index) => Math.min(index + 1, items.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusIndex((index) => Math.max(index - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setFocusIndex(0);
        break;
      case "End":
        event.preventDefault();
        setFocusIndex(items.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        activate(focusIndex);
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        closeToTrigger();
        break;
      case "Tab":
        // Focus goes to the trigger first, then the browser moves it on from there.
        closeToTrigger();
        break;
    }
  };

  return (
    // Space is handled on keydown; its keyup default (a button's click) is cancelled, so a
    // Space that opened the menu or chose an item never clicks the element focus moved to.
    <div
      ref={rootRef}
      className={styles.root}
      onKeyUp={(event) => {
        if (event.key === " ") event.preventDefault();
      }}
    >
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={COPY.menuTriggerName(label, name)}
        onClick={() => (open ? closeToTrigger() : openAt(0))}
        onKeyDown={onTriggerKeyDown}
      >
        <DotsThreeOutlineIcon />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          className={styles.panel}
          onKeyDown={onMenuKeyDown}
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              className={cx("text-preset-4", styles.item, item.destructive && styles.destructive)}
              onClick={() => activate(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
