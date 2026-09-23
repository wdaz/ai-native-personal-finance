import { COPY, retryAfterMinutes } from "@/src/shared/copy";
import { demoCredentials } from "@/src/server/env";
import type { Page } from "@playwright/test";
import { expect, resetDemoData, test } from "../fixtures/e2e";

const demo = demoCredentials();

const emailField = (page: Page) => page.getByLabel("Email", { exact: true });
const passwordField = (page: Page) => page.getByLabel("Password", { exact: true });
const loginButton = (page: Page) => page.getByRole("button", { name: "Login", exact: true });

async function fillLogin(page: Page, email: string, password: string) {
  await emailField(page).fill(email);
  await passwordField(page).fill(password);
}

test.beforeEach(async ({ request }) => {
  await resetDemoData(request);
});

test("US-01 AC2 US-31 AC1–AC2 empty fields show 'Can't be empty', the first is focused, no request is sent", async ({
  page,
}) => {
  let loginRequests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/auth/login") loginRequests += 1;
  });
  await page.goto("/login");
  await loginButton(page).click();

  await expect(emailField(page)).toHaveAccessibleDescription(COPY.required);
  await expect(passwordField(page)).toHaveAccessibleDescription(COPY.required);
  await expect(emailField(page)).toHaveAttribute("aria-invalid", "true");
  await expect(emailField(page)).toBeFocused();
  expect(loginRequests).toBe(0);
});

test("US-31 AC1 a touched field validates on blur; a malformed email shows its own message", async ({
  page,
}) => {
  await page.goto("/login");
  await emailField(page).fill("not-an-email");
  await emailField(page).blur();
  await expect(emailField(page)).toHaveAccessibleDescription(COPY.emailInvalid);

  await emailField(page).fill(demo.email);
  await emailField(page).blur();
  await expect(emailField(page)).toHaveAccessibleDescription("");
  await expect(emailField(page)).not.toHaveAttribute("aria-invalid", "true");

  await passwordField(page).focus();
  await passwordField(page).blur();
  await expect(passwordField(page)).toHaveAccessibleDescription(COPY.required);
});

test("US-31 AC1 a malformed email on submit shows our message, not the browser's (plan D5)", async ({
  page,
}) => {
  await page.goto("/login");
  // Password first, then the email, then Enter in the email field: the email is never blurred,
  // so only the submit handler can show the message — and it runs only if the browser's own
  // `type="email"` check does not block the submit first (it would, without `noValidate`).
  await passwordField(page).fill("anything");
  await emailField(page).fill("demo@");
  await emailField(page).press("Enter");
  await expect(emailField(page)).toHaveAccessibleDescription(COPY.emailInvalid);
  await expect(emailField(page)).toBeFocused();
});

test("US-01 AC3 wrong credentials show an announced banner, clear the password and focus it", async ({
  page,
}) => {
  await page.goto("/login");
  await fillLogin(page, demo.email, "definitely-not-the-password");
  await loginButton(page).click();

  await expect(page.getByText(COPY.loginIncorrect)).toHaveAttribute("role", "alert");
  await expect(passwordField(page)).toHaveValue("");
  await expect(passwordField(page)).toBeFocused();
  await expect(emailField(page)).toHaveValue(demo.email);
});

test("US-01 AC5 the password toggle shows and hides the password; its name and pressed state follow", async ({
  page,
}) => {
  await page.goto("/login");
  await passwordField(page).fill("secret-value");
  await expect(passwordField(page)).toHaveAttribute("type", "password");

  const show = page.getByRole("button", { name: "Show password" });
  await expect(show).toHaveAttribute("aria-pressed", "false");
  await show.click();
  await expect(passwordField(page)).toHaveAttribute("type", "text");

  const hide = page.getByRole("button", { name: "Hide password" });
  await expect(hide).toHaveAttribute("aria-pressed", "true");
  await hide.click();
  await expect(passwordField(page)).toHaveAttribute("type", "password");
});

test("US-01 a rate-limited login shows 'Too many attempts. Try again in N minutes' (SPEC-auth §2.4, §4)", async ({
  page,
}) => {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const response = await page.request.post("/api/auth/login", {
      data: { email: demo.email, password: "wrong" },
    });
    expect(response.status(), `failed attempt ${attempt} of 10`).toBe(401);
  }
  await page.goto("/login");
  await fillLogin(page, demo.email, demo.password);
  const answer = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/auth/login",
  );
  await loginButton(page).click();
  const response = await answer;
  expect(response.status()).toBe(429);
  const { retryAfter } = (await response.json()) as { retryAfter: number };

  await expect(
    page.getByText(COPY.loginRateLimited(retryAfterMinutes(retryAfter))),
  ).toHaveAttribute("role", "alert");
  await expect(loginButton(page)).toBeFocused();
});

test("US-01 a network failure shows 'Something went wrong. Try again' and re-enables the form", async ({
  page,
}) => {
  await page.route("**/api/auth/login", (route) => route.abort("failed"));
  await page.goto("/login");
  await fillLogin(page, demo.email, demo.password);
  await loginButton(page).click();

  await expect(page.getByText(COPY.loginFailed)).toHaveAttribute("role", "alert");
  await expect(emailField(page)).toBeEnabled();
  await expect(loginButton(page)).toBeFocused();
});

/**
 * These tests land on an app route (/overview, /transactions), which has no page until T-07 or
 * T-10 — Next's not-found page, rendered per request since plan F1, so the automatic CSP check
 * covers the whole journey.
 */
test.describe("after a successful login", () => {
  test("US-01 AC1 the demo credentials log in, land on Overview, and the session survives a reload", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/login");
    await fillLogin(page, demo.email, demo.password);
    await loginButton(page).click();

    await expect(page).toHaveURL(`${baseURL}/overview`);
    await page.reload();
    await expect(page).toHaveURL(`${baseURL}/overview`);
    const session = await page.request.get("/api/auth/session");
    expect(await session.json()).toEqual({ authenticated: true });
  });

  test("US-01 while the request runs the button reads 'Logging in…' and the form is disabled (SPEC-auth §3)", async ({
    page,
    baseURL,
  }) => {
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/api/auth/login", async (route) => {
      await held;
      await route.continue();
    });
    await page.goto("/login");
    await fillLogin(page, demo.email, demo.password);
    await loginButton(page).click();

    await expect(page.getByRole("button", { name: COPY.loggingIn })).toBeDisabled();
    await expect(emailField(page)).toBeDisabled();
    await expect(passwordField(page)).toBeDisabled();
    release();
    await expect(page).toHaveURL(`${baseURL}/overview`);
  });

  test("US-01 AC4 an app URL without a session redirects to login, and back to it after logging in", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/transactions?page=2");
    await expect(page).toHaveURL(`${baseURL}/login?next=%2Ftransactions%3Fpage%3D2`);
    await fillLogin(page, demo.email, demo.password);
    await loginButton(page).click();

    await expect(page).toHaveURL(`${baseURL}/transactions?page=2`);
  });

  test("US-01 AC4 a hostile next never leaves the app: //evil.example lands on Overview", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/login?next=%2F%2Fevil.example");
    await fillLogin(page, demo.email, demo.password);
    await loginButton(page).click();

    await expect(page).toHaveURL(`${baseURL}/overview`);
  });
});
