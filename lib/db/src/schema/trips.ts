import { pgTable, varchar, serial, timestamp, real, date, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { countriesTable } from "./countries";
import { journeysTable } from "./journeys";

export const tripsTable = pgTable("trips", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  countryCode: varchar("country_code", { length: 2 })
    .notNull()
    .references(() => countriesTable.code, { onUpdate: "cascade" }),
  visitedCities: varchar("visited_cities", { length: 500 }).notNull(),
  reasonForVisit: varchar("reason_for_visit", { length: 255 }).notNull(),
  travelCompanions: varchar("travel_companions", { length: 255 }).notNull(),
  friendsFamilyMet: varchar("friends_family_met", { length: 255 }).notNull(),
  visitedAt: date("visited_at", { mode: "string" }).notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  journeyId: integer("journey_id").references(() => journeysTable.id, { onDelete: "set null", onUpdate: "cascade" }),
  journeyOrder: integer("journey_order"),
  transportationTo: text("transportation_to"),
  transportationOnSite: text("transportation_on_site"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTripSchema = createInsertSchema(tripsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof tripsTable.$inferSelect;
