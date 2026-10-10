"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { COPY } from "@/src/shared/copy";
import { cx } from "./cx";
import { CaretDownIcon } from "./icons/CaretDownIcon";
import styles from "./Menu.module.css";

export type MenuOption<V extends string> = {
  value: V;
  label: string;
  /** Shown but skipped by the arrow keys and never chosen (US-15 AC1: a value already used). */
  disabled?: boolean;
};

/**
 * 2.8's "opening one menu closes the other": opening a menu closes whichever other is open, so
 * at most one panel is ever in the DOM (the `TruncatedText` pattern).
 */
let closeOpenMenu: (() => void) | null = null;

/**
 * SPEC-transactions 2.8: the `Menu` primitive, for choosing one value from a list (the sort, the
 * category filter, and later the forms' category and theme). The trigger is a button with
 * `aria-haspopup="listbox"` and one accessible name, "{label}: {current}", at every width (§9
 * Q6 (a)); the panel is a `role="listbox"` that holds focus while open and names its highlighted
 * option with `aria-activedescendant`. Positioned by CSS alone (no inline `style`, ADR-0006).
 */
export function Menu<V extends string>({
  label,
  options,
  value,
  onChange,
  icon,
  className,
}: {
  label: string;
  options: readonly MenuOption<V>[];
  value: V | undefined;
  onChange: (value: V) => void;
  /** Below 768 px the label and the current option give way to this icon (2.6). */
  icon?: ReactNode;
  /** The trigger's and the panel's width, set by the page (2.6: Sort 114 px, Category 177 px). */
  className?: string;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const listboxId = `${id}-listbox`;
  const optionId = (index: number) => `${id}-option-${index}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const currentIndex = options.findIndex((option) => option.value === value);
  const current = options[currentIndex];
  const currentLabel = current?.label ?? "";

  const enabled = (index: number) => options[index] !== undefined && !options[index].disabled;
  const firstEnabled = () => options.findIndex((_, index) => enabled(index));
  const lastEnabled = () => {
    for (let index = options.length - 1; index >= 0; index--) if (enabled(index)) return index;
    return -1;
  };

  // A closed menu may stay in `closeOpenMenu`; calling it again only sets `open` to false.
  const close = useCallback(() => setOpen(false), []);

  const openAt = (index: number) => {
    if (closeOpenMenu !== null && closeOpenMenu !== close) closeOpenMenu();
    closeOpenMenu = close;
    setHighlight(index);
    setOpen(true);
  };

  /** 2.8: the current option, or the first one when there is none (or it is disabled). */
  const startIndex = () => (enabled(currentIndex) ? currentIndex : firstEnabled());

  const closeToTrigger = () => {
    close();
    triggerRef.current?.focus();
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option === undefined || option.disabled) return;
    closeToTrigger();
    onChange(option.value);
  };

  // While open the listbox holds focus; a click anywhere outside closes.
  useEffect(() => {
    if (!open) return;
    listboxRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node | null)) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  // The highlighted option is scrolled into view when it moves (Category's panel scrolls).
  useEffect(() => {
    if (!open || highlight < 0) return;
    document.getElementById(optionId(highlight))?.scrollIntoView?.({ block: "nearest" });
    // optionId is derived from `id`, which never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, highlight]);

  useEffect(
    () => () => {
      if (closeOpenMenu === close) closeOpenMenu = null;
    },
    [close],
  );

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (open) return;
    if (
      event.key === "Enter" ||
      event.key === " " ||
      event.key === "ArrowDown" ||
      event.key === "ArrowUp"
    ) {
      event.preventDefault();
      openAt(startIndex());
    }
  };

  const move = (from: number, step: 1 | -1) => {
    for (let index = from + step; index >= 0 && index < options.length; index += step) {
      if (enabled(index)) return index;
    }
    return from;
  };

  const onListboxKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlight((index) => move(index, 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlight((index) => move(index, -1));
        break;
      case "Home":
        event.preventDefault();
        setHighlight(firstEnabled());
        break;
      case "End":
        event.preventDefault();
        setHighlight(lastEnabled());
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(highlight);
        break;
      case "Escape":
        event.preventDefault();
        closeToTrigger();
        break;
      case "Tab":
        // 2.8: focus goes to the trigger first, then the browser moves it on from there.
        closeToTrigger();
        break;
    }
  };

  return (
    <div ref={rootRef} className={styles.menu}>
      <span id={labelId} className={`text-preset-4 ${styles.label}`}>
        {label}
      </span>
      <div className={cx(styles.anchor, className)}>
        <button
          ref={triggerRef}
          type="button"
          className={`text-preset-4 ${styles.trigger}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-label={COPY.menuTriggerName(label, currentLabel)}
          onClick={() => (open ? close() : openAt(startIndex()))}
          onKeyDown={onTriggerKeyDown}
        >
          <span className={styles.current}>{currentLabel}</span>
          <span className={styles.caret}>
            <CaretDownIcon />
          </span>
          {icon ? <span className={styles.icon}>{icon}</span> : null}
        </button>
        {open ? (
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={labelId}
            aria-activedescendant={highlight >= 0 ? optionId(highlight) : undefined}
            className={styles.panel}
            onKeyDown={onListboxKeyDown}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={index === currentIndex}
                aria-disabled={option.disabled ? true : undefined}
                className={cx(
                  "text-preset-4",
                  styles.option,
                  index === currentIndex && styles.selected,
                  index === highlight && styles.highlighted,
                )}
                onClick={() => choose(index)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
