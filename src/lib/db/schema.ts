import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type { Game, LolRole, TrainingStep } from "@/modules/training/domain/types";

export const trainingSessions = pgTable(
  "training_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    game: text("game").$type<Game>().notNull(),
    date: date("date", { mode: "string" }).notNull(),
    templateId: text("template_id").notNull(),
    role: text("role").$type<LolRole>(),
    steps: jsonb("steps").$type<TrainingStep[]>().notNull(),
    completedStepIds: jsonb("completed_step_ids").$type<string[]>().notNull().default([]),
    matchesTarget: integer("matches_target").notNull(),
    matchesPlayed: integer("matches_played").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("training_sessions_game_date_unique").on(table.game, table.date),
    check("training_sessions_game_check", sql`${table.game} in ('lol', 'cs2')`),
    check(
      "training_sessions_matches_check",
      sql`${table.matchesTarget} between 0 and 10 and ${table.matchesPlayed} between 0 and 10`,
    ),
  ],
  // Supabase exposes the public schema through its REST API; RLS without policies
  // blocks that path. The app connects as the table owner, which bypasses RLS.
).enableRLS();

export const lolMatches = pgTable(
  "lol_matches",
  {
    matchId: text("match_id").notNull(),
    puuid: text("puuid").notNull(),
    playedAt: timestamp("played_at", { withTimezone: true }).notNull(),
    queueId: integer("queue_id").notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    champion: text("champion").notNull(),
    position: text("position").notNull(),
    win: boolean("win").notNull(),
    kills: integer("kills").notNull(),
    deaths: integer("deaths").notNull(),
    assists: integer("assists").notNull(),
    creepScore: integer("creep_score").notNull(),
    damageToChampions: integer("damage_to_champions").notNull(),
    gold: integer("gold").notNull(),
    visionScore: integer("vision_score").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.puuid, table.matchId] }),
    index("lol_matches_puuid_played_at_idx").on(table.puuid, table.playedAt),
  ],
).enableRLS();

/** Riot ID → PUUID, so pages can read stored matches without calling Riot. */
export const lolAccounts = pgTable("lol_accounts", {
  riotId: text("riot_id").primaryKey(),
  puuid: text("puuid").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
