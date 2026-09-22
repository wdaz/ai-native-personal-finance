### Task 4: CI jobs and the run instructions

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md` ("Run locally")
- Modify: `scripts/README.md`

**Interfaces:**
- Consumes: `scripts/secret-scan.sh history`; `package-lock.json`; `.nvmrc`.
- Produces: pull-request checks named **`secret scan`** and **`npm audit`**, next to the
  existing `lint · typecheck · unit`; pushes to `main` only trigger CI.

- [ ] **Step 1: Point the push trigger at `main` and add the two jobs**

In `.github/workflows/ci.yml` (owner decision, question 3), replace

```yaml
  push:
    # ADR-0007 names `main` as the production branch; this repository's default branch is
    # currently `master`. Both are listed until the owner resolves which one it is.
    branches: [main, master]
```

with

```yaml
  push:
    # ADR-0007 names `main` as the production branch, and it is this repository's default
    # branch (owner decision 2026-09-22, T-02a plan gate).
    branches: [main]
```

Leave `pull_request:` and `concurrency` as they are (T-13). Then append under `jobs:`,
after the `verify` job:

```yaml
  secret-scan:
    name: secret scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          # Every commit, not only the tip. scripts/secret-scan.sh refuses a shallow clone
          # rather than pass on one commit (NFR-S5, T-02a).
          fetch-depth: 0
          persist-credentials: false

      # Gitleaks 8.30.1 through scripts/gitleaks.sh (SHA-256 pinned): every ref, merge
      # commits included, output redacted. A finding exits 1 and fails the job. No SARIF
      # upload: code scanning needs GitHub Code Security, unavailable while the repository
      # is private (backlog T-02a).
      - name: Gitleaks (full history)
        run: scripts/secret-scan.sh history

  audit:
    name: npm audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          persist-credentials: false

      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc

      # Reads package-lock.json against the registry's advisories and reports high and
      # critical ones without failing the job (owner decision 2026-09-22): the verdict can
      # change with no code change, when an advisory is published, and must not turn an
      # unrelated pull request red. A finding shows as a warning annotation on the run.
      - name: npm audit (high and critical, reported, not blocking)
        run: |
          if ! npm audit --audit-level=high; then
            echo "::warning title=npm audit::high or critical advisories found; see this step's log"
          fi
```

- [ ] **Step 2: Check the workflow file**

```bash
npx prettier --check .github/workflows/ci.yml
ruby -ryaml -e 'y = YAML.load_file(".github/workflows/ci.yml"); p y[true]; p y["jobs"].keys; p y["jobs"]["secret-scan"]["steps"][0]["with"]'
```

Expected: Prettier clean; `{"pull_request"=>nil, "push"=>{"branches"=>["main"]}}` (YAML 1.1
reads the key `on` as `true`), `["verify", "secret-scan", "audit"]` and
`{"fetch-depth"=>0, "persist-credentials"=>false}`.

- [ ] **Step 3: Update `README.md` → "Run locally"**

Replace

```text
npm run test:all       # lint, format, typecheck, unit, API and E2E
```

with

```text
npm run test:all       # secret scan, lint, format, typecheck, unit, API and E2E
```

After the paragraph that ends "…without it the browser tests stop at *Executable doesn't
exist*.", add:

```markdown
`npm ci` (and `npm install`) also points git at `scripts/git-hooks/`, whose pre-commit
hook runs gitleaks on the staged changes and blocks a commit that contains a secret
(T-02a). The first scan downloads the pinned gitleaks release into `node_modules/.cache/`
and checks its SHA-256, so it needs `curl` and a network connection once.
`git commit --no-verify` skips the hook; the CI `secret scan` job reads every commit
either way.
```

In the command table, add a row after `npm run typecheck`:

```markdown
| `npm run secrets:scan`        | Gitleaks over every commit, merges included — first in `test:all` |
```

- [ ] **Step 4: Update `scripts/README.md`**

Append:

```markdown
## Secret guard (T-02a, NFR-S5)

POSIX shell, no imports. `tests/unit/secret-guard.test.ts` proves each part fails on
purpose.

| File                   | Role                                                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gitleaks.sh`          | Runs the pinned gitleaks release; downloads it on first use into `node_modules/.cache/gitleaks/<version>/` and checks its SHA-256 before running it |
| `secret-scan.sh`       | The two scans with their flags: `history` (every commit, merges included — CI and `npm run secrets:scan`) and `staged` (the pre-commit hook)        |
| `git-hooks/pre-commit` | Blocks a commit whose staged changes contain a secret; `git commit --no-verify` skips it, CI does not                                               |
| `install-git-hooks.sh` | Sets `core.hooksPath` to `scripts/git-hooks`; run by `npm install` and `npm ci` through `prepare`                                                   |
```

Run: `npx prettier --check scripts/README.md` — expected clean (`README.md` at the root is
in `.prettierignore`).

- [ ] **Step 5: The whole suite**

Run: `npm run test:all`
Expected: green end to end — `no leaks found`, lint, format, typecheck, the T-01 unit
tests plus these 19, `test:api` with no tests, E2E on three engines. If `npm ci` ran since
the last scan, the first line is `gitleaks.sh: downloading gitleaks 8.30.1 (…)` — a few
seconds, and the network is needed (D12). If Playwright
browsers are missing: `npx playwright install --with-deps chromium firefox webkit`.

- [ ] **Step 6: Commit, push, open the pull request as a draft**

```bash
git add .github/workflows/ci.yml README.md scripts/README.md
git commit -m "ci(secret-guard): secret scan and npm audit jobs; push trigger main only (T-02a)

secret scan checks out the full history (fetch-depth: 0) and runs
scripts/secret-scan.sh history; a finding exits 1 and fails the job. No SARIF upload:
it needs GitHub Code Security, unavailable while the repository is private. npm audit
reports high and critical advisories as a warning without failing the job, and the push
trigger drops the stale master entry (owner decisions at the plan gate). README and
scripts/README describe the hook and npm run secrets:scan.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
git push -u origin task/T-02a-secret-guard
gh pr create --draft --base main --title "T-02a: secret guard — gitleaks rule, pre-commit hook, CI secret scan, npm audit" --body "Draft — the Definition of Done checklist is added in Task 5."
gh pr checks --watch
```

Expected: three checks green — `lint · typecheck · unit`, `secret scan`, `npm audit`. In
the `secret scan` log: `N commits scanned` and `no leaks found`. `npm audit` is green even
when it finds something; the finding then appears as an `npm audit` warning annotation on
the run (today: `found 0 vulnerabilities`, E16).

This run is the first execution of the wrapper's `linux_x64` branch. Planning ran only
`darwin_arm64`, on a tree without `node_modules` (the wrapper creates
`node_modules/.cache/gitleaks/` itself); the `linux_x64` SHA-256 was recomputed from the
downloaded tarball and matches the published checksum (E1), and `curl`, `tar` and
`sha256sum` ship with `ubuntu-latest`. If `secret scan` or the `verify` job's unit run fails
there, the log shows `gitleaks.sh: downloading gitleaks 8.30.1 (linux_x64)` followed by
either `curl`'s or `tar`'s own error, or `gitleaks.sh: checksum mismatch …`. Fix it on this
branch; do not weaken the check.

---

