import { COPY } from "@/src/shared/copy";
import { demoCredentials } from "@/src/server/env";
import type { Page } from "@playwright/test";
import { expect, resetDemoData, test } from "../fixtures/e2e";

const demo = demoCredentials();
const HELPER = "Passwords must be at least 8 characters";

const nameField = (page: Page) => page.getByLabel("Name", { exact: true });
const emailField = (page: Page) => page.getByLabel("Email", { exact: true });
const passwordField = (page: Page) => page.getByLabel("Create Password", { exact: true });
const createButton = (page: Page) =>
  page.getByRole("button", { name: "Create Account", exact: true });

async function fillSignup(page: Page, name: string, email: string, password: string) {
  await nameField(page).fill(name);
  await emailField(page).fill(email);
  await passwordField(page).fill(password);
}

test.beforeEach(async ({ request }) => {
  await resetDemoData(request);
});

test("US-02 AC1 US-31 empty fields each show 'Can't be empty', the first is focused, nothing is sent", async ({
  page,
}) => {
  let signupRequests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/auth/signup") signupRequests += 1;
  });
  await page.goto("/signup");
  await expect(passwordField(page)).toHaveAccessibleDescription(HELPER);
  await createButton(page).click();

  await expect(nameField(page)).toHaveAccessibleDescription(COPY.required);
  await expect(emailField(page)).toHaveAccessibleDescription(COPY.required);
  await expect(passwordField(page)).toHaveAccessibleDescription(`${COPY.required} ${HELPER}`);
  await expect(nameField(page)).toBeFocused();
  expect(signupRequests).toBe(0);
});

test("US-02 AC1 a malformed email and a short password show their own messages", async ({
  page,
}) => {
  await page.goto("/signup");
  // Name and password first, then the email, then Enter in the email field: the email is
  // never blurred, so only the submit handler can show its message — and it runs only if the
  // browser's own `type="email"` check does not block the submit first (it would, without
  // `noValidate`; final review I2).
  await nameField(page).fill("Alex");
  await passwordField(page).fill("short");
  await emailField(page).fill("alex@");
  await emailField(page).press("Enter");

  await expect(emailField(page)).toHaveAccessibleDescription(COPY.emailInvalid);
  await expect(passwordField(page)).toHaveAccessibleDescription(
    `${COPY.passwordTooShort} ${HELPER}`,
  );
  await expect(nameField(page)).toHaveAccessibleDescription("");
  await expect(emailField(page)).toBeFocused();
});

test("US-02 AC2 a valid sign-up creates nothing and points to the demo account", async ({
  page,
  baseURL,
}) => {
  await page.goto("/signup");
  await fillSignup(page, "Alex", "alex@example.com", "long-enough-password");
  await createButton(page).click();

  const notice = page.getByRole("status").filter({ hasText: COPY.goToLogin });
  await expect(notice).toContainText(COPY.signupDisabled(demo.email, demo.password));
  await expect(notice).toBeFocused();
  await expect(nameField(page)).toHaveCount(0);
  const session = await page.request.get("/api/auth/session");
  expect(await session.json()).toEqual({ authenticated: false });

  await notice.getByRole("link", { name: COPY.goToLogin }).click();
  await expect(page).toHaveURL(`${baseURL}/login`);
});

test("US-02 AC3 login and sign-up link to each other", async ({ page, baseURL }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Sign Up", exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/signup`);
  await expect(page.getByRole("heading", { level: 1, name: "Sign Up" })).toBeVisible();

  await page.getByRole("link", { name: "Login", exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/login`);
  await expect(page.getByRole("heading", { level: 1, name: "Login" })).toBeVisible();
});

test("US-02 a server-side validation answer shows under its field (SPEC-auth §2.10)", async ({
  page,
}) => {
  await page.route("**/api/auth/signup", (route) =>
    route.fulfill({
      status: 400,
      json: { error: "validation", issues: [{ path: ["email"], code: "invalid_format" }] },
    }),
  );
  await page.goto("/signup");
  await fillSignup(page, "Alex", "alex@example.com", "long-enough-password");
  await createButton(page).click();

  await expect(emailField(page)).toHaveAccessibleDescription(COPY.emailInvalid);
  await expect(emailField(page)).toBeFocused();
});

test("US-02 a server error shows 'Something went wrong. Try again' (plan Q1 (c))", async ({
  page,
}) => {
  await page.route("**/api/auth/signup", (route) =>
    route.fulfill({ status: 500, json: { error: "server_error", message: "Internal error" } }),
  );
  await page.goto("/signup");
  await fillSignup(page, "Alex", "alex@example.com", "long-enough-password");
  await passwordField(page).press("Enter");

  await expect(page.getByText(COPY.signupFailed)).toHaveAttribute("role", "alert");
  await expect(createButton(page)).toBeFocused();
});

test("US-02 a request that gets no answer says the server can't be reached (plan Q1 (c))", async ({
  page,
}) => {
  await page.route("**/api/auth/signup", (route) => route.abort("failed"));
  await page.goto("/signup");
  await fillSignup(page, "Alex", "alex@example.com", "long-enough-password");
  await passwordField(page).press("Enter");

  await expect(page.getByText(COPY.signupUnreachable)).toHaveAttribute("role", "alert");
  await expect(page.getByText(COPY.signupFailed)).toHaveCount(0);
  await expect(createButton(page)).toBeFocused();
});

test("US-02 AC2 what was typed before the page hydrated is kept and submits (final review I1)", async ({
  page,
}) => {
  // A slow network (or an autofill) fills the fields before the scripts run: hold every
  // script chunk, fill, then let them through.
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_next/static/**/*.js", async (route) => {
    await held;
    await route.continue();
  });
  await page.goto("/signup", { waitUntil: "commit" });
  await fillSignup(page, "Alex", "alex@example.com", "long-enough-password");
  release();

  // Hydrated once the toggle works; that click is also the first re-render of the form.
  await expect(async () => {
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(passwordField(page)).toHaveAttribute("type", "text");
  }).toPass();
  await expect(nameField(page)).toHaveValue("Alex");
  await expect(emailField(page)).toHaveValue("alex@example.com");

  await createButton(page).click();
  const notice = page.getByRole("status").filter({ hasText: COPY.goToLogin });
  await expect(notice).toContainText(COPY.signupDisabled(demo.email, demo.password));
});
