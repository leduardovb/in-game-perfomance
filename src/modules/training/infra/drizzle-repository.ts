import { and, desc, eq, gte } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { trainingSessions } from "@/lib/db/schema";
import type { IsoDate } from "@/lib/date";
import { TrainingError } from "../domain/errors";
import type { NewTrainingSession } from "../domain/session";
import type { Game, TrainingSession } from "../domain/types";
import type { TrainingSessionChanges, TrainingSessionRepository } from "../repository";

const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
  // Drizzle wraps driver errors; the Postgres code may be on the error or its cause.
  const candidates = [error, (error as { cause?: unknown } | null)?.cause];
  return candidates.some(
    (candidate) => (candidate as { code?: string } | null)?.code === UNIQUE_VIOLATION,
  );
}

export class DrizzleTrainingSessionRepository implements TrainingSessionRepository {
  constructor(private readonly db: Db) {}

  async findById(id: string): Promise<TrainingSession | null> {
    const [row] = await this.db.select().from(trainingSessions).where(eq(trainingSessions.id, id));
    return row ?? null;
  }

  async findByDate(game: Game, date: IsoDate): Promise<TrainingSession | null> {
    const [row] = await this.db
      .select()
      .from(trainingSessions)
      .where(and(eq(trainingSessions.game, game), eq(trainingSessions.date, date)));
    return row ?? null;
  }

  listSince(game: Game, fromDate: IsoDate): Promise<TrainingSession[]> {
    return this.db
      .select()
      .from(trainingSessions)
      .where(and(eq(trainingSessions.game, game), gte(trainingSessions.date, fromDate)))
      .orderBy(desc(trainingSessions.date));
  }

  async create(session: NewTrainingSession): Promise<TrainingSession> {
    try {
      const [row] = await this.db.insert(trainingSessions).values(session).returning();
      return row;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new TrainingError("O treino de hoje já foi iniciado.", "SESSION_ALREADY_EXISTS");
      }
      throw error;
    }
  }

  async update(id: string, changes: TrainingSessionChanges): Promise<TrainingSession> {
    const [row] = await this.db
      .update(trainingSessions)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(trainingSessions.id, id))
      .returning();
    if (!row) throw new TrainingError("Treino não encontrado.", "SESSION_NOT_FOUND");
    return row;
  }
}
