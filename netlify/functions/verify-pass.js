import { neon } from "@neondatabase/serverless";

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async (req) => {
  const url = new URL(req.url, process.env.SITE_URL || "http://localhost:8889");
  const passId = url.searchParams.get("id");
  if (!passId) return json(400, { error: "Missing pass ID" });
  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  const [purchase] =
    await sql`SELECT expiry_date FROM purchases WHERE passkit_pass_id = ${passId}`;
  if (!purchase) return json(404, { error: "Not found" });
  const expiry = new Date(purchase.expiry_date);
  const now = new Date();
  const valid = expiry >= now;
  return json(200, { valid });
};
