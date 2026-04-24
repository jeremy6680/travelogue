ALTER TABLE "concerts" ADD COLUMN IF NOT EXISTS "rating_event_appeal" integer;
ALTER TABLE "concerts" ADD COLUMN IF NOT EXISTS "rating_performance" integer;
ALTER TABLE "concerts" ADD COLUMN IF NOT EXISTS "rating_atmosphere" integer;
ALTER TABLE "concerts" ADD COLUMN IF NOT EXISTS "rating_venue" integer;
ALTER TABLE "concerts" ADD COLUMN IF NOT EXISTS "rating_stakes" integer;
--> statement-breakpoint
ALTER TABLE "sport_events" ADD COLUMN IF NOT EXISTS "rating_event_appeal" integer;
ALTER TABLE "sport_events" ADD COLUMN IF NOT EXISTS "rating_performance" integer;
ALTER TABLE "sport_events" ADD COLUMN IF NOT EXISTS "rating_atmosphere" integer;
ALTER TABLE "sport_events" ADD COLUMN IF NOT EXISTS "rating_venue" integer;
ALTER TABLE "sport_events" ADD COLUMN IF NOT EXISTS "rating_stakes" integer;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'concerts_rating_event_appeal_range'
  ) THEN
    ALTER TABLE "concerts" ADD CONSTRAINT "concerts_rating_event_appeal_range" CHECK ("rating_event_appeal" BETWEEN 0 AND 5);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'concerts_rating_performance_range'
  ) THEN
    ALTER TABLE "concerts" ADD CONSTRAINT "concerts_rating_performance_range" CHECK ("rating_performance" BETWEEN 0 AND 5);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'concerts_rating_atmosphere_range'
  ) THEN
    ALTER TABLE "concerts" ADD CONSTRAINT "concerts_rating_atmosphere_range" CHECK ("rating_atmosphere" BETWEEN 0 AND 5);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'concerts_rating_venue_range'
  ) THEN
    ALTER TABLE "concerts" ADD CONSTRAINT "concerts_rating_venue_range" CHECK ("rating_venue" BETWEEN 0 AND 5);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'concerts_rating_stakes_range'
  ) THEN
    ALTER TABLE "concerts" ADD CONSTRAINT "concerts_rating_stakes_range" CHECK ("rating_stakes" BETWEEN 0 AND 5);
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sport_events_rating_event_appeal_range'
  ) THEN
    ALTER TABLE "sport_events" ADD CONSTRAINT "sport_events_rating_event_appeal_range" CHECK ("rating_event_appeal" BETWEEN 0 AND 5);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sport_events_rating_performance_range'
  ) THEN
    ALTER TABLE "sport_events" ADD CONSTRAINT "sport_events_rating_performance_range" CHECK ("rating_performance" BETWEEN 0 AND 5);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sport_events_rating_atmosphere_range'
  ) THEN
    ALTER TABLE "sport_events" ADD CONSTRAINT "sport_events_rating_atmosphere_range" CHECK ("rating_atmosphere" BETWEEN 0 AND 5);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sport_events_rating_venue_range'
  ) THEN
    ALTER TABLE "sport_events" ADD CONSTRAINT "sport_events_rating_venue_range" CHECK ("rating_venue" BETWEEN 0 AND 5);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sport_events_rating_stakes_range'
  ) THEN
    ALTER TABLE "sport_events" ADD CONSTRAINT "sport_events_rating_stakes_range" CHECK ("rating_stakes" BETWEEN 0 AND 5);
  END IF;
END $$;
