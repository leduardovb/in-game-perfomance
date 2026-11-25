import { logger } from "@/lib/logger";
import { summarize, type Cs2Summary } from "./domain/stats";
import type { Cs2Match } from "./domain/types";
import type { FaceitClient } from "./faceit/faceit-client";
import { toCs2Match } from "./faceit/mapper";
import type { Cs2MatchRepository } from "./repository";

export type FaceitGateway = Pick<FaceitClient, "getPlayerId" | "getRecentMatchStats">;

/** FACEIT returns all stats for this many matches in a single request. */
export const SYNC_BATCH_SIZE = 50;
export const OVERVIEW_LIMIT = 50;

export type Cs2Overview = { matches: Cs2Match[]; summary: Cs2Summary | null };
export type SyncResult = { checked: number; added: number };

export class Cs2Service {
  private readonly handle: string;

  constructor(
    private readonly deps: {
      faceit: FaceitGateway | null;
      repository: Cs2MatchRepository;
      faceitNickname: string;
    },
  ) {
    // FACEIT nicknames are case-sensitive, so the handle is stored as typed.
    this.handle = deps.faceitNickname.trim();
  }

  get isSyncEnabled(): boolean {
    return this.deps.faceit !== null;
  }

  /** Reads stored matches only; never calls FACEIT. */
  async getOverview(): Promise<Cs2Overview> {
    const playerId = await this.deps.repository.findPlayerId("faceit", this.handle);
    if (!playerId) return { matches: [], summary: null };
    const matches = await this.deps.repository.listRecent("faceit", playerId, OVERVIEW_LIMIT);
    return { matches, summary: summarize(matches) };
  }

  async syncFaceitMatches(): Promise<SyncResult> {
    if (!this.deps.faceit) throw new Error("FACEIT_API_KEY não configurada.");
    const faceit = this.deps.faceit;

    const playerId = await this.resolvePlayerId(faceit);
    const records = await faceit.getRecentMatchStats(playerId, SYNC_BATCH_SIZE);

    const matches: Cs2Match[] = [];
    for (const record of records) {
      const result = toCs2Match(record, playerId);
      if (result.ok) matches.push(result.match);
      else logger.warn("cs2.faceit_match_skipped", { reason: `campos inválidos: ${result.reason}` });
    }

    const added = await this.deps.repository.saveMany(matches);
    logger.info("cs2.faceit_sync_completed", { checked: records.length, added, skipped: records.length - matches.length });
    return { checked: records.length, added };
  }

  private async resolvePlayerId(faceit: FaceitGateway): Promise<string> {
    const stored = await this.deps.repository.findPlayerId("faceit", this.handle);
    if (stored) return stored;
    const playerId = await faceit.getPlayerId(this.handle);
    await this.deps.repository.savePlayerId("faceit", this.handle, playerId);
    return playerId;
  }
}
