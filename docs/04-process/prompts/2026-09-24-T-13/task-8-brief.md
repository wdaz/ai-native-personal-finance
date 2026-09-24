## Task 8: commit and tag messages in the secret scan (only if Q5 = yes)

**Files:**
- Modify: `scripts/secret-scan.sh`, `tests/unit/secret-guard.test.ts`

**Interfaces:**
- Consumes: the file's existing helpers `newRepo`, `commitFile`, `git`, `run`, `secretScan`,
  `leakLine`, `FAKE_PASSWORD`.

- [ ] **Step 1: Write the failing tests.** In `tests/unit/secret-guard.test.ts`, inside
  `describe("scripts/secret-scan.sh history …")`, after the "finds a secret typed only while
  resolving…" case:

```ts
    it("finds a secret typed into a commit message, and never prints it (T-13)", () => {
      const repo = newRepo();
      commitFile(repo, "a.txt", "a\n", `note\n\n${leakLine}`);
      const result = scanHistory(repo);
      expect(result.status).toBe(1);
      expect(result.stdout).toContain("postgres_connection_string");
      expect(result.stdout + result.stderr).not.toContain(FAKE_PASSWORD);
    });

    it("finds a secret typed into an annotated tag message (T-13)", () => {
      const repo = newRepo();
      commitFile(repo, "a.txt", "a\n", "one");
      git(repo, "tag", "-a", "v1", "-m", `release\n\n${leakLine}`);
      expect(scanHistory(repo).status).toBe(1);
    });

    it("passes messages that hold no secret, and still reports a file leak beside them", () => {
      const clean = newRepo();
      commitFile(clean, "a.txt", "a\n", "docs: a plain message");
      expect(scanHistory(clean).status).toBe(0);
      const leaky = newRepo();
      commitFile(leaky, ".env", `${leakLine}\n`, "add");
      expect(scanHistory(leaky).status).toBe(1);
    });
```
  Run `npx vitest run tests/unit/secret-guard.test.ts -t "message"`.
  **Prediction:** the first two fail (`Expected 1, Received 0`) — the file's only leak is in the
  message; the third passes.

- [ ] **Step 2: Implement.** In `scripts/secret-scan.sh`'s `history)` branch, keep the two guards
  and replace the closing `exec …` with a run of both scans, each reported:

```sh
    status=0
    "$here/gitleaks.sh" git --config "$config" --log-opts="--all --diff-merges=separate" \
      --redact --no-banner --verbose . || status=1
    # T-13: commit and annotated-tag messages are text the scan above never reads, and a
    # connection string pasted into one is as public as one in a file (T-02a's documented
    # limitation; the pass measured clean on this repository and failing on a leaky message,
    # 2026-09-24). Both scans always run, so one finding never hides the other.
    messages="$(mktemp)"
    trap 'rm -f "$messages"' EXIT
    git log --all --format='%B' >"$messages"
    git for-each-ref refs/tags --format='%(contents)' >>"$messages"
    "$here/gitleaks.sh" stdin --config "$config" --redact --no-banner --verbose \
      <"$messages" || status=1
    exit "$status"
```
  This replaces the existing `exec "$here/gitleaks.sh" git …` two-liner (the comments about
  `--log-opts` above it stay); `exec` becomes a plain call so the message scan can follow.
  Update the header comment of the file ("history … every commit **and every commit/tag message**").
  The `staged` mode is unchanged: a pre-commit hook cannot see the message being written (a
  `commit-msg` hook could; out of scope, noted in the process log).

- [ ] **Step 3: Run** the three tests, then the whole file. **Measured in the planning session
  with this implementation:** `tests/unit/secret-guard.test.ts` 29 passed (26 existing + these 3),
  and `npm run secrets:scan` on this repository prints "304 commits scanned … no leaks found" and
  then "no leaks found" for the messages. (Not run: the three new tests *before* the
  implementation — the "fail first" line above stays a prediction.)
- [ ] **Step 4: Commit** — `feat(security): scan commit and tag messages in the history scan`. The CI
  `secret scan` job needs no change (it runs `scripts/secret-scan.sh history`).

---

