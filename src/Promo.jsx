import React from "react";
import "./App.css";

function Promo() {
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
          <button
            type="button"
            style={{
              width: "100%",
              background: "#8B4513",
              color: "#fff",
              border: "2px solid #8B4513",
              borderRadius: 12,
              padding: "1.1em 1em",
              fontWeight: 600,
              fontSize: 18,
              cursor: "pointer",
              boxShadow: "0 2px 8px #0002",
            }}
          >
            15 Days Pass
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