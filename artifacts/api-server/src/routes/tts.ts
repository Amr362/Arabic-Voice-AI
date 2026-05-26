import { Router, Response } from "express";
import { AuthRequest, requireAuth, supabaseAdmin } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { GenerateXttsBody, GenerateEdgeTtsBody } from "@workspace/api-zod";
import { generateSpeech, checkCredits, getMaxLength } from "../lib/tts-engine";
import { generateEgyptianTts } from "../lib/egyptian-tts";
import { generateEdgeTts } from "../lib/edge-tts";
import { db, generationsTable, usersTable } from "@workspace/db";
import { eq, sql, createHash } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createHash as nodeHash } from "crypto";
import { z } from "zod";

const router = Router();

// ── Supabase storage helper ──────────────────────────────────────────────────

async function uploadAudio(buf: Buffer, filename: string, contentType: string): Promise<string> {
  const bucket = process.env.SUPABASE_AUDIO_BUCKET ?? "generated-audio";
  const path = `${filename}`;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buf, { contentType, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  return supabaseAdmin.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
}

// ── POST /tts/edge ───────────────────────────────────────────────────────────
// MSA via Railway Edge-TTS with automatic HF fallback.
router.post("/tts/edge", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = GenerateEdgeTtsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }

  const { text, voiceId, speed = 1.0, pitch = 0 } = parsed.data;
  const userId = req.userId!;
  const plan = req.userPlan ?? "free";

  const maxLen = getMaxLength(plan);
  if (text.length > maxLen) {
    res.status(400).json({ error: `النص طويل جداً لخطتك (الحد الأقصى ${maxLen} حرف)` });
    return;
  }

  const credits = await checkCredits(userId, plan);
  if (!credits.ok) { res.status(429).json({ error: credits.error }); return; }

  try {
    const result = await generateSpeech({ text, voiceId, speed, pitch, userId, plan });
    res.json(result);
  } catch (err) {
    logger.error({ err }, "TTS generation failed");
    res.status(500).json({ error: (err as Error).message ?? "فشل توليد الصوت. يرجى المحاولة مجدداً." });
  }
});

// ── POST /tts/dialect ────────────────────────────────────────────────────────
// Smart dialect routing:
//   dialect=msa      → Edge-TTS (fast, standard)
//   dialect=egyptian → XTTS-v2 Egyptian AI (premium, with Edge-TTS fallback)
//
// HF_TOKEN is NEVER exposed to the frontend — all calls happen server-side.

const DialectBody = z.object({
  text: z.string().min(1).max(5000),
  dialect: z.enum(["msa", "egyptian"]).default("msa"),
  voiceId: z.string().default("ar-EG-SalmaNeural"),
  speed: z.number().min(0.5).max(2).default(1.0),
  pitch: z.number().min(-20).max(20).default(0),
});

