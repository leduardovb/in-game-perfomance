import type { LolMatch } from "./types";

type MatchStats = Pick<
  LolMatch,
  "win" | "kills" | "deaths" | "assists" | "creepScore" | "damageToChampions" | "durationSeconds"
>;

/** (K + A) / D, using D = 1 when the player didn't die, as the in-game client does. */
export function kda(match: Pick<LolMatch, "kills" | "deaths" | "assists">): number {
  return (match.kills + match.assists) / Math.max(match.deaths, 1);
}

function perMinute(value: number, durationSeconds: number): number {
  return durationSeconds > 0 ? value / (durationSeconds / 60) : 0;
}

export function csPerMinute(match: Pick<LolMatch, "creepScore" | "durationSeconds">): number {
  return perMinute(match.creepScore, match.durationSeconds);
}

export function damagePerMinute(match: Pick<LolMatch, "damageToChampions" | "durationSeconds">): number {
  return perMinute(match.damageToChampions, match.durationSeconds);
}

export type LolSummary = {
  matches: number;
  wins: number;
  winRate: number;
  /** Aggregate KDA: total (K + A) / total D, so one deathless stomp doesn't dominate. */
  kda: number;
  csPerMinute: number;
  damagePerMinute: number;
};

export function summarize(matches: readonly MatchStats[]): LolSummary | null {
  if (matches.length === 0) return null;
  const totals = matches.reduce(
    (sum, match) => ({
      wins: sum.wins + (match.win ? 1 : 0),
      kills: sum.kills + match.kills,
      deaths: sum.deaths + match.deaths,
      assists: sum.assists + match.assists,
      creepScore: sum.creepScore + match.creepScore,
      damage: sum.damage + match.damageToChampions,
      seconds: sum.seconds + match.durationSeconds,
    }),
    { wins: 0, kills: 0, deaths: 0, assists: 0, creepScore: 0, damage: 0, seconds: 0 },
  );
  return {
    matches: matches.length,
    wins: totals.wins,
    winRate: totals.wins / matches.length,
    kda: kda(totals),
    csPerMinute: perMinute(totals.creepScore, totals.seconds),
    damagePerMinute: perMinute(totals.damage, totals.seconds),
  };
}
