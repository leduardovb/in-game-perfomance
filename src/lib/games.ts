/** Games and LoL roles are shared by training and (later) match history. */

export const GAMES = ["lol", "cs2"] as const;
export type Game = (typeof GAMES)[number];

export const LOL_ROLES = ["mid", "top", "jungle", "adc", "support"] as const;
export type LolRole = (typeof LOL_ROLES)[number];

export const GAME_LABELS: Record<Game, string> = {
  lol: "League of Legends",
  cs2: "Counter-Strike 2",
};

export const GAME_SHORT_LABELS: Record<Game, string> = {
  lol: "LoL",
  cs2: "CS2",
};

export const LOL_ROLE_LABELS: Record<LolRole, string> = {
  mid: "Mid",
  top: "Top",
  jungle: "Jungle",
  adc: "ADC",
  support: "Suporte",
};

export function isGame(value: string): value is Game {
  return (GAMES as readonly string[]).includes(value);
}
