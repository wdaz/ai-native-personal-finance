import type { APIRequestContext, Locator, Page, Request } from "@playwright/test";
import { potFigures } from "@/scripts/seed-figures";
import { firstFreeTheme, potFill, potPercent } from "@/src/domain/pots";
import { createDb, type Db } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { THEME_LABEL } from "@/src/server/overview";
import { themeFromHex } from "@/src/server/seed";
import { COPY } from "@/src/shared/copy";
import { THEMES, type Theme } from "@/src/shared/enums";
import { formatMoney, formatPercent } from "@/src/shared/money";
import { PotsDtoSchema, type PotDto } from "@/src/shared/schemas";
import { PAGE_NAMES } from "@/src/ui/nav";
import {
  expect,
  loginViaApi,
  resetDemoData,
  seriousA11yViolations,
  tabTo,
  test,
} from "../fixtures/e2e";
import { RUN_MODE, callTool, expectToolsReady, listTools } from "../fixtures/webmcp";

/**
 * SPEC-pots §7, the E2E and WebMCP rows. Every figure comes from `potFigures()`
 * (`scripts/seed-figures.ts`, H16 (2)), which runs the domain's own functions over the seed, and is
 * formatted with the shared functions; none is typed. Changes made "in another context" go through
 * the API with the page's own request context (it shares the browser's cookies). No time-based
 * waits: the tests wait for the page's text, the URL or a request.
 */
const F = potFigures((hex) => THEME_LABEL.get(themeFromHex(hex))!);
const SEED_POTS = F.seed.pots;
const pot = (name: string) => SEED_POTS.find((p) => p.name === name)!;
const HOLIDAY = pot("Holiday");
const SAVINGS = pot("Savings");
const CONCERT = pot("Concert Ticket");

const WHITE = "rgb(255, 255, 255)";
const BEIGE_100 = "rgb(248, 244, 240)";
const BEIGE_500 = "rgb(152, 144, 139)";
const GREY_500 = "rgb(105, 104, 104)";
const RED = "rgb(201, 71, 54)";

/** The bar's width attribute as the card draws it (`PotCard`'s `barWidth`). */
const barWidth = (total: number, target: number) => {
  const fill = potFill(total, target);
  return fill === 0 ? "0%" : `${(fill / 100).toFixed(2)}%`;
};
/** A used theme's option as heard: "Green , Already used" (the label, then a hidden ", "). */
const usedOption = (theme: string) => new RegExp(`^${theme}\\s*, ${COPY.alreadyUsed}$`);
/** "4836.01": the text a person types for an amount in cents. */
const typed = (cents: number) => (cents / 100).toFixed(2);

const main = (page: Page) => page.getByRole("main");
const cards = (page: Page) => main(page).getByRole("region");
const card = (page: Page, name: string) => main(page).getByRole("region", { name, exact: true });
const bar = (scope: Locator) => scope.locator("svg rect");
const dialog = (page: Page) => page.getByRole("dialog");
const notice = (page: Page, text: string) =>
  page.getByRole("status").filter({ hasText: new RegExp(`^${text}$`) });
const addButton = (page: Page) => page.getByRole("button", { name: COPY.addNewPot });
const nameField = (page: Page) => dialog(page).getByRole("textbox", { name: COPY.potName });
const targetField = (page: Page) => dialog(page).getByRole("textbox", { name: COPY.target });
const themeTrigger = (page: Page) => dialog(page).getByRole("button", { name: /^Theme/ });
const amountField = (page: Page, kind: "add" | "withdraw") =>
  dialog(page).getByRole("textbox", {
    name: kind === "add" ? COPY.amountToAdd : COPY.amountToWithdraw,
  });
const confirm = (page: Page, kind: "add" | "withdraw") =>
  dialog(page).getByRole("button", {
    name: kind === "add" ? COPY.confirmAddition : COPY.confirmWithdrawal,
  });

async function openMenu(page: Page, name: string) {
  await page.getByRole("button", { name: `${COPY.potOptions}: ${name}` }).click();
}

async function openMoney(page: Page, name: string, kind: "add" | "withdraw") {
  await page
    .getByRole("button", { name: kind === "add" ? COPY.addMoneyTo(name) : COPY.withdrawFrom(name) })
    .click();
  await expect(amountField(page, kind)).toBeFocused();
}

/** Every write the page sends to the pot routes, so a test can say "no request was sent". */
function potWrites(page: Page): Request[] {
  const sent: Request[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET" && new URL(request.url()).pathname.startsWith("/api/pots")) {
      sent.push(request);
    }
  });
  return sent;
}

async function apiPots(page: Page) {
  const response = await page.request.get("/api/pots");
  expect(response.status()).toBe(200);
  return PotsDtoSchema.parse(await response.json());
}

