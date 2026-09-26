import { PrismaPg } from "@prisma/adapter-pg";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDb } from "@/src/server/db";

// The adapter and the generated client are replaced: what is asked of `createDb` is the options it
// gives the adapter, not a database.
vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: vi.fn() }));
vi.mock("@/src/server/generated/prisma/client", () => ({ PrismaClient: vi.fn() }));

const NEON =
  "postgresql://user:password@ep-cool-name-123456-pooler.eu-central-1.aws.neon.tech/neondb";

/**
 * TD-20: the pool's connection string is the one `createDb` was given with `sslmode=require` named
 * `verify-full` (`src/server/db-url.ts`) — the choice pinned here, so a change of `pg` or of the
 * adapter cannot drop certificate verification on the way to Neon without a test failing.
 */
describe("createDb", () => {
  beforeEach(() => {
    vi.mocked(PrismaPg).mockClear();
  });

  it("gives the adapter a connection string that names verify-full, not require", () => {
    createDb(`${NEON}?sslmode=require&channel_binding=require`);
    expect(PrismaPg).toHaveBeenCalledTimes(1);
    expect(PrismaPg).toHaveBeenCalledWith({
      connectionString: `${NEON}?sslmode=verify-full&channel_binding=require`,
    });
  });

  it("gives the local database's URL through unchanged", () => {
    const local = "postgresql://postgres:postgres@localhost:5432/personal_finance";
    createDb(local);
    expect(PrismaPg).toHaveBeenCalledWith({ connectionString: local });
  });
});
