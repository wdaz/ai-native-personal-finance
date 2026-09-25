## Task 4: TD-10 — `APP_ENV=test` and database resets refuse to run where a real database could be behind them

**Files:**

- Create: `tests/unit/shared/env.test.ts`, `tests/unit/database-guard.test.ts`
- Modify: `src/shared/env.ts`, `src/server/env.ts`, `next.config.ts`, `prisma/seed.ts`,
  `playwright.config.ts`, `tests/unit/server/env.test.ts`, `tests/unit/test-support.test.ts`,
  `tests/unit/next-config.test.ts`, `.env.example`, `README.md`

**Interfaces:**

- Consumes: `process.env`; `childEnv()` from `tests/fixtures/child-env.ts`; `loadConfig` and the
  `configCopy` helper already in `tests/unit/next-config.test.ts`.
- Produces, in `src/shared/env.ts` (no imports; only the global `URL`):

```ts
export function isLocalDatabaseUrl(url: string): boolean;
export function localDatabaseRefusal(env: Readonly<Record<string, string | undefined>>): string | null;
export function testEnvRefusal(env: Readonly<Record<string, string | undefined>>): string | null;
```

`localDatabaseRefusal` is `null` for an unset, empty or local `DATABASE_URL` and a message for any
other. `testEnvRefusal` is `null` unless `APP_ENV === "test"`; then a message when `VERCEL` or
`VERCEL_ENV` is non-empty, or `localDatabaseRefusal(env)` is not `null`. Neither message contains
the URL. `isTestEnv(env)` becomes `env.APP_ENV === "test" && testEnvRefusal(env) === null`.

- [ ] **Step 1: write the tests of the three functions** — the URL tables are Review Focus 1–3

```ts
import { describe, expect, it } from "vitest";
import { isLocalDatabaseUrl, localDatabaseRefusal, testEnvRefusal } from "@/src/shared/env";

const LOCAL_URLS = [
  "postgresql://postgres:postgres@localhost:5432/personal_finance",
  "postgres://postgres:postgres@127.0.0.1:5432/personal_finance",
  "postgresql://postgres:password@[::1]:5432/personal_finance",
  "postgresql://postgres:password@LOCALHOST/personal_finance?sslmode=disable",
  "postgresql://localhost/personal_finance",
];

/** Hosts that only look local, and one real Neon-shaped URL — every one must be refused. */
const NOT_LOCAL_URLS = [
  "postgresql://user:password@ep-cool-name-123456-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require",
  "postgresql://user:password@db.example.com:5432/personal_finance",
  "postgresql://user:password@localhost.example.com/personal_finance",
  "postgresql://user:password@notlocalhost/personal_finance",
  "postgresql://user:password@127.0.0.1.nip.io/personal_finance",
  "postgresql://user:password@127.0.0.2/personal_finance",
  // userinfo, not host: this connects to prod.example.com
  "postgresql://localhost:password@prod.example.com/personal_finance",
  // node-postgres reads ?host= over the URL's own host (measured 2026-09-24)
  "postgresql://user:password@localhost/personal_finance?host=prod.example.com",
  "postgresql://user:password@localhost/personal_finance?hostaddr=10.0.0.5",
  // no host at all: the driver falls back to PGHOST
  "postgresql:///personal_finance",
  "not a url",
  "",
];

describe("isLocalDatabaseUrl (TD-10)", () => {
  it.each(LOCAL_URLS)("%s is local", (url) => {
    expect(isLocalDatabaseUrl(url)).toBe(true);
  });

  it.each(NOT_LOCAL_URLS)("%j is not local", (url) => {
    expect(isLocalDatabaseUrl(url)).toBe(false);
  });
});

describe("localDatabaseRefusal (TD-10: db:reset, the seed and every Playwright run)", () => {
  it.each(LOCAL_URLS)("lets %s through", (url) => {
    expect(localDatabaseRefusal({ DATABASE_URL: url })).toBeNull();
  });

  it.each(NOT_LOCAL_URLS.filter(Boolean))("refuses %s", (url) => {
    expect(localDatabaseRefusal({ DATABASE_URL: url })).toMatch(/^Refusing to run: DATABASE_URL/);
  });

  it("leaves an unset or empty DATABASE_URL to databaseUrl()'s own error", () => {
    expect(localDatabaseRefusal({})).toBeNull();
    expect(localDatabaseRefusal({ DATABASE_URL: "" })).toBeNull();
  });

  it("never puts the URL, its password or its host in the message (CI logs are public)", () => {
    // Built from a variable, not spelled out: the secret scan reads a literal
    // `scheme://user:password@host` as a leak, and `${…}` is one of its placeholders.
    const secret = "s3cret-pw";
    const message = localDatabaseRefusal({
      DATABASE_URL: `postgresql://user:${secret}@db.example.com:5432/personal_finance`,
    });
    expect(message).not.toBeNull();
    expect(message).not.toContain(secret);
    expect(message).not.toContain("db.example.com");
  });
});

