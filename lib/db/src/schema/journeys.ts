import { integer, pgTable, real, serial, text, timestamp, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const journeysTable = pgTable("journeys", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  startDate: date("start_date", { mode: "string" }),
  endDate: date("end_date", { mode: "string" }),
  originMode: varchar("origin_mode", { length: 20 }).notNull().default("default_nice"),
  originLatitude: real("origin_latitude"),
  originLongitude: real("origin_longitude"),
  destinationMode: varchar("destination_mode", { length: 20 }).notNull().default("default_nice"),
  destinationLatitude: real("destination_latitude"),
  destinationLongitude: real("destination_longitude"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJourneySchema = createInsertSchema(journeysTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertJourney = z.infer<typeof insertJourneySchema>;
export type Journey = typeof journeysTable.$inferSelect;
