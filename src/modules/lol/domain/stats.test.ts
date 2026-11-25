import { describe, expect, it } from "vitest";
import { lolMatch } from "../testing/fixtures";
import { csPerMinute, damagePerMinute, kda, summarize } from "./stats";

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
