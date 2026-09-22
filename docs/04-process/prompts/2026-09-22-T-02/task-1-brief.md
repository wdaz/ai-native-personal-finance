### Task 1: Prisma 7 toolchain, schema and generated client

No database is needed. At the end, `npm ci` installs and generates the client, and every
existing gate is green with one more boundary test.

**Files:**
- Modify: `package.json`, `package-lock.json`, `.gitignore`, `tests/unit/boundaries.test.ts`,
  `tests/fixtures/boundaries/{domain-imports-server-alias,domain-imports-server-relative,app-imports-server-allowed,scripts-imports-server,shared-imports-server,webmcp-imports-server}.ts.fixture`,
  `tests/fixtures/boundaries/README.md`, `src/server/README.md`, `prisma/README.md`
- Create: `prisma.config.ts`, `prisma/schema.prisma`, `src/server/env.ts`, `src/server/db.ts`,
  `tests/fixtures/boundaries/app-imports-prisma-generated.ts.fixture`

**Interfaces:**
- Produces: `PrismaClient`, `Prisma` (namespace, incl. `Prisma.raw`, `Prisma.ModelName`) from
  `src/server/generated/prisma/client`; the enum types `Category`, `Theme`, `ResetReason` from
  `src/server/generated/prisma/enums`; `type Env = Readonly<Record<string, string | undefined>>`,
  `isTestEnv(env?: Env): boolean`, `databaseUrl(env?: Env): string` from `src/server/env.ts`;
  `type Db = PrismaClient`, `createDb(connectionString: string): Db`, `getDb(): Db` from
  `src/server/db.ts`.

- [ ] **Step 1: Confirm the branch and a clean tree**

Run: `git branch --show-current && git status --short`
Expected: `task/T-02-persistence-reset` and no output from `status`. Every commit in this plan
uses the `GITLEAKS_CACHE_DIR` form of Global Constraints, "Commits".

- [ ] **Step 2: Install the Prisma packages (pinned) and the test-only `pg`**

```bash
npm install --save-exact @prisma/client@7.10.0 @prisma/adapter-pg@7.10.0
npm install --save-dev --save-exact prisma@7.10.0
npm install --save-dev pg@^8.23.0 @types/pg@^8.23.1
```

Expected: the last install ends with an `install-scripts` warning naming `prisma@7.10.0`
(preinstall), `@prisma/engines@7.10.0` (postinstall) and `fsevents@2.3.3`, and
`node_modules/@prisma/engines/schema-engine-darwin-arm64` exists (E5).
`package.json` now has `"@prisma/adapter-pg": "7.10.0"` and `"@prisma/client": "7.10.0"` under
`dependencies`, `"prisma": "7.10.0"`, `"pg": "^8.23.0"` and `"@types/pg": "^8.23.1"` under
`devDependencies`. Check: `npx prisma --version` prints `prisma : 7.10.0` and
`@prisma/client : 7.10.0`.

- [ ] **Step 3: Record the two reviewed install scripts, and force the fixed releases**

Run: `npm install-scripts approve prisma @prisma/engines`
Expected: `package.json`'s `allowScripts` is

```json
  "allowScripts": {
    "unrs-resolver@1.12.2": true,
    "prisma@7.10.0": true,
    "@prisma/engines@7.10.0": true
  }
```

(`prisma`'s preinstall checks the environment; `@prisma/engines`' postinstall downloads the
schema engine the migrate commands use — D17.)

Run: `npm audit --audit-level=high`
Expected: `4 high severity vulnerabilities` — `deepmerge-ts` and `mysql2` inside the `prisma`
CLI (E19).

Owner answer 9 (D19): in `package.json`, directly after `allowScripts`, add

```json
  "//": [
    "overrides: prisma@7.10.0 pins deepmerge-ts 7.1.5 (GHSA-ggr8-5vv4-36mx) and mysql2 3.15.3 (GHSA-3f6p-5ww8-9rcr, GHSA-rgwj-5xj2-c3m3); forcing the fixed releases keeps npm audit at 0 behind the T-02a gate (owner decision 2026-09-22).",
    "Drop both overrides when Prisma ships fixed versions (backlog T-13)."
  ],
  "overrides": {
    "deepmerge-ts": "8.0.2",
    "mysql2": "3.24.4"
  }
```

