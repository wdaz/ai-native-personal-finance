## Task 10: Firefox and WebKit in CI (needs PR-A merged)

**Files:**
- Modify: `.github/workflows/ci.yml` (the `e2e` job), `tests/e2e/README.md`

**Interfaces:**
- Produces: legs named `E2E (Chromium, polyfill)`, `E2E (Chromium, off)`, `E2E (Firefox, polyfill)`,
  `E2E (WebKit, polyfill)` (Q3 = A).

- [ ] **Step 1: Local proof first.** With PR-A's header in your branch (it merged), run the whole
  polyfill suite on the two new engines: `npx playwright test --project=firefox --project=webkit`.
  **Prediction:** **0 failed**, 8 skipped per engine (the off-mode file), **108 passed per engine**
  (the baseline per engine was 92 pass + 8 fail + 8 skip = 108 tests; PR-A turns the 8 failures
  into passes, and Task 6 adds 8 axe-route tests, measured green on all three engines already). Anything red here is a real finding: fix the locator or the code, never skip. If the
  polyfill run is green, also run `WEBMCP_MODE=off npx playwright test --project=firefox` once
  (stop any server first — Playwright reuses one): **prediction** it passes; it is only a
  measurement for Q3-B, not a CI leg under A.

- [ ] **Step 2: Restructure the job.** Replace the `e2e` job's header, `strategy`, browser install
  and test steps (everything else — services, env, migrate, report upload — stays):

```yaml
  e2e:
    name: E2E (${{ matrix.label }}, ${{ matrix['webmcp-mode'] }})
    runs-on: ubuntu-latest
    strategy:
      # One leg failing must not hide another's verdict.
      fail-fast: false
      matrix:
        # SPEC-webmcp-tools §7 / NFR-W2: the app is built once per leg — WEBMCP_MODE is inlined at
        # build time (next.config.ts), so `off` cannot be a runtime switch. ADR-0003: E2E runs on
        # Chromium, Firefox and WebKit. `off` is built once, on Chromium: it differs from `polyfill`
        # only in the WebMCP client code, which the engine does not change (T-13 plan Q3-A).
        # The two Chromium names are T-16's required checks; keep them.
        include:
          - { label: Chromium, browser: chromium, webmcp-mode: polyfill }
          - { label: Chromium, browser: chromium, webmcp-mode: "off" }
          - { label: Firefox, browser: firefox, webmcp-mode: polyfill }
          - { label: WebKit, browser: webkit, webmcp-mode: polyfill }
```
  and the steps:

```yaml
      - name: Install ${{ matrix.label }}
        run: npx playwright install --with-deps ${{ matrix.browser }}
      …
      - name: E2E tests, ${{ matrix.label }}, WEBMCP_MODE=${{ matrix['webmcp-mode'] }} (builds and starts the app with APP_ENV=test)
        run: npx playwright test --project=${{ matrix.browser }}

      - name: Upload the Playwright report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-e2e-${{ matrix.browser }}-${{ matrix['webmcp-mode'] }}
          path: playwright-report/
          retention-days: 7
```
  (drop the "Chromium only until T-13" comment.) Keep the bracket notation for the hyphenated key
  (`ed45111`). `grep -rn "playwright-report-e2e-" .` — update any doc that names the old artifact.

- [ ] **Step 3: Validate.** actionlint via Docker (F11) and `npx prettier --check .github/workflows/ci.yml`.
  **Measured in the planning session, with every workflow edit of Tasks 1, 2, 3 and 10 applied
  together:** Prettier clean, actionlint exit 0, no output. Note the quoted `"off"` in
  `matrix.include`: YAML reads a bare `off` as a boolean.

- [ ] **Step 4: Document F3.** In `tests/e2e/README.md` replace "CI runs Chromium (T-06); Firefox and
  WebKit join in T-13" with the four-leg description, and add: "A failing WebKit test also reports
  `style-src-elem inline` from the CSP guard: that is Playwright's failure screenshot injecting a
  `<style>` (measured 2026-09-24: it disappears with `screenshot: "off"`); read the *first* error."

- [ ] **Step 5: Commit, push, open the PR, read the checks** (this step is the **controller's**, not
  an implementer subagent's — a push is a shared-branch side effect). Expected: 4 E2E legs, plus
  `lint · typecheck · unit` (now with coverage and traceability), `API tests (Postgres)`,
  `secret scan`, `npm audit`. **Report what the run says, not what this plan predicted.** A red
  Firefox/WebKit leg that is green locally: fetch `playwright-report-e2e-<browser>-polyfill`, fix
  the cause; do not add a retry (ADR-0003: max 1).

---

