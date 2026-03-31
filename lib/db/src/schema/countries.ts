import { pgTable, text, serial, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const countriesTable = pgTable("countries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  countryCode: text("country_code").notNull(),
  visitedCities: text("visited_cities").notNull(),
  reasonForVisit: text("reason_for_visit").notNull(),
  travelCompanions: text("travel_companions").notNull(),
  friendsFamilyMet: text("friends_family_met").notNull(),
  visitedAt: text("visited_at").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  transportationTo: text("transportation_to"),
  transportationOnSite: text("transportation_on_site"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCountrySchema = createInsertSchema(countriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type Country = typeof countriesTable.$inferSelect;
