import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from workspace root before importing db (imports are hoisted in ESM)
if (!process.env.DATABASE_URL) {
  try {
    const envContent = readFileSync(resolve(__dirname, "../../.env"), "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^([^=#][^=]*)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    }
  } catch {}
}

const { db, pool, tripsTable, postsTable } = await import("@workspace/db");

type TripRow = {
  id: number;
  name: string;
  country_code: string;
  visited_cities: string;
  reason_for_visit: string;
  reason_for_travel?: string[] | string;
  trip_context?: string[] | string;
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
  trip_id: number | null;
  published_at: string | null;
};

const tripsData: TripRow[] = JSON.parse(
  readFileSync(resolve(__dirname, "../data/trips.json"), "utf-8"),
);
const postsData: PostRow[] = JSON.parse(
  readFileSync(resolve(__dirname, "../data/posts.json"), "utf-8"),
);

// Insert trips and capture generated IDs
const insertedTrips = await db
  .insert(tripsTable)
  .values(
    tripsData.map((t) => ({
      name: t.name,
      countryCode: t.country_code,
      visitedCities: t.visited_cities,
      reasonForVisit: t.reason_for_visit,
      reasonForTravel: Array.isArray(t.reason_for_travel)
        ? t.reason_for_travel
        : [],
      tripContext: Array.isArray(t.trip_context) ? t.trip_context : [],
      travelCompanions: t.travel_companions
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      friendsFamilyMet: t.friends_family_met,
      visitedAt: t.visited_at,
      latitude: t.latitude,
      longitude: t.longitude,
    })),
  )
  .returning({ id: tripsTable.id });

// Map JSON id → new DB-generated id (insertion order is preserved by .returning())
const tripIdMap = new Map(
  tripsData.map((t, i) => [t.id, insertedTrips[i].id]),
);

// Insert posts, remapping trip_id to the newly generated DB ids
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
    tripId: p.trip_id != null ? (tripIdMap.get(p.trip_id) ?? null) : null,
    publishedAt: p.published_at ?? null,
  })),
);

console.log(`Seeded ${insertedTrips.length} trips and ${postsData.length} posts.`);

await pool.end();
