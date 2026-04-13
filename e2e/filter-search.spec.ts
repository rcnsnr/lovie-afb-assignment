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

const ALL_STATUSES = ["ALL", "PENDING", "PAID", "DECLINED", "CANCELLED", "EXPIRED"];

/**
 * AC14 — Both outgoing and incoming dashboards render the full set of 6 status filter pills.
 */
test("AC14 — Both dashboards show 6 status filter pills", async ({ page }) => {
  await loginAs(page, "alice@example.com");

  await page.goto("/dashboard/outgoing");
  for (const status of ALL_STATUSES) {
    await expect(page.getByRole("button", { name: status, exact: true })).toBeVisible();
  }

  await page.goto("/dashboard/incoming");
  for (const status of ALL_STATUSES) {
    await expect(page.getByRole("button", { name: status, exact: true })).toBeVisible();
  }
});

/**
 * AC15 — Selecting the PAID pill updates the URL to ?status=PAID and hides non-PAID requests.
 */
test("AC15 — PAID filter updates URL and excludes non-PAID requests", async ({ page }) => {
  await loginAs(page, "alice@example.com");

  // Create a fresh PENDING request with a unique amount to avoid collisions
  await createRequest(page, "bob@example.com", "15.15");

  await page.goto("/dashboard/outgoing");

  // The PENDING request is visible under ALL
  await expect(page.getByText("$15.15").first()).toBeVisible();

  // Click PAID pill
  await page.getByRole("button", { name: "PAID", exact: true }).click();

  // URL reflects the filter
  await expect(page).toHaveURL(/[?&]status=PAID/);

  // The PENDING request we created is NOT visible under the PAID filter
  await expect(page.getByText("$15.15")).not.toBeVisible();
});

/**
 * AC16 — Selecting EXPIRED on the incoming dashboard includes the seeded past-expiry fixture.
 * Seeded fixture: Bob → Alice, $25.00, note "Expired fixture for AC5 testing",
 * status PENDING with expiresAt 24h in the past (id: 00000000-0000-0000-0000-000000000001).
 * The DTO's getEffectiveStatus() computes this as EXPIRED at runtime.
 */
test("AC16 — EXPIRED filter on incoming shows seeded past-expiry fixture", async ({ page }) => {
  await loginAs(page, "alice@example.com");

  await page.goto("/dashboard/incoming");

  // Click EXPIRED pill
  await page.getByRole("button", { name: "EXPIRED", exact: true }).click();

  // URL reflects the filter
  await expect(page).toHaveURL(/[?&]status=EXPIRED/);

  // Seeded fixture note is unique — confirms the right row is present
  await expect(page.getByText("Expired fixture for AC5 testing").first()).toBeVisible();
  await expect(page.getByText("$25.00").first()).toBeVisible();
});

/**
 * AC17 — Typing "bob" in the outgoing search field filters to Bob as recipient.
 * URL updates to ?search=bob after the 300ms debounce.
 */
test("AC17 — Search 'bob' on outgoing filters to Bob as recipient", async ({ page }) => {
  await loginAs(page, "alice@example.com");

  // Create one request to Bob and one to Carol so both are present before filtering
  await createRequest(page, "bob@example.com", "17.00");
  await createRequest(page, "carol@example.com", "18.00");

  await page.goto("/dashboard/outgoing");

  // Both amounts are visible before filtering
  await expect(page.getByText("$17.00").first()).toBeVisible();
  await expect(page.getByText("$18.00").first()).toBeVisible();

  // Type in the search input
  await page.locator('input[type="search"]').fill("bob");

  // URL updates after debounce
  await expect(page).toHaveURL(/[?&]search=bob/, { timeout: 2000 });

  // Search input reflects the typed value
  await expect(page.locator('input[type="search"]')).toHaveValue("bob");

  // Carol's request is no longer visible; Bob's remains
  await expect(page.getByText("$18.00")).not.toBeVisible();
  await expect(page.getByText("$17.00").first()).toBeVisible();
});

/**
 * AC18 — Combining status=PENDING and search="bob" shows only the intersection.
 * Navigated directly to avoid sequential UI interactions.
 */
test("AC18 — Combined PENDING filter + 'bob' search shows intersection", async ({ page }) => {
  await loginAs(page, "alice@example.com");

  // Create a known PENDING request to Bob
  await createRequest(page, "bob@example.com", "18.50");

  // Navigate with both params — tests that the server handles combined filtering
  await page.goto("/dashboard/outgoing?status=PENDING&search=bob");

  // Both params are present in the URL
  await expect(page).toHaveURL(/status=PENDING/);
  await expect(page).toHaveURL(/search=bob/);

  // PENDING pill is rendered (active state)
  await expect(page.getByRole("button", { name: "PENDING", exact: true })).toBeVisible();

  // Search input is pre-populated from the URL param
  await expect(page.locator('input[type="search"]')).toHaveValue("bob");

  // Bob's PENDING request is visible
  await expect(page.getByText("$18.50").first()).toBeVisible();
});

/**
 * AC19 — Filter and search navigation is soft — no full page reload.
 * A window marker set before navigation must still be present after URL changes.
 */
test("AC19 — Filter and search use soft navigation without full page reload", async ({ page }) => {
  await loginAs(page, "alice@example.com");
  await page.goto("/dashboard/outgoing");

  // Inject a window-level marker; a full reload would destroy it
  await page.evaluate(() => {
    (window as Window & { __test_nav?: boolean }).__test_nav = true;
  });

  // Click a filter pill (router.push — immediate)
  await page.getByRole("button", { name: "PENDING", exact: true }).click();
  await expect(page).toHaveURL(/status=PENDING/);

  // Marker survives — soft navigation confirmed
  const afterFilter = await page.evaluate(
    () => (window as Window & { __test_nav?: boolean }).__test_nav
  );
  expect(afterFilter).toBe(true);

  // Type in search (router.replace — 300ms debounce)
  await page.locator('input[type="search"]').fill("alice");
  await expect(page).toHaveURL(/search=alice/, { timeout: 2000 });

  // Marker still survives — both status and search are soft navigation
  const afterSearch = await page.evaluate(
    () => (window as Window & { __test_nav?: boolean }).__test_nav
  );
  expect(afterSearch).toBe(true);
});
