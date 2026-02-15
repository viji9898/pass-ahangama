// --- Serverless function code moved to netlify/functions/create-checkout-session.js ---

import React from "react";
import "./App.css";

function App() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = React.useState(todayStr);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const passes = [
    {
      label: "15-Day Pass",
      passType: "pass_15",
      price: "USD 18",
      desc: "Best for short stays",
    },
    {
      label: "30-Day Pass",
      passType: "pass_30",
      price: "USD 35",
      desc: "Great for a month",
    },
    {
      label: "90-Day Pass",
      passType: "pass_90",
      price: "USD 60",
      desc: "For the full season",
    },
    {
      label: "Resident Pass (1 Year)",
      passType: "pass_365",
      price: "USD 100",
      desc: "For residents, valid 1 year",
    },
  ];
  const [selectedPass, setSelectedPass] = React.useState(passes[0]);

  // Social/support links
  const links = [
    {
      label: "View Participating Venues",
      url: "https://ahangama.com",
      color: "#D2691E",
    },
  ];

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        minWidth: "100vw",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          background: `url('/background.jpg') center center / cover no-repeat fixed, #f7f3ef`,
        }}
      />
      <div
        style={{
          minHeight: "100vh",
          minWidth: "100vw",
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2em 1em 3em 1em",
          fontFamily: "Inter, Helvetica, Arial, sans-serif",
          position: "relative",
          zIndex: 1,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 400,
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 2px 16px #0001",
            padding: "2em 1em 1.5em 1em",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <h2 style={{ margin: 0, fontWeight: 700, color: "#8B4513" }}>
            Ahangama Pass
          </h2>
          <p
            style={{
              color: "#6d4c2b",
              margin: "0.5em 0 2em 0",
              fontSize: 16,
              textAlign: "center",
            }}
          >
            Unlock exclusive experiences, perks, and discounts in Ahangama.
            <br />
          </p>
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="start-date"
              style={{
                color: "#6d4c2b",
                fontWeight: 500,
                display: "block",
                marginBottom: 4,
              }}
            >
              Start Date:
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={todayStr}
              max={(() => {
                const d = new Date();
                d.setDate(d.getDate() + 60);
                return d.toISOString().split("T")[0];
              })()}
              required
              style={{
                padding: "0.7em 1em",
                borderRadius: 8,
                border: "1px solid #ccc",
                width: "100%",
                boxSizing: "border-box",
                fontSize: 18,
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {passes.map((pass) => (
              <button
                key={pass.passType}
                type="button"
                disabled={loading}
                onClick={async () => {
                  setSelectedPass(pass);
                  setError("");
                  setLoading(true);
                  try {
                    const res = await fetch(
                      "/.netlify/functions/create-checkout-session",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          passType: pass.passType,
                          startDate,
                        }),
                      },
                    );
                    const data = await res.json();
                    if (res.ok && data.url) {
                      window.location.href = data.url;
                    } else {
                      setError(
                        data.error || "Failed to create checkout session.",
                      );
                    }
                  } catch (err) {
                    setError("Network error. Please try again.");
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{
                  background:
                    selectedPass.passType === pass.passType
                      ? "#8B4513"
                      : "#f7f3ef",
                  color:
                    selectedPass.passType === pass.passType
                      ? "#fff"
                      : "#8B4513",
                  border: "2px solid #8B4513",
                  borderRadius: 12,
                  padding: "1.1em 0",
                  fontWeight: 600,
                  fontSize: 18,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow:
                    selectedPass.passType === pass.passType
                      ? "0 2px 8px #0002"
                      : "none",
                  outline: "none",
                  transition: "background 0.2s, color 0.2s",
                  opacity: loading ? 0.7 : 1,
                  marginBottom: 0,
                }}
              >
                {loading && selectedPass.passType === pass.passType ? (
                  "Redirecting..."
                ) : (
                  <>
                    {pass.label}{" "}
                    <span style={{ fontWeight: 400, fontSize: 15 }}>
                      ({pass.price})
                    </span>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 400,
                        color:
                          selectedPass.passType === pass.passType
                            ? "#f7e7d7"
                            : "#8B4513",
                        marginTop: 2,
                      }}
                    >
                      {pass.desc}
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
          {error && (
            <div style={{ color: "#e74c3c", marginBottom: 16, marginTop: 8 }}>
              {error}
            </div>
          )}
        </div>
        <div
          style={{
            width: "100%",
            maxWidth: 400,
            marginTop: 0,
            textAlign: "center",
          }}
        >
          {links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                width: "100%",
                margin: "0 auto 1em auto",
                background: link.color,
                color: "#fff",
                fontWeight: 600,
                fontSize: 18,
                border: "none",
                borderRadius: 12,
                padding: "1em 0",
                textAlign: "center",
                textDecoration: "none",
                boxShadow: "0 2px 8px #0001",
                transition: "background 0.2s, transform 0.1s",
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
        <div
          style={{
            marginTop: "auto",
            color: "#bfae9e",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          &copy; {new Date().getFullYear()} Ahangama Pass
        </div>
      </div>
    </div>
  );
}

export default App;
