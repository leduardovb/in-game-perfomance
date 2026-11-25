import type { LolMatch } from "../domain/types";
import type { LolMatchRepository } from "../repository";

/** Test double mirroring the Drizzle repository's contract. */
export class InMemoryLolMatchRepository implements LolMatchRepository {
  readonly matches = new Map<string, LolMatch>();
  readonly accounts = new Map<string, string>();

  async findPuuid(riotId: string) {
    return this.accounts.get(riotId) ?? null;
  }

  async savePuuid(riotId: string, puuid: string) {
    this.accounts.set(riotId, puuid);
  }

  private key(puuid: string, matchId: string) {
    return `${puuid}:${matchId}`;
  }

  async findExistingIds(puuid: string, matchIds: readonly string[]) {
    return new Set(matchIds.filter((id) => this.matches.has(this.key(puuid, id))));
  }

  async save(match: LolMatch) {
    const key = this.key(match.puuid, match.matchId);
    if (!this.matches.has(key)) this.matches.set(key, match);
  }

  async listRecent(puuid: string, queueIds: readonly number[], limit: number) {
    return [...this.matches.values()]
      .filter((match) => match.puuid === puuid && queueIds.includes(match.queueId))
      .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
      .slice(0, limit);
  }
}
