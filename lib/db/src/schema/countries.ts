import { pgTable, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const countriesTable = pgTable("countries", {
  code: varchar("code", { length: 2 }).primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
});

export const insertCountrySchema = createInsertSchema(countriesTable);
export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type Country = typeof countriesTable.$inferSelect;
