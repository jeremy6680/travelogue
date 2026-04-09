import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createDirectus,
  createItem,
  deleteItem,
  readItems,
  rest,
  serverPing,
  updateItem,
  withToken,
} from "@directus/sdk";
import type {
  CreateMediaAssetBody,
  CreatePhotoBody,
  CreatePostBody,
  CreateJourneyBody,
  CreateTripBody,
  GalleryImage,
  Journey,
  MapPin,
  MediaAsset,
  Photo,
  Post,
  TravelStats,
  Trip,
  UpdateMediaAssetBody,
  UpdateJourneyBody,
  UpdatePhotoBody,
  UpdatePostBody,
  UpdateTripBody,
} from "@/lib/travel-types";
import {
  getContinentKey,
  normalizeMultiValueField,
} from "@/lib/trip-options";
import { normalizeTagList } from "@/lib/post-taxonomy";

type DirectusGalleryImage = GalleryImage;

type DirectusMediaAsset = {
  id: number;
  title: string | null;
  public_id: string;
  delivery_url: string | null;
  width: number | null;
  height: number | null;
  format: string | null;
  resource_type: string | null;
  bytes: number | null;
  alt: string | null;
  caption: string | null;
  folder: string | null;
  placeholder_url: string | null;
  created_at: string;
  updated_at: string;
};

