const LOCATABLE_COLLECTIONS = new Set(["posts", "photos"]);
const GEOCODER_URL = "https://nominatim.openstreetmap.org/search";
const geocodeCache = new Map();

function isEmptyCoordinate(value) {
  return value === undefined || value === null || value === "";
}

function sameCoordinateValue(left, right) {
  if (isEmptyCoordinate(left) && isEmptyCoordinate(right)) return true;
  return Number(left) === Number(right);
}

function isEmptyString(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function normalizeCountryCode(countryCode) {
  const normalized = String(countryCode ?? "").trim().toLowerCase();
  return /^[a-z]{2}$/.test(normalized) ? normalized : "";
}

async function getExistingItem(database, collection, keys) {
  const id = Array.isArray(keys) ? keys[0] : keys;
  if (!id) return null;

  const item = await database(collection)
    .select("id", "location", "country_code", "latitude", "longitude")
    .where({ id: Number(id) })
    .first();

  return item ?? null;
}

async function geocodeLocation(location, countryCode) {
  const query = String(location).trim();
  if (!query) return null;
  const normalizedCountryCode = normalizeCountryCode(countryCode);
  const cacheKey = normalizedCountryCode ? `${query}::${normalizedCountryCode}` : query;

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  const url = new URL(GEOCODER_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  if (normalizedCountryCode) {
    url.searchParams.set("countrycodes", normalizedCountryCode);
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "travelogue-directus/1.0",
      Referer: "https://travelogue.local",
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

  geocodeCache.set(cacheKey, coordinates);
  return coordinates;
}

async function applyCoordinatesFromLocation(payload, database, collection, keys) {
  if (!payload || Array.isArray(payload)) {
    return payload;
  }

  const existingItem = keys ? await getExistingItem(database, collection, keys) : null;
  const effectiveLocation = !isEmptyString(payload.location)
    ? payload.location
    : existingItem?.location;
  const effectiveCountryCode = !isEmptyString(payload.country_code)
    ? payload.country_code
    : existingItem?.country_code;

  if (isEmptyString(effectiveLocation)) {
    return payload;
  }

  const locationChanged =
    existingItem == null || String(effectiveLocation).trim() !== String(existingItem.location ?? "").trim();
  const latitudeUnchangedFromExisting =
    existingItem != null && sameCoordinateValue(payload.latitude, existingItem.latitude);
  const longitudeUnchangedFromExisting =
    existingItem != null && sameCoordinateValue(payload.longitude, existingItem.longitude);
  const needsLatitude =
    isEmptyCoordinate(payload.latitude) ||
    (locationChanged && latitudeUnchangedFromExisting) ||
    (locationChanged && isEmptyCoordinate(existingItem?.latitude));
  const needsLongitude =
    isEmptyCoordinate(payload.longitude) ||
    (locationChanged && longitudeUnchangedFromExisting) ||
    (locationChanged && isEmptyCoordinate(existingItem?.longitude));

  if (!needsLatitude && !needsLongitude) {
    return payload;
  }

  const geocoded = await geocodeLocation(effectiveLocation, effectiveCountryCode);
  if (!geocoded) {
    return payload;
  }

  if (needsLatitude) {
    payload.latitude = geocoded.latitude;
  }

  if (needsLongitude) {
    payload.longitude = geocoded.longitude;
  }

  return payload;
}

export default ({ filter }) => {
  filter("items.create", async (payload, meta, context) => {
    if (!LOCATABLE_COLLECTIONS.has(meta.collection)) {
      return payload;
    }

    return applyCoordinatesFromLocation(payload, context.database, meta.collection);
  });

  filter("items.update", async (payload, meta, context) => {
    if (!LOCATABLE_COLLECTIONS.has(meta.collection)) {
      return payload;
    }

    return applyCoordinatesFromLocation(payload, context.database, meta.collection, meta.keys);
  });
};
