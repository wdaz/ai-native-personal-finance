# Task 9 report — TD-4: submit the four tests with Enter

Commit: 3a8341e `test(e2e): submit the focus-after-error tests with Enter so Chromium can fail them (TD-4)`
(branch task/T-13-ci-hardening, on top of 03f3c8e). Files: tests/e2e/login.spec.ts,
tests/e2e/signup.spec.ts, docs/03-specs/tech-debt.md.

## What I did
- Lines were as in the brief: login.spec.ts 115 and 132, signup.spec.ts 119 and 131. Replaced
  `loginButton(page).click()` / `createButton(page).click()` with `passwordField(page).press("Enter")`
  in exactly those four tests; the other tests keep `.click()`. `passwordField` already exists in both files.
- tech-debt.md (brief Step 5): table row TD-4 -> **Closed** | T-13; a `- **Closed:**` bullet with the date
  and the proof; status line gains `v1.8 — 2026-09-24: TD-4 closed by T-13`.

## Step 2 — Chromium, four tests: 4 passed (5.9 s) — matched the brief's measurement.

## Step 3 — mutation proof (real output)
Sources copied outside the tree first. Mutations: LoginForm.tsx line 78 `submitRef.current?.focus();`
deleted; line 94 `(response.status === 401 ? passwordRef : submitRef)` -> `... : passwordRef)`;
SignupForm.tsx line 71 `submitRef.current?.focus();` deleted. Same command, Chromium (the webServer
rebuilds the app each run):

    1) [chromium] login.spec.ts:101 a rate-limited login ...
        Locator:  getByRole('button', { name: 'Login', exact: true })
        Expected: focused
        Received: inactive
    2) login.spec.ts:126 network failure ...   (same Expected/Received, Login button)
    3) [chromium] signup.spec.ts:111 a server error ...
        Locator:  getByRole('button', { name: 'Create Account', exact: true })
        Expected: focused
        Received: inactive
    4) signup.spec.ts:125 a request that gets no answer ... (same, Create Account button)
      4 failed

Restored by copying the saved files back; `git diff --stat` afterwards listed only the two spec files
(app/ and src/ empty). Rerun: 4 passed (5.8 s). The mutation was never committed.
I did not additionally show the OLD `.click()` version passing under the mutation; the brief cites the
T-06 reviewer for that.

## Step 4 — Firefox + WebKit, four tests: 8 passed (9.6 s) — prediction matched.
Run on macOS WebKit only; I cannot observe Linux WebKit. Enter leaves focus in a disabled input, so the
tests do not depend on how an engine treats a clicked disabled button; I expect no Linux difference,
but that is unverified here.

## Final checks (each its own command)
- typecheck clean; lint clean (--max-warnings 0); format:check clean.
- npm test: 76 files / 951 tests passed (baseline matched). traceability: all 18 Release 1 stories named.
- E2E login.spec.ts + signup.spec.ts whole files on chromium+firefox+webkit: 60 passed (25.1 s).

## Deviations / concerns
- PR number: the brief says "PR #<n>, fill in when the PR exists". I did not commit a literal
  placeholder; the Closed bullet says "T-13 (`task/T-13-ci-hardening`; the PR number is added when it
  is opened)". Task 11 or the PR step should add the number.
- For Task 11 (records): docs/03-specs/backlog.md line 71 still lists TD-4 as open ("Open at v1.18 ..."),
  and the T-13 row (line 63) still carries the "from T-06: tech debt TD-4" hand-off. Not touched here.
- The TD-4 "What"/"Fix" text is left as written (history); only status and the Closed bullet were added.