async function apiPot(page: Page, name: string): Promise<PotDto> {
  return (await apiPots(page)).items.find((p) => p.name === name)!;
}

async function seedVariant(request: APIRequestContext, page: Page, variant: string) {
  expect((await request.post("/api/test/seed", { data: { variant } })).status()).toBe(200);
  await loginViaApi(page); // a seed ends every session
}

/** The pots page, loaded and showing its cards (or its empty card). */
async function gotoPots(page: Page) {
  await page.goto("/pots");
  await expect(page.getByRole("heading", { level: 1, name: PAGE_NAMES.pots })).toBeVisible();
}

async function expectOverviewBalance(page: Page, balance: number) {
  await page.goto("/overview");
  await expect(page.getByText(formatMoney(balance), { exact: true })).toBeVisible();
}

test.beforeEach(async ({ page, request }) => {
  await resetDemoData(request);
  await loginViaApi(page);
});

test.describe("US-21 the pots", () => {
  test("US-21 AC1 the five cards in the seed's order: name, total, percentage, 'Target of …' and the bar", async ({
    page,
  }) => {
    await gotoPots(page);
    await expect(cards(page).locator("h2")).toHaveText(SEED_POTS.map((p) => p.name));
    for (const p of SEED_POTS) {
      const section = card(page, p.name);
      await expect(section).toContainText(COPY.totalSaved);
      await expect(section).toContainText(formatMoney(p.total));
      await expect(section).toContainText(formatPercent(potPercent(p.total, p.target)));
      await expect(section).toContainText(COPY.targetOf(formatMoney(p.target)));
      await expect(bar(section)).toHaveAttribute("width", barWidth(p.total, p.target));
    }
  });

  test("US-21 AC2 'empty-pots': the card 'No pots yet' and 'Add New Pot' in the header (PO-Q3 (a))", async ({
    page,
    request,
  }) => {
    await seedVariant(request, page, "empty-pots");
    await gotoPots(page);
    await expect(page.getByText(COPY.potsEmpty)).toBeVisible();
    await expect(cards(page)).toHaveCount(0);
    await expect(addButton(page)).toBeVisible();
  });

  test("US-05 AC3 (receiving side): Overview's 'See Details' lands on /pots titled 'Personal Finance - Pots' with the five cards", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/overview");
    await page
      .getByRole("heading", { level: 2, name: "Pots" })
      .locator("..")
      .getByRole("link", { name: "See Details ›" })
      .click();
    await expect(page).toHaveURL(`${baseURL}/pots`);
    await expect(page).toHaveTitle("Personal Finance - Pots");
    await expect(page.getByRole("heading", { level: 1, name: "Pots" })).toBeVisible();
    await expect(cards(page)).toHaveCount(SEED_POTS.length);
  });

  test("the login redirect keeps /pots", async ({ browser, baseURL }) => {
    const context = await browser.newContext();
    const fresh = await context.newPage();
    await fresh.goto("/pots");
    await expect(fresh).toHaveURL(`${baseURL}/login?next=%2Fpots`);
    await context.close();
  });
});

