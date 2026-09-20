# SPEC-auth — Demo login, sign-up screen, logout, session

Status: Draft (v0.2, after adversarial review 2026-09-20) · Author(s): Agent · Date: 2026-09-20
Changelog: v0.2 — S-15 blur rule per US-31; S-16 sessions end on reset; S-17 route matrix + error envelope; S-18 rate-limit maths; S-29 back-navigation; S-30 `next` rule.
Implements: US-01, US-02, US-03, US-31 (for these forms), US-32 (for these screens) · Constrained by: ADR-0006, ADR-0002, NFR-S1/S2/S4/S6, NFR-A · Design: `inputs/design/app-prototype.html` "Auth" screen (illustration panel left, form card right; mobile: form only, illustration hidden)

## 1. Purpose
A visitor logs in with the demo account shown on the page and reaches Overview; the sign-up screen exists and validates but never creates an account; logout ends the session. Everything else in the app sits behind the session.

## 2. Behaviour
2.1 `GET /login` renders the auth layout with the **Login** form (if `?reason=reset`, a `role="status"` line above the form: "The demo data was reset — please log in again"): heading "Login", fields Email, Password (with show/hide toggle), primary button "Login", footer text "Need to create an account? **Sign Up**" (link to `/signup`).
2.2 Above the form a small "Demo account" box shows the demo email and password from env (`DEMO_EMAIL`, `DEMO_PASSWORD_DISPLAY`) with a "Copy" button for each (accessible names "Copy demo email" / "Copy demo password").
2.3 Submitting: client validates with `LoginSchema` (email required + format, password required). Invalid → inline messages (copy table), focus to first invalid field, no request.
2.4 Valid → `POST /api/auth/login`. 200 → navigate to `next` if it matches `^/(overview|transactions|budgets|pots|recurring-bills)(\?[^#]*)?$`, else `/overview`. 401 → error banner "Email or password is incorrect" (role="alert"), password cleared, focus to password. 429 → banner "Too many attempts. Try again in N minutes". Network error → banner "Something went wrong. Try again".
2.5 `GET /signup` renders the **Sign Up** form: heading "Sign Up", fields Name, Email, Create Password (helper "Passwords must be at least 8 characters"), button "Create Account", footer "Already have an account? **Login**".
2.6 Sign-up valid submit → `POST /api/auth/signup` → always 200 `{ code: "demo_instance" }` → the form is replaced by a notice (role="status"): "This is a demo instance — sign up is disabled. Use the demo account: <email> / <password>" with a "Go to login" link.
2.7 Logout: a "Log out" button in the sidebar footer (SPEC-app-shell) → `POST /api/auth/logout` → cookie cleared → `/login`. The client navigates even if the request fails (logged to console).
2.8 Middleware: unauthenticated request to `/overview|/transactions|/budgets|/pots|/recurring-bills` → 302 `/login?next=<path>`. Authenticated request to `/login` or `/signup` → 302 `/overview`. `/` → `/overview` (or `/login`).
2.9 Session cookie: name `pf_session`, httpOnly, Secure (except localhost), SameSite=Lax, path `/`, TTL 7 days, sliding: the middleware re-issues the cookie on every authenticated page or API request when more than 1 hour of its life has elapsed. Payload `{ sub: "demo", iat, resetEpoch }`; a session whose `resetEpoch` is older than the latest `ResetLog.at` is rejected (owner decision: sessions end on reset; SPEC-reset-and-test-support §2.6). Authenticated HTML responses send `Cache-Control: no-store`; the shell listens to `pageshow` with `persisted === true` and re-checks `GET /api/auth/session`, redirecting to `/login` if it returns `false` (US-03 AC1 back-navigation).
2.10 Route matrix and error envelope. Public: `POST /api/auth/login`, `POST /api/auth/signup`, `GET /api/auth/session`, `GET /api/meta`, `/login`, `/signup`. Secret-protected: `POST /api/admin/reset`. Test-env only: `/api/test/*`. Everything else requires a session; `POST /api/auth/logout` requires none (idempotent). All API errors use `ErrorEnvelope { error: "validation" | "invalid_credentials" | "rate_limited" | "unauthenticated" | "not_found" | "conflict" | "server_error", message: string, issues?: ZodIssue[], retryAfter?: number }` from `src/shared/schemas.ts`; every response carries `X-Request-Id`.

