import { describe, expect, it, vi } from "vitest";
import { PremierService } from "./premier-service";

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const STEAM_ID = "76561198000000001";

function item(id: string, finishedAt: string, won: number, lost: number) {
  return {
    id,
    finished_at: finishedAt,
    data_source: "matchmaking",
    map_name: "de_dust2",
    stats: [{ steam64_id: STEAM_ID, total_kills: 20, total_deaths: 10, rounds_won: won, rounds_lost: lost, dpr: 80 }],
  };
}

describe("PremierService", () => {
  it("returns valid matches newest first with a summary, dropping the rest", async () => {
    const leetify = {
      getRecentMatches: vi.fn(async () => [
        item("old", "2026-11-20T10:00:00Z", 13, 5),
        { broken: true },
        item("new", "2026-11-24T10:00:00Z", 8, 13),
      ]),
    };
    const overview = await new PremierService({ leetify, steam64Id: STEAM_ID }).getOverview();

    expect(leetify.getRecentMatches).toHaveBeenCalledWith(STEAM_ID);
    expect(overview.matches.map((match) => match.matchId)).toEqual(["new", "old"]);
    expect(overview.summary).toMatchObject({ matches: 2, wins: 1, adr: 80 });
  });

  it("propagates Leetify errors to the page", async () => {
    const leetify = { getRecentMatches: vi.fn(async () => Promise.reject(new Error("down"))) };
    await expect(new PremierService({ leetify, steam64Id: STEAM_ID }).getOverview()).rejects.toThrow("down");
  });
});
