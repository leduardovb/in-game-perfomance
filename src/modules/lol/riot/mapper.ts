import type { LolMatch } from "../domain/types";
import type { RiotMatch } from "./riot-client";

/** Extracts the tracked player's line from a Riot match. Returns null if they aren't in it. */
export function toLolMatch(match: RiotMatch, puuid: string): LolMatch | null {
  const player = match.info.participants.find((participant) => participant.puuid === puuid);
  if (!player) return null;

  return {
    matchId: match.metadata.matchId,
    puuid,
    playedAt: new Date(match.info.gameEndTimestamp ?? match.info.gameCreation),
    queueId: match.info.queueId,
    // Riot reports gameDuration in milliseconds for matches older than patch 11.20,
    // which are exactly the ones without gameEndTimestamp.
    durationSeconds:
      match.info.gameEndTimestamp === undefined
        ? Math.round(match.info.gameDuration / 1000)
        : match.info.gameDuration,
    champion: player.championName,
    position: player.teamPosition,
    win: player.win,
    kills: player.kills,
    deaths: player.deaths,
    assists: player.assists,
    creepScore: player.totalMinionsKilled + player.neutralMinionsKilled,
    damageToChampions: Math.round(player.totalDamageDealtToChampions),
    gold: Math.round(player.goldEarned),
    visionScore: Math.round(player.visionScore),
  };
}