test.describe("US-22 add a pot", () => {
  test("US-22 AC1 AC2 US-31 the fields, the counter and the messages; nothing is sent while invalid", async ({
    page,
  }) => {
    const sent = potWrites(page);
    await gotoPots(page);
    await addButton(page).click();
    await expect(dialog(page).getByRole("heading", { name: COPY.addNewPot })).toBeVisible();
    await expect(nameField(page)).toBeFocused();
    await expect(themeTrigger(page)).toContainText(F.firstFree!);
    await expect(dialog(page)).toContainText(COPY.charactersLeft(30));

    await dialog(page).getByRole("button", { name: COPY.addPotSubmit }).click();
    await expect(nameField(page)).toBeFocused();
    await expect(nameField(page)).toHaveAttribute("aria-invalid", "true");
    const describedBy = await nameField(page).getAttribute("aria-describedby");
    expect(describedBy).toContain("-error");
    await expect(dialog(page).getByText(COPY.required)).toHaveCount(2);

    await nameField(page).fill("SAVINGS");
    await expect(dialog(page)).toContainText(COPY.charactersLeft(23));
    await targetField(page).fill("abc");
    await targetField(page).blur();
    await expect(dialog(page).getByText(COPY.potNameTaken)).toBeVisible();
    await expect(dialog(page).getByText(COPY.amountFormat)).toBeVisible();
    // US-31 timing (UK-Q9 (a)): typing keeps the message until the next blur or submit.
    await targetField(page).fill("10");
    await expect(dialog(page).getByText(COPY.amountFormat)).toBeVisible();
    await dialog(page).getByRole("button", { name: COPY.addPotSubmit }).click();
    await expect(dialog(page).getByText(COPY.amountFormat)).toHaveCount(0);
    await expect(nameField(page)).toBeFocused();
    expect(sent).toHaveLength(0);
  });

  test("US-22 AC3 US-36 AC1 a new pot comes last with $0.00, survives a reload and shows in a second tab", async ({
    page,
  }) => {
    await gotoPots(page);
    await addButton(page).click();
    await nameField(page).fill("Rainy Days");
    await targetField(page).fill("1,000");
    await dialog(page).getByRole("button", { name: COPY.addPotSubmit }).click();
    await expect(dialog(page)).toHaveCount(0);

    const expected = [...SEED_POTS.map((p) => p.name), "Rainy Days"];
    await expect(cards(page).locator("h2")).toHaveText(expected);
    const created = card(page, "Rainy Days");
    await expect(created).toContainText(formatMoney(0));
    await expect(created).toContainText(formatPercent(0));
    await expect(bar(created)).toHaveAttribute("width", "0%");

    await page.reload();
    await expect(cards(page).locator("h2")).toHaveText(expected);
    const second = await page.context().newPage();
    await gotoPots(second);
    await expect(cards(second).locator("h2")).toHaveText(expected);
    await second.close();
  });

  test("fifteen pots (4.5, PO-Q4 (a)): the form opens with no theme and 'All themes already have a pot'; 'Add Pot' sends nothing", async ({
    page,
  }) => {
    const used = new Set<Theme>(F.usedThemes);
    for (const [i, theme] of THEMES.filter((t) => !used.has(t)).entries()) {
      const response = await page.request.post("/api/pots", {
        data: { name: `Extra ${i}`, target: 10_000, theme },
      });
      expect(response.status()).toBe(201);
    }
    const sent = potWrites(page);
    await gotoPots(page);
    await expect(cards(page)).toHaveCount(THEMES.length);
    await addButton(page).click();
    await expect(dialog(page).getByText(COPY.allThemesUsed)).toBeVisible();
    await nameField(page).fill("One more");
    await targetField(page).fill("10");
    await dialog(page).getByRole("button", { name: COPY.addPotSubmit }).click();
    await expect(dialog(page).getByText(COPY.allThemesUsed)).toHaveCount(1);
    await expect(themeTrigger(page)).toBeFocused();
    expect(sent).toHaveLength(0);
  });

  test("stale data (2.8): a theme taken elsewhere while the form is open → 'Already used' after submit, until the next blur", async ({
    page,
  }) => {
    await gotoPots(page);
    await addButton(page).click();
    const theme = F.firstFree!;
    await expect(themeTrigger(page)).toContainText(theme);
    const response = await page.request.post("/api/pots", {
      data: { name: "Elsewhere", target: 10_000, theme },
    });
    expect(response.status()).toBe(201);

    await nameField(page).fill("Here");
    await targetField(page).fill("10");
    await dialog(page).getByRole("button", { name: COPY.addPotSubmit }).click();
    await expect(dialog(page).getByText(COPY.alreadyUsed, { exact: true })).toBeVisible();
    await expect(themeTrigger(page)).toHaveAttribute("aria-invalid", "true");

    // The options refreshed: the taken theme is now marked, and a free one is chosen by a click.
    await themeTrigger(page).click();
    await expect(page.getByRole("option", { name: usedOption(theme) })).toBeVisible();
    const next = firstFreeTheme([...F.usedThemes, theme])!;
    await page.getByRole("option", { name: next, exact: true }).click();
    await expect(themeTrigger(page)).toBeFocused();
    await expect(themeTrigger(page)).toHaveAttribute("aria-invalid", "true");
    await dialog(page).getByRole("button", { name: COPY.addPotSubmit }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(card(page, "Here")).toBeVisible();
  });
});

test.describe("US-23 edit a pot", () => {
  test("US-23 AC1 AC2 pre-filled; its own name and theme accepted; Holiday's target $500.00 → the real percentage and a full bar", async ({
    page,
  }) => {
    await gotoPots(page);
    await openMenu(page, HOLIDAY.name);
    await page.getByRole("menuitem", { name: COPY.editPot }).click();
    await expect(dialog(page).getByRole("heading", { name: COPY.editPot })).toBeVisible();
    await expect(nameField(page)).toHaveValue(HOLIDAY.name);
    await expect(targetField(page)).toHaveValue(String(HOLIDAY.target / 100));
    await targetField(page).fill("500");
    await dialog(page).getByRole("button", { name: COPY.saveChanges }).click();
    await expect(dialog(page)).toHaveCount(0);

    const section = card(page, HOLIDAY.name);
    await expect(section).toContainText(formatPercent(F.edits.holiday500));
    await expect(bar(section)).toHaveAttribute("width", "100.00%");
    await page.reload();
    await expect(card(page, HOLIDAY.name)).toContainText(formatPercent(F.edits.holiday500));
  });
});

test.describe("US-24 delete a pot", () => {
  test("US-24 AC1 US-36 AC1 delete Holiday through the '…' menu: the card goes and Overview's balance gets its total back", async ({
    page,
  }) => {
    await gotoPots(page);
    await openMenu(page, HOLIDAY.name);
    await page.getByRole("menuitem", { name: COPY.deletePot }).click();
    const confirmDialog = page.getByRole("dialog", { name: COPY.deleteTitle(HOLIDAY.name) });
    await confirmDialog.getByRole("button", { name: COPY.confirmDeletion }).click();
    await expect(confirmDialog).toHaveCount(0);
    await expect(card(page, HOLIDAY.name)).toHaveCount(0);
    await page.reload();
    await expect(card(page, HOLIDAY.name)).toHaveCount(0);
    await expectOverviewBalance(page, F.deletions.Holiday.balance);
  });

  for (const action of ["delete", "edit", "add money"] as const) {
    test(`US-24 AC2 US-37 AC3 a pot deleted elsewhere first: on ${action} the modal closes, focus on <main>, 'This pot no longer exists', the list refreshed`, async ({
      page,
    }) => {
      await gotoPots(page);
      const { id } = await apiPot(page, HOLIDAY.name);
      if (action === "delete") {
        await openMenu(page, HOLIDAY.name);
        await page.getByRole("menuitem", { name: COPY.deletePot }).click();
      } else if (action === "edit") {
        await openMenu(page, HOLIDAY.name);
        await page.getByRole("menuitem", { name: COPY.editPot }).click();
      } else {
        await openMoney(page, HOLIDAY.name, "add");
      }
      expect((await page.request.delete(`/api/pots/${id}`)).status()).toBe(204);

      if (action === "delete") {
        await dialog(page).getByRole("button", { name: COPY.confirmDeletion }).click();
      } else if (action === "edit") {
        await targetField(page).fill("600");
        await dialog(page).getByRole("button", { name: COPY.saveChanges }).click();
      } else {
        await amountField(page, "add").fill("1");
        await confirm(page, "add").click();
      }
      await expect(dialog(page)).toHaveCount(0);
      await expect(main(page)).toBeFocused();
      await expect(notice(page, COPY.potGone)).toBeVisible();
      await expect(card(page, HOLIDAY.name)).toHaveCount(0);
    });
  }
});

test.describe("US-25 add money", () => {
  test("US-25 AC1 AC2 AC3 US-04 AC2 the preview before and while typing, the balance check, then the card and Overview", async ({
    page,
  }) => {
    const { preview, after } = F.chain.deposit;
    await gotoPots(page);
    await openMoney(page, SAVINGS.name, "add");
    await expect(dialog(page).getByRole("heading")).toHaveText(COPY.addToPotTitle(SAVINGS.name));
    await expect(dialog(page)).toContainText(formatMoney(SAVINGS.total));
    await expect(dialog(page)).toContainText(
      formatPercent(potPercent(SAVINGS.total, SAVINGS.target)),
    );

    await amountField(page, "add").fill(typed(F.seed.balance + 1));
    await amountField(page, "add").blur();
    await expect(dialog(page).getByText(COPY.depositOverBalance)).toBeVisible();

    await amountField(page, "add").fill(typed(10_000));
    await expect(dialog(page)).toContainText(formatMoney(preview.newTotal));
    await expect(dialog(page)).toContainText(formatPercent(preview.percent));
    await confirm(page, "add").click();
    await expect(dialog(page)).toHaveCount(0);

    const saved = after.pots.find((p) => p.name === SAVINGS.name)!;
    await expect(card(page, SAVINGS.name)).toContainText(formatMoney(saved.total));
    await expectOverviewBalance(page, after.balance);
  });

  test("US-25 AC1 Concert Ticket past its target: the real percentage and a full bar", async ({
    page,
  }) => {
    await gotoPots(page);
    await openMoney(page, CONCERT.name, "add");
    await amountField(page, "add").fill(typed(5_000));
    await expect(dialog(page)).toContainText(formatPercent(F.pastTarget.concert.percent));
    await confirm(page, "add").click();
    await expect(dialog(page)).toHaveCount(0);
    const section = card(page, CONCERT.name);
    await expect(section).toContainText(formatPercent(F.pastTarget.concert.percent));
    await expect(bar(section)).toHaveAttribute("width", "100.00%");
  });

  test("US-25 AC2 at a $0.00 balance (4.5, PO-Q2 (a)): each input's message", async ({ page }) => {
    const { id } = await apiPot(page, SAVINGS.name);
    const whole = await page.request.post(`/api/pots/${id}/deposit`, {
      data: { amount: F.seed.balance },
    });
    expect(whole.status()).toBe(200);
    await gotoPots(page);
    await openMoney(page, SAVINGS.name, "add");
    for (const [text, message] of [
      ["", COPY.required],
      ["abc", COPY.amountFormat],
      ["0", COPY.amountNotPositive],
      ["0.01", COPY.depositOverBalance],
    ] as const) {
      await amountField(page, "add").fill(text);
      await amountField(page, "add").blur();
      await expect(dialog(page).getByText(message, { exact: true })).toBeVisible();
    }
  });

  test("stale data (2.8): a deposit elsewhere leaves less than the typed amount → the balance message after submit, still at the next blur", async ({
    page,
  }) => {
    await gotoPots(page);
    await openMoney(page, SAVINGS.name, "add");
    await amountField(page, "add").fill(typed(F.seed.balance));
    const { id } = await apiPot(page, HOLIDAY.name);
    expect(
      (await page.request.post(`/api/pots/${id}/deposit`, { data: { amount: 100 } })).status(),
    ).toBe(200);
    await confirm(page, "add").click();
    await expect(dialog(page).getByText(COPY.depositOverBalance)).toBeVisible();
    // The refresh has landed once the card behind the modal shows the other deposit.
    await expect(main(page).locator("section").filter({ hasText: HOLIDAY.name })).toContainText(
      formatMoney(HOLIDAY.total + 100),
    );
    await amountField(page, "add").blur();
    await expect(dialog(page).getByText(COPY.depositOverBalance)).toBeVisible();
  });
});

test.describe("US-26 withdraw", () => {
  test("US-26 AC1 AC2 AC3 US-04 AC2 the preview, 'Amount exceeds this pot's total', then the card and Overview", async ({
    page,
  }) => {
    const amount = 3_100;
    const after = F.overview.afterHoliday31;
    await gotoPots(page);
    await openMoney(page, HOLIDAY.name, "withdraw");
    await expect(dialog(page).getByRole("heading")).toHaveText(
      COPY.withdrawFromPotTitle(HOLIDAY.name),
    );
    await amountField(page, "withdraw").fill(typed(HOLIDAY.total + 1));
    await amountField(page, "withdraw").blur();
    await expect(dialog(page).getByText(COPY.withdrawalOverTotal)).toBeVisible();

    await amountField(page, "withdraw").fill(typed(amount));
    const left = after.pots.find((p) => p.name === HOLIDAY.name)!;
    await expect(dialog(page)).toContainText(formatMoney(left.total));
    await confirm(page, "withdraw").click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(card(page, HOLIDAY.name)).toContainText(formatMoney(left.total));
    await expectOverviewBalance(page, after.balance);
  });
});

test.describe("US-32 keyboard", () => {
  test("US-32 the '…' menu by keyboard, the modal's trap, Escape and focus return", async ({
    page,
  }) => {
    await gotoPots(page);
    const trigger = page.getByRole("button", { name: `${COPY.potOptions}: ${SAVINGS.name}` });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: COPY.editPot })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(nameField(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();

    const add = page.getByRole("button", { name: COPY.addMoneyTo(SAVINGS.name) });
    await add.focus();
    await page.keyboard.press("Enter");
    await expect(amountField(page, "add")).toBeFocused();
    await tabTo(page, confirm(page, "add"));
    await page.keyboard.press("Escape");
    await expect(add).toBeFocused();
  });

  test("US-32 the '…' menu opened by a click focuses its first item; the Theme field by pointer keeps focus on its trigger", async ({
    page,
  }) => {
    await gotoPots(page);
    await openMenu(page, SAVINGS.name);
    await expect(page.getByRole("menuitem", { name: COPY.editPot })).toBeFocused();
    await page.getByRole("menuitem", { name: COPY.editPot }).click();
    await themeTrigger(page).click();
    await themeTrigger(page).click();
    await expect(themeTrigger(page)).toBeFocused();
    await themeTrigger(page).click();
    await page.getByRole("option", { name: F.firstFree!, exact: true }).click();
    await expect(themeTrigger(page)).toContainText(F.firstFree!);
    await expect(themeTrigger(page)).toBeFocused();
  });
});

test.describe("US-33 widths", () => {
  const columns = async (page: Page) => {
    const xs = await cards(page).evaluateAll((sections) =>
      sections.map((s) => Math.round(s.getBoundingClientRect().left)),
    );
    return new Set(xs).size;
  };
  const noHorizontalScroll = (page: Page) =>
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

  for (const { width, cols } of [
    { width: 1440, cols: 2 },
    { width: 1024, cols: 2 },
    { width: 768, cols: 2 },
    { width: 676, cols: 2 },
    { width: 675, cols: 1 },
    { width: 375, cols: 1 },
    { width: 320, cols: 1 },
  ]) {
    test(`US-33 at ${width} px: ${cols} column(s) (PO-Q7 (a)), no horizontal scroll, the money buttons' labels whole`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await gotoPots(page);
      await expect.poll(() => columns(page)).toBe(cols);
      expect(await noHorizontalScroll(page)).toBe(true);
      for (const p of SEED_POTS) {
        for (const name of [COPY.addMoneyTo(p.name), COPY.withdrawFrom(p.name)]) {
          const clipped = await page
            .getByRole("button", { name })
            .evaluate((button) => button.scrollWidth > button.clientWidth);
          expect(clipped, name).toBe(false);
        }
      }
    });
  }

  test("US-33 at 320 px: a $999,999,999.99 target reads whole", async ({ page }) => {
    const free = THEMES.filter((t) => !F.usedThemes.includes(t));
    expect(
      (
        await page.request.post("/api/pots", {
          data: { name: "Big", target: 99_999_999_999, theme: free[0] },
        })
      ).status(),
    ).toBe(201);
    await page.setViewportSize({ width: 320, height: 900 });
    await gotoPots(page);
    const target = card(page, "Big").getByText(COPY.targetOf(formatMoney(99_999_999_999)));
    await expect(target).toBeVisible();
    expect(await target.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(await noHorizontalScroll(page)).toBe(true);
  });
});

test.describe("US-34 hover and the bars' animation", () => {
  test("US-34 the money buttons go from beige-100 to white with a beige-500 border; 'Delete Pot' keeps its red and is underlined", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoPots(page);
    const add = page.getByRole("button", { name: COPY.addMoneyTo(SAVINGS.name) });
    await expect(add).toHaveCSS("background-color", BEIGE_100);
    await add.hover();
    await expect(add).toHaveCSS("background-color", WHITE);
    await expect(add).toHaveCSS("border-top-color", BEIGE_500);

    await openMenu(page, SAVINGS.name);
    const remove = page.getByRole("menuitem", { name: COPY.deletePot });
    await remove.hover();
    await expect(remove).toHaveCSS("color", RED);
    await expect(remove).toHaveCSS("text-decoration-line", "underline");
    await page.keyboard.press("Escape");

    await page.getByRole("menuitem", { name: COPY.deletePot }).waitFor({ state: "detached" });
    await openMenu(page, SAVINGS.name);
    await page.getByRole("menuitem", { name: COPY.deletePot }).click();
    const back = dialog(page).getByRole("button", { name: COPY.goBack });
    await expect(back).toHaveCSS("min-height", "44px");
    expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    const yes = dialog(page).getByRole("button", { name: COPY.confirmDeletion });
    await yes.hover();
    await expect(yes).toHaveCSS("text-decoration-line", "underline");
  });

  test("US-34 the Pot Name field's border turns grey-500 on hover; a used theme's swatch is at 0.25", async ({
    page,
  }) => {
    await gotoPots(page);
    await addButton(page).click();
    await nameField(page).hover();
    await expect(nameField(page)).toHaveCSS("border-top-color", GREY_500);
    await themeTrigger(page).click();
    const used = page.getByRole("option", { name: usedOption(F.usedThemes[0]!) });
    await expect(used).toHaveAttribute("aria-disabled", "true");
    // The swatch is the option's one element drawn at `--opacity-unavailable`.
    const opacities = await used
      .locator("*")
      .evaluateAll((elements) => elements.map((el) => getComputedStyle(el).opacity));
    expect(opacities).toContain("0.25");
  });

  test("2.11 PO-Q6 (a): the card bar eases over 0.4s and the preview's segments over 0.3s", async ({
    page,
  }) => {
    await gotoPots(page);
    const cardBar = bar(card(page, SAVINGS.name));
    await expect(cardBar).toHaveCSS("transition-duration", "0.4s");
    await expect(cardBar).toHaveCSS("transition-timing-function", "ease");
    await openMoney(page, SAVINGS.name, "add");
    for (const segment of ["staying", "moving"]) {
      const rect = dialog(page).locator(`[data-segment='${segment}']`);
      await expect(rect).toHaveCSS("transition-duration", /^0\.3s(, 0\.3s)*$/);
      await expect(rect).toHaveCSS("transition-timing-function", /^ease(, ease)*$/);
    }
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("2.11: no transition on either bar", async ({ page }) => {
      await gotoPots(page);
      await expect(bar(card(page, SAVINGS.name))).toHaveCSS("transition-duration", "0s");
      await openMoney(page, SAVINGS.name, "add");
      for (const segment of ["staying", "moving"]) {
        await expect(dialog(page).locator(`[data-segment='${segment}']`)).toHaveCSS(
          "transition-duration",
          /^0s(, 0s)*$/,
        );
      }
    });
  });
});

