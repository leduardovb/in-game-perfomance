import { z } from "zod";

const BASE_URL = "https://api-public.cs-prod.leetify.com";

/**
 * Leetify's terms allow caching for at most 8 hours and forbid storing match history,
 * so responses only live in Next's fetch cache, for 1 hour.
 */
export const LEETIFY_CACHE_SECONDS = 60 * 60;

export class LeetifyApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "LeetifyApiError";
  }
}

const count = z.number().nonnegative();

const playerStatsSchema = z.object({
  steam64_id: z.string(),
  total_kills: count,
  total_deaths: count,
  total_assists: count.optional(),
  total_damage: count.optional(),
  dpr: count.optional(),
  total_hs_kills: count.optional(),
  rounds_count: count.optional(),
  rounds_won: count,
  rounds_lost: count,
});

/** Only the fields the app reads; everything else in the payload is ignored. */
const matchSchema = z.object({
  id: z.string().min(1),
  finished_at: z.string().min(1),
  data_source: z.string(),
  map_name: z.string(),
  stats: z.array(z.unknown()),
});

export type LeetifyMatch = z.infer<typeof matchSchema>;
export type LeetifyPlayerStats = z.infer<typeof playerStatsSchema>;
export { playerStatsSchema };

export type LeetifyClientOptions = { apiKey?: string; fetch?: typeof fetch };

export class LeetifyClient {
  private readonly apiKey: string | undefined;
  private readonly fetchImpl: typeof fetch;

  constructor(options: LeetifyClientOptions = {}) {
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetch ?? fetch;
  }

  /** The player's recent matches as Leetify lists them. Malformed items are dropped by the caller. */
  async getRecentMatches(steam64Id: string): Promise<unknown[]> {
    const params = new URLSearchParams({ steam64_id: steam64Id });
    let response: Response;
    try {
      response = await this.fetchImpl(`${BASE_URL}/v3/profile/matches?${params}`, {
        headers: { Accept: "application/json", ...(this.apiKey ? { _leetify_key: this.apiKey } : {}) },
        next: { revalidate: LEETIFY_CACHE_SECONDS },
      });
    } catch (error) {
      throw new LeetifyApiError("Não foi possível conectar ao Leetify.", 0, { cause: error });
    }

    if (!response.ok) throw toLeetifyError(response.status);

    const parsed = z.array(z.unknown()).safeParse(await response.json());
    if (!parsed.success) throw new LeetifyApiError("O Leetify respondeu em um formato inesperado.", response.status);
    return parsed.data;
  }
}

export function parseLeetifyMatch(value: unknown): LeetifyMatch | null {
  const parsed = matchSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function toLeetifyError(status: number): LeetifyApiError {
  switch (status) {
    case 401:
      return new LeetifyApiError("A chave do Leetify é inválida. Confira LEETIFY_API_KEY ou remova-a.", status);
    case 404:
      return new LeetifyApiError(
        "Perfil não encontrado no Leetify. Confira LEETIFY_STEAM64_ID e se o perfil está público lá.",
        status,
      );
    case 429:
      return new LeetifyApiError("Limite de requisições do Leetify atingido. Tente de novo em instantes.", status);
    default:
      return new LeetifyApiError(`O Leetify falhou (HTTP ${status}). Tente mais tarde.`, status);
  }
}