describe("testEnvRefusal (TD-10: APP_ENV=test)", () => {
  const neon = "postgresql://user:password@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb";

  it.each([undefined, "", "development", "production", "Test", "test "])(
    "is not about APP_ENV=%j — nothing is refused, whatever else the environment says",
    (appEnv) => {
      expect(testEnvRefusal({ APP_ENV: appEnv, VERCEL: "1", DATABASE_URL: neon })).toBeNull();
    },
  );

  it("refuses APP_ENV=test on a Vercel deployment, by VERCEL or by VERCEL_ENV", () => {
    expect(testEnvRefusal({ APP_ENV: "test", VERCEL: "1" })).toMatch(/Vercel deployment/);
    expect(testEnvRefusal({ APP_ENV: "test", VERCEL_ENV: "preview" })).toMatch(/Vercel deployment/);
    expect(testEnvRefusal({ APP_ENV: "test", VERCEL_ENV: "development" })).toMatch(/Vercel/);
  });

  it("refuses APP_ENV=test with a DATABASE_URL on another machine — with no platform variable at all", () => {
    expect(testEnvRefusal({ APP_ENV: "test", DATABASE_URL: neon })).toMatch(/DATABASE_URL/);
    expect(
      testEnvRefusal({
        APP_ENV: "test",
        DATABASE_URL: "postgresql://user:password@localhost/db?host=prod.example.com",
      }),
    ).toMatch(/DATABASE_URL/);
  });

  it("lets APP_ENV=test run against a local database, in CI and on a laptop", () => {
    expect(testEnvRefusal({ APP_ENV: "test", DATABASE_URL: LOCAL_URLS[0] })).toBeNull();
    expect(
      testEnvRefusal({
        APP_ENV: "test",
        CI: "true",
        GITHUB_ACTIONS: "true",
        NODE_ENV: "production",
        DATABASE_URL: LOCAL_URLS[0],
      }),
    ).toBeNull();
  });

  it("treats an empty platform variable as unset, and an unset DATABASE_URL as nothing to protect", () => {
    expect(testEnvRefusal({ APP_ENV: "test", VERCEL: "", VERCEL_ENV: "" })).toBeNull();
    expect(testEnvRefusal({ APP_ENV: "test" })).toBeNull();
  });

  it("never puts the URL, its password or its host in the message", () => {
    const message = testEnvRefusal({ APP_ENV: "test", DATABASE_URL: neon });
    expect(message).not.toContain("user:password");
    expect(message).not.toContain("neon.tech");
  });
});
```

- [ ] **Step 2: run it and see it fail**

```bash
npx vitest run tests/unit/shared/env.test.ts
```

Expected (predicted): every test fails with `isLocalDatabaseUrl is not a function` (or
`localDatabaseRefusal` / `testEnvRefusal`).

- [ ] **Step 3: write the functions**

```diff
--- a/src/shared/env.ts
+++ b/src/shared/env.ts
@@ -1 +1,74 @@
 export const WEBMCP_MODES = ["native", "polyfill", "off"] as const;
