### Task 1: Pinned gitleaks and the `postgres_connection_string` rule

**Files:**
- Create: `tests/fixtures/secret-scan/postgres-violations.txt.fixture`
- Create: `tests/fixtures/secret-scan/postgres-controls.txt.fixture`
- Create: `tests/fixtures/secret-scan/README.md`
- Create: `tests/unit/secret-guard.test.ts`
- Create: `scripts/gitleaks.sh`
- Create: `.gitleaks.toml`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `scripts/gitleaks.sh <gitleaks arguments…>` — `exec`s gitleaks 8.30.1 with the
    arguments unchanged, so its exit codes are gitleaks' own (0 clean, 1 findings). Exits
    **2** itself on an unsupported platform or a checksum mismatch. Environment:
    `GITLEAKS_CACHE_DIR` (default `node_modules/.cache/gitleaks`),
    `GITLEAKS_BASE_URL` (default the GitHub release URL for v8.30.1).
  - `.gitleaks.toml` — rule id `postgres_connection_string`; path allowlist for `.next/`
    and `docs/00-discovery/inputs/`.
  - In `tests/unit/secret-guard.test.ts`, the helpers Tasks 2–3 reuse: `repoRoot`,
    `testEnv: NodeJS.ProcessEnv`, `run(command, args, { cwd?, input?, env? })`
    (→ `SpawnSyncReturns<string>`), `FAKE_CREDENTIALS`, `materialise(text)`, `violations`,
    `controls`, `leakLine`, `scratch()` (→ a temp dir removed in `afterAll`),
    `writeInto(dir, file, content)`.

- [ ] **Step 1: Set up the worktree**

The branch `task/T-02a-secret-guard` already exists, on `origin` too, and holds this plan.
The planning session created it in the worktree `.claude/worktrees/T-02a-secret-guard`:
work there. (Once that worktree is removed, `git switch task/T-02a-secret-guard` in the
main checkout works; before that git refuses, because another worktree has the branch
checked out.)

```bash
git status -sb
npm ci
```

Expected: `## task/T-02a-secret-guard...origin/task/T-02a-secret-guard`, a clean tree, and
`npm ci` completing with `found 0 vulnerabilities`. There is no `prepare` script yet.

- [ ] **Step 2: Write the fixtures**

`tests/fixtures/secret-scan/postgres-violations.txt.fixture` (seven lines, trailing
newline):

```text
DATABASE_URL="postgresql://neondb_owner:{{PASSWORD}}@ep-cool-darkness-a1b2c3d4-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL=postgresql://neondb_owner:{{PASSWORD}}@ep-cool-darkness-a1b2c3d4.eu-central-1.aws.neon.tech/neondb
  DATABASE_URL: postgres://app:{{PASSWORD}}@db.example.com:5432/app
const url = 'postgresql://app:{{PASSWORD_URL_ENCODED}}@10.0.0.12/app';
const url = `POSTGRES://svc:{{PASSWORD}}@prod-db.internal:6543/app`;
postgresql://postgres:{{WEAK_PASSWORD}}@db.example.com/app
postgresql://app:{{PASSWORD}}@localhost.example.com/app
```

`tests/fixtures/secret-scan/postgres-controls.txt.fixture` (ten lines, trailing newline):

```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/personal_finance"
DATABASE_URL=postgresql://app:{{PASSWORD}}@localhost:5432/test
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/test
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB
DATABASE_URL=postgresql://user:password@db.example.com/app
DATABASE_URL=postgresql://user:${DB_PASSWORD}@db.example.com/app
DATABASE_URL=postgresql://user:<password>@db.example.com/app
DATABASE_URL=""
DATABASE_URL=postgresql://user@db.example.com/app
DATABASE_URL=postgresql://db.example.com:5432/app
```

`tests/fixtures/secret-scan/README.md`:

```markdown
# tests/fixtures/secret-scan

Connection strings used by `tests/unit/secret-guard.test.ts` to prove that the
`postgres_connection_string` rule in `.gitleaks.toml` still fires, and still stays silent
where it should (T-02a, NFR-S5, DoD v1.1). Gitleaks' default rules do not detect a
Postgres URI at all — measured on 2026-09-22 against gitleaks 8.30.1 with a Neon pooled URL
and a generic `postgres://` one — so without this rule, and without a test that makes it
fire, the secret scan would pass on the one secret this project is certain to hold.

## Why the fixtures contain `{{…}}` placeholders

