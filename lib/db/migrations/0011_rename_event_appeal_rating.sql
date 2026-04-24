ALTER TABLE "concerts" ADD COLUMN IF NOT EXISTS "rating_event_appeal" integer;
ALTER TABLE "sport_events" ADD COLUMN IF NOT EXISTS "rating_event_appeal" integer;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'concerts'
      AND column_name = 'rating_poster'
  ) THEN
    UPDATE "concerts"
    SET "rating_event_appeal" = "rating_poster"
    WHERE "rating_event_appeal" IS NULL;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'sport_events'
      AND column_name = 'rating_poster'
  ) THEN
    UPDATE "sport_events"
    SET "rating_event_appeal" = "rating_poster"
    WHERE "rating_event_appeal" IS NULL;
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "concerts" DROP CONSTRAINT IF EXISTS "concerts_rating_poster_range";
ALTER TABLE "sport_events" DROP CONSTRAINT IF EXISTS "sport_events_rating_poster_range";
ALTER TABLE "concerts" DROP CONSTRAINT IF EXISTS "concerts_rating_event_appeal_range";
ALTER TABLE "sport_events" DROP CONSTRAINT IF EXISTS "sport_events_rating_event_appeal_range";
--> statement-breakpoint
ALTER TABLE "concerts" DROP COLUMN IF EXISTS "rating_poster";
ALTER TABLE "sport_events" DROP COLUMN IF EXISTS "rating_poster";
--> statement-breakpoint
ALTER TABLE "concerts" ADD CONSTRAINT "concerts_rating_event_appeal_range" CHECK ("rating_event_appeal" BETWEEN 0 AND 5);
ALTER TABLE "sport_events" ADD CONSTRAINT "sport_events_rating_event_appeal_range" CHECK ("rating_event_appeal" BETWEEN 0 AND 5);
