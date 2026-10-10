import type { Locator, Page } from "@playwright/test";
import { budgetFigures } from "@/scripts/seed-figures";
import { donutCentreFit } from "@/src/shared/budgets";
import { COPY } from "@/src/shared/copy";
import { CATEGORIES, THEMES } from "@/src/shared/enums";
import { formatDate } from "@/src/shared/dates";
import { formatMoney, formatSignedMoney } from "@/src/shared/money";
import { BudgetsDtoSchema, type BudgetsDto } from "@/src/shared/schemas";
import { PAGE_NAMES } from "@/src/ui/nav";
import { expect, loginViaApi, resetDemoData, seriousA11yViolations, test } from "../fixtures/e2e";
import { RUN_MODE, callTool, expectToolsReady, listTools } from "../fixtures/webmcp";

/**
 * SPEC-budgets §7, the E2E and WebMCP rows: US-14 to US-20, US-31, US-33, US-34 (in part), US-36
 * AC1, US-38 to US-40 for this page, and axe. Every figure comes from `budgetFigures()`
 * (`scripts/seed-figures.ts`, H15 (2)), which runs the domain's own summary over the seed and the
 * worked writes of 4.6, and is formatted with the shared functions; none is typed. No time-based
 * waits: the tests wait for the page's own text, the URL or a response.
 */
const FIGURES = budgetFigures();
const SEED = FIGURES.seed;
/** NFR-S3's largest maximum, in cents. */
const LARGEST = 99_999_999_999;

declare global {
  interface Window {
    __noReload?: boolean;
  }
}

const cards = (page: Page) => page.locator("main section[aria-labelledby]");
const card = (page: Page, category: string) =>
  page.getByRole("region", { name: category, exact: true });
const cardTitles = (page: Page) => cards(page).getByRole("heading", { level: 2 });
const donut = (page: Page) => page.getByRole("img", { name: /^Spent / });
const summaryList = (page: Page) => page.getByRole("list", { name: COPY.spendingSummary });
const addButton = (page: Page) => page.getByRole("button", { name: COPY.addNewBudget });
const modal = (page: Page) => page.getByRole("dialog");
const maximumField = (page: Page) => page.getByRole("textbox", { name: COPY.maximumSpend });
const categoryTrigger = (page: Page) =>
  modal(page).getByRole("button", { name: new RegExp(`^${COPY.budgetCategory}`) });
const option = (page: Page, label: string) =>
  page.getByRole("option", { name: new RegExp(`^${label}( ?,|$)`) });
const optionsMenu = (page: Page) =>
  page.getByRole("button", { name: COPY.menuTriggerName(COPY.budgetOptions, "Dining Out") });
const menuFor = (page: Page, category: string) =>
  page.getByRole("button", { name: COPY.menuTriggerName(COPY.budgetOptions, category) });

/** A Latest Spending row's text: the name, then the signed amount over the date (4.4). */
const latestText = (t: { name: string; date: Date; amount: number }) =>
  `${t.name}${formatSignedMoney(t.amount)}${formatDate(t.date)}`;
const summaryRowText = (b: { category: string; spent: number; maximum: number }) =>
  `${b.category}${formatMoney(b.spent)}${COPY.budgetOfMaximum(formatMoney(b.maximum))}`;
const donutName = (summary: { spent: number; limit: number }) =>
  `Spent ${formatMoney(summary.spent)} of ${formatMoney(summary.limit)} limit`;

async function seedVariant(page: Page, variant: string) {
  const response = await page.request.post("/api/test/seed", { data: { variant } });
  expect(response.status()).toBe(200);
  await loginViaApi(page); // a seed ends every session
}

async function budgetsNow(page: Page): Promise<BudgetsDto> {
  const response = await page.request.get("/api/budgets");
  expect(response.status()).toBe(200);
  return BudgetsDtoSchema.parse(await response.json());
}

