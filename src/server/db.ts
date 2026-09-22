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
