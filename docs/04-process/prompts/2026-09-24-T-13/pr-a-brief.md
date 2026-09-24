## Global Constraints

- Node `>=26` (`.nvmrc`, `package.json` `engines`); npm 11.19 or later — `allowScripts` and
  `strict-allow-scripts` need it.
- DoD v1.1: "Any new lint rule, config guard or document-mirror test ships with a fixture that
  deliberately violates it and a test asserting the violation is reported — a rule is not verified
  until it has failed on purpose."
- ADR-0003: E2E on "Chromium, Firefox, WebKit"; "max 1 retry in CI, 0 locally"; "role/label
  locators; `data-testid` only from `src/shared/test-ids.ts`; web-first assertions; no
  `waitForTimeout`"; NFR-T7 "no `.first()` to dodge ambiguity"; E2E "never `next dev`".
- ADR-0003: "≥ 90 % statements on `domain`". NFR-T1: "statement coverage of that layer ≥ 90 %".
- NFR-T2: "Grep `US-\d\d` over all test suites = 100 % of stories" (title-named tests).
- `npm audit --audit-level=high` must stay at **0** (owner decision 2026-09-22).
- Job names `E2E (Chromium, polyfill)` and `E2E (Chromium, off)` and `secret scan` are named in the
  T-16 row as required checks: keep them, or update T-16's row in the same PR.
- `governance.md` v1.2/v1.3: implementers never run `git stash`, `git reset --hard`,
  `git checkout <rev> -- .`, `git clean` or an argument-less `npm install`; **reported output is
  copied from the run, never from the brief**; **a plan's "Expected" line for a command nobody has
  run is a *prediction*** (marked so below) and is checked at execution; rules about how tests run
  live in the tool's config; code-review subagents use Opus 5.5.
- Code, comments, documents and commits are in English. Conventional commits, one concern each.
  Every commit ends with the two attribution lines of the session's system reminder.
- Never mark a document Approved/Accepted (owner only): ADR text this plan adds is written as
  *Proposed* until the owner merges it.
- **Worktree bootstrap (owner note, 2026-09-24 — a symlinked `node_modules` does not work):** in a
  fresh worktree run `npm ci --ignore-scripts` then `npx prisma generate`. Plain `npm ci` runs
  `prepare`, which writes shared git configuration.

## Review Focus

Failure modes the tasks' tests do not fully exercise, most likely first. Each has a line in the task
that owns the code.

1. **The first CI run on Firefox and WebKit is the first time anything but macOS has run them.**
   Fonts, timing and headless differences can fail a test that is green locally. A red leg is
   information, not a reason to skip a test or add a retry: fix the locator (ADR-0003). **First
   suspect if only the WebKit leg fails keyboard or focus tests:** `tabTo()` presses `Alt+Tab` on
   WebKit and TD-4's "focus drops to `<body>`" — both were measured on macOS WebKit only (T-06),
   never on Linux WebKit. (Task 10.)
2. **A contributor on macOS runs `npm ci` after `strict-allow-scripts=true` lands.** `fsevents`
   has an install script and is absent on Linux; without an `allowScripts` entry the owner's own
   machine cannot install. (Task 7 — measured, and the control test runs on both platforms.)
3. **A new Release 2 page ships with no axe scan.** Every existing axe test names a page; nothing
   notices a page missing. (Task 6.)
4. **A story id appears only in a comment, a skipped test or a typo** (`US-99`) and the traceability
   check still passes. (Task 3.)
5. **A coverage threshold whose glob matches no file is vacuous.** `"src/domain/**"` must be shown
   to fail on the real config, not only on the fixture. (Task 2, Step 6.)
6. **A push to `main` right after another discards the first commit's verdict** (PR #4). Cannot be
   tested offline; the first run after merge is the evidence. (Task 1.)
7. **A secret typed into a commit or tag message** is invisible to the history scan. (Task 8.)

---

## Findings outside the task — PR-A, proposed as a separate PR merged before Task 1

(`out-of-scope-findings-separate-prs`: owner's rule since T-02 — a defect found outside a task's
scope is fixed in its own small PR, merged before the task runs, with its own failing test.)

