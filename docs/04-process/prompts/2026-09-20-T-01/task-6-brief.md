## Task 6: `.env.example`

**Files:**

- Create: `.env.example`
- Modify: `tests/unit/scaffold.test.ts` (add the env-example check)

**Interfaces:**

- Consumes: ADR-0005, ADR-0006, ADR-0007, SPEC-webmcp-tools §2.1, SPEC-reset-and-test-support
  §2.3/§2.4, SPEC-app-shell §5.
- Produces: a documented variable list the deploy runbook (T-14) and the Vercel project
  copy from.

- [ ] **Step 1: Write `.env.example`**

```dotenv
# Copy to .env.local and fill in. Never commit .env or .env.local (.gitignore).
# Each variable names the document that defines it.

# --- Database (ADR-0005, ADR-0007) ---
# Neon pooled connection string in production; local Postgres in development (T-02 adds
# the Docker compose file).
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/personal_finance"

# --- Session and demo account (ADR-0006, ADR-0007) ---
# SESSION_SECRET must be at least 32 characters (SPEC-auth §5).
SESSION_SECRET=""
DEMO_EMAIL="demo@example.com"
# bcrypt hash of the demo password.
DEMO_PASSWORD_HASH=""
# The same password in plain text — the login page shows it (ADR-0006, NFR-S1).
DEMO_PASSWORD_DISPLAY=""

# --- Reset (ADR-0005, ADR-0007) ---
# Bearer secret for POST /api/admin/reset.
RESET_SECRET=""

# --- WebMCP (SPEC-webmcp-tools §2.1, ADR-0007) ---
# native | polyfill | off. Default polyfill. `native` means opportunistic native with
# polyfill fallback. next.config exposes this as NEXT_PUBLIC_WEBMCP_MODE.
WEBMCP_MODE="polyfill"
# Chrome origin-trial token, registered for the production hostname only. Leave empty on
# previews and locally (ADR-0007).
WEBMCP_ORIGIN_TRIAL_TOKEN=""

# --- Environment (ADR-0003, SPEC-webmcp-tools §2.1) ---
# APP_ENV=test enables /api/test/reset|seed|log and the window.__pf test hook.
# next.config exposes this as NEXT_PUBLIC_APP_ENV.
APP_ENV="development"

# --- Named by the Release 1 specs, consumed from T-02 onwards ---
# Vercel sends CRON_SECRET on the scheduled reset; /api/admin/reset accepts either secret
# (SPEC-reset-and-test-support §2.3).
CRON_SECRET=""
# Banner copy, "resets every N days" (SPEC-app-shell §5). Default 10.
RESET_INTERVAL_DAYS="10"
# Threshold reset (SPEC-reset-and-test-support §2.4). Defaults 2000 rows / 50 MB.
RESET_ROW_THRESHOLD="2000"
RESET_BYTES_THRESHOLD="52428800"
```

- [ ] **Step 2: Add the env check to `tests/unit/scaffold.test.ts`**

Append inside the outer `describe("T-01 scaffold", …)`:

```ts
describe(".env.example lists every documented variable", () => {
  const envExample = readFileSync(join(repoRoot, ".env.example"), "utf8");
  const declared = new Set(
    envExample
      .split("\n")
      .map((line) => line.match(/^([A-Z][A-Z0-9_]*)=/)?.[1])
      .filter((name): name is string => Boolean(name)),
  );

  // ADR-0005/0006/0007 and SPEC-webmcp-tools §2.1, plus the R1 spec variables (D6).
  const required = [
    "DATABASE_URL",
    "SESSION_SECRET",
    "DEMO_EMAIL",
    "DEMO_PASSWORD_HASH",
    "DEMO_PASSWORD_DISPLAY",
    "RESET_SECRET",
    "WEBMCP_MODE",
    "WEBMCP_ORIGIN_TRIAL_TOKEN",
    "APP_ENV",
    "CRON_SECRET",
    "RESET_INTERVAL_DAYS",
    "RESET_ROW_THRESHOLD",
    "RESET_BYTES_THRESHOLD",
  ];

  it.each(required)("declares %s", (name) => {
    expect(declared.has(name)).toBe(true);
  });

  it("does not declare NEXT_PUBLIC_* directly — next.config derives them (§2.1)", () => {
    expect([...declared].filter((name) => name.startsWith("NEXT_PUBLIC_"))).toEqual([]);
  });
});
```

- [ ] **Step 3: Confirm `.env.example` is not ignored**

Run: `git check-ignore -v .env.example`
Expected: exit code 1, no output (`.gitignore` already has `!.env.example`).

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(config): .env.example covering ADR-0005/0006/0007 and the R1 specs (T-01)"
```

---
