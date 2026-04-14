import { test, expect, Page } from "@playwright/test";

const BOB_PHONE = "+15550002222";

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
 * AC26 + AC27 + AC28 — Single counterparty match on the outgoing dashboard
 * renders the inline contact summary card with identity fields (name,
 * email, phone) and all five relationship metric labels (Sent, Received,
 * Pending, Paid, Declined). The card is scoped via data-testid so the
 * assertions ignore matching text in the request list below.
 */
test("AC26-AC28 — Single match shows card with identity + metrics (outgoing)", async ({ page }) => {
  await loginAs(page, "alice@example.com");
  // Ensure Alice has at least one Alice→Bob request so Bob appears in allDtos
  await createRequest(page, "bob@example.com", "26.00");

  await page.goto("/dashboard/outgoing?search=bob");

  const card = page.locator('[data-testid="contact-summary-card"]');
  await expect(card).toBeVisible();

  // AC27 — identity fields
  await expect(card.getByText("Bob", { exact: true })).toBeVisible();
  await expect(card.getByText("bob@example.com")).toBeVisible();
  await expect(card.getByText(BOB_PHONE)).toBeVisible();

  // AC28 — all five metric labels present
  await expect(card.getByText("Sent", { exact: true })).toBeVisible();
  await expect(card.getByText("Received", { exact: true })).toBeVisible();
  await expect(card.getByText("Pending", { exact: true })).toBeVisible();
  await expect(card.getByText("Paid", { exact: true })).toBeVisible();
  await expect(card.getByText("Declined", { exact: true })).toBeVisible();
});

/**
 * AC29-a — Zero-match search ("zzznomatch") hides the card. The surface
 * wrapper remains present.
 */
test("AC29 — Zero match hides the card", async ({ page }) => {
  await loginAs(page, "alice@example.com");
  await page.goto("/dashboard/outgoing?search=zzznomatch");

  await expect(page.locator('[data-testid="contact-summary-card"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="controls-surface"]')).toBeVisible();
});

/**
 * AC29-b — Multi-match search ("example.com" matches all three seeded
 * users: alice@example.com, bob@example.com, carol@example.com). When
 * Alice has requests with both Bob and Carol, searching "example.com"
 * resolves to 2+ distinct counterparties, so the card is hidden.
 */
test("AC29 — Multi match hides the card", async ({ page }) => {
  await loginAs(page, "alice@example.com");
  // Ensure Alice has requests with BOTH Bob and Carol (two distinct counterparties)
  await createRequest(page, "bob@example.com", "29.10");
  await createRequest(page, "carol@example.com", "29.20");

  await page.goto("/dashboard/outgoing?search=example.com");

  await expect(page.locator('[data-testid="contact-summary-card"]')).toHaveCount(0);
});

/**
 * AC29-c — Empty search (no ?search= param) hides the card on the
 * outgoing dashboard.
 */
test("AC29 — Empty search hides the card", async ({ page }) => {
  await loginAs(page, "alice@example.com");
  await page.goto("/dashboard/outgoing");

  await expect(page.locator('[data-testid="contact-summary-card"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="controls-surface"]')).toBeVisible();
});

/**
 * AC30 — Changing the status filter while the card is visible does NOT
 * remove the card. Detection is driven by allDtos (pre-status-filter),
 * so the contact's identity and metrics are invariant to status toggles.
 */
test("AC30 — Status filter change does not remove the card", async ({ page }) => {
  await loginAs(page, "alice@example.com");
  await createRequest(page, "bob@example.com", "30.00");

  await page.goto("/dashboard/outgoing?search=bob");
  const card = page.locator('[data-testid="contact-summary-card"]');
  await expect(card).toBeVisible();

  // Click PENDING pill — URL adds status=PENDING, card remains visible
  await page.getByRole("link", { name: "PENDING", exact: true }).click();
  await expect(page).toHaveURL(/status=PENDING/);
  await expect(card).toBeVisible();
});

/**
 * AC31 — At a 375px viewport, the card stacks identity and metrics
 * vertically and no horizontal scrollbar is introduced on the page.
 */
test("AC31 — Mobile 375px viewport — card visible, no horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await loginAs(page, "alice@example.com");
  await createRequest(page, "bob@example.com", "31.00");

  await page.goto("/dashboard/outgoing?search=bob");
  await expect(page.locator('[data-testid="contact-summary-card"]')).toBeVisible();

  // No horizontal overflow at 375px (±1px rounding tolerance)
  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(documentWidth).toBeLessThanOrEqual(376);
});

/**
 * AC32 — The controls surface wrapper (containing filter pills, search
 * input, and optionally the contact card) is rendered with the soft
 * brand-adjacent palette on both dashboards. This test verifies the
 * wrapper is present and reachable via its test id.
 */
test("AC32 — Controls surface wrapper is rendered", async ({ page }) => {
  await loginAs(page, "alice@example.com");
  await page.goto("/dashboard/outgoing");

  await expect(page.locator('[data-testid="controls-surface"]')).toBeVisible();
});
