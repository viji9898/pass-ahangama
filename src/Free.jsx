import React from "react";
import addToAppleWallet from "./assets/add_to_apple_wallet.png";
import addToGoogleWallet from "./assets/add_to_google_wallet.png";
import bookIcon from "./assets/book-icon.svg";
import emailIcon from "./assets/email-icon.svg";
import giftIcon from "./assets/gift-icon.svg";
import heroPassAppleWallet from "./assets/hero_pass_apple_wallet.png";
import lightningIcon from "./assets/lightning-icon.svg";
import lockIcon from "./assets/lock-icon.svg";
import paperPlaneIcon from "./assets/paper-plane-icon.svg";
import pencilIcon from "./assets/pencil-icon.svg";
import phoneIcon from "./assets/phone-icon.svg";
import userIcon from "./assets/user-icon.svg";

const GUIDE_URL = "https://guide.ahangama.com";

function Free() {
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth <= 768;
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => setIsMobile(window.innerWidth <= 768);

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const todayStr = React.useMemo(
    () => new Date().toISOString().split("T")[0],
    [],
  );

  const initialFormData = React.useMemo(
    () => ({
      firstName: "",
      lastName: "",
      customerEmail: "",
      customerPhone: "",
    }),
    [],
  );

  const [formData, setFormData] = React.useState(initialFormData);
  const [agreedToDelivery, setAgreedToDelivery] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState(null);

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
      const response = await fetch("/.netlify/functions/create-free-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startDate: todayStr,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create free pass.");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFormData(initialFormData);
    setAgreedToDelivery(true);
    setResult(null);
    setError("");
  }

  const passHolderName = [formData.firstName, formData.lastName]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" ");

  return (
    <div
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "1rem 0.85rem 2rem" : "2rem 1rem",
        boxSizing: "border-box",
        background:
          "radial-gradient(circle at top, rgba(210, 105, 30, 0.16), transparent 30%), linear-gradient(160deg, #f7efe6 0%, #f3e6d7 42%, #efe8df 100%)",
        fontFamily: "Inter, Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
        }}
      >
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            background:
              "radial-gradient(circle at top right, rgba(153, 92, 43, 0.14), transparent 28%), radial-gradient(circle at bottom left, rgba(201, 93, 26, 0.12), transparent 35%), linear-gradient(180deg, rgba(255, 251, 246, 0.98) 0%, rgba(249, 241, 231, 0.98) 100%)",
            color: "#5f3719",
            borderRadius: 32,
            padding: isMobile ? "1.15rem 1rem 1.25rem" : "1.8rem 1.3rem",
            boxShadow: "0 20px 60px rgba(74, 40, 9, 0.08)",
            border: "1px solid rgba(170, 112, 69, 0.16)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -28,
              right: -12,
              width: 190,
              height: 190,
              borderRadius: "50% 0 50% 50%",
              background:
                "radial-gradient(circle, rgba(160, 115, 73, 0.18) 0%, rgba(160, 115, 73, 0) 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gap: 16,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "minmax(0, 0.96fr) minmax(260px, 0.9fr)",
                gap: isMobile ? 14 : 20,
                alignItems: "center",
              }}
            >
              <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      maxWidth: "100%",
                      borderRadius: 999,
                      padding: "0.45rem 1rem",
                      background: "rgba(255, 251, 246, 0.88)",
                      color: "#8b4d24",
                      fontWeight: 700,
                      fontSize: 12,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      border: "1px solid rgba(170, 112, 69, 0.28)",
                    }}
                  >
                    <span>Free</span>
                    <span style={{ opacity: 0.7 }}>•</span>
                    <span>30 Day Access</span>
                  </div>

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "0.45rem 0.9rem",
                      borderRadius: 999,
                      background: "rgba(255, 251, 246, 0.8)",
                      border: "1px solid rgba(170, 112, 69, 0.18)",
                      color: "#6d3412",
                      fontSize: 13,
                    }}
                  >
                    <span>Why it&apos;s free?</span>
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        border: "1px solid rgba(109, 52, 18, 0.28)",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      i
                    </span>
                  </div>
                </div>

                <div>
                  <h1
                    style={{
                      margin: 0,
                      maxWidth: 420,
                      fontFamily:
                        "Iowan Old Style, Baskerville, Palatino, Georgia, serif",
                      fontSize: isMobile
                        ? "clamp(2.7rem, 13vw, 4rem)"
                        : "clamp(3rem, 8vw, 5.2rem)",
                      lineHeight: 0.93,
                      letterSpacing: "-0.05em",
                      color: "#2f1709",
                    }}
                  >
                    Get the
                    <br />
                    Ahangama Pass
                  </h1>
                  <p
                    style={{
                      maxWidth: 380,
                      margin: "16px 0 0",
                      color: "#6f513d",
                      fontSize: 17,
                      lineHeight: 1.55,
                    }}
                  >
                    Unlock perks across cafes, surf, wellness, stays and
                    experiences.
                  </p>
                </div>

                <div
                  style={{ display: "grid", gap: 10, justifyItems: "start" }}
                >
                  <a
                    href="#free-pass-form"
                    style={{
                      ...heroCtaStyle,
                      maxWidth: 320,
                      minHeight: 68,
                      justifyContent: "center",
                      gap: 10,
                    }}
                  >
                    <img
                      src={giftIcon}
                      alt=""
                      aria-hidden="true"
                      style={{
                        width: 18,
                        height: 18,
                        filter: "brightness(0) invert(1)",
                      }}
                    />
                    <span>Get My Free Pass</span>
                  </a>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#8a6a53",
                      fontSize: 14,
                    }}
                  >
                    <img
                      src={lockIcon}
                      alt=""
                      aria-hidden="true"
                      style={{ width: 15, height: 15, opacity: 0.8 }}
                    />
                    <span>No payment required. 100% free.</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  position: "relative",
                  minHeight: isMobile ? 300 : 360,
                  display: "grid",
                  placeItems: "center",
                  marginTop: isMobile ? 8 : 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    right: isMobile ? 14 : -6,
                    bottom: isMobile ? 4 : 8,
                    width: isMobile ? 156 : 176,
                    height: isMobile ? 236 : 264,
                    borderRadius: 24,
                    background:
                      "linear-gradient(180deg, #77a4bf 0%, #4c7a96 100%)",
                    boxShadow: "0 22px 44px rgba(49, 80, 101, 0.2)",
                    transform: isMobile ? "rotate(7deg)" : "rotate(8deg)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.08))",
                    }}
                  />
                  <div
                    style={{
                      position: "relative",
                      zIndex: 1,
                      padding: "1.15rem 1rem",
                      color: "#f5f8fb",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        opacity: 0.8,
                        fontWeight: 700,
                      }}
                    >
                      Ahangama
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 34,
                        lineHeight: 0.95,
                        fontFamily:
                          "Iowan Old Style, Baskerville, Palatino, Georgia, serif",
                        fontWeight: 700,
                      }}
                    >
                      Guide
                    </div>
                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 12,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        opacity: 0.9,
                      }}
                    >
                      2026/27 Edition
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    width: isMobile ? 214 : 238,
                    aspectRatio: "1 / 2.16",
                    padding: "8px",
                    borderRadius: 38,
                    background:
                      "linear-gradient(180deg, #232323 0%, #111111 100%)",
                    boxShadow: "0 26px 46px rgba(31, 22, 17, 0.24)",
                    transform: isMobile ? "rotate(-6deg)" : "rotate(-8deg)",
                    border: "1px solid rgba(255,255,255,0.35)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 92,
                      height: 23,
                      borderRadius: 999,
                      background: "#0a0a0a",
                      zIndex: 3,
                    }}
                  />
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      overflow: "hidden",
                      borderRadius: 30,
                      background: "#faf8f8",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <img
                      src={heroPassAppleWallet}
                      alt="Ahangama Pass preview inside an iPhone frame"
                      style={{
                        display: "block",
                        width: "88%",
                        height: "88%",
                        objectFit: "contain",
                        objectPosition: "center center",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(3, minmax(0, 1fr))",
                gap: 0,
                minWidth: 0,
                marginTop: 6,
                borderRadius: 28,
                overflow: "hidden",
                background: "rgba(255, 255, 255, 0.94)",
                border: "1px solid rgba(170, 112, 69, 0.12)",
                boxShadow: "0 18px 34px rgba(74, 40, 9, 0.06)",
              }}
            >
              {featureItems.map((item, index) => (
                <div
                  key={item.title}
                  style={{
                    display: "grid",
                    justifyItems: "center",
                    alignContent: "start",
                    textAlign: "center",
                    gap: 8,
                    padding: isMobile ? "1.2rem 1rem" : "1.35rem 1.1rem",
                    minWidth: 0,
                    position: "relative",
                    borderRight:
                      !isMobile && index < featureItems.length - 1
                        ? "1px solid rgba(170, 112, 69, 0.14)"
                        : "none",
                    borderBottom:
                      isMobile && index < featureItems.length - 1
                        ? "1px solid rgba(170, 112, 69, 0.14)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      background: "#f7ecdf",
                      color: "#8b4d24",
                      fontWeight: 700,
                      fontSize: 12,
                      flexShrink: 0,
                      boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    {item.iconSrc ? (
                      <img
                        src={item.iconSrc}
                        alt=""
                        aria-hidden="true"
                        style={{ width: 24, height: 24 }}
                      />
                    ) : (
                      item.badge
                    )}
                  </div>
                  <div style={{ maxWidth: 170 }}>
                    <div
                      style={{
                        fontSize: isMobile ? 16 : 17,
                        fontWeight: 700,
                        color: "#2f1709",
                        lineHeight: 1.05,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: isMobile ? 14 : 15,
                        color: "#6d4f3a",
                        marginTop: 6,
                        lineHeight: 1.25,
                      }}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                borderRadius: 28,
                background: "rgba(255, 252, 248, 0.94)",
                border: "1px solid rgba(170, 112, 69, 0.16)",
                padding: isMobile ? "1rem 0.9rem" : "1rem 1.1rem",
                boxShadow:
                  "0 12px 34px rgba(74, 40, 9, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "1fr"
                    : "minmax(0, 1.1fr) minmax(0, 1fr)",
                  gap: isMobile ? 14 : 18,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: isMobile ? "wrap" : "nowrap",
                    alignItems: "center",
                    gap: 14,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      minWidth: 0,
                    }}
                  >
                    {travellerAvatars.map((item, index) => (
                      <div
                        key={item.initials}
                        aria-hidden="true"
                        style={{
                          width: isMobile ? 48 : 58,
                          height: isMobile ? 48 : 58,
                          marginLeft: index === 0 ? 0 : -10,
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          color: "#fff",
                          fontSize: isMobile ? 14 : 16,
                          fontWeight: 700,
                          letterSpacing: "0.02em",
                          background: item.background,
                          border: "3px solid rgba(255, 252, 248, 1)",
                          boxShadow: "0 6px 18px rgba(47, 23, 9, 0.12)",
                        }}
                      >
                        {item.initials}
                      </div>
                    ))}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        color: "#2f1709",
                        fontSize: isMobile ? 24 : 28,
                        lineHeight: 1.05,
                        fontWeight: 700,
                        fontFamily:
                          "Iowan Old Style, Baskerville, Palatino, Georgia, serif",
                      }}
                    >
                      Loved by travellers in Ahangama
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        color: "#6f513d",
                        fontSize: isMobile ? 15 : 16,
                      }}
                    >
                      12,000+ happy pass holders
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: isMobile ? "flex-start" : "flex-end",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {venueLogos.map((item) => (
                    <div
                      key={item.name}
                      style={{
                        minWidth: item.minWidth,
                        padding: item.padding || "0.65rem 0.9rem",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.72)",
                        border: "1px solid rgba(170, 112, 69, 0.14)",
                        color: "#3c2010",
                        textAlign: "center",
                        fontFamily: item.fontFamily,
                        fontSize: item.fontSize,
                        fontWeight: item.fontWeight,
                        letterSpacing: item.letterSpacing || "0.04em",
                        textTransform: item.textTransform || "none",
                        boxShadow: "0 4px 14px rgba(74, 40, 9, 0.04)",
                      }}
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: isMobile ? "0.4rem 0" : "0.5rem 0 0.1rem",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  color: "#2f1709",
                  fontSize: isMobile ? 32 : 38,
                  fontWeight: 700,
                  lineHeight: 1,
                  marginBottom: isMobile ? 18 : 24,
                  fontFamily:
                    "Iowan Old Style, Baskerville, Palatino, Georgia, serif",
                }}
              >
                How it works
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "1fr"
                    : "repeat(3, minmax(0, 1fr))",
                  gap: isMobile ? 18 : 12,
                  alignItems: "start",
                  minWidth: 0,
                }}
              >
                {steps.map((item, index) => (
                  <div
                    key={item.title}
                    style={{
                      textAlign: "center",
                      position: "relative",
                      padding: isMobile ? "0.4rem 0" : "0 0.5rem",
                    }}
                  >
                    {!isMobile && index < steps.length - 1 && (
                      <div
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          top: 56,
                          left: "calc(50% + 48px)",
                          width: "calc(100% - 96px)",
                          borderTop: "3px dotted rgba(203, 181, 161, 0.9)",
                        }}
                      />
                    )}

                    <div
                      style={{
                        position: "relative",
                        width: 108,
                        margin: "0 auto 16px",
                        paddingTop: 10,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          background: "#f4e2d2",
                          color: "#b96b2d",
                          fontWeight: 700,
                          fontSize: 18,
                          boxShadow: "0 8px 18px rgba(191, 137, 90, 0.18)",
                          zIndex: 2,
                        }}
                      >
                        {index + 1}
                      </div>
                      <div
                        style={{
                          width: 86,
                          height: 86,
                          margin: "18px auto 0",
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          background: "rgba(255, 253, 250, 0.96)",
                          border: "1px solid rgba(220, 205, 192, 0.8)",
                          boxShadow: "0 8px 24px rgba(74, 40, 9, 0.05)",
                        }}
                      >
                        {item.iconType === "qr" ? (
                          <div
                            aria-hidden="true"
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(5, 8px)",
                              gap: 3,
                            }}
                          >
                            {qrPattern.map((filled, patternIndex) => (
                              <span
                                key={patternIndex}
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 2,
                                  background: filled ? "#4a2310" : "#f7efe7",
                                  border: filled
                                    ? "1px solid #4a2310"
                                    : "1px solid rgba(74, 35, 16, 0.08)",
                                  boxSizing: "border-box",
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <img
                            src={item.iconSrc}
                            alt=""
                            aria-hidden="true"
                            style={{ width: 34, height: 34 }}
                          />
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: isMobile ? 18 : 17,
                        fontWeight: 700,
                        color: "#2f1709",
                        lineHeight: 1.2,
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        marginTop: 5,
                        fontSize: isMobile ? 15 : 14,
                        color: "#6d4f3a",
                        lineHeight: 1.35,
                      }}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div
              id="free-pass-form"
              style={{
                marginTop: isMobile ? 18 : 20,
                background:
                  "linear-gradient(180deg, rgba(255, 253, 250, 0.98) 0%, rgba(249, 243, 236, 0.98) 100%)",
                borderRadius: 32,
                boxShadow: "0 20px 56px rgba(74, 40, 9, 0.08)",
                padding: isMobile ? "1.1rem 1rem" : "1.55rem 1.45rem",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(170, 112, 69, 0.12)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -42,
                  right: -24,
                  width: 150,
                  height: 150,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(193, 136, 84, 0.16) 0%, rgba(193, 136, 84, 0) 72%)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "grid",
                  gap: 18,
                }}
              >
                <div style={{ marginBottom: 2 }}>
                  <h2
                    style={{
                      color: "#2f1709",
                      margin: 0,
                      fontSize: isMobile ? 34 : 52,
                      lineHeight: 0.98,
                      fontFamily:
                        "Iowan Old Style, Baskerville, Palatino, Georgia, serif",
                    }}
                  >
                    Claim your free pass
                  </h2>
                  <p
                    style={{
                      color: "#8a6a53",
                      margin: "10px 0 0",
                      fontSize: isMobile ? 18 : 17,
                      lineHeight: 1.45,
                    }}
                  >
                    Takes less than 10 seconds.
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile
                      ? "1fr"
                      : "minmax(0, 1.45fr) minmax(250px, 0.72fr)",
                    gap: isMobile ? 18 : 24,
                    alignItems: "start",
                  }}
                >
                  <form
                    onSubmit={handleSubmit}
                    style={{ display: "grid", gap: 16 }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile
                          ? "1fr"
                          : "repeat(2, minmax(0, 1fr))",
                        gap: 14,
                      }}
                    >
                      <label style={labelStyle}>
                        <span>First Name</span>
                        <span style={fieldShellStyle}>
                          <img
                            src={userIcon}
                            alt=""
                            aria-hidden="true"
                            style={fieldIconStyle}
                          />
                          <input
                            type="text"
                            required
                            value={formData.firstName}
                            onChange={handleChange("firstName")}
                            placeholder="Your first name"
                            style={formInputStyle}
                          />
                        </span>
                      </label>

                      <label style={labelStyle}>
                        <span>Last Name</span>
                        <span style={fieldShellStyle}>
                          <img
                            src={userIcon}
                            alt=""
                            aria-hidden="true"
                            style={fieldIconStyle}
                          />
                          <input
                            type="text"
                            required
                            value={formData.lastName}
                            onChange={handleChange("lastName")}
                            placeholder="Your last name"
                            style={formInputStyle}
                          />
                        </span>
                      </label>
                    </div>

                    <label style={labelStyle}>
                      <span>Email</span>
                      <span style={fieldShellStyle}>
                        <img
                          src={emailIcon}
                          alt=""
                          aria-hidden="true"
                          style={fieldIconStyle}
                        />
                        <input
                          type="email"
                          required
                          value={formData.customerEmail}
                          onChange={handleChange("customerEmail")}
                          placeholder="you@example.com"
                          style={formInputStyle}
                        />
                      </span>
                    </label>

                    <label style={labelStyle}>
                      <span>WhatsApp Number</span>
                      <span style={fieldShellStyle}>
                        <img
                          src={phoneIcon}
                          alt=""
                          aria-hidden="true"
                          style={fieldIconStyle}
                        />
                        <input
                          type="tel"
                          required
                          value={formData.customerPhone}
                          onChange={handleChange("customerPhone")}
                          placeholder="+94 7X XXX XXXX"
                          style={formInputStyle}
                        />
                      </span>
                    </label>

                    <label style={consentRowStyle}>
                      <input
                        type="checkbox"
                        checked={agreedToDelivery}
                        onChange={(event) =>
                          setAgreedToDelivery(event.target.checked)
                        }
                        required
                        style={checkboxStyle}
                      />
                      <span>
                        I agree to receive my Ahangama Pass and guide access.
                      </span>
                    </label>

                    <div
                      style={{
                        borderRadius: 18,
                        background: "rgba(245, 232, 220, 0.62)",
                        padding: "0.95rem 1rem",
                        color: "#7e5a43",
                        fontSize: 14,
                        lineHeight: 1.5,
                        border: "1px solid rgba(170, 112, 69, 0.12)",
                      }}
                    >
                      Pass holder:{" "}
                      <strong>
                        {passHolderName || "Your name will appear here"}
                      </strong>
                      <br />
                      Your free pass starts today and is valid for 30 days.
                    </div>

                    {error && (
                      <div style={{ color: "#b42318", fontWeight: 700 }}>
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        width: "100%",
                        border: "none",
                        borderRadius: 18,
                        background: "linear-gradient(135deg, #c95d1a, #8B4513)",
                        color: "#fff",
                        padding: "1rem",
                        fontSize: 17,
                        fontWeight: 700,
                        opacity: loading ? 0.7 : 1,
                        boxShadow: "0 14px 28px rgba(139, 69, 19, 0.16)",
                      }}
                    >
                      {loading
                        ? "Creating Your Pass..."
                        : "Get My Free Ahangama Pass"}
                    </button>
                  </form>

                  <div
                    style={{
                      borderRadius: 28,
                      background:
                        "linear-gradient(180deg, rgba(250, 244, 237, 0.95) 0%, rgba(245, 236, 227, 0.95) 100%)",
                      border: "1px solid rgba(170, 112, 69, 0.1)",
                      padding: isMobile ? "1rem 0.95rem" : "1rem",
                      display: "grid",
                      justifyItems: "center",
                      gap: 14,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.78)",
                    }}
                  >
                    <div
                      style={{
                        color: "#2f1709",
                        fontSize: 16,
                        fontWeight: 700,
                        textAlign: "center",
                        lineHeight: 1.35,
                      }}
                    >
                      This is how your pass
                      <br />
                      will look
                    </div>

                    <div
                      style={{
                        width: isMobile ? 170 : 190,
                        borderRadius: 18,
                        overflow: "hidden",
                        boxShadow: "0 18px 30px rgba(107, 54, 22, 0.16)",
                        background: "#9a5829",
                      }}
                    >
                      <img
                        src={heroPassAppleWallet}
                        alt="Ahangama Pass preview"
                        style={{
                          display: "block",
                          width: "100%",
                          height: "auto",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 8,
                        justifyItems: "center",
                      }}
                    >
                      <img
                        src={addToAppleWallet}
                        alt="Add to Apple Wallet"
                        style={{
                          width: isMobile ? 145 : 154,
                          height: "auto",
                          display: "block",
                        }}
                      />
                      <img
                        src={addToGoogleWallet}
                        alt="Add to Google Wallet"
                        style={{
                          width: isMobile ? 152 : 162,
                          height: "auto",
                          display: "block",
                        }}
                      />
                    </div>

                    <div style={previewDotsStyle}>
                      {[0, 1, 2, 3].map((dotIndex) => (
                        <span
                          key={dotIndex}
                          style={{
                            width: dotIndex === 0 ? 12 : 10,
                            height: dotIndex === 0 ? 12 : 10,
                            borderRadius: "50%",
                            background:
                              dotIndex === 0
                                ? "#8b4d24"
                                : "rgba(139, 77, 36, 0.18)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

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
                  <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 22 }}>
                    Your free Ahangama Pass is ready
                  </h3>
                  <div style={resultRowStyle}>
                    <strong>Pass Holder</strong>
                    <span>{result.passHolderName}</span>
                  </div>
                  <div style={resultRowStyle}>
                    <strong>Email</strong>
                    <span>{result.customerEmail}</span>
                  </div>
                  <div style={resultRowStyle}>
                    <strong>WhatsApp</strong>
                    <span>{result.customerPhone}</span>
                  </div>
                  <div style={resultRowStyle}>
                    <strong>Valid From</strong>
                    <span>{formatDate(result.startDate)}</span>
                  </div>
                  <div style={resultRowStyle}>
                    <strong>Valid Until</strong>
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
                      marginTop: 16,
                    }}
                  >
                    <a
                      href={result.smartLinkUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={primaryActionStyle}
                    >
                      Open Digital Pass
                    </a>
                    <a
                      href={buildWhatsAppUrl(result.smartLinkUrl)}
                      target="_blank"
                      rel="noreferrer"
                      style={secondaryActionStyle}
                    >
                      Share Pass on WhatsApp
                    </a>
                    <a
                      href={result.guideUrl || GUIDE_URL}
                      target="_blank"
                      rel="noreferrer"
                      style={secondaryActionStyle}
                    >
                      Open 2026/2027 Guide
                    </a>
                    <button
                      type="button"
                      onClick={handleReset}
                      style={ghostButtonStyle}
                    >
                      Create Another Pass
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().split("T")[0];
}

function buildWhatsAppUrl(smartLinkUrl) {
  const message = `Here is your free Ahangama Pass: ${smartLinkUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

const featureItems = [
  {
    badge: "100+",
    iconSrc: giftIcon,
    title: "100+ venues",
    subtitle: "Exclusive perks",
  },
  {
    badge: "NOW",
    iconSrc: lightningIcon,
    title: "Instant access",
    subtitle: "Delivered instantly",
  },
  {
    badge: "GUIDE",
    iconSrc: bookIcon,
    title: "Free guide",
    subtitle: "2026/27 edition",
  },
];

const travellerAvatars = [
  {
    initials: "AL",
    background: "linear-gradient(180deg, #d8c1ab 0%, #b48a6e 100%)",
  },
  {
    initials: "MK",
    background: "linear-gradient(180deg, #8a6a45 0%, #4f3925 100%)",
  },
  {
    initials: "SR",
    background: "linear-gradient(180deg, #c59a7d 0%, #8a5d46 100%)",
  },
  {
    initials: "JN",
    background: "linear-gradient(180deg, #95a4b1 0%, #546372 100%)",
  },
];

const venueLogos = [
  {
    name: "CRAVE",
    minWidth: 102,
    fontFamily: "Avenir Next, Helvetica, Arial, sans-serif",
    fontSize: 19,
    fontWeight: 500,
    letterSpacing: "0.18em",
  },
  {
    name: "SOKO",
    minWidth: 94,
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "0.08em",
  },
  {
    name: "PALM CLUB",
    minWidth: 112,
    fontFamily: "Georgia, serif",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "0.08em",
  },
  {
    name: "unsung",
    minWidth: 100,
    fontFamily: "Brush Script MT, Snell Roundhand, cursive",
    fontSize: 23,
    fontWeight: 400,
    letterSpacing: "0.02em",
    textTransform: "lowercase",
    padding: "0.55rem 0.9rem",
  },
];

const steps = [
  {
    title: "Enter details",
    subtitle: "Takes 10 seconds",
    iconSrc: pencilIcon,
    iconType: "image",
  },
  {
    title: "Receive instantly",
    subtitle: "On WhatsApp",
    iconSrc: paperPlaneIcon,
    iconType: "image",
  },
  {
    title: "Show & save",
    subtitle: "Enjoy perks everywhere",
    iconType: "qr",
  },
];

const qrPattern = [
  1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1,
];

const labelStyle = {
  display: "grid",
  gap: 8,
  color: "#6d3412",
  fontWeight: 700,
  fontSize: 14,
};

const fieldShellStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  minWidth: 0,
  padding: "0 0.95rem",
  borderRadius: 16,
  border: "1px solid rgba(205, 196, 187, 0.95)",
  background: "rgba(255,255,255,0.94)",
  boxSizing: "border-box",
  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9)",
};

const fieldIconStyle = {
  width: 18,
  height: 18,
  opacity: 0.48,
  flexShrink: 0,
};

const formInputStyle = {
  width: "100%",
  minWidth: 0,
  border: "none",
  padding: "1rem 0",
  fontSize: 16,
  lineHeight: 1.2,
  background: "transparent",
  color: "#2f1709",
  outline: "none",
  boxSizing: "border-box",
  caretColor: "#2f1709",
  WebkitTextFillColor: "#2f1709",
  colorScheme: "light",
};

const consentRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "#6d4f3a",
  fontSize: 14,
  lineHeight: 1.4,
};

const checkboxStyle = {
  width: 18,
  height: 18,
  margin: 0,
  accentColor: "#8b4d24",
  flexShrink: 0,
};

const previewDotsStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const resultRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  padding: "0.35rem 0",
  fontSize: 14,
};

const heroCtaStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  maxWidth: 420,
  minHeight: 76,
  borderRadius: 22,
  background: "linear-gradient(135deg, #b25c22, #8B4513)",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 18,
  boxShadow: "0 16px 30px rgba(139, 69, 19, 0.18)",
};

const primaryActionStyle = {
  display: "inline-block",
  background: "#8B4513",
  color: "#fff",
  borderRadius: 12,
  padding: "0.8rem 1rem",
  textDecoration: "none",
  fontWeight: 700,
};

const secondaryActionStyle = {
  display: "inline-block",
  background: "#f3e2cf",
  color: "#6d3412",
  borderRadius: 12,
  padding: "0.8rem 1rem",
  textDecoration: "none",
  fontWeight: 700,
};

const ghostButtonStyle = {
  border: "1px solid #d9c7b5",
  background: "#fff",
  color: "#6d3412",
  borderRadius: 12,
  padding: "0.8rem 1rem",
  fontWeight: 700,
};

export default Free;
