# Task 10 report: Firefox and WebKit in CI

Commit: ccc71d0 `ci(e2e): run the E2E suite on Firefox and WebKit as well as Chromium` (branch task/T-13-ci-hardening).

## What was done
- `.github/workflows/ci.yml`: `e2e` job restructured to the brief's `matrix.include` with four legs; names
  `E2E (Chromium, polyfill)`, `E2E (Chromium, off)`, `E2E (Firefox, polyfill)`, `E2E (WebKit, polyfill)`;
  install step, test step and artifact name (`playwright-report-e2e-<browser>-<mode>`) use `matrix.browser`.
  `"off"` stays quoted. `WEBMCP_MODE` env and everything else untouched. The "Chromium only until T-13" comment is gone.
- `grep playwright-report-e2e`: only historic plans (T-06, T-12) name the old artifact; left as is (history).
- `tests/e2e/README.md`: the "Firefox and WebKit join in T-13" line replaced by the four-leg description; the
  WebKit `style-src-elem inline` note added; the WebMCP paragraph's "CI runs the whole Chromium suite once per mode"
  extended with Firefox and WebKit in polyfill mode.

## Step 1 (real numbers, HEAD with PR-A merged, polyfill build)
`npx playwright test --project=firefox --project=webkit`: 234 tests, 218 passed, 16 skipped, 0 failed (1.8 min).
That is 117 tests per engine: 109 passed + 8 skipped per engine (the 16 skips are the 8 off-mode tests of
`webmcp-off.spec.ts` x 2; the line reporter prints only the total, so the per-engine split is arithmetic, not read
off separately). The brief's "108 per engine" was stale.
Optional Q3-B measurement: `WEBMCP_MODE=off npx playwright test --project=firefox`: 117 tests, 106 passed, 11 skipped, 0 failed.
All measured on macOS, so WebKit's `tabTo()` Alt+Tab path and TD-4's focus assertions ran on macOS WebKit only;
the Linux WebKit in CI is untested until the PR runs.

## Validation
- actionlint via Docker (`rhysd/actionlint:latest`, script in the job tmp dir): output empty, `exit=0`.
- `npx prettier --check .github/workflows/ci.yml tests/e2e/README.md` and `npm run format:check`: clean.
- `npm run typecheck`, `npm run lint`: clean. `npm test`: 77 files, 958 tests passed. `npm run traceability`: all 18 stories named.

## Deviations
None from the brief. Extra: the README's WebMCP paragraph was also updated (it would have been stale otherwise).

## Concerns
- `docs/03-specs/tech-debt.md:87` (TD-4 "What") still says "CI runs Chromium only until T-13"; it is a historical
  description of the finding, but Task 11 may want to check it reads correctly once the legs exist.
- Step 5 (push, PR, read the real CI) belongs to the controller; the Linux WebKit/Firefox verdicts are still unmeasured.
