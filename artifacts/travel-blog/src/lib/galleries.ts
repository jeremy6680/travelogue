/**
 * galleries.ts — fetcher + React Query hook for jeysblog gallery data.
 *
 * Galleries are NOT stored in Directus. They are fetched live from the
 * jeysblog API endpoint using the slug as the only shared key.
 *
 * API shape (from jeysblog /api/galleries/[slug].json):
 *   { slug, title, date, excerpt, images: [{ publicId, alt, width, height }], sourceUrl }
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

const JEYSBLOG_URL = import.meta.env.VITE_JEYSBLOG_URL as string;
const CLOUDINARY_CLOUD = "dylqfjiax";

// --- Types ---

export interface GalleryImage {
  /** Cloudinary public_id, e.g. "IMG_8433_2_kdm6ub" */
  publicId: string;
  /** Alt text (may be empty string) */
  alt: string;
  /** Original width in pixels — used to compute aspect ratio placeholder */
  width: number;
  /** Original height in pixels */
  height: number;
  /** Thumbnail URL (600px wide, cropped to square) */
  thumbnailUrl: string;
  /** Full-size URL for lightbox (max 1600px wide) */
  fullUrl: string;
}

export interface Gallery {
  slug: string;
  title: string;
  /** ISO date string or null */
  date: string | null;
  excerpt: string | null;
  images: GalleryImage[];
  /** Canonical URL of the gallery page on jeysblog */
  sourceUrl: string;
}

// --- Cloudinary URL builder ---

/**
 * Builds an optimized Cloudinary image URL.
 * Always applies f_auto (best format) and q_auto (best quality) compression.
 */
function buildCloudinaryUrl(publicId: string, transformation: string): string {
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${transformation}/f_auto/q_auto/v1/${publicId}`;
}

// --- API fetcher ---

/**
 * Fetches a single gallery from the jeysblog JSON endpoint.
 * Throws a typed error on 404 or network failure.
 */
export async function fetchGallery(slug: string): Promise<Gallery> {
  const url = `${JEYSBLOG_URL}/api/galleries/${slug}.json`;
  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Gallery "${slug}" not found`);
    }
    throw new Error(`Failed to fetch gallery: HTTP ${res.status}`);
  }

  const data = await res.json();

  // Map raw API payload to typed GalleryImage objects, adding Cloudinary URLs
  const images: GalleryImage[] = data.images.map(
    (img: { publicId: string; alt: string; width: number; height: number }) => ({
      publicId: img.publicId,
      alt: img.alt,
      width: img.width,
      height: img.height,
      thumbnailUrl: buildCloudinaryUrl(img.publicId, "c_fill,w_600,h_600,g_auto"),
      fullUrl: buildCloudinaryUrl(img.publicId, "c_limit,w_1600"),
    }),
  );

  return {
    slug: data.slug,
    title: data.title,
    date: data.date ?? null,
    excerpt: data.excerpt ?? null,
    images,
    sourceUrl: data.sourceUrl,
  };
}

// --- React Query key factory ---

export const galleryQueryKeys = {
  detail: (slug: string) => ["galleries", slug] as const,
};

// --- React Query hook ---

/**
 * Fetches a gallery by slug.
 * Data is considered fresh for 10 minutes — galleries change rarely.
 */
export function useGalleryQuery(slug: string | undefined): UseQueryResult<Gallery> {
  return useQuery({
    queryKey: galleryQueryKeys.detail(slug ?? ""),
    queryFn: () => fetchGallery(slug!),
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  });
}
