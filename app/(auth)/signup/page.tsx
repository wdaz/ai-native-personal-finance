import Link from "next/link";
import { demoCredentials } from "@/src/server/env";
import styles from "../auth.module.css";
import { SignupForm } from "./SignupForm";

/**
 * SPEC-auth §2.5–2.6: the sign-up page. The demo credentials are read here, on the server, for
 * the notice that replaces the form after a valid submit.
 */
export default function SignupPage() {
  const demo = demoCredentials();
  return (
    <div className={styles.card}>
      <h1 className={`text-preset-1 ${styles.title}`}>Sign Up</h1>
      <SignupForm demoEmail={demo.email} demoPassword={demo.password} />
      <p className={styles.switch}>
        Already have an account?{" "}
        <Link className={styles.switchLink} href="/login">
          Login
        </Link>
      </p>
    </div>
  );
}
