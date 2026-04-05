import type { MapPin, Post } from "@/lib/travel-types";

type PostLike =
  | Pick<Post, "slug" | "externalUrl">
  | Pick<MapPin, "slug" | "externalUrl">;

export function getPostHref(post: PostLike) {
  return post.externalUrl ?? `/posts/${post.slug}`;
}

export function isExternalPost(post: PostLike) {
  return Boolean(post.externalUrl);
}
