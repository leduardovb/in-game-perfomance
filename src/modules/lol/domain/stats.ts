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

export type TrendPoint = { matchId: string; playedAt: Date; value: number };

/**
 * Rolling average of a per-match metric, oldest first. Each point averages the last
 * `window` matches up to it, which smooths single-game noise into a trend. Points whose
 * window isn't full yet are dropped (they'd swing on one game), unless that leaves fewer than two.
 */
export function rollingAverage<T extends Pick<LolMatch, "matchId" | "playedAt">>(
  matches: readonly T[],
  metric: (match: T) => number,
  window: number,
): TrendPoint[] {
  if (window < 1) throw new RangeError("window must be at least 1");
  const chronological = [...matches].sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime());
  const values = chronological.map(metric);

  const points = chronological.map((match, index) => {
    const slice = values.slice(Math.max(0, index - window + 1), index + 1);
    return {
      matchId: match.matchId,
      playedAt: match.playedAt,
      value: slice.reduce((sum, value) => sum + value, 0) / slice.length,
    };
  });
  const full = points.slice(window - 1);
  return full.length >= 2 ? full : points;
}
