CREATE TABLE "app_sokobanko"."daily_results" (
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"level_id" text NOT NULL,
	"moves" integer NOT NULL,
	"pushes" integer NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "daily_results_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
ALTER TABLE "app_sokobanko"."daily_results" ADD CONSTRAINT "daily_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_sokobanko"."daily_results" ADD CONSTRAINT "daily_results_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "app_sokobanko"."levels"("id") ON DELETE cascade ON UPDATE no action;