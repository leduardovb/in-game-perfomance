import type { IsoDate } from "@/lib/date";
import type { Game, LolRole } from "@/lib/games";

export type { Game, LolRole };

export type TrainingStep = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
};

/** A fixed training plan defined in code. */
export type TrainingTemplate = {
  id: string;
  game: Game;
  /** Only LoL templates are role-specific. */
  role: LolRole | null;
  name: string;
  steps: readonly TrainingStep[];
  defaultMatchesTarget: number;
};

/**
 * One day of training for one game. Steps are copied from the template when the
 * session starts, so editing a template later never rewrites past history.
 */
export type TrainingSession = {
  id: string;
  game: Game;
  date: IsoDate;
  templateId: string;
  role: LolRole | null;
  steps: TrainingStep[];
  completedStepIds: string[];
  matchesTarget: number;
  matchesPlayed: number;
  createdAt: Date;
  updatedAt: Date;
};

export const MIN_MATCHES_TARGET = 0;
export const MAX_MATCHES_TARGET = 10;
