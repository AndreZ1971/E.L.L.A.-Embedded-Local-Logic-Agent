import { test, expect } from "@playwright/test";

// Desktop tests require the Electron app to be running separately.
// They target the web frontend served by the API/Vite dev server.

test.describe("Desktop app (web frontend)", () => {
  test("root URL redirects to a known route", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Should be on eula, onboarding, or chat depending on DB state
    const url = page.url();
    expect(url).toMatch(/#\//);
  });

  test("EULA page renders accept button when EULA not yet accepted", async ({
    page,
  }) => {
    // Intercept settings to simulate fresh install
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            eulaAccepted: false,
            onboardingComplete: false,
            enabledTools: [],
          }),
        });
      } else {
        await route.continue();
      }
    });
    await page.goto("/#/chat");
    await page.waitForLoadState("networkidle");
    // App should redirect to /eula
    await expect(
      page.getByText(/Akzeptieren|Accept|EULA|Nutzungsbedingungen/i),
    ).toBeVisible({ timeout: 8000 });
  });

  test("chat route is accessible after gate bypass", async ({ page }) => {
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
    await page.goto("/#/chat");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator("textarea, input[type=text]").first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("settings route is accessible after gate bypass", async ({ page }) => {
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
    await page.goto("/#/settings");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/LLM|Modell|Tools|Regeln/i)).toBeVisible({
      timeout: 8000,
    });
  });

  test("API health endpoint responds 200", async ({ request }) => {
    const resp = await request.get("/api/settings");
    expect(resp.status()).toBe(200);
  });
});
