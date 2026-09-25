## Task 2: TD-8 — the walkthrough's comment says what the test does (Q1 = a)

**Files:**

- Modify: `tests/e2e/auth-accessibility.spec.ts` (the doc comment above `test.describe("keyboard-only
  login"`)

**Interfaces:** none. This task has **no failing-first test** — a comment cannot be red; the owner
chose (a) on 2026-09-25 and so waived that line of the backlog row for TD-8 (Q1). Say so in the
PR.

- [ ] **Step 1: change the comment**

```diff
--- a/tests/e2e/auth-accessibility.spec.ts
+++ b/tests/e2e/auth-accessibility.spec.ts
@@ -11,8 +11,9 @@ test.beforeEach(async ({ request }) => {
 /**
  * US-32 AC3 — the documented keyboard walkthrough of /login (SPEC-auth §6 tab order):
  * Tab → "Copy demo email" → "Copy demo password" → Email → Password → "Show password" →
- * "Login" → "Sign Up". Space on the toggle shows the password. Shift+Tab back to the fields,
- * type the demo credentials, Enter submits.
+ * "Login" → "Sign Up". The demo credentials are typed on the way forward, Space on the toggle
+ * shows the password, then the Password field is focused directly and Enter submits. The
+ * reverse order (Shift+Tab) is not walked: SPEC-auth §6 documents the forward order only (TD-8).
  */
 test.describe("keyboard-only login", () => {
   test("US-32 AC1 AC3 keyboard-only login: tab order, visible focus, Space toggles, Enter submits", async ({
```

- [ ] **Step 2: run the walkthrough on the three engines** (the test itself is unchanged; this
  shows it still passes)

```bash
PORT=3113 npx playwright test --project=chromium --project=firefox --project=webkit tests/e2e/auth-accessibility.spec.ts -g "keyboard-only login"
```

Expected (predicted — the test is unchanged; the same command with the reverse walk added, the
option the owner did not choose, was measured `3 passed`, 11.5 s including the build): `3 passed`.

- [ ] **Step 3: commit**

```bash
git add tests/e2e/auth-accessibility.spec.ts
git commit -m "test(e2e): the login walkthrough's comment says what the test does (TD-8)"
```

