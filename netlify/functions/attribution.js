const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "qr_venue",
  "qr_surface",
  "qr_creative",
  "qr_landing_page",
  "ga_client_id",
];

export function getAttributionFromBody(body = {}) {
  return Object.fromEntries(
    ATTRIBUTION_KEYS.map((key) => [key, typeof body[key] === "string" ? body[key] : ""]),
  );
}

export function buildStripeAttributionMetadata(attribution = {}) {
  return {
    qr_source: attribution.utm_source || "",
    qr_medium: attribution.utm_medium || "",
    qr_campaign: attribution.utm_campaign || "",
    qr_content: attribution.utm_content || "",
    qr_goal: attribution.utm_term || "",
    qr_venue: attribution.qr_venue || "",
    qr_surface: attribution.qr_surface || "",
    qr_creative: attribution.qr_creative || "",
    qr_landing_page: attribution.qr_landing_page || "",
    ga_client_id: attribution.ga_client_id || "",
  };
}