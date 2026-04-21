import crypto from "crypto";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";
import { sendPromoPaidEmail, sendPromoTrialEmail } from "./PromoEmailComponent.js";

const stripe = new Stripe(
  process.env.NODE_ENV === "development"
    ? process.env.STRIPE_SECRET_KEY_TEST
    : process.env.STRIPE_SECRET_KEY_LIVE,
);
const endpointSecret = process.env.STRIPE_PROMO_WEBHOOK_SECRET;
const sql = neon(process.env.NETLIFY_DATABASE_URL);
const PASSKIT_SMARTPASS_SECRET = process.env.PASSKIT_SMARTPASS_SECRET;

export const config = { api: { bodyParser: false } };

async function getRawBody(stream) {
  const reader = stream.getReader();
  let result = new Uint8Array(0);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const next = new Uint8Array(result.length + value.length);
    next.set(result);
    next.set(value, result.length);
    result = next;
  }

  return Buffer.from(result);
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

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
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}:${pad(local.getSeconds())}+05:30`;
}

async function retrieveSubscription(subscriptionId) {
  if (!subscriptionId || typeof subscriptionId !== "string") return null;
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error("promo webhook subscription retrieve error:", error.message);
    return null;
  }
}

async function ensureSubscriptionCancelAt(subscriptionId, plannedCancelAtIso) {
  if (!subscriptionId || !plannedCancelAtIso) return null;

  const cancelAtUnix = Math.floor(new Date(plannedCancelAtIso).getTime() / 1000);
  if (!Number.isFinite(cancelAtUnix)) return null;

  try {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at: cancelAtUnix,
    });
  } catch (error) {
    console.error("promo webhook cancel_at update error:", error.message);
    return null;
  }
}

async function createPromoSmartPassLink({
  passHolderName,
  customerEmail,
  customerPhone,
  passkitPassId,
  paidEndAt,
}) {
  if (!PASSKIT_SMARTPASS_SECRET) {
    throw new Error("PASSKIT_SMARTPASS_SECRET is missing");
  }

  const baseUrl = process.env.SITE_URL || "https://pass.ahangama.com";
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
          title: "Ahangama Pass Promo",
        },
        fields: {
          "members.program.name": "Ahangama Pass Promo 2026",
          "members.member.points": "120",
          "members.tier.name": "Promo",
          "members.member.status": "ACTIVE",
          "members.member.externalId": `${baseUrl}/pv?id=${passkitPassId}`,
          "person.displayName": passHolderName || "Ahangama Promo Guest",
          "person.surname": "",
          "person.emailAddress": customerEmail || "",
          "person.mobileNumber": customerPhone || "",
          "universal.info": "Promo access valid at participating Ahangama Pass venues.",
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

async function upsertCheckoutCompleted(session) {
  const metadata = session.metadata || {};
  const customer = session.customer_details || {};
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : null;
  let subscription = await retrieveSubscription(subscriptionId);

  const trialStartAt = metadata.trial_start_at || colomboMidnightUtcIso(metadata.start_date);
  const paidStartAt = metadata.first_charge_at || null;
  const paidEndAt = metadata.paid_end_date
    ? colomboEndOfDayUtcIso(metadata.paid_end_date)
    : null;
  const plannedCancelAt = metadata.planned_cancel_at || null;
  if (subscriptionId && !subscription?.cancel_at && plannedCancelAt) {
    const updatedSubscription = await ensureSubscriptionCancelAt(
      subscriptionId,
      plannedCancelAt,
    );
    if (updatedSubscription) {
      subscription = updatedSubscription;
    }
  }

  const cancelAt = unixToIso(subscription?.cancel_at) || plannedCancelAt;
  const latestInvoiceId =
    typeof subscription?.latest_invoice === "string"
      ? subscription.latest_invoice
      : subscription?.latest_invoice?.id || null;
  const [existing] = await sql`
    SELECT passkit_pass_id, smart_link_url, email_trial_sent_at
    FROM promo_subscriptions
    WHERE stripe_checkout_session_id = ${session.id}
  `;

  const passkitPassId = existing?.passkit_pass_id || generatePassCode(session.id);
  let smartLinkUrl = existing?.smart_link_url || null;

  if (!smartLinkUrl && paidEndAt) {
    smartLinkUrl = await createPromoSmartPassLink({
      passHolderName: customer.name || null,
      customerEmail: customer.email || session.customer_email || "",
      customerPhone: customer.phone || null,
      passkitPassId,
      paidEndAt,
    });
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
      created_at,
      updated_at
    ) VALUES (
      ${session.id},
      ${subscriptionId},
      ${typeof session.customer === "string" ? session.customer : null},
      ${latestInvoiceId},
      ${customer.email || session.customer_email || ""},
      ${customer.phone || null},
      ${customer.name || null},
      ${metadata.promo_type || "promo_15_trial"},
      ${trialStartAt},
      ${trialStartAt},
      ${paidStartAt},
      ${paidStartAt},
      ${paidEndAt},
      ${cancelAt || paidEndAt},
      ${"trialing"},
      ${"active"},
      ${passkitPassId},
      ${smartLinkUrl},
      NOW(),
      NOW()
    )
    ON CONFLICT (stripe_checkout_session_id) DO UPDATE SET
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      stripe_latest_invoice_id = EXCLUDED.stripe_latest_invoice_id,
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
      updated_at = NOW()
    RETURNING
      stripe_checkout_session_id,
      customer_email,
      pass_holder_name,
      trial_start_at,
      trial_end_at,
      paid_start_at,
      paid_end_at,
      passkit_pass_id,
      smart_link_url,
      email_trial_sent_at
  `;

  return result[0] || null;
}

