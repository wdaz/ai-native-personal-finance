# T-02a shared context for implementers and reviewers

Extracted from `docs/04-process/plans/2026-09-22-T-02a.md` (plan v0.3). Do not read the
whole plan; this file plus your task brief is your context.

## Global Constraints

Copied verbatim from the approved documents. Every task below inherits them.

- **Backlog T-02a:** "**Secret guard** — the first real `DATABASE_URL` lands in T-02, so
  the guard exists before it: `.gitleaks.toml` extending the default rules with the
  `postgres_connection_string` case they miss, `.next/` and `docs/00-discovery/inputs/`
  allowlisted; pre-commit hook; CI `secret scan` job (`fetch-depth: 0`, fails on exit
  code; SARIF upload needs GitHub Code Security and is unavailable while the repo is
  private); `npm audit --audit-level=high` in CI; a fixture that proves the scan fires
  (DoD v1.1)". Spec / ADR: NFR-S5, ADR-0007. Depends on: T-01.
- **NFR-S5:** "No secrets in the repo; `.env.example` documents configuration; every
  secret that was ever real is rotated before the repository goes public" — verified by
  "Secret scan in CI (T-02a) + full-history scan and rotation checklist (T-16) + review".
- **DoD v1.1:** "Any new lint rule, config guard or document-mirror test ships with a
  fixture that deliberately violates it and a test asserting the violation is reported — a
  rule is not verified until it has failed on purpose (T-01 lesson)."
- **DoD:** "`npm run test:all` green locally and in the CI jobs that exist at that point of
  the backlog"; "nothing outside the task is changed (drive-by fixes go to a new task)".
- **ADR-0002:** `scripts/` is "repo tooling (seed-figures, traceability); imports
  shared/domain only".
- **Backlog notes:** "T-02a precedes T-02"; "Every PR follows `definition-of-done.md`; the
  owner merges."
- **AGENTS.md §2:** code, comments, documents and commits in English; conventional commit
  messages; small, reviewable changes.
- **Branch:** `task/T-02a-secret-guard` (build-workflow §3). Agents never merge.
- **Owner decisions at the plan gate (2026-09-22)** widen the scope by exactly two items:
  the CI push trigger becomes `main` only (question 3), and the backlog is amended to v1.4
  for T-13 and T-16 (questions 1 and 3). See "Owner answers" below.
- **Out of scope:** T-02 (Prisma, Docker compose, any real `DATABASE_URL`); the rest of
  T-13 (the `concurrency` split, the install-script policy, any further trigger change);
  T-16 (rotation, the public flip, GitHub secret scanning / push protection, CodeQL,
  Dependabot, the `main` ruleset).

---

## Decisions taken in this plan (owner may overturn)

