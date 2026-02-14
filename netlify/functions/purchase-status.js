import { neon } from "@neondatabase/serverless";

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async (req) => {
  let session_id;
  if (req.query && req.query.session_id) {
    session_id = req.query.session_id;
  } else if (req.url && req.url.includes("session_id=")) {
    // fallback for Netlify local/dev: parse from URL
    const url = new URL(req.url, "http://localhost");
    session_id = url.searchParams.get("session_id");
  }
  if (!session_id) return json(400, { error: "Missing session_id" });
  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  const [purchase] =
    await sql`SELECT * FROM purchases WHERE stripe_session_id = ${session_id}`;
  if (!purchase) return json(404, { error: "Not found" });
  // Map both camelCase and snake_case for compatibility
  return json(200, {
    id: purchase.stripe_session_id || purchase.stripeSessionId,
    status: purchase.status,
    smart_link_url: purchase.smart_link_url || purchase.smartLinkUrl,
    start_date: purchase.start_date || purchase.startDate,
    expiry_date: purchase.expiry_date || purchase.expiryDate,
    pass_type: purchase.pass_type || purchase.passType,
    validity_days: purchase.validity_days || purchase.validityDays,
    customer_email: purchase.customer_email || purchase.customerEmail,
    customer_phone: purchase.customer_phone || purchase.customerPhone,
    pass_holder_name: purchase.pass_holder_name || purchase.passHolderName,
  });
};