+
+type EnvVars = Readonly<Record<string, string | undefined>>;
+
+/**
+ * TD-10: the hosts a database URL may name for a run that resets or seeds the database. The
+ * whole 127.0.0.0/8 range and Unix sockets are not listed — nothing here uses them, and a
+ * value that is not listed is refused, which is the safe way to be wrong.
+ */
+const LOCAL_DATABASE_HOSTS: readonly string[] = ["localhost", "127.0.0.1", "[::1]"];
+
+/**
+ * Is `url` a database URL whose host is this machine? Fails closed: a value that does not
+ * parse, names no host (`postgresql:///db`), or carries a `host` or `hostaddr` query parameter
+ * is not local. `?host=` matters: node-postgres reads it over the URL's own host (measured
+ * 2026-09-24 with pg-connection-string), so `postgresql://localhost/db?host=prod.example.com`
+ * connects to `prod.example.com` while `new URL(...).hostname` still says `localhost`.
+ */
+export function isLocalDatabaseUrl(url: string): boolean {
+  let parsed: URL;
+  try {
+    parsed = new URL(url);
+  } catch {
+    return false;
+  }
+  if (parsed.searchParams.has("host") || parsed.searchParams.has("hostaddr")) return false;
+  return LOCAL_DATABASE_HOSTS.includes(parsed.hostname.toLowerCase());
+}
+
+/**
+ * TD-10: why a run that resets or seeds the database named by `DATABASE_URL` must stop, or
+ * `null` when it may go on. An unset `DATABASE_URL` is not refused here: there is nothing to
+ * reset, and the first database call names the missing variable (`databaseUrl()`). The message
+ * never contains the URL — it holds a password, and CI logs of a public repository are public.
+ */
+export function localDatabaseRefusal(env: EnvVars): string | null {
+  const url = env.DATABASE_URL;
+  if (!url || isLocalDatabaseUrl(url)) return null;
+  return (
+    "Refusing to run: DATABASE_URL does not name this machine (localhost, 127.0.0.1 or [::1]), " +
+    "and this command resets or seeds that database. Point DATABASE_URL at the local " +
+    "database from compose.yaml (README, Run locally) — TD-10"
+  );
+}
+
+/**
+ * TD-10: why `APP_ENV=test` must not run here, or `null` when it may. The test-support routes
+ * reset and seed the database without a session (SPEC-reset-and-test-support §2.7), so the
+ * value is refused wherever a real database could be behind it:
+ * - on a Vercel deployment — `VERCEL` and `VERCEL_ENV` exist at build and at runtime, but only
+ *   while the project's "system environment variables" setting is on (vercel.com/docs, read
+ *   2026-09-24), so this line alone would not be enough;
+ * - with a `DATABASE_URL` that names another machine (`localDatabaseRefusal`) — the line that
+ *   does not depend on any platform.
+ * Deliberately not keyed on `NODE_ENV`: CI and every local API/E2E run start a production
+ * build with `APP_ENV=test` (ADR-0003).
+ */
+export function testEnvRefusal(env: EnvVars): string | null {
+  if (env.APP_ENV !== "test") return null;
+  if (env.VERCEL || env.VERCEL_ENV) {
+    return (
+      "Refusing to run: APP_ENV=test on a Vercel deployment (VERCEL is set) would expose the " +
+      "unauthenticated /api/test/* reset and seed routes — unset APP_ENV there — TD-10"
+    );
+  }
+  if (localDatabaseRefusal(env) !== null) {
+    return (
+      "Refusing to run: APP_ENV=test with a DATABASE_URL that does not name this machine " +
+      "(localhost, 127.0.0.1 or [::1]) would expose the unauthenticated /api/test/* reset and " +
+      "seed routes on that database — TD-10"
+    );
+  }
+  return null;
+}
```

- [ ] **Step 4: run it**

```bash
npx vitest run tests/unit/shared/env.test.ts
```

Expected (measured): `Tests 46 passed`.

- [ ] **Step 5: write the `isTestEnv` and route tests, and see three fail** — the first two below
  are `isTestEnv` cases, the third is the route list SPEC §2.7 asks a unit test to pin

```diff
--- a/tests/unit/server/env.test.ts
+++ b/tests/unit/server/env.test.ts
@@ -4,6 +4,7 @@ import {
   cronSecret,
   demoCredentials,
   demoPasswordHash,
+  isTestEnv,
   resetBytesThreshold,
   resetIntervalDays,
   resetRowThreshold,
@@ -131,3 +132,29 @@ describe("configuredWebmcpMode (SPEC-app-shell §5)", () => {
     expect(() => configuredWebmcpMode({ WEBMCP_MODE: "invisible" })).toThrow(/WEBMCP_MODE/);
   });
 });
