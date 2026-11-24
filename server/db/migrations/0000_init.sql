CREATE TABLE "app_sokoban"."collections" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"credit" text,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_sokoban"."levels" (
	"id" text PRIMARY KEY NOT NULL,
	"collection_id" text NOT NULL,
	"title" text NOT NULL,
	"order" integer,
	"map" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_sokoban"."progress" (
	"user_id" uuid NOT NULL,
	"level_id" text NOT NULL,
	"moves" integer NOT NULL,
	"pushes" integer NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "progress_user_id_level_id_pk" PRIMARY KEY("user_id","level_id")
);
--> statement-breakpoint
ALTER TABLE "app_sokoban"."levels" ADD CONSTRAINT "levels_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "app_sokoban"."collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_sokoban"."progress" ADD CONSTRAINT "progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_sokoban"."progress" ADD CONSTRAINT "progress_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "app_sokoban"."levels"("id") ON DELETE cascade ON UPDATE no action;