type DirectusPost = {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string;
  external_url?: string | null;
  category?: string | null;
  tags?: string[] | string | null;
  featured_on_home?: boolean | null;
  featured_home_order?: number | null;
  cover_image_url: string | null;
  featured_image_id?: number | null;
  featured_image?: DirectusMediaAsset | null;
  gallery: DirectusGalleryImage[] | null;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  trip_id: number | null;
  country_code: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type DirectusTrip = {
  id: number;
  name: string;
  country_code: string;
  visited_cities: string;
  accomodation: string[] | string | null;
  reason_for_visit: string;
  reason_for_travel?: string[] | string | null;
  travel_companions: string[] | string | null;
  friends_family_met: string;
  visited_at: string;
  visited_until: string | null;
  latitude: number | null;
  longitude: number | null;
  cover_image_id?: number | null;
  cover_image?: DirectusMediaAsset | null;
  journey_id?: number | null;
  journey_order?: number | null;
  transportation_to: string[] | string | null;
  transportation_on_site: string[] | string | null;
  created_at: string;
  updated_at: string;
};

type DirectusJourney = {
  id: number;
  name: string;
  slug: string;
  start_date: string | null;
  end_date: string | null;
  origin_mode: "default_nice" | "custom";
  origin_latitude: number | null;
  origin_longitude: number | null;
  destination_mode: "default_nice" | "custom";
  destination_latitude: number | null;
  destination_longitude: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type DirectusPhoto = {
  id: number;
  url: string | null;
  media_asset_id?: number | null;
  media_asset?: DirectusMediaAsset | null;
  caption: string | null;
  link: string | null;
  trip_id: number | null;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type DirectusSchema = {
  journeys: DirectusJourney[];
  posts: DirectusPost[];
  trips: DirectusTrip[];
  photos: DirectusPhoto[];
  media_assets: DirectusMediaAsset[];
};

const MEDIA_ASSET_FIELDS = [
  "id",
  "title",
  "public_id",
  "delivery_url",
  "width",
  "height",
  "format",
  "resource_type",
  "bytes",
  "alt",
  "caption",
  "folder",
  "placeholder_url",
  "created_at",
  "updated_at",
] as const;

const POST_FIELDS = [
  "id",
  "title",
  "slug",
  "content",
  "excerpt",
  "external_url",
  "category",
  "tags",
  "featured_on_home",
  "featured_home_order",
  "cover_image_url",
  "featured_image_id",
  { featured_image: [...MEDIA_ASSET_FIELDS] },
  "gallery",
  "latitude",
  "longitude",
  "location",
  "trip_id",
  "country_code",
  "published_at",
  "created_at",
  "updated_at",
] as const;

const TRIP_FIELDS = [
  "id",
  "name",
  "country_code",
  "visited_cities",
  "accomodation",
  "reason_for_visit",
  "reason_for_travel",
  "travel_companions",
  "friends_family_met",
  "visited_at",
  "visited_until",
  "latitude",
  "longitude",
  "cover_image_id",
  { cover_image: [...MEDIA_ASSET_FIELDS] },
  "journey_id",
  "journey_order",
  "transportation_to",
  "transportation_on_site",
  "created_at",
  "updated_at",
] as const;

const PHOTO_FIELDS = [
  "id",
  "url",
  "media_asset_id",
  { media_asset: [...MEDIA_ASSET_FIELDS] },
  "caption",
  "link",
  "trip_id",
  "country_code",
  "latitude",
  "longitude",
  "location",
  "display_order",
  "created_at",
  "updated_at",
] as const;

const LEGACY_POST_FIELDS = [
  "id",
  "title",
  "slug",
  "content",
  "excerpt",
  "external_url",
  "cover_image_url",
  "gallery",
  "latitude",
  "longitude",
  "location",
  "trip_id",
  "country_code",
  "published_at",
  "created_at",
  "updated_at",
] as const;

const LEGACY_TRIP_FIELDS = [
  "id",
  "name",
  "country_code",
  "visited_cities",
  "accomodation",
  "reason_for_visit",
  "travel_companions",
  "friends_family_met",
  "visited_at",
  "visited_until",
  "latitude",
  "longitude",
  "journey_id",
  "journey_order",
  "transportation_to",
  "transportation_on_site",
  "created_at",
  "updated_at",
] as const;

const LEGACY_PHOTO_FIELDS = [
  "id",
  "url",
  "caption",
  "link",
  "trip_id",
  "country_code",
  "display_order",
  "created_at",
  "updated_at",
] as const;

const directus = createDirectus<DirectusSchema>(
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8055",
).with(rest());

export const directusQueryKeys = {
  posts: ["directus", "posts"] as const,
  postBySlug: (slug: string | undefined) => ["directus", "posts", slug] as const,
  trips: ["directus", "trips"] as const,
  journeys: ["directus", "journeys"] as const,
  photos: ["directus", "photos"] as const,
  mediaAssets: ["directus", "media-assets"] as const,
  mapPins: ["directus", "map-pins"] as const,
  stats: ["directus", "stats"] as const,
  health: ["directus", "health"] as const,
};

function mapMediaAsset(asset: DirectusMediaAsset | null | undefined): MediaAsset | null {
  if (!asset) return null;

  return {
    id: asset.id,
    title: asset.title,
    publicId: asset.public_id,
    deliveryUrl: asset.delivery_url,
    width: asset.width,
    height: asset.height,
    format: asset.format,
    resourceType: asset.resource_type,
    bytes: asset.bytes,
    alt: asset.alt,
    caption: asset.caption,
    folder: asset.folder,
    placeholderUrl: asset.placeholder_url,
    createdAt: asset.created_at,
    updatedAt: asset.updated_at,
  };
}

function mapGalleryImage(image: DirectusGalleryImage): GalleryImage {
  return {
    assetId: image.assetId ?? null,
    publicId: image.publicId ?? null,
    url: image.url ?? null,
    alt: image.alt ?? null,
    caption: image.caption,
    width: image.width ?? null,
    height: image.height ?? null,
  };
}

function mapPost(post: DirectusPost): Post {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    externalUrl: post.external_url ?? null,
    category: post.category ?? null,
    tags: normalizeTagList(post.tags),
    featuredOnHome: Boolean(post.featured_on_home),
    featuredHomeOrder: post.featured_home_order ?? null,
    coverImageUrl: post.cover_image_url,
    coverImage: mapMediaAsset(post.featured_image),
    gallery: post.gallery?.map(mapGalleryImage) ?? null,
    latitude: post.latitude,
    longitude: post.longitude,
    location: post.location,
    tripId: post.trip_id,
    countryCode: post.country_code,
    publishedAt: post.published_at,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
  };
}

function mapTrip(trip: DirectusTrip): Trip {
  return {
    id: trip.id,
    name: trip.name,
    countryCode: trip.country_code,
    visitedCities: trip.visited_cities,
    accomodation: normalizeMultiValueField(trip.accomodation),
    reasonForVisit: trip.reason_for_visit,
    reasonForTravel: normalizeMultiValueField(trip.reason_for_travel),
    travelCompanions: normalizeMultiValueField(trip.travel_companions),
    friendsFamilyMet: trip.friends_family_met,
    visitedAt: trip.visited_at,
    visitedUntil: trip.visited_until,
    latitude: trip.latitude,
    longitude: trip.longitude,
    coverImageId: trip.cover_image_id ?? null,
    coverImage: mapMediaAsset(trip.cover_image),
    journeyId: trip.journey_id ?? null,
    journeyOrder: trip.journey_order ?? null,
    transportationTo: normalizeMultiValueField(trip.transportation_to),
    transportationOnSite: normalizeMultiValueField(trip.transportation_on_site),
    createdAt: trip.created_at,
    updatedAt: trip.updated_at,
  };
}

function mapJourney(journey: DirectusJourney): Journey {
  return {
    id: journey.id,
    name: journey.name,
    slug: journey.slug,
    startDate: journey.start_date,
    endDate: journey.end_date,
    originMode: journey.origin_mode,
    originLatitude: journey.origin_latitude,
    originLongitude: journey.origin_longitude,
    destinationMode: journey.destination_mode,
    destinationLatitude: journey.destination_latitude,
    destinationLongitude: journey.destination_longitude,
    notes: journey.notes,
    createdAt: journey.created_at,
    updatedAt: journey.updated_at,
  };
}

function mapPhoto(photo: DirectusPhoto): Photo {
  return {
    id: photo.id,
    url: photo.url,
    mediaAssetId: photo.media_asset_id ?? null,
    mediaAsset: mapMediaAsset(photo.media_asset),
    caption: photo.caption,
    link: photo.link,
    tripId: photo.trip_id,
    countryCode: photo.country_code,
    latitude: photo.latitude,
    longitude: photo.longitude,
    location: photo.location,
    displayOrder: photo.display_order,
    createdAt: photo.created_at,
    updatedAt: photo.updated_at,
  };
}

function mapPin(post: Post): MapPin {
  return {
    id: `post-${post.id}`,
    kind: "post",
    title: post.title,
    excerpt: post.excerpt,
    href: post.externalUrl ?? `/posts/${post.slug}`,
    coverImageUrl: post.coverImageUrl,
    coverImage: post.coverImage,
    latitude: post.latitude ?? 0,
    longitude: post.longitude ?? 0,
    location: post.location,
    publishedAt: post.publishedAt,
  };
}

function mapPhotoPin(photo: Photo): MapPin {
  return {
    id: `photo-${photo.id}`,
    kind: "photo",
    title: photo.caption?.trim() || "Photo",
    excerpt: photo.caption?.trim() || "",
    href: photo.link,
    coverImageUrl: photo.url,
    coverImage: photo.mediaAsset,
    latitude: photo.latitude ?? 0,
    longitude: photo.longitude ?? 0,
    location: photo.location,
    publishedAt: null,
  };
}

function buildStats(trips: Trip[], posts: Post[]): TravelStats {
  const visitedContinents = new Set<string>();

  for (const trip of trips) {
    const continent = getContinentKey(trip.countryCode);
    if (continent) {
      visitedContinents.add(continent);
    }
  }

  const totalCities = trips.reduce((sum, trip) => {
    return sum + trip.visitedCities.split(",").filter((city) => city.trim()).length;
  }, 0);

  return {
    totalTrips: trips.length,
    totalPosts: posts.length,
    totalCities,
    continents: visitedContinents.size,
  };
}

function mapCreatePostInput(data: CreatePostBody | UpdatePostBody) {
  return {
    title: data.title,
    slug: data.slug,
    content: data.content || null,
    excerpt: data.excerpt,
    external_url: data.externalUrl,
    category: data.category,
    tags: normalizeTagList(data.tags),
    featured_on_home: data.featuredOnHome ?? false,
    featured_home_order: data.featuredHomeOrder,
    cover_image_url: data.coverImageUrl,
    featured_image_id: data.coverImageId,
    gallery: data.gallery,
    latitude: data.latitude,
    longitude: data.longitude,
    location: data.location,
    trip_id: data.tripId,
    country_code: data.countryCode,
    published_at: data.publishedAt,
  };
}

function mapCreateTripInput(data: CreateTripBody | UpdateTripBody) {
  return {
    name: data.name,
    country_code: data.countryCode,
    visited_cities: data.visitedCities,
    accomodation: data.accomodation,
    reason_for_visit: data.reasonForVisit,
    reason_for_travel: normalizeMultiValueField(data.reasonForTravel),
    travel_companions: normalizeMultiValueField(data.travelCompanions),
    friends_family_met: data.friendsFamilyMet,
    visited_at: data.visitedAt,
    visited_until: data.visitedUntil,
    latitude: data.latitude,
    longitude: data.longitude,
    cover_image_id: data.coverImageId,
    journey_id: data.journeyId,
    journey_order: data.journeyOrder,
    transportation_to: normalizeMultiValueField(data.transportationTo),
    transportation_on_site: normalizeMultiValueField(data.transportationOnSite),
  };
}

function mapCreateJourneyInput(data: CreateJourneyBody | UpdateJourneyBody) {
  return {
    name: data.name,
    slug: data.slug,
    start_date: data.startDate,
    end_date: data.endDate,
    origin_mode: data.originMode,
    origin_latitude: data.originLatitude,
    origin_longitude: data.originLongitude,
    destination_mode: data.destinationMode,
    destination_latitude: data.destinationLatitude,
    destination_longitude: data.destinationLongitude,
    notes: data.notes,
  };
}

function mapCreatePhotoInput(data: CreatePhotoBody | UpdatePhotoBody) {
  return {
    url: data.url,
    media_asset_id: data.mediaAssetId,
    caption: data.caption,
    link: data.link,
    trip_id: data.tripId,
    country_code: data.countryCode,
    latitude: data.latitude,
    longitude: data.longitude,
    location: data.location,
    display_order: data.displayOrder,
  };
}

function mapCreateMediaAssetInput(data: CreateMediaAssetBody | UpdateMediaAssetBody) {
  return {
    title: data.title,
    public_id: data.publicId,
    delivery_url: data.deliveryUrl,
    width: data.width,
    height: data.height,
    format: data.format,
    resource_type: data.resourceType,
    bytes: data.bytes,
    alt: data.alt,
    caption: data.caption,
    folder: data.folder,
    placeholder_url: data.placeholderUrl,
  };
}

function isSchemaMismatchError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message)
        : String(error);
  const statusCode =
    typeof error === "object" && error && "status" in error
      ? Number((error as { status?: unknown }).status)
      : typeof error === "object" && error && "errors" in error
        ? Number(
            (
              (error as {
                errors?: Array<{
                  extensions?: {
                    code?: string | number;
                  };
                }>;
              }).errors?.[0]?.extensions?.code ?? NaN
            ),
          )
        : NaN;

  return (
    statusCode === 403 ||
    message.includes("Invalid query") ||
    message.includes("is not a field in collection") ||
    message.includes("Collection") ||
    message.includes("doesn't exist") ||
    message.includes("Forbidden") ||
    message.includes("forbidden") ||
    message.includes("permission") ||
    message.includes("permissions")
  );
}

