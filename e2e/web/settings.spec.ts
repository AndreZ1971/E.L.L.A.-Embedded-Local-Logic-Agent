import { test, expect, type Page } from "@playwright/test";

async function bypassGate(page: Page) {
  await page.route("**/api/settings", async (route) => {
    if (route.request().method() === "GET") {
      const resp = await route.fetch();
      const json = await resp.json();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...json,
          eulaAccepted: true,
          onboardingComplete: true,
        }),
      });
    } else {
      await route.continue();
    }
  });
}

test.describe("Settings page", () => {
  test.beforeEach(async ({ page }) => {
    await bypassGate(page);
    await page.goto("/#/settings");
    await page.waitForLoadState("networkidle");
  });

  test("settings page loads with LLM tab visible", async ({ page }) => {
    // The LLM tab is the default tab
    await expect(page.getByText(/Modell|Provider|LLM/i)).toBeVisible({
      timeout: 8000,
    });
  });

  test("Tools tab shows list of toggleable tools", async ({ page }) => {
    const toolsTab = page
      .locator("button, [role=tab]")
      .filter({ hasText: /Tools/i })
      .first();
    await toolsTab.click();
    await expect(
      page.getByText(/Festplattennutzung|Disk|clean_temp/i),
    ).toBeVisible({ timeout: 5000 });
  });

  test("Regeln tab shows rules table", async ({ page }) => {
    const regelnTab = page
      .locator("button, [role=tab]")
      .filter({ hasText: /Regeln/i })
      .first();
    await regelnTab.click();
    // Either a table with rules or an empty state message
    await expect(page.getByText(/Regel|Keine|allow|deny/i)).toBeVisible({
      timeout: 5000,
    });
  });
});