F1 and F2 are T-11/T-12 defects. T-13 cannot make Firefox and WebKit a green required check
without either fixing F1 or skipping the WebMCP specs on those engines, which would hide it. **PR-A
(`fix/origin-agent-cluster`, cut from `origin/main`, Tasks A1–A3 below) contains:** the header
`Origin-Agent-Cluster: ?1` in `middleware.ts`, an API test pinning it, the failure reporting the owner asked
for in Q2 (Task A2: indicator state, `data-webmcp-error`, `console.warn`), a proposed ADR-0006
amendment (5) and a SPEC-webmcp-tools v1.0.5 amendment. Its failing test is the API test plus the 16 red E2E runs above.

**Setup for PR-A:** `git fetch origin && git switch -c fix/origin-agent-cluster origin/main`, then
the worktree bootstrap from Global Constraints (`npm ci --ignore-scripts`, `npx prisma generate`),
Postgres up (`docker compose up -d --wait`) and a git-ignored `.env.local` (Task 1, Step 1).

### Task A1: pin the header (failing test first)

**Files:**
- Modify: `tests/api/middleware.spec.ts` (append one test)
- Modify: `middleware.ts:171-172` (one line)

**Interfaces:**
- Produces: every response the middleware sees carries `Origin-Agent-Cluster: ?1`.

`middleware.ts` is named by tech-debt TD-2 (the deprecated `middleware` → `proxy` convention): **read
TD-2 first.** The file stays `middleware.ts`; the header is one `set` call beside the existing
ones, so the rename, when it comes, moves nothing this task adds.

- [ ] **Step 1: Write the failing test.** Append to `tests/api/middleware.spec.ts`:

```ts
test("ADR-0006 (5): every response asks for its own agent cluster, so Firefox and Safari can run the WebMCP polyfill", async ({
  request,
}) => {
  for (const path of ["/login", "/signup", "/no-such-page", "/api/auth/session"]) {
    const response = await request.get(path);
    expect(response.headers()["origin-agent-cluster"], path).toBe("?1");
  }
  await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  const overview = await request.get("/overview");
  expect(overview.status()).toBe(200);
  expect(overview.headers()["origin-agent-cluster"], "/overview").toBe("?1");
});
```

- [ ] **Step 2: Run it and watch it fail.** Postgres up (`docker compose up -d --wait`), then
  `npx playwright test --project=api tests/api/middleware.spec.ts -g "agent cluster"`.
  **Prediction:** fails on `/login` with `Received: undefined`.

- [ ] **Step 3: Add the header.** In `middleware.ts`, after the `X-Content-Type-Options` line:

```ts
  // ADR-0006, amendment (5): a document served without this header reports
  // `originAgentCluster === false` in Firefox and WebKit, and @mcp-b/webmcp-polyfill@5.1.0
  // (validateOriginAgentCluster) then throws SecurityError from registerTool, getTools and
  // executeTool — no WebMCP tool works there. Chromium's default is already true.
  response.headers.set("Origin-Agent-Cluster", "?1");
```

- [ ] **Step 4: Run it and watch it pass.** Same command. **Prediction:** 1 passed.

- [ ] **Step 5: Prove the browsers.** With the app built and running against `APP_ENV=test`
  (Playwright starts it): `npx playwright test --project=firefox --project=webkit tests/e2e/webmcp.spec.ts`.
  **Prediction:** 16 passed (8 per engine) where the baseline failed 16. If the WebKit CSP line
  (F3) persists on a *passing* test, stop: it is then a real finding.

- [ ] **Step 6: Commit** — `fix(security): send Origin-Agent-Cluster so the WebMCP polyfill runs in Firefox and WebKit`.

### Task A2: a failed registration is reported to whoever is looking (Q2 — owner decision)

