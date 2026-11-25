CREATE TABLE "cs2_accounts" (
	"source" text NOT NULL,
	"handle" text NOT NULL,
	"player_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cs2_accounts_source_handle_pk" PRIMARY KEY("source","handle")
);
--> statement-breakpoint
ALTER TABLE "cs2_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "cs2_matches" (
	"source" text NOT NULL,
	"match_id" text NOT NULL,
	"player_id" text NOT NULL,
	"played_at" timestamp with time zone NOT NULL,
	"map" text NOT NULL,
	"win" boolean NOT NULL,
	"score" text,
	"kills" integer NOT NULL,
	"deaths" integer NOT NULL,
	"assists" integer NOT NULL,
	"adr" real NOT NULL,
	"headshot_rate" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cs2_matches_source_player_id_match_id_pk" PRIMARY KEY("source","player_id","match_id")
);
--> statement-breakpoint
ALTER TABLE "cs2_matches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "cs2_matches_player_played_at_idx" ON "cs2_matches" USING btree ("source","player_id","played_at");