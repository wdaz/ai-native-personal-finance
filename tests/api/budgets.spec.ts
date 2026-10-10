import { expect, test, type APIRequestContext, type APIResponse } from "@playwright/test";
import { budgetsSummary } from "@/src/domain/budgets";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { createDb, type Db } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { CATEGORY_LABEL, THEME_LABEL } from "@/src/server/overview";
import { seedRows } from "@/src/server/seed";
import { applyVariant, SEED_VARIANTS, type SeedVariant } from "@/src/server/variants";
import { CATEGORIES, THEMES, type Category, type Theme } from "@/src/shared/enums";
import {
  BudgetsDtoSchema,
  BudgetWriteDtoSchema,
  ErrorEnvelopeSchema,
  type BudgetItemDto,
  type BudgetsDto,
} from "@/src/shared/schemas";

/**
 * SPEC-budgets 2.10, 2.11 and §7's API row; SPEC-write-path 7.2's rows that need a real write
 * route (T-23 plan D7). Every test seeds the database of DATABASE_URL and logs in after it.
 */
let db: Db;
test.beforeAll(() => {
  db = createDb(databaseUrl());
});
test.afterAll(async () => {
  await db.$disconnect();
});

const UNKNOWN_ID = "6f1d3c1e-8a2b-4c3d-9e4f-5a6b7c8d9e0f";
const JSON_TYPE = { "content-type": "application/json" };

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

const label = <T>(map: ReadonlyMap<string, T>, key: string): T => {
  const value = map.get(key);
  if (value === undefined) throw new Error(`No label for ${key}`);
  return value;
};

/** A budget or a latest row without its database id, for comparing with the oracle. */
const withoutIds = (dto: BudgetsDto) => ({
  spent: dto.spent,
  limit: dto.limit,
  items: dto.items.map((b) => ({
    category: b.category,
    theme: b.theme,
    maximum: b.maximum,
    spent: b.spent,
    remaining: b.remaining,
    latest: b.latest.map((t) => ({
      name: t.name,
      avatar: t.avatar,
      date: t.date,
      amount: t.amount,
    })),
  })),
});

/**
 * The independent oracle (the overview.spec.ts rule): the rows `POST /api/test/seed` inserts,
 * through the domain's own `budgetsSummary` on the business day, with no HTTP and no Prisma
 * round trip — and never scripts/seed-figures.ts. The ids are the database's, so they are
 * compared apart (`expectIdsStored`).
 */
function expected(variant: SeedVariant) {
  const rows = applyVariant(seedRows(), variant);
  const summary = budgetsSummary(
    {
      transactions: rows.transactions.map((t) => ({
        ...t,
        category: label(CATEGORY_LABEL, t.category),
        date: new Date(t.date),
      })),
      budgets: rows.budgets.map((b, index) => ({
        seq: index + 1,
        category: label(CATEGORY_LABEL, b.category),
        maximum: b.maximum,
        theme: label(THEME_LABEL, b.theme),
      })),
    },
    fixedClock(BUSINESS_TODAY),
  );
  return {
    items: summary.items.map((b) => ({
      category: b.category,
      theme: b.theme,
      maximum: b.maximum,
      spent: b.spent,
      remaining: b.remaining,
      latest: b.latest.map((t) => ({
        name: t.name,
        avatar: t.avatar,
        date: t.date.toISOString(),
        amount: t.amount,
      })),
    })),
    spent: summary.spent,
    limit: summary.limit,
  };
}

/** US-39 AC2: every id in the answer is a stored budget's or transaction's. */
async function expectIdsStored(dto: BudgetsDto) {
  const budgets = new Set((await db.budget.findMany({ select: { id: true } })).map((b) => b.id));
  const transactions = new Set(
    (await db.transaction.findMany({ select: { id: true } })).map((t) => t.id),
  );
  for (const item of dto.items) {
    expect(budgets.has(item.id), item.category).toBe(true);
    for (const row of item.latest) expect(transactions.has(row.id), row.name).toBe(true);
  }
}

