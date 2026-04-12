import { test, expect, Page } from "@playwright/test";

// Stable fixture ID from prisma/seed.ts — Bob→Alice, $25.00, PENDING + expiresAt 24h ago
const AC5_FIXTURE_ID = "00000000-0000-0000-0000-000000000001";

async function loginAs(page: Page, email: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "demo1234");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
}

/**
 * AC5 — Expired request shows EXPIRED badge; action buttons are not shown.
 * The seed fixture has status=PENDING with expiresAt 24h in the past.
 * getEffectiveStatus() must compute EXPIRED at read time (not stored in DB).
 */
test("AC5 — Expired request shows EXPIRED; no action buttons", async ({ page }) => {
  // Alice is the recipient of the AC5 fixture (Bob→Alice, $25.00)
  await loginAs(page, "alice@example.com");

  await page.goto(`/requests/${AC5_FIXTURE_ID}`);

  // Detail page renders with EXPIRED effective status
  await expect(page.getByText("$25.00")).toBeVisible();
  await expect(page.getByText("EXPIRED", { exact: true })).toBeVisible();

  // No action buttons visible — terminal state
  await expect(page.getByRole("button", { name: "Pay" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Decline" })).not.toBeVisible();
  await expect(page.getByText("Cancel request")).not.toBeVisible();
});

/**
 * AC5 (server enforcement) — Pay action on expired request returns 409.
 * Status is PENDING in DB, but expiresAt is in the past → updateMany matches 0 rows.
 */
test("AC5 (server) — Pay attempt on expired request returns 409", async ({ page }) => {
  // Alice is the recipient — she would normally be able to pay
  await loginAs(page, "alice@example.com");

  // Make the pay request directly via the browser fetch (session cookie is present)
  const response = await page.evaluate(async (id: string) => {
    const res = await fetch(`/api/requests/${id}/pay`, { method: "POST" });
    return { status: res.status };
  }, AC5_FIXTURE_ID);

  expect(response.status).toBe(409);
});
