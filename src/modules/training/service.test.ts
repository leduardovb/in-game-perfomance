import { beforeEach, describe, expect, it, vi } from "vitest";
import { InMemoryTrainingSessionRepository } from "./infra/in-memory-repository";
import { TrainingService } from "./service";

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

describe("TrainingService", () => {
  let now: Date;
  let service: TrainingService;

  beforeEach(() => {
    now = new Date("2026-11-25T15:00:00Z");
    service = new TrainingService({
      repository: new InMemoryTrainingSessionRepository(),
      timeZone: "America/Belem",
      now: () => now,
    });
  });

  it("starts today's session from the role's template", async () => {
    const session = await service.startToday("lol", "jungle", 2);
    expect(session.date).toBe("2026-11-25");
    expect(session.templateId).toBe("lol-jungle-v1");
    expect(await service.getTodaySession("lol")).toEqual(session);
    expect(await service.getTodaySession("cs2")).toBeNull();
  });

  it("ignores a role for CS2", async () => {
    const session = await service.startToday("cs2", "mid", 2);
    expect(session.role).toBeNull();
    expect(session.templateId).toBe("cs2-general-v1");
  });

  it("refuses a second session for the same game and day", async () => {
    await service.startToday("lol", "mid", 3);
    await expect(service.startToday("lol", "top", 3)).rejects.toMatchObject({ code: "SESSION_ALREADY_EXISTS" });
  });

  it("toggles steps and records matches", async () => {
    const session = await service.startToday("cs2", null, 1);
    for (const step of session.steps) await service.toggleStep(session.id, step.id);
    const updated = await service.setMatchesPlayed(session.id, 1);

    const history = await service.getHistory("cs2");
    expect(updated.completedStepIds).toHaveLength(session.steps.length);
    expect(history.streak).toBe(1);
  });

  it("fails clearly for an unknown session", async () => {
    await expect(service.toggleStep("missing", "x")).rejects.toMatchObject({ code: "SESSION_NOT_FOUND" });
  });

  it("starts a new day at local midnight", async () => {
    await service.startToday("lol", "mid", 0);
    now = new Date("2026-11-26T02:59:00Z"); // 23:59 in Belém
    expect(service.today()).toBe("2026-11-25");
    now = new Date("2026-11-26T03:00:00Z"); // 00:00 in Belém
    expect(await service.getTodaySession("lol")).toBeNull();
  });
});
