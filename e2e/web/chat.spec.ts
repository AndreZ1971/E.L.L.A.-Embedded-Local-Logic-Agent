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

  test("confirmation card appears for an action requiring approval", async ({
    page,
  }) => {
    await page.route("**/api/chat/stream", async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
        body: 'data: {"type":"confirm","tool":"clean_temp","description":"Alle temporären Dateien löschen"}\n\n',
      });
    });

    const input = page.locator("textarea, input[type=text]").first();
    await input.fill("Bereinige temp Dateien");
    await page.keyboard.press("Enter");

    await expect(page.getByText("Aktion bestätigen")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("clean_temp")).toBeVisible();
  });

  test("confirming the card executes the tool and shows result", async ({
    page,
  }) => {
    await page.route("**/api/chat/stream", async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
        body: 'data: {"type":"confirm","tool":"clean_temp","description":"Alle temporären Dateien löschen"}\n\n',
      });
    });

    await page.route("**/api/chat/confirm", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ reply: "Temporäre Dateien wurden gelöscht." }),
      });
    });

    const input = page.locator("textarea, input[type=text]").first();
    await input.fill("Bereinige temp Dateien");
    await page.keyboard.press("Enter");

    await expect(page.getByText("Aktion bestätigen")).toBeVisible({
      timeout: 5000,
    });

    await page.locator('[data-testid="confirm-yes"]').click();

    await expect(
      page.getByText("Temporäre Dateien wurden gelöscht."),
    ).toBeVisible({ timeout: 5000 });
  });
});
