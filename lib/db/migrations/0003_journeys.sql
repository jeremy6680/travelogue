CREATE TABLE IF NOT EXISTS "journeys" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"start_date" date,
	"end_date" date,
	"origin_mode" varchar(20) DEFAULT 'default_nice' NOT NULL,
	"origin_latitude" real,
	"origin_longitude" real,
	"destination_mode" varchar(20) DEFAULT 'default_nice' NOT NULL,
	"destination_latitude" real,
	"destination_longitude" real,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "journeys_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "journey_id" integer;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "journey_order" integer;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "trips" ADD CONSTRAINT "trips_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
