import React, { useEffect, useState } from "react";

function Verify() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const passId = params.get("id");
    if (!passId) {
      setError("No pass ID provided.");
      setLoading(false);
      return;
    }
    fetch(`/.netlify/functions/verify-pass?id=${encodeURIComponent(passId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStatus(data);
      })
      .catch(() => setError("Failed to verify pass."))
      .finally(() => setLoading(false));
  }, []);

  return (
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
        background: `url('/background.jpg') center center / cover no-repeat fixed, #f7f3ef`,
        fontFamily: "Inter, Helvetica, Arial, sans-serif",
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
          textAlign: "center",
        }}
      >
        <h2 style={{ margin: 0, fontWeight: 700, color: "#8B4513" }}>
          Verify Pass
        </h2>
        {loading && (
          <div style={{ color: "#8B4513", fontWeight: 600 }}>Checking...</div>
        )}
        {error && (
          <div style={{ color: "#e74c3c", fontWeight: 600 }}>{error}</div>
        )}
        {status && (
          <div
            style={{
              color: status.valid ? "#28a745" : "#e74c3c",
              fontWeight: 700,
              fontSize: 22,
              margin: "1em 0",
            }}
          >
            {status.valid ? "PASS is Valid" : "Expired"}
          </div>
        )}
      </div>
    </div>
  );
}

export default Verify;
