import type { MapPin, Post } from "@/lib/travel-types";

type PostLike =
  | Pick<Post, "slug" | "externalUrl">
  | Pick<MapPin, "href">;

function normalizeExternalUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (/^[a-z]+:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

export function getPostHref(post: PostLike) {
  if ("href" in post) {
    return post.href ?? "#";
  }

  return normalizeExternalUrl(post.externalUrl) ?? `/posts/${post.slug}`;
}

export function isExternalPost(post: PostLike) {
  const href =
    "href" in post
      ? post.href
      : normalizeExternalUrl(post.externalUrl) ?? `/posts/${post.slug}`;

  return Boolean(href && /^[a-z]+:\/\//i.test(href));
}
