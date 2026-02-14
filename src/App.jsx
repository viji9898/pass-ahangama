// --- Serverless function code moved to netlify/functions/create-checkout-session.js ---

import React from "react";
import "./App.css";

function App() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = React.useState(todayStr);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [checkoutUrl, setCheckoutUrl] = React.useState("");

  const handlePurchase = async (e) => {
    e.preventDefault();
    setError("");
    setCheckoutUrl("");
    if (!startDate) {
      setError("Please select a start date.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passType: "pass_15", startDate }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to create checkout session.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Ahangama Pass</h1>
      {loading ? (
        <div style={{ margin: "3em auto" }}>
          <div className="spinner" />
          <div style={{ marginTop: 16, color: "#555" }}>
            Redirecting to payment...
          </div>
        </div>
      ) : (
        <>
          <form
            onSubmit={handlePurchase}
            style={{ margin: "2em auto", maxWidth: 400 }}
          >
            <div style={{ marginBottom: "1em" }}>
              <label htmlFor="start-date">Start Date:</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                max={(() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 60);
                  return d.toISOString().split("T")[0];
                })()}
                required
                style={{ marginLeft: 8 }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: "0.5em 2em" }}
            >
              Purchase 15-Day Pass
            </button>
          </form>
          {error && (
            <div style={{ color: "#e74c3c", marginBottom: 16 }}>{error}</div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