/** Marks the window, as `webmcp.spec.ts` does, so a full reload would lose the marker. */
async function markWindow(page: Page) {
  await page.evaluate(() => (window.__noReload = true));
}
async function expectNoReload(page: Page) {
  expect(await page.evaluate(() => window.__noReload)).toBe(true);
}

async function expectSeedCards(page: Page) {
  await expect(cardTitles(page)).toHaveText(SEED.items.map((b) => b.category));
  for (const b of SEED.items) {
    const it = card(page, b.category);
    await expect(it.getByText(COPY.budgetMaximumOf(formatMoney(b.maximum)))).toBeVisible();
    await expect(it.locator("dd")).toHaveText([formatMoney(b.spent), formatMoney(b.remaining)]);
  }
}

async function openAdd(page: Page) {
  await addButton(page).click();
  await expect(modal(page)).toBeVisible();
}

async function choose(page: Page, trigger: Locator, label: string) {
  await trigger.click();
  await option(page, label).click();
}

/** Adds a budget through the API, as another tab would. */
async function addViaApi(page: Page, category: string, maximum: number, theme: string) {
  const response = await page.request.post("/api/budgets", {
    data: { category, maximum, theme },
  });
  expect(response.status(), `POST /api/budgets ${category}`).toBe(201);
}

/** Ten budgets, each at the largest maximum: the six free categories added, the seed's four edited. */
async function tenLargestBudgets(page: Page) {
  const now = await budgetsNow(page);
  const usedThemes = new Set(now.items.map((b) => b.theme));
  const freeThemes = THEMES.filter((t) => !usedThemes.has(t));
  for (const b of now.items) {
    const response = await page.request.patch(`/api/budgets/${b.id}`, {
      data: { category: b.category, maximum: LARGEST, theme: b.theme },
    });
    expect(response.status()).toBe(200);
  }
  for (const [index, category] of FIGURES.freeCategories.entries()) {
    await addViaApi(page, category, LARGEST, freeThemes[index] ?? "Green");
  }
}

test.beforeEach(async ({ page, request }) => {
  await resetDemoData(request);
  await loginViaApi(page);
});

test.describe("US-14 the budgets", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("US-14 AC1 AC2 AC4: four cards in creation order, Maximum of, Spent and Remaining; Dining Out's bar full", async ({
    page,
  }) => {
    await page.goto("/budgets");
    await expect(page).toHaveTitle(`Personal Finance - ${PAGE_NAMES.budgets}`);
    await expect(page.getByText(COPY.comingInRelease2, { exact: true })).toHaveCount(0);
    await expectSeedCards(page);
    const over = SEED.items.find((b) => b.spent >= b.maximum);
    expect(over?.category).toBe("Dining Out");
    const it = card(page, "Dining Out");
    await expect(it.locator("dd").nth(1)).toHaveText(formatMoney(0));
    const track = await it.locator("rect").locator("..").boundingBox();
    const fill = await it.locator("rect").boundingBox();
    expect(Math.round(fill?.width ?? 0)).toBe(Math.round(track?.width ?? -1));
  });

  test("US-14 AC3 US-20 with empty-budgets: 'No budgets yet', the header's button the only Add New Budget, the empty donut", async ({
    page,
  }) => {
    await seedVariant(page, "empty-budgets");
    await page.goto("/budgets");
    await expect(page.getByText(COPY.budgetsEmpty, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Add New Budget/ })).toHaveCount(1);
    await expect(donut(page)).toHaveAccessibleName(donutName({ spent: 0, limit: 0 }));
    await expect(page.getByRole("list", { name: COPY.spendingSummary })).toHaveCount(0);
    await expect(cards(page)).toHaveCount(0);
  });
});