async function getBudgets(request: APIRequestContext, search = ""): Promise<BudgetsDto> {
  const response = await request.get(`/api/budgets${search}`);
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  return BudgetsDtoSchema.parse(await response.json());
}

/** What a budget write must never touch (US-04 AC3, H6). */
async function untouched() {
  const balance = await db.balance.findFirstOrThrow();
  return {
    balance: [balance.current, balance.income, balance.expenses],
    pots: await db.pot.findMany({ orderBy: { seq: "asc" } }),
    transactions: await db.transaction.findMany({ orderBy: { id: "asc" } }),
  };
}

async function storedBudgets() {
  return db.budget.findMany({ orderBy: { seq: "asc" } });
}

const post = (request: APIRequestContext, data: unknown) =>
  request.post("/api/budgets", { headers: JSON_TYPE, data: JSON.stringify(data) });
const patch = (request: APIRequestContext, id: string, data: unknown) =>
  request.patch(`/api/budgets/${id}`, { headers: JSON_TYPE, data: JSON.stringify(data) });

async function issuesOf(response: APIResponse) {
  expect(response.status()).toBe(400);
  expect(response.headers()["cache-control"]).toBe("no-store");
  const body = ErrorEnvelopeSchema.parse(await response.json());
  expect(body.error).toBe("validation");
  return body.issues;
}

async function budgetOf(request: APIRequestContext, category: Category): Promise<BudgetItemDto> {
  const found = (await getBudgets(request)).items.find((b) => b.category === category);
  if (!found) throw new Error(`No budget for ${category}`);
  return found;
}

/** The seed's free values, from the stored rows: the first category and theme no budget holds. */
async function free(request: APIRequestContext) {
  const { items } = await getBudgets(request);
  const categories = CATEGORIES.filter((c) => !items.some((b) => b.category === c));
  const themes = THEMES.filter((t) => !items.some((b) => b.theme === t));
  return { categories, themes, items };
}

// ---------------------------------------------------------------------------------------
// GET /api/budgets — 2.11

test("US-39 AC4 SPEC-budgets 2.11: without a session the API answers 401 unauthenticated", async ({
  request,
}) => {
  expect((await request.post("/api/test/reset")).status()).toBe(200);
  const response = await request.get("/api/budgets");
  expect(response.status()).toBe(401);
  expect(ErrorEnvelopeSchema.parse(await response.json()).error).toBe("unauthenticated");
});

for (const variant of SEED_VARIANTS) {
  test(`US-14 US-18 US-20 AC1 US-36 AC2 US-39 AC2: ${variant} — the budgets are the domain's over the stored rows, strict DTO, no-store`, async ({
    request,
  }) => {
    await seedAndLogin(request, variant);
    const dto = await getBudgets(request);
    expect(withoutIds(dto)).toEqual(expected(variant));
    await expectIdsStored(dto);
  });
}

test("US-20 AC1: the totals equal GET /api/overview's budgets for the same data", async ({
  request,
}) => {
  await seedAndLogin(request);
  const dto = await getBudgets(request);
  const overview = await (await request.get("/api/overview")).json();
  expect({ spent: dto.spent, limit: dto.limit }).toEqual({
    spent: overview.budgets.spent,
    limit: overview.budgets.limit,
  });
});

test("SPEC-budgets 2.11: any query is ignored, and a GET leaves the stored rows unchanged (SPEC-write-path 7.2)", async ({
  request,
}) => {
  await seedAndLogin(request);
  const before = { budgets: await storedBudgets(), ...(await untouched()) };
  expect(await getBudgets(request, "?sort=z-to-a&category=Bills&page=9")).toEqual(
    await getBudgets(request),
  );
  expect({ budgets: await storedBudgets(), ...(await untouched()) }).toEqual(before);
});

// ---------------------------------------------------------------------------------------
// POST /api/budgets — 2.10