async function requestWithFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>) {
  try {
    return await primary();
  } catch (error) {
    if (!isSchemaMismatchError(error)) {
      throw error;
    }

    return fallback();
  }
}

export async function fetchPosts(): Promise<Post[]> {
  const posts = await requestWithFallback(
    () =>
      directus.request(
        readItems("posts", {
          sort: ["created_at"],
          fields: [...POST_FIELDS],
          limit: -1,
        }),
      ),
    () =>
      directus.request(
        readItems("posts", {
          sort: ["created_at"],
          fields: [...LEGACY_POST_FIELDS],
          limit: -1,
        }),
      ),
  );

  return posts.map(mapPost);
}

export async function fetchTrips(): Promise<Trip[]> {
  const trips = await requestWithFallback(
    () =>
      directus.request(
        readItems("trips", {
          sort: ["visited_at"],
          fields: [...TRIP_FIELDS],
          limit: -1,
        }),
      ),
    () =>
      directus.request(
        readItems("trips", {
          sort: ["visited_at"],
          fields: [...LEGACY_TRIP_FIELDS],
          limit: -1,
        }),
      ),
  );

  return trips.map(mapTrip);
}

export async function fetchJourneys(): Promise<Journey[]> {
  const journeys = await directus.request(
    readItems("journeys", {
      sort: ["start_date", "created_at"],
      fields: [
        "id",
        "name",
        "slug",
        "start_date",
        "end_date",
        "origin_mode",
        "origin_latitude",
        "origin_longitude",
        "destination_mode",
        "destination_latitude",
        "destination_longitude",
        "notes",
        "created_at",
        "updated_at",
      ],
      limit: -1,
    }),
  );

  return journeys.map(mapJourney);
}

