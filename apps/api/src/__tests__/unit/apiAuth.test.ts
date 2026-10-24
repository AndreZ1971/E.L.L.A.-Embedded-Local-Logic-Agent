import { describe, it, expect, vi } from "vitest";
import { apiAuth, API_TOKEN } from "../../middleware/apiAuth.js";

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    headers: { host: "127.0.0.1:3002" },
    method: "GET",
    path: "/api/settings",
    query: {},
    ...overrides,
  } as any;
}

function mockRes() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    sendStatus: vi.fn(),
    setHeader: vi.fn(),
  };
  return res;
}

describe("apiAuth middleware", () => {
  it("exports a token string", () => {
    expect(typeof API_TOKEN).toBe("string");
    expect(API_TOKEN.length).toBeGreaterThan(0);
  });

  it("rejects requests from unknown hosts", () => {
    const req = mockReq({ headers: { host: "evil.com:3002" } });
    const res = mockRes();
    const next = vi.fn();
    apiAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows GET /api/health without token", () => {
    const req = mockReq({ path: "/api/health" });
    const res = mockRes();
    const next = vi.fn();
    apiAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("rejects requests without token", () => {
    const req = mockReq({ headers: { host: "127.0.0.1:3002" } });
    const res = mockRes();
    const next = vi.fn();
    apiAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects requests with wrong token", () => {
    const req = mockReq({
      headers: { host: "127.0.0.1:3002", "x-ella-token": "wrong-token" },
    });
    const res = mockRes();
    const next = vi.fn();
    apiAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("passes with correct token in header", () => {
    const req = mockReq({
      headers: { host: "127.0.0.1:3002", "x-ella-token": API_TOKEN },
    });
    const res = mockRes();
    const next = vi.fn();
    apiAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("accepts token in query param for SSE stream", () => {
    const req = mockReq({
      headers: { host: "127.0.0.1:3002" },
      path: "/api/events/stream",
      query: { token: API_TOKEN },
    });
    const res = mockRes();
    const next = vi.fn();
    apiAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("sets CORS headers for allowed origins", () => {
    const req = mockReq({
      headers: {
        host: "127.0.0.1:3002",
        origin: "http://127.0.0.1:5173",
        "x-ella-token": API_TOKEN,
      },
    });
    const res = mockRes();
    const next = vi.fn();
    apiAuth(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      "http://127.0.0.1:5173",
    );
  });

  it("handles OPTIONS preflight for allowed origin", () => {
    const req = mockReq({
      method: "OPTIONS",
      headers: {
        host: "127.0.0.1:3002",
        origin: "http://127.0.0.1:5173",
      },
    });
    const res = mockRes();
    const next = vi.fn();
    apiAuth(req, res, next);
    expect(res.sendStatus).toHaveBeenCalledWith(204);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects OPTIONS preflight for unknown origin", () => {
    const req = mockReq({
      method: "OPTIONS",
      headers: {
        host: "127.0.0.1:3002",
        origin: "http://evil.com",
      },
    });
    const res = mockRes();
    const next = vi.fn();
    apiAuth(req, res, next);
    expect(res.sendStatus).toHaveBeenCalledWith(403);
  });
});
