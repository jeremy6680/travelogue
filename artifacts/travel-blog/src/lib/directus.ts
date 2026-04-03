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
  CreatePhotoBody,
  CreatePostBody,
  CreateTripBody,
  GalleryImage,
  MapPin,
  Photo,
  Post,
  TravelStats,
  Trip,
  UpdatePhotoBody,
  UpdatePostBody,
  UpdateTripBody,
} from "@/lib/travel-types";

type DirectusGalleryImage = GalleryImage;

type DirectusPost = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image_url: string | null;
  gallery: DirectusGalleryImage[] | null;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  trip_id: number | null;
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
  travel_companions: string;
  friends_family_met: string;
  visited_at: string;
  visited_until: string | null;
  latitude: number | null;
  longitude: number | null;
  transportation_to: string[] | string | null;
  transportation_on_site: string[] | string | null;
  created_at: string;
  updated_at: string;
};

type DirectusPhoto = {
  id: number;
  url: string;
  caption: string | null;
  link: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type DirectusSchema = {
  posts: DirectusPost[];
  trips: DirectusTrip[];
  photos: DirectusPhoto[];
};

const continentMap: Record<string, string[]> = {
  EU: ["FR", "DE", "IT", "ES", "PT", "NL", "BE", "CH", "AT", "PL", "CZ", "HU", "SE", "NO", "DK", "FI", "GR", "HR", "RO", "BG"],
  NA: ["US", "CA", "MX", "CU", "JM", "HT", "DO", "GT", "BZ", "HN", "SV", "NI", "CR", "PA"],
  SA: ["BR", "AR", "CL", "CO", "PE", "VE", "EC", "BO", "PY", "UY", "GY", "SR"],
  AS: ["JP", "CN", "IN", "KR", "TH", "VN", "ID", "MY", "SG", "PH", "TW", "HK", "AE", "TR", "IL", "JO", "LB"],
  AF: ["ZA", "NG", "KE", "ET", "EG", "MA", "TZ", "GH", "SN", "TN"],
  OC: ["AU", "NZ", "FJ", "PG"],
};

const directus = createDirectus<DirectusSchema>(
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8055",
).with(rest());

export const directusQueryKeys = {
  posts: ["directus", "posts"] as const,
  postBySlug: (slug: string | undefined) => ["directus", "posts", slug] as const,
  trips: ["directus", "trips"] as const,
  photos: ["directus", "photos"] as const,
  mapPins: ["directus", "map-pins"] as const,
  stats: ["directus", "stats"] as const,
  health: ["directus", "health"] as const,
};

function mapPost(post: DirectusPost): Post {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    coverImageUrl: post.cover_image_url,
    gallery: post.gallery,
    latitude: post.latitude,
    longitude: post.longitude,
    location: post.location,
    tripId: post.trip_id,
    publishedAt: post.published_at,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
  };
}

function normalizeMultiSelect(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function mapTrip(trip: DirectusTrip): Trip {
  return {
    id: trip.id,
    name: trip.name,
    countryCode: trip.country_code,
    visitedCities: trip.visited_cities,
    accomodation: normalizeMultiSelect(trip.accomodation),
    reasonForVisit: trip.reason_for_visit,
    travelCompanions: trip.travel_companions,
    friendsFamilyMet: trip.friends_family_met,
    visitedAt: trip.visited_at,
    visitedUntil: trip.visited_until,
    latitude: trip.latitude,
    longitude: trip.longitude,
    transportationTo: normalizeMultiSelect(trip.transportation_to),
    transportationOnSite: normalizeMultiSelect(trip.transportation_on_site),
    createdAt: trip.created_at,
    updatedAt: trip.updated_at,
  };
}

function mapPhoto(photo: DirectusPhoto): Photo {
  return {
    id: photo.id,
    url: photo.url,
    caption: photo.caption,
    link: photo.link,
    displayOrder: photo.display_order,
    createdAt: photo.created_at,
    updatedAt: photo.updated_at,
  };
}

function mapPin(post: Post): MapPin {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImageUrl: post.coverImageUrl,
    latitude: post.latitude ?? 0,
    longitude: post.longitude ?? 0,
    location: post.location,
    publishedAt: post.publishedAt,
  };
}