test.describe("write-path 7.5 on this page", () => {
  let db: Db;
  test.beforeAll(() => {
    db = createDb(databaseUrl());
  });
  test.afterAll(async () => {
    await db.$disconnect();
  });

  test("a write refused with 429 shows its message in the modal's error area; the modal stays open", async ({
    page,
  }) => {
    await gotoPots(page);
    await openMoney(page, SAVINGS.name, "add");
    await amountField(page, "add").fill("1");
    await confirm(page, "add").click();
    await expect(dialog(page)).toHaveCount(0);
    // The limiter's key is the address the server saw for that write; fill it up to the limit.
    const { ip } = await db.writeAttempt.findFirstOrThrow({ orderBy: { at: "desc" } });
    // At least the server's limit: playwright.config.ts starts it with WRITE_RATE_LIMIT_MAX=1000.
    const max = Number(process.env.WRITE_RATE_LIMIT_MAX ?? 1000);
    await db.writeAttempt.createMany({
      data: Array.from({ length: max }, () => ({ ip, at: new Date() })),
    });

    await openMoney(page, SAVINGS.name, "add");
    await amountField(page, "add").fill("1");
    await confirm(page, "add").click();
    await expect(dialog(page).getByRole("alert")).toContainText(
      /^Too many changes\. Try again in /,
    );
    await expect(dialog(page)).toBeVisible();
  });

  test("US-37 AC3 a threshold reset on a pot write → the login page with the reset message", async ({
    page,
    baseURL,
  }) => {
    await gotoPots(page);
    const threshold = Number(process.env.RESET_ROW_THRESHOLD ?? 2000);
    await db.transaction.createMany({
      // A move adds no row, so the database goes past the threshold before it.
      data: Array.from({ length: threshold + 1 }, (_, i) => ({
        name: `Not in the seed ${i}`,
        avatar: "not-in-the-seed",
        category: "General" as const,
        date: "2026-08-01T00:00:00Z",
        amount: -1,
        recurring: false,
      })),
    });
    await openMoney(page, SAVINGS.name, "add");
    await amountField(page, "add").fill("1");
    await confirm(page, "add").click();
    await expect(page).toHaveURL(new RegExp(`^${baseURL}/login\\?reason=reset`));
    await expect(page.getByText(COPY.loginAfterReset)).toBeVisible();
  });
});

