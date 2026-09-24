import type { Page } from "@playwright/test";
import { resetIntervalDays } from "@/src/server/env";
import { COPY } from "@/src/shared/copy";
import { formatDate } from "@/src/shared/dates";
import { TEST_IDS } from "@/src/shared/test-ids";
import { expect, loginViaApi, resetDemoData, seriousA11yViolations, test } from "../fixtures/e2e";

/** SPEC-app-shell §2.2, §2.5: the five pages, their names (nav label = `<h1>` = title). */
const PAGES = [
  { path: "/overview", name: "Overview", release2: false },
  { path: "/transactions", name: "Transactions", release2: true },
  { path: "/budgets", name: "Budgets", release2: true },
  { path: "/pots", name: "Pots", release2: true },
  { path: "/recurring-bills", name: "Recurring Bills", release2: true },
] as const;

const GREY_300 = "rgb(179, 179, 179)";
const WHITE = "rgb(255, 255, 255)";
const GREY_900 = "rgb(32, 31, 36)";
const GREY_500 = "rgb(105, 104, 104)";
const BEIGE_100 = "rgb(248, 244, 240)";
const GREEN = "rgb(39, 124, 120)";

/** The one "Main" navigation exposed at the current width — the sidebar's or the bottom bar's (D7). */
const mainNav = (page: Page) => page.getByRole("navigation", { name: "Main" });
const sidebar = (page: Page) => page.getByTestId(TEST_IDS.sidebar);
const heading = (page: Page, name: string) =>
  page.getByRole("heading", { level: 1, name, exact: true });

test.beforeEach(async ({ page, request }) => {
  await resetDemoData(request);
  await loginViaApi(page);
});

for (const { path, name, release2 } of PAGES) {
  test(`US-33 ${path} sits in the shell: titled 'Personal Finance - ${name}', its heading, the current nav item${release2 ? ", 'Coming in Release 2'" : ""}`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(`Personal Finance - ${name}`);
    await expect(heading(page, name)).toBeVisible();
    for (const other of PAGES) {
      const link = mainNav(page).getByRole("link", { name: other.name, exact: true });
      if (other.path === path) await expect(link).toHaveAttribute("aria-current", "page");
      else await expect(link).not.toHaveAttribute("aria-current");
    }
    const notice = page.getByText(COPY.comingInRelease2, { exact: true });
    if (release2) await expect(notice).toBeVisible();
    else await expect(notice).toHaveCount(0);
  });
}

test("US-33 AC1 desktop (1440 px): a full-height 300 px sidebar holds the five pages; no bottom bar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/budgets");

  await expect
    .poll(() => sidebar(page).boundingBox())
    .toEqual({ x: 0, y: 0, width: 300, height: 900 });
  await expect(sidebar(page).getByRole("link")).toHaveCount(5);
  await expect(mainNav(page)).toHaveCount(1);
  await expect(page.getByRole("button", { name: COPY.minimizeMenu })).toBeVisible();
});

test("US-33 AC1 tablet (768 px): a 74 px bottom bar with icons and labels; 'Log out' in the page header", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/budgets");

  await expect(sidebar(page)).toBeHidden();
  await expect
    .poll(() => mainNav(page).boundingBox())
    .toEqual({ x: 0, y: 1024 - 74, width: 768, height: 74 });
  for (const { name } of PAGES) {
    await expect(mainNav(page).getByText(name, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole("main").getByRole("button", { name: "Log out" })).toBeVisible();
});

test("US-33 AC1 phone (375 px): a 52 px bottom bar with icons only, each item still named", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/budgets");

  await expect
    .poll(() => mainNav(page).boundingBox())
    .toEqual({ x: 0, y: 812 - 52, width: 375, height: 52 });
  for (const { name } of PAGES) {
    await expect(mainNav(page).getByRole("link", { name, exact: true })).toBeVisible();
    await expect(mainNav(page).getByText(name, { exact: true })).toBeHidden();
  }
});

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`US-33 AC2 at ${width} px no app page scrolls sideways`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const { path, name } of PAGES) {
      await page.goto(path);
      await expect(heading(page, name)).toBeVisible();
      await expect
        .poll(
          () =>
            page.evaluate(
              () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
            ),
          { message: path },
        )
        .toBeLessThanOrEqual(0);
    }
  });
}