+
+describe("isTestEnv (SPEC-reset-and-test-support §2.7, TD-10)", () => {
+  const local = "postgresql://postgres:postgres@localhost:5432/personal_finance";
+  const neon = "postgresql://user:password@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb";
+
+  it.each([undefined, "", "development", "production", "Test", "test "])(
+    "is false for APP_ENV=%j",
+    (appEnv) => {
+      expect(isTestEnv({ APP_ENV: appEnv, DATABASE_URL: local })).toBe(false);
+    },
+  );
+
+  it("is true for APP_ENV=test, with or without a local database URL", () => {
+    expect(isTestEnv({ APP_ENV: "test" })).toBe(true);
+    expect(isTestEnv({ APP_ENV: "test", DATABASE_URL: local })).toBe(true);
+  });
+
+  it("is false for APP_ENV=test on a Vercel deployment, at runtime as at build (TD-10)", () => {
+    expect(isTestEnv({ APP_ENV: "test", VERCEL: "1", DATABASE_URL: local })).toBe(false);
+    expect(isTestEnv({ APP_ENV: "test", VERCEL_ENV: "production" })).toBe(false);
+  });
+
+  it("is false for APP_ENV=test against another machine's database (TD-10)", () => {
+    expect(isTestEnv({ APP_ENV: "test", DATABASE_URL: neon })).toBe(false);
+  });
+});
```

```diff
--- a/tests/unit/test-support.test.ts
+++ b/tests/unit/test-support.test.ts
@@ -32,6 +32,18 @@ describe("test-support routes (SPEC-reset-and-test-support §2.7)", () => {
     ]);
   });
 
