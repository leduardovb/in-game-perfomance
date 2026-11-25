import { describe, expect, it } from "vitest";
import { TrainingError } from "./errors";
import { getCurrentStreak, getProgress, setMatchesPlayed, startSession, toggleStep } from "./session";
import { getTemplate } from "./templates";

const midTemplate = getTemplate("lol", "mid");

function completed(date: string) {
  const session = startSession(midTemplate, date, 1);
  return { ...session, completedStepIds: session.steps.map((step) => step.id), matchesPlayed: 1 };
}

describe("startSession", () => {
  it("copies the template steps and uses its default match target", () => {
    const session = startSession(midTemplate, "2026-11-25");
    expect(session.steps).toEqual(midTemplate.steps);
    expect(session.steps).not.toBe(midTemplate.steps);
    expect(session.matchesTarget).toBe(midTemplate.defaultMatchesTarget);
    expect(session.role).toBe("mid");
  });

  it("rejects match targets outside the allowed range", () => {
    expect(() => startSession(midTemplate, "2026-11-25", -1)).toThrow(TrainingError);
    expect(() => startSession(midTemplate, "2026-11-25", 11)).toThrow(TrainingError);
    expect(() => startSession(midTemplate, "2026-11-25", 1.5)).toThrow(TrainingError);
  });
});

describe("toggleStep", () => {
  it("checks and unchecks a step", () => {
    const session = startSession(midTemplate, "2026-11-25");
    const stepId = session.steps[0].id;
    const checked = toggleStep(session, stepId);
    expect(checked.completedStepIds).toEqual([stepId]);
    expect(toggleStep(checked, stepId).completedStepIds).toEqual([]);
  });

  it("rejects an unknown step", () => {
    const session = startSession(midTemplate, "2026-11-25");
    expect(() => toggleStep(session, "nope")).toThrow(/Etapa não encontrada/);
  });
});

describe("getProgress", () => {
  it("is complete only when every step and the match target are done", () => {
    const session = startSession(midTemplate, "2026-11-25", 2);
    const allSteps = { ...session, completedStepIds: session.steps.map((step) => step.id) };

    expect(getProgress(allSteps).isComplete).toBe(false);
    expect(getProgress(setMatchesPlayed(allSteps, 2)).isComplete).toBe(true);
    expect(getProgress(setMatchesPlayed(allSteps, 2)).ratio).toBe(1);
  });

  it("does not count matches above the target towards progress", () => {
    const session = setMatchesPlayed(startSession(midTemplate, "2026-11-25", 1), 5);
    expect(getProgress(session).ratio).toBeCloseTo(1 / (session.steps.length + 1));
  });

  it("treats a zero-match target as satisfied", () => {
    const session = startSession(midTemplate, "2026-11-25", 0);
    const allSteps = { ...session, completedStepIds: session.steps.map((step) => step.id) };
    expect(getProgress(allSteps).isComplete).toBe(true);
  });

  it("sums minutes of completed steps", () => {
    const session = toggleStep(startSession(midTemplate, "2026-11-25"), midTemplate.steps[0].id);
    expect(getProgress(session).completedMinutes).toBe(midTemplate.steps[0].durationMinutes);
    expect(getProgress(session).totalMinutes).toBe(60);
  });
});

describe("getCurrentStreak", () => {
  it("counts consecutive completed days ending today", () => {
    const sessions = [completed("2026-11-25"), completed("2026-11-24"), completed("2026-11-23")];
    expect(getCurrentStreak(sessions, "2026-11-25")).toBe(3);
  });

  it("keeps yesterday's streak while today is still in progress", () => {
    const sessions = [startSession(midTemplate, "2026-11-25"), completed("2026-11-24"), completed("2026-11-23")];
    expect(getCurrentStreak(sessions, "2026-11-25")).toBe(2);
  });

  it("breaks on a missed or incomplete day", () => {
    const sessions = [completed("2026-11-25"), startSession(midTemplate, "2026-11-24"), completed("2026-11-23")];
    expect(getCurrentStreak(sessions, "2026-11-25")).toBe(1);
    expect(getCurrentStreak([completed("2026-11-22")], "2026-11-25")).toBe(0);
  });
});
