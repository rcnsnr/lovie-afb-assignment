import { test, expect } from "@playwright/test";

test("smoke — app responds on /", async ({ page }) => {
  // The root page redirects to /login (unauthenticated).
  // We only check that the server responds with a 2xx or 3xx — not a 5xx.
  const response = await page.goto("/");
  expect(response?.status()).toBeLessThan(500);
});