export async function fetchPhotos(): Promise<Photo[]> {
  const photos = await requestWithFallback(
    () =>
      directus.request(
        readItems("photos", {
          sort: ["display_order", "created_at"],
          fields: [...PHOTO_FIELDS],
          limit: -1,
        }),
      ),
    () =>
      directus.request(
        readItems("photos", {
          sort: ["display_order", "created_at"],
          fields: [...LEGACY_PHOTO_FIELDS],
          limit: -1,
        }),
      ),
  );

  return photos.map(mapPhoto);
}

export async function fetchMediaAssets(): Promise<MediaAsset[]> {
  try {
    const assets = await directus.request(
      readItems("media_assets", {
        sort: ["folder", "public_id"],
        fields: [...MEDIA_ASSET_FIELDS],
        limit: -1,
      }),
    );

    return assets.map(mapMediaAsset).filter((asset): asset is MediaAsset => Boolean(asset));
  } catch (error) {
    if (!isSchemaMismatchError(error)) {
      throw error;
    }

    return [];
  }
}

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const posts = await requestWithFallback(
    () =>
      directus.request(
        readItems("posts", {
          filter: { slug: { _eq: slug } },
          fields: [...POST_FIELDS],
          limit: 1,
        }),
      ),
    () =>
      directus.request(
        readItems("posts", {
          filter: { slug: { _eq: slug } },
          fields: [...LEGACY_POST_FIELDS],
          limit: 1,
        }),
      ),
  );

  return posts[0] ? mapPost(posts[0]) : null;
}

