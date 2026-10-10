import type { APIRequestContext, Locator, Page } from "@playwright/test";
import { transactionFigures } from "@/scripts/seed-figures";
import { COPY } from "@/src/shared/copy";
import { CATEGORIES } from "@/src/shared/enums";
import { formatSignedMoney } from "@/src/shared/money";
import { TRANSACTION_SORTS, type TransactionsQuery } from "@/src/shared/transactions-query";
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
 * SPEC-transactions §7, the E2E row: US-09 to US-13, US-19, US-32, US-33, US-34 and axe. Every
 * figure comes from `transactionFigures()` (`scripts/seed-figures.ts`, H11 (3)), which runs the
 * domain's own sort, filter and paginate over the seed, and is formatted with the shared
 * functions; none is typed. No time-based waits: the debounce is the unit test's (fake timers);
 * here the test waits for the URL and the rows.
 */
const FIGURES = transactionFigures();
const view = (query: Partial<TransactionsQuery>) => FIGURES.view(query);

const GREY_500 = "rgb(105, 104, 104)";
const GREY_900 = "rgb(32, 31, 36)";
const BEIGE_500 = "rgb(152, 144, 139)";
const BEIGE_100 = "rgb(248, 244, 240)";

const table = (page: Page) => page.getByRole("table", { name: PAGE_NAMES.transactions });
const bodyRows = (page: Page) => table(page).locator("tbody").getByRole("row");
const names = (page: Page) => bodyRows(page).locator("td:first-child");
const pagination = (page: Page) => page.getByRole("navigation", { name: COPY.pagination });
const pageButton = (page: Page, n: number) =>
  pagination(page).getByRole("button", { name: COPY.pageNumber(n), exact: true });
const prev = (page: Page) => pagination(page).getByRole("button", { name: COPY.previousPage });
const next = (page: Page) => pagination(page).getByRole("button", { name: COPY.nextPage });
const searchField = (page: Page) => page.getByLabel(COPY.searchTransactionsLabel);
const sortTrigger = (page: Page) => page.getByRole("button", { name: /^Sort by:/ });
const categoryTrigger = (page: Page) => page.getByRole("button", { name: /^Category:/ });
const option = (page: Page, label: string) =>
  page.getByRole("option", { name: label, exact: true });
const statusLine = (page: Page, text: string) =>
  page.getByRole("status").filter({ hasText: new RegExp(`^${text}$`) });
const results = (page: Page) => page.locator("[aria-busy]");

/** The rows the page should show, by name and in order. */
async function expectRows(page: Page, query: Partial<TransactionsQuery>) {
  await expect(names(page)).toHaveText(view(query).items.map((t) => t.name));
}

async function choose(page: Page, trigger: Locator, label: string) {
  await trigger.click();
  await option(page, label).click();
}

async function seedVariant(request: APIRequestContext, page: Page, variant: string) {
  const response = await request.post("/api/test/seed", { data: { variant } });
  expect(response.status()).toBe(200);
  await loginViaApi(page); // a seed ends every session
}

const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test.beforeEach(async ({ page, request }) => {
  await resetDemoData(request);
  await loginViaApi(page);
});

