import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, photosTable } from "@workspace/db";
import {
  CreatePhotoBody,
  UpdatePhotoBody,
  UpdatePhotoParams,
  DeletePhotoParams,
  ListPhotosResponse,
  UpdatePhotoResponse,
} from "@workspace/api-zod";
import { requireAdminAuth } from "../middlewares/admin-auth";

function serializePhoto(photo: Record<string, unknown>) {
  return {
    ...photo,
    createdAt: photo.createdAt instanceof Date ? photo.createdAt.toISOString() : photo.createdAt,
    updatedAt: photo.updatedAt instanceof Date ? photo.updatedAt.toISOString() : photo.updatedAt,
  };
}

const router: IRouter = Router();

router.get("/photos", async (_req, res): Promise<void> => {
  const photos = await db.select().from(photosTable).orderBy(asc(photosTable.displayOrder), asc(photosTable.createdAt));
  res.json(ListPhotosResponse.parse(photos.map(serializePhoto)));
});

router.post("/photos", requireAdminAuth, async (req, res): Promise<void> => {
  const parsed = CreatePhotoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [photo] = await db.insert(photosTable).values(parsed.data).returning();
  res.status(201).json(UpdatePhotoResponse.parse(serializePhoto(photo as unknown as Record<string, unknown>)));
});

router.patch("/photos/:id", requireAdminAuth, async (req, res): Promise<void> => {
  const params = UpdatePhotoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePhotoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [photo] = await db.update(photosTable).set(parsed.data).where(eq(photosTable.id, params.data.id)).returning();
  if (!photo) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }
  res.json(UpdatePhotoResponse.parse(serializePhoto(photo as unknown as Record<string, unknown>)));
});

router.delete("/photos/:id", requireAdminAuth, async (req, res): Promise<void> => {
  const params = DeletePhotoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [photo] = await db.delete(photosTable).where(eq(photosTable.id, params.data.id)).returning();
  if (!photo) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
