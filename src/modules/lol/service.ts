import { logger } from "@/lib/logger";
import { summarize, type LolSummary } from "./domain/stats";
import { queuesFor, type LolMatch, type MatchFilter } from "./domain/types";
import type { LolMatchRepository } from "./repository";
import { toLolMatch } from "./riot/mapper";
import type { RiotClient } from "./riot/riot-client";

export type RiotGateway = Pick<RiotClient, "getPuuid" | "getMatchIds" | "getMatch">;

export type RiotId = { gameName: string; tagLine: string };

/** How many of the latest matches each sync checks. Keeps one sync within the dev key's rate limit. */
export const SYNC_BATCH_SIZE = 20;
/** How many stored matches the overview reads. */
export const OVERVIEW_LIMIT = 50;

export function parseRiotId(value: string): RiotId {
  const separator = value.lastIndexOf("#");
  const gameName = value.slice(0, separator).trim();
  const tagLine = value.slice(separator + 1).trim();
  if (separator < 1 || !gameName || !tagLine) {
    throw new Error(`RIOT_ID inválido: "${value}". Use o formato Nome#TAG.`);
  }
  return { gameName, tagLine };
}

export type LolOverview = {
  matches: LolMatch[];
  summary: LolSummary | null;
};

export type SyncResult = { checked: number; added: number };

export class LolService {
  private readonly riotIdKey: string;

  constructor(
    private readonly deps: {
      riot: RiotGateway | null;
      repository: LolMatchRepository;
      riotId: RiotId;
    },
  ) {
    this.riotIdKey = `${deps.riotId.gameName}#${deps.riotId.tagLine}`.toLowerCase();
  }

  get isSyncEnabled(): boolean {
    return this.deps.riot !== null;
  }

  /** Reads stored matches only; never calls Riot. */
  async getOverview(filter: MatchFilter): Promise<LolOverview> {
    const puuid = await this.deps.repository.findPuuid(this.riotIdKey);
    if (!puuid) return { matches: [], summary: null };
    const matches = await this.deps.repository.listRecent(puuid, queuesFor(filter), OVERVIEW_LIMIT);
    return { matches, summary: summarize(matches) };
  }

  /**
   * Downloads the latest matches that aren't stored yet. Each match is saved as soon as it
   * arrives, so if Riot rate-limits halfway the next sync resumes from where it stopped.
   */
  async syncRecentMatches(): Promise<SyncResult> {
    const riot = this.requireRiot();
    const puuid = await this.resolvePuuid(riot);
    const ids = await riot.getMatchIds(puuid, SYNC_BATCH_SIZE);
    const existing = await this.deps.repository.findExistingIds(puuid, ids);
    const missing = ids.filter((id) => !existing.has(id));

    let added = 0;
    for (const matchId of missing) {
      const match = toLolMatch(await riot.getMatch(matchId), puuid);
      if (!match) {
        logger.warn("lol.sync_player_missing_from_match", { matchId });
        continue;
      }
      await this.deps.repository.save(match);
      added++;
    }

    logger.info("lol.sync_completed", { checked: ids.length, added });
    return { checked: ids.length, added };
  }

  private requireRiot(): RiotGateway {
    if (!this.deps.riot) throw new Error("RIOT_API_KEY não configurada.");
    return this.deps.riot;
  }

  private async resolvePuuid(riot: RiotGateway): Promise<string> {
    const stored = await this.deps.repository.findPuuid(this.riotIdKey);
    if (stored) return stored;
    const puuid = await riot.getPuuid(this.deps.riotId.gameName, this.deps.riotId.tagLine);
    await this.deps.repository.savePuuid(this.riotIdKey, puuid);
    return puuid;
  }
}
