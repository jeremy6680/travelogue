ALTER TABLE "posts"
  ALTER COLUMN "content" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "posts"
  ADD COLUMN "external_url" varchar(2048);
