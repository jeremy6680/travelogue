const TRIPS_COLLECTION = "trips";
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

function normalizeValue(value) {
  return isEmptyString(value) ? "" : String(value).trim();
}

function getFirstVisitedCity(value) {
  if (isEmptyString(value)) return "";

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .find(Boolean) ?? "";
}

function buildGeocodeQuery({ visitedCities, name, countryCode }) {
  const firstCity = getFirstVisitedCity(visitedCities);
  const countryOrTripName = normalizeValue(name) || normalizeValue(countryCode);

  if (firstCity && countryOrTripName) {
    return `${firstCity}, ${countryOrTripName}`;
  }

  if (firstCity) {
    return firstCity;
  }

  return countryOrTripName;
}

async function getExistingTrip(database, keys) {
  const id = Array.isArray(keys) ? keys[0] : keys;
  if (!id) return null;

  const trip = await database(TRIPS_COLLECTION)
    .select("id", "name", "country_code", "visited_cities", "latitude", "longitude")
    .where({ id: Number(id) })
    .first();

  return trip ?? null;
}

async function geocodeLocation(location) {
  const query = String(location).trim();
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

  geocodeCache.set(query, coordinates);
  return coordinates;
}

async function applyCoordinatesFromTrip(payload, database, keys) {
  if (!payload || Array.isArray(payload)) {
    return payload;
  }

  const existingTrip = keys ? await getExistingTrip(database, keys) : null;
  const effectiveName = !isEmptyString(payload.name) ? payload.name : existingTrip?.name;
  const effectiveCountryCode = !isEmptyString(payload.country_code)
    ? payload.country_code
    : existingTrip?.country_code;
  const effectiveVisitedCities = !isEmptyString(payload.visited_cities)
    ? payload.visited_cities
    : existingTrip?.visited_cities;

  const effectiveQuery = buildGeocodeQuery({
    visitedCities: effectiveVisitedCities,
    name: effectiveName,
    countryCode: effectiveCountryCode,
  });

  if (isEmptyString(effectiveQuery)) {
    return payload;
  }

  const previousQuery = existingTrip
    ? buildGeocodeQuery({
        visitedCities: existingTrip.visited_cities,
        name: existingTrip.name,
        countryCode: existingTrip.country_code,
      })
    : "";

  const locationChanged =
    existingTrip == null || normalizeValue(effectiveQuery) !== normalizeValue(previousQuery);
  const latitudeUnchangedFromExisting =
    existingTrip != null && sameCoordinateValue(payload.latitude, existingTrip.latitude);
  const longitudeUnchangedFromExisting =
    existingTrip != null && sameCoordinateValue(payload.longitude, existingTrip.longitude);
  const needsLatitude =
    isEmptyCoordinate(payload.latitude) ||
    (locationChanged && latitudeUnchangedFromExisting) ||
    (locationChanged && isEmptyCoordinate(existingTrip?.latitude));
  const needsLongitude =
    isEmptyCoordinate(payload.longitude) ||
    (locationChanged && longitudeUnchangedFromExisting) ||
    (locationChanged && isEmptyCoordinate(existingTrip?.longitude));

  if (!needsLatitude && !needsLongitude) {
    return payload;
  }

  const geocoded = await geocodeLocation(effectiveQuery);
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
    if (meta.collection !== TRIPS_COLLECTION) {
      return payload;
    }

    return applyCoordinatesFromTrip(payload, context.database);
  });

  filter("items.update", async (payload, meta, context) => {
    if (meta.collection !== TRIPS_COLLECTION) {
      return payload;
    }

    return applyCoordinatesFromTrip(payload, context.database, meta.keys);
  });
};