test.describe("US-09 the list and its pages", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("AC1 AC2: ten rows, four columns, Prev disabled on page 1 and Next on the last, the current page announced", async ({
    page,
  }) => {
    await page.goto("/transactions");
    await expect(
      page.getByRole("heading", { name: PAGE_NAMES.transactions, level: 1 }),
    ).toBeVisible();
    await expect(table(page).getByRole("columnheader")).toHaveText([
      COPY.columnRecipient,
      COPY.columnCategory,
      COPY.columnDate,
      COPY.columnAmount,
    ]);
    await expectRows(page, {});
    const first = FIGURES.defaultPage[0]!;
    await expect(bodyRows(page).filter({ hasText: first.name }).getByRole("cell")).toContainText([
      first.name,
      first.category,
      formatSignedMoney(first.amount),
    ]);

    await expect(prev(page)).toBeDisabled();
    await expect(pageButton(page, 1)).toHaveAttribute("aria-current", "page");
    await expect(pageButton(page, 1)).toHaveCSS("background-color", GREY_900);

    await pageButton(page, 2).click();
    await expect(page).toHaveURL(/\/transactions\?page=2$/);
    await expectRows(page, { page: 2 });
    await expect(pageButton(page, 2)).toHaveAttribute("aria-current", "page");
    await expect(
      statusLine(page, COPY.transactionsStatus(FIGURES.total, 2, FIGURES.pageCount)),
    ).toHaveCount(1);

    for (let n = 3; n <= FIGURES.pageCount; n++) {
      await next(page).click();
      await expect(pageButton(page, n)).toHaveAttribute("aria-current", "page");
    }
    await expect(names(page)).toHaveCount(FIGURES.lastPageSize);
    await expect(next(page)).toBeDisabled();
    // 2.7: Next became disabled under the click; focus goes to the current number, not <body>.
    await expect(pageButton(page, FIGURES.pageCount)).toBeFocused();
  });

  test("AC2 one page: Dining Out shows its rows with Prev and Next both disabled", async ({
    page,
  }) => {
    await page.goto("/transactions?category=Dining+Out");
    await expect(names(page)).toHaveCount(FIGURES.byCategory["Dining Out"]!.length);
    await expect(prev(page)).toBeDisabled();
    await expect(next(page)).toBeDisabled();
    await expect(pageButton(page, 1)).toHaveAttribute("aria-current", "page");
  });

  test("AC4: ?page=99 shows the last page and ?page=abc the first, the URL as typed; a reload keeps the view", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/transactions?page=99");
    await expect(pageButton(page, FIGURES.pageCount)).toHaveAttribute("aria-current", "page");
    await expect(names(page)).toHaveCount(FIGURES.lastPageSize);
    await expect(page).toHaveURL(`${baseURL}/transactions?page=99`);

    await page.goto("/transactions?page=abc");
    await expect(pageButton(page, 1)).toHaveAttribute("aria-current", "page");
    await expectRows(page, {});

    await page.goto("/transactions?sort=oldest&page=3");
    await page.reload();
    await expect(pageButton(page, 3)).toHaveAttribute("aria-current", "page");
    await expect(sortTrigger(page)).toHaveAttribute("aria-label", "Sort by: Oldest");
    await expectRows(page, { sort: "oldest", page: 3 });
  });

  test("Back returns to the previous view (push), and resets the search field from the URL", async ({
    page,
  }) => {
    await page.goto("/transactions?q=co");
    await expect(searchField(page)).toHaveValue("co");
    await choose(page, sortTrigger(page), "Oldest");
    await expect(page).toHaveURL(/\?q=co&sort=oldest$/);
    await page.goBack();
    await expect(page).toHaveURL(/\?q=co$/);
    await expect(sortTrigger(page)).toHaveAttribute("aria-label", "Sort by: Latest");
    await expectRows(page, { q: "co" });
  });
});

test("US-09 AC3 at 375 px: rows as cards, at most three page numbers and an ellipsis", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/transactions");
  await expect(names(page)).toHaveCount(10);
  // 2.9: the header row stays in the DOM, visually hidden (one clipped pixel at most).
  await expect(table(page).getByRole("columnheader")).toHaveCount(4);
  expect((await table(page).locator("thead").boundingBox())!.height).toBeLessThanOrEqual(1);
  await expect(pagination(page).getByRole("button", { name: /^Page \d+$/ })).toHaveText([
    "1",
    "2",
    "3",
  ]);
  await expect(pagination(page).getByText("…")).toBeVisible();
  await pageButton(page, 3).click();
  await expect(pagination(page).getByRole("button", { name: /^Page \d+$/ })).toHaveText([
    "2",
    "3",
    "4",
  ]);
  // Prev and Next are icons with their names.
  await expect(prev(page)).toBeVisible();
  await expect(prev(page).getByText(COPY.prev)).toBeHidden();
  expect(await noHorizontalScroll(page)).toBe(true);
});