A fixture that holds a detectable connection string would turn the CI `secret scan` job
red for as long as it exists, and exempting this folder by path would open a permanent
hole: anything that later landed here would be invisible to both the hook and CI. So the
password in each URI is a placeholder, and the rule's placeholder allowlist ignores
`{{…}}`. The test replaces the placeholders with fake credentials and scans the result
through `gitleaks stdin` with the shipped `.gitleaks.toml`:

| Placeholder                | Replaced with           | Why                                                     |
| -------------------------- | ----------------------- | ------------------------------------------------------- |
| `{{PASSWORD}}`             | `npg_T3stOnlyN0tReal`   | shaped like a Neon password                             |
| `{{PASSWORD_URL_ENCODED}}` | `T3st%40Only%21N0tReal` | special characters must be percent-encoded in a URI     |
| `{{WEAK_PASSWORD}}`        | `postgres`              | the rule has no entropy threshold; a weak one is caught |

The committed files are themselves a test case: scanned as stored, they report nothing.

## What is covered

`postgres-violations.txt.fixture` — every line must be reported:

| Line | Case                                                                                    |
| ---- | --------------------------------------------------------------------------------------- |
| 1    | Neon pooled URL in a `.env` file (the production `DATABASE_URL`, ADR-0007)              |
| 2    | Neon direct URL (what migrations use)                                                   |
| 3    | YAML, `postgres://` scheme, explicit port                                               |
| 4    | TypeScript string, percent-encoded password, IP host                                    |
| 5    | Template literal, upper-case scheme                                                     |
| 6    | A weak password on a remote host — the local exemption is by host, not by password      |
| 7    | Host `localhost.example.com` — the local exemption matches the whole host, not a prefix |

`postgres-controls.txt.fixture` — nothing may be reported:

| Line | Case                                                                   |
| ---- | ---------------------------------------------------------------------- |
| 1    | The `.env.example` default (`localhost`), exactly as committed in T-01 |
| 2    | A strong password on `localhost` — credentials for this machine only   |
| 3    | `127.0.0.1`                                                            |
| 4–7  | Documentation placeholders: `USER:PASSWORD`, `password`, `${…}`, `<…>` |
| 8    | An empty value                                                         |
| 9    | A user without a password                                              |
| 10   | No credentials; `host:port` must not be read as `user:password`        |

The two halves matter equally: a rule that reported nothing would pass every control, and
one that reported everything would pass every violation.

## Not covered by the rule

Key–value DSNs (`host=… password=…`), JDBC `?password=` parameters and bare `PGPASSWORD=`
lines are outside the URI form this project uses (Prisma reads `DATABASE_URL`). No scanner
covers generic high-entropy strings either; that is why T-16 rotates every secret that was
ever real before the repository goes public, rather than trusting a green scan.
```

- [ ] **Step 3: Write the failing test**

`tests/unit/secret-guard.test.ts` — the Task 1 stage of the file (Tasks 2 and 3 add to it;
the complete file is Appendix A):

```ts
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..");
const fixtureDir = join(repoRoot, "tests/fixtures/secret-scan");
const config = join(repoRoot, ".gitleaks.toml");
const gitleaks = join(repoRoot, "scripts/gitleaks.sh");

/**
 * T-02a — NFR-S5: "no secrets in the repo", verified by a secret scan in CI. Gitleaks'
 * default rules miss a Postgres connection string (measured 2026-09-22 against 8.30.1), and
 * a scanner that misses says nothing, so every guarantee below is asserted by making it
 * fail on purpose (DoD v1.1).
 *
 * The fixtures carry `{{…}}` placeholders, which the rule's placeholder allowlist ignores:
 * that is what lets them sit in the tree while the CI scan stays green. The test substitutes
 * fake credentials and scans the result, so the shipped .gitleaks.toml is what is under
 * test and no detectable string is ever committed. See tests/fixtures/secret-scan/README.md.
 */
const FAKE_CREDENTIALS = {
  "{{PASSWORD}}": "npg_T3stOnlyN0tReal",
  "{{PASSWORD_URL_ENCODED}}": "T3st%40Only%21N0tReal",
  "{{WEAK_PASSWORD}}": "postgres",
} as const;

const materialise = (text: string) =>
  Object.entries(FAKE_CREDENTIALS).reduce(
    (out, [placeholder, value]) => out.replaceAll(placeholder, value),
    text,
  );

const readFixture = (name: string) => readFileSync(join(fixtureDir, name), "utf8");

const violations = readFixture("postgres-violations.txt.fixture");
const controls = readFixture("postgres-controls.txt.fixture");
/** One real-looking leak: the Neon pooled URL on the first line of the violations fixture. */
const leakLine = materialise(violations.split("\n")[0] ?? "");

type Finding = { RuleID: string; StartLine: number; File: string };