Implementation choices inside an approved spec (governance.md: "Implementation details
within an approved spec — agent decides, documents in PR"). Each is listed so the owner
can reject it before any code exists.

| # | Decision | Why | Alternative rejected |
|---|----------|-----|----------------------|
| D1 | One pinned gitleaks binary, fetched by `scripts/gitleaks.sh` and checked against a SHA-256 per platform (darwin arm64/x64, linux x64/arm64) | The hook, CI and the tests run the same version against the same config; config syntax is version-dependent (`[[rules.allowlists]]` from 8.21, `[[allowlists]]` from 8.25) | **gitleaks-action v3** (E15): runs only in CI, pins its own version, non-MIT licence, PR comments and SARIF artifact on by default. **Homebrew** on the laptop: version drift against CI. **pre-commit framework**: a Python toolchain for one hook. **Docker image**: Docker on every commit |
| D2 | The binary is cached in `node_modules/.cache/gitleaks/<version>/` | Already ignored by git, ESLint and Prettier; `npm ci` wipes it, costing one ~3 s download | `.tools/`: three new ignore entries |
| D3 | Rule id is `postgres_connection_string`, with underscores | The backlog's spelling, kept so the id greps from the task row to the config; gitleaks' own ids are kebab-case | `postgres-connection-string` |
| D4 | The rule matches a `postgres://` / `postgresql://` URI (case-insensitive) that carries a password; no entropy threshold; exempt when the host is `localhost` or `127.0.0.1`, or the whole password is a placeholder (`password`, `PASSWORD`, `<…>`, `${…}`, `{{…}}`) | A weak password on a remote host is still a leak, so the exemption is by host, never by strength; the placeholders are what docs write | An entropy threshold (misses `hunter2`); stopwords (they match *substrings*, so a real `Passw0rd…` would be exempt); exempting Docker service hosts such as `db` — not needed today (`.env.example` and the CI service container use `localhost`), and T-02 can add one with a control if its compose file needs it |
| D5 | Fixtures hold `{{…}}` placeholders and are filled with fake credentials inside the test | Nothing detectable is ever committed and no path is exempted for tests; the committed fixtures double as a control for the placeholder allowlist | Committing real-looking URIs and path-allowlisting `tests/fixtures/secret-scan/` (a permanent hole in both gates) |
| D6 | The history scan is `gitleaks git --log-opts="--all -m"` | E3–E5: the default skips merge commits; `--first-parent` skips a branch's add-then-remove; `--all` restates the default that `--log-opts` drops (E8) | Default invocation; `--first-parent -m` |
| D7 | `scripts/secret-scan.sh` refuses a shallow clone (exit 2, names `fetch-depth: 0`) | E7: a shallow checkout passes silently; the script guards itself wherever it runs, without parsing `ci.yml` | A test that reads `ci.yml`; asserting "commits scanned = `rev-list --count`" (E6: false after any delete-only commit) |
| D8 | The hook lives in `scripts/git-hooks/pre-commit` | ADR-0002 gives `scripts/` to repo tooling; nothing new at the top level | `.githooks/` (a top-level folder ADR-0002's tree does not list, so it would need a clarification); husky (a dependency for one `git config` line) |
| D9 | `npm install` / `npm ci` install the hook through `prepare` → `scripts/install-git-hooks.sh` (E13), which does nothing outside a git work tree | A guard that each clone must remember to enable is silent on the first clone that forgets. Caveat: `core.hooksPath` is written to the repository's shared `.git/config`, so it applies to every worktree and overrides a global `core.hooksPath` for this repository | An opt-in `npm run hooks:install` |
| D10 | The hook fails closed: if gitleaks cannot run (offline on first use), the commit is blocked with a message that names `git commit --no-verify` | The T-01 lesson — "the only symptom was silence" — applied to the one place it would recur. The hook is fast feedback; CI is the gate | Warn and let the commit through |
| D11 | CI gets two jobs: `secret scan` (checkout with `fetch-depth: 0`, `persist-credentials: false`, then the script — no Node, no `npm ci`) and `npm audit` (setup-node, then `npm audit --audit-level=high`; it reads `package-lock.json`, so no `npm ci`). **`npm audit` reports and does not block** (owner, question 4): a high or critical advisory writes a warning annotation on the run and the job stays green | Separate check names, independent verdicts, no install time spent; an advisory published overnight must not turn an unrelated pull request red | Both as steps of the existing `verify` job; a blocking audit (the agent's first proposal, declined by the owner) |
| D12 | `npm run secrets:scan` becomes the first step of `test:all`; `npm audit` does not | ADR-0003: `test:all` is what CI runs. The audit's verdict depends on the registry's advisory feed at that moment, not on the code. Consequence: after each `npm ci` (which wipes the cache, D2) the first `test:all` downloads gitleaks (~3 s), so `test:all` needs the network once per install and, offline, now stops at its first step | Leaving the scan out of `test:all` |
| D13 | Every scan runs with `--redact`, and a test asserts the fake password never appears in the output | CI logs are readable by anyone once the repository is public (T-16); a log line must never be the leak | Unredacted output |
| D14 | No SARIF and no report artifact; findings are in the job log (redacted) | The backlog: SARIF upload is unavailable while the repository is private | Uploading SARIF as a plain artifact |
| D15 | Tests are in `tests/unit/secret-guard.test.ts` and never skip; the wrapper installs gitleaks itself, so a missing binary means a download, and a failed download means a red test | `tests/unit/boundaries.test.ts` is the precedent for tooling tests in `tests/unit`; a test that skips when the tool is absent proves nothing where it matters | Skipping when gitleaks is not on `PATH` |

## Owner answers at the plan gate (2026-09-22)

The owner's reply, verbatim: "1. bəli 2. anlamadım nə istədiyini 3. bildiyim qədəri ilə
main ilə əvəz olmalıdır. 4. yox 5. bəli — Hələ icraya başlama. Bunlara əsasən dəyişikliyi
et. Gözlə." (1 yes; 2 I did not understand what you want; 3 as far as I know it should be
replaced with `main`; 4 no; 5 yes — do not start implementing yet; change the plan
accordingly; wait.) Question 2 was then re-asked in plain terms; the owner asked "Scan
hazırda heç nəyi blocklamır?" ("does the scan block nothing right now?"), the agent
measured it (E20: nothing would be blocked), and the owner answered "İstisna qalsın"
("keep the exemption").

| # | Question | Answer | What changed in this plan |
|---|----------|--------|---------------------------|
| 1 | Add a line to T-16 so it inherits no merge blind spot? | **Yes** | Task 5 amends the backlog to v1.4: T-16's "full-history secret scan as a blocking gate" names the T-02a `secret scan` check (required in the `main` ruleset) and `npm run secrets:scan` |
| 2 | Keep the `docs/00-discovery/inputs/` path allowlist? | **Keep it** (after a plain-terms re-ask and E20) | Nothing: the plan already follows the approved backlog wording — `.next/` and `docs/00-discovery/inputs/` are exempt. The agent had recommended scanning the folder; recorded as a disagreement resolved for the owner |
| 3 | `ci.yml` pushes on `[main, master]` under a stale comment | **Replace with `main`** | Task 4 Step 1 sets `branches: [main]` and rewrites the comment (E19: the default branch is `main`, no `master` exists); Task 5's backlog v1.4 notes it on T-13, which keeps the rest of its CI work. The agent read "should be replaced" as "replace it in this PR" |
| 4 | Should `npm audit` block? | **No** | D11: the job reports high and critical advisories as a warning annotation and stays green |
| 5 | Save the session prompt in Task 5? | **Yes** | Task 5 Step 1 records both of the owner's replies verbatim |

---

## File structure

| Path | Responsibility |
|------|----------------|
| `.gitleaks.toml` | Default rules + `postgres_connection_string` + the two path allowlists |
| `scripts/gitleaks.sh` | Downloads, verifies and runs the pinned gitleaks |
| `scripts/secret-scan.sh` | The `history` and `staged` invocations, with the shallow-clone guard |
| `scripts/git-hooks/pre-commit` | Runs `secret-scan.sh staged`; blocks the commit on a finding or a failure |
| `scripts/install-git-hooks.sh` | `git config core.hooksPath scripts/git-hooks` inside a work tree |
| `scripts/README.md` | Modified: a "Secret guard" section listing the four files |
| `tests/fixtures/secret-scan/postgres-violations.txt.fixture` | Seven URIs that must be reported, passwords as placeholders |
| `tests/fixtures/secret-scan/postgres-controls.txt.fixture` | Ten lines that must not be reported |
| `tests/fixtures/secret-scan/README.md` | Why placeholders, the two coverage tables, what the rule does not cover |
| `tests/unit/secret-guard.test.ts` | 19 tests over the wrapper, the config, the history scan, `package.json`, the hook and the installer |
| `package.json` | Modified: `prepare`, `secrets:scan`, `test:all` |
| `.github/workflows/ci.yml` | Modified: push trigger `main` only; jobs `secret-scan` ("secret scan") and `audit` ("npm audit", reports without blocking) |
| `README.md` | Modified: "Run locally" — the hook, `npm run secrets:scan` |
| `docs/04-process/prompts/2026-09-22-T-02a-secret-guard.md` | The session prompt and the owner's plan-gate reply |
| `docs/03-specs/backlog.md` | Modified: v1.4 — T-13 and T-16 rows, status and changelog (owner, questions 1 and 3) |
| `docs/04-process/process-log.md` | Modified: one appended entry |

All four shell files are committed with mode `100755`; a test checks the index (E14).

---
