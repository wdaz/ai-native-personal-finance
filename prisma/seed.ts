import { createDb } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { resetToSeed } from "@/src/server/reset";

/**
 * `npm run db:reset` and Prisma's seed step (prisma.config.ts): SPEC-reset-and-test-support
 * §2.5 — the seed goes in with a `ResetLog` row of reason "manual", so the last reset time
 * always exists.
 */
const db = createDb(databaseUrl());
try {
  const { at, rows } = await resetToSeed(db, "manual");
  console.log(`reset reason=manual rows=${rows} at=${at.toISOString()}`);
} finally {
  await db.$disconnect();
}
