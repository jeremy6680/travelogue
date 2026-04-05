ALTER TABLE "trips"
  ALTER COLUMN "travel_companions" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "trips"
  ALTER COLUMN "travel_companions" TYPE jsonb
  USING CASE
    WHEN "travel_companions" IS NULL OR btrim("travel_companions") = '' THEN '[]'::jsonb
    ELSE to_jsonb(array_remove(regexp_split_to_array(btrim("travel_companions"), '\s*,\s*'), ''))
  END;
--> statement-breakpoint
ALTER TABLE "trips"
  ALTER COLUMN "travel_companions" SET DEFAULT '[]'::jsonb,
  ALTER COLUMN "travel_companions" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "trips"
  ADD COLUMN "reason_for_travel" jsonb DEFAULT '[]'::jsonb NOT NULL;
