import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";
import sgMail from "@sendgrid/mail";
import axios from "axios";

// Helper to read ReadableStream into a Buffer
async function getRawBody(stream) {
  const reader = stream.getReader();
  let result = new Uint8Array(0);
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const newResult = new Uint8Array(result.length + value.length);
    newResult.set(result);
    newResult.set(value, result.length);
    result = newResult;
  }
  return Buffer.from(result);
}

console.log(
  "[webhook] ENV STRIPE_SECRET_KEY exists:",
  !!process.env.STRIPE_SECRET_KEY_TEST,
);
console.log(
  "[webhook] ENV NETLIFY_DATABASE_URL exists:",
  !!process.env.NETLIFY_DATABASE_URL,
);
console.log(
  "[webhook] ENV SENDGRID_API_KEY exists:",
  !!process.env.SENDGRID_API_KEY,
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);
const sql = neon(process.env.NETLIFY_DATABASE_URL);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const config = { api: { bodyParser: false } };

export default async (req, res) => {
  console.log("[webhook] All headers:", req.headers);
  console.log(
    "[webhook] Stripe-Signature header:",
    req.headers.get("stripe-signature"),
  );
  if (req.method !== "POST") {
    console.log("[webhook] Not a POST request");
    return new Response("Not a POST request", { status: 405 });
  }
  const sig = req.headers.get("stripe-signature");
  const rawBody = await getRawBody(req.body);
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
    console.log("[webhook] Event received:", event.type);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err.message);
    console.error("[webhook] Raw body:", rawBody);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log(
      "[webhook] checkout.session.completed payload:",
      JSON.stringify(session, null, 2),
    );
    const { id: stripeSessionId, customer_details, metadata } = session;
    const { email, phone, name } = customer_details || {};
    const { pass_type, start_date, validity_days } = metadata || {};
    console.log("[webhook] Parsed:", {
      stripeSessionId,
      email,
      phone,
      name,
      pass_type,
      start_date,
      validity_days,
    });
    if (!stripeSessionId || !email || !start_date || !validity_days) {
      console.error("[webhook] Missing required fields for DB insert", {
        stripeSessionId,
        email,
        start_date,
        validity_days,
      });
    }
    // Compute expiry date (end of day Asia/Colombo)
    const startDate = new Date(start_date);
    const expiryDate = new Date(startDate);
    expiryDate.setUTCDate(expiryDate.getUTCDate() + Number(validity_days) - 1);
    expiryDate.setUTCHours(18, 29, 59, 999); // 23:59:59+0530 (Asia/Colombo)
    // Determine pass holder name: use Stripe's customer_details.name
    let passHolderName = name || "-";
    // Upsert purchase
    try {
      console.log("[webhook] Attempting DB insert", {
        stripeSessionId,
        email,
        phone,
        pass_type,
        start_date,
        expiry: expiryDate.toISOString(),
        passHolderName,
      });
      await sql`
          INSERT INTO purchases (
            stripe_session_id, customer_email, customer_phone, pass_type, price_usd, start_date, expiry_date, status, created_at, pass_holder_name
          ) VALUES (
            ${stripeSessionId}, ${email}, ${phone}, ${pass_type}, 0, ${start_date}, ${expiryDate.toISOString()}, 'paid', NOW(), ${passHolderName}
          )
          ON CONFLICT (stripe_session_id) DO UPDATE SET status = 'paid', pass_holder_name = ${passHolderName}
        `;
      console.log(
        "[webhook] Inserted/updated purchase for session:",
        stripeSessionId,
      );
      // --- PassKit Smart Link Generation ---
      // Example: Issue PassKit smart link and update DB
      try {
        // Replace with actual PassKit API call
        const smartLinkUrl = await issuePassKitSmartLink({
          email,
          phone,
          pass_type,
          start_date,
          expiry_date: expiryDate.toISOString(),
          stripeSessionId,
        });
        // Update purchase with smart link
        await sql`
          UPDATE purchases SET smart_link_url = ${smartLinkUrl} WHERE stripe_session_id = ${stripeSessionId}
        `;
        console.log("[webhook] PassKit smart link issued:", smartLinkUrl);
      } catch (err) {
        console.error("[webhook] PassKit smart link error:", err.message);
      }
      // --- End PassKit Smart Link ---
    } catch (err) {
      console.error("[webhook] DB insert error:", err.message, err);
    }
  } else {
    console.log("[webhook] Event type not handled:", event.type);
    console.log("[webhook] Full event:", JSON.stringify(event, null, 2));
  }
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

// --- Helper: Issue PassKit Smart Link ---
async function issuePassKitSmartLink({
  email,
  phone,
  pass_type,
  start_date,
  expiry_date,
  stripeSessionId,
}) {
  try {
    console.log("▶️ Requesting SmartPass link from PassKit...");
    const response = await axios.post(
      API_URL,
      {
        projectDistributionUrl: {
          url: `https://pub1.pskt.io/c/${DISTRIBUTION_ID}`,
          title: "Ahangama Pass",
        },
        fields: {
          "members.program.name": "Ahangama Pass 2026",
          "members.member.points": "120",
          "members.tier.name": "Base",
          "members.member.status": "ACTIVE",
          "members.member.externalId": stripeSessionId,
          "person.displayName":
            session.custom_fields &&
            session.custom_fields.length > 0 &&
            session.custom_fields[0].value
              ? session.custom_fields[0].value
              : "-",
          "person.surname": "",
          "person.emailAddress": email,
          "person.mobileNumber": phone || "",
          "universal.info": "Valid at all participating Ahangama Pass venues.",
          "universal.expiryDate": expiry_date,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${SMARTPASS_SECRET}`,
          "Content-Type": "application/json",
        },
      },
    );
    const smartPassUrl = response.data;
    if (!smartPassUrl) {
      console.error("❌ No URL returned:", response.data);
      return null;
    }
    console.log("✅ SmartPass URL Generated:", smartPassUrl);
    return smartPassUrl;
  } catch (err) {
    if (err.response) {
      console.error("❌ API Error:", err.response.status, err.response.data);
    } else {
      console.error("❌ Error:", err.message);
    }
    return null;
  }
}

const DISTRIBUTION_ID = "5cb4m9";
const API_URL = "https://api.pub1.passkit.io/distribution/smartpasslink";
const SMARTPASS_SECRET = process.env.PASSKIT_SMARTPASS_SECRET;