test.describe("US-15 add a budget", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("US-15 AC1: the used categories are 'Already used' and not choosable; the first free one is chosen", async ({
    page,
  }) => {
    await page.goto("/budgets");
    await openAdd(page);
    await expect(categoryTrigger(page)).toHaveAccessibleName(
      COPY.menuTriggerName(COPY.budgetCategory, FIGURES.freeCategories[0] ?? ""),
    );
    await categoryTrigger(page).click();
    for (const category of CATEGORIES) {
      const used = SEED.items.some((b) => b.category === category);
      const it = option(page, category);
      if (used) {
        await expect(it).toHaveAccessibleName(new RegExp(`^${category} ?, ${COPY.alreadyUsed}$`));
        await expect(it).toHaveAttribute("aria-disabled", "true");
      } else {
        await expect(it).not.toHaveAttribute("aria-disabled", "true");
      }
    }
  });

  test("US-15 AC2 US-31: a missing and an invalid Maximum Spend show their message, tied to the field, and send nothing", async ({
    page,
  }) => {
    const posts: string[] = [];
    page.on("request", (r) => {
      if (r.method() === "POST" && new URL(r.url()).pathname === "/api/budgets")
        posts.push(r.url());
    });
    await page.goto("/budgets");
    await openAdd(page);
    await modal(page).getByRole("button", { name: COPY.addBudgetSubmit }).click();
    await expect(maximumField(page)).toBeFocused();
    await expect(maximumField(page)).toHaveAttribute("aria-invalid", "true");
    await expect(maximumField(page)).toHaveAccessibleDescription(COPY.required);
    await maximumField(page).fill("abc");
    // UK-Q9 (a): typing neither shows nor clears a message.
    await expect(maximumField(page)).toHaveAccessibleDescription(COPY.required);
    await maximumField(page).blur();
    await expect(maximumField(page)).toHaveAccessibleDescription(COPY.amountFormat);
    await maximumField(page).fill("0");
    await modal(page).getByRole("button", { name: COPY.addBudgetSubmit }).click();
    await expect(maximumField(page)).toHaveAccessibleDescription(COPY.amountNotPositive);
    expect(posts).toEqual([]);
  });

  test("US-15 AC3 US-20: add General $500.00 → the fifth card with its spent and latest, the summary and Overview, no reload", async ({
    page,
  }) => {
    const after = FIGURES.writes.addGeneral;
    const general = after.items.at(-1)!;
    await page.goto("/budgets");
    await markWindow(page);
    await openAdd(page);
    await choose(page, categoryTrigger(page), "General");
    await maximumField(page).fill("500");
    await modal(page).getByRole("button", { name: COPY.addBudgetSubmit }).click();
    await expect(modal(page)).toHaveCount(0);
    await expect(cardTitles(page)).toHaveText(after.items.map((b) => b.category));
    const it = card(page, "General");
    await expect(it.locator("dd")).toHaveText([
      formatMoney(general.spent),
      formatMoney(general.remaining),
    ]);
    await expect(it.getByRole("listitem")).toHaveText(general.latest.map(latestText));
    await expect(donut(page)).toHaveAccessibleName(donutName(after));
    await expect(summaryList(page).getByRole("listitem")).toHaveText(
      after.items.map(summaryRowText),
    );
    await expectNoReload(page);
    // US-15 AC4: focus back on the button that opened the form.
    await expect(addButton(page)).toBeFocused();

    await page.goto("/overview");
    await expect(page.getByRole("img", { name: donutName(after) })).toBeVisible();
    // US-36 AC1: still there after a reload.
    await page.goto("/budgets");
    await expect(card(page, "General")).toBeVisible();
  });

  test("US-15 AC4: the modal closes on Escape and on Close, focus back on + Add New Budget", async ({
    page,
  }) => {
    await page.goto("/budgets");
    await openAdd(page);
    await expect(categoryTrigger(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(modal(page)).toHaveCount(0);
    await expect(addButton(page)).toBeFocused();
    await openAdd(page);
    await modal(page).getByRole("button", { name: COPY.close }).click();
    await expect(modal(page)).toHaveCount(0);
    await expect(addButton(page)).toBeFocused();
  });

  test("All categories used: six added budgets make ten; the add form says 'All categories already have a budget'", async ({
    page,
  }) => {
    const now = await budgetsNow(page);
    const usedThemes = new Set(now.items.map((b) => b.theme));
    const free = THEMES.filter((t) => !usedThemes.has(t));
    for (const [index, category] of FIGURES.freeCategories.entries()) {
      await addViaApi(page, category, 1_000, free[index] ?? "Green");
    }
    await page.goto("/budgets");
    await expect(cards(page)).toHaveCount(CATEGORIES.length);
    await openAdd(page);
    await expect(modal(page).getByText(COPY.budgetCategoriesUsed)).toBeVisible();
  });
});

test.describe("US-16 and US-17 edit and delete", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("US-16 AC1 AC2: edit Dining Out to $150.00 → Remaining $17.00 in the same place, its own category choosable, no reload", async ({
    page,
  }) => {
    const after = FIGURES.writes.diningOut150;
    const dining = after.items.find((b) => b.category === "Dining Out")!;
    await page.goto("/budgets");
    await markWindow(page);
    await optionsMenu(page).click();
    await page.getByRole("menuitem", { name: COPY.editBudget }).click();
    await expect(maximumField(page)).toHaveValue(/^\d/);
    await categoryTrigger(page).click();
    await expect(option(page, "Dining Out")).not.toHaveAttribute("aria-disabled", "true");
    await expect(option(page, "Bills")).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Escape");
    await maximumField(page).fill("150");
    await modal(page).getByRole("button", { name: COPY.saveChanges }).click();
    await expect(card(page, "Dining Out").locator("dd")).toHaveText([
      formatMoney(dining.spent),
      formatMoney(dining.remaining),
    ]);
    await expect(cardTitles(page)).toHaveText(after.items.map((b) => b.category));
    await expect(optionsMenu(page)).toBeFocused();
    await expectNoReload(page);
  });

  test("US-17 AC1–AC3: the dialog, No Go Back keeps it, confirm removes the card and its summary row, no reload", async ({
    page,
  }) => {
    const after = FIGURES.writes.deleteEntertainment;
    await page.goto("/budgets");
    await markWindow(page);
    await menuFor(page, "Entertainment").click();
    await page.getByRole("menuitem", { name: COPY.deleteBudget }).click();
    const dialog = page.getByRole("alertdialog").or(modal(page));
    await expect(
      dialog.getByRole("heading", { name: COPY.deleteTitle("Entertainment") }),
    ).toBeVisible();
    await expect(dialog.getByText(COPY.deleteBudgetConfirm)).toBeVisible();
    await dialog.getByRole("button", { name: COPY.goBack }).click();
    await expect(card(page, "Entertainment")).toBeVisible();

    await menuFor(page, "Entertainment").click();
    await page.getByRole("menuitem", { name: COPY.deleteBudget }).click();
    await dialog.getByRole("button", { name: COPY.confirmDeletion }).click();
    await expect(card(page, "Entertainment")).toHaveCount(0);
    await expect(summaryList(page).getByRole("listitem")).toHaveText(
      after.items.map(summaryRowText),
    );
    await expect(donut(page)).toHaveAccessibleName(donutName(after));
    await expectNoReload(page);
  });

  test("US-17: a budget deleted in another tab, then edited here → the modal closes, focus on main, 'This budget no longer exists'", async ({
    page,
  }) => {
    await page.goto("/budgets");
    const entertainment = (await budgetsNow(page)).items.find(
      (b) => b.category === "Entertainment",
    )!;
    await menuFor(page, "Entertainment").click();
    await page.getByRole("menuitem", { name: COPY.editBudget }).click();
    expect((await page.request.delete(`/api/budgets/${entertainment.id}`)).status()).toBe(204);
    await modal(page).getByRole("button", { name: COPY.saveChanges }).click();
    await expect(modal(page)).toHaveCount(0);
    await expect(page.locator("main")).toBeFocused();
    await expect(page.getByRole("status").filter({ hasText: COPY.budgetGone })).toBeVisible();
    await expect(card(page, "Entertainment")).toHaveCount(0);
  });
});