// Deterministic git: none of the developer's config (signing, hooksPath, templates), and a
// fixed identity so commits work on a CI runner that has none.
const testEnv: NodeJS.ProcessEnv = {
  ...process.env,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_AUTHOR_NAME: "Secret Guard Test",
  GIT_AUTHOR_EMAIL: "secret-guard@example.com",
  GIT_COMMITTER_NAME: "Secret Guard Test",
  GIT_COMMITTER_EMAIL: "secret-guard@example.com",
};

const run = (
  command: string,
  args: string[],
  options: { cwd?: string; input?: string; env?: NodeJS.ProcessEnv } = {},
) => spawnSync(command, args, { encoding: "utf8", env: testEnv, ...options });

/** gitleaks exits 1 with findings and 0 without; any other status is the tool failing. */
const parseReport = (result: SpawnSyncReturns<string>): Finding[] => {
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(`gitleaks exited ${result.status}:\n${result.stderr}`);
  }
  return JSON.parse(result.stdout) as Finding[];
};

const report = ["--config", config, "--no-banner", "--report-format", "json", "--report-path", "-"];
const scanText = (text: string) =>
  parseReport(run(gitleaks, ["stdin", ...report], { input: text }));
const scanDir = (dir: string) => parseReport(run(gitleaks, ["dir", ...report, dir]));

const scratchDirs: string[] = [];
const scratch = () => {
  const dir = mkdtempSync(join(tmpdir(), "secret-guard-"));
  scratchDirs.push(dir);
  return dir;
};

const writeInto = (dir: string, file: string, content: string) => {
  mkdirSync(dirname(join(dir, file)), { recursive: true });
  writeFileSync(join(dir, file), content);
};

beforeAll(() => {
  // The first run downloads the pinned binary (scripts/gitleaks.sh); later runs hit the cache.
  const result = run(gitleaks, ["version"]);
  if (result.status !== 0) throw new Error(`scripts/gitleaks.sh failed:\n${result.stderr}`);
}, 120_000);

afterAll(() => {
  for (const dir of scratchDirs) rmSync(dir, { recursive: true, force: true });
});

describe("T-02a secret guard", () => {
  describe("scripts/gitleaks.sh", () => {
    it("runs the pinned gitleaks release", () => {
      expect(run(gitleaks, ["version"]).stdout.trim()).toBe("8.30.1");
    });

    it("refuses a download whose SHA-256 is not the pinned one, and keeps nothing", () => {
      const mirror = scratch();
      const cache = scratch();
      for (const platform of ["darwin_arm64", "darwin_x64", "linux_x64", "linux_arm64"]) {
        writeFileSync(join(mirror, `gitleaks_8.30.1_${platform}.tar.gz`), "not a tarball");
      }
      const result = run(gitleaks, ["version"], {
        env: { ...testEnv, GITLEAKS_CACHE_DIR: cache, GITLEAKS_BASE_URL: `file://${mirror}` },
      });
      expect(result.status).toBe(2);
      expect(result.stderr).toContain("checksum mismatch");
      expect(existsSync(join(cache, "8.30.1", "gitleaks"))).toBe(false);
    });
  });

  describe(".gitleaks.toml", () => {
    it("reports every line of the violations fixture as postgres_connection_string", () => {
      const lines = violations.trimEnd().split("\n").length;
      const findings = scanText(materialise(violations));
      // A percent-encoded password is reported a second time once decoded (gitleaks tags
      // it `decoded:percent`), so the reported lines are compared as a set.
      expect(new Set(findings.map((f) => f.StartLine))).toEqual(
        new Set(Array.from({ length: lines }, (_, i) => i + 1)),
      );
      expect(new Set(findings.map((f) => f.RuleID))).toEqual(
        new Set(["postgres_connection_string"]),
      );
    });

    it("reports nothing on the controls fixture", () => {
      expect(scanText(materialise(controls))).toEqual([]);
    });

    it("reports nothing on the fixtures as committed, which is why they can live in the tree", () => {
      expect(scanText(violations)).toEqual([]);
      expect(scanText(controls)).toEqual([]);
    });

    it("still applies gitleaks' default rules ([extend] useDefault)", () => {
      const sample = ["ghp", "_", "Zx9Qw2Er4Ty6Ui8Op0As1Df3Gh5Jk7Lz9Xc2"].join("");
      expect(scanText(`token = "${sample}"\n`).map((f) => f.RuleID)).toEqual(["github-pat"]);
    });

    it("ignores .next/ and docs/00-discovery/inputs/, and nothing else", () => {
      const dir = scratch();
      for (const file of [
        ".next/server/app.js",
        "docs/00-discovery/inputs/notes.md",
        "src/server/db.ts",
      ]) {
        writeInto(dir, file, `${leakLine}\n`);
      }
      expect(scanDir(dir).map((f) => relative(dir, f.File))).toEqual(["src/server/db.ts"]);
    });
  });
});
```

- [ ] **Step 4: Run it to make sure it fails**

Run: `npx vitest run tests/unit/secret-guard.test.ts`
Expected: FAIL — `Error: scripts/gitleaks.sh failed:` from `beforeAll` (the script does
not exist); Vitest reports the file as failed and the 7 tests as skipped.

- [ ] **Step 5: Write `scripts/gitleaks.sh`**

```sh
#!/bin/sh
# Runs the pinned gitleaks release (T-02a, NFR-S5). The binary is downloaded on first use
# into node_modules/.cache/gitleaks/<version>/ and its SHA-256 is checked against the value
# pinned below before it is ever executed. One version everywhere: the pre-commit hook, the
# CI `secret scan` job and tests/unit/secret-guard.test.ts all run through this file.
#
# To upgrade: change VERSION and the four SHA256 values together, copying them from
# gitleaks_<version>_checksums.txt on https://github.com/gitleaks/gitleaks/releases.
#
# GITLEAKS_CACHE_DIR and GITLEAKS_BASE_URL override the cache and the download location
# (a mirror; the checksum test points the latter at a local file).
set -eu

