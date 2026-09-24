import type { Page } from "@playwright/test";
import { seedFigures } from "@/scripts/seed-figures";
import { FEW_TRANSACTIONS } from "@/src/server/variants";
import { COPY } from "@/src/shared/copy";
import { formatDate } from "@/src/shared/dates";
import { formatMoney, formatSignedMoney } from "@/src/shared/money";
import {
  expect,
  loginViaApi,
  resetDemoData,
  seriousA11yViolations,
  tabTo,
  test,
} from "../fixtures/e2e";

const GREY_500 = "rgb(105, 104, 104)";
const GREY_900 = "rgb(32, 31, 36)";

/**
 * The four card links, by their own card's heading rather than position (ADR-0003/
 * `tests/e2e/README.md`: no `.first()` — extended here to `.nth()`/`.last()` too, since
 * nothing else in this suite uses a positional locator either). Each card renders its heading
 * and its link as siblings under one wrapper (`.header` in every `src/ui/overview/*Card.tsx`),
 * so the heading's own parent scopes the link unambiguously, in the order they sit on the page
 * (SPEC-overview §6 grid).
 */
const CARD_LINKS = [
  { heading: "Pots", label: "See Details ›" },
  { heading: "Transactions", label: "View All ›" },
  { heading: "Budgets", label: "See Details ›" },
  { heading: "Recurring Bills", label: "See Details ›" },
] as const;

function cardLink(page: Page, heading: string, label: string) {
  return page
    .getByRole("heading", { name: heading, exact: true })
    .locator("..")
    .getByRole("link", { name: label });
}

/**
 * build-workflow.md: "Any seed-derived figure in code or tests comes from
 * `scripts/seed-figures.ts`, never typed" (the T-10 backlog row's own hand-off repeats this
 * for E2E specifically). `seedFigures()` computes the same `overviewSummary` the live page's
 * `getOverview` does, from `prisma/data.json` on the fixed business clock — the single source
 * every expected figure below is read from, formatted through the same `src/shared`
 * functions the components use.
 */
const FIGURES = seedFigures();

async function seedVariant(request: import("@playwright/test").APIRequestContext, variant: string) {
  const response = await request.post("/api/test/seed", { data: { variant } });
  expect(response.status()).toBe(200);
}

test.beforeEach(async ({ page, request }) => {
  await resetDemoData(request);
  await loginViaApi(page);
});

test("US-04 AC1 AC3: default seed shows Current Balance, Income and Expenses (SPEC-overview §4.3)", async ({
  page,
}) => {
  await page.goto("/overview");
  await expect(page.getByText("Current Balance")).toBeVisible();
  await expect(page.getByText(formatMoney(FIGURES.balance.current))).toBeVisible();
  await expect(page.getByText("Income")).toBeVisible();
  await expect(page.getByText(formatMoney(FIGURES.balance.income))).toBeVisible();
  await expect(page.getByText("Expenses")).toBeVisible();
  await expect(page.getByText(formatMoney(FIGURES.balance.expenses))).toBeVisible();
});

test("US-05 AC1 AC3: Pots card total and first four pots; 'See Details' navigates to /pots", async ({
  page,
  baseURL,
}) => {
  const firstPot = FIGURES.pots.items[0]!;
  const lastPot = FIGURES.pots.items.at(-1)!;
  await page.goto("/overview");
  await expect(page.getByText("Total Saved")).toBeVisible();
  await expect(page.getByText(formatMoney(FIGURES.pots.total))).toBeVisible();
  await expect(page.getByText(firstPot.name)).toBeVisible();
  await expect(page.getByText(formatMoney(firstPot.total))).toBeVisible();
  await expect(page.getByText(lastPot.name)).toBeVisible();

  await cardLink(page, "Pots", "See Details ›").click();
  await expect(page).toHaveURL(`${baseURL}/pots`);
});

test("US-05 AC2: empty-pots variant shows the empty state and 'Add a pot' to /pots", async ({
  page,
  request,
}) => {
  await seedVariant(request, "empty-pots");
  await loginViaApi(page); // a seed bumps ResetLog, invalidating the prior session (T-08/T-09)
  await page.goto("/overview");
  await expect(page.getByText(COPY.potsEmpty)).toBeVisible();
  const addPot = page.getByRole("link", { name: COPY.addPot });
  await expect(addPot).toHaveAttribute("href", "/pots");
});

