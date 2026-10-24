import { describe, it, expect } from "vitest";
import { redact } from "../../services/redact.js";

describe("redact()", () => {
  it("schwärzt OpenAI API-Keys", () => {
    expect(redact("Mein Key ist sk-abc123def456ghi789jklmnop")).toBe(
      "Mein Key ist [API-KEY]",
    );
  });

  it("schwärzt GitHub Personal Access Tokens", () => {
    expect(redact("Token: ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ12")).toBe(
      "Token: [TOKEN]",
    );
    expect(redact("github_pat_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ab")).toBe(
      "[TOKEN]",
    );
  });

  it("schwärzt Bearer-Tokens", () => {
    expect(
      redact("Header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc"),
    ).toBe("Header: [TOKEN]");
  });

  it("schwärzt Key/Value Zuweisungen", () => {
    expect(redact("password=geheim123")).toBe("password: [GESCHWÄRZT]");
    expect(redact("Passwort: meinGeheimnis")).toBe("Passwort: [GESCHWÄRZT]");
    expect(redact("token=abc-xyz-123")).toBe("token: [GESCHWÄRZT]");
    expect(redact("secret: s3cr3t!")).toBe("secret: [GESCHWÄRZT]");
    expect(redact("KENNWORT=hunter2")).toBe("KENNWORT: [GESCHWÄRZT]");
  });

  it("schwärzt 'Passwort ist ...' Sätze", () => {
    expect(redact("Mein Passwort ist geheim123")).toBe(
      "Mein [PASSWORT GESCHWÄRZT]",
    );
    expect(redact("Das password lautet abc456")).toBe(
      "Das [PASSWORT GESCHWÄRZT]",
    );
    expect(redact("Mein PIN ist 1234")).toBe("Mein [PASSWORT GESCHWÄRZT]");
  });

  it("schwärzt deutsche IBANs", () => {
    expect(redact("Überweise an DE89370400440532013000")).toBe(
      "Überweise an [IBAN]",
    );
  });

  it("schwärzt internationale IBANs", () => {
    expect(redact("IBAN: AT611904300234573201")).toBe("IBAN: [IBAN]");
    expect(redact("CH93 0076 2011 6238 5295 7")).toBe("[IBAN]");
  });

  it("schwärzt Kreditkartennummern", () => {
    expect(redact("Karte: 4111 1111 1111 1111")).toBe("Karte: [KARTENNUMMER]");
    expect(redact("4111-1111-1111-1111")).toBe("[KARTENNUMMER]");
    expect(redact("4111111111111111")).toBe("[KARTENNUMMER]");
  });

  it("lässt normalen Text unverändert", () => {
    const normal = "Heute um 15:30 Uhr habe ich ein Meeting mit Max.";
    expect(redact(normal)).toBe(normal);
  });

  it("lässt Telefonnummern unverändert", () => {
    const phone = "Ruf mich an: 0171 1234567";
    expect(redact(phone)).toBe(phone);
  });

  it("lässt E-Mail-Adressen unverändert", () => {
    const email = "Schreib an max@example.com";
    expect(redact(email)).toBe(email);
  });

  it("schwärzt mehrere Muster im selben Text", () => {
    const input =
      "IBAN DE89370400440532013000, Passwort ist geheim, Key sk-testkey12345678901234";
    const result = redact(input);
    expect(result).toContain("[IBAN]");
    expect(result).toContain("[PASSWORT GESCHWÄRZT]");
    expect(result).toContain("[API-KEY]");
    expect(result).not.toContain("DE89370400440532013000");
    expect(result).not.toContain("geheim");
    expect(result).not.toContain("sk-testkey");
  });
});
