import { Router, Response } from "express";
import { AuthRequest, requireAuth } from "../middlewares/auth";
import { db, usersTable, generationsTable } from "@workspace/db";
import { eq, count, sum, max, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { UpdateUserProfileBody } from "@workspace/api-zod";

const router = Router();

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  starter: 200,
  creator: 1000,
  pro_clone: 99999,
};

// GET /user/profile
router.get("/user/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Error fetching profile");
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PATCH /user/profile
router.patch("/user/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = UpdateUserProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const userId = req.userId!;
  const updates: Record<string, string | undefined> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.avatarUrl !== undefined) updates.avatarUrl = parsed.data.avatarUrl;

  try {
    const [updated] = await db.update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, userId))
      .returning();

    res.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      plan: updated.plan,
      avatarUrl: updated.avatarUrl,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Error updating profile");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// GET /user/credits
router.get("/user/credits", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const plan = user.plan;
    const limit = user.creditsLimit ?? PLAN_LIMITS[plan] ?? 10;

    res.json({
      plan,
      creditsUsed: user.creditsUsed,
      creditsLimit: limit,
      resetsAt: null,
      canUseXtts: plan === "pro_clone",
      canDownloadWav: ["creator", "pro_clone"].includes(plan),
    });
  } catch (err) {
    logger.error({ err }, "Error fetching credits");
    res.status(500).json({ error: "Failed to fetch credits" });
  }
});

// GET /user/stats
router.get("/user/stats", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalResult, todayResult, durationResult, favoriteResult, lastResult] = await Promise.all([
      db.select({ total: count() }).from(generationsTable).where(eq(generationsTable.userId, userId)),
      db.select({ total: count() }).from(generationsTable)
        .where(sql`${generationsTable.userId} = ${userId} AND ${generationsTable.createdAt} >= ${today}`),
      db.select({ total: sum(generationsTable.duration) }).from(generationsTable).where(eq(generationsTable.userId, userId)),
      db.select({ voiceId: generationsTable.voiceId, cnt: count() })
        .from(generationsTable)
        .where(eq(generationsTable.userId, userId))
        .groupBy(generationsTable.voiceId)
        .orderBy(sql`count(*) desc`)
        .limit(1),
      db.select({ lastAt: max(generationsTable.createdAt) }).from(generationsTable).where(eq(generationsTable.userId, userId)),
    ]);

    res.json({
      totalGenerations: totalResult[0].total,
      todayGenerations: todayResult[0].total,
      totalDuration: Number(durationResult[0].total ?? 0),
      favoriteVoice: favoriteResult[0]?.voiceId ?? null,
      lastGeneratedAt: lastResult[0]?.lastAt?.toISOString() ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Error fetching stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