export async function fetchMapPins(): Promise<MapPin[]> {
  const [posts, photos] = await Promise.all([
    requestWithFallback(
      () =>
        directus.request(
          readItems("posts", {
            filter: {
              _and: [{ latitude: { _nnull: true } }, { longitude: { _nnull: true } }],
            },
            fields: [...POST_FIELDS],
            limit: -1,
          }),
        ),
      () =>
        directus.request(
          readItems("posts", {
            filter: {
              _and: [{ latitude: { _nnull: true } }, { longitude: { _nnull: true } }],
            },
            fields: [
              "id",
              "title",
              "slug",
              "excerpt",
              "cover_image_url",
              "latitude",
              "longitude",
              "location",
              "published_at",
            ],
            limit: -1,
          }),
        ),
    ),
    requestWithFallback(
      () =>
        directus.request(
          readItems("photos", {
            filter: {
              _and: [{ latitude: { _nnull: true } }, { longitude: { _nnull: true } }],
            },
            fields: [...PHOTO_FIELDS],
            limit: -1,
          }),
        ),
      () =>
        directus.request(
          readItems("photos", {
            filter: {
              _and: [{ latitude: { _nnull: true } }, { longitude: { _nnull: true } }],
            },
            fields: [
              "id",
              "url",
              "caption",
              "link",
              "media_asset_id",
              "trip_id",
              "country_code",
              "latitude",
              "longitude",
              "location",
              "display_order",
              "created_at",
              "updated_at",
            ],
            limit: -1,
          }),
        ),
    ),
  ]);

  return [...posts.map(mapPost).map(mapPin), ...photos.map(mapPhoto).map(mapPhotoPin)];
}