test.describe("US-10 search", () => {
  test("'co' shows its rows; the URL gains q=co by replace, without a history entry", async ({
    page,
  }) => {
    await page.goto("/transactions");
    await expect(names(page)).toHaveCount(10);
    const length = await page.evaluate(() => history.length);
    await searchField(page).fill("co");
    await expect(page).toHaveURL(/\/transactions\?q=co$/);
    await expect(names(page)).toHaveText(FIGURES.search.co.map((t) => t.name));
    expect(await page.evaluate(() => history.length)).toBe(length);
    await expect(
      statusLine(page, COPY.transactionsStatus(FIGURES.search.co.length, 1, 1)),
    ).toHaveCount(1);
  });

  test("'a' then 'co' ends on 'co' (the latest navigation wins)", async ({ page }) => {
    await page.goto("/transactions");
    await searchField(page).fill("a");
    await searchField(page).fill("co");
    await expect(page).toHaveURL(/\/transactions\?q=co$/);
    await expect(names(page)).toHaveText(FIGURES.search.co.map((t) => t.name));
    await expect(searchField(page)).toHaveValue("co");
  });

  test("from page 3 a search lands on page 1, with no page in the URL; Enter applies at once", async ({
    page,
  }) => {
    await page.goto("/transactions?page=3");
    await searchField(page).fill("a");
    await searchField(page).press("Enter");
    await expect(page).toHaveURL(/\/transactions\?q=a$/);
    await expect(pageButton(page, 1)).toHaveAttribute("aria-current", "page");
    await expectRows(page, { q: "a" });
  });

  test("the results region is busy while the answer is pending, and the old rows stay", async ({
    page,
  }) => {
    await page.goto("/transactions");
    await expect(names(page)).toHaveCount(10);
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route(
      (url) => url.pathname === "/transactions" && url.searchParams.get("q") === "co",
      async (route) => {
        await held;
        await route.continue();
      },
    );
    await searchField(page).fill("co");
    await expect(results(page)).toHaveAttribute("aria-busy", "true");
    await expectRows(page, {});
    release();
    await expect(results(page)).toHaveAttribute("aria-busy", "false");
    await expect(names(page)).toHaveText(FIGURES.search.co.map((t) => t.name));
  });

  test("AC2: no match shows the line and no pagination; the typed text stays", async ({ page }) => {
    await page.goto("/transactions");
    await searchField(page).fill("xyz");
    await expect(page).toHaveURL(/\?q=xyz$/);
    await expect(table(page).getByRole("cell", { name: COPY.transactionsNoResults })).toBeVisible();
    await expect(pagination(page)).toHaveCount(0);
    await expect(searchField(page)).toHaveValue("xyz");
    await expect(statusLine(page, COPY.transactionsNoResults)).toHaveCount(1);
  });
});

test.describe("US-11 sort", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const sort of TRANSACTION_SORTS) {
    const label = COPY.transactionSorts[sort];
    test(`'${label}': its first and last row (4.3); the trigger shows the current option`, async ({
      page,
    }) => {
      const sorted = view({ sort });
      await page.goto("/transactions");
      if (sort !== "latest") await choose(page, sortTrigger(page), label);
      await expect(sortTrigger(page)).toHaveAttribute("aria-label", `Sort by: ${label}`);
      await expect(page).toHaveURL(
        sort === "latest" ? /\/transactions$/ : new RegExp(`\\?sort=${sort}$`),
      );
      await expect(names(page)).toHaveText(sorted.items.map((t) => t.name));

      await pageButton(page, sorted.pageCount).click();
      await expectRows(page, { sort, page: sorted.pageCount });

      await sortTrigger(page).click();
      await expect(option(page, label)).toHaveAttribute("aria-selected", "true");
      await expect(option(page, label)).toHaveCSS("font-weight", "700");
    });
  }
});

