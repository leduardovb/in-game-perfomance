import { logger } from "@/lib/logger";
import { summarize } from "./domain/stats";
import type { Cs2Match } from "./domain/types";
import type { LeetifyClient } from "./leetify/leetify-client";
import { toCs2MatchFromLeetify } from "./leetify/mapper";
import type { Cs2Overview } from "./service";

export type LeetifyGateway = Pick<LeetifyClient, "getRecentMatches">;

/**
 * Premier and matchmaking matches, read live from Leetify on every view (behind a short
 * fetch cache). Nothing is persisted: Leetify's terms forbid building a history from its data.
 */
export class PremierService {
  constructor(
    private readonly deps: {
      leetify: LeetifyGateway;
      steam64Id: string;
    },
  ) {}

  get steam64Id(): string {
    return this.deps.steam64Id;
  }

  async getOverview(): Promise<Cs2Overview> {
    const items = await this.deps.leetify.getRecentMatches(this.deps.steam64Id);
    const matches = items
      .map((item) => toCs2MatchFromLeetify(item, this.deps.steam64Id))
      .filter((match): match is Cs2Match => match !== null)
      .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime());

    logger.info("cs2.leetify_overview_loaded", { received: items.length, shown: matches.length });
    return { matches, summary: summarize(matches) };
  }
}
