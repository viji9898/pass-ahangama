import React, { useEffect, useState } from "react";

function Success() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) {
      setError("No session ID found.");
      setLoading(false);
      return;
    }
    fetch(`/.netlify/functions/purchase-status?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setSession(data);
      })
      .catch(() => setError("Failed to fetch order details."))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          minWidth: "100vw",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          fontFamily: "Inter, Helvetica, Arial, sans-serif",
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
            position: "relative",
            zIndex: 1,
            minHeight: "100vh",
            minWidth: "100vw",
            width: "100vw",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ color: "#8B4513", fontWeight: 600, fontSize: 20 }}>
            Loading your order...
          </div>
        </div>
      </div>
    );
  if (error)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f7f3ef",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ color: "#e74c3c", fontWeight: 600, fontSize: 20 }}>
          {error}
        </div>
      </div>
    );
  if (!session) return null;

  // Smart link: e.g., WhatsApp with order info
  const smartLink = `https://wa.me/?text=I%20purchased%20a%20${session.pass_type}%20pass%20from%20${formatDate(session.start_date)}%20to%20${formatDate(session.expiry_date)}.%20Order%20ID:%20${session.id}`;

  // Helper to format date as YYYY-MM-DD
  function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toISOString().split("T")[0];
  }

  // Calculate validity (days) from start and end dates (inclusive)
  function calcValidityDays(start, end) {
    if (!start || !end) return "-";
    const d1 = new Date(start);
    const d2 = new Date(end);
    if (isNaN(d1) || isNaN(d2)) return "-";
    // Add 1 to include both start and end dates
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  }

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
          position: "relative",
          marginTop: "50px",
          zIndex: 1,
          minHeight: "100vh",
          minWidth: "100vw",
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
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
          }}
        >
          <h2
            style={{
              margin: 0,
              fontWeight: 700,
              color: "#8B4513",
              textAlign: "center",
            }}
          >
            Payment Successful!
          </h2>
          <p
            style={{
              color: "#6d4c2b",
              margin: "0.5em 0 2em 0",
              fontSize: 16,
              textAlign: "center",
            }}
          >
            Thank you for your purchase.
            <br />
            Your pass is now active!
          </p>
          <h3
            style={{
              color: "#8B4513",
              textAlign: "center",
              marginTop: 0,
              marginBottom: 18,
              fontWeight: 700,
              fontSize: 22,
            }}
          >
            Order Summary
          </h3>
          <ul
            style={{
              textAlign: "center",
              margin: 0,
              padding: 0,
              listStyle: "none",
              fontSize: 16,
            }}
          >
            <li style={{ marginBottom: 8 }}>
              <b>Pass Type:</b> {session.pass_type}
            </li>
            <li style={{ marginBottom: 8 }}>
              <b>Start Date:</b> {formatDate(session.start_date)}
            </li>
            <li style={{ marginBottom: 8 }}>
              <b>End Date:</b> {formatDate(session.expiry_date)}
            </li>
            <li style={{ marginBottom: 8 }}>
              <b>Pass Holder Name:</b> {session.pass_holder_name || "-"}
            </li>
            <li style={{ marginBottom: 8 }}>
              <b>Email:</b> {session.customer_email}
            </li>
            <li style={{ marginBottom: 8 }}>
              <b>Phone:</b>
              {session.customer_phone}
            </li>
            <li style={{ marginBottom: 8 }}>
              <b>Pass ID:</b> {session.passkit_pass_id || "-"}
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
            {session.smart_link_url && (
              <a
                href={session.smart_link_url}
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
                  transition: "background 0.2s, transform 0.1s",
                }}
              >
                View Pass
              </a>
            )}
            {session.receipt_url && (
              <a
                href={session.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  width: "100%",
                  background: "#28a745",
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
                View Receipt
              </a>
            )}
            {!session.smart_link_url && !session.receipt_url && (
              <span style={{ color: "#8B4513" }}>
                No pass or receipt link available.
              </span>
            )}
          </div>
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

export default Success;
