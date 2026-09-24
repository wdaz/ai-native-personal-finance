## Task 4: schema drift (T-02 hand-off)

**Files:**
- Create: `scripts/schema-drift.sh`, `tests/api/schema-drift.spec.ts`
- Modify: `package.json` (`db:drift`), `tests/api/README.md` (one line)

- [ ] **Step 1: Write the failing test.** `tests/api/schema-drift.spec.ts`:

```ts
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const repoRoot = join(import.meta.dirname, "..", "..");
const script = join(repoRoot, "scripts/schema-drift.sh");

/** T-13 (T-02 hand-off): `prisma/schema.prisma` and the migrations that build the database agree. */
test("the migrated database matches prisma/schema.prisma", () => {
  const run = spawnSync("sh", [script], { cwd: repoRoot, encoding: "utf8" });
  expect(run.status, run.stdout + run.stderr).toBe(0);
});

test("a schema with a table no migration creates is reported as drift", () => {
  const dir = mkdtempSync(join(tmpdir(), "schema-drift-"));
  try {
    const drifted = join(dir, "schema.prisma");
    writeFileSync(
      drifted,
      `${readFileSync(join(repoRoot, "prisma/schema.prisma"), "utf8")}\nmodel SchemaDriftFixture {\n  id Int @id\n}\n`,
    );
    const run = spawnSync("sh", [script, drifted], { cwd: repoRoot, encoding: "utf8" });
    expect(run.status, run.stdout + run.stderr).toBe(2);
    expect(run.stdout).toContain("SchemaDriftFixture");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run it and watch it fail.** `npx playwright test --project=api tests/api/schema-drift.spec.ts`.
  **Prediction:** both fail (the script does not exist: `sh` exits 127).

- [ ] **Step 3: Write `scripts/schema-drift.sh`.**

```sh
#!/bin/sh
# T-13 (T-02 hand-off): fails when prisma/schema.prisma describes a database that the migrations
# do not build. Run it after `prisma migrate deploy` (the CI `api` job and `npm run db:reset` do):
# it diffs the migrated database named by DATABASE_URL against the schema. Exit 0 = no difference,
# 2 = drift (Prisma's own --exit-code), 1 = Prisma could not run. An optional argument is the
# schema to compare against — tests/api/schema-drift.spec.ts passes one with an extra model.
set -eu
schema="${1:-prisma/schema.prisma}"
exec npx prisma migrate diff --from-config-datasource --to-schema "$schema" --exit-code
```
  `package.json`: `"db:drift": "sh scripts/schema-drift.sh"`.

- [ ] **Step 4: Run the test again** with the local database migrated (`npm run db:reset` first).
  **Measured in the planning session** (these two files, run against the locally migrated
  database): 2 passed in 5.3 s — exit 0 on the real schema, exit 2 naming `SchemaDriftFixture`
  on the extra model. **CI:** no new step — the `api` job already runs `prisma migrate deploy` and then
  `npm run test:api`, which now includes this file. Add one line to `tests/api/README.md` saying the
  file needs a migrated database.

- [ ] **Step 5: Commit** — `test(ci): fail when the schema and the migrations disagree`.
  Format first: `npx prettier --write tests/api/schema-drift.spec.ts`.

---

