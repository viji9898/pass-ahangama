// --- Serverless function code moved to netlify/functions/create-checkout-session.js ---

import React from "react";
import "./App.css";
import { getStoredAttribution } from "./attribution.js";
import arrowRightIcon from "./assets/arrow-right-icon.svg";
import addToAppleWallet from "./assets/add_to_apple_wallet.png";
import addToGoogleWallet from "./assets/add_to_google_wallet.png";
import ahangamaGuideHero from "./assets/ahangama_guide_hero.jpg";
import phoneIcon from "./assets/phone-icon.svg";

function App() {
  const GUIDE_URL = "https://guide.ahangama.com";
  const MAP_URL = "https://ahangama.com";
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = React.useState(todayStr);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const heroImageUrl =
    "https://images.suitcasemag.com/wp-content/uploads/2025/05/01113553/Hero-AhanagamaGuide-SriLanka.jpeg";

  const passes = [
    {
      label: "15-Day Pass",
      passType: "pass_15",
      price: "USD 30",
      desc: "Best for short stays",
    },
    {
      label: "30-Day Pass",
      passType: "pass_30",
      price: "USD 50",
      desc: "Great for a month",
    },
    {
      label: "90-Day Pass",
      passType: "pass_90",
      price: "USD 100",
      desc: "For the full season",
    },
    {
      label: "Resident Pass (1 Year)",
      passType: "pass_365",
      price: "USD 250",
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

  const handlePassSelection = async (pass) => {
    setSelectedPass(pass);
    setError("");
    setLoading(true);
    try {
      const attribution = getStoredAttribution() || {};
      const res = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passType: pass.passType,
          startDate,
          utm_source: attribution.utm_source || "",
          utm_medium: attribution.utm_medium || "",
          utm_campaign: attribution.utm_campaign || "",
          utm_content: attribution.utm_content || "",
          utm_term: attribution.utm_term || "",
          qr_venue: attribution.qr_venue || "",
          qr_surface: attribution.qr_surface || "",
          qr_creative: attribution.qr_creative || "",
          qr_landing_page: attribution.qr_landing_page || "",
          ga_client_id: attribution.ga_client_id || "",
        }),
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
    <div className="app-shell">
      <div className="app-frame">
        <main className="homepage-card">
          <section className="hero-panel">
            <img
              className="hero-panel-image"
              src={heroImageUrl}
              alt="Ahangama beachfront dining scene"
            />

            <div className="hero-content">
              <div className="hero-eyebrow">Welcome to</div>
              <h1 className="hero-title">
                Ahangama
                <br />
                Pass
              </h1>
              <div className="hero-rule" />
              <p className="hero-copy">
                Guide to perks, privileges
                <br />
                and discounts, experiences.
              </p>
            </div>
          </section>

          <section className="offerings-panel">
            <div className="offerings-grid">
              <aside className="offerings-aside">
                <div className="offerings-aside-intro">
                  <p className="offerings-aside-lead">
                    Your key to Ahangama&apos;s best stays, eats and experiences.
                  </p>
                </div>

                <div className="offerings-aside-divider" />

                <div className="offerings-aside-wallets">
                  <div className="offerings-aside-kicker">Digital Pass</div>
                  <p className="offerings-aside-wallet-copy">
                    Add your pass to your phone&apos;s wallet.
                  </p>
                  <div className="offerings-aside-wallet-buttons">
                    <img
                      src={addToAppleWallet}
                      alt="Add to Apple Wallet"
                      className="offerings-wallet-badge"
                    />
                    <img
                      src={addToGoogleWallet}
                      alt="Add to Google Wallet"
                      className="offerings-wallet-badge"
                    />
                  </div>
                </div>

                <div className="offerings-aside-links">
                  <a
                    className="offerings-resource-card"
                    href={GUIDE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="offerings-resource-iconWrap">
                      <img src={phoneIcon} alt="" aria-hidden="true" />
                    </span>
                    <span className="offerings-resource-text">
                      Get the Ahangama Guide 2026/27 season issue
                    </span>
                    <img
                      className="offerings-resource-arrow"
                      src={arrowRightIcon}
                      alt=""
                      aria-hidden="true"
                    />
                  </a>

                  <a
                    className="offerings-resource-card"
                    href={MAP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="offerings-resource-iconWrap">
                      <img src={phoneIcon} alt="" aria-hidden="true" />
                    </span>
                    <span className="offerings-resource-text">
                      Get the Ahangama Map
                    </span>
                    <img
                      className="offerings-resource-arrow"
                      src={arrowRightIcon}
                      alt=""
                      aria-hidden="true"
                    />
                  </a>
                </div>

                <img
                  className="offerings-aside-image"
                  src={ahangamaGuideHero}
                  alt="Ahangama beach scene"
                />
                <div className="offerings-aside-coords">6.2783° N 80.1525° E</div>
              </aside>

              <div className="offerings-main">
                <div className="hero-date-block offerings-date-block">
                  <label className="hero-date-label offerings-date-label" htmlFor="start-date">
                    Start Date
                  </label>
                  <input
                    className="hero-date-input offerings-date-input"
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
                  />
                </div>

                <div className="pass-options">
                  {passes.map((pass, index) => {
                    const isSelected = selectedPass.passType === pass.passType;

                    return (
                      <button
                        key={pass.passType}
                        type="button"
                        className={`pass-option ${isSelected ? "is-selected" : ""}`}
                        disabled={loading}
                        onClick={() => handlePassSelection(pass)}
                        style={{ borderTopWidth: index === 0 ? 0 : 1 }}
                      >
                        {loading && isSelected ? (
                          <span className="pass-option-loading">Redirecting...</span>
                        ) : (
                          <div className="pass-option-layout">
                            <div className="pass-option-copyWrap">
                              <div className="pass-option-desc">{pass.desc}</div>
                              <div className="pass-option-title">
                                {pass.passType === "pass_365" ? (
                                  <>
                                    Resident Pass
                                    <br />
                                    <span className="pass-option-title-sub">(1 Year)</span>
                                  </>
                                ) : (
                                  pass.label
                                )}
                              </div>
                            </div>

                            <div className="pass-option-price">
                              <div className="pass-option-currency">USD</div>
                              <div className="pass-option-amount">
                                {pass.price.replace("USD ", "")}
                              </div>
                            </div>

                            <div className="pass-option-arrow" aria-hidden="true">
                              <img src={arrowRightIcon} alt="" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="offerings-cta-row">
                  <div className="offerings-cta-copy">
                    Explore participating venues across Ahangama.
                  </div>

                  <div className="hero-links">
                    {links.map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hero-link"
                        style={{ background: link.color }}
                      >
                        <span>{link.label}</span>
                        <img src={arrowRightIcon} alt="" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>

                {error && <div className="hero-error">{error}</div>}
              </div>
            </div>
          </section>
        </main>

        <div className="hero-footer">
          &copy; {new Date().getFullYear()} Ahangama Pass
        </div>
      </div>
    </div>
  );
}

export default App;
