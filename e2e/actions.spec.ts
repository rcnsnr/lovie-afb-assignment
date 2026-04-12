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
 * AC3 — Bob declines a request from Alice.
 * Status transitions to DECLINED. No further action buttons shown.
 */
test("AC3 — Bob declines Alice's request", async ({ page, context }) => {
  // ── Alice: create request ──────────────────────────────────────────────────
  await loginAs(page, "alice@example.com");
  const requestId = await createRequest(page, "bob@example.com", "20.00", "Lunch");

  // ── Bob: log in and decline ────────────────────────────────────────────────
  await context.clearCookies();
  await loginAs(page, "bob@example.com");

  await page.goto(`/requests/${requestId}`);
  await expect(page.getByText("$20.00")).toBeVisible();
  await expect(page.getByText("PENDING", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Decline" })).toBeVisible();

  await page.getByRole("button", { name: "Decline" }).click();

  // Status transitions to DECLINED; action buttons disappear
  await expect(page.getByText("DECLINED", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pay" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Decline" })).not.toBeVisible();

  // ── Alice: confirm DECLINED on detail page ────────────────────────────────
  await context.clearCookies();
  await loginAs(page, "alice@example.com");

  await page.goto(`/requests/${requestId}`);
  await expect(page.getByText("DECLINED", { exact: true })).toBeVisible();
  await expect(page.getByText("Cancel request")).not.toBeVisible();
});

/**
 * AC4 — Alice cancels her own request.
 * Status transitions to CANCELLED. No further action buttons shown.
 */
test("AC4 — Alice cancels her own request", async ({ page, context }) => {
  // ── Alice: create request ──────────────────────────────────────────────────
  await loginAs(page, "alice@example.com");
  const requestId = await createRequest(page, "bob@example.com", "8.00", "Coffee");

  // Alice sees PENDING and Cancel button
  await expect(page.getByText("PENDING", { exact: true })).toBeVisible();
  await expect(page.getByText("Cancel request")).toBeVisible();

  await page.getByText("Cancel request").click();

  // Status transitions to CANCELLED; Cancel button disappears
  await expect(page.getByText("CANCELLED", { exact: true })).toBeVisible();
  await expect(page.getByText("Cancel request")).not.toBeVisible();

  // ── Bob: confirm no action buttons on CANCELLED request ───────────────────
  await context.clearCookies();
  await loginAs(page, "bob@example.com");

  await page.goto(`/requests/${requestId}`);
  await expect(page.getByText("CANCELLED", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pay" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Decline" })).not.toBeVisible();
});

/**
 * Wrong-actor guard — Alice cannot decline her own outgoing request.
 * The Decline button must not appear for the requester.
 */
test("Wrong actor — Alice cannot decline her own sent request", async ({ page }) => {
  // ── Alice: create request and stay on detail page ─────────────────────────
  await loginAs(page, "alice@example.com");
  const requestId = await createRequest(page, "bob@example.com", "5.00", "Snack");

  // Alice is the requester — she sees Cancel but not Pay or Decline
  await page.goto(`/requests/${requestId}`);
  await expect(page.getByText("PENDING", { exact: true })).toBeVisible();
  await expect(page.getByText("Cancel request")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pay" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Decline" })).not.toBeVisible();
});
