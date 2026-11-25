import { describe, expect, it, vi } from "vitest";
import { InMemoryLolMatchRepository } from "./infra/in-memory-repository";
import { RiotApiError } from "./riot/riot-client";
import { LolService, parseRiotId, type RiotGateway } from "./service";
import { PUUID, lolMatch, riotMatch } from "./testing/fixtures";

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

function fakeRiot(ids: string[], overrides: Partial<RiotGateway> = {}): RiotGateway {
  return {
    getPuuid: vi.fn(async () => PUUID),
    getMatchIds: vi.fn(async () => ids),
    getMatch: vi.fn(async (id: string) => riotMatch(id)),
    ...overrides,
  };
}

function setup(riot: RiotGateway | null) {
  const repository = new InMemoryLolMatchRepository();
  const service = new LolService({ riot, repository, riotId: { gameName: "duDuBoxBox", tagLine: "2713" } });
  return { repository, service };
}

describe("parseRiotId", () => {
  it("splits name and tag on the last #", () => {
    expect(parseRiotId("duDuBoxBox#2713")).toEqual({ gameName: "duDuBoxBox", tagLine: "2713" });
  });

  it.each(["semtag", "#2713", "nome#"])("rejects %s", (value) => {
    expect(() => parseRiotId(value)).toThrow(/Nome#TAG/);
  });
});

describe("LolService", () => {
  it("downloads only matches that aren't stored and caches the PUUID", async () => {
    const riot = fakeRiot(["BR1_3", "BR1_2", "BR1_1"]);
    const { repository, service } = setup(riot);
    await repository.save(lolMatch({ matchId: "BR1_2" }));

    expect(await service.syncRecentMatches()).toEqual({ checked: 3, added: 2 });
    expect(riot.getMatch).toHaveBeenCalledTimes(2);
    expect(await repository.findPuuid("duduboxbox#2713")).toBe(PUUID);

    await service.syncRecentMatches();
    expect(riot.getPuuid).toHaveBeenCalledTimes(1);
  });

  it("keeps matches saved before a rate limit", async () => {
    const riot = fakeRiot(["BR1_2", "BR1_1"], {
      getMatch: vi.fn(async (id: string) => {
        if (id === "BR1_1") throw new RiotApiError("limite", 429, 10);
        return riotMatch(id);
      }),
    });
    const { repository, service } = setup(riot);

    await expect(service.syncRecentMatches()).rejects.toMatchObject({ status: 429 });
    expect(repository.matches.size).toBe(1);
  });

  it("skips matches the player isn't part of", async () => {
    const riot = fakeRiot(["BR1_1"], { getMatch: vi.fn(async (id: string) => riotMatch(id, { puuid: "other" })) });
    const { service } = setup(riot);
    expect(await service.syncRecentMatches()).toEqual({ checked: 1, added: 0 });
  });

  it("reads the overview from storage, filtered by queue", async () => {
    const { service } = setup(fakeRiot(["BR1_1", "BR1_2"], {
      getMatch: vi.fn(async (id: string) => {
        const match = riotMatch(id);
        if (id === "BR1_2") match.info.queueId = 450; // ARAM
        return match;
      }),
    }));
    expect((await service.getOverview("solo")).summary).toBeNull();

    await service.syncRecentMatches();
    const overview = await service.getOverview("rift");
    expect(overview.matches.map((match) => match.matchId)).toEqual(["BR1_1"]);
    expect(overview.summary?.matches).toBe(1);
  });

  it("refuses to sync without an API key", async () => {
    const { service } = setup(null);
    expect(service.isSyncEnabled).toBe(false);
    await expect(service.syncRecentMatches()).rejects.toThrow(/RIOT_API_KEY/);
  });
});
