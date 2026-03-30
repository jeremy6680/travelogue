import { Router, type IRouter } from "express";
import { eq, and, isNotNull } from "drizzle-orm";
import { db, postsTable } from "@workspace/db";
import {
  CreatePostBody,
  UpdatePostBody,
  GetPostParams,
  UpdatePostParams,
  DeletePostParams,
  ListPostsResponse,
  GetPostResponse,
  UpdatePostResponse,
  ListMapPinsResponse,
} from "@workspace/api-zod";

function serializePost(post: Record<string, unknown>) {
  return {
    ...post,
    createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt,
    updatedAt: post.updatedAt instanceof Date ? post.updatedAt.toISOString() : post.updatedAt,
  };
}

const router: IRouter = Router();

router.get("/posts", async (_req, res): Promise<void> => {
  const posts = await db.select().from(postsTable).orderBy(postsTable.createdAt);
  res.json(ListPostsResponse.parse(posts.map(serializePost)));
});

router.post("/posts", async (req, res): Promise<void> => {
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [post] = await db.insert(postsTable).values(parsed.data).returning();
  res.status(201).json(GetPostResponse.parse(serializePost(post as unknown as Record<string, unknown>)));
});

router.get("/map-pins", async (_req, res): Promise<void> => {
  const posts = await db
    .select({
      id: postsTable.id,
      title: postsTable.title,
      slug: postsTable.slug,
      excerpt: postsTable.excerpt,
      coverImageUrl: postsTable.coverImageUrl,
      latitude: postsTable.latitude,
      longitude: postsTable.longitude,
      location: postsTable.location,
      publishedAt: postsTable.publishedAt,
    })
    .from(postsTable)
    .where(and(isNotNull(postsTable.latitude), isNotNull(postsTable.longitude)));

  res.json(ListMapPinsResponse.parse(posts));
});

router.get("/posts/:id", async (req, res): Promise<void> => {
  const params = GetPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, params.data.id));
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json(GetPostResponse.parse(serializePost(post as unknown as Record<string, unknown>)));
});

router.patch("/posts/:id", async (req, res): Promise<void> => {
  const params = UpdatePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [post] = await db.update(postsTable).set(parsed.data).where(eq(postsTable.id, params.data.id)).returning();
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json(UpdatePostResponse.parse(serializePost(post as unknown as Record<string, unknown>)));
});

router.delete("/posts/:id", async (req, res): Promise<void> => {
  const params = DeletePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [post] = await db.delete(postsTable).where(eq(postsTable.id, params.data.id)).returning();
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
