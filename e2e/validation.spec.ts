import { test, expect, Page } from "@playwright/test";

async function loginAs(page: Page, email: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "demo1234");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
}

async function createRequest(
  page: Page,
  toEmail: string,
  amount: string,
  note: string
): Promise<string> {
  await page.goto("/requests/new");
  await page.fill('input[type="email"]', toEmail);
  await page.fill('input[id="amountDollars"]', amount);
  await page.fill("textarea", note);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/requests\/[0-9a-f-]{36}/);
  return page.url().split("/").pop()!;
}

/**
 * AC8 — Outgoing dashboard shows the authenticated user's sent requests
 * in reverse-chronological order (most recent first).
 */
test("AC8 — Outgoing dashboard lists sent requests; most recent first", async ({
  page,
  context,
}) => {
  await loginAs(page, "alice@example.com");

  // Create two requests in order — second is more recent
  await createRequest(page, "bob@example.com", "10.00", "First request");
  await createRequest(page, "bob@example.com", "20.00", "Second request");

  // Navigate to outgoing dashboard
  await context.clearCookies();
  await loginAs(page, "alice@example.com");
  await page.goto("/dashboard/outgoing");

  // Both requests are visible
  await expect(page.getByText("First request").first()).toBeVisible();
  await expect(page.getByText("Second request").first()).toBeVisible();

  // Most recent (Second request) appears before the earlier one (First request)
  const listText = await page.locator(".divide-y").first().innerText();
  expect(listText.indexOf("Second request")).toBeLessThan(listText.indexOf("First request"));
});

/**
 * AC9 — Incoming dashboard shows requests directed to the authenticated user.
 */
test("AC9 — Incoming dashboard shows received requests", async ({ page, context }) => {
  // Alice creates a request to Bob
  await loginAs(page, "alice@example.com");
  await createRequest(page, "bob@example.com", "30.00", "For Bob incoming test");

  // Bob sees it on the incoming dashboard
  await context.clearCookies();
  await loginAs(page, "bob@example.com");
  await page.goto("/dashboard/incoming");

  await expect(page.getByText("$30.00").first()).toBeVisible();
  await expect(page.getByText("For Bob incoming test").first()).toBeVisible();
  await expect(page.getByText("PENDING", { exact: true }).first()).toBeVisible();
});

/**
 * AC10 — Amount "0" is rejected with an inline error on the form.
 */
test("AC10 — Amount zero is rejected with inline error", async ({ page }) => {
  await loginAs(page, "alice@example.com");
  await page.goto("/requests/new");

  await page.fill('input[type="email"]', "bob@example.com");
  await page.fill('input[id="amountDollars"]', "0");
  await page.click('button[type="submit"]');

  // Client-side inline error — page does not navigate away
  await expect(page.getByText("Enter a positive dollar amount")).toBeVisible();
  expect(page.url()).toContain("/requests/new");
});

/**
 * AC11 — Self-request is rejected with an inline form error.
 * Alice tries to send a request to her own email address.
 */
test("AC11 — Self-request rejected with inline error", async ({ page }) => {
  await loginAs(page, "alice@example.com");
  await page.goto("/requests/new");

  await page.fill('input[type="email"]', "alice@example.com");
  await page.fill('input[id="amountDollars"]', "5.00");
  await page.click('button[type="submit"]');

  // Server returns 422; form shows inline error
  await expect(page.getByText("You cannot send a payment request to yourself")).toBeVisible();
  expect(page.url()).toContain("/requests/new");
});

/**
 * AC12 — Navigating to a nonexistent request ID shows a not-found state.
 */
test("AC12 — Nonexistent request ID shows not-found state", async ({ page }) => {
  await loginAs(page, "alice@example.com");

  // Use a valid UUID format that is not in the database
  await page.goto("/requests/00000000-0000-0000-0000-000000000999");

  await expect(page.getByText("Request not found")).toBeVisible();
  // No action buttons on a not-found page
  await expect(page.getByRole("button", { name: "Pay" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Decline" })).not.toBeVisible();
});

/**
 * AC13 — Note over 200 characters is rejected.
 * page.fill() bypasses the HTML maxLength attribute, triggering client-side validation.
 */
test("AC13 — Note over 200 characters is rejected with inline error", async ({ page }) => {
  await loginAs(page, "alice@example.com");
  await page.goto("/requests/new");

  const longNote = "A".repeat(201);
  await page.fill('input[type="email"]', "bob@example.com");
  await page.fill('input[id="amountDollars"]', "5.00");
  await page.fill("textarea", longNote);
  await page.click('button[type="submit"]');

  // Client-side validation fires before submit; inline error shown
  await expect(page.getByText("Note must be 200 characters or fewer")).toBeVisible();
  expect(page.url()).toContain("/requests/new");
});
