import { describe, expect, it } from "vitest";
import { cs2Match } from "../testing/fixtures";
import { kdRatio, summarize } from "./stats";

describe("cs2 stats", () => {
  it("guards K/D against zero deaths", () => {
    expect(kdRatio({ kills: 12, deaths: 0 })).toBe(12);
  });

  it("returns null without matches", () => {
    expect(summarize([])).toBeNull();
  });

  it("weights headshot rate by kills and aggregates K/D", () => {
    const summary = summarize([
      cs2Match({ win: true, kills: 30, deaths: 10, adr: 100, headshotRate: 0.6 }),
      cs2Match({ win: false, kills: 10, deaths: 20, adr: 60, headshotRate: 0.2 }),
    ]);
    expect(summary).toMatchObject({ matches: 2, wins: 1, winRate: 0.5, adr: 80 });
    expect(summary?.kdRatio).toBeCloseTo(40 / 30);
    expect(summary?.headshotRate).toBeCloseTo((18 + 2) / 40);
  });
});
