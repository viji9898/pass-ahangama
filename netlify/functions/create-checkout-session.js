import Stripe from "stripe";

const stripe = new Stripe(
  process.env.NODE_ENV === "development"
    ? process.env.STRIPE_SECRET_KEY_TEST
    : process.env.STRIPE_SECRET_KEY_LIVE,
);

const isDev = process.env.NODE_ENV === "development";
const PASS_CONFIG = {
  pass_15: {
    days: 15,
    priceEnv: isDev ? "STRIPE_PRICE_15_TEST" : "STRIPE_PRICE_15",
  },
  pass_30: {
    days: 30,
    priceEnv: isDev ? "STRIPE_PRICE_30_TEST" : "STRIPE_PRICE_30",
  },
  pass_90: {
    days: 90,
    priceEnv: isDev ? "STRIPE_PRICE_90_TEST" : "STRIPE_PRICE_90",
  },
  pass_365: {
    days: 365,
    priceEnv: isDev ? "STRIPE_PRICE_365_TEST" : "STRIPE_PRICE_365",
  },
};

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function parseYmdToUtcDate(ymd) {
  if (typeof ymd !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function utcTodayStart() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export default async (req) => {
  try {
    if (req.method !== "POST")
      return json(405, { error: "Method not allowed" });

    const { passType, startDate, mobile } = await req.json();

    const cfg = PASS_CONFIG[passType];
    if (!cfg) return json(400, { error: "Invalid passType" });

    const start = parseYmdToUtcDate(startDate);
    if (!start) return json(400, { error: "Invalid startDate" });

    const min = utcTodayStart();
    const max = new Date(min);
    max.setUTCDate(max.getUTCDate() + 60);
    if (start < min || start > max)
      return json(400, { error: "Start date out of allowed range" });

    const priceId = process.env[cfg.priceEnv];
    if (!priceId) return json(500, { error: `${cfg.priceEnv} is missing` });

    // Use SITE_URL from env or fallback to localhost for serverless environment
    const baseUrl = process.env.SITE_URL || "http://localhost:8889";
    const url = new URL(req.url, baseUrl);
    const origin = url.origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      allow_promotion_codes: true,
      customer_creation: "always",
      line_items: [{ price: priceId, quantity: 1 }],
      phone_number_collection: { enabled: true },
      metadata: {
        pass_type: passType,
        start_date: startDate,
        validity_days: String(cfg.days),
        mobile: mobile || "",
      },
    });

    return json(200, { url: session.url });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return json(500, { error: err.message || "Unknown error" });
  }
};
