import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

/* ===========================
     Purchases
=========================== */

export const purchases = pgTable("purchases", {
  id: uuid("id").defaultRandom().primaryKey(),

  stripeSessionId: text("stripe_session_id").notNull().unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),

  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),

  passType: text("pass_type").notNull(), // pass_15 | pass_30 | pass_90
  priceUsd: numeric("price_usd", { precision: 10, scale: 2 }).notNull(),

  startDate: timestamp("start_date", { withTimezone: true }),
  expiryDate: timestamp("expiry_date", { withTimezone: true }),

  status: text("status").notNull().default("created"),
  // created | paid | issued | email_sent | suspended | refunded | failed

  passkitPassId: text("passkit_pass_id"),
  smartLinkUrl: text("smart_link_url"),

  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),

  airtableSyncStatus: text("airtable_sync_status"), // ok | failed | null

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  passHolderName: text("pass_holder_name"),
});

/* ===========================
     Redemptions
=========================== */

export const redemptions = pgTable("redemptions", {
  id: uuid("id").defaultRandom().primaryKey(),

  purchaseId: uuid("purchase_id")
    .notNull()
    .references(() => purchases.id, { onDelete: "cascade" }),

  venueId: text("venue_id").notNull(),

  scannedAt: timestamp("scanned_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  result: text("result").notNull(),
  // valid | expired | suspended | not_found

  meta: jsonb("meta"), // optional extra scan data
});

/* ===========================
     Relations
=========================== */

export const purchasesRelations = relations(purchases, ({ many }) => ({
  redemptions: many(redemptions),
}));

export const redemptionsRelations = relations(redemptions, ({ one }) => ({
  purchase: one(purchases, {
    fields: [redemptions.purchaseId],
    references: [purchases.id],
  }),
}));
