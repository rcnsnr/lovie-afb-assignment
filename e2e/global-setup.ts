import { chromium, FullConfig } from "@playwright/test";

/**
 * Vercel Preview deployments require SSO authentication. This global setup
 * visits the Vercel-provided shareable URL (with _vercel_share token) once
 * to obtain the auth cookie, then saves it to storageState.json so all test
 * workers inherit the authenticated state. Only runs when BYPASS_URL is set.
 */
async function globalSetup(_config: FullConfig) {
  const bypassUrl = process.env.BYPASS_URL;
  if (!bypassUrl) return;

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(bypassUrl, { waitUntil: "networkidle" });
  await context.storageState({ path: "e2e/.auth/vercel-bypass.json" });
  await browser.close();
}

export default globalSetup;
