#!/bin/sh
# T-13 (T-02 hand-off): fails when prisma/schema.prisma describes a database that the migrations
# do not build. Run it after `prisma migrate deploy` (the CI `api` job and `npm run db:reset` do):
# it diffs the migrated database that prisma.config.ts names (DATABASE_URL_UNPOOLED when set, else
# DATABASE_URL — `migrationDatabaseUrl`, T-14) against the schema. Exit 0 = no difference,
# 2 = drift (Prisma's own --exit-code), 1 = Prisma could not run. An optional argument is the
# schema to compare against — tests/api/schema-drift.spec.ts passes one with an extra model.
set -eu
schema="${1:-prisma/schema.prisma}"
exec npx prisma migrate diff --from-config-datasource --to-schema "$schema" --exit-code
