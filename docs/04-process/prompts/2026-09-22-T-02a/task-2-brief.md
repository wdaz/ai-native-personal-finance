### Task 2: The history scan — `scripts/secret-scan.sh` and `npm run secrets:scan`

**Files:**
- Create: `scripts/secret-scan.sh`
- Modify: `tests/unit/secret-guard.test.ts`
- Modify: `package.json` (`scripts`)

**Interfaces:**
- Consumes: `scripts/gitleaks.sh`, `.gitleaks.toml`, and the test helpers of Task 1.
- Produces:
  - `scripts/secret-scan.sh history` — scans every commit of the repository in the
    **current directory** with this repository's `.gitleaks.toml`. Exit 0 clean, 1
    finding, 2 shallow clone.
  - `scripts/secret-scan.sh staged` — scans the staged changes (used by Task 3's hook).
    Exit 0 clean, 1 finding.
  - `npm run secrets:scan` → `scripts/secret-scan.sh history`; `test:all` starts with it.
  - In the test file: `FAKE_PASSWORD`, `git(cwd, ...args)` (→ trimmed stdout, throws on
    failure), `newRepo()` (→ path of a fresh repo on `main`),
    `commitFile(repo, file, content, message)`; a `describe("package.json")` block that
    Task 3 adds a test to.

- [ ] **Step 1: Add the failing tests**

In `tests/unit/secret-guard.test.ts`, make five insertions.

(a) After `const gitleaks = join(repoRoot, "scripts/gitleaks.sh");`:

```ts
const secretScan = join(repoRoot, "scripts/secret-scan.sh");
```

(b) After the `FAKE_CREDENTIALS` object (the line `} as const;`):

```ts
const FAKE_PASSWORD = FAKE_CREDENTIALS["{{PASSWORD}}"];
```

(c) After the `run` helper, the `git` helper:

```ts
const git = (cwd: string, ...args: string[]) => {
  const result = run("git", args, { cwd });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed:\n${result.stderr}`);
  return result.stdout.trim();
};
```

(d) After the `writeInto` helper:

```ts
const newRepo = () => {
  const repo = scratch();
  git(repo, "init", "-q", "-b", "main");
  return repo;
};

const commitFile = (repo: string, file: string, content: string, message: string) => {
  writeInto(repo, file, content);
  git(repo, "add", file);
  git(repo, "commit", "-q", "-m", message);
};
```

(e) Inside `describe("T-02a secret guard", …)`, after the `describe(".gitleaks.toml", …)`
block:

```ts
  describe("scripts/secret-scan.sh history (the CI job and npm run secrets:scan)", () => {
    const scanHistory = (repo: string) => run(secretScan, ["history"], { cwd: repo });

    it("finds a secret that was committed and later deleted, and never prints it", () => {
      const repo = newRepo();
      commitFile(repo, ".env", `${leakLine}\n`, "add");
      git(repo, "rm", "-q", ".env");
      git(repo, "commit", "-q", "-m", "remove");
      const result = scanHistory(repo);
      expect(result.status).toBe(1);
      expect(result.stdout).toContain("postgres_connection_string");
      expect(result.stdout + result.stderr).not.toContain(FAKE_PASSWORD);
    });

    it("finds a secret typed only while resolving a merge conflict (-m)", () => {
      const repo = newRepo();
      commitFile(repo, "config.txt", "a\nb\nc\n", "base");
      git(repo, "switch", "-q", "-c", "feature");
      commitFile(repo, "config.txt", "a\nfeature\nc\n", "feature");
      git(repo, "switch", "-q", "main");
      commitFile(repo, "config.txt", "a\nmain\nc\n", "main");
      expect(run("git", ["merge", "-q", "feature"], { cwd: repo }).status).not.toBe(0);
      commitFile(repo, "config.txt", `a\n${leakLine}\nc\n`, "merge feature");
      expect(scanHistory(repo).status).toBe(1);
    });

    it("finds a secret added and removed inside a merged branch (no --first-parent)", () => {
      const repo = newRepo();
      commitFile(repo, "README.md", "base\n", "base");
      git(repo, "switch", "-q", "-c", "feature");
      commitFile(repo, ".env", `${leakLine}\n`, "add");
      git(repo, "rm", "-q", ".env");
      git(repo, "commit", "-q", "-m", "remove");
      git(repo, "switch", "-q", "main");
      git(repo, "merge", "-q", "--no-ff", "--no-edit", "feature");
      git(repo, "branch", "-q", "-D", "feature");
      expect(scanHistory(repo).status).toBe(1);
    });

    it("passes a history whose only connection string is the .env.example default", () => {
      const repo = newRepo();
      commitFile(repo, ".env.example", readFileSync(join(repoRoot, ".env.example"), "utf8"), "env");
      expect(scanHistory(repo).status).toBe(0);
    });

    it("refuses a shallow clone instead of passing on one commit", () => {
      const origin = newRepo();
      commitFile(origin, "a.txt", "a\n", "one");
      commitFile(origin, "b.txt", "b\n", "two");
      const clone = scratch();
      git(clone, "clone", "-q", "--depth", "1", `file://${origin}`, ".");
      const result = scanHistory(clone);
      expect(result.status).toBe(2);
      expect(result.stderr).toContain("fetch-depth: 0");
    });
  });

  describe("package.json", () => {
    const { scripts } = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };

    it("runs the history scan first in test:all, the command CI mirrors", () => {
      expect(scripts["secrets:scan"]).toBe("scripts/secret-scan.sh history");
      expect(scripts["test:all"]?.startsWith("npm run secrets:scan && ")).toBe(true);
    });
  });
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run tests/unit/secret-guard.test.ts`
Expected: 7 PASS, 6 FAIL — the five history tests with `expected null to be …`
(`scripts/secret-scan.sh` does not exist, so `status` is `null`), and "runs the history
scan first in test:all" with `expected undefined to be 'scripts/secret-scan.sh history'`.

- [ ] **Step 3: Write `scripts/secret-scan.sh`**

```sh
#!/bin/sh
# The two secret scans of T-02a (NFR-S5), with the flags in one place.
#
#   secret-scan.sh history   every commit of the repository in the current directory:
#                            the CI `secret scan` job and `npm run secrets:scan`
#   secret-scan.sh staged    the staged changes only: the pre-commit hook
#
# The repository scanned is the working directory's; the config is always this
# repository's .gitleaks.toml. Output is redacted: CI logs are public once the repository
# is (T-16), and a log line must never be the leak.
set -eu

