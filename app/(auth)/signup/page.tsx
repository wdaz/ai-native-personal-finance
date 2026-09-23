import Link from "next/link";
import styles from "../auth.module.css";

/** SPEC-auth §2.5: the sign-up page. */
export default function SignupPage() {
  return (
    <div className={styles.card}>
      <h1 className={`text-preset-1 ${styles.title}`}>Sign Up</h1>
      <p className={styles.switch}>
        Already have an account?{" "}
        <Link className={styles.switchLink} href="/login">
          Login
        </Link>
      </p>
    </div>
  );
}
