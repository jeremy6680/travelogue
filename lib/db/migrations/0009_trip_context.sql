ALTER TABLE "trips"
  ADD COLUMN IF NOT EXISTS "trip_context" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "trips"
  ALTER COLUMN "trip_context" TYPE jsonb
  USING COALESCE("trip_context", '[]'::json)::jsonb,
  ALTER COLUMN "trip_context" SET DEFAULT '[]'::jsonb,
  ALTER COLUMN "trip_context" SET NOT NULL;
