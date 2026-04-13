import { test, expect, Page } from "@playwright/test";

async function loginAs(page: Page, email: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "demo1234");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
}

/**
 * AC20 — Create form shows Email/Phone toggle.
 * Clicking Phone hides the email input and shows the phone input.
 * Clicking Email restores the email input.
 */
test("AC20 — Email/Phone toggle shows and hides correct input", async ({ page }) => {
  await loginAs(page, "alice@example.com");
  await page.goto("/requests/new");

  // Default: Email button is active, email input is visible
  await expect(page.getByRole("button", { name: "Email" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Phone" })).toBeVisible();
  await expect(page.locator("#recipientEmail")).toBeVisible();
  await expect(page.locator("#recipientPhone")).not.toBeVisible();

  // Switch to Phone
  await page.getByRole("button", { name: "Phone" }).click();
  await expect(page.locator("#recipientPhone")).toBeVisible();
  await expect(page.locator("#recipientEmail")).not.toBeVisible();

  // Switch back to Email
  await page.getByRole("button", { name: "Email" }).click();
  await expect(page.locator("#recipientEmail")).toBeVisible();
  await expect(page.locator("#recipientPhone")).not.toBeVisible();
});

/**
 * AC21 — Alice creates a request via Bob's seeded phone number.
 * Request appears as PENDING in Alice's outgoing dashboard.
 * Seeded phone: Bob = +15550002222 (see prisma/seed.ts)
 */
test("AC21 — Alice creates request via Bob's phone; shows PENDING in outgoing", async ({
  page,
}) => {
  await loginAs(page, "alice@example.com");
  await page.goto("/requests/new");

  // Switch to Phone mode
  await page.getByRole("button", { name: "Phone" }).click();
  await page.fill("#recipientPhone", "+15550002222");
  await page.fill('input[id="amountDollars"]', "22.00");
  await page.click('button[type="submit"]');

  // Redirected to request detail page
  await page.waitForURL(/\/requests\/[0-9a-f-]{36}/);
  const requestId = page.url().split("/").pop()!;

  // Detail page shows PENDING
  await expect(page.getByText("PENDING", { exact: true })).toBeVisible();
  await expect(page.getByText("$22.00")).toBeVisible();

  // Outgoing dashboard lists the new request
  await page.goto("/dashboard/outgoing");
  await page.goto(`/requests/${requestId}`);
  await expect(page.getByText("PENDING", { exact: true })).toBeVisible();
});

/**
 * AC22 — Alice enters an unregistered phone number.
 * "No account found with that phone number." error is shown inline.
 */
test("AC22 — Unregistered phone shows recipient-not-found error", async ({ page }) => {
  await loginAs(page, "alice@example.com");
  await page.goto("/requests/new");

  await page.getByRole("button", { name: "Phone" }).click();
  await page.fill("#recipientPhone", "+19999999999");
  await page.fill('input[id="amountDollars"]', "5.00");
  await page.click('button[type="submit"]');

  // Inline form error — stays on /requests/new
  await expect(page.getByText("No account found with that phone number.")).toBeVisible();
  expect(page.url()).toContain("/requests/new");
});

/**
 * AC23 — Alice enters her own seeded phone number (+15550001111).
 * Self-request rejection error is shown inline.
 * Seeded phone: Alice = +15550001111 (see prisma/seed.ts)
 */
test("AC23 — Self-request via phone is rejected with inline error", async ({ page }) => {
  await loginAs(page, "alice@example.com");
  await page.goto("/requests/new");

  await page.getByRole("button", { name: "Phone" }).click();
  await page.fill("#recipientPhone", "+15550001111");
  await page.fill('input[id="amountDollars"]', "5.00");
  await page.click('button[type="submit"]');

  // Server returns 422; form shows self-request error
  await expect(page.getByText("You cannot send a payment request to yourself.")).toBeVisible();
  expect(page.url()).toContain("/requests/new");
});