Run: `npm install && npm audit --audit-level=high && npm ls deepmerge-ts mysql2 && npx prisma --version`
Expected (E24): `found 0 vulnerabilities`; `deepmerge-ts@8.0.2 overridden` and
`mysql2@3.24.4 overridden`; the CLI still reports 7.10.0. `npx prettier --check package.json`
is clean. (The schema does not exist yet; Step 6 runs `validate` and `generate` with the
overrides in place.)

- [ ] **Step 4: Write `prisma/schema.prisma`**

```prisma
// The database of docs/02-architecture/data-model.md (ADR-0005). Money is integer cents in
// 64-bit columns (NFR-S3 allows 99,999,999,999 cents; a 32-bit Int stops at 2,147,483,647).
// Dates are UTC instants. Every entity has id, createdAt, updatedAt and seeded.
// The connection URL lives in prisma.config.ts, not here (Prisma 7).

generator client {
  provider = "prisma-client"
  // Inside src/server: ADR-0002 lets only that layer reach the database, and the `prisma`
  // segment of the path is what the import guard in eslint.config.mjs matches.
  output   = "../src/server/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// The database stores the documented name ("Dining Out"); the client spells it without
// the space (DiningOut).
enum Category {
  Entertainment
  Bills
  Groceries
  DiningOut      @map("Dining Out")
  Transportation
  PersonalCare   @map("Personal Care")
  Education
  Lifestyle
  Shopping
  General
}

enum Theme {
  Green
  Yellow
  Cyan
  Navy
  Red
  Purple
  Turquoise
  Brown
  Magenta
  Blue
  NavyGrey  @map("Navy Grey")
  ArmyGreen @map("Army Green")
  Gold
  Orange
  Pink
}

enum ResetReason {
  scheduled
  threshold
  manual
  test
}

// A singleton: resetToSeed writes exactly one row.
model Balance {
  id        String   @id @default(uuid()) @db.Uuid
  current   BigInt
  income    BigInt
  expenses  BigInt
  seeded    Boolean  @default(false)
  createdAt DateTime @default(now()) @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @db.Timestamptz(3)
}

model Transaction {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  // The avatar's basename key, e.g. emma-richardson (SPEC-overview §4.5).
  avatar    String
  category  Category
  date      DateTime @db.Timestamptz(3)
  // Signed: income positive, spending negative.
  amount    BigInt
  recurring Boolean
  seeded    Boolean  @default(false)
  createdAt DateTime @default(now()) @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @db.Timestamptz(3)
}

model Budget {
  id        String   @id @default(uuid()) @db.Uuid
  // Creation order (US-07 AC1, US-15 AC4): rows created in one transaction share createdAt.
  seq       Int      @unique @default(autoincrement())
  category  Category @unique
  maximum   BigInt
  theme     Theme    @unique
  seeded    Boolean  @default(false)
  createdAt DateTime @default(now()) @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @db.Timestamptz(3)
}

model Pot {
  id        String   @id @default(uuid()) @db.Uuid
  // Creation order (US-05 AC1, US-22 AC1).
  seq       Int      @unique @default(autoincrement())
  // citext: unique whatever the case. The init migration creates the extension.
  name      String   @unique @db.Citext
  target    BigInt
  total     BigInt
  theme     Theme    @unique
  seeded    Boolean  @default(false)
  createdAt DateTime @default(now()) @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @db.Timestamptz(3)
}

model ResetLog {
  id        String      @id @default(uuid()) @db.Uuid
  at        DateTime    @default(now()) @db.Timestamptz(3)
  reason    ResetReason
  seeded    Boolean     @default(false)
  createdAt DateTime    @default(now()) @db.Timestamptz(3)
  updatedAt DateTime    @updatedAt @db.Timestamptz(3)
}

model LoginAttempt {
  id        String   @id @default(uuid()) @db.Uuid
  ip        String
  at        DateTime @default(now()) @db.Timestamptz(3)
  success   Boolean
  seeded    Boolean  @default(false)
  createdAt DateTime @default(now()) @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @db.Timestamptz(3)
}
```

