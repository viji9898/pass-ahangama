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
  const smartLink = `https://wa.me/?text=I%20purchased%20a%20${session.pass_type}%20pass%20starting%20${session.start_date}.%20Order%20ID:%20${session.id}`;

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
          <b>Start Date:</b> {session.start_date}
        </li>
        <li>
          <b>Validity (days):</b> {session.validity_days}
        </li>
        <li>
          <b>Email:</b> {session.customer_email}
        </li>
        <li>
          <b>Phone:</b> {session.customer_phone}
        </li>
      </ul>
      <a
        href={smartLink}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          marginTop: 24,
          background: "#25D366",
          color: "#fff",
          padding: "0.75em 2em",
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Share on WhatsApp
      </a>
    </div>
  );
}

export default Success;
