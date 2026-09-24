## Task 9: TD-4 — submit the four tests with Enter

**Files:**
- Modify: `tests/e2e/login.spec.ts` (2 tests), `tests/e2e/signup.spec.ts` (2 tests),
  `docs/03-specs/tech-debt.md` (TD-4 → Closed, and the table row)

- [ ] **Step 1: Edit the four tests.** `.click()` on the submit button leaves focus on the button in
  Chromium and Firefox, so the assertion passes with or without the code's `submitRef.current?.focus()`.
  Pressing Enter in the last field leaves focus in an input the form then disables:
  - `tests/e2e/login.spec.ts` lines 115 (the rate-limited test, after `const answer =
    page.waitForResponse(…)`) and 132 (the network-failure test): replace
    `await loginButton(page).click();` with `await passwordField(page).press("Enter");`.
  - `tests/e2e/signup.spec.ts` lines 119 ("a server error shows…") and 131 ("a request that gets no
    answer…"): replace `await createButton(page).click();` with
    `await passwordField(page).press("Enter");` (only those two; the file's other tests keep
    `.click()`). Line numbers are as of `838e0f5`; find them with `grep -n`.

- [ ] **Step 2: Run the four on Chromium.** `npx playwright test --project=chromium tests/e2e/login.spec.ts
  tests/e2e/signup.spec.ts -g "rate-limited|network failure|server error|gets no answer"`.
  **Measured:** 4 passed (5.9 s).

- [ ] **Step 3: Prove they now test the focus call (the reviewer measured this in T-06).**
  Temporarily neutralise the three focus calls — `app/(auth)/login/LoginForm.tsx:78` (delete the
  line), `:94` (`(response.status === 401 ? passwordRef : passwordRef)`), and
  `app/(auth)/signup/SignupForm.tsx:71` (delete) — rerun Step 2's command.
  **Measured:** all 4 **fail** on Chromium — `Expected: focused`, `Received: inactive` — on the
  Login and Create Account buttons. Revert the three source edits (a copy of each file kept
  outside the tree is the safest way back; not `git checkout <rev> -- .`), `git diff --stat` must
  list only the two spec files, rerun: 4 pass.

- [ ] **Step 4: Firefox and WebKit.** Same command with `--project=firefox --project=webkit`.
  **Prediction:** 8 passed (not run in the planning session; `login.spec.ts`/`signup.spec.ts` with
  the old `.click()` were among the 184 that passed on both engines).

- [ ] **Step 5: Close TD-4.** In `tech-debt.md`: table status `**Closed**` (picked up by T-13), a
  `- **Closed:**` bullet with the date, "T-13, PR #<n>" (fill in when the PR exists), how it was
  proven (Step 3), a status-line version entry `v1.8 — 2026-09-24: TD-4 closed by T-13`. Commit —
  `test(e2e): submit the focus-after-error tests with Enter so Chromium can fail them (TD-4)`.

---

