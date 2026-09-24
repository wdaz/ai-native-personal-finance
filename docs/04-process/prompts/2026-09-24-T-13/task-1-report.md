# T-13 Task 1 report — workflow token and concurrency

Status: DONE_WITH_CONCERNS (concerns are only the not-locally-verifiable items below).
Commit: `b716787` on `task/T-13-ci-hardening` — `ci: read-only workflow token; a push to main never cancels another main run`.

## What changed

`.github/workflows/ci.yml` only (+8 / -2): added top-level `permissions: contents: read`; replaced the
`concurrency` block with the brief's verbatim text (group `ci-${{ github.event_name == 'pull_request' && github.ref || github.sha }}`,
`cancel-in-progress: ${{ github.event_name == 'pull_request' }}`). Job names untouched
(`E2E (Chromium, ...)`, `secret scan` unchanged).

## Bootstrap

`npx prisma generate` run once (Prisma Client 7.10.0). No docker compose, Playwright or server was started.

## Baselines (before the edit, real output)

- `npm test`: 71 files, 875 tests passed.
- `npm run typecheck`: clean (no output after the tsc line).
- `npm run lint`: clean (`eslint . --max-warnings 0`, no output).
- actionlint (`docker run ... rhysd/actionlint:latest -color`): no output. The harness does not print the exit code; no output is what actionlint produces on exit 0.

## After the edit (real output)

- actionlint: no output (clean).
- `npx prettier --check .github/workflows/ci.yml`: `All matched files use Prettier code style!`

## Job-by-job permission check

Only one workflow file exists (`.github/workflows/ci.yml`). Grepped it for
`github.token`, `GITHUB_TOKEN`, `secrets.`, `gh `, `permissions`, `pull-requests`, cache actions, pushes, comments:
no `github.token`/`GITHUB_TOKEN`/`secrets.` reference, no `gh` CLI, no PR comment, no push, no per-job `permissions:` override.

- `verify` (lint, typecheck, unit): `actions/checkout@v5`, `actions/setup-node@v5` with `cache: npm`, npm scripts. Checkout needs `contents: read`. setup-node's npm cache uses the Actions runtime cache token, not `GITHUB_TOKEN` permissions. OK with `contents: read`.
- `api` (API tests, Postgres service): checkout, setup-node with cache, prisma migrate, `npm run test:api`. Postgres is a service container pulled from Docker Hub, unauthenticated. OK.
- `e2e` (matrix): checkout, setup-node, `playwright install --with-deps chromium` (public download), Playwright tests, `actions/upload-artifact@v4` on failure (uses the runtime artifact token; needs no `GITHUB_TOKEN` permission). OK.
- `secret-scan`: checkout `fetch-depth: 0`, `scripts/secret-scan.sh history`. `scripts/gitleaks.sh` downloads the pinned gitleaks release with an unauthenticated `curl` from github.com releases (SHA-256 checked); neither script references a token, `gh` or the API. No SARIF upload (stated in the workflow comment). OK.
- `audit`: checkout, setup-node, `npm audit` against the npm registry, `::warning::` annotation (a log command, not an API call). OK.

Conclusion: no job needs more than `contents: read`. Note: `verify` checks out without `persist-credentials: false` (the other jobs set it); the persisted token is now read-only, so this is harmless and was left as is (out of Task 1's scope).

## Not locally verifiable

- The concurrency behaviour (PR runs cancelled by the next push, `main` runs each keep their verdict) and the assumption that no job needs write access can only be evidenced by the first PR run and the first two merges to `main` (Review Focus 6).
- DoD "new config guard ships with a failing fixture": this task's guards are workflow YAML edits that cannot be executed offline, so no failing fixture exists; the plan states the first PR run is the evidence.

## Concerns

None beyond the above.