VERSION=8.30.1

case "$(uname -s)-$(uname -m)" in
  Darwin-arm64) PLATFORM=darwin_arm64 SHA256=b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5 ;;
  Darwin-x86_64) PLATFORM=darwin_x64 SHA256=dfe101a4db2255fc85120ac7f3d25e4342c3c20cf749f2c20a18081af1952709 ;;
  Linux-x86_64) PLATFORM=linux_x64 SHA256=551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb ;;
  Linux-aarch64 | Linux-arm64) PLATFORM=linux_arm64 SHA256=e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080 ;;
  *)
    echo "gitleaks.sh: no pinned gitleaks $VERSION build for $(uname -s)-$(uname -m)" >&2
    exit 2
    ;;
esac

root="$(cd "$(dirname "$0")/.." && pwd)"
cache="${GITLEAKS_CACHE_DIR:-$root/node_modules/.cache/gitleaks}/$VERSION"
bin="$cache/gitleaks"

if [ ! -x "$bin" ]; then
  base_url="${GITLEAKS_BASE_URL:-https://github.com/gitleaks/gitleaks/releases/download/v$VERSION}"
  tarball="gitleaks_${VERSION}_${PLATFORM}.tar.gz"
  mkdir -p "$cache"
  # Download next to the final location so the closing `mv` is a rename on one filesystem:
  # a concurrent run sees either no binary or a whole one.
  work="$(mktemp -d "$cache/.download.XXXXXX")"
  trap 'rm -rf "$work"' EXIT
  echo "gitleaks.sh: downloading gitleaks $VERSION ($PLATFORM)" >&2
  curl -fsSL --retry 3 -o "$work/$tarball" "$base_url/$tarball"
  if command -v sha256sum >/dev/null 2>&1; then
    actual="$(sha256sum "$work/$tarball" | cut -d ' ' -f 1)"
  else
    actual="$(shasum -a 256 "$work/$tarball" | cut -d ' ' -f 1)"
  fi
  if [ "$actual" != "$SHA256" ]; then
    echo "gitleaks.sh: checksum mismatch for $tarball (expected $SHA256, got $actual)" >&2
    exit 2
  fi
  tar -xzf "$work/$tarball" -C "$work" gitleaks
  chmod +x "$work/gitleaks"
  mv "$work/gitleaks" "$bin"
  rm -rf "$work"
  trap - EXIT
fi

exec "$bin" "$@"
```

Then: `chmod +x scripts/gitleaks.sh`

- [ ] **Step 6: Run the tests — the wrapper passes, the config does not exist yet**

Run: `npx vitest run tests/unit/secret-guard.test.ts`
Expected: the first run prints `gitleaks.sh: downloading gitleaks 8.30.1 (…)`. The two
`scripts/gitleaks.sh` tests PASS; the five `.gitleaks.toml` tests FAIL with
`SyntaxError: Unexpected end of JSON input` (gitleaks cannot open the missing config and
writes no report).

- [ ] **Step 7: Write `.gitleaks.toml`**

```toml
# Secret scanning for this repository (T-02a, NFR-S5). Read by scripts/secret-scan.sh —
# the pre-commit hook, the CI `secret scan` job and `npm run secrets:scan` — and by
# tests/unit/secret-guard.test.ts, which makes every entry below fire, or stay silent, on
# purpose. Written for gitleaks 8.30.1 (scripts/gitleaks.sh): `[[rules.allowlists]]` needs
# 8.21 or later and `[[allowlists]]` 8.25 or later.
title = "ai-native-personal-finance secret scan"

