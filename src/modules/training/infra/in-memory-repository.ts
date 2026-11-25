import type { IsoDate } from "@/lib/date";
import { TrainingError } from "../domain/errors";
import type { NewTrainingSession } from "../domain/session";
import type { Game, TrainingSession } from "../domain/types";
import type { TrainingSessionChanges, TrainingSessionRepository } from "../repository";

/** Test double that mirrors the Drizzle repository's contract, including the (game, date) uniqueness. */
export class InMemoryTrainingSessionRepository implements TrainingSessionRepository {
  private readonly sessions = new Map<string, TrainingSession>();
  private nextId = 1;

  async findById(id: string) {
    return this.sessions.get(id) ?? null;
  }

  async findByDate(game: Game, date: IsoDate) {
    return [...this.sessions.values()].find((s) => s.game === game && s.date === date) ?? null;
  }

  async listSince(game: Game, fromDate: IsoDate) {
    return [...this.sessions.values()]
      .filter((s) => s.game === game && s.date >= fromDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async create(session: NewTrainingSession) {
    if (await this.findByDate(session.game, session.date)) {
      throw new TrainingError("O treino de hoje já foi iniciado.", "SESSION_ALREADY_EXISTS");
    }
    const now = new Date();
    const created: TrainingSession = { ...session, id: String(this.nextId++), createdAt: now, updatedAt: now };
    this.sessions.set(created.id, created);
    return created;
  }

  async update(id: string, changes: TrainingSessionChanges) {
    const current = this.sessions.get(id);
    if (!current) throw new TrainingError("Treino não encontrado.", "SESSION_NOT_FOUND");
    const updated = { ...current, ...changes, updatedAt: new Date() };
    this.sessions.set(id, updated);
    return updated;
  }
}
