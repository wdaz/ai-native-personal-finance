import type { APIRequestContext, Locator, Page } from "@playwright/test";
import { billFigures } from "@/scripts/seed-figures";
import { COPY } from "@/src/shared/copy";
import { formatDueDay } from "@/src/shared/dates";
import { formatMoney } from "@/src/shared/money";
import {
  BILL_SORTS,
  BILL_STATUSES,
  type RecurringBillsQuery,
} from "@/src/shared/recurring-bills-query";
import { PAGE_NAMES } from "@/src/ui/nav";
import {
  expect,
  loginViaApi,
  resetDemoData,
  seriousA11yViolations,
  tabTo,
  test,
} from "../fixtures/e2e";

/**
 * SPEC-recurring-bills §7, the E2E row: US-08 AC2 (the receiving side), US-27 to US-30, US-32,
 * US-33, US-34 and axe. Every figure comes from `billFigures()` (`scripts/seed-figures.ts`,
 * H14 (2)), which runs the domain's own bills, totals, search and sort over the seed, and is
 * formatted with the shared functions; none is typed. No time-based waits: the debounce is the
 * unit test's (fake timers); here the test waits for the URL and the rows.
 */
const FIGURES = billFigures();
const view = (query: Partial<RecurringBillsQuery>) => FIGURES.view(query);
const countAmount = ({ count, amount }: { count: number; amount: number }) =>
  COPY.billsCountAmount(count, formatMoney(amount));

const GREY_500 = "rgb(105, 104, 104)";
const GREY_900 = "rgb(32, 31, 36)";
const BEIGE_500 = "rgb(152, 144, 139)";
const GREEN = "rgb(39, 124, 120)";
const RED = "rgb(201, 71, 54)";

const table = (page: Page) => page.getByRole("table", { name: PAGE_NAMES.recurringBills });
const bodyRows = (page: Page) => table(page).locator("tbody").getByRole("row");
const names = (page: Page) => bodyRows(page).locator("td:first-child");
const row = (page: Page, name: string) => bodyRows(page).filter({ hasText: name });
const searchField = (page: Page) => page.getByLabel(COPY.searchBillsLabel);
const sortTrigger = (page: Page) => page.getByRole("button", { name: /^Sort by:/ });
const option = (page: Page, label: string) =>
  page.getByRole("option", { name: label, exact: true });
const statusLine = (page: Page, text: string) =>
  page.getByRole("status").filter({ hasText: new RegExp(`^${text}$`) });
const results = (page: Page) => page.locator("[aria-busy]");
const totalCard = (page: Page) => page.getByText(COPY.totalBills, { exact: true }).locator("../..");
const summaryCard = (page: Page) =>
  page.getByRole("heading", { name: COPY.billsSummaryTitle, level: 2 }).locator("..");
const listCard = (page: Page) => page.getByRole("search").locator("../..");

/** The rows the page should show, by name and in order. */
async function expectRows(page: Page, query: Partial<RecurringBillsQuery>) {
  await expect(names(page)).toHaveText(view(query).map((bill) => bill.name));
}

async function chooseSort(page: Page, label: string) {
  await sortTrigger(page).click();
  await option(page, label).click();
}

async function seedVariant(request: APIRequestContext, page: Page, variant: string) {
  const response = await request.post("/api/test/seed", { data: { variant } });
  expect(response.status()).toBe(200);
  await loginViaApi(page); // a seed ends every session
}

async function expectSummary(page: Page, totals = FIGURES.totals) {
  await expect(totalCard(page).locator(".text-preset-1")).toHaveText(
    formatMoney(totals.total.amount),
  );
  await expect(summaryCard(page).locator("dt")).toHaveText([
    COPY.billsPaid,
    COPY.billsTotalUpcoming,
    COPY.billsDueSoon,
  ]);
  await expect(summaryCard(page).locator("dd")).toHaveText([
    countAmount(totals.paid),
    countAmount(totals.totalUpcoming),
    countAmount(totals.dueSoon),
  ]);
}

const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test.beforeEach(async ({ page, request }) => {
  await resetDemoData(request);
  await loginViaApi(page);
});

