import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import pg from "pg";

const { Client } = pg;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function hasDirectusTables() {
  const client = new Client({
    host: requireEnv("DB_HOST"),
    port: Number(process.env.DB_PORT || 5432),
    database: requireEnv("DB_DATABASE"),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();

  try {
    const result = await client.query(
      "select to_regclass('public.directus_collections') as table_name",
    );

    return Boolean(result.rows[0]?.table_name);
  } finally {
    await client.end();
  }
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
    });

    child.on("error", reject);
  });
}

async function main() {
  const directusTablesExist = await hasDirectusTables();

  if (!directusTablesExist) {
    console.log("[startup] Directus tables not found, bootstrapping database");
    await run("npx", ["directus", "bootstrap"]);

    if (existsSync("./schema.yaml")) {
      console.log("[startup] Applying schema snapshot");
      await run("npx", ["directus", "schema", "apply", "schema.yaml", "--yes"]);
    }
  } else {
    console.log("[startup] Directus tables detected, skipping bootstrap");
  }

  const child = spawn("npx", ["directus", "start"], {
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 1);
  });

  child.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error("[startup] Failed to initialize Directus");
  console.error(error);
  process.exit(1);
});
