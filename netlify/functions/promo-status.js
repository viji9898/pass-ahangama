import crypto from "crypto";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";

const stripe = new Stripe(
  process.env.NODE_ENV === "development"
    ? process.env.STRIPE_SECRET_KEY_TEST
    : process.env.STRIPE_SECRET_KEY_LIVE,
);
const PASSKIT_SMARTPASS_SECRET = process.env.PASSKIT_SMARTPASS_SECRET;
const PASS_EXTERNAL_BASE_URL = "https://pass.ahangama.com";

function generatePassCode(seed, length = 12) {
  return crypto
    .createHash("sha256")
    .update(seed)
    .digest("hex")
    .slice(0, length);
}

function parseYmd(ymd) {
  if (typeof ymd !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [year, month, day] = ymd.split("-").map(Number);
  return { year, month, day };
}

function colomboMidnightUtcIso(ymd) {
  const parsed = parseYmd(ymd);
  if (!parsed) return null;
  return new Date(
    Date.UTC(parsed.year, parsed.month - 1, parsed.day, 0, -330, 0, 0),
  ).toISOString();
}

function colomboEndOfDayUtcIso(ymd) {
  const parsed = parseYmd(ymd);
  if (!parsed) return null;
  return new Date(
    Date.UTC(parsed.year, parsed.month - 1, parsed.day, 18, 29, 59, 999),
  ).toISOString();
}

function unixToIso(unixSeconds) {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toISOString();
}

function toColomboIsoString(date) {
  const offsetMs = 5.5 * 60 * 60 * 1000;
  const local = new Date(date.getTime() + offsetMs);
  const pad = (value) => String(value).padStart(2, "0");
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}+05:30`;
}

async function createPromoSmartPassLink({
  passHolderName,
  customerEmail,
  customerPhone,
  passkitPassId,
  paidEndAt,
}) {
  if (!PASSKIT_SMARTPASS_SECRET || !paidEndAt) return null;

  const response = await fetch(
    "https://api.pub1.passkit.io/distribution/smartpasslink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PASSKIT_SMARTPASS_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectDistributionUrl: {
          url: "https://pub1.pskt.io/c/5cb4m9",
          title: "Ahangama Pass",
        },
        fields: {
          "members.program.name": "Ahangama Pass 2026",
          "members.member.points": "120",
          "members.tier.name": "Base",
          "members.member.status": "ACTIVE",
          "members.member.externalId": `${PASS_EXTERNAL_BASE_URL}/pv?id=${passkitPassId}`,
          "person.displayName": passHolderName || "Ahangama Pass Holder",
          "person.surname": "",
          "person.emailAddress": customerEmail || "",
          "person.mobileNumber": customerPhone || "",
          "universal.info": "Valid at all participating Ahangama Pass venues.",
          "universal.expiryDate": toColomboIsoString(new Date(paidEndAt)),
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PassKit request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data?.url || null;
}

async function isSmartLinkHealthy(url) {
  if (!url) return false;

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0",
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureWorkingPromoSmartLink(sql, subscription) {
  const currentUrl = subscription.smart_link_url || subscription.smartLinkUrl;
  if (currentUrl && (await isSmartLinkHealthy(currentUrl))) {
    return subscription;
  }

  const passkitPassId =
    subscription.passkit_pass_id ||
    subscription.passkitPassId ||
    generatePassCode(
      subscription.stripe_checkout_session_id ||
        subscription.stripeCheckoutSessionId,
    );
  const regeneratedSmartLinkUrl = await createPromoSmartPassLink({
    passHolderName:
      subscription.pass_holder_name || subscription.passHolderName,
    customerEmail: subscription.customer_email || subscription.customerEmail,
    customerPhone: subscription.customer_phone || subscription.customerPhone,
    passkitPassId,
    paidEndAt: subscription.paid_end_at || subscription.paidEndAt,
  });

  if (!regeneratedSmartLinkUrl) {
    return subscription;
  }

  const [updated] = await sql`
    UPDATE promo_subscriptions
    SET
      passkit_pass_id = COALESCE(passkit_pass_id, ${passkitPassId}),
      smart_link_url = ${regeneratedSmartLinkUrl},
      updated_at = NOW()
    WHERE stripe_checkout_session_id = ${
      subscription.stripe_checkout_session_id ||
      subscription.stripeCheckoutSessionId
    }
    RETURNING *
  `;

  return updated || subscription;
}

function mapPromoRecord(subscription) {
  return {
    id:
      subscription.stripe_checkout_session_id ||
      subscription.stripeCheckoutSessionId,
    stripe_subscription_id:
      subscription.stripe_subscription_id || subscription.stripeSubscriptionId,
    billing_status: subscription.billing_status || subscription.billingStatus,
    access_status: subscription.access_status || subscription.accessStatus,
    smart_link_url: subscription.smart_link_url || subscription.smartLinkUrl,
    passkit_pass_id: subscription.passkit_pass_id || subscription.passkitPassId,
    customer_email: subscription.customer_email || subscription.customerEmail,
    customer_phone: subscription.customer_phone || subscription.customerPhone,
    pass_holder_name:
      subscription.pass_holder_name || subscription.passHolderName,
    start_date: subscription.start_date || subscription.startDate,
    trial_start_at: subscription.trial_start_at || subscription.trialStartAt,
    trial_end_at: subscription.trial_end_at || subscription.trialEndAt,
    paid_start_at: subscription.paid_start_at || subscription.paidStartAt,
    paid_end_at: subscription.paid_end_at || subscription.paidEndAt,
    cancel_at: subscription.cancel_at || subscription.cancelAt,
    receipt_url: subscription.receipt_url || subscription.receiptUrl,
  };
}

async function hydratePromoSubscription(sql, sessionId) {
  let session;

  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription.latest_invoice"],
    });
  } catch (error) {
    console.error("promo-status checkout retrieve error:", error.message);
    return null;
  }

  if (session.status !== "complete") return null;

  const metadata = session.metadata || {};
  const subscription =
    typeof session.subscription === "string" ? null : session.subscription;
  const latestInvoice =
    typeof subscription?.latest_invoice === "string"
      ? null
      : subscription?.latest_invoice || null;

  const trialStartAt =
    metadata.trial_start_at || colomboMidnightUtcIso(metadata.start_date);
  const paidStartAt =
    metadata.first_charge_at || unixToIso(subscription?.trial_end);
  const paidEndAt = metadata.paid_end_date
    ? colomboEndOfDayUtcIso(metadata.paid_end_date)
    : null;
  const cancelAt =
    unixToIso(subscription?.cancel_at) ||
    metadata.planned_cancel_at ||
    paidEndAt;

  if (!trialStartAt || !paidStartAt || !paidEndAt || !cancelAt) {
    return null;
  }

  const billingStatus =
    session.payment_status === "paid" && subscription?.status === "trialing"
      ? "trialing"
      : session.payment_status === "paid"
        ? "active_paid"
        : "checkout_created";
  const accessStatus = session.payment_status === "paid" ? "active" : "pending";

  const passkitPassId = generatePassCode(session.id);
  let smartLinkUrl = null;

  try {
    smartLinkUrl = await createPromoSmartPassLink({
      passHolderName: session.customer_details?.name || null,
      customerEmail:
        session.customer_details?.email || session.customer_email || "",
      customerPhone: session.customer_details?.phone || null,
      passkitPassId,
      paidEndAt,
    });
  } catch (error) {
    console.error("promo-status smart link creation error:", error.message);
  }

  const result = await sql`
    INSERT INTO promo_subscriptions (
      stripe_checkout_session_id,
      stripe_subscription_id,
      stripe_customer_id,
      stripe_latest_invoice_id,
      customer_email,
      customer_phone,
      pass_holder_name,
      promo_type,
      start_date,
      trial_start_at,
      trial_end_at,
      paid_start_at,
      paid_end_at,
      cancel_at,
      billing_status,
      access_status,
      passkit_pass_id,
      smart_link_url,
      receipt_url,
      created_at,
      updated_at
    ) VALUES (
      ${session.id},
      ${subscription?.id || null},
      ${typeof session.customer === "string" ? session.customer : null},
      ${latestInvoice?.id || null},
      ${session.customer_details?.email || session.customer_email || ""},
      ${session.customer_details?.phone || null},
      ${session.customer_details?.name || null},
      ${metadata.promo_type || "promo_15_trial"},
      ${trialStartAt},
      ${trialStartAt},
      ${paidStartAt},
      ${paidStartAt},
      ${paidEndAt},
      ${cancelAt},
      ${billingStatus},
      ${accessStatus},
      ${passkitPassId},
      ${smartLinkUrl},
      ${latestInvoice?.hosted_invoice_url || latestInvoice?.invoice_pdf || null},
      NOW(),
      NOW()
    )
    ON CONFLICT (stripe_checkout_session_id) DO UPDATE SET
      stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, promo_subscriptions.stripe_subscription_id),
      stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, promo_subscriptions.stripe_customer_id),
      stripe_latest_invoice_id = COALESCE(EXCLUDED.stripe_latest_invoice_id, promo_subscriptions.stripe_latest_invoice_id),
      customer_email = EXCLUDED.customer_email,
      customer_phone = EXCLUDED.customer_phone,
      pass_holder_name = EXCLUDED.pass_holder_name,
      promo_type = EXCLUDED.promo_type,
      start_date = EXCLUDED.start_date,
      trial_start_at = EXCLUDED.trial_start_at,
      trial_end_at = EXCLUDED.trial_end_at,
      paid_start_at = EXCLUDED.paid_start_at,
      paid_end_at = EXCLUDED.paid_end_at,
      cancel_at = EXCLUDED.cancel_at,
      billing_status = EXCLUDED.billing_status,
      access_status = EXCLUDED.access_status,
      passkit_pass_id = COALESCE(promo_subscriptions.passkit_pass_id, EXCLUDED.passkit_pass_id),
      smart_link_url = COALESCE(promo_subscriptions.smart_link_url, EXCLUDED.smart_link_url),
      receipt_url = COALESCE(EXCLUDED.receipt_url, promo_subscriptions.receipt_url),
      updated_at = NOW()
    RETURNING *
  `;

  return result[0] || null;
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async (req) => {
  let sessionId;

  if (req.query && req.query.session_id) {
    sessionId = req.query.session_id;
  } else if (req.url && req.url.includes("session_id=")) {
    const baseUrl = process.env.SITE_URL || "http://localhost:8889";
    const url = new URL(req.url, baseUrl);
    sessionId = url.searchParams.get("session_id");
  }

  if (!sessionId) return json(400, { error: "Missing session_id" });

  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  const [subscription] = await sql`
    SELECT *
    FROM promo_subscriptions
    WHERE stripe_checkout_session_id = ${sessionId}
  `;

  if (!subscription) {
    const hydratedSubscription = await hydratePromoSubscription(sql, sessionId);

    if (!hydratedSubscription) {
      return json(202, {
        pending: true,
        message: "Promo activation is still processing.",
      });
    }

    return json(200, mapPromoRecord(hydratedSubscription));
  }

  const repairedSubscription = await ensureWorkingPromoSmartLink(
    sql,
    subscription,
  );

  return json(200, mapPromoRecord(repairedSubscription));
};
