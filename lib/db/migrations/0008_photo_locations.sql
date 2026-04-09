ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "latitude" real;
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "longitude" real;
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "location" varchar(255);
