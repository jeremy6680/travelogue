import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, countriesTable, postsTable } from "@workspace/db";
import {
  CreateCountryBody,
  UpdateCountryBody,
  GetCountryParams,
  UpdateCountryParams,
  DeleteCountryParams,
  ListCountriesResponse,
  GetCountryResponse,
  UpdateCountryResponse,
  GetStatsResponse,
} from "@workspace/api-zod";

function serializeCountry(country: Record<string, unknown>) {
  return {
    ...country,
    createdAt: country.createdAt instanceof Date ? country.createdAt.toISOString() : country.createdAt,
    updatedAt: country.updatedAt instanceof Date ? country.updatedAt.toISOString() : country.updatedAt,
  };
}

const router: IRouter = Router();

router.get("/countries", async (_req, res): Promise<void> => {
  const countries = await db.select().from(countriesTable).orderBy(asc(countriesTable.visitedAt));
  res.json(ListCountriesResponse.parse(countries.map(serializeCountry)));
});

router.post("/countries", async (req, res): Promise<void> => {
  const parsed = CreateCountryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [country] = await db.insert(countriesTable).values(parsed.data).returning();
  res.status(201).json(GetCountryResponse.parse(serializeCountry(country as unknown as Record<string, unknown>)));
});

router.get("/stats", async (_req, res): Promise<void> => {
  const countries = await db.select().from(countriesTable);
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
  for (const c of countries) {
    for (const [continent, codes] of Object.entries(continentMap)) {
      if (codes.includes(c.countryCode.toUpperCase())) {
        visitedContinents.add(continent);
        break;
      }
    }
  }

  const totalCities = countries.reduce((sum, c) => {
    return sum + c.visitedCities.split(",").filter((s) => s.trim()).length;
  }, 0);

  res.json(
    GetStatsResponse.parse({
      totalCountries: countries.length,
      totalPosts: posts.length,
      totalCities,
      continents: visitedContinents.size,
    })
  );
});

router.get("/countries/:id", async (req, res): Promise<void> => {
  const params = GetCountryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [country] = await db.select().from(countriesTable).where(eq(countriesTable.id, params.data.id));
  if (!country) {
    res.status(404).json({ error: "Country not found" });
    return;
  }
  res.json(GetCountryResponse.parse(serializeCountry(country as unknown as Record<string, unknown>)));
});

router.patch("/countries/:id", async (req, res): Promise<void> => {
  const params = UpdateCountryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCountryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [country] = await db.update(countriesTable).set(parsed.data).where(eq(countriesTable.id, params.data.id)).returning();
  if (!country) {
    res.status(404).json({ error: "Country not found" });
    return;
  }
  res.json(UpdateCountryResponse.parse(serializeCountry(country as unknown as Record<string, unknown>)));
});

router.delete("/countries/:id", async (req, res): Promise<void> => {
  const params = DeleteCountryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [country] = await db.delete(countriesTable).where(eq(countriesTable.id, params.data.id)).returning();
  if (!country) {
    res.status(404).json({ error: "Country not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
