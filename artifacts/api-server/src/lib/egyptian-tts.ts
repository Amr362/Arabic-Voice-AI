/**
 * Egyptian Dialect TTS via Hugging Face XTTS-v2
 * Uses a default Egyptian speaker sample (configurable via EGYPTIAN_SPEAKER_URL env).
 * Falls back to Edge-TTS with Egyptian voice on timeout/error.
 */

import { logger } from "./logger";

const HF_XTTS_URL = "https://api-inference.huggingface.co/models/coqui/XTTS-v2";
const TIMEOUT_MS = 28_000;

// Default Egyptian Arabic speaker sample (hosted publicly).
// Override via EGYPTIAN_SPEAKER_URL env for your own sample.
const DEFAULT_EGYPTIAN_SPEAKER =
  process.env.EGYPTIAN_SPEAKER_URL ??
  "https://huggingface.co/coqui/XTTS-v2/resolve/main/samples/ar/ar_sample.wav";

export interface EgyptianTtsResult {
  buffer: Buffer;
  contentType: "audio/wav" | "audio/mpeg";
  engine: "xtts-egyptian" | "edge-tts-fallback";
}

/**
 * Generate Egyptian dialect audio.
 * Primary: HF XTTS-v2 (Arabic, Egyptian speaker)
 * Fallback: Edge-TTS ar-EG-SalmaNeural (if XTTS times out or fails)
 */
export async function generateEgyptianTts(
  text: string,
  fallbackVoiceId = "ar-EG-SalmaNeural",
): Promise<EgyptianTtsResult> {
  const hfToken = process.env.HF_TOKEN;

  // Try XTTS-v2 if token is available
  if (hfToken) {
    try {
      const buffer = await callXtts(text, hfToken);
      return { buffer, contentType: "audio/wav", engine: "xtts-egyptian" };
    } catch (err) {
      logger.warn({ err }, "Egyptian XTTS failed — falling back to Edge-TTS ar-EG");
    }
  } else {
    logger.warn("HF_TOKEN not set — Egyptian dialect will use Edge-TTS fallback");
  }

  // Fallback: Edge-TTS with Egyptian voice
  const { generateEdgeTts } = await import("./edge-tts");
  const buffer = await generateEdgeTts(text, fallbackVoiceId, 1.0, 0);
  return { buffer, contentType: "audio/mpeg", engine: "edge-tts-fallback" };
}

async function callXtts(text: string, hfToken: string): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(HF_XTTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          language: "ar",
          speaker_wav: DEFAULT_EGYPTIAN_SPEAKER,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      // 503 = model loading; treat as retriable error
      throw new Error(`XTTS HTTP ${response.status}: ${errText.slice(0, 200)}`);
    }

    const buf = Buffer.from(await response.arrayBuffer());
    if (buf.length < 100) throw new Error(`XTTS returned too-small payload (${buf.length}B)`);

    logger.info({ bytes: buf.length }, "Egyptian XTTS success");
    return buf;
  } finally {
    clearTimeout(timer);
  }
}
