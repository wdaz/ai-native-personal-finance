## Task 1: bootstrap, workflow token and concurrency

**Files:**
- Modify: `.github/workflows/ci.yml:1-12`

**Interfaces:**
- Produces: a workflow whose token is read-only and whose `main` runs never cancel each other.

- [ ] **Step 1: Branch and bootstrap.** From `origin/main` as it is when you start — PR-A does not
  have to be merged yet (Tasks 1–9 do not depend on it; Task 10 waits, see "Sequencing"):

```bash
git fetch origin && git switch -c task/T-13-ci-hardening origin/main
npm ci --ignore-scripts
npx prisma generate
docker compose up -d --wait
```
  Copy the environment: `.env.local` from `.env.example` with the CI values of `ci.yml` (raw hash
  needs each `$` escaped as `\$` in a `.env` file — see the comment in `ci.yml`). Record the
  baselines: `npm test` (875 + PR-A's), `npm run typecheck`, `npm run lint`.

- [ ] **Step 2: Baseline the workflow with actionlint.**
  `docker run --rm -v <worktree-path>:/repo:ro -w /repo rhysd/actionlint:latest -color`.
  **Prediction:** no output, exit 0 (measured 2026-09-24, F11).

- [ ] **Step 3: Edit `ci.yml`.** Replace the `concurrency` block and add `permissions` after `on:`:

```yaml
permissions:
  contents: read

concurrency:
  # A pull-request run is superseded by the next push to that PR. A push to `main` never
  # cancels another: its group is its own commit, so each merge keeps its verdict (backlog
  # T-13, PR #4 — a follow-up merge used to discard the previous commit's result).
  group: ci-${{ github.event_name == 'pull_request' && github.ref || github.sha }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

- [ ] **Step 4: Re-run actionlint and Prettier.** `npx prettier --check .github/workflows/ci.yml`.
  **Measured** (this edit together with Tasks 2, 3 and 10's): both clean. (Prettier owns YAML
  formatting in this repository.)

- [ ] **Step 5: Commit** — `ci: read-only workflow token; a push to main never cancels another main run`.
  *Not locally verifiable:* the concurrency behaviour and that no job needs more than
  `contents: read` (none comments on a PR or pushes). The first PR run and the first two merges to
  `main` are the evidence — Review Focus 6.

---

