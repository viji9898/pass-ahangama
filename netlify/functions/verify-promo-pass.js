import { neon } from "@neondatabase/serverless";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async (req) => {
  const url = new URL(req.url, process.env.SITE_URL || "http://localhost:8889");
  const passId = url.searchParams.get("id");
  if (!passId) return json(400, { error: "Missing pass ID" });

  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  const [subscription] = await sql`
    SELECT
      passkit_pass_id,
      billing_status,
      access_status,
      trial_start_at,
      trial_end_at,
      paid_start_at,
      paid_end_at,
      cancel_at
    FROM promo_subscriptions
    WHERE passkit_pass_id = ${passId}
  `;

  if (!subscription) return json(404, { error: "Not found" });

  const now = new Date();
  const paidEndAt = subscription.paid_end_at
    ? new Date(subscription.paid_end_at)
    : null;
  const accessStatus = subscription.access_status;
  const billingStatus = subscription.billing_status;

  const allowsAccess =
    accessStatus === "active" || accessStatus === "manual_review";
  const withinWindow = paidEndAt ? paidEndAt >= now : false;
  const valid = allowsAccess && withinWindow;

  return json(200, {
    valid,
    access_status: accessStatus,
    billing_status: billingStatus,
    review_required: accessStatus === "manual_review",
    trial_start_at: subscription.trial_start_at,
    trial_end_at: subscription.trial_end_at,
    paid_start_at: subscription.paid_start_at,
    paid_end_at: subscription.paid_end_at,
    cancel_at: subscription.cancel_at,
  });
};