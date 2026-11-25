import { describe, expect, it } from "vitest";
import { SESSION_TTL_MS, createSessionToken, isCorrectPassword, isValidSessionToken } from "./session-token";

const SECRET = "a".repeat(40);
const NOW = new Date("2026-11-25T12:00:00Z");

describe("session tokens", () => {
  it("accepts a token it signed before it expires", async () => {
    const token = await createSessionToken(SECRET, NOW);
    expect(await isValidSessionToken(token, SECRET, NOW)).toBe(true);
  });

  it("rejects an expired token", async () => {
    const token = await createSessionToken(SECRET, NOW);
    const later = new Date(NOW.getTime() + SESSION_TTL_MS + 1);
    expect(await isValidSessionToken(token, SECRET, later)).toBe(false);
  });

  it("rejects a token signed with another secret or with a tampered expiry", async () => {
    const token = await createSessionToken(SECRET, NOW);
    expect(await isValidSessionToken(token, "b".repeat(40), NOW)).toBe(false);

    const [, signature] = token.split(".");
    const extended = `${NOW.getTime() + SESSION_TTL_MS * 10}.${signature}`;
    expect(await isValidSessionToken(extended, SECRET, NOW)).toBe(false);
  });

  it("rejects missing and malformed tokens", async () => {
    for (const token of [undefined, "", "abc", "123", "123.sig.extra", "x1.sig"]) {
      expect(await isValidSessionToken(token, SECRET, NOW)).toBe(false);
    }
  });
});

describe("isCorrectPassword", () => {
  it("matches only the exact password", async () => {
    expect(await isCorrectPassword("senha-correta-123", "senha-correta-123", SECRET)).toBe(true);
    expect(await isCorrectPassword("senha-correta-12", "senha-correta-123", SECRET)).toBe(false);
  });
});
