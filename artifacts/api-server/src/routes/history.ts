import { Router, Response } from "express";
import { AuthRequest, requireAuth } from "../middlewares/auth";
import { db, generationsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import { logger } from "../lib/logger";
import { SaveHistoryBody, ListHistoryQueryParams, DeleteHistoryParams } from "@workspace/api-zod";

const router = Router();

// GET /history
router.get("/history", requireAuth, async (req: AuthRequest, res: Response) => {
  const query = ListHistoryQueryParams.safeParse(req.query);
  const page = query.success ? (query.data.page ?? 1) : 1;
  const limit = query.success ? (query.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;
  const userId = req.userId!;

  try {
    const [items, totalResult] = await Promise.all([
      db.select().from(generationsTable)
        .where(eq(generationsTable.userId, userId))
        .orderBy(desc(generationsTable.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(generationsTable)
        .where(eq(generationsTable.userId, userId)),
    ]);

    res.json({
      items: items.map(g => ({
        id: g.id,
        text: g.text,
        audioUrl: g.audioUrl,
        engine: g.engine,
        duration: g.duration ? Number(g.duration) : null,
        voiceId: g.voiceId,
        createdAt: g.createdAt.toISOString(),
      })),
      total: totalResult[0].total,
      page,
      limit,
    });
  } catch (err) {
    logger.error({ err }, "Error fetching history");
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// POST /history
router.post("/history", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = SaveHistoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { text, audioUrl, engine, duration, voiceId } = parsed.data;
  const userId = req.userId!;
  const id = randomUUID();

  try {
    const [inserted] = await db.insert(generationsTable).values({
      id,
      userId,
      text,
      audioUrl,
      engine,
      voiceId: voiceId ?? null,
      duration: duration != null ? String(duration) : null,
    }).returning();

    res.status(201).json({
      id: inserted.id,
      text: inserted.text,
      audioUrl: inserted.audioUrl,
      engine: inserted.engine,
      duration: inserted.duration ? Number(inserted.duration) : null,
      voiceId: inserted.voiceId,
      createdAt: inserted.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Error saving history");
    res.status(500).json({ error: "Failed to save history" });
  }
});

// DELETE /history/:id
router.delete("/history/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const params = DeleteHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const userId = req.userId!;
  try {
    await db.delete(generationsTable)
      .where(eq(generationsTable.id, params.data.id));
    res.status(204).send();
  } catch (err) {
    logger.error({ err }, "Error deleting history");
    res.status(500).json({ error: "Failed to delete history item" });
  }
});

export default router;
