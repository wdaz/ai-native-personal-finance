### Task 3: The pre-commit hook and its installation

**Files:**
- Create: `scripts/git-hooks/pre-commit`
- Create: `scripts/install-git-hooks.sh`
- Modify: `tests/unit/secret-guard.test.ts`
- Modify: `package.json` (`scripts.prepare`)

**Interfaces:**
- Consumes: `scripts/secret-scan.sh staged` (Task 2); the test helpers of Tasks 1–2,
  including the `describe("package.json")` block.
- Produces: `core.hooksPath = scripts/git-hooks` after `npm install` / `npm ci`; a hook
  that exits 1 when `secret-scan.sh staged` fails for any reason.

- [ ] **Step 1: Add the failing tests**

(a) After `const secretScan = join(repoRoot, "scripts/secret-scan.sh");`:

```ts
const hooksDir = join(repoRoot, "scripts/git-hooks");
const installHooks = join(repoRoot, "scripts/install-git-hooks.sh");
```

(b) Inside `describe("package.json", …)`, after its existing test (one blank line
between them):

```ts
    it("installs the hook on npm install and npm ci (prepare)", () => {
      expect(scripts.prepare).toBe("sh scripts/install-git-hooks.sh");
    });
```

(c) Inside `describe("T-02a secret guard", …)`, after the `describe("package.json", …)`
block:

```ts
  describe("scripts/git-hooks/pre-commit", () => {
    const hookedRepo = () => {
      const repo = newRepo();
      git(repo, "config", "core.hooksPath", hooksDir);
      return repo;
    };

    it("lets a clean commit through", () => {
      const repo = hookedRepo();
      writeInto(repo, ".env.example", readFileSync(join(repoRoot, ".env.example"), "utf8"));
      git(repo, "add", ".env.example");
      expect(run("git", ["commit", "-q", "-m", "clean"], { cwd: repo }).status).toBe(0);
    });

    it("blocks a commit that stages a secret", () => {
      const repo = hookedRepo();
      commitFile(repo, "README.md", "clean\n", "clean");
      writeInto(repo, ".env", `${leakLine}\n`);
      git(repo, "add", ".env");
      const result = run("git", ["commit", "-q", "-m", "leak"], { cwd: repo });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("commit blocked");
      expect(result.stdout + result.stderr).not.toContain(FAKE_PASSWORD);
      expect(git(repo, "rev-list", "--count", "HEAD")).toBe("1");
    });

    it("is committed executable, because git skips a non-executable hook with only a hint", () => {
      const files = [
        "scripts/git-hooks/pre-commit",
        "scripts/gitleaks.sh",
        "scripts/install-git-hooks.sh",
        "scripts/secret-scan.sh",
      ];
      const staged = git(repoRoot, "ls-files", "--stage", ...files)
        .split("\n")
        .map((line) => {
          const [mode, , , path] = line.split(/\s+/);
          return `${mode} ${path}`;
        });
      expect(staged).toEqual(files.map((file) => `100755 ${file}`));
    });
  });

  describe("scripts/install-git-hooks.sh", () => {
    it("points core.hooksPath at scripts/git-hooks", () => {
      const repo = newRepo();
      expect(run("sh", [installHooks], { cwd: repo }).status).toBe(0);
      expect(git(repo, "config", "core.hooksPath")).toBe("scripts/git-hooks");
    });

    it("does nothing outside a git work tree", () => {
      const dir = scratch();
      const result = run("sh", [installHooks], {
        cwd: dir,
        env: { ...testEnv, GIT_CEILING_DIRECTORIES: dirname(dir) },
      });
      expect(result.status).toBe(0);
    });
  });
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run tests/unit/secret-guard.test.ts`
Expected: 14 PASS, 5 FAIL — `prepare` is `undefined`; "blocks a commit that stages a
secret" sees the commit succeed (`expected +0 not to be +0`); the mode test lists only the
two Task 1–2 scripts; both installer tests get exit 127 (`sh` cannot open the file). "Lets
a clean commit through" passes already — it is the control, and a missing hook lets every
commit through.

- [ ] **Step 3: Write the hook and the installer**

`scripts/git-hooks/pre-commit`:

```sh
#!/bin/sh
# Blocks a commit whose staged changes contain a secret (T-02a, NFR-S5). Installed by
# `npm install` / `npm ci` through the `prepare` script (scripts/install-git-hooks.sh).
# This is fast feedback, not the gate: `git commit --no-verify` skips it, and the CI
# `secret scan` job reads the full history on every push either way.
if ! "$(dirname "$0")/../secret-scan.sh" staged; then
  echo "" >&2
  echo "pre-commit: commit blocked. Either gitleaks reported a finding above, or it could" >&2
  echo "not run (see the message above). Remove the secret from the staged changes; if the" >&2
  echo "value is a real credential, rotate it as well. CI scans every commit regardless." >&2
  exit 1
fi
```

`scripts/install-git-hooks.sh`:

```sh
#!/bin/sh
# Points git at the versioned hooks in scripts/git-hooks (T-02a). Run by `npm install` and
# `npm ci` through the `prepare` script; safe to re-run. Outside a git work tree (a build
# image without .git) there is nothing to configure, so it does nothing.
set -eu
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git config core.hooksPath scripts/git-hooks
fi
```

Then:

```bash
chmod +x scripts/git-hooks/pre-commit scripts/install-git-hooks.sh
git add scripts/git-hooks/pre-commit scripts/install-git-hooks.sh
```

The mode test reads git's index, so the files must be staged before the next run.

- [ ] **Step 4: Add `prepare`**

In `package.json` → `scripts`, after `"start"`:

```json
    "prepare": "sh scripts/install-git-hooks.sh",
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/secret-guard.test.ts`
Expected: PASS, 19 tests. The file must now equal Appendix A.

- [ ] **Step 6: Install the hook here**

Run: `npm run prepare && git config core.hooksPath`
Expected: `scripts/git-hooks`. The value is stored in the repository's shared
`.git/config`, so every worktree gets it; a checkout whose branch has no
`scripts/git-hooks/` (e.g. `main` before the merge) simply has no hook.

- [ ] **Step 7: Make each guarantee fail on purpose**

| Mutation | Test that must fail |
|----------|--------------------|
| `git update-index --chmod=-x scripts/git-hooks/pre-commit` | "is committed executable, because git skips a non-executable hook with only a hint" |
| delete the `prepare` line from `package.json` | "installs the hook on npm install and npm ci (prepare)" |

Undo (`git update-index --chmod=+x scripts/git-hooks/pre-commit`; restore the line);
expected: PASS, 19 tests.

- [ ] **Step 8: Lint, format, types; commit through the new hook**

```bash
npm run lint && npm run format:check && npm run typecheck && npm test
git add package.json tests/unit/secret-guard.test.ts
git ls-files --stage scripts/git-hooks/pre-commit scripts/install-git-hooks.sh
git commit -m "feat(secret-guard): pre-commit hook installed by npm prepare (T-02a)

scripts/git-hooks/pre-commit runs secret-scan.sh staged and blocks the commit on a
finding or when gitleaks cannot run. npm install and npm ci set core.hooksPath through
prepare, so no clone has to remember to enable it. git skips a hook without the
executable bit with only a hint, so a test checks the mode in git's index.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

Expected: both modes `100755`; the commit itself passes through the hook silently.

---