# Every default rule stays on; this file only adds to them.
[extend]
useDefault = true

# The default rules do not detect a Postgres connection string (measured 2026-09-22 with a
# Neon pooled URL and a generic one), and DATABASE_URL is the one secret this project is
# certain to hold (ADR-0005, ADR-0007). The id keeps the backlog's spelling.
[[rules]]
id = "postgres_connection_string"
description = "PostgreSQL connection URI with an embedded password"
# scheme, user, password, host: the password is the secret (group 1); the match ends at the
# host, which the first allowlist reads. No entropy threshold: a weak password on a remote
# host is still a leak.
regex = '''(?i)\bpostgres(?:ql)?://[^:@/\s'"`]+:([^@/\s'"`]+)@([^/:?\s'"`]+)'''
secretGroup = 1
keywords = ["postgres://", "postgresql://"]

  # A database on this machine: the .env.example default and the CI service container.
  # `$` makes it the whole host, not a prefix, so `localhost.example.com` is still reported.
  [[rules.allowlists]]
  description = "A database on this machine: its credentials are not secrets"
  regexTarget = "match"
  regexes = ['''@(?:localhost|127\.0\.0\.1)$''']

  # The whole password is a placeholder. Anchored on purpose: stopwords match substrings
  # and would exempt a real password that merely contains one. `{{…}}` is also what
  # tests/fixtures/secret-scan uses, which is how those fixtures can be committed.
  [[rules.allowlists]]
  description = "Documentation and fixture placeholders, never real passwords"
  regexes = ['''^(?:password|PASSWORD|<[^>]*>|\$\{[^}]*\}|\{\{[^}]*\}\})$''']

# Backlog T-02a: build output and third-party challenge inputs. `.next/` is git-ignored, so
# this entry matters for `gitleaks dir` scans of a working copy and for a forced `git add`.
[[allowlists]]
description = "Build output and third-party challenge inputs (backlog T-02a)"
paths = ['''(?:^|/)\.next/''', '''(?:^|/)docs/00-discovery/inputs/''']
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/secret-guard.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 9: Make each guarantee fail on purpose (DoD v1.1)**

Apply each mutation alone, run `npx vitest run tests/unit/secret-guard.test.ts`, confirm
the named test goes red, then undo it with `git checkout -- <file>` (after Step 11) or by
reverting the edit:

| Mutation | Test that must fail |
|----------|--------------------|
| `.gitleaks.toml`: `useDefault = true` → `useDefault = false` | "still applies gitleaks' default rules" |
| `.gitleaks.toml`: `@(?:localhost\|127\.0\.0\.1)$` → `@NEVER$` | "reports nothing on the controls fixture" (and, once Tasks 2–3 exist, the tests that commit `.env.example`) |
| `.gitleaks.toml`: the global `paths = [...]` → `paths = ['''^NEVER/''']` | "ignores .next/ and docs/00-discovery/inputs/, and nothing else" |
| `scripts/gitleaks.sh`: `if [ "$actual" != "$SHA256" ]; then` → `if false; then` | "refuses a download whose SHA-256 is not the pinned one" |

Expected after undoing all four: PASS, 7 tests.

- [ ] **Step 10: Lint, format, types, and the staged content itself**

```bash
npm run lint && npm run format:check && npm run typecheck && npm test
git add .gitleaks.toml scripts/gitleaks.sh tests/fixtures/secret-scan tests/unit/secret-guard.test.ts
scripts/gitleaks.sh git --pre-commit --staged --config .gitleaks.toml --no-banner .
git ls-files --stage scripts/gitleaks.sh
```

Expected: all green; the staged scan prints `no leaks found`; the mode is `100755`.

- [ ] **Step 11: Commit**

```bash
git commit -m "feat(secret-guard): pinned gitleaks and the postgres_connection_string rule (T-02a)

Gitleaks' default rules do not detect a Postgres connection string. .gitleaks.toml
extends them with postgres_connection_string, exempting local hosts and documentation
placeholders, and allowlists .next/ and docs/00-discovery/inputs/ as the backlog states.
scripts/gitleaks.sh runs one pinned release, SHA-256-checked, for the hook, CI and tests.
The fixtures carry {{…}} placeholders, filled with fake credentials inside the test.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

