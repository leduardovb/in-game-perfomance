"use server";

import { redirect } from "next/navigation";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { endSession, startSession } from "./auth";
import { isCorrectPassword } from "./session-token";

export type LoginState = { error: string | null };

const FAILED_LOGIN_DELAY_MS = 1000;

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get("password");
  if (typeof password !== "string" || password.length === 0 || password.length > 256) {
    return { error: "Informe a senha." };
  }

  const env = getEnv();
  if (!(await isCorrectPassword(password, env.APP_PASSWORD, env.SESSION_SECRET))) {
    logger.warn("auth.login_failed");
    // Slows down brute-force attempts.
    await new Promise((resolve) => setTimeout(resolve, FAILED_LOGIN_DELAY_MS));
    return { error: "Senha incorreta." };
  }

  await startSession();
  logger.info("auth.login_succeeded");
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/login");
}
