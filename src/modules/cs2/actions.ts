"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { requireAuth } from "@/lib/auth/auth";
import { logger } from "@/lib/logger";
import { getCs2Service } from "./index";
import { FaceitApiError } from "./faceit/faceit-client";
import type { SyncResult } from "./service";

export async function syncFaceitMatchesAction(): Promise<ActionResult<SyncResult>> {
  await requireAuth();

  const service = getCs2Service();
  if (!service?.isSyncEnabled) {
    return { ok: false, error: "Configure FACEIT_NICKNAME e FACEIT_API_KEY para sincronizar as partidas." };
  }

  try {
    const result = await service.syncFaceitMatches();
    revalidatePath("/desempenho/cs2");
    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof FaceitApiError) {
      logger.warn("cs2.faceit_sync_rejected", { status: error.status });
      return { ok: false, error: error.message };
    }
    logger.error("cs2.faceit_sync_failed", { error });
    return { ok: false, error: "Não foi possível sincronizar as partidas. Tente novamente em instantes." };
  }
}
