import "server-only";
import { getDb } from "@/lib/db/client";
import { getEnv } from "@/lib/env";
import { DrizzleTrainingSessionRepository } from "./infra/drizzle-repository";
import { TrainingService } from "./service";

/** Composition root: wires the service to its production dependencies. */
export function getTrainingService(): TrainingService {
  return new TrainingService({
    repository: new DrizzleTrainingSessionRepository(getDb()),
    timeZone: getEnv().APP_TIMEZONE,
  });
}