test.describe("US-27 the list", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("AC1 AC3: every bill with its avatar, name, 'Monthly - …' and amount, in the default order", async ({
    page,
  }) => {
    await page.goto("/recurring-bills");
    await expect(
      page.getByRole("heading", { name: PAGE_NAMES.recurringBills, level: 1 }),
    ).toBeVisible();
    await expect(table(page).getByRole("columnheader")).toHaveText([
      COPY.columnBillTitle,
      COPY.columnDueDate,
      COPY.columnAmount,
    ]);
    await expectRows(page, {});
    expect(FIGURES.bills).toHaveLength(8);
    for (const bill of FIGURES.bills) {
      const cells = row(page, bill.name).getByRole("cell");
      await expect(cells.nth(1)).toContainText(formatDueDay(bill.day));
      await expect(cells.nth(2)).toHaveText(formatMoney(bill.amount));
      await expect(row(page, bill.name).locator("img")).toHaveAttribute(
        "src",
        // The seed names the design's image path; the app serves its file name (`AVATAR_KEY`).
        `/avatars/${bill.latest.avatar.split("/").at(-1)}`,
      );
    }
  });

  test("AC2: each status in words, the due-soon rows red with the warning icon, the paid rows green with the check", async ({
    page,
  }) => {
    await page.goto("/recurring-bills");
    for (const status of BILL_STATUSES) {
      for (const bill of FIGURES.byStatus[status]) {
        const due = row(page, bill.name).getByRole("cell").nth(1);
        const amount = row(page, bill.name).getByRole("cell").nth(2);
        await expect(due).toHaveText(`${formatDueDay(bill.day)} ${COPY.billStatuses[status]}`);
        await expect(due.locator("svg")).toHaveCount(status === "upcoming" ? 0 : 1);
        await expect(due).toHaveCSS("color", status === "paid" ? GREEN : GREY_500);
        await expect(amount).toHaveCSS("color", status === "dueSoon" ? RED : GREY_900);
        if (status !== "upcoming") {
          await expect(due.locator("svg")).toHaveAttribute("aria-hidden", "true");
          await expect(due.locator("svg").locator("..")).toHaveCSS(
            "color",
            status === "paid" ? GREEN : RED,
          );
        }
      }
    }
    // US-27 AC3: Nimbus Data Storage and ByteWise are the two due soon.
    expect(FIGURES.byStatus.dueSoon.map((bill) => bill.name).sort()).toEqual(
      ["ByteWise", "Nimbus Data Storage"].sort(),
    );
  });
});

test("US-28 AC1: Total Bills and the three summary rows, the Due Soon row red", async ({
  page,
}) => {
  await page.goto("/recurring-bills");
  await expectSummary(page);
  await expect(summaryCard(page).locator("dl > div").nth(2)).toHaveCSS("color", RED);
  await expect(summaryCard(page).locator("dl > div").nth(0)).toHaveCSS("color", GREY_500);
});

