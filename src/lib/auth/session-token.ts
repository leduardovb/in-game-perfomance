/**
 * Stateless session tokens for the app's single user.
 *
 * Format: `<expiresAtMs>.<base64url(HMAC-SHA256(expiresAtMs))>`.
 * Uses Web Crypto only, so it runs both in the Node runtime and in the proxy.
 */

export const SESSION_COOKIE_NAME = "igp_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, value: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", key, encoder.encode(value));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function createSessionToken(secret: string, now: Date = new Date()): Promise<string> {
  const expiresAt = String(now.getTime() + SESSION_TTL_MS);
  const signature = toBase64Url(await hmac(secret, expiresAt));
  return `${expiresAt}.${signature}`;
}

export async function isValidSessionToken(
  token: string | undefined,
  secret: string,
  now: Date = new Date(),
): Promise<boolean> {
  if (!token) return false;
  const [expiresAt, signature, ...rest] = token.split(".");
  if (!expiresAt || !signature || rest.length > 0 || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= now.getTime()) return false;

  const expected = toBase64Url(await hmac(secret, expiresAt));
  return constantTimeEqual(encoder.encode(signature), encoder.encode(expected));
}

/**
 * Compares a submitted password with the configured one without leaking, through timing,
 * how many leading characters match: both sides are hashed to fixed-length digests first.
 */
export async function isCorrectPassword(
  submitted: string,
  expected: string,
  secret: string,
): Promise<boolean> {
  const [a, b] = await Promise.all([hmac(secret, submitted), hmac(secret, expected)]);
  return constantTimeEqual(new Uint8Array(a), new Uint8Array(b));
}