test.describe("US-12 category", () => {
  test("each category shows its count; a choice from page 2 lands on page 1", async ({ page }) => {
    await page.goto("/transactions?page=2");
    for (const category of CATEGORIES) {
      const count = FIGURES.byCategory[category]!.length;
      await choose(page, categoryTrigger(page), category);
      await expect(page).toHaveURL(`/transactions?${new URLSearchParams({ category }).toString()}`);
      await expect(
        statusLine(page, COPY.transactionsStatus(count, 1, Math.max(1, Math.ceil(count / 10)))),
      ).toHaveCount(1);
      await expect(names(page)).toHaveCount(Math.min(10, count));
      await expect(pageButton(page, 1)).toHaveAttribute("aria-current", "page");
    }
    await choose(page, categoryTrigger(page), COPY.allTransactions);
    await expect(page).toHaveURL(/\/transactions$/);
    await expectRows(page, {});
  });

  test("search, sort and category together, in the contract's URL order", async ({ page }) => {
    await page.goto("/transactions");
    await searchField(page).fill("a");
    await expect(page).toHaveURL(/\?q=a$/);
    await choose(page, sortTrigger(page), COPY.transactionSorts["a-to-z"]);
    await choose(page, categoryTrigger(page), "Dining Out");
    await expect(page).toHaveURL(/\/transactions\?q=a&category=Dining\+Out&sort=a-to-z$/);
    await expectRows(page, { q: "a", category: "Dining Out", sort: "a-to-z" });
    await expect(names(page)).toHaveCount(FIGURES.search.aDiningOut);
  });
});

test("US-13: 'co' and Entertainment match nothing: the line, the header row, no pagination", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/transactions?q=co&category=Entertainment");
  expect(FIGURES.search.coEntertainment).toBe(0);
  await expect(table(page).getByRole("cell", { name: COPY.transactionsNoResults })).toBeVisible();
  await expect(table(page).getByRole("columnheader")).toHaveCount(4);
  await expect(pagination(page)).toHaveCount(0);
  await expect(searchField(page)).toHaveValue("co");
});

test("empty-all: 'No transactions yet', also with a category", async ({ page, request }) => {
  await seedVariant(request, page, "empty-all");
  for (const path of ["/transactions", "/transactions?category=Bills"]) {
    await page.goto(path);
    await expect(table(page).getByRole("cell", { name: COPY.transactionsEmpty })).toBeVisible();
    await expect(pagination(page)).toHaveCount(0);
  }
});

test.describe("US-19 the Budgets link's address", () => {
  test("AC1: ?category=Dining+Out&page=1 shows Dining Out's rows (4.6)", async ({ page }) => {
    await page.goto("/transactions?category=Dining+Out&page=1");
    await expect(names(page)).toHaveText(FIGURES.diningOut.map((t) => t.name));
    await expect(categoryTrigger(page)).toHaveAttribute("aria-label", "Category: Dining Out");
  });

  test("AC2: with few-transactions, ?category=Bills&page=1 shows the no-results state", async ({
    page,
    request,
  }) => {
    await seedVariant(request, page, "few-transactions");
    await page.goto("/transactions?category=Bills&page=1");
    await expect(table(page).getByRole("cell", { name: COPY.transactionsNoResults })).toBeVisible();
    await expect(pagination(page)).toHaveCount(0);
  });
});

