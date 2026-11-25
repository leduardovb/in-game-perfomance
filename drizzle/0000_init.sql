CREATE TABLE "training_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game" text NOT NULL,
	"date" date NOT NULL,
	"template_id" text NOT NULL,
	"role" text,
	"steps" jsonb NOT NULL,
	"completed_step_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"matches_target" integer NOT NULL,
	"matches_played" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "training_sessions_game_date_unique" UNIQUE("game","date"),
	CONSTRAINT "training_sessions_game_check" CHECK ("training_sessions"."game" in ('lol', 'cs2')),
	CONSTRAINT "training_sessions_matches_check" CHECK ("training_sessions"."matches_target" between 0 and 10 and "training_sessions"."matches_played" between 0 and 10)
);
--> statement-breakpoint
ALTER TABLE "training_sessions" ENABLE ROW LEVEL SECURITY;