+  it("has no /api/test/* route for APP_ENV=test on a deployment or against another machine's database (TD-10)", () => {
+    const neon = "postgresql://user:password@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb";
+    expect(testSupportRoutes({ APP_ENV: "test", VERCEL: "1" })).toEqual([]);
+    expect(testSupportRoutes({ APP_ENV: "test", VERCEL_ENV: "production" })).toEqual([]);
+    expect(testSupportRoutes({ APP_ENV: "test", DATABASE_URL: neon })).toEqual([]);
+  });
+
+  it("keeps them for APP_ENV=test against the local database (the control for the case above)", () => {
+    const local = "postgresql://postgres:postgres@localhost:5432/personal_finance";
+    expect(testSupportRoutes({ APP_ENV: "test", DATABASE_URL: local })).toHaveLength(3);
+  });
+
   describe("GET /api/test/log (SPEC-reset-and-test-support §2.7)", () => {
     const get = (query: string) =>
       handleTestSupport("GET", ["log"], new Request(`http://localhost/api/test/log${query}`), {
```

```bash
npx vitest run tests/unit/server/env.test.ts tests/unit/test-support.test.ts
```

Expected (measured): `3 failed | 61 passed` — `expected true to be false` twice, and `expected [ {
method: 'POST', …(2) }, …(2) ] to deeply equal []`.

- [ ] **Step 6: make `isTestEnv` ask `testEnvRefusal`**

```diff
--- a/src/server/env.ts
+++ b/src/server/env.ts
@@ -1,4 +1,4 @@
-import { WEBMCP_MODES } from "@/src/shared/env";
+import { WEBMCP_MODES, testEnvRefusal } from "@/src/shared/env";
 // Type only: a runtime import of schemas.ts would pull zod and copy.ts into the middleware
 // bundle, which imports this file through db.ts (PR #20 review, finding 8).
 import type { WebMcpMode } from "@/src/shared/schemas";
@@ -11,10 +11,13 @@ export type Env = Readonly<Record<string, string | undefined>>;
 
 /**
  * SPEC-reset-and-test-support §2.7: the test-support routes exist only when
- * `APP_ENV=test`. An exact match — `Test`, `test ` and an unset variable are not test.
+ * `APP_ENV=test`. An exact match — `Test`, `test ` and an unset variable are not test — and
+ * never on a Vercel deployment or against another machine's database (`testEnvRefusal`, TD-10).
+ * `next.config.ts` refuses the same combination when it loads, so a deployment does not build;
+ * this is the second line, for a process whose environment changed after the build.
  */
 export function isTestEnv(env: Env = process.env): boolean {
-  return env.APP_ENV === "test";
+  return env.APP_ENV === "test" && testEnvRefusal(env) === null;
 }
 
 /** ADR-0005: Postgres through Prisma. `.env.example` documents the variable. */
```

```bash
npx vitest run tests/unit/server/env.test.ts tests/unit/test-support.test.ts tests/unit/server/request-log.test.ts
```

Expected (measured): `Test Files 3 passed`, `Tests 75 passed`.

- [ ] **Step 7: write the `next.config.ts` tests, and see three fail** — including the DoD v1.1
  violation fixture: the config with its guard block cut out must let a deployment build

```diff
--- a/tests/unit/next-config.test.ts
+++ b/tests/unit/next-config.test.ts
@@ -96,3 +96,64 @@ describe("next.config.ts and the server read WEBMCP_MODE the same way (T-08, PR
     expect(await clientMode(unchecked, "Polyfill")).toBe("Polyfill");
   });
 });
+
+describe("next.config.ts refuses APP_ENV=test where a real database could be behind it (TD-10)", () => {
+  const source = readFileSync(join(repoRoot, "next.config.ts"), "utf8");
+  const local = "postgresql://postgres:postgres@localhost:5432/personal_finance";
+  const neon = "postgresql://user:password@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb";
+
+  /** Loads a config copy with exactly these four variables set (others left as they are). */
+  const loadWith = async (
+    configSource: string,
+    env: Partial<Record<"APP_ENV" | "VERCEL" | "VERCEL_ENV" | "DATABASE_URL", string>>,
+  ) => {
+    const names = ["APP_ENV", "VERCEL", "VERCEL_ENV", "DATABASE_URL"] as const;
+    const saved = names.map((name) => [name, process.env[name]] as const);
+    for (const name of names) {
+      const value = env[name];
+      if (value === undefined) delete process.env[name];
+      else process.env[name] = value;
+    }
+    try {
+      return await loadConfig(PHASE_DEVELOPMENT_SERVER, configCopy(configSource), { silent: true });
+    } finally {
+      for (const [name, value] of saved) {
+        if (value === undefined) delete process.env[name];
+        else process.env[name] = value;
+      }
+    }
+  };
+
+  it("does not build with APP_ENV=test on a Vercel deployment", async () => {
+    await expect(loadWith(source, { APP_ENV: "test", VERCEL: "1" })).rejects.toThrow(
+      /APP_ENV=test on a Vercel deployment/,
+    );
+  });
+
+  it("does not build with APP_ENV=test and another machine's DATABASE_URL", async () => {
+    await expect(loadWith(source, { APP_ENV: "test", DATABASE_URL: neon })).rejects.toThrow(
+      /APP_ENV=test with a DATABASE_URL that does not name this machine/,
+    );
+  });
+
+  it("builds with APP_ENV=test against the local database, and inlines it for the test hook", async () => {
+    const config = await loadWith(source, { APP_ENV: "test", DATABASE_URL: local });
+    expect(config.env?.NEXT_PUBLIC_APP_ENV).toBe("test");
+  });
+
+  it("builds a deployment that does not set APP_ENV=test (the control for the cases above)", async () => {
+    const config = await loadWith(source, {
+      VERCEL: "1",
+      VERCEL_ENV: "production",
+      DATABASE_URL: neon,
+    });
+    expect(config.env?.NEXT_PUBLIC_APP_ENV).toBe("development");
+  });
+
+  it("would let a deployment build with APP_ENV=test without the check (violation fixture, DoD v1.1)", async () => {
+    const unchecked = source.replace(/const testEnvProblem[\s\S]*?\n\}\n/, "");
+    expect(unchecked).not.toBe(source);
+    const config = await loadWith(unchecked, { APP_ENV: "test", VERCEL: "1", DATABASE_URL: neon });
+    expect(config.env?.NEXT_PUBLIC_APP_ENV).toBe("test");
+  });
+});
```

```bash
npx vitest run tests/unit/next-config.test.ts
```

Expected (measured): `3 failed | 14 passed` — two `promise resolved … instead of rejecting`, and
`expected 'import type { NextConfig } from "next…' not to be …` (the guard block does not exist to
cut out yet).

- [ ] **Step 8: guard `next.config.ts`**

```diff
--- a/next.config.ts
+++ b/next.config.ts
@@ -1,5 +1,15 @@
 import type { NextConfig } from "next";