test.describe("US-18 to US-20 latest spending, See All and the summary", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("US-18 AC1 AC2: each card's three latest rows of 4.4; a Groceries budget shows its income; Education two rows", async ({
    page,
  }) => {
    await addViaApi(page, "Groceries", 20_000, "Purple");
    await addViaApi(page, "Education", 10_000, "Red");
    await page.goto("/budgets");
    for (const category of [...SEED.items.map((b) => b.category), "Groceries", "Education"]) {
      await expect(card(page, category).getByRole("listitem")).toHaveText(
        FIGURES.latest[category]!.map(latestText),
      );
    }
    await expect(card(page, "Groceries").getByText(/^\+\$/)).toHaveCount(1);
    await expect(card(page, "Education").getByRole("listitem")).toHaveCount(2);
  });

  test("US-18 with few-transactions: the empty message on Entertainment", async ({ page }) => {
    await seedVariant(page, "few-transactions");
    await page.goto("/budgets");
    await expect(card(page, "Entertainment").getByText(COPY.budgetNoTransactions)).toBeVisible();
  });

  test("US-19 AC1: See All on Dining Out lands on Transactions filtered to Dining Out", async ({
    page,
  }) => {
    await page.goto("/budgets");
    await card(page, "Dining Out")
      .getByRole("link", { name: COPY.seeAllCategory("Dining Out") })
      .click();
    await expect(page).toHaveURL(/\/transactions\?category=Dining\+Out&page=1$/);
    await expect(
      page.getByRole("heading", { level: 1, name: PAGE_NAMES.transactions }),
    ).toBeVisible();
  });

  test("US-20 AC1: the donut's name and the four summary rows, in creation order", async ({
    page,
  }) => {
    await page.goto("/budgets");
    await expect(donut(page)).toHaveAccessibleName(donutName(SEED));
    await expect(summaryList(page).getByRole("listitem")).toHaveText(
      SEED.items.map(summaryRowText),
    );
  });
});

