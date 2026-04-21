import { neon } from "@neondatabase/serverless";

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
    return json(202, {
      pending: true,
      message: "Promo activation is still processing.",
    });
  }

  return json(200, {
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
  });
};
