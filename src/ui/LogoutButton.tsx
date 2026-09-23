"use client";

import { useState } from "react";
import { SignOutIcon } from "./icons/SignOutIcon";
import { logOut } from "./logout";
import styles from "./LogoutButton.module.css";
import controls from "./SidebarControl.module.css";

/** SPEC-auth §2.7, US-03 AC1 — spec text, like the navigation labels (T-07 plan D3). */
const LOG_OUT = "Log out";

type LogoutButtonProps = { variant: "sidebar"; collapsed: boolean } | { variant: "icon" };

/**
 * "Log out" (SPEC-auth §2.7): the sidebar footer's row on desktop, an icon button in the page
 * header below 1024 px (SPEC-app-shell §2.2, §2.4). Either way a full page load follows — to
 * `/login`, or to `/login?reason=logout` when the request failed (`logout.ts`) — so the client
 * router keeps no app page in memory for Back to show (plan D8).
 */
export function LogoutButton(props: LogoutButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    window.location.assign(await logOut());
  }

  if (props.variant === "icon") {
    return (
      <button
        type="button"
        className={styles.iconButton}
        aria-label={LOG_OUT}
        disabled={pending}
        onClick={() => void handleClick()}
      >
        <SignOutIcon />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={controls.control}
      aria-label={props.collapsed ? LOG_OUT : undefined}
      title={props.collapsed ? LOG_OUT : undefined}
      disabled={pending}
      onClick={() => void handleClick()}
    >
      <span className={controls.icon}>
        <SignOutIcon />
      </span>
      {props.collapsed ? null : <span>{LOG_OUT}</span>}
    </button>
  );
}
