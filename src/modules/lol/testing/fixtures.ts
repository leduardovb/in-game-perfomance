import type { LolMatch } from "../domain/types";
import type { RiotMatch } from "../riot/riot-client";

export const PUUID = "puuid-eduardo";

export function riotMatch(matchId: string, overrides: Partial<RiotMatch["info"]["participants"][number]> = {}): RiotMatch {
  const base = {
    puuid: PUUID,
    championName: "Ahri",
    teamPosition: "MIDDLE",
    win: true,
    kills: 7,
    deaths: 2,
    assists: 9,
    totalMinionsKilled: 200,
    neutralMinionsKilled: 10,
    totalDamageDealtToChampions: 24000.4,
    goldEarned: 13000,
    visionScore: 22,
  };
  return {
    metadata: { matchId },
    info: {
      gameCreation: Date.parse("2026-11-20T20:00:00Z"),
      gameEndTimestamp: Date.parse("2026-11-20T20:30:00Z"),
      gameDuration: 1800,
      queueId: 420,
      participants: [{ ...base, ...overrides }, { ...base, puuid: "someone-else", win: !base.win }],
    },
  };
}

export function lolMatch(overrides: Partial<LolMatch> = {}): LolMatch {
  return {
    matchId: "BR1_1",
    puuid: PUUID,
    playedAt: new Date("2026-11-20T20:30:00Z"),
    queueId: 420,
    durationSeconds: 1800,
    champion: "Ahri",
    position: "MIDDLE",
    win: true,
    kills: 7,
    deaths: 2,
    assists: 9,
    creepScore: 210,
    damageToChampions: 24000,
    gold: 13000,
    visionScore: 22,
    ...overrides,
  };
}
