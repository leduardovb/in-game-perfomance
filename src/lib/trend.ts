export type TrendPoint = { matchId: string; playedAt: Date; value: number };

type Datable = { matchId: string; playedAt: Date };

/**
 * Rolling average of a per-match metric, oldest first. Each point averages the last
 * `window` matches up to it, which smooths single-game noise into a trend. Points whose
 * window isn't full yet are dropped (they'd swing on one game), unless that leaves fewer than two.
 */
export function rollingAverage<T extends Datable>(
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
