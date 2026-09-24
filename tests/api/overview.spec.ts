import { expect, test } from "@playwright/test";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { overviewSummary } from "@/src/domain/overview";
import { createDb, type Db } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { CATEGORY_LABEL, THEME_LABEL } from "@/src/server/overview";
import { seedRows } from "@/src/server/seed";
import { applyVariant, SEED_VARIANTS } from "@/src/server/variants";
import { ErrorEnvelopeSchema, OverviewDtoSchema, type OverviewDto } from "@/src/shared/schemas";

let db: Db;
test.beforeAll(() => {
  db = createDb(databaseUrl());
});
test.afterAll(async () => {
  await db.$disconnect();
});

async function login(request: import("@playwright/test").APIRequestContext) {
  const response = await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  expect(response.status()).toBe(200);
}

test("SPEC-overview §6: an unauthenticated request answers 401 unauthenticated", async ({
  request,
}) => {
  const response = await request.get("/api/overview");
  expect(response.status()).toBe(401);
  expect(ErrorEnvelopeSchema.parse(await response.json()).error).toBe("unauthenticated");
});

test("SPEC-overview §6: exactly Cache-Control: no-store", async ({ request }) => {
  expect((await request.post("/api/test/reset")).status()).toBe(200);
  await login(request);
  const response = await request.get("/api/overview");
  expect(response.headers()["cache-control"]).toBe("no-store");
});

// The independent oracle: the exact rows POST /api/test/seed inserts (resetToSeed takes them
// verbatim), summarised by the same domain function getOverview calls, through a completely
// separate path (no HTTP, no Prisma round trip) — never scripts/seed-figures.ts (unproven in
// this test runner) and never CATEGORY_LABEL/THEME_LABEL for the *arithmetic*, only for the
// two label fields, whose own correctness tests/unit/server/overview.test.ts already
// establishes independently.
//
// This satisfies SPEC-overview §7's "matches OverviewDtoSchema and 4.3" for the "seed" variant
// without a *literal* §4.3 figure (e.g. "33800") appearing here: build-workflow.md forbids
// typing a seed-derived number by hand, and scripts/seed-figures.ts's own workedExample() —
// the one place §4.3's numbers are meant to come from — carries the same unproven-import risk
// this oracle exists to avoid (code review, PR #21). tests/unit/seed-figures.test.ts is what
// ties §4.3's text to scripts/seed-figures.ts; this file's "seed" case ties the live route's
// output to seedRows()/overviewSummary directly, which tests/unit/seed-figures.test.ts already
// checks agrees with scripts/seed-figures.ts's own seedOverviewInput() field for field.
function expectedShape(variant: (typeof SEED_VARIANTS)[number]) {
  const rows = applyVariant(seedRows(), variant);
  // SeedRows dates are still text and its budgets/pots carry no seq — resetToSeed's
  // RESTART IDENTITY assigns seq 1, 2, 3… in array order (the same assumption
  // scripts/seed-figures.ts's own seedOverviewInput() already relies on).
  const summary = overviewSummary(
    {
      balance: rows.balance,
      transactions: rows.transactions.map((t) => ({ ...t, date: new Date(t.date) })),
      budgets: rows.budgets.map((b, index) => ({ ...b, seq: index + 1 })),
      pots: rows.pots.map((p, index) => ({ ...p, seq: index + 1 })),
    },
    fixedClock(BUSINESS_TODAY),
  );
  return {
    balance: summary.balance,
    pots: {
      total: summary.pots.total,
      items: summary.pots.items.map((p) => [p.name, p.total, THEME_LABEL.get(p.theme)]),
    },
    transactions: summary.transactions.map((t) => [
      t.name,
      t.amount,
      t.date.toISOString(),
      t.avatar,
    ]),
    budgets: {
      spent: summary.budgets.spent,
      limit: summary.budgets.limit,
      items: summary.budgets.items.map((b) => [
        CATEGORY_LABEL.get(b.category),
        b.maximum,
        b.spent,
        THEME_LABEL.get(b.theme),
      ]),
    },
    bills: summary.bills,
  };
}

function actualShape(dto: OverviewDto) {
  return {
    balance: dto.balance,
    pots: { total: dto.pots.total, items: dto.pots.items.map((p) => [p.name, p.total, p.theme]) },
    transactions: dto.transactions.map((t) => [t.name, t.amount, t.date, t.avatar]),
    budgets: {
      spent: dto.budgets.spent,
      limit: dto.budgets.limit,
      items: dto.budgets.items.map((b) => [b.category, b.maximum, b.spent, b.theme]),
    },
    bills: dto.bills,
  };
}

for (const variant of SEED_VARIANTS) {
  test(`US-04…08 (§2.7 for a variant): ${variant} — GET /api/overview matches overviewSummary(applyVariant(seedRows(), "${variant}"), clock)`, async ({
    request,
  }) => {
    expect((await request.post("/api/test/seed", { data: { variant } })).status()).toBe(200);
    await login(request); // after seeding: resetToSeed bumps ResetLog, invalidating any earlier session
    const response = await request.get("/api/overview");
    expect(response.status()).toBe(200);
    const dto = OverviewDtoSchema.parse(await response.json());
    expect(actualShape(dto)).toEqual(expectedShape(variant));
  });
}

test("SPEC-overview: with no Balance row, the overview is unavailable — a 500, not zeros", async ({
  request,
}) => {
  expect((await request.post("/api/test/reset")).status()).toBe(200);
  await login(request);
  await db.balance.deleteMany();
  const response = await request.get("/api/overview");
  expect(response.status()).toBe(500);
  expect(ErrorEnvelopeSchema.parse(await response.json()).error).toBe("server_error");
});
