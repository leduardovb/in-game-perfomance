import "server-only";
import { getDb } from "@/lib/db/client";
import { getEnv } from "@/lib/env";
import { DrizzleLolMatchRepository } from "./infra/drizzle-repository";
import { RiotClient } from "./riot/riot-client";
import { LolService, parseRiotId } from "./service";

/** Composition root. Returns null when RIOT_ID isn't configured. */
export function getLolService(): LolService | null {
  const env = getEnv();
  if (!env.RIOT_ID) return null;

  return new LolService({
    riotId: parseRiotId(env.RIOT_ID),
    repository: new DrizzleLolMatchRepository(getDb()),
    riot: env.RIOT_API_KEY ? new RiotClient({ apiKey: env.RIOT_API_KEY, platform: env.RIOT_PLATFORM }) : null,
  });
}
