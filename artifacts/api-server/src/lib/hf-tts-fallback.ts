import { logger } from "./logger";

const HF_MODEL = "facebook/mms-tts-ara";
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
const TIMEOUT_MS = 25_000;

/**
 * Fallback TTS using Hugging Face facebook/mms-tts-ara.
 * Returns raw FLAC/WAV audio as a Buffer.
 * No speaker audio required — works for any Arabic text.
 */
export async function generateHfFallbackTts(text: string): Promise<Buffer> {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) throw new Error("HF_TOKEN not configured — cannot use HF fallback TTS");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const t0 = Date.now();
  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
      signal: controller.signal,
    });

    const ms = Date.now() - t0;

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);

      // Model loading — retry after delay if 503
      if (response.status === 503) {
        throw new Error(`HF model loading (503): ${errText.slice(0, 200)}`);
      }
      throw new Error(`HF TTS HTTP ${response.status}: ${errText.slice(0, 200)}`);
    }

    const buf = Buffer.from(await response.arrayBuffer());
    logger.info({ ms, bytes: buf.length, model: HF_MODEL }, "HF fallback TTS success");

    if (buf.length < 100) {
      throw new Error(`HF fallback returned too-small payload (${buf.length} bytes)`);
    }

    return buf;
  } finally {
    clearTimeout(timer);
  }
}
