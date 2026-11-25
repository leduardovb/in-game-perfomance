/** Where a CS2 match came from. Premier is added when its source is decided. */
export const CS2_SOURCES = ["faceit"] as const;
export type Cs2Source = (typeof CS2_SOURCES)[number];

export const CS2_SOURCE_LABELS: Record<Cs2Source, string> = {
  faceit: "FACEIT",
};

/** One CS2 match from the tracked player's point of view. */
export type Cs2Match = {
  source: Cs2Source;
  matchId: string;
  /** The player's id on the source platform. */
  playerId: string;
  playedAt: Date;
  map: string;
  win: boolean;
  /** Final score as reported by the source, e.g. "13 / 9". */
  score: string | null;
  kills: number;
  deaths: number;
  assists: number;
  /** Average damage per round. */
  adr: number;
  /** Share of kills that were headshots, 0 to 1. */
  headshotRate: number;
};
