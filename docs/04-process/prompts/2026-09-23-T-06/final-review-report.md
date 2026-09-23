# Whole-branch review — T-06 (38e931d..6c7f341)

Reviewer: a fresh subagent on Opus, dispatched by the executing session with the plan, the spec
paths, the plan's Review Focus verbatim and the ledger's rulings; read-only on tracked files,
allowed to run the suites and probe the running app on PORT=3108. Its report, verbatim:

---

T-06 whole-branch review (38e931d..6c7f341): With fixes. 0 Critical, 2 Important (1 product bug, 1 test gap), 4 Minor. Server stopped, tree clean, HEAD 6c7f341.

Passes: I read the code diff in full (all app/, src/, tests/, CI and config files, and the user-stories v1.4 diff) and skimmed the docs. I did not read every line of plan v0.4; I read the Decisions, Global Constraints, Review Focus, file structure, Task 1 and the Task 4/6 mutation steps.

What I ran, all on PORT=3108 against `next build` + `APP_ENV=test next start` (both /login and /signup build as ƒ):
- lint, typecheck and prettier --check are clean. `npm audit` finds 0.
- `npm test`: 521/521.
- `npm run test:api`: 43/43.
- `playwright --project=chromium`: 36/36.
- firefox + webkit: 72/72.
- Throwaway probe scripts are in /tmp/t06-review/ (outside the repo).

### Strengths
- **The CSP work is solid.** `connection()` is in the layout. There is no `style` prop and no `next/image` anywhere. `/login` has 19 `<script>` tags and every one carries the nonce. The HTTP test checks the nonce per tag, checks that there is no `style=` attribute, and checks that the nonce changes between requests. The guard listens for `securitypolicyviolation`, so it doesn't depend on the page's own scripts. It also proved itself on a real case: it caught Zod's `new Function` probe.
- **The Zod `jitless` ruling is right.** I checked zod/v4/core/util.js:218: `allowsEval` returns early under `jitless`, and schemas.js:1166-1168 short-circuits the probe. Adding `unsafe-eval` or weakening the guard would have been wrong.
- **Credentials never reach the URL.** I POSTed the form body to `/login?next=…` with curl. The response was a 200 re-render with the nonce, the password was not echoed in the HTML, and the server logged nothing.
- **Review Focus 5 (open redirect) is real.** The client uses T-05's shared `sanitizeNextPath`. Without it, `router.replace("//evil.example")` would leave the origin, so the "hostile next" test is meaningful.
- **Boundaries hold.** None of the three `"use client"` files imports `src/server`. The demo credentials reach them only as props. `src/ui` imports only ui and shared.
- **Form feedback is clean.** form-feedback.ts only chooses among `COPY` entries. The case-by-case test showing that a server 400 code reads the same as the client schema's message is a good contract test.
- **Accessibility wiring is careful.** The error live region is always rendered. `aria-describedby` puts the error before the helper. `aria-invalid` is set. The tab order is exactly the spec's. Contrast checks out: labels grey-500 on white and on beige-100 are about 5:1, the input border is about 3.1:1, and error red on white is 4.7:1. axe finds nothing on either page in any state.
- **CI.** The `e2e` job env is byte-identical to the `api` job's, and the bcrypt hash is raw (no `\$`). It installs Chromium, migrates, and uploads the report on failure.
- **The rulings stand up.** I agree with all five. The WebKit Alt+Tab one was measured and is documented in tests/e2e/README.md.

### Issues

#### Critical (Must Fix)
None.

#### Important (Should Fix)

