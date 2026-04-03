import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { mediaAssetsTable } from "./media-assets";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const photosTable = pgTable("photos", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  mediaAssetId: integer("media_asset_id").references(() => mediaAssetsTable.id, {
    onDelete: "set null",
  }),
  caption: text("caption"),
  link: text("link"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPhotoSchema = createInsertSchema(photosTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photosTable.$inferSelect;
