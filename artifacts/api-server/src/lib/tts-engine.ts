import { createHash } from "crypto";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { db, generationsTable, usersTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { generateEdgeTts } from "./edge-tts";
import { generateHfFallbackTts } from "./hf-tts-fallback";
import { logger } from "./logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EngineUsed = "railway" | "hf-fallback" | "cached";

export interface TtsRequest {
  text: string;
  voiceId: string;
  speed: number;
  pitch: number;
  userId: string;
  plan: string;
}

export interface TtsResult {
  audioUrl: string;
  engine: string;
  engineUsed: EngineUsed;
  fromCache: boolean;
  duration: number | null;
  text: string;
  historyId: string | null;
}

// ---------------------------------------------------------------------------
// Supabase storage
// ---------------------------------------------------------------------------

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function uploadAudio(buf: Buffer, filename: string, contentType: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from("generations")
    .upload(`audio/${filename}`, buf, { contentType, upsert: false });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  return supabaseAdmin.storage.from("generations").getPublicUrl(data.path).data.publicUrl;
}

// ---------------------------------------------------------------------------
// Cache key
// ---------------------------------------------------------------------------

function makeCacheKey(text: string, voiceId: string, speed: number, pitch: number): string {
  return createHash("sha256")
    .update(`${text}|${voiceId}|${speed.toFixed(2)}|${pitch}`)
    .digest("hex");
}

// ---------------------------------------------------------------------------
// Credits
// ---------------------------------------------------------------------------

const PLAN_LIMITS: Record<string, { limit: number; maxLength: number }> = {
  free:      { limit: 10,    maxLength: 600 },
  starter:   { limit: 200,   maxLength: 5000 },
  creator:   { limit: 1000,  maxLength: 5000 },
  pro_clone: { limit: 99999, maxLength: 5000 },
};

export async function checkCredits(userId: string, plan: string): Promise<{ ok: boolean; error?: string }> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return { ok: false, error: "User not found" };
  if (user.creditsUsed >= (user.creditsLimit ?? PLAN_LIMITS[plan]?.limit ?? 10)) {
    return { ok: false, error: "Credit limit reached. Please upgrade your plan." };
  }
  return { ok: true };
}

export function getMaxLength(plan: string): number {
  return PLAN_LIMITS[plan]?.maxLength ?? 600;
}

async function incrementCredits(userId: string) {
  await db.update(usersTable)
    .set({ creditsUsed: sql`${usersTable.creditsUsed} + 1` })
    .where(eq(usersTable.id, userId));
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export async function generateSpeech(req: TtsRequest): Promise<TtsResult> {
  const { text, voiceId, speed, pitch, userId, plan } = req;
  const t0 = Date.now();

  // ── 1. Cache check ───────────────────────────────────────────────────────
  const cacheKey = makeCacheKey(text, voiceId, speed, pitch);

  const [cached] = await db
    .select()
    .from(generationsTable)
    .where(eq(generationsTable.cacheKey, cacheKey))
    .limit(1);

  if (cached) {
    logger.info({ cacheKey: cacheKey.slice(0, 8), historyId: cached.id }, "TTS cache hit — serving cached audio");
    return {
      audioUrl: cached.audioUrl,
      engine: cached.engine,
      engineUsed: "cached",
      fromCache: true,
      duration: cached.duration !== null ? Number(cached.duration) : null,
      text,
      historyId: cached.id,
    };
  }

  // ── 2. Generate audio (Railway → HF fallback) ────────────────────────────
  let audioBuffer: Buffer;
  let engineUsed: EngineUsed;
  let contentType = "audio/mpeg";

  // Try Railway Edge-TTS first
  try {
    audioBuffer = await generateEdgeTts(text, voiceId, speed, pitch);
    engineUsed = "railway";
    logger.info({ ms: Date.now() - t0 }, "Engine: railway (primary)");
  } catch (railwayErr) {
    logger.warn({ railwayErr, ms: Date.now() - t0 }, "Railway TTS failed — activating HF fallback");

    try {
      audioBuffer = await generateHfFallbackTts(text);
      engineUsed = "hf-fallback";
      contentType = "audio/flac";
      logger.info({ ms: Date.now() - t0 }, "Engine: hf-fallback (fallback)");
    } catch (hfErr) {
      logger.error({ railwayErr, hfErr, ms: Date.now() - t0 }, "Both TTS engines failed");
      throw new Error("Both TTS engines unavailable. Please try again in a moment.");
    }
  }

  // ── 3. Upload audio ───────────────────────────────────────────────────────
  const ext = contentType === "audio/flac" ? "flac" : "mp3";
  const filename = `${randomUUID()}.${ext}`;

  let audioUrl: string;
  try {
    audioUrl = await uploadAudio(audioBuffer, filename, contentType);
  } catch (uploadErr) {
    logger.warn({ uploadErr }, "Supabase upload failed — using base64 data URL fallback");
    audioUrl = `data:${contentType};base64,${audioBuffer.toString("base64")}`;
  }

  // ── 4. Increment credits ─────────────────────────────────────────────────
  await incrementCredits(userId);

  // ── 5. Persist to DB ─────────────────────────────────────────────────────
  const historyId = randomUUID();
  try {
    await db.insert(generationsTable).values({
      id: historyId,
      userId,
      text,
      audioUrl,
      engine: engineUsed,
      voiceId,
      duration: null,
      cacheKey,
    });
  } catch (dbErr) {
    logger.warn({ dbErr }, "Could not save generation to DB");
  }

  logger.info({
    engineUsed,
    ms: Date.now() - t0,
    plan,
    textLen: text.length,
    fromCache: false,
  }, "TTS generation complete");

  return {
    audioUrl,
    engine: engineUsed,
    engineUsed,
    fromCache: false,
    duration: null,
    text,
    historyId,
  };
}
