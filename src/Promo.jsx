import React from "react";
import "./App.css";

function getTimeZoneDateString(timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function addDaysToYmd(ymd, days) {
  const date = new Date(`${ymd}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split("T")[0];
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function subtractUtcDays(dateValue, days) {
  const date = new Date(dateValue);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function Promo() {
  const todayStr = getTimeZoneDateString("Asia/Colombo");
  const maxDateStr = addDaysToYmd(todayStr, 60);
  const [startDate, setStartDate] = React.useState(todayStr);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [successLoading, setSuccessLoading] = React.useState(false);
  const [promoStatus, setPromoStatus] = React.useState(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutState = params.get("checkout");
    const sessionId = params.get("session_id");
    let retryTimeoutId;
    let isActive = true;

    if (checkoutState === "cancelled") {
      setError("Promo checkout was cancelled.");
      return;
    }

    if (checkoutState !== "success" || !sessionId) {
      return () => {
        isActive = false;
        window.clearTimeout(retryTimeoutId);
      };
    }

    setSuccessLoading(true);
    setError("");

    const loadPromoStatus = async (attempt = 0) => {
      try {
        const response = await fetch(
          `/.netlify/functions/promo-status?session_id=${encodeURIComponent(sessionId)}`,
        );
        const data = await response.json();

        if (!isActive) return;

        if (response.status === 202 && data.pending) {
          if (attempt >= 9) {
            setError(
              "Your promo is still being activated. Please refresh in a moment.",
            );
            setSuccessLoading(false);
            return;
          }

          retryTimeoutId = window.setTimeout(() => {
            loadPromoStatus(attempt + 1);
          }, 1500);
          return;
        }

        if (!response.ok || data.error) {
          setError(data.error || "Failed to load promo status.");
          setSuccessLoading(false);
          return;
        }

        setPromoStatus(data);
        setSuccessLoading(false);
      } catch {
        if (!isActive) return;
        setError("Failed to load promo status.");
        setSuccessLoading(false);
      }
    };

    loadPromoStatus();

    return () => {
      isActive = false;
      window.clearTimeout(retryTimeoutId);
    };
  }, []);

  const isSuccessView = Boolean(promoStatus) || successLoading;

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
          <img
            src="https://customer-apps-techhq.s3.eu-west-2.amazonaws.com/app-ahangama-demo/ahangama_pass_logo.png"
            title="Ahangama Pass & Guide to Perks, Privileges and Discounts, Experiences"
            alt="Ahangama Pass Logo"
            style={{
              width: 200,
              height: "auto",
              marginBottom: 16,
              borderRadius: 12,
              boxShadow: "0 2px 8px #0002",
            }}
          />
          {isSuccessView ? (
            <>
              <h1
                style={{
                  margin: 0,
                  fontWeight: 700,
                  color: "#8B4513",
                  fontSize: 24,
                  marginBottom: 12,
                }}
              >
                Promo Trial Activated
              </h1>
              {successLoading ? (
                <div style={{ color: "#8B4513", fontWeight: 600 }}>
                  Loading your promo details...
                </div>
              ) : promoStatus ? (
                <>
                  <p
                    style={{
                      color: "#6d4c2b",
                      fontSize: 16,
                      margin: "0 0 20px 0",
                    }}
                  >
                    Your 5-day trial is active now. Your first paid charge is
                    scheduled for {formatDate(promoStatus.paid_start_at)}.
                  </p>
                  <ul
                    style={{
                      textAlign: "center",
                      margin: 0,
                      padding: 0,
                      listStyle: "none",
                      fontSize: 16,
                      color: "#6d4c2b",
                    }}
                  >
                    <li style={{ marginBottom: 8 }}>
                      <b>Trial Window:</b>
                      <br />
                      {formatDate(promoStatus.trial_start_at)} to{" "}
                      {formatDate(subtractUtcDays(promoStatus.trial_end_at, 1))}
                    </li>
                    <li style={{ marginBottom: 8 }}>
                      <b>Paid Access:</b>
                      <br />
                      {formatDate(promoStatus.paid_start_at)} to{" "}
                      {formatDate(promoStatus.paid_end_at)}
                    </li>
                    <li style={{ marginBottom: 8 }}>
                      <b>Billing Status:</b>
                      <br />
                      {promoStatus.billing_status}
                    </li>
                    <li style={{ marginBottom: 8 }}>
                      <b>Access Status:</b>
                      <br />
                      {promoStatus.access_status}
                    </li>
                    <li style={{ marginBottom: 8 }}>
                      <b>Promo Pass ID:</b>
                      <br />
                      {promoStatus.passkit_pass_id || "-"}
                    </li>
                  </ul>
                  <div
                    style={{
                      marginTop: 24,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {promoStatus.smart_link_url && (
                      <a
                        href={promoStatus.smart_link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "block",
                          width: "100%",
                          background: "#007bff",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 18,
                          border: "none",
                          borderRadius: 12,
                          padding: "1em 0",
                          textAlign: "center",
                          textDecoration: "none",
                          boxShadow: "0 2px 8px #0001",
                        }}
                      >
                        Open Promo Pass
                      </a>
                    )}
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <>
              <h1
                style={{
                  margin: 0,
                  fontWeight: 700,
                  color: "#8B4513",
                  fontSize: 24,
                  marginBottom: 12,
                }}
              >
                Promo
              </h1>
              <p
                style={{
                  color: "#6d4c2b",
                  fontSize: 16,
                  margin: "0 0 20px 0",
                }}
              >
                Any time access with a simple promo option.
              </p>
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="promo-start-date"
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
                  id="promo-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={todayStr}
                  max={maxDateStr}
                  required
                  style={{
                    padding: "0.7em 1em",
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                    fontSize: 18,
                  }}
                />
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  setError("");

                  try {
                    const response = await fetch(
                      "/.netlify/functions/create-promo-checkout-session",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ startDate }),
                      },
                    );
                    const data = await response.json();

                    if (response.ok && data.url) {
                      window.location.href = data.url;
                      return;
                    }

                    setError(data.error || "Unable to start promo checkout.");
                  } catch (checkoutError) {
                    setError("Network error. Please try again.");
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{
                  width: "100%",
                  background: "#8B4513",
                  color: "#fff",
                  border: "2px solid #8B4513",
                  borderRadius: 12,
                  padding: "1.1em 1em",
                  fontWeight: 600,
                  fontSize: 18,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px #0002",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Redirecting..." : "15 Days Pass"}
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    color: "#f7e7d7",
                    marginTop: 6,
                  }}
                >
                  5 Day Trial • USD 30 • Any Time
                </div>
              </button>
            </>
          )}
          {error && (
            <div
              style={{
                color: "#e74c3c",
                marginTop: 12,
                whiteSpace: "pre-wrap",
              }}
            >
              {error}
            </div>
          )}
        </div>
        <div
          style={{
            marginTop: "auto",
            color: "#bfae9e",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          &copy; {new Date().getFullYear()} Ahangama Pass - Viji -
        </div>
      </div>
    </div>
  );
}

export default Promo;
