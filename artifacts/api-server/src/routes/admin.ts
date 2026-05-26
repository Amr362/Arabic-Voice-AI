import { Router, Response } from "express";
import { AuthRequest, requireAdmin } from "../middlewares/auth";
import { db, usersTable, generationsTable } from "@workspace/db";
import { desc, count, sql, eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { UpdateUserSubscriptionBody, UpdateUserSubscriptionParams, ListAdminUsersQueryParams, ListAdminGenerationsQueryParams } from "@workspace/api-zod";

const router = Router();

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  starter: 200,
  creator: 1000,
  pro_clone: 99999,
};

// GET /admin/stats
router.get("/admin/stats", requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, totalGens, todayGens, planCounts] = await Promise.all([
      db.select({ total: count() }).from(usersTable),
      db.select({ total: count() }).from(generationsTable),
      db.select({ total: count() }).from(generationsTable)
        .where(sql`${generationsTable.createdAt} >= ${today}`),
      db.select({ plan: usersTable.plan, cnt: count() })
        .from(usersTable)
        .groupBy(usersTable.plan),
    ]);

    const planMap: Record<string, number> = {};
    planCounts.forEach(p => { planMap[p.plan] = p.cnt; });

    const activeSubscriptions = (planMap.starter ?? 0) + (planMap.creator ?? 0) + (planMap.pro_clone ?? 0);
    const freeUsers = planMap.free ?? 0;

    res.json({
      totalUsers: totalUsers[0].total,
      totalGenerations: totalGens[0].total,
      todayGenerations: todayGens[0].total,
      activeSubscriptions,
      freeUsers,
      revenueThisMonth: 0,
    });
  } catch (err) {
    logger.error({ err }, "Error fetching admin stats");
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

// GET /admin/users
router.get("/admin/users", requireAdmin, async (req: AuthRequest, res: Response) => {
  const query = ListAdminUsersQueryParams.safeParse(req.query);
  const page = query.success ? (query.data.page ?? 1) : 1;
  const limit = query.success ? (query.data.limit ?? 50) : 50;
  const offset = (page - 1) * limit;

  try {
    const [users, totalResult] = await Promise.all([
      db.select().from(usersTable)
        .orderBy(desc(usersTable.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(usersTable),
    ]);

    res.json({
      items: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        plan: u.plan,
        totalGenerations: 0,
        creditsUsed: u.creditsUsed,
        createdAt: u.createdAt.toISOString(),
      })),
      total: totalResult[0].total,
      page,
      limit,
    });
  } catch (err) {
    logger.error({ err }, "Error fetching admin users");
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// PATCH /admin/users/:id/subscription
router.patch("/admin/users/:id/subscription", requireAdmin, async (req: AuthRequest, res: Response) => {
  const params = UpdateUserSubscriptionParams.safeParse(req.params);
  const body = UpdateUserSubscriptionBody.safeParse(req.body);

  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { id } = params.data;
  const { plan, creditsLimit } = body.data;
  const newLimit = creditsLimit ?? PLAN_LIMITS[plan] ?? 10;

  try {
    const [updated] = await db.update(usersTable)
      .set({ plan, creditsLimit: newLimit, creditsUsed: 0 })
      .where(eq(usersTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      plan: updated.plan,
      totalGenerations: 0,
      creditsUsed: updated.creditsUsed,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Error updating subscription");
    res.status(500).json({ error: "Failed to update subscription" });
  }
});

// GET /admin/generations
router.get("/admin/generations", requireAdmin, async (req: AuthRequest, res: Response) => {
  const query = ListAdminGenerationsQueryParams.safeParse(req.query);
  const page = query.success ? (query.data.page ?? 1) : 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const [items, totalResult] = await Promise.all([
      db.select().from(generationsTable)
        .orderBy(desc(generationsTable.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(generationsTable),
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
    });
  } catch (err) {
    logger.error({ err }, "Error fetching admin generations");
    res.status(500).json({ error: "Failed to fetch generations" });
  }
});

export default router;
