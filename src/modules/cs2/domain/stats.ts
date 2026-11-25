import type { Cs2Match } from "./types";

type MatchStats = Pick<Cs2Match, "win" | "kills" | "deaths" | "adr" | "headshotRate">;

/** K/D using D = 1 for a deathless game. */
export function kdRatio(match: Pick<Cs2Match, "kills" | "deaths">): number {
  return match.kills / Math.max(match.deaths, 1);
}

export type Cs2Summary = {
  matches: number;
  wins: number;
  winRate: number;
  /** Aggregate: total kills / total deaths. */
  kdRatio: number;
  /** Mean of per-match ADR (round counts aren't available from every source). */
  adr: number;
  /** Headshot kills / total kills. */
  headshotRate: number;
};

export function summarize(matches: readonly MatchStats[]): Cs2Summary | null {
  if (matches.length === 0) return null;
  let wins = 0;
  let kills = 0;
  let deaths = 0;
  let adr = 0;
  let headshotKills = 0;
  for (const match of matches) {
    if (match.win) wins++;
    kills += match.kills;
    deaths += match.deaths;
    adr += match.adr;
    headshotKills += match.kills * match.headshotRate;
  }
  return {
    matches: matches.length,
    wins,
    winRate: wins / matches.length,
    kdRatio: kdRatio({ kills, deaths }),
    adr: adr / matches.length,
    headshotRate: kills > 0 ? headshotKills / kills : 0,
  };
}
