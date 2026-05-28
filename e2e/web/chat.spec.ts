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

test.describe("Chat page", () => {
  test.beforeEach(async ({ page }) => {
    await bypassGate(page);
    await page.goto("/#/chat");
    await page.waitForSelector("textarea, input[type=text]", {
      timeout: 10_000,
    });
  });

  test("chat input is visible and focusable", async ({ page }) => {
    const input = page.locator("textarea, input[type=text]").first();
    await expect(input).toBeVisible();
    await input.click();
    await expect(input).toBeFocused();
  });

  test("sends a message and shows it in the conversation", async ({ page }) => {
    const input = page.locator("textarea, input[type=text]").first();
    await input.fill("Hallo ELLA");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Hallo ELLA")).toBeVisible({ timeout: 5000 });
  });

  test.todo("confirmation card appears for an action requiring approval");
  test.todo("confirming the card executes the tool and shows result");
});
