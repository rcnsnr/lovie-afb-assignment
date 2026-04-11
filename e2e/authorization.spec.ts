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
 * AC6 — Observer (Carol) visits a request she has no role in.
 * Carol should see the detail fields but no action buttons.
 */
test("AC6 — Carol (observer) sees request details but no action buttons", async ({
  page,
  context,
}) => {
  // ── Alice: create a request to Bob ────────────────────────────────────────
  await loginAs(page, "alice@example.com");
  const requestId = await createRequest(page, "bob@example.com", "12.00", "Shared meal");

  // ── Carol: visit the request as an observer ───────────────────────────────
  await context.clearCookies();
  await loginAs(page, "carol@example.com");

  await page.goto(`/requests/${requestId}`);

  // Carol sees the request details
  await expect(page.getByText("$12.00")).toBeVisible();
  await expect(page.getByText("Shared meal")).toBeVisible();
  await expect(page.getByText("PENDING")).toBeVisible();

  // No action buttons — Carol has no role in this request
  await expect(page.getByRole("button", { name: "Pay" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Decline" })).not.toBeVisible();
  await expect(page.getByText("Cancel request")).not.toBeVisible();
});

/**
 * AC7 — Alice tries to pay her own outgoing request via API.
 * The pay endpoint must return 403 for the requester.
 */
test("AC7 — Alice cannot pay her own sent request (403)", async ({ page }) => {
  // ── Alice: create a request to Bob ────────────────────────────────────────
  await loginAs(page, "alice@example.com");
  const requestId = await createRequest(page, "bob@example.com", "7.00", "Drinks");

  // Alice tries to pay her own request via API (session cookie is present)
  const response = await page.evaluate(async (id: string) => {
    const res = await fetch(`/api/requests/${id}/pay`, { method: "POST" });
    return { status: res.status };
  }, requestId);

  expect(response.status).toBe(403);
});