test("US-15 AC3 US-14 AC4: POST creates a budget, 201 with its spent, remaining and latest computed, listed last", async ({
  request,
}) => {
  await seedAndLogin(request);
  const before = await untouched();
  const { themes } = await free(request);
  const response = await post(request, { category: "General", maximum: 50_000, theme: themes[0] });
  expect(response.status()).toBe(201);
  expect(response.headers()["cache-control"]).toBe("no-store");
  const { budget } = BudgetWriteDtoSchema.parse(await response.json());
  const list = await getBudgets(request);
  expect(list.items.at(-1)).toEqual(budget);
  expect(list.items).toHaveLength(5);
  // The answer is the GET's own figures for the new budget (the domain's, on the business day).
  const rows = await db.transaction.findMany();
  const oracle = budgetsSummary(
    {
      transactions: rows.map((t) => ({
        ...t,
        category: label(CATEGORY_LABEL, t.category),
        amount: Number(t.amount),
      })),
      budgets: [{ seq: 1, category: "General", maximum: 50_000 }],
    },
    fixedClock(BUSINESS_TODAY),
  ).items[0]!;
  expect(budget.spent).toBe(oracle.spent);
  expect(budget.remaining).toBe(oracle.remaining);
  expect(budget.latest.map((t) => t.name)).toEqual(oracle.latest.map((t) => t.name));
  expect(budget.latest.some((t) => t.amount > 0)).toBe(true);
  expect(await untouched()).toEqual(before);
});

test("US-15 AC2: a used category and a used theme are both taken, in one answer, and nothing is written", async ({
  request,
}) => {
  await seedAndLogin(request);
  const { items } = await free(request);
  const before = await storedBudgets();
  const both = await post(request, {
    category: items[0]!.category,
    maximum: 100,
    theme: items[1]!.theme,
  });
  expect(await issuesOf(both)).toEqual([
    { path: ["category"], code: "taken" },
    { path: ["theme"], code: "taken" },
  ]);
  expect(await storedBudgets()).toEqual(before);
});

test("SPEC-budgets 2.10: a theme a pot holds is accepted (a budget's theme is unique among budgets only)", async ({
  request,
}) => {
  await seedAndLogin(request);
  const { categories, items } = await free(request);
  const budgetThemes = new Set<string>(items.map((b) => b.theme));
  const pots = await db.pot.findMany({ select: { theme: true } });
  const potTheme = pots
    .map((p) => label<Theme>(THEME_LABEL, p.theme))
    .find((t) => !budgetThemes.has(t));
  expect(potTheme).toBeDefined();
  const response = await post(request, { category: categories[0], maximum: 100, theme: potTheme });
  expect(response.status()).toBe(201);
});

test("US-15 AC2 US-31: the maximum's codes of SPEC-write-path 2.7, and unknown keys stripped", async ({
  request,
}) => {
  await seedAndLogin(request);
  const { categories, themes } = await free(request);
  const body = { category: categories[0], theme: themes[0] };
  for (const [maximum, code] of [
    [0, "too_small"],
    [-1, "too_small"],
    [1.5, "invalid_format"],
    ["100", "invalid_format"],
    [100_000_000_000, "too_large"],
    [null, "required"],
  ] as const) {
    expect(await issuesOf(await post(request, { ...body, maximum })), String(maximum)).toEqual([
      { path: ["maximum"], code },
    ]);
  }
  const created = await post(request, {
    ...body,
    maximum: 99_999_999_999,
    id: UNKNOWN_ID,
    seq: 1,
    spent: 5,
  });
  expect(created.status()).toBe(201);
  const { budget } = BudgetWriteDtoSchema.parse(await created.json());
  expect(budget.id).not.toBe(UNKNOWN_ID);
  expect(budget.maximum).toBe(99_999_999_999);
});

test("US-36 AC1 SPEC-write-path 2.8: two concurrent POSTs of one category → one 201, one taken (the unique constraint)", async ({
  request,
}) => {
  await seedAndLogin(request);
  const { categories, themes } = await free(request);
  const answers = await Promise.all([
    post(request, { category: categories[0], maximum: 100, theme: themes[0] }),
    post(request, { category: categories[0], maximum: 200, theme: themes[1] }),
  ]);
  const statuses = answers.map((a) => a.status()).sort();
  expect(statuses).toEqual([201, 400]);
  const refused = answers.find((a) => a.status() === 400)!;
  expect(await issuesOf(refused)).toEqual([{ path: ["category"], code: "taken" }]);
  expect(await db.budget.count()).toBe(5);
});

