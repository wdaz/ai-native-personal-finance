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
 * `DATABASE_URL` the reset would — prisma.config.ts has already loaded `.env.local`. It is the
 * second line for `npm run db:reset`: prisma.config.ts refuses that script before `prisma migrate
 * deploy`, its first half, applies any migration (the owner's choice, 2026-09-25). A direct `npx
 * prisma migrate deploy` is not guarded — T-14 runs it against Neon — and this check is also the
 * only one for `npx prisma db seed`.
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
