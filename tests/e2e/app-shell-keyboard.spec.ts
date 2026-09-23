import { COPY } from "@/src/shared/copy";
import { expect, loginViaApi, resetDemoData, tabTo, test } from "../fixtures/e2e";

const NAMES = ["Overview", "Transactions", "Budgets", "Pots", "Recurring Bills"] as const;
const WHITE = "rgb(255, 255, 255)";
const GREY_900 = "rgb(32, 31, 36)";

test.beforeEach(async ({ page, request }) => {
  await resetDemoData(request);
  await loginViaApi(page);
});

/**
 * US-32 AC3 — the documented keyboard walkthrough of the shell at 1440 px (SPEC-app-shell §7):
 * Tab → "Skip to content" (shown on focus) → Overview → Transactions → Budgets → Pots →
 * Recurring Bills → "Log out" → "Minimize Menu". Every stop shows a solid ring inside the row —
 * white on the dark sidebar, grey-900 on the current (beige) item (plan D10). Enter on a nav
 * item navigates.
 */
test("US-32 AC1 AC3 US-34 AC1 desktop walkthrough: skip link, five nav items, footer controls, visible focus; Enter navigates", async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/budgets");

  const skip = page.getByRole("link", { name: COPY.skipToContent });
  await tabTo(page, skip);
  await expect(skip).toBeInViewport();

  const nav = page.getByRole("navigation", { name: "Main" });
  for (const name of NAMES) {
    const link = nav.getByRole("link", { name, exact: true });
    await tabTo(page, link);
    await expect(link).toHaveCSS("outline-color", name === "Budgets" ? GREY_900 : WHITE);
  }
  for (const name of ["Log out", COPY.minimizeMenu]) {
    const control = page.getByRole("button", { name });
    await tabTo(page, control);
    await expect(control).toHaveCSS("outline-color", WHITE);
  }

  await nav.getByRole("link", { name: "Pots", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`${baseURL}/pots`);
  await expect(nav.getByRole("link", { name: "Pots", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("US-32 AC1 SPEC-app-shell §2.8 Enter on 'Skip to content' moves focus to the page's main region", async ({
  page,
}) => {
  await page.goto("/transactions");
  await tabTo(page, page.getByRole("link", { name: COPY.skipToContent }));
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

test("US-35 AC1 AC2 US-32 minimised: Space toggles and focus stays; the tab order is unchanged and every stop is named", async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/overview");
  await page.getByRole("button", { name: COPY.minimizeMenu }).focus();
  await page.keyboard.press("Space");
  const expand = page.getByRole("button", { name: COPY.expandMenu });
  await expect(expand).toBeFocused();

  await page.goto("/overview");
  await tabTo(page, page.getByRole("link", { name: COPY.skipToContent }));
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const name of NAMES) await tabTo(page, nav.getByRole("link", { name, exact: true }));
  await tabTo(page, page.getByRole("button", { name: "Log out" }));
  await tabTo(page, expand);

  await nav.getByRole("link", { name: "Recurring Bills", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`${baseURL}/recurring-bills`);
});

/**
 * US-32 AC3 — the phone walkthrough (375 px): Tab → "Skip to content" → the header's "Log out" →
 * the five bottom-bar items. Enter on the last navigates.
 */
test("US-32 AC1 AC3 phone walkthrough: skip link, header 'Log out', the five bottom-bar items; Enter navigates", async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/pots");

  await tabTo(page, page.getByRole("link", { name: COPY.skipToContent }));
  await tabTo(page, page.getByRole("main").getByRole("button", { name: "Log out" }));
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const name of NAMES) await tabTo(page, nav.getByRole("link", { name, exact: true }));

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`${baseURL}/recurring-bills`);
});
