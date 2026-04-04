const POSTS_COLLECTION = "posts";
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

async function getExistingPost(database, keys) {
  const id = Array.isArray(keys) ? keys[0] : keys;
  if (!id) return null;

  const post = await database(POSTS_COLLECTION)
    .select("id", "location", "latitude", "longitude")
    .where({ id: Number(id) })
    .first();

  return post ?? null;
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

async function applyCoordinatesFromLocation(payload, database, keys) {
  if (!payload || Array.isArray(payload)) {
    return payload;
  }

  const existingPost = keys ? await getExistingPost(database, keys) : null;
  const effectiveLocation = !isEmptyString(payload.location)
    ? payload.location
    : existingPost?.location;

  if (isEmptyString(effectiveLocation)) {
    return payload;
  }

  const locationChanged =
    existingPost == null || String(effectiveLocation).trim() !== String(existingPost.location ?? "").trim();
  const latitudeUnchangedFromExisting =
    existingPost != null && sameCoordinateValue(payload.latitude, existingPost.latitude);
  const longitudeUnchangedFromExisting =
    existingPost != null && sameCoordinateValue(payload.longitude, existingPost.longitude);
  const needsLatitude =
    isEmptyCoordinate(payload.latitude) ||
    (locationChanged && latitudeUnchangedFromExisting) ||
    (locationChanged && isEmptyCoordinate(existingPost?.latitude));
  const needsLongitude =
    isEmptyCoordinate(payload.longitude) ||
    (locationChanged && longitudeUnchangedFromExisting) ||
    (locationChanged && isEmptyCoordinate(existingPost?.longitude));

  if (!needsLatitude && !needsLongitude) {
    return payload;
  }

  const geocoded = await geocodeLocation(effectiveLocation);
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
    if (meta.collection !== POSTS_COLLECTION) {
      return payload;
    }

    return applyCoordinatesFromLocation(payload, context.database);
  });

  filter("items.update", async (payload, meta, context) => {
    if (meta.collection !== POSTS_COLLECTION) {
      return payload;
    }

    return applyCoordinatesFromLocation(payload, context.database, meta.keys);
  });
};