export async function fetchStats(): Promise<TravelStats> {
  const [trips, posts] = await Promise.all([fetchTrips(), fetchPosts()]);
  return buildStats(trips, posts);
}

export async function pingDirectus(): Promise<{ status: string }> {
  await directus.request(serverPing());
  return { status: "ok" };
}

export async function createPostWithToken(token: string, data: CreatePostBody): Promise<Post> {
  const post = await directus.request(
    withToken(
      token,
      createItem("posts", mapCreatePostInput(data), {
        fields: [...POST_FIELDS],
      }),
    ),
  );

  return mapPost(post);
}

export async function updatePostWithToken(
  token: string,
  id: number,
  data: UpdatePostBody,
): Promise<Post> {
  const post = await directus.request(
    withToken(
      token,
      updateItem("posts", id, mapCreatePostInput(data), {
        fields: [...POST_FIELDS],
      }),
    ),
  );

  return mapPost(post);
}

export async function deletePostWithToken(token: string, id: number): Promise<void> {
  await directus.request(withToken(token, deleteItem("posts", id)));
}

export async function createTripWithToken(token: string, data: CreateTripBody): Promise<Trip> {
  const trip = await directus.request(
    withToken(
      token,
      createItem("trips", mapCreateTripInput(data), {
        fields: [...TRIP_FIELDS],
      }),
    ),
  );

  return mapTrip(trip);
}

export async function updateTripWithToken(
  token: string,
  id: number,
  data: UpdateTripBody,
): Promise<Trip> {
  const trip = await directus.request(
    withToken(
      token,
      updateItem("trips", id, mapCreateTripInput(data), {
        fields: [...TRIP_FIELDS],
      }),
    ),
  );

  return mapTrip(trip);
}

export async function deleteTripWithToken(token: string, id: number): Promise<void> {
  await directus.request(withToken(token, deleteItem("trips", id)));
}

export async function createJourneyWithToken(token: string, data: CreateJourneyBody): Promise<Journey> {
  const journey = await directus.request(
    withToken(
      token,
      createItem("journeys", mapCreateJourneyInput(data), {
        fields: [
          "id",
          "name",
          "slug",
          "start_date",
          "end_date",
          "origin_mode",
          "origin_latitude",
          "origin_longitude",
          "destination_mode",
          "destination_latitude",
          "destination_longitude",
          "notes",
          "created_at",
          "updated_at",
        ],
      }),
    ),
  );

  return mapJourney(journey);
}