test.describe("the donut's centre (BU-11 (A), changelog §24a, §25d, §31a; 2.3, 4.7)", () => {
  test("the seed: '$338.00' at 32 px and the limit on one line", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/budgets");
    const spent = formatMoney(SEED.spent);
    expect(donutCentreFit(spent, formatMoney(SEED.limit))).toEqual({
      spentPreset: "text-preset-1",
      limitLines: 1,
    });
    await expect(page.getByText(spent, { exact: true })).toHaveCSS("font-size", "32px");
  });

  for (const width of [1440, 320]) {
    test(`ten budgets at the largest maximum, ${width} px: every line inside the 128 px box, the block in the hole`, async ({
      page,
    }) => {
      await tenLargestBudgets(page);
      const ten = await budgetsNow(page);
      const limitText = formatMoney(ten.limit);
      expect(limitText).toBe(formatMoney(FIGURES.boundaries.tenLargest.limit));
      const fit = donutCentreFit(formatMoney(ten.spent), limitText);
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/budgets");
      await expect(donut(page)).toHaveAccessibleName(donutName(ten));
      const centre = page.locator("[data-limit-lines]");
      await expect(centre).toHaveAttribute("data-limit-lines", String(fit.limitLines));
      const svg = await page.locator("main svg[viewBox='0 0 240 240']").boundingBox();
      const lines = await centre.evaluate((node) => {
        const out: { width: number; x: number; y: number; bottom: number; size: number }[] = [];
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        for (let text = walker.nextNode(); text; text = walker.nextNode()) {
          const range = document.createRange();
          range.selectNodeContents(text);
          const size = parseFloat(getComputedStyle(text.parentElement!).fontSize);
          for (const rect of range.getClientRects()) {
            out.push({ width: rect.width, x: rect.x, y: rect.y, bottom: rect.bottom, size });
          }
        }
        return out;
      });
      expect(svg).not.toBeNull();
      const cx = svg!.x + svg!.width / 2;
      const cy = svg!.y + svg!.height / 2;
      for (const line of lines) {
        expect(line.width).toBeLessThanOrEqual(128);
        expect(line.size).toBeGreaterThanOrEqual(12);
        expect(line.x).toBeGreaterThanOrEqual(cx - 72);
        expect(line.x + line.width).toBeLessThanOrEqual(cx + 72);
        expect(line.y).toBeGreaterThanOrEqual(cy - 72);
        expect(line.bottom).toBeLessThanOrEqual(cy + 72);
      }
      // The limit's amount is whole on one line: one of the limit's lines holds all of it.
      const limitLines = centre.locator("p").last().locator("span");
      await expect(limitLines).toHaveCount(fit.limitLines === 1 ? 1 : fit.limitLines);
      await expect(limitLines.filter({ hasText: limitText })).toHaveCount(1);
    });
  }
});

