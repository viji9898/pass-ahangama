import Stripe from "stripe";
import axios from "axios";

const DISTRIBUTION_ID = "5cb4m9";
const API_URL = "https://api.pub1.passkit.io/distribution/smartpasslink";
// ⚠️ NEVER hardcode this in production
const SMARTPASS_SECRET =
  "Iqwj_wfzVrdw7xRMu-HIMxRhaob6seRM8yRz01a1arAyhqVHmnMdPXoX0COUEFtVtQj1ErCjNGwKLS3k9itJx0CufoSvOLY5VpXtsFtJMv4w3v_LdYbq_27Sa5GhYR2x94d6yX5A6jhwFboSB9gwcScT6Yns0HORlF4pBROp2EF6Zu5cuum3p8kKYMic3qR2KEIeUBaF4m-Z_Uga6ANycn-njwXGM45HUg0krc2n3_ZT_3WPHRakEcDaf5FjYgpeIQcCOCVgmHJz_NIfq8ncHXHh2TcEmQGy9naM8O_0aQNqlTJPrZkl53KrKvhv_7eB";

async function generateSmartPass(fields) {
  try {
    const response = await axios.post(
      API_URL,
      {
        projectDistributionUrl: {
          url: `https://pub1.pskt.io/c/${DISTRIBUTION_ID}`,
          title: "Ahangama Pass",
        },
        fields,
      },
      {
        headers: {
          Authorization: `Bearer ${SMARTPASS_SECRET}`,
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (err) {
    if (err.response) {
      console.error("❌ API Error:", err.response.status, err.response.data);
    } else {
      console.error("❌ Error:", err.message);
    }
    return null;
  }
}

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

    // Generate PassKit smart link
    const smartPassFields = {
      "members.program.name": "Ahangama Pass 2026",
      "members.member.points": "120",
      "members.tier.name": "Base",
      "members.member.status": "ACTIVE",
      "members.member.externalId": `AHG-USER-${session.id}`,
      "person.displayName": "Ahangama Pass Holder",
      "person.surname": "",
      "person.emailAddress": "",
      "person.mobileNumber": mobile || "",
      "universal.info": "Valid at all participating Ahangama Pass venues.",
      "universal.expiryDate": `${new Date(start).getUTCFullYear()}-12-31T23:59:59Z`,
    };
    const smartLink = await generateSmartPass(smartPassFields);

    return json(200, { url: session.url, smartLink });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return json(500, { error: err.message || "Unknown error" });
  }
};
