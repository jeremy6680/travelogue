const GEOCODER_URL = "https://nominatim.openstreetmap.org/search";
const geocodeCache = new Map();

async function geocodeLocation(location) {
  const query = String(location ?? "").trim();
  if (!query) return null;

  if (geocodeCache.has(query)) {
    return geocodeCache.get(query);
  }

  const url = new URL(GEOCODER_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "travelogue-directus/1.0",
      Referer: "https://travelogue.app",
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding failed with status ${response.status}`);
  }

  const results = await response.json();
  const firstResult = Array.isArray(results) ? results[0] : null;

  const coordinates = firstResult
    ? {
        latitude: Number(firstResult.lat),
        longitude: Number(firstResult.lon),
      }
    : null;

  geocodeCache.set(query, coordinates);
  return coordinates;
}

export default {
  id: "location-geocode",
  handler: (router) => {
    router.get("/", async (req, res, next) => {
      try {
        const query = String(req.query.q ?? "").trim();
        if (!query) {
          res.status(400).json({ error: "Missing q query parameter" });
          return;
        }

        const coordinates = await geocodeLocation(query);
        res.json({ data: coordinates });
      } catch (error) {
        next(error);
      }
    });
  },
};
