import { describe, expect, it } from "vitest";
import { lolMatch } from "../testing/fixtures";
import { csPerMinute, damagePerMinute, kda, rollingAverage, summarize } from "./stats";

describe("per-match metrics", () => {
  it("computes KDA treating zero deaths as one", () => {
    expect(kda({ kills: 7, deaths: 2, assists: 9 })).toBe(8);
    expect(kda({ kills: 5, deaths: 0, assists: 5 })).toBe(10);
  });

  it("computes per-minute rates and guards zero duration", () => {
    expect(csPerMinute({ creepScore: 210, durationSeconds: 1800 })).toBe(7);
    expect(damagePerMinute({ damageToChampions: 24000, durationSeconds: 1800 })).toBe(800);
    expect(csPerMinute({ creepScore: 10, durationSeconds: 0 })).toBe(0);
  });
});

describe("summarize", () => {
  it("returns null without matches", () => {
    expect(summarize([])).toBeNull();
  });

  it("aggregates totals rather than averaging per-match ratios", () => {
    const summary = summarize([
      lolMatch({ win: true, kills: 10, deaths: 0, assists: 10, creepScore: 300, durationSeconds: 1800 }),
      lolMatch({ win: false, kills: 0, deaths: 5, assists: 0, creepScore: 60, durationSeconds: 1200 }),
    ]);
    expect(summary).toMatchObject({ matches: 2, wins: 1, winRate: 0.5, kda: 4 });
    expect(summary?.csPerMinute).toBeCloseTo(360 / 50);
  });
});

describe("rollingAverage", () => {
  const matches = [3, 1, 2].map((day) =>
    lolMatch({ matchId: `BR1_${day}`, playedAt: new Date(`2026-11-0${day}T12:00:00Z`), kills: day * 2 }),
  );

  it("orders oldest first and averages over full windows only", () => {
    const points = rollingAverage(matches, (match) => match.kills, 2);
    expect(points.map((point) => point.matchId)).toEqual(["BR1_2", "BR1_3"]);
    expect(points.map((point) => point.value)).toEqual([3, 5]);
  });

  it("keeps partial windows when there are too few matches for two full ones", () => {
    const points = rollingAverage(matches, (match) => match.kills, 3);
    expect(points.map((point) => point.value)).toEqual([2, 3, 4]);
  });

  it("rejects an empty window", () => {
    expect(() => rollingAverage(matches, (match) => match.kills, 0)).toThrow(RangeError);
  });
});
