import Link from "next/link";
import { demoCredentials } from "@/src/server/env";
import { COPY } from "@/src/shared/copy";
import styles from "../auth.module.css";
import { DemoBox } from "./DemoBox";
import { LoginForm } from "./LoginForm";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * SPEC-auth §2.1–2.2: the reset notice (after a demo reset ended the session,
 * SPEC-reset-and-test-support §2.6), the demo box, the form, the link to sign-up — in the tab
 * order §6 names. The credentials are read here, on the server, and reach DemoBox as props.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, reason } = await searchParams;
  const demo = demoCredentials();
  return (
    <div className={styles.card}>
      <h1 className={`text-preset-1 ${styles.title}`}>Login</h1>
      {reason === "reset" ? (
        <p role="status" className={styles.notice}>
          {COPY.loginAfterReset}
        </p>
      ) : null}
      <DemoBox email={demo.email} password={demo.password} />
      <LoginForm next={typeof next === "string" ? next : null} />
      <p className={styles.switch}>
        Need to create an account?{" "}
        <Link className={styles.switchLink} href="/signup">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
