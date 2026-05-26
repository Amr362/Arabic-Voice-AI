import { logger } from "./logger";

const RAILWAY_TTS_URL = "https://edge-tts-production-3b67.up.railway.app/tts";
const TIMEOUT_MS = 12_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 600;

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

async function callRailwayOnce(
  text: string,
  voiceId: string,
  rate: string,
  volume: string,
  signal: AbortSignal,
): Promise<Buffer> {
  const response = await fetch(RAILWAY_TTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice: voiceId, rate, volume }),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Railway TTS HTTP ${response.status}: ${errText.slice(0, 200)}`);
  }

  const buf = Buffer.from(await response.arrayBuffer());
  if (buf.length < 100) {
    throw new Error(`Railway TTS returned suspiciously small payload (${buf.length} bytes)`);
  }
  return buf;
}

/**
 * Call Railway Edge-TTS with retry and timeout.
 * Throws if all attempts fail.
 */
export async function generateEdgeTts(
  text: string,
  voiceId: string,
  speed = 1.0,
  pitch = 0,
): Promise<Buffer> {
  const ratePct = Math.round((speed - 1) * 100);
  const rate = ratePct >= 0 ? `+${ratePct}%` : `${ratePct}%`;
  const volume = "+0%";

  let lastErr: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const t0 = Date.now();
    try {
      const buf = await callRailwayOnce(text, voiceId, rate, volume, controller.signal);
      const ms = Date.now() - t0;
      logger.info({ attempt, ms, bytes: buf.length, voiceId }, "Railway TTS success");
      return buf;
    } catch (err) {
      const ms = Date.now() - t0;
      lastErr = err;
      logger.warn({ attempt, ms, err }, `Railway TTS attempt ${attempt} failed`);
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastErr;
}