export async function updateJourneyWithToken(
  token: string,
  id: number,
  data: UpdateJourneyBody,
): Promise<Journey> {
  const journey = await directus.request(
    withToken(
      token,
      updateItem("journeys", id, mapCreateJourneyInput(data), {
        fields: [
          "id",
          "name",
          "slug",
          "start_date",
          "end_date",
          "origin_mode",
          "origin_latitude",
          "origin_longitude",
          "destination_mode",
          "destination_latitude",
          "destination_longitude",
          "notes",
          "created_at",
          "updated_at",
        ],
      }),
    ),
  );

  return mapJourney(journey);
}

export async function deleteJourneyWithToken(token: string, id: number): Promise<void> {
  await directus.request(withToken(token, deleteItem("journeys", id)));
}

export async function createPhotoWithToken(token: string, data: CreatePhotoBody): Promise<Photo> {
  const photo = await directus.request(
    withToken(
      token,
      createItem("photos", mapCreatePhotoInput(data), {
        fields: [...PHOTO_FIELDS],
      }),
    ),
  );

  return mapPhoto(photo);
}

export async function updatePhotoWithToken(
  token: string,
  id: number,
  data: UpdatePhotoBody,
): Promise<Photo> {
  const photo = await directus.request(
    withToken(
      token,
      updateItem("photos", id, mapCreatePhotoInput(data), {
        fields: [...PHOTO_FIELDS],
      }),
    ),
  );

  return mapPhoto(photo);
}

export async function deletePhotoWithToken(token: string, id: number): Promise<void> {
  await directus.request(withToken(token, deleteItem("photos", id)));
}

export async function createMediaAssetWithToken(
  token: string,
  data: CreateMediaAssetBody,
): Promise<MediaAsset> {
  const asset = await directus.request(
    withToken(
      token,
      createItem("media_assets", mapCreateMediaAssetInput(data), {
        fields: [...MEDIA_ASSET_FIELDS],
      }),
    ),
  );

  return mapMediaAsset(asset)!;
}

export async function updateMediaAssetWithToken(
  token: string,
  id: number,
  data: UpdateMediaAssetBody,
): Promise<MediaAsset> {
  const asset = await directus.request(
    withToken(
      token,
      updateItem("media_assets", id, mapCreateMediaAssetInput(data), {
        fields: [...MEDIA_ASSET_FIELDS],
      }),
    ),
  );

  return mapMediaAsset(asset)!;
}

export async function deleteMediaAssetWithToken(token: string, id: number): Promise<void> {
  await directus.request(withToken(token, deleteItem("media_assets", id)));
}

export function usePostsQuery(): UseQueryResult<Post[]> {
  return useQuery({
    queryKey: directusQueryKeys.posts,
    queryFn: fetchPosts,
  });
}

export function useTripsQuery(): UseQueryResult<Trip[]> {
  return useQuery({
    queryKey: directusQueryKeys.trips,
    queryFn: fetchTrips,
  });
}

export function useJourneysQuery(): UseQueryResult<Journey[]> {
  return useQuery({
    queryKey: directusQueryKeys.journeys,
    queryFn: fetchJourneys,
  });
}

export function usePhotosQuery(): UseQueryResult<Photo[]> {
  return useQuery({
    queryKey: directusQueryKeys.photos,
    queryFn: fetchPhotos,
  });
}

export function useMediaAssetsQuery(): UseQueryResult<MediaAsset[]> {
  return useQuery({
    queryKey: directusQueryKeys.mediaAssets,
    queryFn: fetchMediaAssets,
  });
}

export function usePostBySlugQuery(slug: string | undefined): UseQueryResult<Post | null> {
  return useQuery({
    queryKey: directusQueryKeys.postBySlug(slug),
    queryFn: () => fetchPostBySlug(slug!),
    enabled: Boolean(slug),
  });
}

export function useMapPinsQuery(): UseQueryResult<MapPin[]> {
  return useQuery({
    queryKey: directusQueryKeys.mapPins,
    queryFn: fetchMapPins,
  });
}

export function useStatsQuery(): UseQueryResult<TravelStats> {
  return useQuery({
    queryKey: directusQueryKeys.stats,
    queryFn: fetchStats,
  });
}

