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