/** The modal's fade-in finished, so axe reads its colours at full opacity. */
const settled = (page: Page) =>
  dialog(page).evaluate((el) =>
    Promise.all(
      [...el.getAnimations({ subtree: true }), ...(el.parentElement?.getAnimations() ?? [])].map(
        (animation) => animation.finished,
      ),
    ),
  );

test.describe("axe", () => {
  test("NFR-A1 the default seed, a form open, a money modal open and 375 px: no serious violation", async ({
    page,
  }) => {
    await gotoPots(page);
    expect(await seriousA11yViolations(page)).toEqual([]);
    await addButton(page).click();
    await settled(page);
    expect(await seriousA11yViolations(page)).toEqual([]);
    await page.keyboard.press("Escape");
    await openMoney(page, SAVINGS.name, "withdraw");
    await settled(page);
    expect(await seriousA11yViolations(page)).toEqual([]);
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 375, height: 812 });
    expect(await seriousA11yViolations(page)).toEqual([]);
  });

  test("NFR-A1 the empty page: no serious violation", async ({ page, request }) => {
    await seedVariant(request, page, "empty-pots");
    await gotoPots(page);
    expect(await seriousA11yViolations(page)).toEqual([]);
  });
});

test.describe("WebMCP (SPEC-pots 2.13)", () => {
  test.beforeEach(() => {
    test.skip(
      RUN_MODE !== "polyfill",
      `polyfill-mode tests; this run expects WEBMCP_MODE=${RUN_MODE}`,
    );
  });

  const markWindow = (page: Page) =>
    page.evaluate(() => {
      (window as unknown as { __noReload?: boolean }).__noReload = true;
    });
  const stillMarked = (page: Page) =>
    page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload === true);

  test("US-38 AC1 NFR-W3 the page registers exactly the six tools; the indicator reads 'polyfill · 6'", async ({
    page,
  }) => {
    await gotoPots(page);
    await expectToolsReady(page);
    const tools = await listTools(page);
    expect(tools.map((t) => t.name).sort()).toEqual([
      "add_money_to_pot",
      "add_pot",
      "delete_pot",
      "edit_pot",
      "list_pots",
      "withdraw_from_pot",
    ]);
    for (const tool of tools) expect(tool.description.length).toBeLessThanOrEqual(200);
    await expect(page.getByRole("status", { name: COPY.agentToolsPolyfill(6) })).toBeVisible();
  });

  test("US-39 AC2 list_pots returns what the page shows, with ids", async ({ page }) => {
    await gotoPots(page);
    await expectToolsReady(page);
    const result = await callTool(page, "list_pots");
    expect(result.isError).toBeUndefined();
    const dto = PotsDtoSchema.parse(
      Object.fromEntries(
        Object.entries(result.structuredContent as Record<string, unknown>).filter(
          ([key]) => key === "balance" || key === "items",
        ),
      ),
    );
    expect(dto).toEqual(await apiPots(page));
    expect(dto.items.map((p) => p.name)).toEqual(SEED_POTS.map((p) => p.name));
  });

  test("US-40 AC3 add_pot, edit_pot, add_money_to_pot and withdraw_from_pot write with X-Via and the page shows each result without a reload", async ({
    page,
    request,
  }) => {
    await gotoPots(page);
    await expectToolsReady(page);
    await markWindow(page);
    const theme = F.firstFree!;

    const responses: string[] = [];
    page.on("response", (response) => {
      if (response.request().method() !== "GET" && response.url().includes("/api/pots")) {
        responses.push(response.headers()["x-request-id"] ?? "");
      }
    });

    const added = await callTool(page, "add_pot", {
      name: "<script>alert(1)</script>",
      target: 10_000,
      theme,
    });
    expect(added.isError).toBeUndefined();
    await expect(card(page, "<script>alert(1)</script>")).toBeVisible();
    const { id } = (added.structuredContent as { pot: PotDto }).pot;

    await callTool(page, "edit_pot", { id, name: "Agent pot", target: 20_000, theme });
    await expect(card(page, "Agent pot")).toContainText(COPY.targetOf(formatMoney(20_000)));
    await callTool(page, "add_money_to_pot", { id, amount: 5_000 });
    await expect(card(page, "Agent pot")).toContainText(formatMoney(5_000));
    await callTool(page, "withdraw_from_pot", { id, amount: 1_000 });
    await expect(card(page, "Agent pot")).toContainText(formatMoney(4_000));
    expect(await stillMarked(page)).toBe(true);

    expect(responses).toHaveLength(4);
    for (const requestId of responses) {
      const log = await request.get("/api/test/log", { params: { requestId } });
      expect((await log.json()).via).toBe("webmcp");
    }
  });

  test("US-40 AC1 a bad input and a server exceeds_balance return validation with issues; edit_pot with only a name sends nothing", async ({
    page,
  }) => {
    await gotoPots(page);
    await expectToolsReady(page);
    const { id } = await apiPot(page, SAVINGS.name);
    const sent = potWrites(page);

    const bad = await callTool(page, "add_pot", { name: "", target: -1, theme: "Nope" });
    expect(bad).toMatchObject({ isError: true, code: "validation" });
    expect(bad.issues?.length).toBeGreaterThan(0);

    const partial = await callTool(page, "edit_pot", { id, name: "Only a name" });
    expect(partial).toMatchObject({ isError: true, code: "validation" });
    expect(partial.issues?.map((issue) => issue.path[0]).sort()).toEqual(["target", "theme"]);
    expect(sent).toHaveLength(0);

    const over = await callTool(page, "add_money_to_pot", { id, amount: F.seed.balance + 1 });
    expect(over).toMatchObject({ isError: true, code: "validation" });
    expect(over.issues).toEqual([{ path: ["amount"], code: "exceeds_balance" }]);
  });

  test("US-40 AC2 NFR-W5 delete_pot: cancel → cancelled, an unknown id → not_found, a second call → busy, confirm → deleted and the card gone", async ({
    page,
  }) => {
    await gotoPots(page);
    await expectToolsReady(page);
    await markWindow(page);
    const { id } = await apiPot(page, HOLIDAY.name);

    const unknown = await callTool(page, "delete_pot", {
      id: "6f1d3c1e-8a2b-4c3d-9e4f-5a6b7c8d9e0f",
    });
    expect(unknown).toMatchObject({ isError: true, code: "not_found" });

    const cancelled = callTool(page, "delete_pot", { id });
    const confirmDialog = page.getByRole("dialog", { name: COPY.deleteTitle(HOLIDAY.name) });
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: COPY.goBack }).click();
    expect(await cancelled).toMatchObject({ isError: true, code: "cancelled" });

    const deleting = callTool(page, "delete_pot", { id });
    await expect(confirmDialog).toBeVisible();
    expect(await callTool(page, "delete_pot", { id })).toMatchObject({
      isError: true,
      code: "busy",
    });
    await confirmDialog.getByRole("button", { name: COPY.confirmDeletion }).click();
    expect((await deleting).structuredContent).toEqual({ deleted: true });
    await expect(card(page, HOLIDAY.name)).toHaveCount(0);
    expect(await stillMarked(page)).toBe(true);

    const after = await callTool(page, "list_pots");
    expect((after.structuredContent as { balance: { current: number } }).balance.current).toBe(
      F.deletions.Holiday.balance,
    );
  });
});