test("US-33 AC3 at 320 px every navigation item and 'Log out' is whole on screen and at least 44 px (SPEC-app-shell §4)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/recurring-bills");

  const controls = [
    ...PAGES.map(({ name }) => mainNav(page).getByRole("link", { name, exact: true })),
    page.getByRole("main").getByRole("button", { name: "Log out" }),
  ];
  for (const control of controls) {
    await expect(control).toBeInViewport({ ratio: 1 });
    await expect
      .poll(async () => (await control.boundingBox())?.width ?? 0)
      .toBeGreaterThanOrEqual(44);
    await expect
      .poll(async () => (await control.boundingBox())?.height ?? 0)
      .toBeGreaterThanOrEqual(44);
  }
});

test.describe("US-35 minimise the sidebar", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const width = async (page: Page) => (await sidebar(page).boundingBox())?.width;
  const stored = (page: Page) => page.evaluate(() => sessionStorage.getItem("pf.sidebar"));

  test("US-35 AC1 'Minimize Menu' collapses the sidebar to 88 px and back; its name, aria-expanded and sessionStorage follow", async ({
    page,
  }) => {
    await page.goto("/pots");
    const minimize = page.getByRole("button", { name: COPY.minimizeMenu });
    await expect(minimize).toHaveAttribute("aria-expanded", "true");

    await minimize.click();
    const expand = page.getByRole("button", { name: COPY.expandMenu });
    await expect(expand).toHaveAttribute("aria-expanded", "false");
    await expect.poll(() => width(page)).toBe(88);
    await expect.poll(() => stored(page)).toBe("collapsed");

    await expand.click();
    await expect(page.getByRole("button", { name: COPY.minimizeMenu })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect.poll(() => width(page)).toBe(300);
    await expect.poll(() => stored(page)).toBeNull();
  });

  test("US-35 AC1 the collapsed state persists for the session — across a reload and a navigation", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/pots");
    await page.getByRole("button", { name: COPY.minimizeMenu }).click();

    await page.reload();
    await expect(page.getByRole("button", { name: COPY.expandMenu })).toBeVisible();
    await expect.poll(() => width(page)).toBe(88);

    await mainNav(page).getByRole("link", { name: "Budgets", exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/budgets`);
    await expect(page.getByRole("button", { name: COPY.expandMenu })).toBeVisible();
  });

  test("US-35 AC2 collapsed items keep their names; labels are hidden and offered as tooltips", async ({
    page,
  }) => {
    await page.goto("/pots");
    await page.getByRole("button", { name: COPY.minimizeMenu }).click();

    for (const { name } of PAGES) {
      const link = mainNav(page).getByRole("link", { name, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("title", name);
      await expect(mainNav(page).getByText(name, { exact: true })).toBeHidden();
    }
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
    await expect(sidebar(page).getByRole("img", { name: "finance" })).toBeVisible();
  });
});

test.describe("US-34 hover states (SPEC-app-shell §2.2, design-tokens 'Component states')", () => {
  test("US-34 AC1 desktop: inactive items and the footer controls turn white; the current item keeps its colours", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/budgets");

    const inactive = mainNav(page).getByRole("link", { name: "Pots", exact: true });
    await expect(inactive).toHaveCSS("color", GREY_300);
    await inactive.hover();
    await expect(inactive).toHaveCSS("color", WHITE);

    const current = mainNav(page).getByRole("link", { name: "Budgets", exact: true });
    await current.hover();
    await expect(current).toHaveCSS("color", GREY_900);
    await expect(current).toHaveCSS("background-color", BEIGE_100);
    await expect(current).toHaveCSS("border-left-color", GREEN);

    for (const name of ["Log out", COPY.minimizeMenu]) {
      const control = page.getByRole("button", { name });
      await expect(control).toHaveCSS("color", GREY_300);
      await control.hover();
      await expect(control).toHaveCSS("color", WHITE);
    }
  });

  test("US-34 AC1 tablet: a bottom-bar tab turns white; the current one is beige with a green bar", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/budgets");

    const inactive = mainNav(page).getByRole("link", { name: "Pots", exact: true });
    await inactive.hover();
    await expect(inactive).toHaveCSS("color", WHITE);

    const current = mainNav(page).getByRole("link", { name: "Budgets", exact: true });
    await expect(current).toHaveCSS("background-color", BEIGE_100);
    await expect(current).toHaveCSS("border-bottom-color", GREEN);
  });

  test("US-34 AC1 phone: the header's 'Log out' goes from grey-500 to grey-900", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/pots");

    const logOut = page.getByRole("main").getByRole("button", { name: "Log out" });
    await expect(logOut).toHaveCSS("color", GREY_500);
    await logOut.hover();
    await expect(logOut).toHaveCSS("color", GREY_900);
  });
});

test("SPEC-app-shell §2.1 no origin-trial meta tag in the test environment (WEBMCP_ORIGIN_TRIAL_TOKEN unset)", async ({
  page,
}) => {
  await page.goto("/overview");
  await expect(heading(page, "Overview")).toBeVisible();
  await expect(page.locator('meta[http-equiv="origin-trial"]')).toHaveCount(0);
});

test("US-33 US-35 NFR-A1 axe: no serious or critical violation on any app page — desktop, collapsed, phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const { path, name } of PAGES) {
    await page.goto(path);
    await expect(heading(page, name)).toBeVisible();
    await expect
      .poll(() => seriousA11yViolations(page), { message: `${path} desktop` })
      .toEqual([]);
  }

  await page.getByRole("button", { name: COPY.minimizeMenu }).click();
  await expect(page.getByRole("button", { name: COPY.expandMenu })).toBeVisible();
  await expect.poll(() => seriousA11yViolations(page), { message: "collapsed" }).toEqual([]);

  await page.setViewportSize({ width: 375, height: 812 });
  for (const { path, name } of PAGES) {
    await page.goto(path);
    await expect(heading(page, name)).toBeVisible();
    await expect.poll(() => seriousA11yViolations(page), { message: `${path} phone` }).toEqual([]);
  }
});

/**
 * US-37 AC2, SPEC-app-shell §2.6 and §7: the banner states the policy and the date of the
 * `ResetLog` row `/api/test/reset` wrote (UTC); the dismissal lasts for the tab — a client-side
 * navigation and a reload keep it (sessionStorage), and every test starts in a fresh context.
 */
test("US-37 AC2 the reset banner shows the reset's date; dismissed, it stays gone for the session", async ({
  page,
  request,
}) => {
  // A reset of this test's own, whose `at` the banner must show; it ends the session, so log in again.
  const { at } = (await (await request.post("/api/test/reset")).json()) as { at: string };
  await loginViaApi(page);
  await page.goto("/overview");

  // getByTestId, not getByRole("status"): T-11's AgentToolsStatus indicator is also
  // role="status" on every authenticated page now, so the role alone is ambiguous.
  const banner = page.getByTestId(TEST_IDS.resetBanner);
  await expect(banner).toHaveText(COPY.resetBanner(resetIntervalDays(), formatDate(at)));
  // It leads the page: above the page's heading.
  await expect
    .poll(async () => {
      const [bannerBox, headingBox] = [
        await banner.boundingBox(),
        await heading(page, "Overview").boundingBox(),
      ];
      return Boolean(bannerBox && headingBox && bannerBox.y < headingBox.y);
    })
    .toBe(true);

  const dismiss = page.getByRole("button", { name: COPY.dismissNotice });
  await expect(dismiss).toHaveCSS("color", GREY_500);
  await dismiss.hover();
  await expect(dismiss).toHaveCSS("color", GREY_900);
  await dismiss.click();
  await expect(banner).toHaveCount(0);

  await mainNav(page).getByRole("link", { name: "Transactions", exact: true }).click();
  await expect(heading(page, "Transactions")).toBeVisible();
  await expect(page.getByTestId(TEST_IDS.resetBanner)).toHaveCount(0);
  await page.reload();
  await expect(heading(page, "Transactions")).toBeVisible();
  await expect(page.getByTestId(TEST_IDS.resetBanner)).toHaveCount(0);
});

test("US-37 AC2 on a phone the banner and its 44 px dismiss button fit at 320 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/overview");
  const dismiss = page.getByRole("button", { name: COPY.dismissNotice });
  await expect(page.getByTestId(TEST_IDS.resetBanner)).toBeInViewport({ ratio: 1 });
  await expect
    .poll(async () => (await dismiss.boundingBox())?.width ?? 0, { message: "tap target" })
    .toBeGreaterThanOrEqual(44);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(320);
});

test("US-37 AC2 a dismissal lasts only until the next reset: after it, the banner is back with the new date", async ({
  page,
  request,
}) => {
  await page.goto("/overview");
  await page.getByRole("button", { name: COPY.dismissNotice }).click();
  await expect(page.getByTestId(TEST_IDS.resetBanner)).toHaveCount(0);

  // The reset ends the session (SPEC-reset-and-test-support §2.6); the same tab logs in again.
  const { at } = (await (await request.post("/api/test/reset")).json()) as { at: string };
  await loginViaApi(page);
  await page.goto("/overview");
  await expect(page.getByTestId(TEST_IDS.resetBanner)).toHaveText(
    COPY.resetBanner(resetIntervalDays(), formatDate(at)),
  );
});
