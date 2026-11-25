import { z } from "zod";

const BASE_URL = "https://open.faceit.com/data/v4";
const GAME = "cs2";

export class FaceitApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "FaceitApiError";
  }
}

const playerSchema = z.object({ player_id: z.string().min(1) });

/** FACEIT returns every stat as a string keyed by a display name. */
const matchStatsSchema = z.object({
  items: z.array(z.object({ stats: z.record(z.string(), z.unknown()) })),
});

export type FaceitStatsRecord = Record<string, unknown>;

export type FaceitClientOptions = { apiKey: string; fetch?: typeof fetch };

export class FaceitClient {
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: FaceitClientOptions) {
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetch ?? fetch;
  }

  async getPlayerId(nickname: string): Promise<string> {
    const params = new URLSearchParams({ nickname, game: GAME });
    return (await this.get(`/players?${params}`, playerSchema)).player_id;
  }

  /** Per-match stats for the player's latest matches, most recent first. */
  async getRecentMatchStats(playerId: string, limit: number): Promise<FaceitStatsRecord[]> {
    const params = new URLSearchParams({ offset: "0", limit: String(limit) });
    const body = await this.get(`/players/${encodeURIComponent(playerId)}/games/${GAME}/stats?${params}`, matchStatsSchema);
    return body.items.map((item) => item.stats);
  }

  private async get<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${BASE_URL}${path}`, {
        headers: { Authorization: `Bearer ${this.apiKey}`, Accept: "application/json" },
        cache: "no-store",
      });
    } catch (error) {
      throw new FaceitApiError("Não foi possível conectar à API da FACEIT.", 0, { cause: error });
    }

    if (!response.ok) throw toFaceitError(response.status);

    const parsed = schema.safeParse(await response.json());
    if (!parsed.success) {
      throw new FaceitApiError("A API da FACEIT respondeu em um formato inesperado.", response.status);
    }
    return parsed.data;
  }
}

function toFaceitError(status: number): FaceitApiError {
  switch (status) {
    case 401:
    case 403:
      return new FaceitApiError("A chave da FACEIT é inválida. Confira FACEIT_API_KEY (use uma chave do tipo Server side).", status);
    case 404:
      return new FaceitApiError("Jogador não encontrado na FACEIT. Confira FACEIT_NICKNAME.", status);
    case 429:
      return new FaceitApiError("Limite de requisições da FACEIT atingido. Tente de novo em instantes.", status);
    default:
      return new FaceitApiError(`A API da FACEIT falhou (HTTP ${status}). Tente mais tarde.`, status);
  }
}
