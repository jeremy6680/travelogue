import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from workspace root before importing db (imports are hoisted in ESM)
try {
  const envContent = readFileSync(resolve(__dirname, "../../.env"), "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^=#][^=]*)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch {}

const { db, pool, countriesTable, postsTable } = await import("@workspace/db");

type CountryRow = {
  id: number;
  name: string;
  country_code: string;
  visited_cities: string;
  reason_for_visit: string;
  travel_companions: string;
  friends_family_met: string;
  visited_at: string;
  latitude: number;
  longitude: number;
};

type PostRow = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image_url: string | null;
  gallery: { url: string; caption: string }[] | null;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  country_id: number | null;
  published_at: string | null;
};

const countriesData: CountryRow[] = JSON.parse(
  readFileSync(resolve(__dirname, "../data/countries.json"), "utf-8"),
);
const postsData: PostRow[] = JSON.parse(
  readFileSync(resolve(__dirname, "../data/posts.json"), "utf-8"),
);

// Insert countries and capture generated IDs
const insertedCountries = await db
  .insert(countriesTable)
  .values(
    countriesData.map((c) => ({
      name: c.name,
      countryCode: c.country_code,
      visitedCities: c.visited_cities,
      reasonForVisit: c.reason_for_visit,
      travelCompanions: c.travel_companions,
      friendsFamilyMet: c.friends_family_met,
      visitedAt: c.visited_at,
      latitude: c.latitude,
      longitude: c.longitude,
    })),
  )
  .returning({ id: countriesTable.id });

// Map JSON id → new DB-generated id (insertion order is preserved by .returning())
const countryIdMap = new Map(
  countriesData.map((c, i) => [c.id, insertedCountries[i].id]),
);

// Insert posts, remapping country_id to the newly generated DB ids
await db.insert(postsTable).values(
  postsData.map((p) => ({
    title: p.title,
    slug: p.slug,
    content: p.content,
    excerpt: p.excerpt,
    coverImageUrl: p.cover_image_url ?? null,
    gallery: p.gallery ?? null,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    location: p.location ?? null,
    countryId: p.country_id != null ? (countryIdMap.get(p.country_id) ?? null) : null,
    publishedAt: p.published_at ?? null,
  })),
);

console.log(`Seeded ${insertedCountries.length} countries and ${postsData.length} posts.`);

await pool.end();
