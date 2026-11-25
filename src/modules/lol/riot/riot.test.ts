import { describe, expect, it, vi } from "vitest";
import { PUUID, riotMatch } from "../testing/fixtures";
import { toLolMatch } from "./mapper";
import { RiotApiError, RiotClient } from "./riot-client";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" }, ...init });
}

describe("RiotClient", () => {
  it("routes BR to the americas cluster, sends the key and encodes the Riot ID", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse({ puuid: PUUID }));
    const client = new RiotClient({ apiKey: "RGAPI-test", platform: "BR1", fetch: fetchMock });

    expect(await client.getPuuid("duDu Box", "2713")).toBe(PUUID);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/duDu%20Box/2713");
    expect(init?.headers).toEqual({ "X-Riot-Token": "RGAPI-test" });
  });

  it("rejects unknown platforms", () => {
    expect(() => new RiotClient({ apiKey: "k", platform: "xx9" })).toThrow(/não suportado/);
  });

  it.each([
    [403, /chave da Riot é inválida/],
    [404, /não encontrada/],
    [500, /HTTP 500/],
  ])("maps HTTP %i to a clear error", async (status, message) => {
    const client = new RiotClient({ apiKey: "k", platform: "br1", fetch: (async () => jsonResponse({}, { status })) as typeof fetch });
    await expect(client.getMatch("BR1_1")).rejects.toThrow(message);
  });

  it("exposes Retry-After on rate limits", async () => {
    const fetchMock = async () => jsonResponse({}, { status: 429, headers: { "Retry-After": "12" } });
    const client = new RiotClient({ apiKey: "k", platform: "br1", fetch: fetchMock as typeof fetch });
    await expect(client.getMatchIds(PUUID, 20)).rejects.toMatchObject({ status: 429, retryAfterSeconds: 12 });
  });

  it("rejects unexpected payloads and network failures", async () => {
    const badPayload = new RiotClient({ apiKey: "k", platform: "br1", fetch: (async () => jsonResponse({ nope: 1 })) as typeof fetch });
    await expect(badPayload.getPuuid("a", "b")).rejects.toThrow(/formato inesperado/);

    const offline = new RiotClient({
      apiKey: "k",
      platform: "br1",
      fetch: (async () => {
        throw new TypeError("fetch failed");
      }) as typeof fetch,
    });
    await expect(offline.getPuuid("a", "b")).rejects.toBeInstanceOf(RiotApiError);
  });
});

describe("toLolMatch", () => {
  it("extracts the tracked player's stats", () => {
    expect(toLolMatch(riotMatch("BR1_9"), PUUID)).toMatchObject({
      matchId: "BR1_9",
      champion: "Ahri",
      position: "MIDDLE",
      creepScore: 210,
      damageToChampions: 24000,
      durationSeconds: 1800,
      playedAt: new Date("2026-11-20T20:30:00Z"),
    });
  });

  it("returns null when the player isn't in the match", () => {
    expect(toLolMatch(riotMatch("BR1_9"), "stranger")).toBeNull();
  });

  it("converts legacy millisecond durations", () => {
    const legacy = riotMatch("BR1_old");
    legacy.info.gameEndTimestamp = undefined;
    legacy.info.gameDuration = 1_500_000;
    expect(toLolMatch(legacy, PUUID)?.durationSeconds).toBe(1500);
  });
});