**Owner decision (2026-09-24, on Q2):** "when registration fails there must be feedback; even if
`ready` is written, a proper warning must come out; a connected model must understand that WebMCP
is not reachable." `data-webmcp="ready"` therefore **stays** (SPEC §2.2 is unchanged); three more
channels say what `ready` does not. *Assumption to confirm at the gate:* "a connected model" is
read as an agent that drives or reads the page (through the DOM, the accessibility tree or the
console). An agent that talks to the page **only** through the WebMCP API cannot be told anything
by this app: with the polyfill, `getTools()`/`executeTool()` throw the polyfill's own
`SecurityError` (or list nothing) — that channel belongs to the runtime. Verified by a probe:
forcing `originAgentCluster = false` in Chromium (an init script) reproduces the Firefox failure
exactly — `data-webmcp="ready"`, indicator `Agent tools: polyfill · 0`, `getTools()` throws
`SecurityError`, **zero** console warnings — so the same forcing is the failing fixture below.

| Channel | Who reads it | What it says when registration fails |
|---------|--------------|---------------------------------------|
| Indicator (`role="status"`, `aria-live="polite"`, accessible name) | a user; an agent reading the accessibility tree or DOM | `Agent tools: unavailable` — the existing state; title "WebMCP is disabled or could not load" — **when every tool of the page was rejected** (with some accepted it keeps counting them: `polyfill · N`) |
| `<html data-webmcp-error="get_balance: SecurityError; …">` | a DOM-reading agent, tests | which tool, and the reason; present whenever **any** registration is rejected; removed on `unregisterAll()` and at the next `register()` |
| `console.warn` | a developer, a browser agent reading the console | `[webmcp] could not register tool "get_balance"` plus the reason object — one line per rejected tool |

No new copy: the indicator reuses `COPY.agentToolsUnavailable` and its existing title. The state
is spec text, so this is a **SPEC-webmcp-tools amendment (v1.0.5, Task A3)**: §2.7's `unavailable`
row ("off, or import failed") gains "or every tool registration of the page was rejected", and §2.2
gains the `data-webmcp-error` attribute.

**Files:**
- Modify: `src/webmcp/adapter.ts` (the state variable, `status()`, `mode()`, `register()`,
  `unregisterAll()`)
- Modify: `tests/unit/webmcp/adapter.test.ts` (the `afterEach` that deletes `data-webmcp` also
  deletes `webmcpError`; one new `describe`)
- Modify: `tests/e2e/webmcp.spec.ts` (append one test; the file's `beforeEach` already skips other
  modes, resets and logs in)
- Modify: `tests/unit/webmcp/AgentToolsStatus.test.tsx` — **no change**: `{ mode: "unavailable" }`
  is already a case there (text and title).

- [ ] **Step 1: Failing unit tests.** In `adapter.test.ts`, delete `webmcpError` wherever the file
  deletes `webmcp` (line 64), and add:

```ts
describe("a rejected registration is reported, not swallowed (T-13 plan Q2)", () => {
  const securityError = () => new DOMException("", "SecurityError");

  it("every tool rejected: warns per tool, stays ready, names the failure on <html>, reports unavailable", async () => {
    const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "polyfill" });
    const { context } = await polyfillReady();
    context.registerTool.mockImplementation(async () => {
      throw securityError();
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const statuses: Array<{ mode: string | null; count: number }> = [];
    adapter.onStatus((status) => statuses.push(status));

    await adapter.register([fakeTool("a"), fakeTool("b")]);

    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0]?.[0]).toContain('"a"');
    expect(warn.mock.calls[0]?.[1]).toBeInstanceOf(DOMException);
    expect(document.documentElement.dataset.webmcp).toBe("ready");
    expect(document.documentElement.dataset.webmcpError).toBe("a: SecurityError; b: SecurityError");
    expect(adapter.mode()).toBe("unavailable");
    expect(statuses[statuses.length - 1]).toEqual({ mode: "unavailable", count: 0 });
    warn.mockRestore();
  });

  it("only some rejected: the mode and the count stay honest, the error names only the broken tool", async () => {
    const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "polyfill" });
    const { context } = await polyfillReady();
    context.registerTool.mockImplementationOnce(async () => {
      throw new Error("duplicate name");
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await adapter.register([fakeTool("broken"), fakeTool("ok")]);

    expect(adapter.mode()).toBe("polyfill");
    expect(adapter.registeredTools()).toEqual(["ok"]);
    expect(document.documentElement.dataset.webmcpError).toBe("broken: Error: duplicate name");
    warn.mockRestore();
  });

  it("clears the error and the unavailable state on unregisterAll, and a healthy register sets neither", async () => {
    const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "polyfill" });
    const { context } = await polyfillReady();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    context.registerTool.mockImplementationOnce(async () => {
      throw securityError();
    });
    await adapter.register([fakeTool("a")]);
    expect(adapter.mode()).toBe("unavailable");

    adapter.unregisterAll();
    expect(adapter.mode()).toBe("polyfill");
    expect(document.documentElement.dataset.webmcpError).toBeUndefined();

    await adapter.register([fakeTool("a")]); // the mock's default resolves
    expect(document.documentElement.dataset.webmcpError).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("a page without tools is not a failure", async () => {
    const adapter = await freshAdapter({ NEXT_PUBLIC_WEBMCP_MODE: "polyfill" });
    await polyfillReady();
    await adapter.register([]);
    expect(adapter.mode()).toBe("polyfill");
    expect(document.documentElement.dataset.webmcpError).toBeUndefined();
  });
});
```
  Run `npx vitest run tests/unit/webmcp/adapter.test.ts -t "reported, not swallowed"`.
  **Prediction:** the first three fail (no warning, no attribute, mode stays `polyfill`); the fourth
  passes. (Not run before the implementation; the four *with* it are measured in Step 3.)

