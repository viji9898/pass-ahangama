import React from "react";

const passOptions = [
  {
    passType: "comp_7",
    label: "1 Week",
    description: "",
  },
  {
    passType: "comp_14",
    label: "2 Weeks",
    description: "",
  },
  {
    passType: "comp_30",
    label: "1 Month",
    description: "",
  },
];

function Comp() {
  const todayStr = new Date().toISOString().split("T")[0];
  const maxDate = React.useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 60);
    return date.toISOString().split("T")[0];
  }, []);

  const initialFormData = React.useMemo(
    () => ({
      passHolderName: "",
      customerEmail: "",
      customerPhone: "",
      startDate: todayStr,
      passType: passOptions[0].passType,
      promoCode: "",
    }),
    [todayStr],
  );

  const [formData, setFormData] = React.useState(initialFormData);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState(null);

  const selectedPass = passOptions.find(
    (option) => option.passType === formData.passType,
  );

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
      const response = await fetch("/.netlify/functions/issue-comp-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          promoCode: formData.promoCode.trim().toUpperCase(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to issue complimentary pass.");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleIssueAnotherPass() {
    setFormData(initialFormData);
    setResult(null);
    setError("");
  }

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
          "radial-gradient(circle at top, rgba(210, 105, 30, 0.18), transparent 35%), linear-gradient(160deg, #f7efe6 0%, #f1e0cd 45%, #efe8df 100%)",
        fontFamily: "Inter, Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "rgba(255, 255, 255, 0.94)",
          borderRadius: 24,
          boxShadow: "0 18px 60px rgba(74, 40, 9, 0.12)",
          padding: "2rem 1.25rem",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              display: "inline-block",
              borderRadius: 999,
              padding: "0.35rem 0.8rem",
              background: "#f3e2cf",
              color: "#8B4513",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Standalone Complimentary Flow
          </div>
          <h1 style={{ color: "#6d3412", margin: "14px 0 8px", fontSize: 30 }}>
            Issue Complimentary Pass
          </h1>
          <p style={{ color: "#7e5a43", margin: 0, fontSize: 15 }}>
            Create a pass without Stripe, save it to the database, and send the
            intro email immediately.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <label style={labelStyle}>
            Pass Holder Name
            <input
              type="text"
              required
              value={formData.passHolderName}
              onChange={handleChange("passHolderName")}
              placeholder="Full name"
              style={inputStyle}
            />
          </label>

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
            Phone
            <input
              type="tel"
              required
              value={formData.customerPhone}
              onChange={handleChange("customerPhone")}
              placeholder="+94..."
              style={inputStyle}
            />
          </label>

          <label style={fieldWrapperStyle}>
            Start Date
            <input
              type="date"
              required
              min={todayStr}
              max={maxDate}
              value={formData.startDate}
              onChange={handleChange("startDate")}
              style={dateInputStyle}
            />
          </label>

          <div>
            <div style={{ ...labelStyle, marginBottom: 8 }}>
              Complimentary Pass Option
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              {passOptions.map((option) => {
                const active = option.passType === formData.passType;
                return (
                  <button
                    key={option.passType}
                    type="button"
                    onClick={() =>
                      setFormData((current) => ({
                        ...current,
                        passType: option.passType,
                      }))
                    }
                    style={{
                      width: "100%",
                      minHeight: 112,
                      textAlign: "center",
                      borderRadius: 16,
                      border: active
                        ? "2px solid #8B4513"
                        : "1px solid #d9c7b5",
                      background: active ? "#8B4513" : "#fffaf5",
                      color: active ? "#fff" : "#6d3412",
                      padding: "0.95rem 0.75rem",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 17 }}>
                      {option.label}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 13,
                        color: active ? "#f3dfcf" : "#8b6a56",
                      }}
                    >
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <label style={labelStyle}>
            Promo Code
            <input
              type="text"
              required
              value={formData.promoCode}
              onChange={handleChange("promoCode")}
              placeholder="Coupon code for complimentary pass"
              style={{ ...inputStyle, textTransform: "uppercase" }}
            />
          </label>

          <div
            style={{
              borderRadius: 14,
              background: "#f8f2eb",
              padding: "0.9rem 1rem",
              color: "#7e5a43",
              fontSize: 14,
            }}
          >
            Selected option: <strong>{selectedPass?.label}</strong>
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
            {loading ? "Issuing Pass..." : "Issue Complimentary Pass"}
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
            <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 21 }}>
              Pass Issued
            </h2>
            <div style={resultRowStyle}>
              <strong>Pass Type</strong>
              <span>{result.passLabel}</span>
            </div>
            <div style={resultRowStyle}>
              <strong>Pass Holder</strong>
              <span>{result.passHolderName}</span>
            </div>
            <div style={resultRowStyle}>
              <strong>Email</strong>
              <span>{result.customerEmail}</span>
            </div>
            <div style={resultRowStyle}>
              <strong>Phone</strong>
              <span>{result.customerPhone}</span>
            </div>
            <div style={resultRowStyle}>
              <strong>Start Date</strong>
              <span>{formatDate(result.startDate)}</span>
            </div>
            <div style={resultRowStyle}>
              <strong>Expiry Date</strong>
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
                marginTop: 14,
              }}
            >
              <a
                href={result.smartLinkUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  background: "#8B4513",
                  color: "#fff",
                  borderRadius: 12,
                  padding: "0.8rem 1rem",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Open Digital Pass
              </a>
              <button
                type="button"
                onClick={handleIssueAnotherPass}
                style={{
                  border: "1px solid #d9c7b5",
                  background: "#fff",
                  color: "#6d3412",
                  borderRadius: 12,
                  padding: "0.8rem 1rem",
                  fontWeight: 700,
                }}
              >
                Issue Another Complimentary Pass
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().split("T")[0];
}

const labelStyle = {
  display: "block",
  color: "#6d3412",
  fontWeight: 700,
  fontSize: 14,
};

const fieldWrapperStyle = {
  ...labelStyle,
  width: "100%",
  minWidth: 0,
  overflow: "hidden",
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
};

const dateInputStyle = {
  ...inputStyle,
  display: "block",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  appearance: "none",
  WebkitAppearance: "none",
  overflow: "hidden",
  textOverflow: "ellipsis",
  lineHeight: 1.2,
  paddingRight: "0.75rem",
};

const resultRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  padding: "0.35rem 0",
  fontSize: 14,
};

export default Comp;
