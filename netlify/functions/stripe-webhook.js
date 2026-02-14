import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";
import sgMail from "@sendgrid/mail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);
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
  console.log("[webhook] endpointSecret:", endpointSecret);
  console.log("[webhook] signature header:", sig);
  console.log(
    "[webhook] rawBody type:",
    rawBody && rawBody.constructor && rawBody.constructor.name,
  );
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      // Compute expiry date (end of day Asia/Colombo)
      const { id: stripeSessionId, customer_details, metadata } = session;
      const { email, phone, name } = customer_details || {};
      const { pass_type, start_date, validity_days } = metadata || {};
      const startDate = new Date(start_date);
      const expiryDate = new Date(startDate);
      expiryDate.setUTCDate(
        expiryDate.getUTCDate() + Number(validity_days) - 1,
      );
      expiryDate.setUTCHours(18, 29, 59, 999);
      // Upsert purchase
      try {
        await sql`
          INSERT INTO purchases (
            stripe_session_id, customer_email, customer_phone, pass_type, price_usd, start_date, expiry_date, status, created_at, pass_holder_name
          ) VALUES (
            ${stripeSessionId}, ${email}, ${phone}, ${pass_type}, 0, ${start_date}, ${expiryDate.toISOString()}, 'paid', NOW(), ${name || "-"}
          )
          ON CONFLICT (stripe_session_id) DO UPDATE SET status = 'paid', pass_holder_name = ${name || "-"}
        `;
      } catch (err) {
        console.error("[webhook] DB insert error:", err.message, err);
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