- [ ] **Step 2: Implement in `adapter.ts`.** Add beside the other module state:

```ts
let registrationFailed = false;

/** `SecurityError` for `new DOMException("", "SecurityError")`, `Error: duplicate name` for an Error. */
function describeReason(reason: unknown): string {
  return reason instanceof Error
    ? [reason.name, reason.message].filter(Boolean).join(": ")
    : String(reason);
}

function clearFailure() {
  registrationFailed = false;
  delete document.documentElement.dataset.webmcpError;
}
```
  `status()` and `mode()` report `registrationFailed ? "unavailable" : resolvedMode`. In
  `register`: call `clearFailure();` right after the new `AbortController` is stored, and replace
  the block after `Promise.allSettled` (from the `aborted` check to the `ready` line) with:

```ts
  if (controller.signal.aborted) return; // a superseded generation: its rejections are on purpose, stay silent

  const rejected = outcomes.flatMap((outcome, index) =>
    outcome.status === "rejected"
      ? [{ name: tools[index]?.name ?? "?", reason: outcome.reason as unknown }]
      : [],
  );
  for (const { name, reason } of rejected) {
    console.warn(`[webmcp] could not register tool "${name}"`, reason);
  }
  registeredNames = tools
    .filter((_, index) => outcomes[index]?.status === "fulfilled")
    .map((tool) => tool.name);
  if (rejected.length > 0) {
    document.documentElement.dataset.webmcpError = rejected
      .map(({ name, reason }) => `${name}: ${describeReason(reason)}`)
      .join("; ");
  }
  registrationFailed = tools.length > 0 && registeredNames.length === 0;
  document.documentElement.dataset.webmcp = "ready";
```
  and in `unregisterAll` add `clearFailure();` before `notify()`. `AgentToolsStatus` needs no change.

- [ ] **Step 3: Run** the whole adapter file, then `npm test`. **Measured in the planning session**
  (the code above applied to `838e0f5`, then reverted): `tests/unit/webmcp` 85 passed in 8 files,
  `tsc`, `eslint --max-warnings 0` and Prettier clean. `npm test` in full: prediction, 875 + 4.

- [ ] **Step 4: The E2E test — a failing fixture that works in every engine.** Append to
  `tests/e2e/webmcp.spec.ts` (after the existing tests; `COPY`, `expectToolsReady` and the
  `beforeEach` are already there):

