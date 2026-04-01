import { defineConfig } from "drizzle-kit";
import path from "path";
import { readFileSync } from "fs";

if (!process.env.DATABASE_URL) {
  try {
    const envContent = readFileSync(path.resolve(__dirname, "../../.env"), "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^([^=#][^=]*)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    }
  } catch {}
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  out: path.join(__dirname, "./migrations"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
