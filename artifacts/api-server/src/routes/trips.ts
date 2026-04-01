import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, tripsTable, postsTable } from "@workspace/db";
import {
  CreateTripBody,
  UpdateTripBody,
  GetTripParams,
  UpdateTripParams,
  DeleteTripParams,
  ListTripsResponse,
  GetTripResponse,
  UpdateTripResponse,
  GetStatsResponse,
} from "@workspace/api-zod";

function serializeTrip(trip: Record<string, unknown>) {
  return {
    ...trip,
    createdAt: trip.createdAt instanceof Date ? trip.createdAt.toISOString() : trip.createdAt,
    updatedAt: trip.updatedAt instanceof Date ? trip.updatedAt.toISOString() : trip.updatedAt,
  };
}

const router: IRouter = Router();

router.get("/trips", async (_req, res): Promise<void> => {
  const trips = await db.select().from(tripsTable).orderBy(asc(tripsTable.visitedAt));
  res.json(ListTripsResponse.parse(trips.map(serializeTrip)));
});

router.post("/trips", async (req, res): Promise<void> => {
  const parsed = CreateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [trip] = await db.insert(tripsTable).values(parsed.data).returning();
  res.status(201).json(GetTripResponse.parse(serializeTrip(trip as unknown as Record<string, unknown>)));
});

router.get("/stats", async (_req, res): Promise<void> => {
  const trips = await db.select().from(tripsTable);
  const posts = await db.select().from(postsTable);

  const continentMap: Record<string, string[]> = {
    EU: ["FR", "DE", "IT", "ES", "PT", "NL", "BE", "CH", "AT", "PL", "CZ", "HU", "SE", "NO", "DK", "FI", "GR", "HR", "RO", "BG"],
    NA: ["US", "CA", "MX", "CU", "JM", "HT", "DO", "GT", "BZ", "HN", "SV", "NI", "CR", "PA"],
    SA: ["BR", "AR", "CL", "CO", "PE", "VE", "EC", "BO", "PY", "UY", "GY", "SR"],
    AS: ["JP", "CN", "IN", "KR", "TH", "VN", "ID", "MY", "SG", "PH", "TW", "HK", "AE", "TR", "IL", "JO", "LB"],
    AF: ["ZA", "NG", "KE", "ET", "EG", "MA", "TZ", "GH", "SN", "TN"],
    OC: ["AU", "NZ", "FJ", "PG"],
  };

  const visitedContinents = new Set<string>();
  for (const t of trips) {
    for (const [continent, codes] of Object.entries(continentMap)) {
      if (codes.includes(t.countryCode.toUpperCase())) {
        visitedContinents.add(continent);
        break;
      }
    }
  }

  const totalCities = trips.reduce((sum, t) => {
    return sum + t.visitedCities.split(",").filter((s) => s.trim()).length;
  }, 0);

  res.json(
    GetStatsResponse.parse({
      totalTrips: trips.length,
      totalPosts: posts.length,
      totalCities,
      continents: visitedContinents.size,
    })
  );
});

router.get("/trips/:id", async (req, res): Promise<void> => {
  const params = GetTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, params.data.id));
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.json(GetTripResponse.parse(serializeTrip(trip as unknown as Record<string, unknown>)));
});

router.patch("/trips/:id", async (req, res): Promise<void> => {
  const params = UpdateTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [trip] = await db.update(tripsTable).set(parsed.data).where(eq(tripsTable.id, params.data.id)).returning();
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.json(UpdateTripResponse.parse(serializeTrip(trip as unknown as Record<string, unknown>)));
});

router.delete("/trips/:id", async (req, res): Promise<void> => {
  const params = DeleteTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [trip] = await db.delete(tripsTable).where(eq(tripsTable.id, params.data.id)).returning();
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
