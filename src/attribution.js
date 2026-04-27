const STORAGE_KEY = "ahangama_attribution";

const ATTRIBUTION_FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

function getSearchParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

function readGaClientIdFromCookie() {
  if (typeof document === "undefined") return "";

  const gaCookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("_ga="));

  if (!gaCookie) return "";

  const value = decodeURIComponent(gaCookie.slice(4));
  const parts = value.split(".");

  if (parts.length >= 4) {
    return `${parts[2]}.${parts[3]}`;
  }

  return "";
}

function parseUtmContent(rawContent) {
  if (!rawContent) {
    return {
      qr_venue: "",
      qr_surface: "",
      qr_creative: "",
    };
  }

  const [venue = "", surface = "", creative = ""] = rawContent.split("__");

  return {
    qr_venue: venue,
    qr_surface: surface,
    qr_creative: creative,
  };
}

function buildAttributionFromLocation() {
  const params = getSearchParams();
  const utmValues = Object.fromEntries(
    ATTRIBUTION_FIELDS.map((field) => [field, params.get(field) || ""]),
  );
  const landingPage = `${window.location.pathname}${window.location.search}`;

  return {
    ...utmValues,
    ...parseUtmContent(utmValues.utm_content),
    qr_landing_page: landingPage,
    ga_client_id: readGaClientIdFromCookie(),
  };
}

function hasAttributionValues(attribution) {
  return ATTRIBUTION_FIELDS.some((field) => attribution[field]);
}

function isCanonicalQrAttribution(attribution) {
  return (
    attribution.utm_source === "qr" &&
    attribution.utm_medium === "offline" &&
    Boolean(attribution.utm_content)
  );
}

export function getStoredAttribution() {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    const storedValue = rawValue ? JSON.parse(rawValue) : null;

    if (storedValue && !storedValue.ga_client_id) {
      const gaClientId = readGaClientIdFromCookie();

      if (gaClientId) {
        const updatedValue = {
          ...storedValue,
          ga_client_id: gaClientId,
        };

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedValue));
        return updatedValue;
      }
    }

    return storedValue;
  } catch {
    return null;
  }
}

export function captureAttribution() {
  if (typeof window === "undefined") return null;

  const nextAttribution = buildAttributionFromLocation();
  const storedAttribution = getStoredAttribution();

  if (!hasAttributionValues(nextAttribution)) {
    return storedAttribution;
  }

  if (!storedAttribution || isCanonicalQrAttribution(nextAttribution)) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAttribution));
    return nextAttribution;
  }

  return storedAttribution;
}