test("US-06 AC1 AC2: Transactions card shows five rows (SPEC-overview §4.3); 'View All' navigates to /transactions", async ({
  page,
  baseURL,
}) => {
  const first = FIGURES.transactions[0]!;
  const second = FIGURES.transactions[1]!;
  await page.goto("/overview");
  await expect(page.getByText(first.name)).toBeVisible();
  await expect(page.getByText(formatSignedMoney(first.amount))).toBeVisible();
  // Scoped to the row itself: two of the seed's five latest transactions share a date
  // (§4.3, "19 Aug 2026" twice), so the date text alone is not unique on the page.
  const firstRow = page.getByRole("img", { name: first.name }).locator("../..");
  await expect(firstRow.getByText(formatDate(first.date))).toBeVisible();
  await expect(page.getByText(second.name)).toBeVisible();
  await expect(page.getByText(formatSignedMoney(second.amount))).toBeVisible();
  await expect(page.getByRole("img", { name: FIGURES.transactions.at(-1)!.name })).toBeVisible();

  await cardLink(page, "Transactions", "View All ›").click();
  await expect(page).toHaveURL(`${baseURL}/transactions`);
});

test("US-06 AC3: few-transactions variant shows fewer than five rows", async ({
  page,
  request,
}) => {
  await seedVariant(request, "few-transactions");
  await loginViaApi(page);
  await page.goto("/overview");
  // `main img` — the transaction avatars specifically: the sidebar logo and the donut are
  // both <svg role="img">, not <img>, so a role-based query would over-count them.
  await expect(page.locator("main img")).toHaveCount(FEW_TRANSACTIONS);
});

test("US-06 AC3: empty-all variant shows 'No transactions yet'", async ({ page, request }) => {
  await seedVariant(request, "empty-all");
  await loginViaApi(page);
  await page.goto("/overview");
  await expect(page.getByText(COPY.transactionsEmpty)).toBeVisible();
});

test("US-07 AC1 AC3: Budgets card donut + legend (SPEC-overview §4.3); 'See Details' navigates to /budgets", async ({
  page,
  baseURL,
}) => {
  const firstBudget = FIGURES.budgets.items[0]!;
  const secondBudget = FIGURES.budgets.items[1]!;
  const label = `Spent ${formatMoney(FIGURES.budgets.spent)} of ${formatMoney(FIGURES.budgets.limit)} limit`;
  await page.goto("/overview");
  await expect(page.getByRole("img", { name: label })).toBeVisible();
  await expect(page.getByText(firstBudget.category, { exact: true })).toBeVisible();
  await expect(page.getByText(formatMoney(firstBudget.maximum))).toBeVisible();
  await expect(page.getByText(secondBudget.category, { exact: true })).toBeVisible();
  await expect(page.getByText(formatMoney(secondBudget.maximum))).toBeVisible();

  await cardLink(page, "Budgets", "See Details ›").click();
  await expect(page).toHaveURL(`${baseURL}/budgets`);
});

test("US-07 AC2: empty-budgets variant shows the empty state and 'Add a budget' to /budgets", async ({
  page,
  request,
}) => {
  await seedVariant(request, "empty-budgets");
  await loginViaApi(page);
  await page.goto("/overview");
  const emptyLabel = `Spent ${formatMoney(0)} of ${formatMoney(0)} limit`;
  await expect(page.getByRole("img", { name: emptyLabel })).toBeVisible();
  await expect(page.getByText(COPY.budgetsEmpty)).toBeVisible();
  const addBudget = page.getByRole("link", { name: COPY.addBudget });
  await expect(addBudget).toHaveAttribute("href", "/budgets");
});

test("US-08 AC1 AC2: Recurring Bills card figures (SPEC-overview §4.3); 'See Details' navigates to /recurring-bills", async ({
  page,
  baseURL,
}) => {
  await page.goto("/overview");
  await expect(page.getByText("Paid Bills")).toBeVisible();
  await expect(page.getByText(formatMoney(FIGURES.bills.paid))).toBeVisible();
  await expect(page.getByText("Total Upcoming")).toBeVisible();
  await expect(page.getByText(formatMoney(FIGURES.bills.upcoming))).toBeVisible();
  await expect(page.getByText("Due Soon")).toBeVisible();
  await expect(page.getByText(formatMoney(FIGURES.bills.dueSoon))).toBeVisible();

  await cardLink(page, "Recurring Bills", "See Details ›").click();
  await expect(page).toHaveURL(`${baseURL}/recurring-bills`);
});

