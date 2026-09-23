import Link from "next/link";
import styles from "../auth.module.css";

/** SPEC-auth §2.1: the login page. */
export default function LoginPage() {
  return (
    <div className={styles.card}>
      <h1 className={`text-preset-1 ${styles.title}`}>Login</h1>
      <p className={styles.switch}>
        Need to create an account?{" "}
        <Link className={styles.switchLink} href="/signup">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
