"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { requireAuth } from "@/lib/auth/auth";
import { logger } from "@/lib/logger";
import { getLolService } from "./index";
import { RiotApiError } from "./riot/riot-client";
import type { SyncResult } from "./service";

export async function syncLolMatchesAction(): Promise<ActionResult<SyncResult>> {
  await requireAuth();

  const service = getLolService();
  if (!service?.isSyncEnabled) {
    return { ok: false, error: "Configure RIOT_ID e RIOT_API_KEY para sincronizar as partidas." };
  }

  try {
    const result = await service.syncRecentMatches();
    revalidatePath("/desempenho/lol");
    return { ok: true, data: result };
  } catch (error) {
    // Partial progress is already saved, so refresh the page either way.
    revalidatePath("/desempenho/lol");
    if (error instanceof RiotApiError) {
      logger.warn("lol.sync_rejected", { status: error.status, retryAfterSeconds: error.retryAfterSeconds });
      return { ok: false, error: error.message };
    }
    logger.error("lol.sync_failed", { error });
    return { ok: false, error: "Não foi possível sincronizar as partidas. Tente novamente em instantes." };
  }
}
