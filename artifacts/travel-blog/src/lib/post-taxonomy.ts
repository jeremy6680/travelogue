import type { Post, Trip } from "@/lib/travel-types";

type PostsBrowseState = {
  countries: string[];
  tags: string[];
  tripId: number | null;
  page: number;
};

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

export function normalizeTagList(
  value: string[] | string | null | undefined,
): string[] {
  if (Array.isArray(value)) {
    return uniqueStrings(
      value.map((entry) => entry.trim()).filter(Boolean),
    );
  }

  if (typeof value !== "string") {
    return [];
  }

  return uniqueStrings(
    value
      .split(/[\n,]/)
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

export function getPostCountryCode(post: Post, trips: Trip[]) {
  const linkedTrip = trips.find((trip) => trip.id === post.tripId);
  return (linkedTrip?.countryCode ?? post.countryCode ?? "").toUpperCase() || null;
}

export function getPostTrip(post: Post, trips: Trip[]) {
  return trips.find((trip) => trip.id === post.tripId) ?? null;
}

export function sortPostsByPublishedDate(posts: Post[]) {
  return [...posts].sort((left, right) => {
    const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
    const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return right.id - left.id;
  });
}

export function parsePostsBrowseState(search: string): PostsBrowseState {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const page = Number(params.get("page") ?? "1");

  return {
    countries: (params.get("countries") ?? "")
      .split(",")
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean),
    tags: (params.get("tags") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    tripId: params.get("trip") ? Number(params.get("trip")) : null,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function buildPostsBrowseHref(state: Partial<PostsBrowseState>) {
  const params = new URLSearchParams();

  if (state.countries && state.countries.length > 0) {
    params.set("countries", uniqueStrings(state.countries.map((value) => value.toUpperCase())).join(","));
  }

  if (state.tags && state.tags.length > 0) {
    params.set("tags", uniqueStrings(state.tags).join(","));
  }

  if (state.tripId != null) {
    params.set("trip", String(state.tripId));
  }

  if (state.page && state.page > 1) {
    params.set("page", String(state.page));
  }

  const query = params.toString();
  return query ? `/posts?${query}` : "/posts";
}

export function getHomeFeaturedPosts(posts: Post[], limit = 3) {
  const sortedByDate = sortPostsByPublishedDate(
    posts.filter((post) => Boolean(post.publishedAt)),
  );

  const featured = [...sortedByDate]
    .filter((post) => post.featuredOnHome)
    .sort((left, right) => {
      const leftOrder = left.featuredHomeOrder ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.featuredHomeOrder ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
      const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;

      if (rightTime !== leftTime) {
        return rightTime - leftTime;
      }

      return right.id - left.id;
    });

  if (featured.length >= limit) {
    return featured.slice(0, limit);
  }

  const featuredIds = new Set(featured.map((post) => post.id));
  const fallback = sortedByDate.filter((post) => !featuredIds.has(post.id));

  return [...featured, ...fallback].slice(0, limit);
}