-import { WEBMCP_MODES } from "./src/shared/env";
+import { WEBMCP_MODES, testEnvRefusal } from "./src/shared/env";
+
+// TD-10: `APP_ENV=test` makes the unauthenticated /api/test/* reset and seed routes exist and
+// is inlined below as `NEXT_PUBLIC_APP_ENV`, so a build or a `next start` that would put it
+// where a real database could be behind it stops here — on a Vercel deployment, or with a
+// `DATABASE_URL` that names another machine. Not keyed on `NODE_ENV`: CI and every local
+// API/E2E run build with `APP_ENV=test` and `NODE_ENV=production` (ADR-0003).
+const testEnvProblem = testEnvRefusal(process.env);
+if (testEnvProblem !== null) {
+  throw new Error(testEnvProblem);
+}
 
 // `||`, not `??`: an empty WEBMCP_MODE is "polyfill" here too, as src/server/env.ts's
 // configuredWebmcpMode reads it for GET /api/meta. An unknown value (a typo, "Polyfill") fails
```

```bash
npx vitest run tests/unit/next-config.test.ts
```

Expected (measured): `Tests 17 passed`.

- [ ] **Step 9: write the child-process tests for the seed and Playwright, and see three fail** —
  the URL is `db.example.invalid`, which never resolves, so a missing guard shows as a database
  error, not as silence

```ts
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { childEnv } from "../fixtures/child-env";

const repoRoot = join(import.meta.dirname, "..", "..");

/**
 * `.invalid` never resolves (RFC 6761): were the guard missing, the run would fail on DNS. Built
 * from a variable, not spelled out: the secret scan reads a literal `scheme://user:password@host`
 * as a leak, and `${…}` is one of its placeholders.
 */
const SECRET = "s3cret-pw";
const OTHER_MACHINE = `postgresql://user:${SECRET}@db.example.invalid:5432/personal_finance`;
/** Local, but nothing listens on port 1: a run that passes the guard fails at the connection. */
const LOCAL_NOBODY_LISTENING = "postgresql://user:password@localhost:1/personal_finance";

/**
 * Runs `npx <args>` in the repository with only `DATABASE_URL` decided by the test — a value
 * already in the environment wins over `.env.local` (prisma.config.ts, playwright.config.ts),
 * so a contributor's own file cannot change the outcome.
 */
function run(args: string[], databaseUrl: string) {
  return spawnSync("npx", args, {
    cwd: repoRoot,
    env: { ...childEnv(), DATABASE_URL: databaseUrl },
    encoding: "utf8",
    timeout: 90_000,
  });
}

const REFUSED = /Refusing to run: DATABASE_URL does not name this machine/;

describe("the seed refuses another machine's database (TD-10, npm run db:reset)", () => {
  it("stops with the reason, before it opens a connection", () => {
    const result = run(["tsx", "prisma/seed.ts"], OTHER_MACHINE);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(REFUSED);
    expect(result.stderr).not.toContain(SECRET);
    expect(result.stdout).not.toMatch(/reset reason=manual/);
  }, 90_000);

  it("(control) a local URL passes the guard and fails later, at the connection", () => {
    const result = run(["tsx", "prisma/seed.ts"], LOCAL_NOBODY_LISTENING);

    expect(result.status).not.toBe(0);
    expect(result.stderr).not.toMatch(/Refusing to run/);
  }, 90_000);
});

