ALTER TABLE "app_sokoban"."progress" DROP CONSTRAINT "progress_level_id_levels_id_fk";
--> statement-breakpoint
ALTER TABLE "app_sokoban"."levels" ALTER COLUMN "order" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app_sokoban"."progress" ADD CONSTRAINT "progress_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "app_sokoban"."levels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_sokoban"."levels" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "app_sokoban"."collections" ADD CONSTRAINT "collections_order_unique" UNIQUE("order");--> statement-breakpoint
ALTER TABLE "app_sokoban"."levels" ADD CONSTRAINT "levels_collection_order_unique" UNIQUE("collection_id","order");--> statement-breakpoint
ALTER TABLE "app_sokoban"."collections" ADD CONSTRAINT "collections_order_positive" CHECK ("app_sokoban"."collections"."order" > 0);--> statement-breakpoint
ALTER TABLE "app_sokoban"."levels" ADD CONSTRAINT "levels_order_positive" CHECK ("app_sokoban"."levels"."order" > 0);--> statement-breakpoint
ALTER TABLE "app_sokoban"."levels" ADD CONSTRAINT "levels_map_is_array" CHECK (jsonb_typeof("app_sokoban"."levels"."map") = 'array');--> statement-breakpoint
ALTER TABLE "app_sokoban"."progress" ADD CONSTRAINT "progress_moves_positive" CHECK ("app_sokoban"."progress"."moves" > 0);--> statement-breakpoint
ALTER TABLE "app_sokoban"."progress" ADD CONSTRAINT "progress_pushes_within_moves" CHECK ("app_sokoban"."progress"."pushes" >= 0 and "app_sokoban"."progress"."pushes" <= "app_sokoban"."progress"."moves");