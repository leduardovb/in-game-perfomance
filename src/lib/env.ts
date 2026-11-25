import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL deve ser uma URL de conexão Postgres"),
  APP_PASSWORD: z.string().min(12, "APP_PASSWORD deve ter pelo menos 12 caracteres"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET deve ter pelo menos 32 caracteres"),
  APP_TIMEZONE: z.string().default("America/Belem"),
  /** Riot ID tracked by the LoL page, e.g. "Nome#TAG". The page asks for it when missing. */
  RIOT_ID: z
    .string()
    .trim()
    .regex(/^[^#]+#[^#]+$/, "RIOT_ID deve estar no formato Nome#TAG (em arquivos .env, use aspas)")
    .optional(),
  RIOT_PLATFORM: z.string().trim().toLowerCase().default("br1"),
  /** Without a key the LoL page still shows stored matches but can't sync new ones. */
  RIOT_API_KEY: z.string().trim().min(1).optional(),
  /** FACEIT nickname tracked by the CS2 page (case-sensitive). */
  FACEIT_NICKNAME: z.string().trim().min(1).optional(),
  /** Server-side key from developers.faceit.com. Without it the page only shows stored matches. */
  FACEIT_API_KEY: z.string().trim().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/**
 * Validated server environment. Read lazily so `next build` works without secrets,
 * and fails loudly (listing every invalid variable) on first use at runtime.
 */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Variáveis de ambiente inválidas: ${details}`);
  }
  cached = parsed.data;
  return cached;
}
