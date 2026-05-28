import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import TitleBar from "../components/TitleBar";

describe("TitleBar", () => {
  it("renders nothing when window.electronAPI is absent", () => {
    // jsdom environment has no electronAPI
    const { container } = render(<TitleBar />);
    expect(container.firstChild).toBeNull();
  });

  it("renders title bar with E.L.L.A. title when electronAPI is present", () => {
    const mockApi = {
      isMaximized: () => Promise.resolve(false),
      onMaximizeChange: () => () => {},
      minimize: () => {},
      maximize: () => {},
      close: () => {},
    };
    (window as any).electronAPI = mockApi;

    render(<TitleBar />);
    expect(screen.getByText("E.L.L.A.")).toBeDefined();

    delete (window as any).electronAPI;
  });

  it("renders minimize / maximize / close buttons when electronAPI is present", () => {
    (window as any).electronAPI = {
      isMaximized: () => Promise.resolve(false),
      onMaximizeChange: () => () => {},
      minimize: () => {},
      maximize: () => {},
      close: () => {},
    };

    render(<TitleBar />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(3);

    delete (window as any).electronAPI;
  });
});