async function updateFromInvoice(invoice, billingStatus, accessStatus) {
  const subscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : null;
  if (!subscriptionId) {
    console.warn("promo webhook invoice missing subscription id");
    return null;
  }

  const result = await sql`
    UPDATE promo_subscriptions
    SET
      stripe_latest_invoice_id = ${invoice.id},
      stripe_customer_id = ${typeof invoice.customer === "string" ? invoice.customer : null},
      receipt_url = ${invoice.hosted_invoice_url || invoice.invoice_pdf || null},
      billing_status = ${billingStatus},
      access_status = ${accessStatus},
      updated_at = NOW()
    WHERE stripe_subscription_id = ${subscriptionId}
    RETURNING
      id,
      customer_email,
      pass_holder_name,
      smart_link_url,
      passkit_pass_id,
      paid_start_at,
      paid_end_at,
      receipt_url,
      email_paid_sent_at
  `;

  if (!result.length) {
    console.warn(
      `promo webhook could not find promo_subscriptions row for subscription ${subscriptionId}`,
    );
    return null;
  }

  return result[0];
}

async function markSubscriptionEnded(subscription) {
  const subscriptionId = subscription.id;
  if (!subscriptionId) return;

  await sql`
    UPDATE promo_subscriptions
    SET
      billing_status = ${"ended"},
      access_status = ${"ended"},
      cancel_at = ${unixToIso(subscription.cancel_at) || unixToIso(subscription.ended_at)},
      updated_at = NOW()
    WHERE stripe_subscription_id = ${subscriptionId}
  `;
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Not a POST request", { status: 405 });
  }

  if (!endpointSecret) {
    return json(500, { error: "STRIPE_PROMO_WEBHOOK_SECRET is missing" });
  }

  const signature = req.headers.get("stripe-signature");
  const rawBody = await getRawBody(req.body);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
  } catch (error) {
    console.error("promo webhook signature verification failed:", error.message);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const record = await upsertCheckoutCompleted(event.data.object);
        if (
          record?.customer_email &&
          record?.smart_link_url &&
          !record?.email_trial_sent_at
        ) {
          await sendPromoTrialEmail({
            customerEmail: record.customer_email,
            passHolderName: record.pass_holder_name,
            smartLinkUrl: record.smart_link_url,
            passkitPassId: record.passkit_pass_id,
            startDate: record.trial_start_at,
            trialEndAt: record.trial_end_at,
            paidStartAt: record.paid_start_at,
            paidEndAt: record.paid_end_at,
          });

          await sql`
            UPDATE promo_subscriptions
            SET email_trial_sent_at = NOW(), updated_at = NOW()
            WHERE stripe_checkout_session_id = ${record.stripe_checkout_session_id}
          `;
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object;
        if ((invoice.amount_paid || 0) > 0) {
          const record = await updateFromInvoice(
            invoice,
            "active_paid",
            "active",
          );
          if (
            record?.customer_email &&
            record?.smart_link_url &&
            !record?.email_paid_sent_at
          ) {
            await sendPromoPaidEmail({
              customerEmail: record.customer_email,
              passHolderName: record.pass_holder_name,
              smartLinkUrl: record.smart_link_url,
              passkitPassId: record.passkit_pass_id,
              paidStartAt: record.paid_start_at,
              paidEndAt: record.paid_end_at,
              receiptUrl: record.receipt_url,
            });

            await sql`
              UPDATE promo_subscriptions
              SET email_paid_sent_at = NOW(), updated_at = NOW()
              WHERE id = ${record.id}
            `;
          }
        }
        break;
      }
      case "invoice.payment_failed": {
        await updateFromInvoice(
          event.data.object,
          "payment_failed_review",
          "manual_review",
        );
        break;
      }
      case "customer.subscription.deleted": {
        await markSubscriptionEnded(event.data.object);
        break;
      }
      default:
        console.log(`promo webhook ignored event type ${event.type}`);
    }
  } catch (error) {
    console.error("promo webhook handler error:", error);
    return json(500, { error: error.message || "Unknown error" });
  }

  return json(200, { received: true });
};