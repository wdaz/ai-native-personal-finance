"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { COPY } from "@/src/shared/copy";
import { fieldErrors, loginFailureMessage, type FieldErrors } from "@/src/shared/form-feedback";
import { sanitizeNextPath } from "@/src/shared/next-path";
import { EMAIL_MAX, LoginSchema, PASSWORD_MAX } from "@/src/shared/schemas";
import { Button } from "@/src/ui/Button";
import { Field } from "@/src/ui/Field";
import { PasswordField } from "@/src/ui/PasswordField";
import styles from "../auth.module.css";

type LoginField = "email" | "password";
const FIELDS: readonly LoginField[] = ["email", "password"];

/**
 * SPEC-auth §2.3–2.4, §3, §4. Validates on blur and on submit (US-31 AC1, plan D9); a valid
 * submit posts to /api/auth/login and, on 200, replaces the URL with the sanitised `next`
 * (T-05's allow-list, shared with the middleware). `flushSync` commits a state change before
 * focus moves, so focus lands on an enabled field whose message is already linked (plan D7).
 * `method="post"` + `noValidate`: plan D5.
 */
export function LoginForm({ next }: { next: string | null }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<LoginField, string>>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors<LoginField>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const fieldRefs = { email: emailRef, password: passwordRef };

  const change = (field: LoginField) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));
  const blur = (field: LoginField) => () =>
    setErrors((current) => ({ ...current, [field]: fieldErrors(LoginSchema, values)[field] }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const found = fieldErrors(LoginSchema, values);
    const firstInvalid = FIELDS.find((field) => found[field] !== undefined);
    if (firstInvalid) {
      flushSync(() => {
        setErrors(found);
        setBanner(null);
      });
      fieldRefs[firstInvalid].current?.focus();
      return;
    }

    flushSync(() => {
      setErrors({});
      setBanner(null);
      setSubmitting(true);
    });
    let response: Response;
    try {
      response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(LoginSchema.parse(values)),
      });
    } catch {
      flushSync(() => {
        setBanner(COPY.loginFailed);
        setSubmitting(false);
      });
      submitRef.current?.focus();
      return;
    }

    if (response.ok) {
      // §3 "Redirecting": the form stays disabled until the next page replaces it.
      router.replace(sanitizeNextPath(next));
      return;
    }

    const body: unknown = await response.json().catch(() => null);
    flushSync(() => {
      setBanner(loginFailureMessage(response.status, body));
      setSubmitting(false);
      if (response.status === 401) setValues((current) => ({ ...current, password: "" }));
    });
    (response.status === 401 ? passwordRef : submitRef).current?.focus();
  }

  return (
    <form className={styles.form} method="post" noValidate onSubmit={submit}>
      {banner !== null ? (
        <p role="alert" className={styles.banner}>
          {banner}
        </p>
      ) : null}
      <div className={styles.fields}>
        <Field
          id="login-email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          maxLength={EMAIL_MAX}
          value={values.email}
          error={errors.email}
          disabled={submitting}
          inputRef={emailRef}
          onChange={change("email")}
          onBlur={blur("email")}
        />
        <PasswordField
          id="login-password"
          name="password"
          label="Password"
          autoComplete="current-password"
          maxLength={PASSWORD_MAX}
          value={values.password}
          error={errors.password}
          disabled={submitting}
          inputRef={passwordRef}
          onChange={change("password")}
          onBlur={blur("password")}
        />
      </div>
      <Button ref={submitRef} type="submit" disabled={submitting}>
        {submitting ? COPY.loggingIn : "Login"}
      </Button>
    </form>
  );
}
