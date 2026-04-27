import Stripe from "stripe";
import {
  buildStripeAttributionMetadata,
  getAttributionFromBody,
} from "./attribution.js";

const stripe = new Stripe(
  process.env.NODE_ENV === "development"
    ? process.env.STRIPE_SECRET_KEY_TEST
    : process.env.STRIPE_SECRET_KEY_LIVE,
);

const PROMO_TYPE = "promo_15_trial";
const COLOMBO_OFFSET_MINUTES = 5.5 * 60;
const PROMO_TIMEZONE = process.env.PROMO_TIMEZONE || "Asia/Colombo";
const PROMO_TRIAL_DAYS = Number(process.env.PROMO_TRIAL_DAYS || 5);
const PROMO_BILLING_DAYS = Number(process.env.PROMO_BILLING_DAYS || 15);
const PRICE_ENV =
  process.env.NODE_ENV === "development"
    ? "STRIPE_PROMO_PRICE_15_TEST"
    : "STRIPE_PROMO_PRICE_15";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatYmd(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

function parseYmd(ymd) {
  if (typeof ymd !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : { year, month, day, date };
}

function colomboMidnightUtcDate(year, month, day) {
  return new Date(
    Date.UTC(year, month - 1, day, 0, -COLOMBO_OFFSET_MINUTES, 0, 0),
  );
}

function addUtcDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function getColomboTodayYmd() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PROMO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export default async (req) => {
  try {
    if (req.method !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const body = await req.json();
    const { startDate } = body;
    const attribution = getAttributionFromBody(body);
    const parsedStart = parseYmd(startDate);
    if (!parsedStart) {
      return json(400, { error: "Invalid startDate" });
    }

    const todayParsed = parseYmd(getColomboTodayYmd());
    const maxDate = addUtcDays(todayParsed.date, 60);
    if (parsedStart.date < todayParsed.date || parsedStart.date > maxDate) {
      return json(400, { error: "Start date out of allowed range" });
    }

    const priceId = process.env[PRICE_ENV];
    if (!priceId) {
      return json(500, { error: `${PRICE_ENV} is missing` });
    }

    const trialStartAt = colomboMidnightUtcDate(
      parsedStart.year,
      parsedStart.month,
      parsedStart.day,
    );
    const firstChargeAt = addUtcDays(trialStartAt, PROMO_TRIAL_DAYS);
    const cancelAt = addUtcDays(firstChargeAt, PROMO_BILLING_DAYS);
    const paidEndDate = addUtcDays(firstChargeAt, PROMO_BILLING_DAYS - 1);

    const baseUrl = process.env.SITE_URL || "http://localhost:8889";
    const url = new URL(req.url, baseUrl);
    const origin = url.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${origin}/promo?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/promo?checkout=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      line_items: [{ price: priceId, quantity: 1 }],
      phone_number_collection: { enabled: true },
      metadata: {
        promo_type: PROMO_TYPE,
        start_date: startDate,
        trial_days: String(PROMO_TRIAL_DAYS),
        billing_days: String(PROMO_BILLING_DAYS),
        trial_start_at: trialStartAt.toISOString(),
        first_charge_at: firstChargeAt.toISOString(),
        planned_cancel_at: cancelAt.toISOString(),
        paid_end_date: formatYmd(paidEndDate),
        timezone: PROMO_TIMEZONE,
        ...buildStripeAttributionMetadata(attribution),
      },
      subscription_data: {
        trial_end: Math.floor(firstChargeAt.getTime() / 1000),
        metadata: {
          promo_type: PROMO_TYPE,
          start_date: startDate,
          trial_days: String(PROMO_TRIAL_DAYS),
          billing_days: String(PROMO_BILLING_DAYS),
          trial_start_at: trialStartAt.toISOString(),
          first_charge_at: firstChargeAt.toISOString(),
          planned_cancel_at: cancelAt.toISOString(),
          paid_end_date: formatYmd(paidEndDate),
          timezone: PROMO_TIMEZONE,
          ...buildStripeAttributionMetadata(attribution),
        },
      },
    });

    return json(200, {
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("create-promo-checkout-session error:", error);
    return json(500, { error: error.message || "Unknown error" });
  }
};
