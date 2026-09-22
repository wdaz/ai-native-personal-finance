# prisma

Schema, migrations, seed script, and the `data.json` copy with its checksum test
(ADR-0005).

- `schema.prisma` — the six tables of `docs/02-architecture/data-model.md`; the client is
  generated into `src/server/generated/prisma`.
- `migrations/` — committed, applied by `npx prisma migrate deploy` (and by `npm run db:reset`).
- `data.json` — a byte-for-byte copy of `docs/00-discovery/inputs/data.json`
  (`tests/unit/seed.test.ts` compares them); not formatted by Prettier.
- `seed.ts` — `npm run db:reset`: `resetToSeed(db, "manual")` (SPEC-reset-and-test-support §2.5).
  It lives here rather than in `scripts/`, which may not import `src/server` (ADR-0002).
