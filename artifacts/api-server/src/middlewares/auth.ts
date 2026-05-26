import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export interface AuthRequest extends Request {
  userId?: string;
  userPlan?: string;
  isAdmin?: boolean;
}

/**
 * Check Supabase profiles.role for admin status.
 * This keeps admin in sync — set role='admin' in profiles and it works immediately.
 */
async function checkAdminFromSupabase(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    if (error || !data) return false;
    return data.role === "admin";
  } catch {
    return false;
  }
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  req.userId = data.user.id;

  try {
    // Sync admin status from Supabase profiles.role (source of truth)
    const isAdminFromSupabase = await checkAdminFromSupabase(data.user.id);

    await db.insert(usersTable).values({
      id: data.user.id,
      email: data.user.email ?? "",
      plan: "free",
      creditsUsed: 0,
      creditsLimit: 10,
      isAdmin: isAdminFromSupabase,
    }).onConflictDoUpdate({
      target: usersTable.id,
      set: {
        email: data.user.email ?? "",
        isAdmin: isAdminFromSupabase,  // ← always sync on login
      },
    });

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, data.user.id)).limit(1);
    req.userPlan = user?.plan ?? "free";
    req.isAdmin = isAdminFromSupabase;
  } catch (err) {
    logger.error({ err }, "Error upserting user");
    req.userPlan = "free";
    req.isAdmin = false;
  }

  next();
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    if (!req.isAdmin) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}
