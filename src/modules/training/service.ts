import { addDays, toIsoDateInTimeZone, type IsoDate } from "@/lib/date";
import { logger } from "@/lib/logger";
import { TrainingError } from "./domain/errors";
import * as rules from "./domain/session";
import { getTemplate } from "./domain/templates";
import type { Game, LolRole, TrainingSession } from "./domain/types";
import type { TrainingSessionRepository } from "./repository";

export type TrainingServiceDeps = {
  repository: TrainingSessionRepository;
  timeZone: string;
  now?: () => Date;
};

export type TrainingHistory = {
  sessions: TrainingSession[];
  streak: number;
};

export const HISTORY_DAYS = 60;

export class TrainingService {
  private readonly repository: TrainingSessionRepository;
  private readonly timeZone: string;
  private readonly now: () => Date;

  constructor(deps: TrainingServiceDeps) {
    this.repository = deps.repository;
    this.timeZone = deps.timeZone;
    this.now = deps.now ?? (() => new Date());
  }

  today(): IsoDate {
    return toIsoDateInTimeZone(this.now(), this.timeZone);
  }

  getTodaySession(game: Game): Promise<TrainingSession | null> {
    return this.repository.findByDate(game, this.today());
  }

  async startToday(game: Game, role: LolRole | null, matchesTarget: number): Promise<TrainingSession> {
    const template = getTemplate(game, game === "lol" ? role : null);
    const session = await this.repository.create(rules.startSession(template, this.today(), matchesTarget));
    logger.info("training.session_started", {
      sessionId: session.id,
      game,
      templateId: template.id,
      matchesTarget,
    });
    return session;
  }

  async toggleStep(sessionId: string, stepId: string): Promise<TrainingSession> {
    const session = await this.getSessionOrThrow(sessionId);
    const next = rules.toggleStep(session, stepId);
    return this.repository.update(session.id, pickChanges(next));
  }

  async setMatchesPlayed(sessionId: string, matchesPlayed: number): Promise<TrainingSession> {
    const session = await this.getSessionOrThrow(sessionId);
    const next = rules.setMatchesPlayed(session, matchesPlayed);
    return this.repository.update(session.id, pickChanges(next));
  }

  async getHistory(game: Game): Promise<TrainingHistory> {
    const today = this.today();
    const sessions = await this.repository.listSince(game, addDays(today, -(HISTORY_DAYS - 1)));
    return { sessions, streak: rules.getCurrentStreak(sessions, today) };
  }

  private async getSessionOrThrow(sessionId: string): Promise<TrainingSession> {
    const session = await this.repository.findById(sessionId);
    if (!session) throw new TrainingError("Treino não encontrado.", "SESSION_NOT_FOUND");
    return session;
  }
}

function pickChanges(session: TrainingSession) {
  return { completedStepIds: session.completedStepIds, matchesPlayed: session.matchesPlayed };
}