**I1 — Anything entered before hydration is wiped the first time the form re-renders, and the user sees "Can't be empty" under fields they filled in.**
- Where: `app/(auth)/login/LoginForm.tsx:27`, `app/(auth)/signup/SignupForm.tsx:31`.
- What's wrong: both forms are controlled inputs whose state starts at `""`. Hydration leaves the typed DOM value alone, but the state stays `""`. On the next commit, React writes `""` back into the inputs.
- Who hits it: someone on a slow connection who types before the scripts run (the HTML is 24 KB; the JS is about 270 KB across 9 files), or a browser/password-manager autofill that runs before the scripts.
- What they see: they click Login and get "Can't be empty" under both fields, both fields empty, and no request sent. On sign-up, simply tabbing away from one field clears all three.
- Verified:
  - `node /tmp/t06-review/prehydrate.mjs`: hold `_next/static/**/*.js` with `page.route`, fill the demo credentials, release, wait for hydration, click Login. Output: "DOM email after hydration: kept", "login request sent: false", "email description: Can't be empty", and after the click "email DOM value kept: false".
  - `node /tmp/t06-review/prehydrate-signup.mjs`: fill all three fields before hydration, then one Tab after it. Output: `[["signup-name","",""],["signup-email","",""],["signup-password","","Can't be empty"]]`.
- Relation to plan D5: this is the same pre-hydration window. D5 made it safe (no credentials in the URL) but not usable.
- Fix: after mount, copy the DOM values into state, e.g. `useEffect(() => setValues({ email: emailRef.current?.value ?? "", password: passwordRef.current?.value ?? "" }), [])`, and the same for the three sign-up fields. Alternatively, make the inputs uncontrolled and read `new FormData(event.currentTarget)` on blur and submit; that also covers autofill that fires no events. Add an E2E test with the same hold-the-chunks shape as the probe: fill, release, then log in → expect `/overview`. The spec says nothing about this window, so the owner may want it recorded as a plan deviation.

**I2 — Review Focus 3's sign-up case is not pinned: every sign-up test still passes on all three engines with `noValidate` removed.**
- Where: `tests/e2e/signup.spec.ts:43-56`.
- What's wrong: this is the same wrong-reason pass the executor fixed on login. Filling the password blurs the email, so our blur message shows. The mousedown on the button blurs the password, so its message shows too. Then the browser focuses the email field itself. The plan's Task 6 had no mutation step for this. The process log (`process-log.md:1212`) says "Every Review Focus pin was proved by reintroducing its defect: `noValidate`…", which holds for login only.
- Why it matters: someone could delete `noValidate` from `SignupForm` and nothing would go red. The user would then get Chrome's bubble instead of our announced message whenever they press Enter in a malformed email field.
- Verified: `node /tmp/t06-review/novalidate-and-focus.mjs` removes the `novalidate` attribute after hydration and runs the test's own steps. On chromium, firefox and webkit alike, the email says "Enter a valid email address", the password has its message, and the email is focused, so every assertion still holds. The login test does fail without `noValidate` (email description `""` on all three), as the executor said.
- Fix: mirror the login test. Fill name and password first, then the email with `alex@`, and press Enter in the email field. Assert the message and the focus. Prove it by removing `noValidate` from SignupForm once and watching it fail, then correct the process-log line.

#### Minor (Nice to Have)

**M1 — On Chromium (the only engine in CI), the "submit button is focused after the error" assertions pass whether or not the code moves focus there.**
- Where: `tests/e2e/login.spec.ts:115/123` (429), `:132/136` (network), `tests/e2e/signup.spec.ts:113/116` and `:125/129`.
- What's wrong: each test submits with `.click()`. In Chromium and Firefox, the clicked button keeps focus while it is disabled, so it is still focused when the form re-enables. Only WebKit (focus goes to BODY) actually tests the `submitRef.current?.focus()` calls (`LoginForm.tsx:73,89`, `SignupForm.tsx:69`), and WebKit is not in CI until T-13. The 401 → password case is pinned on every engine.
- Verified: the same probe printed "focus while submitting (after click): BUTTON[disabled]" on chromium and firefox, and "BODY" on webkit. `/tmp/t06-review/enter-focus.mjs`: after pressing Enter in the password field, focus while submitting is `INPUT login-password`, so an Enter submit does pin the call on Chromium.
- Fix: submit these four tests with `passwordField(page).press("Enter")` (sign-up: Enter in the Create Password field) instead of clicking.

