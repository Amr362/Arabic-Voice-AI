import { pgTable, text, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const generationsTable = pgTable("generations", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  text: text("text").notNull(),
  audioUrl: text("audio_url").notNull(),
  engine: text("engine").notNull().default("edge-tts"),
  voiceId: text("voice_id"),
  dialect: text("dialect").default("msa"),       // 'msa' | 'egyptian'
  language: text("language").default("ar"),
  duration: numeric("duration"),
  cacheKey: text("cache_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("generations_cache_key_idx").on(table.cacheKey),
  index("generations_user_id_idx").on(table.userId),
  index("generations_dialect_idx").on(table.dialect),
]);

export const insertGenerationSchema = createInsertSchema(generationsTable).omit({ createdAt: true });
export type InsertGeneration = z.infer<typeof insertGenerationSchema>;
export type Generation = typeof generationsTable.$inferSelect;