test.describe("US-29 search", () => {
  test("'data' shows Nimbus Data Storage; the URL gains q=data by replace, without a history entry", async ({
    page,
  }) => {
    await page.goto("/recurring-bills");
    await expect(names(page)).toHaveCount(FIGURES.bills.length);
    const length = await page.evaluate(() => history.length);
    await searchField(page).fill("data");
    await expect(page).toHaveURL(/\/recurring-bills\?q=data$/);
    await expectRows(page, { q: "data" });
    expect(await page.evaluate(() => history.length)).toBe(length);
    await expect(statusLine(page, COPY.billsStatus(view({ q: "data" }).length))).toHaveCount(1);
  });

  test("'BYTE' finds ByteWise (case-insensitive)", async ({ page }) => {
    await page.goto("/recurring-bills?q=BYTE");
    await expectRows(page, { q: "BYTE" });
    await expect(names(page)).toHaveText(["ByteWise"]);
  });

  test("AC1: 'bill' matches nothing: the line, the header row, the summary unchanged, the typed text kept", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/recurring-bills");
    await searchField(page).fill("bill");
    await expect(page).toHaveURL(/\?q=bill$/);
    await expect(table(page).getByRole("cell", { name: COPY.billsNoResults })).toBeVisible();
    await expect(table(page).getByRole("cell", { name: COPY.billsNoResults })).toHaveAttribute(
      "colspan",
      "3",
    );
    await expect(table(page).getByRole("columnheader")).toHaveCount(3);
    await expect(searchField(page)).toHaveValue("bill");
    await expect(statusLine(page, COPY.billsNoResults)).toHaveCount(1);
    await expectSummary(page);
  });

  test("the results region is busy while the answer is pending, and the old rows stay", async ({
    page,
  }) => {
    await page.goto("/recurring-bills");
    await expect(names(page)).toHaveCount(FIGURES.bills.length);
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route(
      (url) => url.pathname === "/recurring-bills" && url.searchParams.get("q") === "data",
      async (route) => {
        await held;
        await route.continue();
      },
    );
    await searchField(page).fill("data");
    await expect(results(page)).toHaveAttribute("aria-busy", "true");
    await expectRows(page, {});
    release();
    await expect(results(page)).toHaveAttribute("aria-busy", "false");
    await expectRows(page, { q: "data" });
  });

  test("a 61-character q is cut to 60 on the page, the URL as typed (2.3)", async ({ page }) => {
    const long = `${"e".repeat(61)}`;
    await page.goto(`/recurring-bills?q=${long}`);
    await expect(searchField(page)).toHaveValue("e".repeat(60));
    await expect(table(page).getByRole("cell", { name: COPY.billsNoResults })).toBeVisible();
  });
});

test.describe("US-30 sort", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const sort of BILL_SORTS) {
    const label = COPY.transactionSorts[sort];
    test(`'${label}': every row in its order (4.3); the trigger and the URL show it`, async ({
      page,
    }) => {
      await page.goto("/recurring-bills");
      if (sort !== "latest") await chooseSort(page, label);
      await expect(sortTrigger(page)).toHaveAttribute("aria-label", `Sort by: ${label}`);
      await expect(page).toHaveURL(
        sort === "latest" ? /\/recurring-bills$/ : new RegExp(`\\?sort=${sort}$`),
      );
      await expectRows(page, { sort });
      await sortTrigger(page).click();
      await expect(option(page, label)).toHaveAttribute("aria-selected", "true");
      await expect(option(page, label)).toHaveCSS("font-weight", "700");
    });
  }

  test("Back restores the previous sort; an unknown sort reads as Latest with the URL as typed", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/recurring-bills?sort=highest");
    await chooseSort(page, COPY.transactionSorts.lowest);
    await expect(page).toHaveURL(/\?sort=lowest$/);
    await expectRows(page, { sort: "lowest" });
    await page.goBack();
    await expect(page).toHaveURL(/\?sort=highest$/);
    await expect(sortTrigger(page)).toHaveAttribute("aria-label", "Sort by: Highest");
    await expectRows(page, { sort: "highest" });

    await page.goto("/recurring-bills?sort=nope&status=paid");
    await expect(page).toHaveURL(`${baseURL}/recurring-bills?sort=nope&status=paid`);
    await expect(sortTrigger(page)).toHaveAttribute("aria-label", "Sort by: Latest");
    await expectRows(page, {});
  });

  test("a sort after a search keeps the search, in the contract's URL order", async ({ page }) => {
    await page.goto("/recurring-bills");
    await searchField(page).fill("e");
    await expect(page).toHaveURL(/\?q=e$/);
    await chooseSort(page, COPY.transactionSorts.highest);
    await expect(page).toHaveURL(/\/recurring-bills\?q=e&sort=highest$/);
    await expectRows(page, { q: "e", sort: "highest" });
    await expect(statusLine(page, COPY.billsStatus(view({ q: "e" }).length))).toHaveCount(1);
  });

  test("AC2: no-recurring shows 'No recurring bills yet' and $0.00 four times", async ({
    page,
    request,
  }) => {
    await seedVariant(request, page, "no-recurring");
    await page.goto("/recurring-bills");
    await expect(table(page).getByRole("cell", { name: COPY.billsEmpty })).toBeVisible();
    const zero = { count: 0, amount: 0 };
    await expectSummary(page, { total: zero, paid: zero, totalUpcoming: zero, dueSoon: zero });
    // "No recurring bills yet" wins over "No bills match your search" (2.10).
    await page.goto("/recurring-bills?q=xyz");
    await expect(table(page).getByRole("cell", { name: COPY.billsEmpty })).toBeVisible();
  });
});

