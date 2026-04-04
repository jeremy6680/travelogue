import { pgTable, text, serial, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { mediaAssetsTable } from "./media-assets";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { countriesTable } from "./countries";
import { tripsTable } from "./trips";

export const photosTable = pgTable("photos", {
  id: serial("id").primaryKey(),
  url: varchar("url", { length: 2048 }).notNull(),
  mediaAssetId: integer("media_asset_id").references(() => mediaAssetsTable.id, {
    onDelete: "set null",
  }),
  caption: text("caption"),
  link: varchar("link", { length: 2048 }),
  tripId: integer("trip_id").references(() => tripsTable.id, { onDelete: "set null", onUpdate: "cascade" }),
  countryCode: varchar("country_code", { length: 2 }).references(() => countriesTable.code, { onDelete: "set null", onUpdate: "cascade" }),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPhotoSchema = createInsertSchema(photosTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photosTable.$inferSelect;
