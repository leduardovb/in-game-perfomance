import "server-only";
import { getDb } from "@/lib/db/client";
import { getEnv } from "@/lib/env";
import { FaceitClient } from "./faceit/faceit-client";
import { DrizzleCs2MatchRepository } from "./infra/drizzle-repository";
import { Cs2Service } from "./service";

/** Composition root. Returns null when FACEIT_NICKNAME isn't configured. */
export function getCs2Service(): Cs2Service | null {
  const env = getEnv();
  if (!env.FACEIT_NICKNAME) return null;

  return new Cs2Service({
    faceitNickname: env.FACEIT_NICKNAME,
    repository: new DrizzleCs2MatchRepository(getDb()),
    faceit: env.FACEIT_API_KEY ? new FaceitClient({ apiKey: env.FACEIT_API_KEY }) : null,
  });
}
