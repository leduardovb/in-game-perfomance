import type { Cs2Match } from "../domain/types";
import type { FaceitStatsRecord } from "../faceit/faceit-client";

export const PLAYER_ID = "faceit-player-1";

export function faceitStats(matchId: string, overrides: FaceitStatsRecord = {}): FaceitStatsRecord {
  return {
    "Match Id": matchId,
    Map: "de_mirage",
    Result: "1",
    Score: "13 / 9",
    Kills: "21",
    Deaths: "15",
    Assists: "4",
    ADR: "88.4",
    "Headshots %": "52",
    "K/D Ratio": "1.4",
    "Match Finished At": 1_764_100_000_000,
    ...overrides,
  };
}

export function cs2Match(overrides: Partial<Cs2Match> = {}): Cs2Match {
  return {
    source: "faceit",
    matchId: "1-abc",
    playerId: PLAYER_ID,
    playedAt: new Date("2026-11-20T20:00:00Z"),
    map: "de_mirage",
    win: true,
    score: "13 / 9",
    kills: 20,
    deaths: 10,
    assists: 3,
    adr: 90,
    headshotRate: 0.5,
    ...overrides,
  };
}