// ---------------------------------------------------------------------------------------
// PATCH /api/budgets/:id — 2.10

test("US-16 AC1 AC2: PATCH with all three fields answers 200, keeps the place in the list, and keeps its own category and theme", async ({
  request,
}) => {
  await seedAndLogin(request);
  const before = await untouched();
  const order = (await getBudgets(request)).items.map((b) => b.id);
  const dining = await budgetOf(request, "Dining Out");
  const response = await patch(request, dining.id, {
    category: dining.category,
    maximum: 15_000,
    theme: dining.theme,
  });
  expect(response.status()).toBe(200);
  const { budget } = BudgetWriteDtoSchema.parse(await response.json());
  expect(budget).toEqual({ ...dining, maximum: 15_000, remaining: 15_000 - dining.spent });
  expect((await getBudgets(request)).items.map((b) => b.id)).toEqual(order);
  expect(await untouched()).toEqual(before);
});

test("US-16 AC1: changing the category shows the new category's spent and latest", async ({
  request,
}) => {
  await seedAndLogin(request);
  const { categories } = await free(request);
  const dining = await budgetOf(request, "Dining Out");
  const response = await patch(request, dining.id, {
    category: categories[0],
    maximum: dining.maximum,
    theme: dining.theme,
  });
  expect(response.status()).toBe(200);
  const { budget } = BudgetWriteDtoSchema.parse(await response.json());
  expect(budget.category).toBe(categories[0]);
  expect(budget.id).toBe(dining.id);
  expect((await getBudgets(request)).items.find((b) => b.id === dining.id)).toEqual(budget);
});

test("US-31 SPEC-write-path 4.4: PATCH {} is required on all three fields and the budget is unchanged", async ({
  request,
}) => {
  await seedAndLogin(request);
  const dining = await budgetOf(request, "Dining Out");
  const before = await storedBudgets();
  expect(await issuesOf(await patch(request, dining.id, {}))).toEqual([
    { path: ["category"], code: "required" },
    { path: ["maximum"], code: "required" },
    { path: ["theme"], code: "required" },
  ]);
  for (const field of ["category", "maximum", "theme"] as const) {
    const body: Record<string, unknown> = { ...dining };
    delete body[field];
    expect(await issuesOf(await patch(request, dining.id, body)), field).toEqual([
      { path: [field], code: "required" },
    ]);
    expect(
      await issuesOf(await patch(request, dining.id, { ...dining, [field]: null })),
      `${field} null`,
    ).toEqual([{ path: [field], code: "required" }]);
  }
  expect(await storedBudgets()).toEqual(before);
});

test("US-16 AC1: PATCH to another budget's category or theme is taken; an unknown id is 404; a non-UUID id is 400", async ({
  request,
}) => {
  await seedAndLogin(request);
  const [first, second] = (await getBudgets(request)).items;
  const before = await storedBudgets();
  expect(
    await issuesOf(
      await patch(request, first!.id, {
        ...first,
        category: second!.category,
        theme: second!.theme,
      }),
    ),
  ).toEqual([
    { path: ["category"], code: "taken" },
    { path: ["theme"], code: "taken" },
  ]);
  const unknown = await patch(request, UNKNOWN_ID, first);
  expect(unknown.status()).toBe(404);
  expect(ErrorEnvelopeSchema.parse(await unknown.json())).toEqual({
    error: "not_found",
    message: "Not found",
  });
  expect(await issuesOf(await patch(request, "not-a-uuid", first))).toEqual([
    { path: ["id"], code: "invalid_format" },
  ]);
  expect(await storedBudgets()).toEqual(before);
});

// ---------------------------------------------------------------------------------------
// DELETE /api/budgets/:id — 2.8, 2.10

