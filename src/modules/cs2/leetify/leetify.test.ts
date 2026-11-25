import { describe, expect, it, vi } from "vitest";
import { LEETIFY_CACHE_SECONDS, LeetifyApiError, LeetifyClient } from "./leetify-client";
import { toCs2MatchFromLeetify } from "./mapper";

const STEAM_ID = "76561198000000001";

function leetifyMatch(overrides: Record<string, unknown> = {}, player: Record<string, unknown> = {}) {
  return {
    id: "lt-1",
    finished_at: "2026-11-24T22:10:00Z",
    data_source: "matchmaking",
    map_name: "de_ancient",
    team_scores: [
      { team_number: 2, score: 13 },
      { team_number: 3, score: 10 },
    ],
    stats: [
      { steam64_id: "76561198000000999", total_kills: 5, total_deaths: 18, rounds_won: 10, rounds_lost: 13 },
      {
        steam64_id: STEAM_ID,
        total_kills: 24,
        total_deaths: 16,
        total_assists: 5,
        total_damage: 2070,
        dpr: 90,
        total_hs_kills: 12,
        rounds_count: 23,
        rounds_won: 13,
        rounds_lost: 10,
        ...player,
      },
    ],
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("LeetifyClient", () => {
  it("requests the player's matches with a bounded cache and the optional key", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse([leetifyMatch()]));
    const client = new LeetifyClient({ apiKey: "lk", fetch: fetchMock });

    expect(await client.getRecentMatches(STEAM_ID)).toHaveLength(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://api-public.cs-prod.leetify.com/v3/profile/matches?steam64_id=${STEAM_ID}`);
    expect(init?.headers).toMatchObject({ _leetify_key: "lk" });
    expect(init?.next?.revalidate).toBe(LEETIFY_CACHE_SECONDS);
    expect(LEETIFY_CACHE_SECONDS).toBeLessThanOrEqual(8 * 60 * 60);
  });

  it("omits the key header when no key is configured", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse([]));
    await new LeetifyClient({ fetch: fetchMock }).getRecentMatches(STEAM_ID);
    expect(fetchMock.mock.calls[0][1]?.headers).not.toHaveProperty("_leetify_key");
  });

  it.each([
    [401, /chave do Leetify/],
    [404, /Perfil não encontrado/],
    [429, /Limite/],
    [500, /HTTP 500/],
  ])("maps HTTP %i to a clear error", async (status, message) => {
    const client = new LeetifyClient({ fetch: async () => jsonResponse({}, status) });
    await expect(client.getRecentMatches(STEAM_ID)).rejects.toThrow(message);
  });

  it("rejects a non-list payload and wraps network failures", async () => {
    await expect(
      new LeetifyClient({ fetch: async () => jsonResponse({ matches: [] }) }).getRecentMatches(STEAM_ID),
    ).rejects.toThrow(/formato inesperado/);
    const offline = new LeetifyClient({
      fetch: async () => {
        throw new TypeError("fetch failed");
      },
    });
    await expect(offline.getRecentMatches(STEAM_ID)).rejects.toBeInstanceOf(LeetifyApiError);
  });
});

describe("toCs2MatchFromLeetify", () => {
  it("reads the tracked player's line", () => {
    expect(toCs2MatchFromLeetify(leetifyMatch(), STEAM_ID)).toEqual({
      source: "leetify",
      matchId: "lt-1",
      playerId: STEAM_ID,
      playedAt: new Date("2026-11-24T22:10:00Z"),
      map: "de_ancient",
      win: true,
      score: "13 / 10",
      kills: 24,
      deaths: 16,
      assists: 5,
      adr: 90,
      headshotRate: 0.5,
    });
  });

  it("derives ADR from damage when dpr is missing", () => {
    const match = toCs2MatchFromLeetify(leetifyMatch({}, { dpr: undefined }), STEAM_ID);
    expect(match?.adr).toBe(90);
  });

  it("skips FACEIT matches, which come from the stored FACEIT history", () => {
    expect(toCs2MatchFromLeetify(leetifyMatch({ data_source: "faceit" }), STEAM_ID)).toBeNull();
  });

  it("skips malformed matches and matches without the player", () => {
    expect(toCs2MatchFromLeetify({ id: "x" }, STEAM_ID)).toBeNull();
    expect(toCs2MatchFromLeetify(leetifyMatch({ finished_at: "ontem" }), STEAM_ID)).toBeNull();
    expect(toCs2MatchFromLeetify(leetifyMatch(), "76561198000000002")).toBeNull();
  });
});
