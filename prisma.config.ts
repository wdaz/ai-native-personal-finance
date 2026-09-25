import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";
import { localDatabaseRefusal, migrationDatabaseUrl } from "./src/shared/env";

// Prisma 7 reads no .env file of its own. Local settings live in .env.local (README, "Run
// locally"), as for Next.js; a variable already in the environment, such as CI's, wins.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

// TD-10 (the owner's choice, 2026-09-25): `npm run db:reset` is `prisma migrate deploy && prisma
// db seed`. The seed refuses another machine's database itself (prisma/seed.ts), but by then
// `migrate deploy` would have applied every pending migration of this checkout to it. So refuse
// here, when Prisma loads this config for db:reset's first step, after .env.local so the check
// reads the DATABASE_URL the command would use. Keyed on the npm script's name, not on the Prisma
// command: T-14 runs `npx prisma migrate deploy` on the deployed database directly, and CI does
// too, so a direct `migrate deploy` stays allowed. `process.exit`, not a throw: Prisma wraps a
// thrown error in "Failed to load config file <absolute path> as a TypeScript/JavaScript module".
if (process.env.npm_lifecycle_event === "db:reset") {
  const refusal = localDatabaseRefusal(process.env);
  if (refusal !== null) {
    console.error(refusal);
    process.exit(1);
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // T-14: the CLI connects through Neon's direct URL (`DATABASE_URL_UNPOOLED`) when the Neon
  // integration provides one, since migrations need a direct connection; else `DATABASE_URL`, as
  // locally and in CI. Optional here: `prisma generate` (postinstall) needs no database. The
  // migrate and seed commands stop with Prisma's own error when both are missing.
  datasource: { url: migrationDatabaseUrl(process.env) },
});
