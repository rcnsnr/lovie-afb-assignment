import { test, expect, Page } from "@playwright/test";

async function loginAs(page: Page, email: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "demo1234");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
}

async function createRequest(page: Page, toEmail: string, amount: string): Promise<string> {
  await page.goto("/requests/new");
  await page.fill('input[type="email"]', toEmail);
  await page.fill('input[id="amountDollars"]', amount);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/requests\/[0-9a-f-]{36}/);
  return page.url().split("/").pop()!;
}

/**
 * AC24 — Clicking Pay shows an inline spinner and disables the Pay button
 * for the duration of the 2–3s simulated payment delay.
 * The request transitions to PAID after the delay resolves.
 */
test("AC24 — Pay button shows spinner and is disabled during payment processing", async ({
  page,
  context,
}) => {
  // ── Alice creates a request ───────────────────────────────────────────────
  await loginAs(page, "alice@example.com");
  const requestId = await createRequest(page, "bob@example.com", "24.00");

  // ── Bob opens the request and clicks Pay ──────────────────────────────────
  await context.clearCookies();
  await loginAs(page, "bob@example.com");
  await page.goto(`/requests/${requestId}`);

  await expect(page.getByRole("button", { name: "Pay" })).toBeVisible();
  await page.getByRole("button", { name: "Pay" }).click();

  // Spinner appears immediately after click (synchronous loading state)
  await expect(page.locator('[data-testid="pay-spinner"]')).toBeVisible();

  // The button containing the spinner is disabled during processing
  await expect(page.locator("button:has([data-testid='pay-spinner'])")).toBeDisabled();

  // Wait for the 2–3s delay to resolve and the request to reach PAID status.
  // Generous timeout (10s) avoids flakiness from network variance.
  await expect(page.getByText("PAID", { exact: true })).toBeVisible({ timeout: 10000 });

  // Spinner is gone once processing completes
  await expect(page.locator('[data-testid="pay-spinner"]')).not.toBeVisible();
});

/**
 * AC25 — A green "Payment successful!" banner appears after pay completes.
 * The banner is visible alongside the PAID status badge.
 * Clicking Decline on a separate fresh request shows no spinner.
 */
test("AC25 — Success banner appears after pay; Decline has no spinner", async ({
  page,
  context,
}) => {
  // ── Alice creates two fresh requests ─────────────────────────────────────
  await loginAs(page, "alice@example.com");
  const payRequestId = await createRequest(page, "bob@example.com", "25.10");
  const declineRequestId = await createRequest(page, "bob@example.com", "25.20");

  // ── Bob logs in ───────────────────────────────────────────────────────────
  await context.clearCookies();
  await loginAs(page, "bob@example.com");

  // ── Pay the first request ─────────────────────────────────────────────────
  await page.goto(`/requests/${payRequestId}`);
  await page.getByRole("button", { name: "Pay" }).click();

  // Wait for PAID status (2–3s delay)
  await expect(page.getByText("PAID", { exact: true })).toBeVisible({ timeout: 10000 });

  // Success banner is visible alongside the PAID badge
  await expect(page.getByText("Payment successful!")).toBeVisible();
  await expect(page.getByText("PAID", { exact: true })).toBeVisible();

  // ── Decline the second (fresh PENDING) request ───────────────────────────
  await page.goto(`/requests/${declineRequestId}`);
  await expect(page.getByRole("button", { name: "Decline" })).toBeVisible();

  await page.getByRole("button", { name: "Decline" }).click();

  // Spinner is NOT present during Decline — it only renders for Pay actions
  await expect(page.locator('[data-testid="pay-spinner"]')).not.toBeVisible();

  // Decline completes immediately and status transitions to DECLINED
  await expect(page.getByText("DECLINED", { exact: true })).toBeVisible();
});
