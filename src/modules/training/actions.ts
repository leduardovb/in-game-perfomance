"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { requireAuth } from "@/lib/auth/auth";
import { logger } from "@/lib/logger";
import { getTrainingService } from "./index";
import { TrainingError } from "./domain/errors";
import { MAX_MATCHES_TARGET, MIN_MATCHES_TARGET } from "./domain/types";
import { GAMES, LOL_ROLES } from "@/lib/games";

const matchesSchema = z.coerce.number().int().min(MIN_MATCHES_TARGET).max(MAX_MATCHES_TARGET);

const startSchema = z.object({
  game: z.enum(GAMES),
  role: z.enum(LOL_ROLES).nullable(),
  matchesTarget: matchesSchema,
});

const toggleSchema = z.object({ sessionId: z.uuid(), stepId: z.string().min(1).max(64) });
const matchesPlayedSchema = z.object({ sessionId: z.uuid(), matchesPlayed: matchesSchema });

const GENERIC_ERROR = "Algo deu errado. Tente novamente em instantes.";

function toFailure(action: string, error: unknown): { ok: false; error: string } {
  if (error instanceof TrainingError) {
    logger.warn("training.action_rejected", { action, code: error.code });
    return { ok: false, error: error.message };
  }
  logger.error("training.action_failed", { action, error });
  return { ok: false, error: GENERIC_ERROR };
}

export type StartTrainingState = { error: string | null };

/** Form action used by the "start today's training" form. */
export async function startTrainingAction(
  _previous: StartTrainingState,
  formData: FormData,
): Promise<StartTrainingState> {
  await requireAuth();

  const parsed = startSchema.safeParse({
    game: formData.get("game"),
    role: formData.get("role") || null,
    matchesTarget: formData.get("matchesTarget"),
  });
  if (!parsed.success) {
    return { error: `Dados inválidos. A meta de partidas deve ficar entre ${MIN_MATCHES_TARGET} e ${MAX_MATCHES_TARGET}.` };
  }

  const { game, role, matchesTarget } = parsed.data;
  try {
    await getTrainingService().startToday(game, role, matchesTarget);
  } catch (error) {
    // Already started (e.g. on another device): just show it.
    if (!(error instanceof TrainingError && error.code === "SESSION_ALREADY_EXISTS")) {
      return { error: toFailure("start", error).error };
    }
  }
  revalidatePath("/", "layout");
  redirect(`/treino/${game}`);
}

export async function toggleStepAction(input: z.input<typeof toggleSchema>): Promise<ActionResult> {
  await requireAuth();
  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Etapa inválida." };

  try {
    await getTrainingService().toggleStep(parsed.data.sessionId, parsed.data.stepId);
    revalidatePath("/", "layout");
    return { ok: true, data: undefined };
  } catch (error) {
    return toFailure("toggle_step", error);
  }
}

export async function setMatchesPlayedAction(
  input: z.input<typeof matchesPlayedSchema>,
): Promise<ActionResult> {
  await requireAuth();
  const parsed = matchesPlayedSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: `O número de partidas deve ficar entre ${MIN_MATCHES_TARGET} e ${MAX_MATCHES_TARGET}.` };
  }

  try {
    await getTrainingService().setMatchesPlayed(parsed.data.sessionId, parsed.data.matchesPlayed);
    revalidatePath("/", "layout");
    return { ok: true, data: undefined };
  } catch (error) {
    return toFailure("set_matches_played", error);
  }
}