export function useDirectusHealthQuery(): UseQueryResult<{ status: string }> {
  return useQuery({
    queryKey: directusQueryKeys.health,
    queryFn: pingDirectus,
  });
}

export function useCreatePostMutation(): UseMutationResult<Post, Error, { token: string; data: CreatePostBody }> {
  return useMutation({
    mutationFn: ({ token, data }) => createPostWithToken(token, data),
  });
}

export function useUpdatePostMutation(): UseMutationResult<
  Post,
  Error,
  { token: string; id: number; data: UpdatePostBody }
> {
  return useMutation({
    mutationFn: ({ token, id, data }) => updatePostWithToken(token, id, data),
  });
}

export function useDeletePostMutation(): UseMutationResult<void, Error, { token: string; id: number }> {
  return useMutation({
    mutationFn: ({ token, id }) => deletePostWithToken(token, id),
  });
}

export function useCreateTripMutation(): UseMutationResult<Trip, Error, { token: string; data: CreateTripBody }> {
  return useMutation({
    mutationFn: ({ token, data }) => createTripWithToken(token, data),
  });
}

export function useCreateJourneyMutation(): UseMutationResult<Journey, Error, { token: string; data: CreateJourneyBody }> {
  return useMutation({
    mutationFn: ({ token, data }) => createJourneyWithToken(token, data),
  });
}

export function useUpdateJourneyMutation(): UseMutationResult<
  Journey,
  Error,
  { token: string; id: number; data: UpdateJourneyBody }
> {
  return useMutation({
    mutationFn: ({ token, id, data }) => updateJourneyWithToken(token, id, data),
  });
}

export function useDeleteJourneyMutation(): UseMutationResult<void, Error, { token: string; id: number }> {
  return useMutation({
    mutationFn: ({ token, id }) => deleteJourneyWithToken(token, id),
  });
}

export function useUpdateTripMutation(): UseMutationResult<
  Trip,
  Error,
  { token: string; id: number; data: UpdateTripBody }
> {
  return useMutation({
    mutationFn: ({ token, id, data }) => updateTripWithToken(token, id, data),
  });
}

export function useDeleteTripMutation(): UseMutationResult<void, Error, { token: string; id: number }> {
  return useMutation({
    mutationFn: ({ token, id }) => deleteTripWithToken(token, id),
  });
}

export function useCreatePhotoMutation(): UseMutationResult<Photo, Error, { token: string; data: CreatePhotoBody }> {
  return useMutation({
    mutationFn: ({ token, data }) => createPhotoWithToken(token, data),
  });
}

export function useUpdatePhotoMutation(): UseMutationResult<
  Photo,
  Error,
  { token: string; id: number; data: UpdatePhotoBody }
> {
  return useMutation({
    mutationFn: ({ token, id, data }) => updatePhotoWithToken(token, id, data),
  });
}

export function useDeletePhotoMutation(): UseMutationResult<void, Error, { token: string; id: number }> {
  return useMutation({
    mutationFn: ({ token, id }) => deletePhotoWithToken(token, id),
  });
}

export function useCreateMediaAssetMutation(): UseMutationResult<
  MediaAsset,
  Error,
  { token: string; data: CreateMediaAssetBody }
> {
  return useMutation({
    mutationFn: ({ token, data }) => createMediaAssetWithToken(token, data),
  });
}

export function useUpdateMediaAssetMutation(): UseMutationResult<
  MediaAsset,
  Error,
  { token: string; id: number; data: UpdateMediaAssetBody }
> {
  return useMutation({
    mutationFn: ({ token, id, data }) => updateMediaAssetWithToken(token, id, data),
  });
}

export function useDeleteMediaAssetMutation(): UseMutationResult<
  void,
  Error,
  { token: string; id: number }
> {
  return useMutation({
    mutationFn: ({ token, id }) => deleteMediaAssetWithToken(token, id),
  });
}
