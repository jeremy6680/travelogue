import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mediaAssetsTable = pgTable("media_assets", {
  id: serial("id").primaryKey(),
  title: text("title"),
  publicId: text("public_id").notNull().unique(),
  deliveryUrl: text("delivery_url"),
  width: integer("width"),
  height: integer("height"),
  format: text("format"),
  resourceType: text("resource_type"),
  bytes: integer("bytes"),
  alt: text("alt"),
  caption: text("caption"),
  folder: text("folder"),
  placeholderUrl: text("placeholder_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMediaAssetSchema = createInsertSchema(mediaAssetsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMediaAsset = z.infer<typeof insertMediaAssetSchema>;
export type MediaAsset = typeof mediaAssetsTable.$inferSelect;
