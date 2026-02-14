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
    return <div style={{ marginTop: 40 }}>Loading your order...</div>;
  if (error)
    return <div style={{ color: "#e74c3c", marginTop: 40 }}>{error}</div>;
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
    <div style={{ maxWidth: 500, margin: "3em auto", textAlign: "center" }}>
      <h1>Payment Successful!</h1>
      <p>Thank you for your purchase.</p>
      <h2>Order Summary</h2>
      <ul style={{ textAlign: "left", display: "inline-block" }}>
        <li>
          <b>Order ID:</b> {session.id}
        </li>
        <li>
          <b>Pass Type:</b> {session.pass_type}
        </li>
        <li>
          <b>Start Date:</b> {formatDate(session.start_date)}
        </li>
        <li>
          <b>End Date:</b> {formatDate(session.expiry_date)}
        </li>
        <li>
          <b>Pass Holder Name:</b> {session.pass_holder_name || "-"}
        </li>
        <li>
          <b>Email:</b> {session.customer_email}
        </li>
        <li>
          <b>Phone:</b> {session.customer_phone}
        </li>
        <li>
          <b>PassKit Pass ID:</b> {session.passkit_pass_id || "-"}
        </li>
      </ul>
      {session.smart_link_url ? (
        <a
          href={session.smart_link_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            marginTop: 8,
            background: "#007bff",
            color: "#fff",
            padding: "0.5em 1.5em",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          View Pass
        </a>
      ) : (
        "-"
      )}
    </div>
  );
}

export default Success;