test("US-08 AC3: no-recurring variant shows all three bills rows at $0.00", async ({
  page,
  request,
}) => {
  await seedVariant(request, "no-recurring");
  await loginViaApi(page);
  await page.goto("/overview");
  await expect(page.getByText("Paid Bills")).toBeVisible();
  await expect(page.getByText(formatMoney(0))).toHaveCount(3);
});

/**
 * US-32 AC1 AC3 — the four card links, in the order they sit on the page: Pots "See
 * Details", Transactions "View All", Budgets "See Details", Bills "See Details". This picks
 * up the walkthrough where `app-shell-keyboard.spec.ts`'s own already leaves off — its last
 * stop is the reset banner's "Dismiss notice" (the T-08 hand-off), reached here directly with
 * `.focus()` rather than re-walking the skip link/nav/footer stops that file already proves —
 * and continues Tab from there through this page's own new content. Every stop shows a
 * visible ring (`tabTo`); Enter on the last navigates.
 */
test("US-32 AC1 AC3 keyboard walkthrough: the four card links, each reachable and named, Enter navigates", async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/overview");

  await page.getByRole("button", { name: COPY.dismissNotice }).focus();

  for (const { heading, label } of CARD_LINKS) {
    await tabTo(page, cardLink(page, heading, label));
  }

  await cardLink(page, "Recurring Bills", "See Details ›").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`${baseURL}/recurring-bills`);
});

/**
 * US-32 AC1 AC3, SPEC-overview §7's literal "skip link → nav → four card links → footer":
 * at ≥1024 px the sidebar's footer (Log out, Minimize Menu) sits *before* `<main>` in the
 * DOM, so "→ footer" only reads as page-content-then-footer at a width where the footer is
 * the bottom nav bar instead (`Shell` renders it after `<main>`, adversarial review finding
 * 4). This is the full chain `app-shell-keyboard.spec.ts`'s own phone walkthrough
 * establishes for a placeholder page, with this page's four card links inserted between the
 * header's "Log out" and the bottom bar, since Overview is no longer a placeholder.
 */
test("US-32 AC1 AC3 phone walkthrough: skip link, header 'Log out', the four card links, the bottom bar", async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/overview");

  await tabTo(page, page.getByRole("link", { name: COPY.skipToContent }));
  await tabTo(page, page.getByRole("button", { name: COPY.dismissNotice }));
  await tabTo(page, page.getByRole("main").getByRole("button", { name: "Log out" }));

  for (const { heading, label } of CARD_LINKS) {
    await tabTo(page, cardLink(page, heading, label));
  }

  const bottomNav = page.getByRole("navigation", { name: "Main" });
  await tabTo(page, bottomNav.getByRole("link", { name: "Overview", exact: true }));

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`${baseURL}/overview`);
});

test.describe("US-34 hover and focus states (design-tokens.md 'Component states': tertiary)", () => {
  test("all four card links go grey-500 to grey-900 on hover and focus", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/overview");

    for (const { heading, label } of CARD_LINKS) {
      const link = cardLink(page, heading, label);
      await expect(link).toHaveCSS("color", GREY_500);
      await link.hover();
      await expect(link).toHaveCSS("color", GREY_900);
      await link.focus();
      await expect(link).toHaveCSS("color", GREY_900);
      // Move the mouse elsewhere so the next link's hover assertion starts from grey-500.
      await page.mouse.move(0, 0);
    }
  });
});

test("NFR-A1 axe: no serious or critical violation on /overview — default seed and empty-all, 1440 and 375 px", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/overview");
  await expect(page.getByText("Current Balance")).toBeVisible();
  await expect
    .poll(() => seriousA11yViolations(page), { message: "default seed desktop" })
    .toEqual([]);

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/overview");
  await expect(page.getByText("Current Balance")).toBeVisible();
  await expect
    .poll(() => seriousA11yViolations(page), { message: "default seed phone" })
    .toEqual([]);

  await seedVariant(request, "empty-all");
  await loginViaApi(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/overview");
  await expect(page.getByText(COPY.potsEmpty)).toBeVisible();
  await expect
    .poll(() => seriousA11yViolations(page), { message: "empty-all desktop" })
    .toEqual([]);

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/overview");
  await expect.poll(() => seriousA11yViolations(page), { message: "empty-all phone" }).toEqual([]);
});
