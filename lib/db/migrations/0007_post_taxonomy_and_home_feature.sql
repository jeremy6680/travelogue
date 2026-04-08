ALTER TABLE "posts"
  ADD COLUMN IF NOT EXISTS "category" varchar(80),
  ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "featured_on_home" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "featured_home_order" integer;
