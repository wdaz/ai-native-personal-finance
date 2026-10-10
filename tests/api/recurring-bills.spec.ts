import { expect, test, type APIRequestContext } from "@playwright/test";
import { billsList, billsTotals, recurringBills } from "@/src/domain/bills";
import { BUSINESS_TODAY, fixedClock } from "@/src/domain/clock";
import { createDb, type Db } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { seedRows } from "@/src/server/seed";
import { applyVariant, SEED_VARIANTS, type SeedVariant } from "@/src/server/variants";
import {
  BILL_SORTS,
  BILL_STATUSES,
  parseRecurringBillsQuery,
  RECURRING_BILLS_Q_MAX,
} from "@/src/shared/recurring-bills-query";
import {
  ErrorEnvelopeSchema,
  RecurringBillsDtoSchema,
  type RecurringBillsDto,
} from "@/src/shared/schemas";

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
 * through the domain's own functions on the business day, with no HTTP and no Prisma round
 * trip — and never scripts/seed-figures.ts. A bill has no id, so every field is compared.
 */
function expected(variant: SeedVariant, search: string): RecurringBillsDto {
  const { query } = parseRecurringBillsQuery(new URLSearchParams(search), { strict: true });
  const bills = recurringBills(
    applyVariant(seedRows(), variant).transactions.map((t) => ({ ...t, date: new Date(t.date) })),
    fixedClock(BUSINESS_TODAY),
  );
  const row = ({ count, amount }: { count: number; amount: number }) => ({ count, amount });
  const totals = billsTotals(bills);
  return {
    items: billsList(bills, query).map((bill) => ({
      name: bill.name,
      avatar: bill.latest.avatar,
      day: bill.day,
      amount: bill.amount,
      status: bill.status,
    })),
    summary: {
      total: row(totals.total),
      paid: row(totals.paid),
      totalUpcoming: row(totals.totalUpcoming),
      dueSoon: row(totals.dueSoon),
    },
  };
}

async function getBills(request: APIRequestContext, search: string) {
  const response = await request.get(`/api/recurring-bills${search ? `?${search}` : ""}`);
  expect(response.status(), search).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  return RecurringBillsDtoSchema.parse(await response.json());
}

test("US-39 AC4 SPEC-recurring-bills 2.11: without a session the API answers 401 unauthenticated", async ({
  request,
}) => {
  expect((await request.post("/api/test/reset")).status()).toBe(200);
  const response = await request.get("/api/recurring-bills");
  expect(response.status()).toBe(401);
  expect(ErrorEnvelopeSchema.parse(await response.json()).error).toBe("unauthenticated");
});

for (const variant of SEED_VARIANTS) {
  test(`US-27 US-28 US-30 AC2 US-36 AC2: ${variant} — the bills and the summary are the domain's over the stored rows, strict DTO, no-store`, async ({
    request,
  }) => {
    await seedAndLogin(request, variant);
    expect(await getBills(request, "")).toEqual(expected(variant, ""));
  });
}

// recurring-bills.md 4.3–4.5: every sort, the search examples, and the status filter alone and
// with a search and a sort.
const VIEWS = [
  ...BILL_SORTS.map((sort) => `sort=${sort}`),
  ...BILL_STATUSES.map((status) => `status=${status}`),
  "q=a",
  "q=e",
  "q=co",
  "q=data",
  "q=BYTE",
  "q=%26",
  "q=spa+%26+w",
  "q=%20%20flow%20%20",
  "q=%20",
  "q=bill",
  "q=Bills",
  "q=xyz",
  "q=e&status=upcoming&sort=highest",
  "q=e&status=paid&sort=a-to-z",
  "q=data&status=paid",
];

test("US-29 AC1 US-30 AC1 US-39 AC2: every view of 4.3–4.5 matches the domain", async ({
  request,
}) => {
  await seedAndLogin(request);
  for (const view of VIEWS) {
    expect(await getBills(request, view), view).toEqual(expected("seed", view));
  }
});

test("US-28 AC1: the summary is over every bill, whatever the search and the status", async ({
  request,
}) => {
  await seedAndLogin(request);
  const { summary } = await getBills(request, "");
  for (const view of ["q=bill", "q=data", "status=paid", "q=e&status=upcoming"]) {
    expect((await getBills(request, view)).summary, view).toEqual(summary);
  }
});

const SORT_MESSAGE = `sort must be one of: ${BILL_SORTS.join(", ")}`;
const STATUS_MESSAGE = `status must be one of: ${BILL_STATUSES.join(", ")}`;
const Q_MESSAGE = `q must be at most ${RECURRING_BILLS_Q_MAX} characters`;
const LONG_Q = `q=${"a".repeat(RECURRING_BILLS_Q_MAX + 1)}`;

test("US-30 US-29 §9 RB-Q7 (a): a bad sort, status or search is a 400 that names the allowed values, no-store", async ({
  request,
}) => {
  await seedAndLogin(request);
  const cases = [
    ["sort=nope", [{ path: ["sort"], code: "invalid_format" }], SORT_MESSAGE],
    ["status=late", [{ path: ["status"], code: "invalid_format" }], STATUS_MESSAGE],
    [LONG_Q, [{ path: ["q"], code: "too_long" }], Q_MESSAGE],
    [
      `status=late&sort=nope&${LONG_Q}`,
      [
        { path: ["q"], code: "too_long" },
        { path: ["sort"], code: "invalid_format" },
        { path: ["status"], code: "invalid_format" },
      ],
      [Q_MESSAGE, SORT_MESSAGE, STATUS_MESSAGE].join("; "),
    ],
  ] as const;
  for (const [search, issues, message] of cases) {
    const response = await request.get(`/api/recurring-bills?${search}`);
    expect(response.status(), search).toBe(400);
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(ErrorEnvelopeSchema.parse(await response.json())).toEqual({
      error: "validation",
      message,
      issues,
    });
  }
  expect(
    (await request.get(`/api/recurring-bills?q=${"a".repeat(RECURRING_BILLS_Q_MAX)}`)).status(),
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
  await getBills(request, "");
  await getBills(request, "q=e&status=upcoming&sort=highest");
  expect((await request.get("/api/recurring-bills?status=late")).status()).toBe(400);
  expect(await counts()).toEqual(before);
});