describe("Playwright refuses another machine's database (TD-10, test:api, test:e2e, the UI mode)", () => {
  it("loads no config, so no test runs", () => {
    const result = run(["playwright", "test", "--list", "--project=api"], OTHER_MACHINE);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(REFUSED);
    expect(result.stderr).not.toContain(SECRET);
  }, 90_000);

  it("(control) a local URL lets the same command list the tests", () => {
    const result = run(["playwright", "test", "--list", "--project=api"], LOCAL_NOBODY_LISTENING);

    expect(result.stderr).not.toMatch(/Refusing to run/);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/\[api\] › api\//);
  }, 90_000);
});
```

```bash
npx vitest run tests/unit/database-guard.test.ts
```

Expected (measured): `3 failed | 1 passed`. Today's seed **connects**: its stderr holds
`Can't reach database server at db.example.invalid` instead of the refusal — the danger TD-10
describes — and `playwright test --list` with the other machine's URL exits 0.

- [ ] **Step 10: guard the seed and Playwright's config**

```diff
--- a/prisma/seed.ts
+++ b/prisma/seed.ts
@@ -1,12 +1,23 @@
 import { createDb } from "@/src/server/db";
 import { databaseUrl } from "@/src/server/env";
 import { resetToSeed } from "@/src/server/reset";
+import { localDatabaseRefusal } from "@/src/shared/env";
 
 /**
  * `npm run db:reset` and Prisma's seed step (prisma.config.ts): SPEC-reset-and-test-support
  * §2.5 — the seed goes in with a `ResetLog` row of reason "manual", so the last reset time
  * always exists.
+ *
+ * It truncates every table, so it runs only against this machine's database (TD-10). The
+ * check is here, in the process that makes the destructive call, so it reads the same
+ * `DATABASE_URL` the reset would — prisma.config.ts has already loaded `.env.local`. `prisma
+ * migrate deploy`, the first half of `db:reset`, is not guarded: T-14 runs it against Neon.
  */
+const refusal = localDatabaseRefusal(process.env);
+if (refusal !== null) {
+  console.error(refusal);
+  process.exit(1);
+}
 const db = createDb(databaseUrl());
 try {
   const { at, rows } = await resetToSeed(db, "manual");
```

```diff
--- a/playwright.config.ts
+++ b/playwright.config.ts
@@ -1,5 +1,6 @@
 import { existsSync } from "node:fs";
 import { defineConfig, devices } from "@playwright/test";
+import { localDatabaseRefusal } from "./src/shared/env";
 
 /**
  * ADR-0003 — E2E on Chromium, Firefox and WebKit against `next build && next start`,
@@ -16,6 +17,16 @@ import { defineConfig, devices } from "@playwright/test";
  */
 if (existsSync(".env.local")) process.loadEnvFile(".env.local");
 
+/**
+ * TD-10: every Playwright run resets the database — the API tests directly, the E2E tests
+ * through `/api/test/reset` on the server this config starts — so none runs against another
+ * machine's. The check is here, after the `.env.local` load, so it sees the `DATABASE_URL`
+ * the tests and the server will use; `test:api`, `test:e2e`, the UI mode and a bare
+ * `npx playwright test` all read this file.
+ */
+const databaseRefusal = localDatabaseRefusal(process.env);
+if (databaseRefusal !== null) throw new Error(databaseRefusal);
+
 const PORT = Number(process.env.PORT ?? 3000);
 const baseURL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`;
 
