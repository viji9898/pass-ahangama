import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";
import sgMail from "@sendgrid/mail";
import crypto from "crypto";

function generatePassCode(sessionId, length = 12) {
  return crypto
    .createHash("sha256")
    .update(sessionId)
    .digest("hex")
    .slice(0, length);
}

const stripe = new Stripe(
  process.env.NODE_ENV === "development"
    ? process.env.STRIPE_SECRET_KEY_TEST
    : process.env.STRIPE_SECRET_KEY_LIVE,
);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const sql = neon(process.env.NETLIFY_DATABASE_URL);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const config = { api: { bodyParser: false } };

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

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Not a POST request", { status: 405 });
  }
  const sig = req.headers.get("stripe-signature");
  const rawBody = await getRawBody(req.body);
  // Debug logging for troubleshooting signature verification
  // console.log("[webhook] endpointSecret:", endpointSecret);
  // console.log("[webhook] signature header:", sig);
  // console.log(
  //   "[webhook] rawBody type:",
  //   rawBody && rawBody.constructor && rawBody.constructor.name,
  // );
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    console.log(rawBody);
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.log(
        "[webhook] Stripe session object:",
        JSON.stringify(session, null, 2),
      );

      // Fetch Stripe receipt URL from PaymentIntent
      let receiptUrl = null;
      // Retrieve full session with expanded payment_intent + charges
      try {
        const fullSession = await stripe.checkout.sessions.retrieve(
          session.id,
          {
            expand: ["payment_intent.charges"],
          },
        );
        const paymentIntent = fullSession.payment_intent;
        const charge = paymentIntent?.charges?.data?.[0];
        receiptUrl = charge?.receipt_url || null;
        console.log("[webhook] Stripe receipt URL:", receiptUrl);
      } catch (err) {
        console.error(
          "[webhook] Error expanding session for receipt_url:",
          err.message,
        );
      }
      // Compute expiry date (end of day Asia/Colombo)
      const { id: stripeSessionId, customer_details, metadata } = session;
      const { email, phone, name } = customer_details || {};
      const { pass_type, start_date, validity_days } = metadata || {};
      const startDate = new Date(start_date);
      // Expiry date is start date + validity_days - 1 (inclusive)
      const expiryDate = new Date(startDate);
      if (!isNaN(expiryDate) && validity_days) {
        expiryDate.setUTCDate(
          expiryDate.getUTCDate() + Number(validity_days) - 1,
        );
        expiryDate.setUTCHours(23, 59, 59, 999); // End of day UTC
      }

      // PassKit smart link generation
      let smartLink = null;
      // Generate passkitPassId from session id
      const passkitPassId = generatePassCode(stripeSessionId, 12);
      console.log("Generated pass code:", passkitPassId);
      // Format expiry for PassKit as ISO-8601 with timezone offset (Asia/Colombo +05:30)
      function toColomboIsoString(date) {
        // Asia/Colombo is UTC+5:30
        const offsetMs = 5.5 * 60 * 60 * 1000;
        const local = new Date(date.getTime() + offsetMs);
        const pad = (n) => String(n).padStart(2, "0");
        return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}:${pad(local.getSeconds())}+05:30`;
      }
      const passkitExpiryIso = toColomboIsoString(expiryDate);
      try {
        const axios = (await import("axios")).default;
        const DISTRIBUTION_ID = "5cb4m9";
        const API_URL =
          "https://api.pub1.passkit.io/distribution/smartpasslink";
        const SMARTPASS_SECRET =
          process.env.SMARTPASS_SECRET ||
          "Iqwj_wfzVrdw7xRMu-HIMxRhaob6seRM8yRz01a1arAyhqVHmnMdPXoX0COUEFtVtQj1ErCjNGwKLS3k9itJx0CufoSvOLY5VpXtsFtJMv4w3v_LdYbq_27Sa5GhYR2x94d6yX5A6jhwFboSB9gwcScT6Yns0HORlF4pBROp2EF6Zu5cuum3p8kKYMic3qR2KEIeUBaF4m-Z_Uga6ANycn-njwXGM45HUg0krc2n3_ZT_3WPHRakEcDaf5FjYgpeIQcCOCVgmHJz_NIfq8ncHXHh2TcEmQGy9naM8O_0aQNqlTJPrZkl53KrKvhv_7eB";
        const smartPassFields = {
          "members.program.name": "Ahangama Pass 2026",
          "members.member.points": "120",
          "members.tier.name": "Base",
          "members.member.status": "ACTIVE",
          "members.member.externalId": `https://pass.ahangama.com/v?id=${passkitPassId}`,
          "person.displayName": name || "Ahangama Pass Holder",
          "person.surname": "",
          "person.emailAddress": email || "",
          "person.mobileNumber": phone || "",
          "universal.info": "Valid at all participating Ahangama Pass venues.",
          "universal.expiryDate": passkitExpiryIso,
        };
        const response = await axios.post(
          API_URL,
          {
            projectDistributionUrl: {
              url: `https://pub1.pskt.io/c/${DISTRIBUTION_ID}`,
              title: "Ahangama Pass",
            },
            fields: smartPassFields,
          },
          {
            headers: {
              Authorization: `Bearer ${SMARTPASS_SECRET}`,
              "Content-Type": "application/json",
            },
          },
        );
        console.log("[webhook] PassKit API response:", response.data);
        smartLink = response.data?.url || response.data || null;
      } catch (err) {
        console.error("[webhook] PassKit smart link error:", err.message);
      }

      // Upsert purchase with smart link
      try {
        await sql`
          INSERT INTO purchases (
            stripe_session_id, customer_email, customer_phone, pass_type, price_usd, start_date, expiry_date, status, created_at, pass_holder_name, smart_link_url, passkit_pass_id, receipt_url
          ) VALUES (
            ${stripeSessionId}, ${email}, ${phone}, ${pass_type}, 0, ${start_date}, ${expiryDate.toISOString()}, 'paid', NOW(), ${name || "-"}, ${smartLink}, ${passkitPassId}, ${receiptUrl}
          )
          ON CONFLICT (stripe_session_id) DO UPDATE SET status = 'paid', pass_holder_name = ${name || "-"}, smart_link_url = ${smartLink}, passkit_pass_id = ${passkitPassId}, receipt_url = ${receiptUrl}
        `;
      } catch (err) {
        console.error("[webhook] DB insert error:", err.message, err);
      }

      // Send email to customer
      // Log values before sending email
      console.log("[webhook] Email send debug:", {
        customerEmail: email,
        smartLinkUrl: smartLink,
      });
      try {
        const emailModule = await import("./EmailComponent.js");
        await emailModule.sendAhangamaPassEmail({
          customerEmail: email,
          passHolderName: name || "-",
          smartLinkUrl: smartLink,
          passType: pass_type || "Standard",
          startDate: start_date,
          expiryDate: expiryDate.toISOString(),
          receiptUrl: receiptUrl,
        });
      } catch (err) {
        console.error("[webhook] Email send error:", err.message, err);
      }
      break;
    }
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      break;
    }
    case "payment_method.attached": {
      const paymentMethod = event.data.object;
      // handlePaymentMethodAttached(paymentMethod);
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}.`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
