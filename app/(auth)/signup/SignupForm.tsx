"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { COPY } from "@/src/shared/copy";
import {
  fieldErrors,
  signupFieldErrors,
  type FieldErrors,
  type SignupField,
} from "@/src/shared/form-feedback";
import { EMAIL_MAX, NAME_MAX, PASSWORD_MAX, SignupSchema } from "@/src/shared/schemas";
import { Button } from "@/src/ui/Button";
import { Field } from "@/src/ui/Field";
import { PasswordField } from "@/src/ui/PasswordField";
import styles from "../auth.module.css";

const FIELDS: readonly SignupField[] = ["name", "email", "password"];

type SignupFormProps = { demoEmail: string; demoPassword: string };

/**
 * SPEC-auth §2.5–2.6: validates like the login form (blur and submit, US-31); a valid submit
 * posts to /api/auth/signup, which always answers `demo_instance` — the form is then replaced
 * by the notice, which takes focus (plan D7). A 400's codes become field messages (§2.10);
 * a server error shows "Something went wrong. Try again" and a request that got no answer
 * says the server can't be reached (plan Q1 (c), D16).
 */
export function SignupForm({ demoEmail, demoPassword }: SignupFormProps) {
  const [values, setValues] = useState<Record<SignupField, string>>({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FieldErrors<SignupField>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const fieldRefs = { name: nameRef, email: emailRef, password: passwordRef };

  const change = (field: SignupField) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));
  const blur = (field: SignupField) => () =>
    setErrors((current) => ({ ...current, [field]: fieldErrors(SignupSchema, values)[field] }));

  function showFieldErrors(found: FieldErrors<SignupField>): boolean {
    const firstInvalid = FIELDS.find((field) => found[field] !== undefined);
    if (!firstInvalid) return false;
    flushSync(() => {
      setErrors(found);
      setBanner(null);
      setSubmitting(false);
    });
    fieldRefs[firstInvalid].current?.focus();
    return true;
  }

  function showBanner(message: string) {
    flushSync(() => {
      setBanner(message);
      setSubmitting(false);
    });
    submitRef.current?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (showFieldErrors(fieldErrors(SignupSchema, values))) return;

    flushSync(() => {
      setErrors({});
      setBanner(null);
      setSubmitting(true);
    });
    let response: Response;
    try {
      response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(SignupSchema.parse(values)),
      });
    } catch {
      // No response at all: the network, not the server (Q1 (c)).
      showBanner(COPY.signupUnreachable);
      return;
    }

    if (response.ok) {
      flushSync(() => setDone(true));
      noticeRef.current?.focus();
      return;
    }
    const body: unknown = await response.json().catch(() => null);
    if (response.status === 400 && showFieldErrors(signupFieldErrors(body))) return;
    // A 5xx, or an answer this client cannot read: a server error (Q1 (c)).
    showBanner(COPY.signupFailed);
  }

  if (done) {
    return (
      <div ref={noticeRef} role="status" tabIndex={-1} className={styles.notice}>
        <p className={styles.noticeText}>{COPY.signupDisabled(demoEmail, demoPassword)}</p>
        <Link className={styles.switchLink} href="/login">
          {COPY.goToLogin}
        </Link>
      </div>
    );
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
          id="signup-name"
          name="name"
          label="Name"
          autoComplete="name"
          maxLength={NAME_MAX}
          value={values.name}
          error={errors.name}
          disabled={submitting}
          inputRef={nameRef}
          onChange={change("name")}
          onBlur={blur("name")}
        />
        <Field
          id="signup-email"
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
          id="signup-password"
          name="password"
          label="Create Password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX}
          helper="Passwords must be at least 8 characters"
          value={values.password}
          error={errors.password}
          disabled={submitting}
          inputRef={passwordRef}
          onChange={change("password")}
          onBlur={blur("password")}
        />
      </div>
      <Button ref={submitRef} type="submit" disabled={submitting}>
        Create Account
      </Button>
    </form>
  );
}
