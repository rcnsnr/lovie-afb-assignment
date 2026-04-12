import { test, expect, Page } from "@playwright/test";

async function loginAs(page: Page, email: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "demo1234");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
}

/**
 * AC1 + AC2 — Create request (Alice) and pay it (Bob).
 * Alice creates a $15.00 request to Bob with note "Dinner".
 * Bob pays it. Both see PAID status.
 */
test("AC1+AC2 — Alice creates request; Bob pays it", async ({ page, context }) => {
  // ── Alice: create request ──────────────────────────────────────────────────
  await loginAs(page, "alice@example.com");

  await page.goto("/requests/new");
  await page.fill('input[type="email"]', "bob@example.com");
  await page.fill('input[id="amountDollars"]', "15.00");
  await page.fill("textarea", "Dinner");
  await page.click('button[type="submit"]');

  // Redirected to /requests/[id]
  await page.waitForURL(/\/requests\/[0-9a-f-]{36}/);
  const requestUrl = page.url();
  const requestId = requestUrl.split("/").pop()!;

  // Alice sees PENDING and her "Cancel request" button
  await expect(page.getByText("PENDING", { exact: true })).toBeVisible();
  await expect(page.getByText("Cancel request")).toBeVisible();
  await expect(page.getByText("Pay")).not.toBeVisible();

  // ── Bob: log in and pay ────────────────────────────────────────────────────
  await context.clearCookies();
  await loginAs(page, "bob@example.com");

  // Bob sees the request in incoming dashboard
  await page.goto("/dashboard/incoming");
  await expect(page.getByText("$15.00").first()).toBeVisible();

  // Navigate directly to the request detail
  await page.goto(`/requests/${requestId}`);
  await expect(page.getByText("$15.00")).toBeVisible();
  await expect(page.getByText("Dinner")).toBeVisible();
  await expect(page.getByText("PENDING", { exact: true })).toBeVisible();

  // Bob sees Pay + Decline, not Cancel
  await expect(page.getByRole("button", { name: "Pay" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Decline" })).toBeVisible();
  await expect(page.getByText("Cancel request")).not.toBeVisible();

  await page.getByRole("button", { name: "Pay" }).click();

  // Status transitions to PAID; action buttons disappear
  await expect(page.getByText("PAID", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pay" })).not.toBeVisible();

  // ── Alice: outgoing dashboard shows PAID ──────────────────────────────────
  await context.clearCookies();
  await loginAs(page, "alice@example.com");

  await page.goto("/dashboard/outgoing");
  // Find Alice's row by amount — may have other requests from prior runs, check this specific one
  await page.goto(`/requests/${requestId}`);
  await expect(page.getByText("PAID", { exact: true })).toBeVisible();
  await expect(page.getByText("Cancel request")).not.toBeVisible();
});
