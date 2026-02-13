CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_session_id" text NOT NULL,
	"stripe_payment_intent_id" text,
	"customer_email" text NOT NULL,
	"customer_phone" text,
	"pass_type" text NOT NULL,
	"price_usd" numeric(10, 2) NOT NULL,
	"start_date" timestamp with time zone,
	"expiry_date" timestamp with time zone,
	"status" text DEFAULT 'created' NOT NULL,
	"passkit_pass_id" text,
	"smart_link_url" text,
	"email_sent_at" timestamp with time zone,
	"airtable_sync_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchases_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
CREATE TABLE "redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_id" uuid NOT NULL,
	"venue_id" text NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"result" text NOT NULL,
	"meta" jsonb
);
--> statement-breakpoint
DROP TABLE "posts" CASCADE;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE cascade ON UPDATE no action;