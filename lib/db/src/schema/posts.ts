import {
  pgTable,
  text,
  serial,
  timestamp,
  real,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { mediaAssetsTable } from "./media-assets";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  coverImageUrl: text("cover_image_url"),
  gallery: jsonb("gallery").$type<{ url: string; caption: string }[]>(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  location: text("location"),
  tripId: integer("trip_id"),
  featuredImageId: integer("featured_image_id").references(() => mediaAssetsTable.id, {
    onDelete: "set null",
  }),
  publishedAt: text("published_at"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
