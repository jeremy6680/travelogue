import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  try {
    const envContent = readFileSync(resolve(__dirname, "../../.env"), "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^([^=#][^=]*)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    }
  } catch {}
}

const { db, pool, countriesTable } = await import("@workspace/db");
const { COUNTRY_CODES } = await import("./countries-data");

await db
  .insert(countriesTable)
  .values(COUNTRY_CODES)
  .onConflictDoNothing({ target: countriesTable.code });

console.log(`Seeded countries reference table with ${COUNTRY_CODES.length} ISO entries.`);

await pool.end();
