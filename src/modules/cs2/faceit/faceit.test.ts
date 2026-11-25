import { describe, expect, it, vi } from "vitest";
import { PLAYER_ID, faceitStats } from "../testing/fixtures";
import { FaceitApiError, FaceitClient } from "./faceit-client";
import { toCs2Match } from "./mapper";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("FaceitClient", () => {
  it("looks up the player for CS2 with a bearer key", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse({ player_id: PLAYER_ID }));
    const client = new FaceitClient({ apiKey: "key", fetch: fetchMock });

    expect(await client.getPlayerId("duDu Box")).toBe(PLAYER_ID);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://open.faceit.com/data/v4/players?nickname=duDu+Box&game=cs2");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer key" });
  });

  it("returns the stats records of the latest matches", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse({ items: [{ stats: faceitStats("m1") }] }));
    const client = new FaceitClient({ apiKey: "key", fetch: fetchMock });

    expect(await client.getRecentMatchStats(PLAYER_ID, 50)).toEqual([faceitStats("m1")]);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `https://open.faceit.com/data/v4/players/${PLAYER_ID}/games/cs2/stats?offset=0&limit=50`,
    );
  });

  it.each([
    [401, /chave da FACEIT é inválida/],
    [404, /não encontrado/],
    [429, /Limite/],
    [503, /HTTP 503/],
  ])("maps HTTP %i to a clear error", async (status, message) => {
    const client = new FaceitClient({ apiKey: "key", fetch: async () => jsonResponse({}, status) });
    await expect(client.getPlayerId("x")).rejects.toThrow(message);
  });

  it("wraps network failures", async () => {
    const client = new FaceitClient({
      apiKey: "key",
      fetch: async () => {
        throw new TypeError("fetch failed");
      },
    });
    await expect(client.getPlayerId("x")).rejects.toBeInstanceOf(FaceitApiError);
  });
});

describe("toCs2Match", () => {
  it("parses FACEIT's string stats", () => {
    const result = toCs2Match(faceitStats("m1"), PLAYER_ID);
    expect(result).toEqual({
      ok: true,
      match: {
        source: "faceit",
        matchId: "m1",
        playerId: PLAYER_ID,
        playedAt: new Date(1_764_100_000_000),
        map: "de_mirage",
        win: true,
        score: "13 / 9",
        kills: 21,
        deaths: 15,
        assists: 4,
        adr: 88.4,
        headshotRate: 0.52,
      },
    });
  });

  it("defaults optional stats instead of dropping the match", () => {
    const result = toCs2Match(faceitStats("m1", { ADR: undefined, "Headshots %": "n/a", Result: "0" }), PLAYER_ID);
    expect(result).toMatchObject({ ok: true, match: { adr: 0, headshotRate: 0, win: false } });
  });

  it("rejects records missing identifying fields", () => {
    const result = toCs2Match(faceitStats("m1", { "Match Id": undefined, Kills: "abc" }), PLAYER_ID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("Match Id");
  });
});