function buildStats(trips: Trip[], posts: Post[]): TravelStats {
  const visitedContinents = new Set<string>();

  for (const trip of trips) {
    for (const [continent, codes] of Object.entries(continentMap)) {
      if (codes.includes(trip.countryCode.toUpperCase())) {
        visitedContinents.add(continent);
        break;
      }
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
    content: data.content,
    excerpt: data.excerpt,
    cover_image_url: data.coverImageUrl,
    gallery: data.gallery,
    latitude: data.latitude,
    longitude: data.longitude,
    location: data.location,
    trip_id: data.tripId,
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
    travel_companions: data.travelCompanions,
    friends_family_met: data.friendsFamilyMet,
    visited_at: data.visitedAt,
    visited_until: data.visitedUntil,
    latitude: data.latitude,
    longitude: data.longitude,
    transportation_to: normalizeMultiSelect(data.transportationTo),
    transportation_on_site: normalizeMultiSelect(data.transportationOnSite),
  };
}

function mapCreatePhotoInput(data: CreatePhotoBody | UpdatePhotoBody) {
  return {
    url: data.url,
    caption: data.caption,
    link: data.link,
    display_order: data.displayOrder,
  };
}

export async function fetchPosts(): Promise<Post[]> {
  const posts = await directus.request(
    readItems("posts", {
      sort: ["created_at"],
      fields: [
        "id",
        "title",
        "slug",
        "content",
        "excerpt",
        "cover_image_url",
        "gallery",
        "latitude",
        "longitude",
        "location",
        "trip_id",
        "published_at",
        "created_at",
        "updated_at",
      ],
      limit: -1,
    }),
  );

  return posts.map(mapPost);
}

export async function fetchTrips(): Promise<Trip[]> {
  const trips = await directus.request(
    readItems("trips", {
      sort: ["visited_at"],
      fields: [
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
        "transportation_to",
        "transportation_on_site",
        "created_at",
        "updated_at",
      ],
      limit: -1,
    }),
  );

  return trips.map(mapTrip);
}

export async function fetchPhotos(): Promise<Photo[]> {
  const photos = await directus.request(
    readItems("photos", {
      sort: ["display_order", "created_at"],
      fields: ["id", "url", "caption", "link", "display_order", "created_at", "updated_at"],
      limit: -1,
    }),
  );

  return photos.map(mapPhoto);
}

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const posts = await directus.request(
    readItems("posts", {
      filter: { slug: { _eq: slug } },
      fields: [
        "id",
        "title",
        "slug",
        "content",
        "excerpt",
        "cover_image_url",
        "gallery",
        "latitude",
        "longitude",
        "location",
        "trip_id",
        "published_at",
        "created_at",
        "updated_at",
      ],
      limit: 1,
    }),
  );

  return posts[0] ? mapPost(posts[0]) : null;
}

export async function fetchMapPins(): Promise<MapPin[]> {
  const posts = await directus.request(
    readItems("posts", {
      filter: {
        _and: [
          { latitude: { _nnull: true } },
          { longitude: { _nnull: true } },
        ],
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
  );

  return posts.map(mapPost).map(mapPin);
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
        fields: [
          "id",
          "title",
          "slug",
          "content",
          "excerpt",
          "cover_image_url",
          "gallery",
          "latitude",
          "longitude",
          "location",
          "trip_id",
          "published_at",
          "created_at",
          "updated_at",
        ],
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
        fields: [
          "id",
          "title",
          "slug",
          "content",
          "excerpt",
          "cover_image_url",
          "gallery",
          "latitude",
          "longitude",
          "location",
          "trip_id",
          "published_at",
          "created_at",
          "updated_at",
        ],
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
        fields: [
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
          "transportation_to",
          "transportation_on_site",
          "created_at",
          "updated_at",
        ],
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
        fields: [
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
          "transportation_to",
          "transportation_on_site",
          "created_at",
          "updated_at",
        ],
      }),
    ),
  );

  return mapTrip(trip);
}

export async function deleteTripWithToken(token: string, id: number): Promise<void> {
  await directus.request(withToken(token, deleteItem("trips", id)));
}

export async function createPhotoWithToken(token: string, data: CreatePhotoBody): Promise<Photo> {
  const photo = await directus.request(
    withToken(
      token,
      createItem("photos", mapCreatePhotoInput(data), {
        fields: ["id", "url", "caption", "link", "display_order", "created_at", "updated_at"],
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
        fields: ["id", "url", "caption", "link", "display_order", "created_at", "updated_at"],
      }),
    ),
  );

  return mapPhoto(photo);
}

export async function deletePhotoWithToken(token: string, id: number): Promise<void> {
  await directus.request(withToken(token, deleteItem("photos", id)));
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

export function usePhotosQuery(): UseQueryResult<Photo[]> {
  return useQuery({
    queryKey: directusQueryKeys.photos,
    queryFn: fetchPhotos,
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
