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
  receiptUrl: text("receipt_url"),

  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),

  airtableSyncStatus: text("airtable_sync_status"), // ok | failed | null

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  passHolderName: text("pass_holder_name"),
});

/* ===========================
     Promo Subscriptions
=========================== */

export const promoSubscriptions = pgTable("promo_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),

  stripeCheckoutSessionId: text("stripe_checkout_session_id")
    .notNull()
    .unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeLatestInvoiceId: text("stripe_latest_invoice_id"),

  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  passHolderName: text("pass_holder_name"),

  promoType: text("promo_type").notNull(),

  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  trialStartAt: timestamp("trial_start_at", { withTimezone: true }).notNull(),
  trialEndAt: timestamp("trial_end_at", { withTimezone: true }).notNull(),
  paidStartAt: timestamp("paid_start_at", { withTimezone: true }).notNull(),
  paidEndAt: timestamp("paid_end_at", { withTimezone: true }).notNull(),
  cancelAt: timestamp("cancel_at", { withTimezone: true }).notNull(),

  billingStatus: text("billing_status").notNull().default("checkout_created"),
  accessStatus: text("access_status").notNull().default("pending"),

  passkitPassId: text("passkit_pass_id").unique(),
  smartLinkUrl: text("smart_link_url"),
  receiptUrl: text("receipt_url"),

  emailTrialSentAt: timestamp("email_trial_sent_at", { withTimezone: true }),
  emailPaidSentAt: timestamp("email_paid_sent_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
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