here="$(cd "$(dirname "$0")" && pwd)"
config="$(dirname "$here")/.gitleaks.toml"

case "${1:-}" in
  history)
    # A shallow clone has only the tip, so the scan below would pass on one commit and
    # say nothing. Stop instead: the CI checkout needs `fetch-depth: 0`.
    if [ "$(git rev-parse --is-shallow-repository)" = "true" ]; then
      echo "secret-scan: this is a shallow clone; the history scan needs every commit (actions/checkout fetch-depth: 0)" >&2
      exit 2
    fi
    # Passing --log-opts replaces gitleaks' own `git log` options (`--full-history --all
    # --diff-filter=tuxdb`), so `--all` is restated; the other two only narrow the scan.
    # `-m` adds the merge commits, which `git log -p` otherwise prints without a diff: a
    # secret typed while resolving a conflict exists only there. Not `--first-parent`: it
    # skips a secret added and removed inside a merged branch, which was still pushed.
    exec "$here/gitleaks.sh" git --config "$config" --log-opts="--all -m" \
      --redact --no-banner --verbose .
    ;;
  staged)
    # `--log-level warn` keeps a clean commit silent; a finding is still printed (--verbose).
    exec "$here/gitleaks.sh" git --pre-commit --staged --config "$config" \
      --log-level warn --redact --no-banner --verbose .
    ;;
  *)
    echo "usage: secret-scan.sh history|staged" >&2
    exit 2
    ;;
esac
```

Then: `chmod +x scripts/secret-scan.sh`

- [ ] **Step 4: Add the npm scripts**

In `package.json` → `scripts`, add after `"test:e2e:ui"`:

```json
    "secrets:scan": "scripts/secret-scan.sh history",
```

and change `test:all` to start with the scan:

```json
    "test:all": "npm run secrets:scan && npm run lint && npm run format:check && npm run typecheck && npm test && npm run test:api && npm run test:e2e"
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/secret-guard.test.ts`
Expected: PASS, 13 tests.

- [ ] **Step 6: Scan this repository**

Run: `npm run secrets:scan; echo "rev-list: $(git rev-list --all --count)"`
Expected: `no leaks found`, exit 0. Today "N commits scanned" should equal the
`rev-list` figure; if it does not, `git log --all --diff-filter=D --format=%h` lists the
delete-only commits that explain the gap (E6) — informational, not a failure.

- [ ] **Step 7: Make each guarantee fail on purpose**

| Mutation in `scripts/secret-scan.sh` | Test that must fail |
|---------------------------------------|--------------------|
| `--log-opts="--all -m"` → `--log-opts="--all"` | "finds a secret typed only while resolving a merge conflict (-m)" |
| `--log-opts="--all -m"` → `--log-opts="--first-parent -m"` | "finds a secret added and removed inside a merged branch" |
| `= "true" ]` (shallow check) → `= "never" ]` | "refuses a shallow clone instead of passing on one commit" |
| remove `--redact` from the `history` line | "finds a secret that was committed and later deleted, and never prints it" |

Undo each; expected afterwards: PASS, 13 tests.

- [ ] **Step 8: Lint, format, types; commit**

```bash
npm run lint && npm run format:check && npm run typecheck && npm test
git add scripts/secret-scan.sh package.json tests/unit/secret-guard.test.ts
git ls-files --stage scripts/secret-scan.sh
git commit -m "feat(secret-guard): full-history scan with merge commits (T-02a)

scripts/secret-scan.sh history runs gitleaks over every ref with -m: the default
git log prints merge commits without a diff, so a secret typed while resolving a
conflict was never scanned (43 of 49 commits here). --first-parent is not used because
it skips a secret added and removed inside a merged branch. A shallow clone stops the
scan instead of passing on one commit. Output is redacted. npm run secrets:scan runs it
and test:all starts with it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

Expected: mode `100755` for `scripts/secret-scan.sh`.

---

