import { and, desc, eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { cs2Accounts, cs2Matches } from "@/lib/db/schema";
import type { Cs2Match, Cs2Source } from "../domain/types";
import type { Cs2MatchRepository } from "../repository";

export class DrizzleCs2MatchRepository implements Cs2MatchRepository {
  constructor(private readonly db: Db) {}

  async findPlayerId(source: Cs2Source, handle: string): Promise<string | null> {
    const [row] = await this.db
      .select({ playerId: cs2Accounts.playerId })
      .from(cs2Accounts)
      .where(and(eq(cs2Accounts.source, source), eq(cs2Accounts.handle, handle)));
    return row?.playerId ?? null;
  }

  async savePlayerId(source: Cs2Source, handle: string, playerId: string): Promise<void> {
    await this.db
      .insert(cs2Accounts)
      .values({ source, handle, playerId })
      .onConflictDoUpdate({ target: [cs2Accounts.source, cs2Accounts.handle], set: { playerId } });
  }

  async saveMany(matches: readonly Cs2Match[]): Promise<number> {
    if (matches.length === 0) return 0;
    const inserted = await this.db
      .insert(cs2Matches)
      .values([...matches])
      .onConflictDoNothing()
      .returning({ matchId: cs2Matches.matchId });
    return inserted.length;
  }

  async listRecent(source: Cs2Source, playerId: string, limit: number): Promise<Cs2Match[]> {
    const rows = await this.db
      .select()
      .from(cs2Matches)
      .where(and(eq(cs2Matches.source, source), eq(cs2Matches.playerId, playerId)))
      .orderBy(desc(cs2Matches.playedAt))
      .limit(limit);
    return rows.map(({ createdAt, ...match }) => match);
  }
}
