"use client";

import { useState } from "react";
import { SignOutIcon } from "./icons/SignOutIcon";
import { logOut } from "./logout";
import styles from "./LogoutButton.module.css";

/** SPEC-auth §2.7, US-03 AC1 — spec text, like the navigation labels (T-07 plan D3). */
const LOG_OUT = "Log out";

type LogoutButtonProps = { variant: "account" } | { variant: "icon" };

/**
 * "Log out" (SPEC-auth §2.7): the bordered icon button of the sidebar's account row on desktop
 * (≥ 1024 px, design changelog §35), an icon button in the page header below it (SPEC-app-shell
 * §2.2, §2.4). Either way a full page load follows — to
 * `/login`, or to `/login?reason=logout` when the request failed (`logout.ts`) — so the client
 * router keeps no app page in memory for Back to show (plan D8).
 */
export function LogoutButton(props: LogoutButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    window.location.assign(await logOut());
  }

  return (
    <button
      type="button"
      className={props.variant === "icon" ? styles.iconButton : styles.accountButton}
      aria-label={LOG_OUT}
      title={props.variant === "account" ? LOG_OUT : undefined}
      disabled={pending}
      onClick={() => void handleClick()}
    >
      <SignOutIcon />
    </button>
  );
}
