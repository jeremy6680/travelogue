import {
  pgTable,
  text,
  serial,
  timestamp,
  real,
  integer,
  jsonb,
  varchar,
  date,
  boolean,
} from "drizzle-orm/pg-core";
import { mediaAssetsTable } from "./media-assets";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { countriesTable } from "./countries";
import { tripsTable } from "./trips";

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  content: text("content"),
  excerpt: text("excerpt").notNull(),
  externalUrl: varchar("external_url", { length: 2048 }),
  category: varchar("category", { length: 80 }),
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  featuredOnHome: boolean("featured_on_home").default(false).notNull(),
  featuredHomeOrder: integer("featured_home_order"),
  coverImageUrl: varchar("cover_image_url", { length: 2048 }),
  gallery: jsonb("gallery").$type<{
    assetId?: number | null;
    publicId?: string | null;
    url: string | null;
    alt?: string | null;
    caption: string;
    width?: number | null;
    height?: number | null;
  }[]>(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  location: varchar("location", { length: 255 }),
  tripId: integer("trip_id").references(() => tripsTable.id, { onDelete: "set null", onUpdate: "cascade" }),
  featuredImageId: integer("featured_image_id").references(() => mediaAssetsTable.id, {
    onDelete: "set null",
  }),
  countryCode: varchar("country_code", { length: 2 }).references(() => countriesTable.code, { onDelete: "set null", onUpdate: "cascade" }),
  publishedAt: date("published_at", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