test.describe("the bar's and the donut's animation (BU-Q7 (a))", () => {
  test("a fill and a segment move over 0.4 s", async ({ page }) => {
    await page.goto("/budgets");
    await expect(card(page, "Dining Out").locator("rect")).toHaveCSS("transition-duration", "0.4s");
    // A segment moves stroke-dasharray and stroke-dashoffset: one duration each.
    await expect(donut(page).locator("circle").nth(1)).toHaveCSS(
      "transition-duration",
      "0.4s, 0.4s",
    );
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("no transition", async ({ page }) => {
      await page.goto("/budgets");
      await expect(card(page, "Dining Out").locator("rect")).toHaveCSS("transition-duration", "0s");
      await expect(donut(page).locator("circle").nth(1)).toHaveCSS(
        "transition-duration",
        /^0s(, 0s)?$/,
      );
    });
  });
});

test.describe("layout by the content width (2.2, BU-Q8 (a))", () => {
  const summaryCard = (page: Page) =>
    page.getByRole("heading", { name: COPY.spendingSummary }).locator("../..");
  const donutBox = (page: Page) => donut(page).boundingBox();
  const listBox = (page: Page) => summaryList(page).boundingBox();

  test("1440 px: two columns, the summary 428 px wide and sticky", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/budgets");
    const summary = await summaryCard(page).boundingBox();
    const first = await cards(page).first().boundingBox();
    expect(Math.round(summary?.width ?? 0)).toBe(428);
    expect(first!.x).toBeGreaterThan(summary!.x + summary!.width);
    await cards(page).last().scrollIntoViewIfNeeded();
    await expect(summaryCard(page)).toBeInViewport();
  });

  test("1331 px: one column, the donut beside the list", async ({ page }) => {
    await page.setViewportSize({ width: 1331, height: 900 });
    await page.goto("/budgets");
    const summary = await summaryCard(page).boundingBox();
    const first = await cards(page).first().boundingBox();
    expect(first!.y).toBeGreaterThan(summary!.y + summary!.height - 1);
    expect((await listBox(page))!.x).toBeGreaterThan((await donutBox(page))!.x);
  });

  test("375 px: the donut above the list", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/budgets");
    const d = (await donutBox(page))!;
    expect((await listBox(page))!.y).toBeGreaterThanOrEqual(d.y + d.height);
  });

  for (const width of [1440, 768, 375, 320]) {
    test(`US-33 ${width} px: no horizontal scroll, with a $999,999,999.99 budget`, async ({
      page,
    }) => {
      await addViaApi(page, "General", LARGEST, "Purple");
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/budgets");
      await expect(card(page, "General")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
      const avatar = card(page, "Entertainment").locator("img").first();
      if (width < 768) await expect(avatar).toBeHidden();
      else await expect(avatar).toBeVisible();
    });
  }
});

