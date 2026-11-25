import { z } from "zod";
import type { Cs2Match } from "../domain/types";
import type { FaceitStatsRecord } from "./faceit-client";

const numeric = z.coerce.number().refine(Number.isFinite);
const optionalNumeric = numeric.optional().catch(undefined);

/**
 * The fields read from FACEIT's per-match stats. Required ones identify the match;
 * the rest default to 0 so one missing stat doesn't drop the whole match.
 */
const faceitStatsSchema = z.object({
  "Match Id": z.string().min(1),
  Map: z.string().min(1),
  Result: z.union([z.literal("1"), z.literal("0"), z.literal(1), z.literal(0)]),
  Kills: numeric,
  Deaths: numeric,
  Assists: optionalNumeric,
  ADR: optionalNumeric,
  "Headshots %": optionalNumeric,
  Score: z.string().optional().catch(undefined),
  /** Epoch milliseconds. */
  "Match Finished At": numeric,
});

export type MapResult = { ok: true; match: Cs2Match } | { ok: false; reason: string };

export function toCs2Match(stats: FaceitStatsRecord, playerId: string): MapResult {
  const parsed = faceitStatsSchema.safeParse(stats);
  if (!parsed.success) {
    return { ok: false, reason: parsed.error.issues.map((issue) => issue.path.join(".")).join(", ") };
  }
  const data = parsed.data;
  return {
    ok: true,
    match: {
      source: "faceit",
      matchId: data["Match Id"],
      playerId,
      playedAt: new Date(data["Match Finished At"]),
      map: data.Map,
      win: String(data.Result) === "1",
      score: data.Score ?? null,
      kills: Math.round(data.Kills),
      deaths: Math.round(data.Deaths),
      assists: Math.round(data.Assists ?? 0),
      adr: data.ADR ?? 0,
      headshotRate: Math.min(Math.max((data["Headshots %"] ?? 0) / 100, 0), 1),
    },
  };
}
