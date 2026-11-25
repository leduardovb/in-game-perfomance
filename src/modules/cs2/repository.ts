import type { Cs2Match, Cs2Source } from "./domain/types";

export interface Cs2MatchRepository {
  findPlayerId(source: Cs2Source, handle: string): Promise<string | null>;
  savePlayerId(source: Cs2Source, handle: string, playerId: string): Promise<void>;
  /** Inserts new matches, ignoring ones already stored. Returns how many were inserted. */
  saveMany(matches: readonly Cs2Match[]): Promise<number>;
  /** Most recent first. */
  listRecent(source: Cs2Source, playerId: string, limit: number): Promise<Cs2Match[]>;
}