test("US-08 AC2 (receiving side): Overview's 'See Details' lands on Recurring Bills with its title and the default list", async ({
  page,
}) => {
  await page.goto("/overview");
  await page
    .getByRole("heading", { name: PAGE_NAMES.recurringBills, level: 2 })
    .locator("../..")
    .getByRole("link", { name: /See Details/ })
    .click();
  await expect(page).toHaveURL(/\/recurring-bills$/);
  await expect(
    page.getByRole("heading", { name: PAGE_NAMES.recurringBills, level: 1 }),
  ).toBeVisible();
  await expect(page).toHaveTitle(`Personal Finance - ${PAGE_NAMES.recurringBills}`);
  await expectRows(page, {});
});

test("the login redirect keeps the query: ?sort=highest", async ({ page, baseURL }) => {
  await page.context().clearCookies();
  await page.goto("/recurring-bills?sort=highest");
  await expect(page).toHaveURL(`${baseURL}/login?next=%2Frecurring-bills%3Fsort%3Dhighest`);
});

test.describe("US-32 the keyboard walkthrough (2.13)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Tab: the field, then Sort; a menu by keys — Enter, arrows, Home, End, Escape", async ({
    page,
  }) => {
    await page.goto("/recurring-bills");
    await expect(names(page)).toHaveCount(FIGURES.bills.length);
    await searchField(page).focus();
    await tabTo(page, sortTrigger(page));

    await page.keyboard.press("Enter");
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeFocused();
    const highlighted = async () =>
      page.evaluate(() => {
        const id = document.activeElement?.getAttribute("aria-activedescendant");
        return id ? document.getElementById(id)?.textContent : null;
      });
    expect(await highlighted()).toBe(COPY.transactionSorts.latest);
    await page.keyboard.press("End");
    expect(await highlighted()).toBe(COPY.transactionSorts.lowest);
    await page.keyboard.press("Home");
    expect(await highlighted()).toBe(COPY.transactionSorts.latest);
    await page.keyboard.press("Escape");
    await expect(listbox).toHaveCount(0);
    await expect(sortTrigger(page)).toBeFocused();

    await page.keyboard.press(" ");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    expect(await highlighted()).toBe(COPY.transactionSorts["a-to-z"]);
    await page.keyboard.press("Enter");
    await expect(listbox).toHaveCount(0);
    await expect(page).toHaveURL(/\?sort=a-to-z$/);
    await expect(sortTrigger(page)).toBeFocused();
    await expectRows(page, { sort: "a-to-z" });
  });
});

/** SPEC-app-shell §2.9: `<main>`'s content-box width, what the page's container query reads. */
async function contentWidth(page: Page): Promise<number> {
  return page.getByRole("main").evaluate((main) => {
    const style = getComputedStyle(main);
    return main.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  });
}

async function boxes(page: Page) {
  const [total, summary, list] = await Promise.all(
    [totalCard(page), summaryCard(page), listCard(page)].map(async (card: Locator) => {
      const rect = await card.boundingBox();
      if (rect === null) throw new Error("a card has no box");
      return rect;
    }),
  );
  return { total: total!, summary: summary!, list: list! };
}

/** 2.13: the summary column on the left, 337 px, Total Bills above Summary; the list card right. */
async function expectTwoColumns(page: Page) {
  const { total, summary, list } = await boxes(page);
  expect(total.width).toBe(337);
  expect(summary.x).toBe(total.x);
  expect(summary.y).toBeGreaterThan(total.y);
  expect(list.x).toBe(total.x + 337 + 24);
  expect(list.y).toBe(total.y);
  // §20a RB-1: neither card stretches to the list card's height.
  expect(summary.y + summary.height).toBeLessThan(list.y + list.height);
}

