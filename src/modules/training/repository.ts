import type { IsoDate } from "@/lib/date";
import type { NewTrainingSession } from "./domain/session";
import type { Game, TrainingSession } from "./domain/types";

export type TrainingSessionChanges = Pick<TrainingSession, "completedStepIds" | "matchesPlayed">;

/** Persistence port for training sessions. Implemented with Drizzle in production, in memory in tests. */
export interface TrainingSessionRepository {
  findById(id: string): Promise<TrainingSession | null>;
  findByDate(game: Game, date: IsoDate): Promise<TrainingSession | null>;
  /** Most recent first, including `fromDate`. */
  listSince(game: Game, fromDate: IsoDate): Promise<TrainingSession[]>;
  /** Throws `TrainingError("SESSION_ALREADY_EXISTS")` if the game already has a session that day. */
  create(session: NewTrainingSession): Promise<TrainingSession>;
  update(id: string, changes: TrainingSessionChanges): Promise<TrainingSession>;
}