test.describe("US-32 the keyboard walkthrough (2.11)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Tab: the field, Sort, Category, the page numbers, Next; Prev skipped while disabled", async ({
    page,
  }) => {
    await page.goto("/transactions");
    await expect(names(page)).toHaveCount(10);
    await searchField(page).focus();
    await tabTo(page, sortTrigger(page));
    await tabTo(page, categoryTrigger(page));
    for (let n = 1; n <= FIGURES.pageCount; n++) await tabTo(page, pageButton(page, n));
    await tabTo(page, next(page));
  });

  test("a menu by keys: Enter opens on the current option, arrows move, Enter chooses; Escape and Tab close without choosing", async ({
    page,
  }) => {
    await page.goto("/transactions");
    await sortTrigger(page).focus();
    await page.keyboard.press("Enter");
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeFocused();
    const highlighted = async () =>
      page.evaluate(() => {
        const id = document.activeElement?.getAttribute("aria-activedescendant");
        return id ? document.getElementById(id)?.textContent : null;
      });
    expect(await highlighted()).toBe(COPY.transactionSorts.latest);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    expect(await highlighted()).toBe(COPY.transactionSorts["a-to-z"]);
    await page.keyboard.press("Enter");
    await expect(listbox).toHaveCount(0);
    await expect(page).toHaveURL(/\?sort=a-to-z$/);
    await expect(sortTrigger(page)).toBeFocused();
    await expectRows(page, { sort: "a-to-z" });

    await page.keyboard.press("Tab");
    await expect(categoryTrigger(page)).toBeFocused();
    await page.keyboard.press(" ");
    await page.keyboard.press("End");
    expect(await highlighted()).toBe(CATEGORIES.at(-1));
    await page.keyboard.press("Home");
    expect(await highlighted()).toBe(COPY.allTransactions);
    await page.keyboard.press("Escape");
    await expect(listbox).toHaveCount(0);
    await expect(categoryTrigger(page)).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(listbox).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(listbox).toHaveCount(0);
    await expect(pageButton(page, 1)).toBeFocused();
    await expect(page).toHaveURL(/\?sort=a-to-z$/);

    await pageButton(page, 2).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\?sort=a-to-z&page=2$/);
    await expect(pageButton(page, 2)).toBeFocused();
  });
});

test.describe("US-33 four widths", () => {
  for (const width of [1440, 768, 375, 320]) {
    test(`${width} px: no horizontal scroll; the longest name is on one line with its full text, its amount not clipped`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      const row = FIGURES.widestAmount;
      await page.goto(`/transactions?q=${encodeURIComponent(FIGURES.longestName)}`);
      await expect(names(page)).toHaveCount(view({ q: FIGURES.longestName }).total);
      expect(await noHorizontalScroll(page)).toBe(true);
      // Every row of that name: one line, cut with an ellipsis when it does not fit.
      const lines = await names(page)
        .getByText(FIGURES.longestName, { exact: true })
        .evaluateAll((elements) =>
          elements.map((element) => {
            const style = getComputedStyle(element);
            return {
              text: element.textContent,
              nowrap: style.whiteSpace === "nowrap",
              ellipsis: style.textOverflow === "ellipsis",
              oneLine: element.getBoundingClientRect().height < 30,
            };
          }),
        );
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        expect(line).toEqual({
          text: FIGURES.longestName,
          nowrap: true,
          ellipsis: true,
          oneLine: true,
        });
      }

      // The widest pagination: "… 2 3 4 …" below 768 px, every number above.
      await page.goto("/transactions?page=3");
      await expect(names(page)).toHaveCount(10);
      expect(await noHorizontalScroll(page)).toBe(true);

      await page.goto(`/transactions?q=${encodeURIComponent(row.name)}`);
      const amount = bodyRows(page)
        .getByRole("cell")
        .filter({ hasText: formatSignedMoney(row.amount) });
      expect(await amount.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
        true,
      );
      expect(await noHorizontalScroll(page)).toBe(true);
    });
  }

  test("a cut name: hover, focus and the pointer on the tooltip keep it open; Escape hides it", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/transactions");
    const transaction = FIGURES.defaultPage[0]!;
    const text = names(page).getByText(transaction.name, { exact: true });
    // No seed name is cut at 1440 px; narrowing the name's box (element.style, CSP-safe) lets
    // the component's ResizeObserver find it cut, as the Overview spec does.
    await text.locator("..").evaluate((element: HTMLElement) => {
      element.style.maxInlineSize = "24px";
    });
    const target = text.locator(".."); // the TruncatedText root
    await expect(target).toHaveAttribute("tabindex", "0");
    await expect(target).toHaveText(transaction.name);

    await target.hover();
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toHaveText(transaction.name);
    const nameBox = (await target.boundingBox())!;
    const tipBox = (await tooltip.boundingBox())!;
    expect(tipBox.y + tipBox.height).toBeLessThanOrEqual(nameBox.y);
    await page.mouse.move(tipBox.x + tipBox.width / 2, tipBox.y + tipBox.height / 2, { steps: 5 });
    await expect(tooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveCount(0);

    await searchField(page).focus();
    await tabTo(page, sortTrigger(page));
    await tabTo(page, categoryTrigger(page));
    await tabTo(page, target);
    await expect(page.getByRole("tooltip")).toHaveText(transaction.name);
  });

  test.describe("touch", () => {
    test.use({ hasTouch: true, viewport: { width: 375, height: 812 } });

    test("a tap on a cut name shows its tooltip; a tap elsewhere hides it", async ({ page }) => {
      await page.goto("/transactions");
      const transaction = FIGURES.defaultPage[0]!;
      const text = names(page).getByText(transaction.name, { exact: true });
      await text.locator("..").evaluate((element: HTMLElement) => {
        element.style.maxInlineSize = "24px";
      });
      const target = text.locator("..");
      await expect(target).toHaveAttribute("tabindex", "0");
      await target.tap();
      await expect(page.getByRole("tooltip")).toHaveText(transaction.name);
      await page.getByRole("heading", { name: PAGE_NAMES.transactions, level: 1 }).tap();
      await expect(page.getByRole("tooltip")).toHaveCount(0);
    });
  });
});

