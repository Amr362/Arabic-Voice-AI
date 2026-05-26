import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subscriptionsTable = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  plan: text("plan").notNull(),
  active: boolean("active").notNull().default(true),
  activatedBy: text("activated_by"),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ createdAt: true, updatedAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;
