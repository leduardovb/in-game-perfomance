import { describe, expect, it, vi } from "vitest";
import { InMemoryCs2MatchRepository } from "./infra/in-memory-repository";
import { Cs2Service, type FaceitGateway } from "./service";
import { PLAYER_ID, faceitStats } from "./testing/fixtures";

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

function setup(faceit: FaceitGateway | null) {
  const repository = new InMemoryCs2MatchRepository();
  const service = new Cs2Service({ faceit, repository, faceitNickname: " duDuBoxBox " });
  return { repository, service };
}

function fakeFaceit(records = [faceitStats("m2"), faceitStats("m1")]): FaceitGateway {
  return { getPlayerId: vi.fn(async () => PLAYER_ID), getRecentMatchStats: vi.fn(async () => records) };
}

describe("Cs2Service", () => {
  it("stores new matches once and caches the player id", async () => {
    const faceit = fakeFaceit();
    const { repository, service } = setup(faceit);

    expect(await service.syncFaceitMatches()).toEqual({ checked: 2, added: 2 });
    expect(await service.syncFaceitMatches()).toEqual({ checked: 2, added: 0 });
    expect(faceit.getPlayerId).toHaveBeenCalledTimes(1);
    expect(faceit.getPlayerId).toHaveBeenCalledWith("duDuBoxBox");
    expect(repository.matches.size).toBe(2);
  });

  it("skips malformed records but keeps the rest", async () => {
    const { service } = setup(fakeFaceit([faceitStats("ok"), { Map: "de_nuke" }]));
    expect(await service.syncFaceitMatches()).toEqual({ checked: 2, added: 1 });
  });

  it("summarizes stored matches without calling FACEIT", async () => {
    const faceit = fakeFaceit();
    const { service } = setup(faceit);
    expect((await service.getOverview()).summary).toBeNull();

    await service.syncFaceitMatches();
    const overview = await service.getOverview();
    expect(overview.matches.map((match) => match.matchId)).toHaveLength(2);
    expect(overview.summary?.matches).toBe(2);
    expect(faceit.getRecentMatchStats).toHaveBeenCalledTimes(1);
  });

  it("refuses to sync without an API key", async () => {
    const { service } = setup(null);
    expect(service.isSyncEnabled).toBe(false);
    await expect(service.syncFaceitMatches()).rejects.toThrow(/FACEIT_API_KEY/);
  });
});
