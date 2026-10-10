import { expect, test, type APIRequestContext } from "@playwright/test";
import { transactionsPage } from "@/src/domain/transactions";
import { createDb, type Db } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { CATEGORY_LABEL } from "@/src/server/overview";
import { seedRows } from "@/src/server/seed";
import { applyVariant, SEED_VARIANTS, type SeedVariant } from "@/src/server/variants";
import { CATEGORIES } from "@/src/shared/enums";
import {
  ErrorEnvelopeSchema,
  TransactionsDtoSchema,
  type TransactionsDto,
} from "@/src/shared/schemas";
import {
  parseTransactionsQuery,
  TRANSACTION_SORTS,
  TRANSACTIONS_Q_MAX,
} from "@/src/shared/transactions-query";

let db: Db;
test.beforeAll(() => {
  db = createDb(databaseUrl());
});
test.afterAll(async () => {
  await db.$disconnect();
});

async function login(request: APIRequestContext) {
  const response = await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  expect(response.status()).toBe(200);
}

async function seedAndLogin(request: APIRequestContext, variant: SeedVariant = "seed") {
  expect((await request.post("/api/test/seed", { data: { variant } })).status()).toBe(200);
  await login(request); // after seeding: the reset invalidates any earlier session
}

/**
 * The independent oracle (the overview.spec.ts rule): the rows POST /api/test/seed inserts,
 * through the domain's own functions, with no HTTP and no Prisma round trip — and never
 * scripts/seed-figures.ts. The database assigns the ids, so the oracle compares every field
 * but the id, in order; the ids are checked separately against the database.
 */
function expected(variant: SeedVariant, search: string) {
  const { query } = parseTransactionsQuery(new URLSearchParams(search), { strict: true });
  const rows = applyVariant(seedRows(), variant).transactions.map((t, index) => ({
    ...t,
    id: String(index),
    // seedRows() holds the Prisma key ("PersonalCare"); the API filters display names.
    // tests/unit/server/overview.test.ts establishes the map on its own.
    category: CATEGORY_LABEL.get(t.category) ?? t.category,
    date: new Date(t.date),
  }));
  // The seed has no two rows tied on every key before the id (transactions.md 4.4), so the
  // oracle's stand-in ids never decide an order the database's ids would decide otherwise.
  const page = transactionsPage(rows, query);
  return {
    items: page.items.map((t) => [t.name, t.avatar, t.category, t.date.toISOString(), t.amount]),
    page: page.page,
    pageCount: page.pageCount,
    total: page.total,
  };
}

const actual = (dto: TransactionsDto) => ({
  items: dto.items.map((t) => [t.name, t.avatar, t.category, t.date, t.amount]),
  page: dto.page,
  pageCount: dto.pageCount,
  total: dto.total,
});

async function getList(request: APIRequestContext, search: string) {
  const response = await request.get(`/api/transactions${search ? `?${search}` : ""}`);
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  return TransactionsDtoSchema.parse(await response.json());
}

test("US-39 AC4 SPEC-transactions 2.13: without a session the API answers 401 unauthenticated", async ({
  request,
}) => {
  expect((await request.post("/api/test/reset")).status()).toBe(200);
  const response = await request.get("/api/transactions");
  expect(response.status()).toBe(401);
  expect(ErrorEnvelopeSchema.parse(await response.json()).error).toBe("unauthenticated");
});

for (const variant of SEED_VARIANTS) {
  test(`US-09 US-36 AC2: ${variant} — the default view is the domain's page of the stored rows, strict DTO, no-store`, async ({
    request,
  }) => {
    await seedAndLogin(request, variant);
    expect(actual(await getList(request, ""))).toEqual(expected(variant, ""));
  });
}

// transactions.md 4.3–4.6: every sort, the search and filter examples, the Budgets links.
const VIEWS = [
  ...TRANSACTION_SORTS.flatMap((sort) => [`sort=${sort}`, `sort=${sort}&page=5`]),
  "q=a",
  "q=a&page=5",
  "q=co",
  "q=EMMA",
  "q=bill",
  "q=xyz",
  "q=%20",
  "q=a&category=Dining+Out",
  "q=co&category=Entertainment",
  "category=Dining+Out&page=1",
  "category=Dining%20Out&page=1",
  "category=Entertainment&page=1",
  "category=General&page=2",
  "q=co&category=Dining+Out&sort=z-to-a&page=1",
];

test("US-10 US-11 US-12 US-39 AC2: every view of 4.3–4.6 matches the domain, with ids from the database", async ({
  request,
}) => {
  await seedAndLogin(request);
  const stored = new Set(
    (await db.transaction.findMany({ select: { id: true } })).map((r) => r.id),
  );
  for (const view of VIEWS) {
    const dto = await getList(request, view);
    expect(actual(dto), view).toEqual(expected("seed", view));
    for (const item of dto.items) expect(stored.has(item.id), view).toBe(true);
  }
});

test("US-09 AC4: a page beyond the end, or not a page number, is clamped — never an error", async ({
  request,
}) => {
  await seedAndLogin(request);
  const last = await getList(request, "page=99");
  expect(last.page).toBe(last.pageCount);
  expect(actual(last)).toEqual(expected("seed", "page=99"));
  for (const page of ["0", "-3", "1.5", "abc"]) {
    expect((await getList(request, `page=${page}`)).page).toBe(1);
  }
});

test("US-11 US-12 US-10 §9 Q3: a bad sort, category or search is a 400 that names the allowed values, no-store", async ({
  request,
}) => {
  await seedAndLogin(request);
  const cases = [
    ["sort=nope", "sort", "invalid_format", `sort must be one of: ${TRANSACTION_SORTS.join(", ")}`],
    [
      "category=dining+out",
      "category",
      "invalid_format",
      `category must be one of: ${CATEGORIES.join(", ")}`,
    ],
    [
      `q=${"a".repeat(TRANSACTIONS_Q_MAX + 1)}`,
      "q",
      "too_long",
      `q must be at most ${TRANSACTIONS_Q_MAX} characters`,
    ],
  ] as const;
  for (const [search, field, code, message] of cases) {
    const response = await request.get(`/api/transactions?${search}`);
    expect(response.status(), search).toBe(400);
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(ErrorEnvelopeSchema.parse(await response.json())).toEqual({
      error: "validation",
      message,
      issues: [{ path: [field], code }],
    });
  }
  expect(
    (await request.get(`/api/transactions?q=${"a".repeat(TRANSACTIONS_Q_MAX)}`)).status(),
  ).toBe(200);
});

test("US-39 AC2 SPEC-write-path 7.2: a GET leaves the stored rows unchanged", async ({
  request,
}) => {
  await seedAndLogin(request);
  const counts = () =>
    Promise.all([
      db.transaction.count(),
      db.budget.count(),
      db.pot.count(),
      db.balance.findFirst(),
    ]);
  const before = await counts();
  await getList(request, "");
  await getList(request, "sort=highest&page=2");
  expect((await request.get("/api/transactions?sort=nope")).status()).toBe(400);
  expect(await counts()).toEqual(before);
});
