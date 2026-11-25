import { z } from "zod";

/** Platform (e.g. br1) → regional routing value used by account-v1 and match-v5. */
const REGIONAL_ROUTES: Record<string, string> = {
  br1: "americas",
  na1: "americas",
  la1: "americas",
  la2: "americas",
  euw1: "europe",
  eun1: "europe",
  tr1: "europe",
  ru: "europe",
  kr: "asia",
  jp1: "asia",
};

export const SUPPORTED_PLATFORMS = Object.keys(REGIONAL_ROUTES);

export class RiotApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterSeconds: number | null = null,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "RiotApiError";
  }
}

const accountSchema = z.object({ puuid: z.string().min(1) });
const matchIdsSchema = z.array(z.string().min(1));

const participantSchema = z.object({
  puuid: z.string(),
  championName: z.string(),
  teamPosition: z.string().default(""),
  win: z.boolean(),
  kills: z.number().int().nonnegative(),
  deaths: z.number().int().nonnegative(),
  assists: z.number().int().nonnegative(),
  totalMinionsKilled: z.number().int().nonnegative(),
  neutralMinionsKilled: z.number().int().nonnegative(),
  totalDamageDealtToChampions: z.number().nonnegative(),
  goldEarned: z.number().nonnegative(),
  visionScore: z.number().nonnegative(),
});

const matchSchema = z.object({
  metadata: z.object({ matchId: z.string() }),
  info: z.object({
    gameCreation: z.number(),
    gameEndTimestamp: z.number().optional(),
    gameDuration: z.number().nonnegative(),
    queueId: z.number().int(),
    participants: z.array(participantSchema),
  }),
});

export type RiotMatch = z.infer<typeof matchSchema>;

export type RiotClientOptions = {
  apiKey: string;
  platform: string;
  fetch?: typeof fetch;
};

/** Thin, validated wrapper around the Riot endpoints the app uses. */
export class RiotClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: RiotClientOptions) {
    const route = REGIONAL_ROUTES[options.platform.toLowerCase()];
    if (!route) {
      throw new Error(`Servidor da Riot não suportado: ${options.platform}. Use um de: ${SUPPORTED_PLATFORMS.join(", ")}.`);
    }
    this.baseUrl = `https://${route}.api.riotgames.com`;
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetch ?? fetch;
  }

  async getPuuid(gameName: string, tagLine: string): Promise<string> {
    const path = `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    return (await this.get(path, accountSchema)).puuid;
  }

  /** Most recent first. */
  getMatchIds(puuid: string, count: number): Promise<string[]> {
    const params = new URLSearchParams({ start: "0", count: String(count) });
    return this.get(`/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?${params}`, matchIdsSchema);
  }

  getMatch(matchId: string): Promise<RiotMatch> {
    return this.get(`/lol/match/v5/matches/${encodeURIComponent(matchId)}`, matchSchema);
  }

  private async get<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        headers: { "X-Riot-Token": this.apiKey },
        cache: "no-store",
      });
    } catch (error) {
      throw new RiotApiError("Não foi possível conectar à API da Riot.", 0, null, { cause: error });
    }

    if (!response.ok) throw toRiotError(response);

    const parsed = schema.safeParse(await response.json());
    if (!parsed.success) {
      throw new RiotApiError("A API da Riot respondeu em um formato inesperado.", response.status);
    }
    return parsed.data;
  }
}

function toRiotError(response: Response): RiotApiError {
  switch (response.status) {
    case 401:
    case 403:
      return new RiotApiError(
        "A chave da Riot é inválida ou expirou. Chaves de desenvolvimento valem 24h: gere outra e atualize RIOT_API_KEY.",
        response.status,
      );
    case 404:
      return new RiotApiError("Conta ou partida não encontrada na Riot. Confira RIOT_ID e RIOT_PLATFORM.", 404);
    case 429: {
      const retryAfter = Number(response.headers.get("Retry-After"));
      const seconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null;
      return new RiotApiError(
        `Limite de requisições da Riot atingido. Tente de novo${seconds ? ` em ${seconds}s` : " em instantes"}.`,
        429,
        seconds,
      );
    }
    default:
      return new RiotApiError(`A API da Riot falhou (HTTP ${response.status}). Tente mais tarde.`, response.status);
  }
}