test.describe("US-34 states", () => {
  test("'No, Go Back' is at least 44 px high; a used option's swatch is at 0.25", async ({
    page,
  }) => {
    await page.goto("/budgets");
    await menuFor(page, "Bills").click();
    await page.getByRole("menuitem", { name: COPY.deleteBudget }).click();
    const back = page.getByRole("button", { name: COPY.goBack });
    await expect(back).toHaveCSS("min-height", "44px");
    expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await back.click();
    await openAdd(page);
    await modal(page)
      .getByRole("button", { name: new RegExp(`^${COPY.theme}`) })
      .click();
    const disabled = page.locator('[role="option"][aria-disabled="true"]').first();
    await expect(disabled.locator("[aria-hidden='true']").first()).toHaveCSS("opacity", "0.25");
  });
});

test.describe("WebMCP on Budgets (2.13)", () => {
  test.beforeEach(() => {
    test.skip(RUN_MODE !== "polyfill", `polyfill-mode spec; this run expects ${RUN_MODE}`);
  });

  test("US-38 AC1 US-41: exactly the four tools, 'polyfill · 4'", async ({ page }) => {
    await page.goto("/budgets");
    await expectToolsReady(page);
    const tools = await listTools(page);
    // getTools() lists by name; the registry's order is the unit test's.
    expect(tools.map((t) => t.name).sort()).toEqual([
      "add_budget",
      "delete_budget",
      "edit_budget",
      "list_budgets",
    ]);
    for (const tool of tools) expect(tool.description.length).toBeLessThanOrEqual(200);
    await expect(page.getByRole("status", { name: COPY.agentToolsPolyfill(4) })).toBeVisible();
  });

  test("US-39 AC2: list_budgets returns what the page shows, with ids", async ({ page }) => {
    await page.goto("/budgets");
    await expectToolsReady(page);
    const result = await callTool(page, "list_budgets");
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject(await budgetsNow(page));
  });

  test("US-40 AC1 AC3: add_budget shows the card at once, no reload, on record as POST; a used category is 'taken'", async ({
    page,
    request,
  }) => {
    await page.goto("/budgets");
    await expectToolsReady(page);
    await markWindow(page);
    const posted = page.waitForResponse(
      (r) => new URL(r.url()).pathname === "/api/budgets" && r.request().method() === "POST",
    );
    const result = await callTool(page, "add_budget", {
      category: "General",
      maximum: 50_000,
      theme: "Purple",
    });
    expect(result.isError).not.toBe(true);
    await expect(card(page, "General")).toBeVisible();
    await expectNoReload(page);
    const response = await posted;
    const requestId = response.headers()["x-request-id"]!;
    const log = await request.get("/api/test/log", { params: { requestId } });
    expect(await log.json()).toMatchObject({ via: "webmcp", method: "POST" });

    const taken = await callTool(page, "add_budget", {
      category: "Bills",
      maximum: 50_000,
      theme: "Gold",
    });
    expect(taken).toMatchObject({ isError: true, code: "validation" });
    expect(JSON.stringify(taken)).toContain("taken");
  });

  test("US-40 AC1: edit_budget with only id and maximum → required, with no request", async ({
    page,
  }) => {
    await page.goto("/budgets");
    await expectToolsReady(page);
    const id = (await budgetsNow(page)).items[0]!.id;
    let patched = false;
    page.on("request", (r) => {
      if (r.method() === "PATCH") patched = true;
    });
    const result = await callTool(page, "edit_budget", { id, maximum: 100 });
    expect(result).toMatchObject({ isError: true, code: "validation" });
    expect(patched).toBe(false);
  });

  test("US-40 AC2: delete_budget opens the page's dialog; cancel → cancelled; unknown id → not_found; confirm → deleted", async ({
    page,
  }) => {
    await page.goto("/budgets");
    await expectToolsReady(page);
    const entertainment = (await budgetsNow(page)).items.find(
      (b) => b.category === "Entertainment",
    )!;
    const unknown = await callTool(page, "delete_budget", {
      id: "00000000-0000-4000-8000-000000000000",
    });
    expect(unknown).toMatchObject({ isError: true, code: "not_found" });

    const cancelled = callTool(page, "delete_budget", { id: entertainment.id });
    await page.getByRole("button", { name: COPY.goBack }).click();
    expect(await cancelled).toMatchObject({ isError: true, code: "cancelled" });

    const confirmed = callTool(page, "delete_budget", { id: entertainment.id });
    await page.getByRole("button", { name: COPY.confirmDeletion }).click();
    expect((await confirmed).isError).not.toBe(true);
    await expect(card(page, "Entertainment")).toHaveCount(0);
  });
});