test.describe("US-34 hover and focus", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the field and a trigger: beige-500, grey-500 on hover, grey-900 on focus", async ({
    page,
  }) => {
    await page.goto("/transactions");
    for (const control of [searchField(page), sortTrigger(page)]) {
      await expect(control).toHaveCSS("border-top-color", BEIGE_500);
      await control.hover();
      await expect(control).toHaveCSS("border-top-color", GREY_500);
      await control.focus();
      await page.mouse.move(0, 0);
      await expect(control).toHaveCSS("border-top-color", GREY_900);
      await page.locator("body").click({ position: { x: 1, y: 1 } });
    }
    await searchField(page).focus();
    await tabTo(page, sortTrigger(page));
  });

  test("a page button turns beige-100 with a grey-900 border; an option's text grey-500; a disabled Prev keeps its look", async ({
    page,
  }) => {
    await page.goto("/transactions");
    await pageButton(page, 2).hover();
    await expect(pageButton(page, 2)).toHaveCSS("background-color", BEIGE_100);
    await expect(pageButton(page, 2)).toHaveCSS("border-top-color", GREY_900);
    await expect(pageButton(page, 2)).toHaveCSS("color", GREY_900);

    const before = await prev(page).evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.backgroundColor, style.borderTopColor, style.color];
    });
    await prev(page).hover({ force: true });
    expect(
      await prev(page).evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.backgroundColor, style.borderTopColor, style.color];
      }),
    ).toEqual(before);

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
    await page.goto("/transactions");
    await expect(names(page)).toHaveCount(10);
    expect(await seriousA11yViolations(page)).toEqual([]);

    await page.goto("/transactions?q=xyz");
    await expect(table(page).getByRole("cell", { name: COPY.transactionsNoResults })).toBeVisible();
    expect(await seriousA11yViolations(page)).toEqual([]);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/transactions");
    await expect(names(page)).toHaveCount(10);
    expect(await seriousA11yViolations(page)).toEqual([]);

    await sortTrigger(page).click();
    await expect(page.getByRole("listbox")).toBeVisible();
    expect(await seriousA11yViolations(page)).toEqual([]);
  });

  test("empty-all", async ({ page, request }) => {
    await seedVariant(request, page, "empty-all");
    await page.goto("/transactions");
    await expect(table(page).getByRole("cell", { name: COPY.transactionsEmpty })).toBeVisible();
    expect(await seriousA11yViolations(page)).toEqual([]);
  });
});
