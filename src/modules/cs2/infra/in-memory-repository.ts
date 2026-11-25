import type { Cs2Match, Cs2Source } from "../domain/types";
import type { Cs2MatchRepository } from "../repository";

/** Test double mirroring the Drizzle repository's contract. */
export class InMemoryCs2MatchRepository implements Cs2MatchRepository {
  readonly matches = new Map<string, Cs2Match>();
  readonly accounts = new Map<string, string>();

  async findPlayerId(source: Cs2Source, handle: string) {
    return this.accounts.get(`${source}:${handle}`) ?? null;
  }

  async savePlayerId(source: Cs2Source, handle: string, playerId: string) {
    this.accounts.set(`${source}:${handle}`, playerId);
  }

  async saveMany(matches: readonly Cs2Match[]) {
    let inserted = 0;
    for (const match of matches) {
      const key = `${match.source}:${match.playerId}:${match.matchId}`;
      if (!this.matches.has(key)) {
        this.matches.set(key, match);
        inserted++;
      }
    }
    return inserted;
  }

  async listRecent(source: Cs2Source, playerId: string, limit: number) {
    return [...this.matches.values()]
      .filter((match) => match.source === source && match.playerId === playerId)
      .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
      .slice(0, limit);
  }
}
