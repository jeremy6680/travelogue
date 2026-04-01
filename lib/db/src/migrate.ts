import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Runs all pending migrations from the migrations/ folder.
 * Safe to call on every server start — already-applied migrations are skipped.
 */
export async function runMigrations(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  // Always called from the bundled server (dist/index.mjs).
  // build.mjs copies lib/db/migrations/ → dist/migrations/ at build time.
  const migrationsFolder = path.resolve(__dirname, "migrations");

  await migrate(db, { migrationsFolder });

  await pool.end();
}