**M2 — The login walkthrough's comment doesn't match what the test does.**
- Where: `tests/e2e/auth-accessibility.spec.ts:34` says "Shift+Tab back to the fields, type the demo credentials, Enter submits". The test actually types on the way forward and returns with a programmatic `password.focus()` (`:59`; the sign-up walkthrough does the same at `:84`).
- Fix: press Enter on the focused Login button (a real keyboard path), or press Shift+Tab; then fix the comment.

**M3 — Both auth pages have the same `<title>`, "Personal Finance" (`app/layout.tsx:14`).**
- Why it matters: WCAG 2.4.2 (Level A, within NFR-A1) expects the title to identify the page. Screen-reader and tab-switching users can't tell /login from /signup. axe's `document-title` rule only checks that a title exists, so it can't catch this.
- Fix: this is new copy, so it needs the owner. Put it to the owner as a question, or hand it to T-07 alongside the other page titles (e.g. `metadata.title` with a "%s · Personal Finance" template).

**M4 — `z.config({ jitless: true })` is a side effect of importing `src/shared/schemas.ts`.**
- Why it matters: a later client module that parses a Zod object without first importing schemas.ts would probe eval again. `src/shared/tool-schema.ts` imports `zod` directly; it is unused on the client today. The E2E guard would catch it, so this is low risk.
- Fix: optionally, a one-line comment in tool-schema.ts or a tech-debt note for the WebMCP task.

### Declined to judge
- The helper "Passwords must be at least 8 characters" and the error "Password must be at least 8 characters" read nearly the same, and both are announced. Both texts are spec or appendix wording.
- The toggle changes both its `aria-label` (Show/Hide) and `aria-pressed`, which is a known ARIA anti-pattern. SPEC-auth §6 requires both.
- "Can't be empty" appears when a user just tabs through empty fields. SPEC-auth §4 defines "touched" as focused and left.
- Errors don't clear while the user types; they update on blur or submit. That is plan D9, and the spec names only those two moments.
- A no-JavaScript POST re-renders an empty login form with no message. Plan D5 only requires the credentials to stay out of the URL. I1 covers the JavaScript-enabled case.
- The demo password is in /signup's RSC payload before any submit, and in the committed screenshots. It is public by design (SPEC-auth §2.2, NFR-S1).
- `autoComplete="email"` rather than `"username"` on the login email. Plan D11 chose it, and both are valid 1.3.5 tokens.
- The password toggle has no hover state. US-34 is not among T-06's stories, and the style guide defines no toggle hover.
- The Copy button's border is about 2.85:1 against the beige box. 1.4.11 doesn't require a boundary on a button with a text label.
- `100vh` on mobile browsers: cosmetic, and nothing in the spec covers it.
- `/_global-error` is still prerendered (known F1 limitation), and TD-1 (the middleware nonce) is tracked in tech-debt.md.
- No lint rule stops `"use client"` files from importing `src/server`, and no module uses `server-only`. This predates T-06; I checked T-06's three client files by hand.
- Firefox and WebKit are not in CI. The backlog assigns that to T-13.
- The layout's `connection()` is redundant while F1's is present (executor ruling). The ruling is reasonable and the process log records it.

### Recommendations
1. Fix I1 and I2 on this branch, and M1 too, since it costs one line per test. Prove each pin by reintroducing its defect, as the log already promises.
2. For I1, record the choice between a mount sync and uncontrolled inputs as a plan deviation in the process log.
3. Put M3 to the owner, or add it to the T-07 row.

### Assessment — Ready to merge? **With fixes.**
The CSP, redirect, credential and accessibility work is correct, and everything is green on all three engines. But I1 is a real, reproducible data-loss bug a slow-network or autofill user will hit on the first screen of the app, and I2 leaves a Review Focus pin that the process log claims is proved actually unproved. Both are small and local.
