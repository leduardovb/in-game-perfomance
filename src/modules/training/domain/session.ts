import { addDays, type IsoDate } from "@/lib/date";
import { TrainingError } from "./errors";
import {
  MAX_MATCHES_TARGET,
  MIN_MATCHES_TARGET,
  type TrainingSession,
  type TrainingTemplate,
} from "./types";

export type NewTrainingSession = Omit<TrainingSession, "id" | "createdAt" | "updatedAt">;

function assertMatchesInRange(value: number, label: string): void {
  if (!Number.isInteger(value) || value < MIN_MATCHES_TARGET || value > MAX_MATCHES_TARGET) {
    throw new TrainingError(
      `${label} deve ser um número inteiro entre ${MIN_MATCHES_TARGET} e ${MAX_MATCHES_TARGET}.`,
      "INVALID_MATCHES",
    );
  }
}

export function startSession(
  template: TrainingTemplate,
  date: IsoDate,
  matchesTarget: number = template.defaultMatchesTarget,
): NewTrainingSession {
  assertMatchesInRange(matchesTarget, "A meta de partidas");
  return {
    game: template.game,
    date,
    templateId: template.id,
    role: template.role,
    steps: template.steps.map((step) => ({ ...step })),
    completedStepIds: [],
    matchesTarget,
    matchesPlayed: 0,
  };
}

export function toggleStep<T extends Pick<TrainingSession, "steps" | "completedStepIds">>(
  session: T,
  stepId: string,
): T {
  if (!session.steps.some((step) => step.id === stepId)) {
    throw new TrainingError("Etapa não encontrada neste treino.", "STEP_NOT_FOUND");
  }
  const completed = session.completedStepIds.includes(stepId)
    ? session.completedStepIds.filter((id) => id !== stepId)
    : [...session.completedStepIds, stepId];
  return { ...session, completedStepIds: completed };
}

export function setMatchesPlayed<T extends Pick<TrainingSession, "matchesPlayed">>(
  session: T,
  matchesPlayed: number,
): T {
  assertMatchesInRange(matchesPlayed, "O número de partidas");
  return { ...session, matchesPlayed };
}

export type SessionProgress = {
  completedSteps: number;
  totalSteps: number;
  completedMinutes: number;
  totalMinutes: number;
  matchesPlayed: number;
  matchesTarget: number;
  /** 0 to 1, weighing each step and each target match equally. */
  ratio: number;
  isComplete: boolean;
};

export function getProgress(
  session: Pick<TrainingSession, "steps" | "completedStepIds" | "matchesPlayed" | "matchesTarget">,
): SessionProgress {
  const done = new Set(session.completedStepIds);
  const completedSteps = session.steps.filter((step) => done.has(step.id));
  const countedMatches = Math.min(session.matchesPlayed, session.matchesTarget);
  const units = session.steps.length + session.matchesTarget;

  return {
    completedSteps: completedSteps.length,
    totalSteps: session.steps.length,
    completedMinutes: completedSteps.reduce((sum, step) => sum + step.durationMinutes, 0),
    totalMinutes: session.steps.reduce((sum, step) => sum + step.durationMinutes, 0),
    matchesPlayed: session.matchesPlayed,
    matchesTarget: session.matchesTarget,
    ratio: units === 0 ? 1 : (completedSteps.length + countedMatches) / units,
    isComplete: completedSteps.length === session.steps.length && countedMatches === session.matchesTarget,
  };
}

/**
 * Consecutive completed days ending today. If today isn't complete yet, the streak
 * still counts up to yesterday, so it doesn't look broken in the morning.
 */
export function getCurrentStreak(
  sessions: ReadonlyArray<Parameters<typeof getProgress>[0] & Pick<TrainingSession, "date">>,
  today: IsoDate,
): number {
  const completedDates = new Set(
    sessions.filter((session) => getProgress(session).isComplete).map((session) => session.date),
  );

  let day = completedDates.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (completedDates.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}
