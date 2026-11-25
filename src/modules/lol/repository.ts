import type { LolMatch } from "./domain/types";

export interface LolMatchRepository {
  findPuuid(riotId: string): Promise<string | null>;
  savePuuid(riotId: string, puuid: string): Promise<void>;
  /** Which of these match ids are already stored for the player. */
  findExistingIds(puuid: string, matchIds: readonly string[]): Promise<Set<string>>;
  /** Inserts, ignoring matches that are already stored. */
  save(match: LolMatch): Promise<void>;
  /** Most recent first. */
  listRecent(puuid: string, queueIds: readonly number[], limit: number): Promise<LolMatch[]>;
}
