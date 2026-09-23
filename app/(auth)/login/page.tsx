import Link from "next/link";
import styles from "../auth.module.css";
import { LoginForm } from "./LoginForm";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** SPEC-auth §2.1: the login page. `next` is sanitised by LoginForm (T-05's allow-list). */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  return (
    <div className={styles.card}>
      <h1 className={`text-preset-1 ${styles.title}`}>Login</h1>
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
