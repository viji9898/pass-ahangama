import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";
import sgMail from "@sendgrid/mail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const sql = neon(process.env.NETLIFY_DATABASE_URL);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const config = { api: { bodyParser: false } };

function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async (req, res) => {
  if (req.method !== "POST") {
    console.log("[webhook] Not a POST request");
    return new Response("Not a POST request", { status: 405 });
  }
  const sig = req.headers["stripe-signature"];
  const buf = await buffer(req);
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
    console.log("[webhook] Event received:", event.type);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log(
      "[webhook] checkout.session.completed payload:",
      JSON.stringify(session, null, 2),
    );
    const { id: stripeSessionId, customer_details, metadata } = session;
    const { email, phone } = customer_details || {};
    const { pass_type, start_date, validity_days } = metadata || {};
    console.log("[webhook] Parsed:", {
      stripeSessionId,
      email,
      phone,
      pass_type,
      start_date,
      validity_days,
    });
    // Compute expiry date (end of day Asia/Colombo)
    const startDate = new Date(start_date);
    const expiryDate = new Date(startDate);
    expiryDate.setUTCDate(expiryDate.getUTCDate() + Number(validity_days) - 1);
    expiryDate.setUTCHours(18, 29, 59, 999); // 23:59:59+0530 (Asia/Colombo)
    // Upsert purchase
    try {
      await sql`
        INSERT INTO purchases (
          stripe_session_id, customer_email, customer_phone, pass_type, price_usd, start_date, expiry_date, status, created_at
        ) VALUES (
          ${stripeSessionId}, ${email}, ${phone}, ${pass_type}, 0, ${start_date}, ${expiryDate.toISOString()}, 'paid', NOW()
        )
        ON CONFLICT (stripe_session_id) DO UPDATE SET status = 'paid'
      `;
      console.log(
        "[webhook] Inserted/updated purchase for session:",
        stripeSessionId,
      );
    } catch (err) {
      console.error("[webhook] DB insert error:", err.message);
    }

    // PassKit Smart Link issuance
    let passkit_pass_id = null;
    let smart_link_url = null;
    let passkitError = null;
    try {
      const API_URL = "https://api.pub1.passkit.io/distribution/smartpasslink";
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PASSKIT_SMARTPASS_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          externalId: stripeSessionId,
          expiry: expiryDate.toISOString(),
          programId: process.env.PASSKIT_PROGRAM_ID, // set in .env
          classId: process.env.PASSKIT_CLASS_ID, // set in .env
          tier: pass_type,
          // add more fields as needed
        }),
      });
      const pk = await response.json();
      if (!response.ok) throw new Error(pk.error || "PassKit error");
      passkit_pass_id = pk.passId || pk.id || null;
      smart_link_url = pk.smartLinkUrl || pk.url || null;
      if (passkit_pass_id && smart_link_url) {
        await sql`
          UPDATE purchases SET passkit_pass_id = ${passkit_pass_id}, smart_link_url = ${smart_link_url}, status = 'issued'
          WHERE stripe_session_id = ${stripeSessionId}
        `;
        console.log(
          "[webhook] Updated purchase with smart link:",
          smart_link_url,
        );
      }
    } catch (err) {
      passkitError = err.message;
      console.error("[webhook] PassKit error:", passkitError);
    }
    // SendGrid email logic
    let emailSentAt = null;
    let emailError = null;
    if (smart_link_url && email) {
      try {
        const msg = {
          to: email,
          from: process.env.SENDGRID_FROM_EMAIL || "no-reply@pass.ahangama.com",
          subject: "Your Ahangama Pass – Add to Wallet",
          html: `
            <h2>Your Ahangama Pass is Ready!</h2>
            <p>Pass type: <strong>${pass_type}</strong></p>
            <p>Valid from <strong>${startDate.toISOString().slice(0, 10)}</strong> to <strong>${expiryDate.toISOString().slice(0, 10)}</strong></p>
            <p>
              <a href="${smart_link_url}" style="display:inline-block;padding:16px 28px;background:#1a73e8;color:#fff;border-radius:8px;text-decoration:none;font-size:18px;">Add to Wallet</a>
            </p>
            <p>If the button above does not work, copy and paste this link into your browser:<br>${smart_link_url}</p>
            <p>Thank you for choosing Ahangama Pass!</p>
          `,
        };
        await sgMail.send(msg);
        emailSentAt = new Date().toISOString();
        await sql`
          UPDATE purchases SET email_sent_at = ${emailSentAt}, status = 'email_sent'
          WHERE stripe_session_id = ${stripeSessionId}
        `;
        console.log("[webhook] Sent email to:", email);
      } catch (err) {
        emailError = err.message;
        console.error("[webhook] SendGrid error:", emailError);
      }
    }
    // TODO: Airtable sync here (set airtable_sync_status)
    // TODO: Airtable sync here (set airtable_sync_status)
  }
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
