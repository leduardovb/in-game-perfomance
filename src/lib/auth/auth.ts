import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getEnv } from "@/lib/env";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  createSessionToken,
  isValidSessionToken,
} from "./session-token";

/**
 * Data-access-layer guard. The proxy already redirects anonymous visitors, but every
 * server action and data read calls this too, so protection doesn't depend on the proxy matcher.
 */
export async function requireAuth(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!(await isValidSessionToken(token, getEnv().SESSION_SECRET))) {
    redirect("/login");
  }
}

export async function startSession(): Promise<void> {
  const token = await createSessionToken(getEnv().SESSION_SECRET);
  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}