/** 2.13: Total Bills and Summary side by side, equal widths; the list card below, full width. */
async function expectStackedRow(page: Page) {
  const { total, summary, list } = await boxes(page);
  expect(summary.y).toBe(total.y);
  expect(Math.abs(summary.width - total.width)).toBeLessThanOrEqual(1);
  expect(summary.x).toBeGreaterThan(total.x);
  expect(list.y).toBeGreaterThan(total.y + total.height);
  expect(list.x).toBe(total.x);
}

/** 2.13 below 768 px: Total Bills, Summary, the list card, one above the other. */
async function expectStackedColumn(page: Page) {
  const { total, summary, list } = await boxes(page);
  expect(summary.x).toBe(total.x);
  expect(summary.y).toBeGreaterThan(total.y + total.height);
  expect(list.y).toBeGreaterThan(summary.y + summary.height);
}

/** US-33 AC2, AC3: no horizontal scroll, the table inside its card, nothing clipped. */
async function expectFits(page: Page) {
  expect(await noHorizontalScroll(page)).toBe(true);
  const card = (await listCard(page).boundingBox())!;
  const tableBox = (await table(page).boundingBox())!;
  expect(tableBox.x).toBeGreaterThanOrEqual(card.x);
  expect(tableBox.x + tableBox.width).toBeLessThanOrEqual(card.x + card.width);
  const amounts = bodyRows(page).locator("td:nth-child(3)");
  for (const clipped of await amounts.evaluateAll((cells) =>
    cells.map((cell) => cell.scrollWidth > cell.clientWidth),
  )) {
    expect(clipped).toBe(false);
  }
  const lines = await names(page)
    .locator("span span")
    .evaluateAll((elements) =>
      elements
        .filter((element) => element.children.length === 0)
        .map((element) => {
          const style = getComputedStyle(element);
          return style.whiteSpace === "nowrap" && style.textOverflow === "ellipsis";
        }),
    );
  expect(lines.length).toBeGreaterThan(0);
  for (const oneLine of lines) expect(oneLine).toBe(true);
}