test("US-17 AC2 AC3 US-04 AC3: DELETE answers 204, then 404 on the same id; nothing else changes", async ({
  request,
}) => {
  await seedAndLogin(request);
  const before = await untouched();
  const entertainment = await budgetOf(request, "Entertainment");
  const deleted = await request.delete(`/api/budgets/${entertainment.id}`);
  expect(deleted.status()).toBe(204);
  expect(await deleted.body()).toHaveLength(0);
  expect(deleted.headers()["cache-control"]).toBe("no-store");
  const list = await getBudgets(request);
  expect(list.items.map((b) => b.id)).not.toContain(entertainment.id);
  expect(list.items).toHaveLength(3);
  const again = await request.delete(`/api/budgets/${entertainment.id}`);
  expect(again.status()).toBe(404);
  expect(await untouched()).toEqual(before);
});

// ---------------------------------------------------------------------------------------
// SPEC-write-path 7.2 and 7.3 on a real write route

test("US-36 SPEC-write-path 7.2: an id from before a reset is 404", async ({ request }) => {
  await seedAndLogin(request);
  const { id } = await budgetOf(request, "Bills");
  await seedAndLogin(request);
  const response = await patch(request, id, { category: "Bills", maximum: 100, theme: "Cyan" });
  expect(response.status()).toBe(404);
  expect((await request.delete(`/api/budgets/${id}`)).status()).toBe(404);
});

test("US-37 AC1 AC3 SPEC-write-path 7.2: at a pre-filled database a budget write commits, answers 409, logs a threshold reset, and the next request is 401", async ({
  request,
}) => {
  await seedAndLogin(request);
  const threshold = Number(process.env.RESET_ROW_THRESHOLD ?? 2000);
  await db.transaction.createMany({
    data: Array.from({ length: threshold }, (_, i) => ({
      name: `Not in the seed ${i}`,
      avatar: "not-in-the-seed",
      category: "General" as const,
      date: "2026-08-01T00:00:00Z",
      amount: -1,
      recurring: false,
    })),
  });
  const { categories, themes } = await free(request);
  const response = await post(request, { category: categories[0], maximum: 100, theme: themes[0] });
  expect(response.status()).toBe(409);
  expect(ErrorEnvelopeSchema.parse(await response.json())).toEqual({
    error: "conflict",
    message: "Data was reset",
  });
  const latest = await db.resetLog.findFirstOrThrow({ orderBy: { at: "desc" } });
  expect(latest.reason).toBe("threshold");
  expect(await db.transaction.count({ where: { seeded: false } })).toBe(0);
  expect((await request.get("/api/budgets")).status()).toBe(401);
});

test("US-37 AC1 SPEC-write-path 7.2: a threshold check that throws does not fail the route's write", async ({
  request,
}) => {
  // The running server's environment is fixed, so the route's handler runs in this process
  // against the same database, with a threshold that makes the check throw (T-23 plan F4).
  await seedAndLogin(request);
  const { categories, themes } = await free(request);
  const { POST } = await import("@/app/api/budgets/route");
  const saved = process.env.RESET_ROW_THRESHOLD;
  const error = console.error;
  process.env.RESET_ROW_THRESHOLD = "lots";
  console.error = () => {};
  try {
    const response = await POST(
      new Request("http://localhost/api/budgets", {
        method: "POST",
        headers: { ...JSON_TYPE, "x-forwarded-for": "203.0.113.23" },
        body: JSON.stringify({ category: categories[0], maximum: 100, theme: themes[0] }),
      }),
    );
    expect(response.status).toBe(201);
  } finally {
    if (saved === undefined) delete process.env.RESET_ROW_THRESHOLD;
    else process.env.RESET_ROW_THRESHOLD = saved;
    console.error = error;
  }
  expect((await getBudgets(request)).items.map((b) => b.category)).toContain(categories[0]);
});

test("US-36 SPEC-write-path 7.3: a same-origin write passes the proxy and reaches the budgets handler", async ({
  request,
}) => {
  await seedAndLogin(request);
  const response = await request.post("/api/budgets", {
    headers: { ...JSON_TYPE, "sec-fetch-site": "same-origin" },
    data: "{}",
  });
  expect(response.status()).toBe(400);
  expect(response.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  expect(await issuesOf(response)).toHaveLength(3);
});
