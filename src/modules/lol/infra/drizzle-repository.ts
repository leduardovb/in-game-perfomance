import { and, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { lolAccounts, lolMatches } from "@/lib/db/schema";
import type { LolMatch } from "../domain/types";
import type { LolMatchRepository } from "../repository";

export class DrizzleLolMatchRepository implements LolMatchRepository {
  constructor(private readonly db: Db) {}

  async findPuuid(riotId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ puuid: lolAccounts.puuid })
      .from(lolAccounts)
      .where(eq(lolAccounts.riotId, riotId));
    return row?.puuid ?? null;
  }

  async savePuuid(riotId: string, puuid: string): Promise<void> {
    await this.db
      .insert(lolAccounts)
      .values({ riotId, puuid })
      .onConflictDoUpdate({ target: lolAccounts.riotId, set: { puuid } });
  }

  async findExistingIds(puuid: string, matchIds: readonly string[]): Promise<Set<string>> {
    if (matchIds.length === 0) return new Set();
    const rows = await this.db
      .select({ matchId: lolMatches.matchId })
      .from(lolMatches)
      .where(and(eq(lolMatches.puuid, puuid), inArray(lolMatches.matchId, [...matchIds])));
    return new Set(rows.map((row) => row.matchId));
  }

  async save(match: LolMatch): Promise<void> {
    await this.db.insert(lolMatches).values(match).onConflictDoNothing();
  }

  async listRecent(puuid: string, queueIds: readonly number[], limit: number): Promise<LolMatch[]> {
    return this.db
      .select({
        matchId: lolMatches.matchId,
        puuid: lolMatches.puuid,
        playedAt: lolMatches.playedAt,
        queueId: lolMatches.queueId,
        durationSeconds: lolMatches.durationSeconds,
        champion: lolMatches.champion,
        position: lolMatches.position,
        win: lolMatches.win,
        kills: lolMatches.kills,
        deaths: lolMatches.deaths,
        assists: lolMatches.assists,
        creepScore: lolMatches.creepScore,
        damageToChampions: lolMatches.damageToChampions,
        gold: lolMatches.gold,
        visionScore: lolMatches.visionScore,
      })
      .from(lolMatches)
      .where(and(eq(lolMatches.puuid, puuid), inArray(lolMatches.queueId, [...queueIds])))
      .orderBy(desc(lolMatches.playedAt))
      .limit(limit);
  }
}
