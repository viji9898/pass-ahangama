import React from "react";

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
          maxWidth: 1080,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 24,
          alignItems: "stretch",
        }}
      >
        <section
          style={{
            background: "rgba(109, 52, 18, 0.95)",
            color: "#fff6ef",
            borderRadius: 28,
            padding: "2.2rem 1.6rem",
            boxShadow: "0 18px 60px rgba(74, 40, 9, 0.15)",
          }}
        >
          <div
            style={{
              display: "inline-block",
              borderRadius: 999,
              padding: "0.35rem 0.8rem",
              background: "rgba(255, 239, 224, 0.16)",
              color: "#ffe8d6",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Free Of Charge
          </div>
          <h1 style={{ margin: "16px 0 12px", fontSize: 42, lineHeight: 1.05 }}>
            Get the Ahangama Pass
          </h1>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.6, color: "#f7d7be" }}>
            Unlock perks and privileges across 100+ venues in Ahangama and
            get the 2026/2027 Ahangama Guide at no cost.
          </p>

          <div
            style={{
              marginTop: 24,
              display: "grid",
              gap: 14,
            }}
          >
            {highlights.map((item) => (
              <div
                key={item.title}
                style={{
                  borderRadius: 18,
                  background: "rgba(255, 255, 255, 0.08)",
                  padding: "1rem 1.05rem",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 16 }}>{item.title}</div>
                <div
                  style={{
                    marginTop: 4,
                    color: "#f7d7be",
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  {item.description}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 24,
              borderRadius: 18,
              background: "#fff6ef",
              color: "#5f3719",
              padding: "1rem 1.05rem",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              What you receive
            </div>
            <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
              <span>Digital Ahangama Pass generated instantly</span>
              <span>Guide access at guide.ahangama.com</span>
              <span>Pass link ready to share on WhatsApp</span>
            </div>
          </div>
        </section>

        <section
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
                First Name
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
                Last Name
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
              Email
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
              Mobile WhatsApp
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

const highlights = [
  {
    title: "Perks across Ahangama",
    description:
      "Use your pass across 100+ participating venues for curated local benefits.",
  },
  {
    title: "Guide included",
    description:
      "Get the 2026/2027 Ahangama Guide with places, planning ideas, and local recommendations.",
  },
  {
    title: "WhatsApp-ready delivery",
    description:
      "Your pass is generated instantly with a smart link you can open or share on WhatsApp.",
  },
];

const labelStyle = {
  display: "block",
  color: "#6d3412",
  fontWeight: 700,
  fontSize: 14,
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