test.describe("write-path.md 7.5 and 7.6 on this page", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("US-36 7.5: an add answered 429 shows the server's message in the form's error area; the form stays", async ({
    page,
  }) => {
    await page.route("**/api/budgets", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 429,
            headers: { "retry-after": "30" },
            contentType: "application/json",
            body: JSON.stringify({
              error: "rate_limited",
              message: "Too many changes",
              retryAfter: 30,
            }),
          })
        : route.fallback(),
    );
    await page.goto("/budgets");
    await openAdd(page);
    await maximumField(page).fill("20");
    await modal(page).getByRole("button", { name: COPY.addBudgetSubmit }).click();
    await expect(modal(page).getByText("Too many changes")).toBeVisible();
    await expect(cards(page)).toHaveCount(SEED.items.length);
  });

  test("US-40 7.6: add_budget answered 403 returns forbidden, not server_error, and the page does not change", async ({
    page,
  }) => {
    test.skip(RUN_MODE !== "polyfill", `polyfill-mode test; this run expects ${RUN_MODE}`);
    await page.route("**/api/budgets", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 403,
            contentType: "application/json",
            body: JSON.stringify({ error: "forbidden", message: "Forbidden" }),
          })
        : route.fallback(),
    );
    await page.goto("/budgets");
    await expectToolsReady(page);
    const result = await callTool(page, "add_budget", {
      category: "General",
      maximum: 50_000,
      theme: "Purple",
    });
    expect(result).toMatchObject({ isError: true, code: "forbidden" });
    await expect(cards(page)).toHaveCount(SEED.items.length);
  });
});

test.describe("US-32 the keyboard", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the '…' menu by keyboard: Enter opens it on its first item, ArrowDown, Enter runs Delete, Escape goes back", async ({
    page,
  }) => {
    await page.goto("/budgets");
    await menuFor(page, "Bills").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: COPY.editBudget })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: COPY.deleteBudget })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: COPY.deleteTitle("Bills") })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menuFor(page, "Bills")).toBeFocused();
    await expect(card(page, "Bills")).toBeVisible();
  });

  test("the edit form by keyboard: the category field opens with Enter, an option is chosen with the arrows", async ({
    page,
  }) => {
    await page.goto("/budgets");
    await menuFor(page, "Dining Out").focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await expect(categoryTrigger(page)).toBeFocused();
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(categoryTrigger(page)).toBeFocused();
    await expect(categoryTrigger(page)).not.toHaveAccessibleName(
      COPY.menuTriggerName(COPY.budgetCategory, "Dining Out"),
    );
  });
});

test.describe("NFR-A1 axe: no serious or critical violation", () => {
  test("the seed, empty-budgets, a modal open and 375 px", async ({ page }) => {
    await page.goto("/budgets");
    await expect(cards(page)).toHaveCount(SEED.items.length);
    expect(await seriousA11yViolations(page)).toEqual([]);
    await openAdd(page);
    // Measured once the modal's entrance (--duration-modal) has ended, not mid-fade.
    await modal(page).evaluate((node) =>
      Promise.all(node.getAnimations({ subtree: true }).map((a) => a.finished)),
    );
    expect(await seriousA11yViolations(page)).toEqual([]);
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 375, height: 800 });
    expect(await seriousA11yViolations(page)).toEqual([]);
    await seedVariant(page, "empty-budgets");
    await page.goto("/budgets");
    await expect(page.getByText(COPY.budgetsEmpty, { exact: true })).toBeVisible();
    expect(await seriousA11yViolations(page)).toEqual([]);
  });
});