test.describe("US-33 the layout by the content width (2.13, §9 RB-Q9 (b))", () => {
  test("sidebar expanded: two columns at 1440 and 1341 px; stacked at 1340, 1280 and 1024 px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/recurring-bills");
    await expect.poll(() => contentWidth(page)).toBe(1060);
    await expectTwoColumns(page);
    await expectFits(page);

    for (const [width, content, two] of [
      [1341, 961, true],
      [1340, 960, false],
      [1280, 900, false],
      [1024, 644, false],
    ] as const) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => contentWidth(page)).toBe(content);
      if (two) await expectTwoColumns(page);
      else await expectStackedRow(page);
      await expectFits(page);
    }
  });

  test("sidebar collapsed: two columns at 1440 and 1129 px, stacked at 1128 px; collapsing at 1280 px switches without a reload", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/recurring-bills");
    await expectStackedRow(page);
    await page.getByRole("button", { name: COPY.minimizeMenu }).click();
    await expect.poll(() => contentWidth(page)).toBe(1112);
    await expectTwoColumns(page);
    await expectFits(page);

    for (const [width, content, two] of [
      [1440, 1272, true],
      [1129, 961, true],
      [1128, 960, false],
    ] as const) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => contentWidth(page)).toBe(content);
      if (two) await expectTwoColumns(page);
      else await expectStackedRow(page);
      await expectFits(page);
    }

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByRole("button", { name: COPY.expandMenu }).click();
    await expect.poll(() => contentWidth(page)).toBe(900);
    await expectStackedRow(page);
  });

  test("768 px: stacked with the two cards side by side; 375 and 320 px: one above the other", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto("/recurring-bills");
    await expect(names(page)).toHaveCount(FIGURES.bills.length);
    await expectStackedRow(page);
    await expectFits(page);
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expectStackedColumn(page);
      await expectFits(page);
      // 2.9: the header row stays in the DOM, visually hidden; the Sort trigger a 44 px icon.
      await expect(table(page).getByRole("columnheader")).toHaveCount(3);
      expect((await table(page).locator("thead").boundingBox())!.height).toBeLessThanOrEqual(1);
      const trigger = (await sortTrigger(page).boundingBox())!;
      expect([trigger.width, trigger.height]).toEqual([44, 44]);
    }
  });

  test("a cut name: hover and focus show its tooltip with the whole name; Escape hides it", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/recurring-bills");
    const text = names(page).getByText(FIGURES.longestName, { exact: true });
    // No seed name is cut at 1440 px; narrowing the name's box (element.style, CSP-safe) lets
    // the component's ResizeObserver find it cut, as the Transactions spec does.
    const target = text.locator("..");
    await target.evaluate((element: HTMLElement) => {
      element.style.maxInlineSize = "24px";
    });
    await expect(target).toHaveAttribute("tabindex", "0");
    await expect(target).toHaveText(FIGURES.longestName);

    await target.hover();
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toHaveText(FIGURES.longestName);
    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveCount(0);

    await searchField(page).focus();
    await tabTo(page, sortTrigger(page));
    await tabTo(page, target);
    await expect(page.getByRole("tooltip")).toHaveText(FIGURES.longestName);
  });

  test.describe("touch", () => {
    test.use({ hasTouch: true, viewport: { width: 375, height: 812 } });

    test("a tap on a cut name shows its tooltip; a tap elsewhere hides it", async ({ page }) => {
      await page.goto("/recurring-bills");
      const target = names(page).getByText(FIGURES.longestName, { exact: true }).locator("..");
      await target.evaluate((element: HTMLElement) => {
        element.style.maxInlineSize = "24px";
      });
      await expect(target).toHaveAttribute("tabindex", "0");
      await target.tap();
      await expect(page.getByRole("tooltip")).toHaveText(FIGURES.longestName);
      await page.getByRole("heading", { name: PAGE_NAMES.recurringBills, level: 1 }).tap();
      await expect(page.getByRole("tooltip")).toHaveCount(0);
    });
  });
});

test.describe("US-34 hover and focus", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the field and the trigger: beige-500, grey-500 on hover, grey-900 on focus; an option's text grey-500 on hover", async ({
    page,
  }) => {
    await page.goto("/recurring-bills");
    for (const control of [searchField(page), sortTrigger(page)]) {
      await expect(control).toHaveCSS("border-top-color", BEIGE_500);
      await control.hover();
      await expect(control).toHaveCSS("border-top-color", GREY_500);
      await control.focus();
      await page.mouse.move(0, 0);
      await expect(control).toHaveCSS("border-top-color", GREY_900);
      await page.locator("body").click({ position: { x: 1, y: 1 } });
    }

    await sortTrigger(page).click();
    const oldest = option(page, COPY.transactionSorts.oldest);
    await expect(oldest).toHaveCSS("color", GREY_900);
    await oldest.hover();
    await expect(oldest).toHaveCSS("color", GREY_500);
  });
});

test.describe("NFR-A1 axe: no serious or critical violation", () => {
  test("the default view, a no-results view, and 375 px", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/recurring-bills");
    await expect(names(page)).toHaveCount(FIGURES.bills.length);
    expect(await seriousA11yViolations(page)).toEqual([]);

    await page.goto("/recurring-bills?q=bill");
    await expect(table(page).getByRole("cell", { name: COPY.billsNoResults })).toBeVisible();
    expect(await seriousA11yViolations(page)).toEqual([]);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/recurring-bills");
    await expect(names(page)).toHaveCount(FIGURES.bills.length);
    expect(await seriousA11yViolations(page)).toEqual([]);
  });

  test("no-recurring", async ({ page, request }) => {
    await seedVariant(request, page, "no-recurring");
    await page.goto("/recurring-bills");
    await expect(table(page).getByRole("cell", { name: COPY.billsEmpty })).toBeVisible();
    expect(await seriousA11yViolations(page)).toEqual([]);
  });
});
