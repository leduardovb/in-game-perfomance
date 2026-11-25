import type { Cs2Match } from "../domain/types";
import { parseLeetifyMatch, playerStatsSchema } from "./leetify-client";

/** FACEIT matches also appear on Leetify; they come from the stored FACEIT history instead. */
const EXCLUDED_SOURCES = new Set(["faceit"]);

/**
 * Converts one Leetify match into the app's model, from the tracked player's point of view.
 * Returns null for matches that are malformed, from an excluded source, or without the player.
 */
export function toCs2MatchFromLeetify(value: unknown, steam64Id: string): Cs2Match | null {
  const match = parseLeetifyMatch(value);
  if (!match || EXCLUDED_SOURCES.has(match.data_source.toLowerCase())) return null;

  const playedAt = new Date(match.finished_at);
  if (Number.isNaN(playedAt.getTime())) return null;

  const player = match.stats
    .map((entry) => playerStatsSchema.safeParse(entry))
    .find((parsed) => parsed.success && parsed.data.steam64_id === steam64Id)?.data;
  if (!player) return null;

  const rounds = player.rounds_count ?? player.rounds_won + player.rounds_lost;
  const adr = player.dpr ?? (rounds > 0 && player.total_damage !== undefined ? player.total_damage / rounds : 0);

  return {
    source: "leetify",
    matchId: match.id,
    playerId: steam64Id,
    playedAt,
    map: match.map_name,
    win: player.rounds_won > player.rounds_lost,
    score: `${player.rounds_won} / ${player.rounds_lost}`,
    kills: player.total_kills,
    deaths: player.total_deaths,
    assists: player.total_assists ?? 0,
    adr,
    headshotRate:
      player.total_kills > 0 && player.total_hs_kills !== undefined ? player.total_hs_kills / player.total_kills : 0,
  };
}
