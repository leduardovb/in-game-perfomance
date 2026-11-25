/** One LoL match from the tracked player's point of view. */
export type LolMatch = {
  matchId: string;
  puuid: string;
  playedAt: Date;
  queueId: number;
  durationSeconds: number;
  champion: string;
  /** Riot's teamPosition: TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY, or "" when unknown. */
  position: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  /** Lane minions + neutral monsters. */
  creepScore: number;
  damageToChampions: number;
  gold: number;
  visionScore: number;
};

export const QUEUES = {
  RANKED_SOLO: 420,
  RANKED_FLEX: 440,
  NORMAL_DRAFT: 400,
  NORMAL_BLIND: 430,
  QUICKPLAY: 490,
} as const;

/** Summoner's Rift queues. Other modes (ARAM, Arena) distort CS and damage per minute. */
export const SUMMONERS_RIFT_QUEUES: readonly number[] = Object.values(QUEUES);

export const QUEUE_LABELS: Record<number, string> = {
  [QUEUES.RANKED_SOLO]: "Solo/Duo",
  [QUEUES.RANKED_FLEX]: "Flex",
  [QUEUES.NORMAL_DRAFT]: "Normal",
  [QUEUES.NORMAL_BLIND]: "Normal",
  [QUEUES.QUICKPLAY]: "Rápida",
};

export const MATCH_FILTERS = ["solo", "rift"] as const;
export type MatchFilter = (typeof MATCH_FILTERS)[number];

export const MATCH_FILTER_LABELS: Record<MatchFilter, string> = {
  solo: "Ranqueada Solo/Duo",
  rift: "Todas em Summoner's Rift",
};

export function queuesFor(filter: MatchFilter): readonly number[] {
  return filter === "solo" ? [QUEUES.RANKED_SOLO] : SUMMONERS_RIFT_QUEUES;
}