```

```bash
npx vitest run tests/unit/database-guard.test.ts
```

Expected (measured): `Tests 4 passed`.

- [ ] **Step 11: the real flows** (measured on 2026-09-24; each command is one line)

```bash
env VERCEL=1 APP_ENV=test npx next build
```

Expected: fails at once, before compiling: `Failed to load next.config.ts` … `Error: Refusing to run: APP_ENV=test on a Vercel deployment (VERCEL is set) would expose the unauthenticated /api/test/* reset and seed routes — unset APP_ENV there — TD-10`.

```bash
env APP_ENV=test DATABASE_URL=postgresql://user:password@db.example.invalid:5432/x npx next start -p 3114
```

Expected: `Failed to load next.config.ts` … `Refusing to run: APP_ENV=test with a DATABASE_URL that does not name this machine (localhost, 127.0.0.1 or [::1]) …`, exit status 1, and nothing listening on 3114 afterwards
(`lsof -nP -iTCP:3114 -sTCP:LISTEN` prints nothing). Then the normal flow, which must be unaffected:

```bash
PORT=3113 npx playwright test --project=api tests/api/test-support.spec.ts
```

Expected: `9 passed` (it builds and starts the app with `APP_ENV=test` against the local database).

- [ ] **Step 12: say what refuses what** — `.env.example` and the README

```diff
--- a/.env.example
+++ b/.env.example
@@ -3,7 +3,8 @@
 
 # --- Database (ADR-0005, ADR-0007) ---
 # Neon pooled connection string in production; locally the Postgres of compose.yaml
-# (docker compose up -d --wait).
+# (docker compose up -d --wait). `npm run db:reset` and every Playwright run reset this
+# database, so they refuse a URL whose host is not localhost, 127.0.0.1 or [::1] (TD-10).
 DATABASE_URL="postgresql://postgres:postgres@localhost:5432/personal_finance"
 
 # --- Session and demo account (ADR-0006, ADR-0007) ---
@@ -29,7 +30,9 @@ WEBMCP_ORIGIN_TRIAL_TOKEN=""
 
 # --- Environment (ADR-0003, SPEC-webmcp-tools §2.1) ---
 # APP_ENV=test enables /api/test/reset|seed|log and the window.__pf test hook.
-# next.config exposes this as NEXT_PUBLIC_APP_ENV.
+# next.config exposes this as NEXT_PUBLIC_APP_ENV. `test` is refused on Vercel and with a
+# DATABASE_URL that names another machine: `next build` and `next start` stop, and the routes
+# do not exist (TD-10, src/shared/env.ts).
 APP_ENV="development"
 
 # --- Named by the Release 1 specs, consumed from T-02 onwards ---
```

```diff
--- a/README.md
+++ b/README.md
@@ -63,7 +63,11 @@ the named package's script and run `npm install-scripts approve <package>` (or `
 `npm run db:reset` applies pending migrations and replaces all data with the seed
 (`prisma/data.json`, dates moved two years on), recording a reset of reason `manual`
 (SPEC-reset-and-test-support §2.5). The API and E2E tests reset the same database; it holds
-demo data only.
+demo data only. Both `db:reset` (its seed step, not the migrations) and every Playwright run
+refuse a `DATABASE_URL` whose host is not `localhost`, `127.0.0.1` or `[::1]`, and `APP_ENV=test`
+is refused on Vercel and with such a URL (TD-10, `src/shared/env.ts`); a deployed database is
+seeded through `POST /api/admin/reset` (SPEC-reset-and-test-support §2.2, §2.5), never through
+`db:reset`.
 
 `npm run dev` sends a **relaxed** Content-Security-Policy, so the console stays free of the
 `eval()` and inline-style errors Next's own development tooling would otherwise raise: under
```

- [ ] **Step 13: the whole checks, then commit**

```bash
npx prettier --check .
npx tsc --noEmit
npx eslint . --max-warnings 0
npx vitest run
```

Expected (measured for the tree with all of Tasks 1–5): all clean; `Tests 1035 passed`. At this
task's commit the count is 958 + 2 + 3 + 46 + 9 + 2 + 5 + 4 = 1 029 (Tasks 1 and 3 done, Task 5 not).

```bash
git add src/shared/env.ts src/server/env.ts next.config.ts prisma/seed.ts playwright.config.ts tests/unit/shared/env.test.ts tests/unit/server/env.test.ts tests/unit/test-support.test.ts tests/unit/next-config.test.ts tests/unit/database-guard.test.ts .env.example README.md
git commit -m "feat(env): refuse APP_ENV=test and database resets outside this machine (TD-10)"
```

