import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import React from "react";
import App from "../App";

// TitleBar returns null in jsdom (no electronAPI) — no special mock needed.

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  // Reset the URL hash so HashRouter state doesn't bleed between tests.
  window.location.hash = "";
});

function mockSettings(
  eulaAccepted: boolean,
  onboardingComplete: boolean,
): void {
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({ eulaAccepted, onboardingComplete }),
  } as Response);
}

describe("App boot gate", () => {
  it("shows EULA page (Nutzungshinweise) when eulaAccepted is false", async () => {
    mockSettings(false, false);
    render(<App />);
    await waitFor(
      () => {
        const text = document.body.textContent ?? "";
        // The EULA page renders a heading "Nutzungshinweise" and a confirm button
        expect(text).toMatch(/Nutzungshinweise|Bestätigen|Ich habe/i);
      },
      { timeout: 3000 },
    );
  });

  it("does not show EULA content when eulaAccepted is true", async () => {
    mockSettings(true, true);
    const { container } = render(<App />);
    await waitFor(
      () => {
        const text = container.textContent ?? "";
        // "Dashboard" only appears in the main-shell sidebar nav, not on EULA page
        expect(text).toMatch(/Dashboard/i);
      },
      { timeout: 3000 },
    );
    expect(container.textContent).not.toMatch(/Nutzungshinweise/i);
  });

  it("renders nothing until settings fetch resolves", () => {
    // Fetch never resolves — AppShell returns null (boot state is null)
    vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));
    const { container } = render(<App />);
    // The router wrapper exists but has no visible content
    expect(container.textContent?.trim()).toBe("");
  });
});
