CREATE TABLE "lol_accounts" (
	"riot_id" text PRIMARY KEY NOT NULL,
	"puuid" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lol_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "lol_matches" (
	"match_id" text NOT NULL,
	"puuid" text NOT NULL,
	"played_at" timestamp with time zone NOT NULL,
	"queue_id" integer NOT NULL,
	"duration_seconds" integer NOT NULL,
	"champion" text NOT NULL,
	"position" text NOT NULL,
	"win" boolean NOT NULL,
	"kills" integer NOT NULL,
	"deaths" integer NOT NULL,
	"assists" integer NOT NULL,
	"creep_score" integer NOT NULL,
	"damage_to_champions" integer NOT NULL,
	"gold" integer NOT NULL,
	"vision_score" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lol_matches_puuid_match_id_pk" PRIMARY KEY("puuid","match_id")
);
--> statement-breakpoint
ALTER TABLE "lol_matches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "lol_matches_puuid_played_at_idx" ON "lol_matches" USING btree ("puuid","played_at");