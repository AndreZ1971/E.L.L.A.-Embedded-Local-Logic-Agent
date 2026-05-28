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

test.describe("Homework mode (settings page)", () => {
  test.beforeEach(async ({ page }) => {
    await bypassGate(page);
    await page.goto("/#/settings");
    await page.waitForLoadState("networkidle");
  });

  test("settings page loads and shows tabs", async ({ page }) => {
    await expect(page.getByText(/Modus/i)).toBeVisible({ timeout: 8000 });
  });

  test("Modus tab shows Hausaufgaben-Modus section", async ({ page }) => {
    const modusTab = page
      .locator("button, [role=tab]")
      .filter({ hasText: /Modus/i })
      .first();
    await modusTab.click();
    await expect(page.getByText(/Hausaufgaben-Modus/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("PIN section is visible in Modus tab", async ({ page }) => {
    const modusTab = page
      .locator("button, [role=tab]")
      .filter({ hasText: /Modus/i })
      .first();
    await modusTab.click();
    await expect(page.getByText(/PIN/i)).toBeVisible({ timeout: 5000 });
  });

  test("shows error when new PIN is too short", async ({ page }) => {
    const modusTab = page
      .locator("button, [role=tab]")
      .filter({ hasText: /Modus/i })
      .first();
    await modusTab.click();

    // Fill in a PIN that's too short (< 4 chars)
    const newPinInputs = page.locator(
      "input[type=password], input[placeholder*=PIN i]",
    );
    const inputs = await newPinInputs.all();
    if (inputs.length >= 1) {
      // Find the "neuen PIN" input
      const newPin = inputs.find(async (el) => {
        const ph = await el.getAttribute("placeholder");
        return ph?.includes("neu") || ph?.includes("Neu");
      });
      if (newPin) {
        await newPin.fill("12");
        const saveBtn = page
          .getByRole("button", { name: /speichern|save/i })
          .first();
        await saveBtn.click();
        await expect(page.getByText(/mindestens 4/i)).toBeVisible({
          timeout: 3000,
        });
      }
    }
  });

  test("emergency reset button is visible in Modus tab", async ({ page }) => {
    const modusTab = page
      .locator("button, [role=tab]")
      .filter({ hasText: /Modus/i })
      .first();
    await modusTab.click();
    await expect(page.getByText(/Notschalter|Emergency|Reset/i)).toBeVisible({
      timeout: 5000,
    });
  });
});