```ts
test("US-38 US-41: when the runtime refuses every registration the page says so — indicator 'unavailable', data-webmcp-error, a console warning", async ({
  page,
}) => {
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  // The polyfill refuses to work in a document that is not origin-keyed (its
  // validateOriginAgentCluster) — what Firefox and WebKit did before ADR-0006 (5). Forcing it
  // here makes the failure reproducible on every engine, whatever the server sends.
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "originAgentCluster", { value: false, configurable: true });
  });
  await page.goto("/overview");
  await expectToolsReady(page); // "ready" is still written — the other channels are what say more

  await expect(page.getByRole("status", { name: COPY.agentToolsUnavailable })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute(
    "data-webmcp-error",
    /get_balance: SecurityError/,
  );
  expect(warnings.join("\n")).toContain('could not register tool "get_balance"');
});
```
  Run it on the three engines before the adapter change (`--project=chromium --project=firefox
  --project=webkit -g "refuses every registration"`). **Measured:** on Chromium, against the
  original adapter, it fails at `getByRole('status', { name: 'Agent tools: unavailable' })`
  ("element(s) not found" — the indicator says `polyfill · 0`); with Step 2 applied it passes on
  **all three engines (3 passed, 9.3 s)**, so the `defineProperty` override works on Firefox and
  WebKit too. (Not run before the change on Firefox/WebKit.)

- [ ] **Step 5: Commit** — `fix(webmcp): report a failed tool registration — indicator, data-webmcp-error, console warning`.

### Task A3: the ADR and spec text

**Files:**
- Modify: `docs/02-architecture/adr/0006-auth-and-session.md` (new amendment line after the
  "Amendment 2026-09-24 (4)" block; the `Headers:` bullet in the Decision)
- Modify: `docs/03-specs/webmcp-tools.md` (§2.2 one bullet; version bump)
- Modify: `docs/04-process/process-log.md` (an entry)

- [ ] **Step 1:** ADR-0006 — add, **worded as Proposed, never Accepted**:
  `- Amendment 2026-09-24 (5) — **Proposed by the agent, awaiting the owner's acceptance** (T-13 plan
  finding F1): the response headers gain \`Origin-Agent-Cluster: ?1\`. Firefox and WebKit report
  \`originAgentCluster === false\` for a document served without it, and \`@mcp-b/webmcp-polyfill@5.1.0\`
  refuses to run there (\`validateOriginAgentCluster\` throws \`SecurityError\` from \`registerTool\`,
  \`getTools\` and \`executeTool\`), so US-38, US-39 and US-41 fail in both browsers; Chromium's default
  is already true. Consequence: the document's origin gets its own agent cluster and can no longer
  share a process with same-site documents through \`document.domain\` — nothing in this app does.`
  and extend the `Headers:` bullet with `, \`Origin-Agent-Cluster: ?1\``.
- [ ] **Step 2:** SPEC-webmcp-tools — §2.2, after the `off` bullet: "The polyfill throws
  `SecurityError` unless `originAgentCluster` is true; the app sends `Origin-Agent-Cluster: ?1`
  (ADR-0006 (5))." Also §2.2, after the `ready` bullet: "When any `registerTool` call is rejected
  the adapter `console.warn`s once per tool and sets `document.documentElement.dataset.webmcpError`
  to `<tool>: <reason>` pairs joined by `; ` (removed by `unregisterAll` and at the next `register`);
  `data-webmcp` is still `ready`." And §2.7's `unavailable` row: "off, import failed, **or every tool
  registration of the page was rejected**". Add a `v1.0.5 (2026-09-24, T-13 plan finding F1)` entry to the changelog run in
  the header and bump the version in the status line, as v1.0.3/v1.0.4 did.
- [ ] **Step 3:** process-log entry (template): what was found (F1, F2, F3), that T-12 merged with
  Firefox/WebKit red — **Lessons: `npm run test:all` runs three engines; a task whose PR lists
  "Chromium only" for E2E did not meet the DoD line "test:all green locally", and reviewers
  should ask for the Firefox/WebKit result**.
- [ ] **Step 4:** `npm run format:check` (docs are prettier-ignored; the TS files are not), `npm run
  typecheck`, `npm run lint`, `npm test`. Commit `docs(adr): propose ADR-0006 amendment (5), Origin-Agent-Cluster`,
  push, open a **draft** PR "fix(security): Origin-Agent-Cluster for Firefox and WebKit"; its
  description quotes the DoD checklist and F1's table. **The owner merges it.**

---