## 3. States
| State | Trigger | What the user sees | Exit |
|-------|---------|--------------------|------|
| Empty | page load | empty fields, demo box | typing |
| Validating | submit with invalid input | inline messages under fields | fix fields |
| Submitting | valid submit | button shows "Logging in…" and is disabled; fields disabled | response |
| Error | 401 / 429 / network | banner above the form, fields re-enabled | retry |
| Demo notice (sign-up) | valid sign-up submit | notice replaces form | click "Go to login" |
| Redirecting | 200 | none | Overview |

## 4. Rules and boundaries
- Email: trimmed, max 254, RFC-5322-lite regex (`^[^\s@]+@[^\s@]+\.[^\s@]+$`). Password: min 8, max 128 (sign-up); login only checks presence.
- Rate limit: 10 **failed** logins per IP per sliding 15-minute window → 429 with `Retry-After` (seconds); a successful login clears the IP's counter (clarifies ADR-0006, which says "attempts"). Banner minutes `N = max(1, Math.ceil(retryAfter / 60))`. Unit cases: 10th failure → 401, 11th → 429, entry older than 15 min ignored, success resets.
- Credentials compared with bcrypt against `DEMO_PASSWORD_HASH`; comparison runs even when the email does not match (constant-time behaviour).
- Copy buttons use `navigator.clipboard.writeText`; on failure show a tooltip "Copy failed — select the text".
- Validation copy: see `user-stories.md` appendix. Timing (US-31 AC1): a field validates on blur once it has been touched (focused and left), and every field validates on submit; the first invalid field receives focus on a failed submit.

## 5. Data
`LoginAttempt { id, ip, at, success }` (ADR-0005). No user table. Session payload `{ sub: "demo", iat }`, encrypted by iron-session with `SESSION_SECRET` (≥ 32 chars).

## 6. Interfaces
### UI
`app/(auth)/layout.tsx` (server): two-column layout ≥ 1024 px (illustration panel 560 px with logo, headline "Keep track of your money and save for your future", body copy), single column below. `app/(auth)/login/page.tsx` renders `<LoginForm/>` (client). `app/(auth)/signup/page.tsx` renders `<SignupForm/>` (client). Shared `src/ui/Field` (label, input, helper, error with `aria-describedby`), `src/ui/PasswordField` (toggle button `aria-label="Show password"`/`"Hide password"`, `aria-pressed`), `src/ui/Button`. Tab order: demo box → fields → submit → footer link. Enter submits.

### API
| Method | Path | Body (Zod) | Responses |
|--------|------|------------|-----------|
| POST | `/api/auth/login` | `LoginSchema { email, password }` | 200 `{ ok: true }` + Set-Cookie · 400 `{ error: "validation", issues }` · 401 `{ error: "invalid_credentials" }` · 429 `{ error: "rate_limited", retryAfter }` |
| POST | `/api/auth/signup` | `SignupSchema { name(1–60), email, password(8–128) }` | 200 `{ code: "demo_instance" }` · 400 validation |
| POST | `/api/auth/logout` | — | 204 + cookie cleared |
| GET | `/api/auth/session` | — | 200 `{ authenticated: boolean }` (used by E2E and the shell) |

### WebMCP tools
None. Tools are registered only inside `(app)` layouts (SPEC-webmcp-tools).

## 7. Tests required
| Level | What is asserted | Traces to |
|-------|------------------|-----------|
| Unit | `LoginSchema`/`SignupSchema` accept/reject cases; rate-limit window cases of §4; `next` allow-list; `resetEpoch` comparison | 4, 2.4, 2.9 |
| API | login 200/401/429 sequence with `Retry-After`; cookie attributes and sliding re-issue; logout clears (with and without session); signup returns demo_instance; `GET /api/auth/session` true/false; middleware redirects (`next` preserved; `//evil.com`, `/api/x`, `/login` fall back to `/overview`); `no-store` on app HTML; error envelope shape on 400/401/429 | 2.4, 2.6, 2.8–2.10 |
| E2E | US-01 AC1–AC5 (login happy path, empty-field messages, wrong password banner + cleared field, redirect with `next`, show/hide toggle); US-02 AC1–AC3; US-03 AC1–AC2; keyboard-only login (Tab order, Enter); axe on both pages | US-01…03, US-31/32 |

## 8. Out of scope
Password reset, remember-me, real accounts, OAuth, MFA.

## 9. Open questions
None.