(If question 1 is answered "no", the two `seq` lines go; if question 2 is answered "keep
32-bit", every `BigInt` becomes `Int` and the header's first sentence changes accordingly.)

- [ ] **Step 5: Write `prisma.config.ts`**

```ts
import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Prisma 7 reads no .env file of its own. Local settings live in .env.local (README, "Run
// locally"), as for Next.js; a variable already in the environment, such as CI's, wins.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // Optional here: `prisma generate` (postinstall) needs no database. The migrate and seed
  // commands stop with Prisma's own error when it is missing.
  datasource: { url: process.env.DATABASE_URL },
});
```

- [ ] **Step 6: Ignore the generated client and generate it**

Append to `.gitignore`:

```gitignore

# The Prisma client, generated into src/server by `prisma generate` on every npm install (T-02)
/src/server/generated/
```

Run: `npx prisma validate && shasum prisma/schema.prisma && npx prisma format && shasum prisma/schema.prisma && npx prisma generate`
Expected: "The schema at prisma/schema.prisma is valid"; the two checksums are equal
(`prisma format` changed nothing, E6); "Generated Prisma Client (7.10.0) to
./src/server/generated/prisma". `git status --short` does not list `src/server/generated/`.

- [ ] **Step 7: Generate on every install**

Run: `npm pkg set scripts.postinstall="prisma generate"`
Then: `rm -rf src/server/generated && npm ci`
Expected: `npm ci` ends by running `prisma generate` (and `prepare`), and
`src/server/generated/prisma/client.ts` exists again. With `DATABASE_URL` unset in the shell and
no `.env.local`, it still succeeds (E6).

- [ ] **Step 8: Write `src/server/env.ts`**

```ts
/**
 * Server-side environment. Read on every call rather than captured at import, so a route
 * handler sees the environment of the process it runs in and a test can pass its own.
 */
export type Env = Readonly<Record<string, string | undefined>>;

/**
 * SPEC-reset-and-test-support §2.7: the test-support routes exist only when
 * `APP_ENV=test`. An exact match — `Test`, `test ` and an unset variable are not test.
 */
export function isTestEnv(env: Env = process.env): boolean {
  return env.APP_ENV === "test";
}

/** ADR-0005: Postgres through Prisma. `.env.example` documents the variable. */
export function databaseUrl(env: Env = process.env): string {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set: copy .env.example to .env.local (README, Run locally)",
    );
  }
  return url;
}
```

- [ ] **Step 9: Write `src/server/db.ts`**

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { databaseUrl } from "./env";
import { PrismaClient } from "./generated/prisma/client";

/**
 * The application's database client (ADR-0005). ADR-0002 lets only src/server import it.
 * Prisma 7 reaches Postgres through a driver adapter; `@prisma/adapter-pg` wraps
 * node-postgres.
 */
export type Db = PrismaClient;

export function createDb(connectionString: string): Db {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// One client, and so one connection pool, per server process. `next dev` re-evaluates
// modules on every edit, so the instance lives on globalThis rather than in this module.
const holder = globalThis as typeof globalThis & { __pfDb?: Db };

export function getDb(): Db {
  holder.__pfDb ??= createDb(databaseUrl());
  return holder.__pfDb;
}
```

- [ ] **Step 10: Add the violation fixture for the generated client, then its test case**

Create `tests/fixtures/boundaries/app-imports-prisma-generated.ts.fixture`:

```ts
// Linted as app/api/imports-prisma-generated.ts.
// ADR-0002: app never imports Prisma directly. Prisma 7 generates the client into
// src/server/generated/prisma (T-02) instead of @prisma/client, so the guard must cover that
// path too — here from the layer that is allowed to import src/server, so only the Prisma
// rule stands between this import and the database.
import { PrismaClient } from "@/src/server/generated/prisma/client";

export const client = new PrismaClient();
```

In `tests/unit/boundaries.test.ts`, insert into `violations`, directly before the
`ui-imports-prisma.ts.fixture` entry:

```ts
  {
    // Prisma 7 generates the client into src/server/generated/prisma (T-02); app may import
    // src/server, so only the Prisma rule stands between this import and the database.
    fixture: "app-imports-prisma-generated.ts.fixture",
    lintAs: "app/api/imports-prisma-generated.ts",
    ruleId: "no-restricted-imports",
    message: "ADR-0002: only src/server may import Prisma",
  },
```

Run: `npx vitest run tests/unit/boundaries.test.ts`
Expected: 35 passed. The guard already covers the path (E10), so prove the case can fail:
remove `"**/prisma/**", ` from the `group` array in `eslint.config.mjs`, run again — expected
exactly one failure, `app/api/imports-prisma-generated.ts reports no-restricted-imports` —
then restore the file (`git checkout eslint.config.mjs`) and run again: 35 passed.

- [ ] **Step 11: Repoint the six server fixtures**

In `domain-imports-server-alias`, `app-imports-server-allowed`, `scripts-imports-server`,
`shared-imports-server` and `webmcp-imports-server` (`.ts.fixture`), replace
`import "@/src/server/README.md";` with `import "@/src/server/db";`. In
`domain-imports-server-relative.ts.fixture`, replace `import "../server/README.md";` with
`import "../server/db";`. In `tests/unit/boundaries.test.ts`, change the first entry of
`importTargets` from `"src/server/README.md"` to `"src/server/db.ts"`.

Run: `npx vitest run tests/unit/boundaries.test.ts`
Expected: 35 passed. Then rename `src/server/db.ts` away (`mv src/server/db.ts /tmp/db.ts`),
run again — expected red: "the fixtures' import target src/server/db.ts exists" and the five
cases that import `src/server/db` — and move it back.

- [ ] **Step 12: Update the three READMEs**

`tests/fixtures/boundaries/README.md` — in "What is covered", change the Prisma row to

```markdown
| Prisma outside `src/server`                | from `app` (`@prisma/client`, the `/edge` sub-path and the generated client in `src/server/generated/prisma`), `src/ui`, `src/shared` |
```

and replace the section "Why the imports point at README files" with

```markdown
## Why some imports point at README files

`boundaries/dependencies` classifies an import by the path it _resolves to_; an import
that does not resolve is treated as external and is allowed by policy. The target
therefore has to exist. `src/server` holds modules since T-02, and its fixtures import
`src/server/db`; `src/domain` holds none until T-03, so its fixtures import the only file
that folder contains. The layer is what is being asserted, not the module's contents, and
a side-effect import states that plainly. T-03 points them at real modules.

If one of those targets is ever deleted the import stops resolving, the rule stops
firing, and the test fails loudly rather than the guarantee lapsing in silence.
```

`src/server/README.md` — replace the last two lines with

```markdown
- The only layer allowed to import Prisma: `@prisma/*` and the generated client in
  `generated/prisma/` (git-ignored; `npm install` regenerates it from `prisma/schema.prisma`).

T-02: `env.ts`, `db.ts` (the Prisma client), `seed.ts` and `variants.ts` (pure),
`reset.ts` (`resetToSeed`), `http.ts`, `test-support.ts`. T-05 adds the session and the rate
limit, T-08 the threshold.
```

`prisma/README.md` — replace "Filled by T-02." with

```markdown
- `schema.prisma` — the six tables of `docs/02-architecture/data-model.md`; the client is
  generated into `src/server/generated/prisma`.
- `migrations/` — committed, applied by `npx prisma migrate deploy` (and by `npm run db:reset`).
- `data.json` — a byte-for-byte copy of `docs/00-discovery/inputs/data.json`
  (`tests/unit/seed.test.ts` compares them); not formatted by Prettier.
- `seed.ts` — `npm run db:reset`: `resetToSeed(db, "manual")` (SPEC-reset-and-test-support §2.5).
  It lives here rather than in `scripts/`, which may not import `src/server` (ADR-0002).
```

(`data.json` and `seed.ts` arrive in Tasks 2 and 3; the README describes the finished folder.)

- [ ] **Step 13: Run every gate**

Run: `npm run lint && npm run format:check && npm run typecheck && npm test && npm audit --audit-level=high`
Expected: all exit 0; Vitest 158/158 (after PR #4 and PR #5 merge, 161/161: they add 2 and
1 tests — every later count in this plan grows by the same 3); `found 0 vulnerabilities`.

- [ ] **Step 14: Commit**

```bash
git add package.json package-lock.json prisma.config.ts prisma/schema.prisma prisma/README.md \
  .gitignore src/server/env.ts src/server/db.ts src/server/README.md \
  tests/fixtures/boundaries tests/unit/boundaries.test.ts
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "feat(db): Prisma 7 schema and generated client in src/server (T-02)"
```

---

