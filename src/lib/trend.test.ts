import { describe, expect, it } from "vitest";
import { rollingAverage } from "./trend";

const day = (n: number) => ({ matchId: `M${n}`, playedAt: new Date(`2026-11-0${n}T12:00:00Z`), kills: n * 2 });

describe("rollingAverage", () => {
  const matches = [3, 1, 2].map(day);

  it("orders oldest first and averages over full windows only", () => {
    const points = rollingAverage(matches, (match) => match.kills, 2);
    expect(points.map((point) => point.matchId)).toEqual(["M2", "M3"]);
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