router.post("/tts/dialect", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = DialectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "بيانات غير صحيحة" }); return; }

  const { text, dialect, voiceId, speed, pitch } = parsed.data;
  const userId = req.userId!;
  const plan = req.userPlan ?? "free";

  const maxLen = getMaxLength(plan);
  if (text.length > maxLen) {
    res.status(400).json({ error: `النص طويل جداً (الحد ${maxLen} حرف)` });
    return;
  }

  const credits = await checkCredits(userId, plan);
  if (!credits.ok) { res.status(429).json({ error: credits.error }); return; }

  const t0 = Date.now();

  // ── Cache check ──────────────────────────────────────────────────────────
  const cacheKey = nodeHash("sha256")
    .update(`${text}|${dialect}|${voiceId}|${speed.toFixed(2)}|${pitch}`)
    .digest("hex");

  const [cached] = await db
    .select()
    .from(generationsTable)
    .where(eq(generationsTable.cacheKey, cacheKey))
    .limit(1);

  if (cached) {
    return res.json({
      audioUrl: cached.audioUrl,
      engine: cached.engine,
      engineUsed: "cached",
      dialect: cached.dialect ?? dialect,
      fromCache: true,
      duration: cached.duration !== null ? Number(cached.duration) : null,
      text,
      historyId: cached.id,
    });
  }

  // ── Generate ─────────────────────────────────────────────────────────────
  let audioBuffer: Buffer;
  let contentType = "audio/mpeg";
  let engineUsed: string;
  let switched = false; // did we auto-switch to fallback?

  if (dialect === "egyptian") {
    // Premium Egyptian AI — XTTS-v2 with Edge-TTS fallback
    const result = await generateEgyptianTts(text, voiceId);
    audioBuffer = result.buffer;
    contentType = result.contentType;
    engineUsed = result.engine;
    switched = result.engine === "edge-tts-fallback";
    logger.info({ ms: Date.now() - t0, engine: engineUsed, switched }, "Egyptian dialect generated");
  } else {
    // MSA — fast Edge-TTS
    try {
      audioBuffer = await generateEdgeTts(text, voiceId, speed, pitch);
      engineUsed = "edge-tts";
    } catch (err) {
      logger.error({ err }, "MSA Edge-TTS failed");
      res.status(500).json({ error: "فشل توليد الصوت. حاول مجدداً." });
      return;
    }
  }

  // ── Upload ───────────────────────────────────────────────────────────────
  const ext = contentType === "audio/wav" ? "wav" : "mp3";
  const filename = `${userId}/${randomUUID()}.${ext}`;
  let audioUrl: string;

  try {
    audioUrl = await uploadAudio(audioBuffer, filename, contentType);
  } catch (uploadErr) {
    logger.warn({ uploadErr }, "Supabase upload failed — base64 fallback");
    audioUrl = `data:${contentType};base64,${audioBuffer.toString("base64")}`;
  }

  // ── Deduct credit ─────────────────────────────────────────────────────────
  await db.update(usersTable)
    .set({ creditsUsed: sql`${usersTable.creditsUsed} + 1` })
    .where(eq(usersTable.id, userId));

  // ── Save to DB ────────────────────────────────────────────────────────────
  const historyId = randomUUID();
  try {
    await db.insert(generationsTable).values({
      id: historyId,
      userId,
      text,
      audioUrl,
      engine: engineUsed,
      voiceId,
      dialect,
      language: dialect === "egyptian" ? "ar-EG" : "ar",
      duration: null,
      cacheKey,
    });
  } catch (dbErr) {
    logger.warn({ dbErr }, "Could not save dialect generation to DB");
  }

  res.json({
    audioUrl,
    engine: engineUsed,
    engineUsed,
    dialect,
    switched,
    fromCache: false,
    duration: null,
    text,
    historyId,
  });
});

// ── POST /tts/xtts ───────────────────────────────────────────────────────────
// Voice cloning: Pro Clone plan only. Requires a speaker audio URL.
router.post("/tts/xtts", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = GenerateXttsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }

  const plan = req.userPlan ?? "free";
  if (plan !== "pro_clone") {
    res.status(403).json({ error: "استنساخ الصوت يتطلب خطة Pro Clone. يرجى الترقية." });
    return;
  }

  const { text, speakerAudioUrl, language = "ar" } = parsed.data;
  const userId = req.userId!;

  const credits = await checkCredits(userId, plan);
  if (!credits.ok) { res.status(429).json({ error: credits.error }); return; }

  try {
    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) throw new Error("HF_TOKEN not configured");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);

    let response: globalThis.Response;
    try {
      response = await fetch("https://api-inference.huggingface.co/models/coqui/XTTS-v2", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text, parameters: { language, speaker_wav: speakerAudioUrl } }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`XTTS API error: ${response.status} — ${errText.slice(0, 100)}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const filename = `${userId}/${randomUUID()}.wav`;

    let audioUrl: string;
    try {
      audioUrl = await uploadAudio(audioBuffer, filename, "audio/wav");
    } catch (uploadErr) {
      logger.warn({ uploadErr }, "Supabase upload failed — data URL fallback");
      audioUrl = `data:audio/wav;base64,${audioBuffer.toString("base64")}`;
    }

    await db.update(usersTable)
      .set({ creditsUsed: sql`${usersTable.creditsUsed} + 1` })
      .where(eq(usersTable.id, userId));

    const historyId = randomUUID();
    try {
      await db.insert(generationsTable).values({
        id: historyId, userId, text, audioUrl,
        engine: "xtts-clone", voiceId: null, dialect: "egyptian",
        language, duration: null, cacheKey: null,
      });
    } catch (dbErr) {
      logger.warn({ dbErr }, "Could not save XTTS generation to DB");
    }

    res.json({ audioUrl, engine: "xtts-clone", engineUsed: "xtts-clone", fromCache: false, duration: null, text, historyId });
  } catch (err) {
    logger.error({ err }, "XTTS clone error");
    res.status(500).json({ error: "فشل استنساخ الصوت. يرجى المحاولة مجدداً." });
  }
});

export default router;
