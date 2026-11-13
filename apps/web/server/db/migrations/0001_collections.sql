CREATE TABLE "collections" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"credit" text,
	"order" integer NOT NULL
);
--> statement-breakpoint
-- Levels used to be synced from content/levels at boot; from here on Postgres
-- is their source. The four levels that were there become Basics, keeping
-- their ids so players' results stay.
INSERT INTO "collections" ("id", "title", "author", "credit", "order") VALUES
	('basics', 'Basics', NULL, 'Made for Sokobanko. Hello World! is from DoctorLai/sokoban-web (https://github.com/DoctorLai/sokoban-web), MIT licensed.', 1);
--> statement-breakpoint
ALTER TABLE "levels" ADD COLUMN "collection_id" text DEFAULT 'basics' NOT NULL;--> statement-breakpoint
ALTER TABLE "levels" ALTER COLUMN "collection_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "levels" ADD CONSTRAINT "levels_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
INSERT INTO "levels" ("id", "collection_id", "title", "order", "map") VALUES
	('first-push', 'basics', 'First Push', 1, '["#########","#@  $  .#","#########"]'),
	('big-room', 'basics', 'Big Room', 2, '["##############################","#@                           #","#  $                         #","#                            #","#                            #","#                            #","#                            #","#                            #","#                            #","#                            #","#                            #","#                            #","#                            #","#                            #","#                            #","#                            #","#                            #","#                            #","#                           .#","##############################"]'),
	('two-boxes', 'basics', 'Two Boxes', 3, '[" #####","##   #","#@$$ #","#  ..#","######"]'),
	('hello-world', 'basics', 'Hello World!', 4, '["##########","####....##","#  $$$$###","#  @   ###","##########"]')
ON CONFLICT ("id") DO UPDATE SET
	"collection_id" = excluded."collection_id",
	"title" = excluded."title",
	"order" = excluded."order",
	"map" = excluded."map",
	"updated_at" = now();
