import React from "react";
import addToAppleWallet from "./assets/add_to_apple_wallet.png";
import addToGoogleWallet from "./assets/add_to_google_wallet.png";
import bookIcon from "./assets/book-icon.svg";
import emailIcon from "./assets/email-icon.svg";
import giftIcon from "./assets/gift-icon.svg";
import lightningIcon from "./assets/lightning-icon.svg";
import lockIcon from "./assets/lock-icon.svg";
import mapPinIcon from "./assets/map-pin-icon.svg";
import paperPlaneIcon from "./assets/paper-plane-icon.svg";
import pencilIcon from "./assets/pencil-icon.svg";
import phoneIcon from "./assets/phone-icon.svg";
import userIcon from "./assets/user-icon.svg";

const GUIDE_URL = "https://guide.ahangama.com";

function Free() {
  const todayStr = React.useMemo(
    () => new Date().toISOString().split("T")[0],
    [],
  );

  const initialFormData = React.useMemo(
    () => ({
      firstName: "",
      lastName: "",
      customerEmail: "",
      customerPhone: "",
    }),
    [],
  );

  const [formData, setFormData] = React.useState(initialFormData);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState(null);

  function handleChange(field) {
    return (event) => {
      setFormData((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/.netlify/functions/create-free-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startDate: todayStr,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create free pass.");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFormData(initialFormData);
    setResult(null);
    setError("");
  }

  const passHolderName = [formData.firstName, formData.lastName]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" ");

  return (
    <div
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        boxSizing: "border-box",
        background:
          "radial-gradient(circle at top, rgba(210, 105, 30, 0.16), transparent 30%), linear-gradient(160deg, #f7efe6 0%, #f3e6d7 42%, #efe8df 100%)",
        fontFamily: "Inter, Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1120,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 24,
          alignItems: "stretch",
        }}
      >
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            background:
              "radial-gradient(circle at top right, rgba(153, 92, 43, 0.14), transparent 28%), radial-gradient(circle at bottom left, rgba(201, 93, 26, 0.12), transparent 35%), linear-gradient(180deg, rgba(255, 251, 246, 0.98) 0%, rgba(249, 241, 231, 0.98) 100%)",
            color: "#5f3719",
            borderRadius: 32,
            padding: "1.8rem 1.3rem",
            boxShadow: "0 20px 60px rgba(74, 40, 9, 0.08)",
            border: "1px solid rgba(170, 112, 69, 0.16)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -28,
              right: -12,
              width: 190,
              height: 190,
              borderRadius: "50% 0 50% 50%",
              background:
                "radial-gradient(circle, rgba(160, 115, 73, 0.18) 0%, rgba(160, 115, 73, 0) 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gap: 16,
              minWidth: 0,
            }}
          >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    maxWidth: "100%",
                    borderRadius: 999,
                    padding: "0.45rem 1rem",
                    background: "linear-gradient(135deg, #9b531f, #7f3c14)",
                    color: "#fff6ef",
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    boxShadow: "0 10px 22px rgba(127, 60, 20, 0.18)",
                  }}
                >
                  <span>Free</span>
                  <span style={{ opacity: 0.7 }}>•</span>
                  <span>30 Day Access</span>
                </div>
                <h1
                  style={{
                    margin: "14px 0 10px",
                    fontFamily: "Iowan Old Style, Baskerville, Palatino, Georgia, serif",
                    fontSize: "clamp(2.7rem, 6vw, 4.4rem)",
                    lineHeight: 0.98,
                    letterSpacing: "-0.04em",
                    color: "#4a2310",
                  }}
                >
                  Get the
                  <br />
                  Ahangama Pass
                </h1>
                <p
                  style={{
                    maxWidth: 540,
                    margin: "0 auto",
                    padding: "0 0.25rem",
                    color: "#785842",
                    fontSize: 16,
                    lineHeight: 1.5,
                  }}
                >
                  Unlock perks at 100+ cafes, wellness spots, surf venues,
                  stays and more.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: 12,
                  minWidth: 0,
                }}
              >
                {featureItems.map((item) => (
                  <div
                    key={item.title}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      borderRadius: 18,
                      padding: "0.8rem 0.75rem",
                      background: "rgba(255, 255, 255, 0.72)",
                      border: "1px solid rgba(170, 112, 69, 0.14)",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        background: "#f5e5d3",
                        color: "#8b4d24",
                        fontWeight: 700,
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      {item.iconSrc ? (
                        <img
                          src={item.iconSrc}
                          alt=""
                          aria-hidden="true"
                          style={{ width: 18, height: 18 }}
                        />
                      ) : (
                        item.badge
                      )}
                    </div>
                    <div>
                      <div
                        style={{ fontSize: 14, fontWeight: 700, color: "#4a2310" }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#7b5d47",
                          marginTop: 2,
                        }}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: "center" }}>
                <a href="#free-pass-form" style={heroCtaStyle}>
                  Get My Free Pass
                </a>
                <div
                  style={{
                    marginTop: 10,
                    color: "#8a6a53",
                    fontSize: 13,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <img
                    src={lockIcon}
                    alt=""
                    aria-hidden="true"
                    style={{ width: 14, height: 14, opacity: 0.8 }}
                  />
                  100% free. No payment. No hidden fees.
                </div>
              </div>

              <div
                style={{
                  borderRadius: 24,
                  background: "rgba(255, 251, 246, 0.9)",
                  border: "1px solid rgba(170, 112, 69, 0.18)",
                  padding: "1rem 0.9rem",
                  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.7)",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    fontFamily:
                      "Iowan Old Style, Baskerville, Palatino, Georgia, serif",
                    color: "#6f3e1b",
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  Your pass. Your perks.
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  {proofItems.map((item) => (
                    <div
                      key={item.title}
                      style={{
                        borderRadius: 16,
                        background: "#fffdf9",
                        padding: "0.8rem 0.55rem",
                        textAlign: "center",
                        border: "1px solid rgba(170, 112, 69, 0.12)",
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          minWidth: 76,
                          justifyContent: "center",
                          borderRadius: 10,
                          padding: item.logoSrc ? "0" : "0.35rem 0.5rem",
                          background: item.logoSrc ? "transparent" : item.accent,
                          color: item.accentColor,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.02em",
                        }}
                      >
                        {item.logoSrc ? (
                          <img
                            src={item.logoSrc}
                            alt={item.logoAlt}
                            style={{
                              display: "block",
                              width: item.logoWidth || 112,
                              maxWidth: "100%",
                              height: "auto",
                            }}
                          />
                        ) : (
                          item.label
                        )}
                      </div>
                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#4a2310",
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{ marginTop: 3, fontSize: 12, color: "#7b5d47" }}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div
                  style={{
                    textAlign: "center",
                    color: "#5f3719",
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  How it works
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 8,
                    alignItems: "start",
                    minWidth: 0,
                  }}
                >
                  {steps.map((item, index) => (
                    <div
                      key={item.title}
                      style={{ textAlign: "center", position: "relative" }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          margin: "0 auto 8px",
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          background: "#f5e5d3",
                          color: "#8b4d24",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {item.iconSrc ? (
                          <img
                            src={item.iconSrc}
                            alt=""
                            aria-hidden="true"
                            style={{ width: 16, height: 16 }}
                          />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div
                        style={{ fontSize: 13, fontWeight: 700, color: "#4a2310" }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{ marginTop: 3, fontSize: 12, color: "#7b5d47" }}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        </section>

        <section
          id="free-pass-form"
          style={{
            background: "rgba(255, 255, 255, 0.94)",
            borderRadius: 28,
            boxShadow: "0 18px 60px rgba(74, 40, 9, 0.12)",
            padding: "2rem 1.4rem",
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ color: "#6d3412", margin: "0 0 8px", fontSize: 30 }}>
              Claim your free pass
            </h2>
            <p style={{ color: "#7e5a43", margin: 0, fontSize: 15, lineHeight: 1.6 }}>
              We collect your first name, last name, email, and WhatsApp mobile
              so we can generate your Ahangama Pass and send your guide access.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              <label style={labelStyle}>
                <span style={labelContentStyle}>
                  <img src={userIcon} alt="" aria-hidden="true" style={labelIconStyle} />
                  First Name
                </span>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange("firstName")}
                  placeholder="First name"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                <span style={labelContentStyle}>
                  <img src={userIcon} alt="" aria-hidden="true" style={labelIconStyle} />
                  Last Name
                </span>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange("lastName")}
                  placeholder="Last name"
                  style={inputStyle}
                />
              </label>
            </div>

            <label style={labelStyle}>
              <span style={labelContentStyle}>
                <img src={emailIcon} alt="" aria-hidden="true" style={labelIconStyle} />
                Email
              </span>
              <input
                type="email"
                required
                value={formData.customerEmail}
                onChange={handleChange("customerEmail")}
                placeholder="name@example.com"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelContentStyle}>
                <img src={phoneIcon} alt="" aria-hidden="true" style={labelIconStyle} />
                Mobile WhatsApp
              </span>
              <input
                type="tel"
                required
                value={formData.customerPhone}
                onChange={handleChange("customerPhone")}
                placeholder="+94..."
                style={inputStyle}
              />
            </label>

            <div
              style={{
                borderRadius: 16,
                background: "#f8f2eb",
                padding: "0.9rem 1rem",
                color: "#7e5a43",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              Pass holder: <strong>{passHolderName || "Your name will appear here"}</strong>
              <br />
              Your free pass starts today and is valid for 30 days.
            </div>

            {error && (
              <div style={{ color: "#b42318", fontWeight: 700 }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 16,
                background: "linear-gradient(135deg, #c95d1a, #8B4513)",
                color: "#fff",
                padding: "1rem",
                fontSize: 17,
                fontWeight: 700,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Creating Your Pass..." : "Get My Free Ahangama Pass"}
            </button>
          </form>

          {result && (
            <div
              style={{
                marginTop: 18,
                borderRadius: 18,
                border: "1px solid #d9c7b5",
                padding: "1rem",
                background: "#fffaf5",
                color: "#5f3719",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 22 }}>
                Your free Ahangama Pass is ready
              </h3>
              <div style={resultRowStyle}>
                <strong>Pass Holder</strong>
                <span>{result.passHolderName}</span>
              </div>
              <div style={resultRowStyle}>
                <strong>Email</strong>
                <span>{result.customerEmail}</span>
              </div>
              <div style={resultRowStyle}>
                <strong>WhatsApp</strong>
                <span>{result.customerPhone}</span>
              </div>
              <div style={resultRowStyle}>
                <strong>Valid From</strong>
                <span>{formatDate(result.startDate)}</span>
              </div>
              <div style={resultRowStyle}>
                <strong>Valid Until</strong>
                <span>{formatDate(result.expiryDate)}</span>
              </div>
              <div style={resultRowStyle}>
                <strong>Pass ID</strong>
                <span>{result.passkitPassId}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 16,
                }}
              >
                <a
                  href={result.smartLinkUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={primaryActionStyle}
                >
                  Open Digital Pass
                </a>
                <a
                  href={buildWhatsAppUrl(result.smartLinkUrl)}
                  target="_blank"
                  rel="noreferrer"
                  style={secondaryActionStyle}
                >
                  Share Pass on WhatsApp
                </a>
                <a
                  href={result.guideUrl || GUIDE_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={secondaryActionStyle}
                >
                  Open 2026/2027 Guide
                </a>
                <button
                  type="button"
                  onClick={handleReset}
                  style={ghostButtonStyle}
                >
                  Create Another Pass
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().split("T")[0];
}

function buildWhatsAppUrl(smartLinkUrl) {
  const message = `Here is your free Ahangama Pass: ${smartLinkUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

const featureItems = [
  {
    badge: "100+",
    iconSrc: giftIcon,
    title: "100+ venues",
    subtitle: "Exclusive perks",
  },
  {
    badge: "NOW",
    iconSrc: lightningIcon,
    title: "Instant access",
    subtitle: "Delivered instantly",
  },
  {
    badge: "GUIDE",
    iconSrc: bookIcon,
    title: "Free guide",
    subtitle: "2026/27 edition",
  },
];

const proofItems = [
  {
    label: "Wallet",
    logoSrc: addToAppleWallet,
    logoAlt: "Add to Apple Wallet",
    logoWidth: 118,
    title: "Apple Wallet ready",
    subtitle: "Pass added in one tap",
    accent: "#111111",
    accentColor: "#ffffff",
  },
  {
    label: "Google",
    logoSrc: addToGoogleWallet,
    logoAlt: "Add to Google Wallet",
    logoWidth: 124,
    title: "Google Wallet ready",
    subtitle: "Save it to your phone",
    accent: "#ffffff",
    accentColor: "#4a2310",
  },
  {
    label: "Proof",
    title: "Used by travellers",
    subtitle: "Across Ahangama",
    accent: "#f2e5d8",
    accentColor: "#8b4d24",
  },
];

const steps = [
  {
    title: "Enter details",
    subtitle: "Takes 10 seconds",
    iconSrc: pencilIcon,
  },
  {
    title: "Receive instantly",
    subtitle: "On WhatsApp",
    iconSrc: paperPlaneIcon,
  },
  {
    title: "Enjoy the perks",
    subtitle: "Across Ahangama",
    iconSrc: mapPinIcon,
  },
];

const labelStyle = {
  display: "block",
  color: "#6d3412",
  fontWeight: 700,
  fontSize: 14,
};

const labelContentStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const labelIconStyle = {
  width: 14,
  height: 14,
  opacity: 0.9,
};

const inputStyle = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  marginTop: 6,
  padding: "0.85rem 0.95rem",
  borderRadius: 14,
  border: "1px solid #d9c7b5",
  boxSizing: "border-box",
  fontSize: 16,
  background: "#fff",
  color: "#000",
  caretColor: "#000",
  WebkitTextFillColor: "#000",
  colorScheme: "light",
};

const resultRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  padding: "0.35rem 0",
  fontSize: 14,
};

const heroCtaStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  maxWidth: 420,
  minHeight: 76,
  borderRadius: 22,
  background: "linear-gradient(135deg, #b25c22, #8B4513)",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 18,
  boxShadow: "0 16px 30px rgba(139, 69, 19, 0.18)",
};

const primaryActionStyle = {
  display: "inline-block",
  background: "#8B4513",
  color: "#fff",
  borderRadius: 12,
  padding: "0.8rem 1rem",
  textDecoration: "none",
  fontWeight: 700,
};

const secondaryActionStyle = {
  display: "inline-block",
  background: "#f3e2cf",
  color: "#6d3412",
  borderRadius: 12,
  padding: "0.8rem 1rem",
  textDecoration: "none",
  fontWeight: 700,
};

const ghostButtonStyle = {
  border: "1px solid #d9c7b5",
  background: "#fff",
  color: "#6d3412",
  borderRadius: 12,
  padding: "0.8rem 1rem",
  fontWeight: 700,
};

export default Free;