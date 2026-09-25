import { createDb } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { resetToSeed } from "@/src/server/reset";
import { localDatabaseRefusal } from "@/src/shared/env";

/**
 * `npm run db:reset` and Prisma's seed step (prisma.config.ts): SPEC-reset-and-test-support
 * §2.5 — the seed goes in with a `ResetLog` row of reason "manual", so the last reset time
 * always exists.
 *
 * It truncates every table, so it runs only against this machine's database (TD-10). The
 * check is here, in the process that makes the destructive call, so it reads the same
 * `DATABASE_URL` the reset would — prisma.config.ts has already loaded `.env.local`. `prisma
 * migrate deploy`, the first half of `db:reset`, is not guarded: T-14 runs it against Neon.
 */
const refusal = localDatabaseRefusal(process.env);
if (refusal !== null) {
  console.error(refusal);
  process.exit(1);
}
const db = createDb(databaseUrl());
try {
  const { at, rows } = await resetToSeed(db, "manual");
  console.log(`reset reason=manual rows=${rows} at=${at.toISOString()}`);
} finally {
  await db.$disconnect();
}
