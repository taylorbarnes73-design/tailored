import React, { useEffect, useState } from "react";
import { Link } from "wouter";

// ─── Palette · earthy luxury ───────────────────────────────
const P = {
  sage: "#9CAF88",
  sageMist: "#C4D2B6",
  forest: "#6B8E5A",
  forestDeep: "#4F6B43",
  olive: "#8B9556",
  beige: "#F5F1E8",
  cream: "#F7F3E9",
  parchment: "#FBF8F1",
  tan: "#D2B48C",
  sand: "#C19A6B",
  terracotta: "#C65D07",
  warmGray: "#8B8680",
  ink: "#2C3327",
  inkSoft: "#4A5043",
  oat: "#E8DFCB",
  bark: "#5B4636",
};
const FONT_SERIF = "'Cormorant Garamond', Georgia, serif";
const FONT_SANS = "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif";

// ─── Small icon set (line) ─────────────────────────────────
const Ico = ({ children, size = 22, sw = 1.6 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);
const IconCamera = ({ size }) => (
  <Ico size={size}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </Ico>
);
const IconRuler = ({ size }) => (
  <Ico size={size}>
    <path d="M21 6 6 21 3 18 18 3z" />
    <path d="M9 9l1.5 1.5M12 6l1.5 1.5M6 12l1.5 1.5M15 15l1.5 1.5M18 18l1.5 1.5" />
  </Ico>
);
const IconScissors = ({ size }) => (
  <Ico size={size}>
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </Ico>
);
const IconSparkle = ({ size }) => (
  <Ico size={size}>
    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
  </Ico>
);
const IconShield = ({ size }) => (
  <Ico size={size}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Ico>
);
const IconArrow = ({ size = 18 }) => (
  <Ico size={size} sw={2}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </Ico>
);
const IconCheck = ({ size = 16 }) => (
  <Ico size={size} sw={2.4}>
    <polyline points="20 6 9 17 4 12" />
  </Ico>
);
const IconTarget = ({ size }) => (
  <Ico size={size}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </Ico>
);
const IconLayers = ({ size }) => (
  <Ico size={size}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </Ico>
);
const IconStar = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={P.terracotta}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

// ─── Hero body silhouette — premium scan illustration ───────
function HeroBodyScan() {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPulse(p => (p + 1) % 100), 50);
    return () => clearInterval(id);
  }, []);
  // y positions for anchor lines (% of 600px viewbox height)
  const anchors = [
    { y: 130, label: "SHOULDER", value: '17.5"', side: "left" },
    { y: 190, label: "BUST", value: '36.0"', side: "right" },
    { y: 270, label: "WAIST", value: '28.5"', side: "left" },
    { y: 340, label: "HIPS", value: '38.5"', side: "right" },
    { y: 470, label: "INSEAM", value: '31.0"', side: "left" },
  ];

  // sweep position 0..1
  const sweep = (pulse % 60) / 60;
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 520,
        aspectRatio: "5 / 6",
        margin: "0 auto",
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          inset: "-12%",
          background: `radial-gradient(circle at 50% 45%, ${P.sageMist} 0%, rgba(196,210,182,0) 60%)`,
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />
      {/* Frame card */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 32,
          background: `linear-gradient(180deg, ${P.cream} 0%, ${P.beige} 100%)`,
          border: `1px solid rgba(75,65,52,0.10)`,
          boxShadow:
            "0 60px 120px rgba(75,65,52,0.18), inset 0 1px 0 rgba(255,255,255,0.7)",
          overflow: "hidden",
        }}
      >
        {/* Measurement grid background */}
        <svg
          viewBox="0 0 500 600"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          style={{ display: "block" }}
        >
          <defs>
            <pattern id="hero-grid" width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M 22 0 L 0 0 0 22" fill="none" stroke={P.warmGray} strokeOpacity="0.15" strokeWidth="0.5" />
            </pattern>
            <linearGradient id="bodyFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#EFE5CF" />
              <stop offset="55%" stopColor={P.oat} />
              <stop offset="100%" stopColor={P.sageMist} />
            </linearGradient>
            <radialGradient id="haloFill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={P.sage} stopOpacity="0.55" />
              <stop offset="80%" stopColor={P.sage} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="500" height="600" fill="url(#hero-grid)" />

          {/* Halo */}
          <ellipse cx="250" cy="550" rx="170" ry="30" fill="url(#haloFill)" />

          {/* Body silhouette — front view */}
          <path
            d="M250 70
               C 270 70, 285 86, 285 108
               C 285 124, 278 134, 268 138
               C 290 144, 305 162, 312 196
               C 320 230, 322 252, 320 274
               C 318 296, 306 314, 296 328
               C 318 340, 332 360, 338 386
               C 344 410, 340 444, 332 472
               C 326 496, 320 520, 320 548
               L 290 548
               C 286 510, 278 472, 268 442
               L 268 442
               L 232 442
               C 222 472, 214 510, 210 548
               L 180 548
               C 180 520, 174 496, 168 472
               C 160 444, 156 410, 162 386
               C 168 360, 182 340, 204 328
               C 194 314, 182 296, 180 274
               C 178 252, 180 230, 188 196
               C 195 162, 210 144, 232 138
               C 222 134, 215 124, 215 108
               C 215 86, 230 70, 250 70 Z"
            fill="url(#bodyFill)"
            stroke={P.forestDeep}
            strokeWidth="0.6"
            strokeOpacity="0.35"
          />

          {/* Inner contour highlight */}
          <path
            d="M250 80 C 268 80, 282 96, 282 116"
            fill="none"
            stroke={P.warmGray}
            strokeOpacity="0.18"
            strokeWidth="0.8"
          />

          {/* Anchor measurement rings */}
          {anchors.map((a, i) => (
            <g key={a.label}>
              <ellipse
                cx="250"
                cy={a.y}
                rx={i === 1 ? 70 : i === 2 ? 60 : i === 3 ? 78 : 50}
                ry={i === 1 ? 9 : 7}
                fill="none"
                stroke={i === 2 ? P.terracotta : P.forestDeep}
                strokeOpacity={0.55}
                strokeWidth="1.1"
                strokeDasharray="3 4"
              />
              <circle
                cx={a.side === "left" ? 180 : 320}
                cy={a.y}
                r="3.5"
                fill={i === 2 ? P.terracotta : P.forest}
              />
              <line
                x1={a.side === "left" ? 180 : 320}
                y1={a.y}
                x2={a.side === "left" ? 50 : 450}
                y2={a.y}
                stroke={i === 2 ? P.terracotta : P.forest}
                strokeOpacity="0.55"
                strokeWidth="1"
              />
            </g>
          ))}

          {/* Sweep scan line */}
          <rect
            x="20"
            y={70 + sweep * 480}
            width="460"
            height="2"
            fill={P.forest}
            opacity={0.55}
          />
          <rect
            x="20"
            y={70 + sweep * 480 - 14}
            width="460"
            height="14"
            fill={`url(#sweepGrad)`}
            opacity={0.25}
          />
          <defs>
            <linearGradient id="sweepGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={P.forest} stopOpacity="0" />
              <stop offset="100%" stopColor={P.forest} stopOpacity="0.45" />
            </linearGradient>
          </defs>

          {/* Corner reticles */}
          {[
            { x: 24, y: 24, h: 1, v: 1 },
            { x: 476, y: 24, h: -1, v: 1 },
            { x: 24, y: 576, h: 1, v: -1 },
            { x: 476, y: 576, h: -1, v: -1 },
          ].map((c, i) => (
            <g key={i} stroke={P.forest} strokeWidth="1.6" fill="none">
              <line x1={c.x} y1={c.y} x2={c.x + 14 * c.h} y2={c.y} />
              <line x1={c.x} y1={c.y} x2={c.x} y2={c.y + 14 * c.v} />
            </g>
          ))}
        </svg>

        {/* HTML overlay — labels and HUD */}
        {anchors.map(a => (
          <div
            key={a.label}
            style={{
              position: "absolute",
              top: `${(a.y / 600) * 100}%`,
              [a.side === "left" ? "left" : "right"]: "3%",
              transform: "translateY(-50%)",
              textAlign: a.side === "left" ? "left" : "right",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: 2,
                color: P.warmGray,
              }}
            >
              {a.label}
            </div>
            <div
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 22,
                fontWeight: 600,
                color: a.label === "WAIST" ? P.terracotta : P.forestDeep,
                lineHeight: 1,
              }}
            >
              {a.value}
            </div>
          </div>
        ))}

        {/* Top status pill */}
        <div
          style={{
            position: "absolute",
            top: 22,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,253,247,0.92)",
            border: `1px solid rgba(107,142,90,0.32)`,
            color: P.forestDeep,
            padding: "8px 14px",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 6px 18px rgba(75,65,52,0.10)",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: P.forest,
              boxShadow: `0 0 0 4px rgba(107,142,90,0.20)`,
            }}
          />
          Live Scan · 32 anchor points
        </div>

        {/* Fit chip bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 24,
            background: "rgba(255,253,247,0.92)",
            border: `1px solid rgba(75,65,52,0.10)`,
            padding: "10px 14px",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 10px 24px rgba(75,65,52,0.10)",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${P.forest}, ${P.forestDeep})`,
              color: P.cream,
              fontFamily: FONT_SERIF,
              fontWeight: 700,
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            96
          </div>
          <div>
            <div style={{ fontSize: 9, color: P.warmGray, letterSpacing: 1.6, fontWeight: 800 }}>FIT MATCH</div>
            <div style={{ fontSize: 13, color: P.ink, fontWeight: 700 }}>Reformation · Linen Trouser</div>
          </div>
        </div>

        {/* Confidence chip top right */}
        <div
          style={{
            position: "absolute",
            top: 70,
            right: 20,
            background: P.terracotta,
            color: P.cream,
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            boxShadow: "0 8px 22px rgba(198,93,7,0.32)",
          }}
        >
          0.6cm precision
        </div>
      </div>
    </div>
  );
}

// ─── Section: Nav ──────────────────────────────────────────
function LandingNav() {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(251,248,241,0.78)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid rgba(75,65,52,0.08)`,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${P.forest}, ${P.forestDeep})`,
              color: P.cream,
              fontFamily: FONT_SERIF,
              fontSize: 20,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 22px rgba(107,142,90,0.32)",
            }}
          >
            T
          </div>
          <div>
            <div style={{ fontFamily: FONT_SERIF, fontWeight: 600, fontSize: 18, color: P.ink, lineHeight: 1 }}>
              The Tailored Company
            </div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: P.warmGray, fontWeight: 700, marginTop: 4, textTransform: "uppercase" }}>
              Fit Intelligence · Est. 2024
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }} className="tlc-nav-links">
          {[
            ["Technology", "#tech"],
            ["How it works", "#how"],
            ["Atelier", "#atelier"],
            ["Press", "#press"],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              style={{
                color: P.inkSoft,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {label}
            </a>
          ))}
          <Link href="/app">
            <a
              style={{
                background: P.ink,
                color: P.cream,
                padding: "10px 18px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Open the app <IconArrow size={14} />
            </a>
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Section: Hero ─────────────────────────────────────────
function Hero() {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "84px 24px 100px",
        background: `
          radial-gradient(60% 70% at 20% 20%, rgba(156,175,136,0.32) 0%, transparent 60%),
          radial-gradient(50% 60% at 90% 80%, rgba(210,180,140,0.38) 0%, transparent 60%),
          linear-gradient(180deg, ${P.parchment} 0%, ${P.beige} 100%)
        `,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
          gap: 48,
          alignItems: "center",
        }}
        className="tlc-hero-grid"
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(255,253,247,0.7)",
              border: `1px solid rgba(107,142,90,0.30)`,
              color: P.forestDeep,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.8,
              textTransform: "uppercase",
              marginBottom: 28,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: P.forest,
                boxShadow: `0 0 0 4px rgba(107,142,90,0.20)`,
              }}
            />
            Now in private beta · iOS & web
          </div>

          <h1
            style={{
              fontFamily: FONT_SERIF,
              fontSize: "clamp(48px, 6vw, 84px)",
              lineHeight: 1.02,
              letterSpacing: -2,
              color: P.ink,
              fontWeight: 500,
              margin: 0,
            }}
          >
            Clothing that
            <br />
            <span style={{ color: P.terracotta, fontStyle: "italic" }}>actually fits you.</span>
          </h1>

          <p
            style={{
              marginTop: 24,
              fontSize: 19,
              lineHeight: 1.55,
              color: P.inkSoft,
              maxWidth: 520,
            }}
          >
            Tailored is a couture-grade fit engine. Scan your body in 45 seconds, then shop any retailer with a precise fit score, the right size pre-selected, and an alteration brief your tailor can actually use.
          </p>

          <div style={{ display: "flex", gap: 14, marginTop: 36, flexWrap: "wrap" }}>
            <Link href="/app">
              <a
                style={{
                  background: `linear-gradient(135deg, ${P.forest}, ${P.forestDeep})`,
                  color: P.cream,
                  padding: "18px 28px",
                  borderRadius: 16,
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  boxShadow: "0 18px 38px rgba(107,142,90,0.36)",
                }}
              >
                Build your fit profile <IconArrow />
              </a>
            </Link>
            <a
              href="#how"
              style={{
                background: "rgba(255,253,247,0.7)",
                color: P.ink,
                padding: "18px 26px",
                borderRadius: 16,
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
                border: `1px solid rgba(75,65,52,0.14)`,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              See how it works
            </a>
          </div>

          <div
            style={{
              marginTop: 38,
              display: "flex",
              flexWrap: "wrap",
              gap: 24,
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <IconStar key={i} />
              ))}
              <span style={{ marginLeft: 8, fontWeight: 700, color: P.ink, fontSize: 13 }}>4.9</span>
              <span style={{ color: P.warmGray, fontSize: 12 }}>· 2,800+ early members</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: P.warmGray, fontSize: 12 }}>
              <IconShield size={16} /> On-device · never sold
            </div>
          </div>
        </div>

        <div>
          <HeroBodyScan />
        </div>
      </div>
    </section>
  );
}

// ─── Section: Press ─────────────────────────────────────────
function PressMarquee() {
  const items = ["VOGUE", "THE CUT", "GQ", "BUSINESS OF FASHION", "WIRED", "FAST COMPANY", "ELLE"];
  return (
    <section
      id="press"
      style={{
        background: P.cream,
        borderTop: `1px solid rgba(75,65,52,0.08)`,
        borderBottom: `1px solid rgba(75,65,52,0.08)`,
        padding: "28px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 24,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 2.4,
            color: P.warmGray,
            textTransform: "uppercase",
          }}
        >
          As featured in
        </span>
        {items.map(name => (
          <span
            key={name}
            style={{
              fontFamily: FONT_SERIF,
              fontWeight: 600,
              fontSize: 18,
              letterSpacing: 2,
              color: P.inkSoft,
              opacity: 0.85,
            }}
          >
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}

// ─── Section: Value pillars ────────────────────────────────
function ValuePillars() {
  const cards = [
    {
      Icon: IconCamera,
      eyebrow: "Capture",
      title: "45-second body scan",
      body:
        "Two phone-camera passes. Our pose engine triangulates 32 anchor points and resolves measurements to within 0.6 cm.",
    },
    {
      Icon: IconTarget,
      eyebrow: "Match",
      title: "Fit score every garment",
      body:
        "We pull live size charts from 180+ retailers, run them against your body, and rank every item by how well it will actually fit.",
    },
    {
      Icon: IconScissors,
      eyebrow: "Refine",
      title: "Alteration briefs",
      body:
        "When a garment is close but not perfect, we generate a tailor-ready brief — exact takes, releases, and hem heights — before you buy.",
    },
  ];
  return (
    <section
      id="tech"
      style={{
        padding: "120px 24px",
        background: P.parchment,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ maxWidth: 760, marginBottom: 64 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 2.6,
              color: P.forest,
              textTransform: "uppercase",
              marginBottom: 18,
            }}
          >
            The Tailored System
          </div>
          <h2
            style={{
              fontFamily: FONT_SERIF,
              fontSize: "clamp(40px, 4.6vw, 64px)",
              lineHeight: 1.05,
              letterSpacing: -1.4,
              color: P.ink,
              fontWeight: 500,
              margin: 0,
            }}
          >
            We measure you once. <br />
            Then we measure <em style={{ color: P.terracotta }}>every garment</em> against you.
          </h2>
          <p
            style={{
              marginTop: 22,
              fontSize: 17,
              color: P.inkSoft,
              lineHeight: 1.6,
              maxWidth: 620,
            }}
          >
            No more guessing between an S and an M. No more returns. Every recommendation comes with a fit score, a confidence band, and a clear explanation.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}
        >
          {cards.map(({ Icon, eyebrow, title, body }) => (
            <article
              key={title}
              style={{
                background: P.cream,
                border: `1px solid rgba(75,65,52,0.10)`,
                borderRadius: 28,
                padding: 32,
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 24px 60px rgba(75,65,52,0.06)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `radial-gradient(120% 90% at 100% 0%, rgba(156,175,136,0.18) 0%, transparent 60%)`,
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  background: `linear-gradient(135deg, ${P.sageMist}, ${P.cream})`,
                  border: `1px solid rgba(107,142,90,0.32)`,
                  color: P.forestDeep,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 26,
                  position: "relative",
                }}
              >
                <Icon size={26} />
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 2.2,
                  color: P.warmGray,
                  textTransform: "uppercase",
                  marginBottom: 10,
                  position: "relative",
                }}
              >
                {eyebrow}
              </div>
              <h3
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: 28,
                  fontWeight: 600,
                  color: P.ink,
                  marginBottom: 12,
                  lineHeight: 1.1,
                  position: "relative",
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: P.inkSoft,
                  position: "relative",
                }}
              >
                {body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section: How it works ─────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Stand · spin · done",
      body:
        "Two 5-second camera passes. Pose-tracking confirms posture; we discard frames that aren’t clean.",
    },
    {
      n: "02",
      title: "Body, locked in",
      body:
        "Bust, waist, hip, shoulder, inseam, neck, sleeve and rise — resolved to within 0.6 cm and stored on-device.",
    },
    {
      n: "03",
      title: "Shop with confidence",
      body:
        "Every item across every retailer ranks against your body. Open one, see fit score, ideal size, and the cuts that will need work.",
    },
    {
      n: "04",
      title: "Send to your tailor",
      body:
        "When a piece is almost-right, we draft an alteration brief — takes, releases, hem — that any tailor can execute.",
    },
  ];

  return (
    <section
      id="how"
      style={{
        padding: "120px 24px",
        background: `
          linear-gradient(180deg, ${P.beige} 0%, ${P.parchment} 100%)
        `,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24, marginBottom: 56 }}>
          <div style={{ maxWidth: 640 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2.6,
                color: P.forest,
                textTransform: "uppercase",
                marginBottom: 18,
              }}
            >
              The Flow
            </div>
            <h2
              style={{
                fontFamily: FONT_SERIF,
                fontSize: "clamp(40px, 4.4vw, 60px)",
                lineHeight: 1.05,
                letterSpacing: -1.2,
                color: P.ink,
                margin: 0,
                fontWeight: 500,
              }}
            >
              Four steps to a wardrobe that <em style={{ color: P.terracotta }}>fits</em>.
            </h2>
          </div>
          <Link href="/app">
            <a
              style={{
                color: P.forestDeep,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 18px",
                borderRadius: 999,
                border: `1px solid rgba(107,142,90,0.32)`,
                background: "rgba(255,253,247,0.6)",
              }}
            >
              Start your scan <IconArrow />
            </a>
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {steps.map((s, i) => (
            <div
              key={s.n}
              style={{
                background: P.cream,
                border: `1px solid rgba(75,65,52,0.10)`,
                borderRadius: 22,
                padding: 26,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: 64,
                  lineHeight: 1,
                  color: i === 1 ? P.terracotta : P.sage,
                  opacity: 0.92,
                  fontWeight: 500,
                  marginBottom: 14,
                  letterSpacing: -1,
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: 22,
                  color: P.ink,
                  fontWeight: 600,
                  lineHeight: 1.15,
                  marginBottom: 8,
                }}
              >
                {s.title}
              </div>
              <p style={{ fontSize: 14, color: P.inkSoft, lineHeight: 1.55, margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section: Tech showcase ────────────────────────────────
function TechShowcase() {
  const points = [
    "32-anchor MediaPipe pose engine, calibrated against tape-measured ground truth",
    "Brand size-chart ingestion across 180+ retailers, normalized to a single metric model",
    "Garment-specific ease, stretch and intended drape worked into every fit score",
    "Alteration brief generation — exact takes, releases and hem heights",
    "On-device profile · we never sell or share your measurements",
  ];
  return (
    <section
      id="atelier"
      style={{
        padding: "120px 24px",
        background: P.ink,
        color: P.cream,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(60% 50% at 0% 0%, rgba(107,142,90,0.32) 0%, transparent 60%),
            radial-gradient(50% 50% at 100% 100%, rgba(198,93,7,0.20) 0%, transparent 60%)
          `,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          position: "relative",
          display: "grid",
          gridTemplateColumns: "minmax(0,1.05fr) minmax(0,0.95fr)",
          gap: 64,
          alignItems: "center",
        }}
        className="tlc-tech-grid"
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 2.6,
              color: P.sageMist,
              textTransform: "uppercase",
              marginBottom: 18,
            }}
          >
            The Tech Underneath
          </div>
          <h2
            style={{
              fontFamily: FONT_SERIF,
              fontSize: "clamp(38px, 4.2vw, 56px)",
              lineHeight: 1.08,
              letterSpacing: -1.2,
              fontWeight: 500,
              color: P.cream,
              margin: 0,
            }}
          >
            A couture atelier, <br />
            <em style={{ color: P.sage }}>compiled into your pocket.</em>
          </h2>
          <p style={{ marginTop: 20, fontSize: 16, lineHeight: 1.6, color: "rgba(247,243,233,0.78)", maxWidth: 560 }}>
            We rebuilt a tailor's bench in software. Pose tracking, brand-by-brand size chart normalization, garment ease models, and an alteration brief generator — all working together so you know what will fit before you ever try it on.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "28px 0 0", display: "grid", gap: 12 }}>
            {points.map(text => (
              <li key={text} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: P.sage,
                    color: P.ink,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <IconCheck />
                </span>
                <span style={{ fontSize: 14.5, lineHeight: 1.55, color: "rgba(247,243,233,0.86)" }}>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div
            style={{
              borderRadius: 28,
              background: "linear-gradient(180deg, rgba(255,253,247,0.06) 0%, rgba(255,253,247,0.02) 100%)",
              border: `1px solid rgba(247,243,233,0.10)`,
              padding: 24,
              boxShadow: "0 50px 120px rgba(0,0,0,0.45)",
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 18 }}>
              {["#C65D07", "#D2B48C", "#9CAF88"].map(c => (
                <span key={c} style={{ width: 9, height: 9, borderRadius: 999, background: c, opacity: 0.7 }} />
              ))}
              <div
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  letterSpacing: 2,
                  color: "rgba(247,243,233,0.5)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                fit-engine · v3.2
              </div>
            </div>

            {[
              ["Reformation · Linen Trouser", 96, "Perfect", P.sage],
              ["Toteme · Wool Coat", 88, "Tailor 0.5cm at waist", P.sand],
              ["Khaite · Cashmere Knit", 81, "Size up · sleeves long", P.terracotta],
              ["The Row · Silk Blouse", 73, "Bust runs narrow", P.sand],
            ].map(([name, score, note, color]) => (
              <div
                key={name}
                style={{
                  padding: "16px 0",
                  borderTop: "1px solid rgba(247,243,233,0.08)",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, color: P.cream, fontWeight: 600 }}>{name}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(247,243,233,0.55)", marginTop: 2 }}>{note}</div>
                </div>
                <div
                  style={{
                    fontFamily: FONT_SERIF,
                    fontSize: 28,
                    color: color,
                    fontWeight: 600,
                  }}
                >
                  {score}
                </div>
                <div style={{ gridColumn: "1 / -1", marginTop: 6, height: 4, background: "rgba(247,243,233,0.08)", borderRadius: 999 }}>
                  <div
                    style={{
                      width: `${score}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${color}, ${color}AA)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section: Testimonials ─────────────────────────────────
function Testimonials() {
  const quotes = [
    {
      q: "I haven't returned a piece in four months. Tailored knows my body better than I do.",
      who: "Maren K.",
      role: "Member · NYC",
    },
    {
      q: "The alteration brief feature alone saved me from buying three coats that were almost-right.",
      who: "Lila A.",
      role: "Member · London",
    },
    {
      q: "First time online shopping has actually felt couture. Every recommendation lands.",
      who: "Sara H.",
      role: "Member · LA",
    },
  ];
  return (
    <section
      style={{
        padding: "120px 24px",
        background: P.cream,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 2.6,
            color: P.forest,
            textTransform: "uppercase",
            marginBottom: 18,
          }}
        >
          From the atelier
        </div>
        <h2
          style={{
            fontFamily: FONT_SERIF,
            fontSize: "clamp(36px, 3.8vw, 52px)",
            lineHeight: 1.1,
            color: P.ink,
            margin: 0,
            marginBottom: 48,
            fontWeight: 500,
            letterSpacing: -1,
          }}
        >
          Members say it best.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 22,
          }}
        >
          {quotes.map(q => (
            <figure
              key={q.who}
              style={{
                margin: 0,
                background: P.parchment,
                border: `1px solid rgba(75,65,52,0.10)`,
                borderRadius: 22,
                padding: 28,
              }}
            >
              <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                {[0, 1, 2, 3, 4].map(i => (
                  <IconStar key={i} />
                ))}
              </div>
              <blockquote
                style={{
                  margin: 0,
                  fontFamily: FONT_SERIF,
                  fontSize: 22,
                  lineHeight: 1.32,
                  color: P.ink,
                  fontWeight: 500,
                }}
              >
                “{q.q}”
              </blockquote>
              <figcaption style={{ marginTop: 18, fontSize: 12, color: P.warmGray, fontWeight: 700, letterSpacing: 0.5 }}>
                <span style={{ color: P.ink }}>{q.who}</span> · {q.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section: Final CTA ────────────────────────────────────
function FinalCta() {
  return (
    <section
      style={{
        padding: "120px 24px",
        background: `
          radial-gradient(60% 80% at 50% 20%, rgba(107,142,90,0.25) 0%, transparent 60%),
          linear-gradient(180deg, ${P.parchment} 0%, ${P.beige} 100%)
        `,
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: FONT_SERIF,
            fontSize: "clamp(40px, 5vw, 68px)",
            lineHeight: 1.04,
            color: P.ink,
            fontWeight: 500,
            margin: 0,
            letterSpacing: -1.4,
          }}
        >
          Your closet, <em style={{ color: P.terracotta }}>tailored.</em>
        </h2>
        <p
          style={{
            marginTop: 20,
            fontSize: 18,
            color: P.inkSoft,
            lineHeight: 1.6,
            maxWidth: 600,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Take 45 seconds to scan. Then shop with the confidence of someone who has a tailor on call.
        </p>
        <Link href="/app">
          <a
            style={{
              marginTop: 36,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "20px 34px",
              borderRadius: 18,
              background: `linear-gradient(135deg, ${P.forest}, ${P.forestDeep})`,
              color: P.cream,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 0.4,
              textDecoration: "none",
              boxShadow: "0 24px 56px rgba(107,142,90,0.42)",
            }}
          >
            Build your fit profile <IconArrow />
          </a>
        </Link>
        <div style={{ marginTop: 18, fontSize: 12, color: P.warmGray }}>
          Free to start · No card required · Profile stays on your device
        </div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      style={{
        background: P.ink,
        color: "rgba(247,243,233,0.7)",
        padding: "64px 24px 32px",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(0,1.4fr) repeat(3, minmax(0,1fr))",
          gap: 40,
        }}
        className="tlc-footer-grid"
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${P.sage}, ${P.forest})`,
                color: P.cream,
                fontFamily: FONT_SERIF,
                fontSize: 20,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              T
            </div>
            <div style={{ color: P.cream, fontFamily: FONT_SERIF, fontSize: 22, fontWeight: 600 }}>
              The Tailored Company
            </div>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 320 }}>
            Couture-grade fit intelligence. Engineered in Brooklyn. For closets that finally know your body.
          </p>
        </div>
        {[
          { title: "Product", links: ["The app", "How it works", "For tailors", "For brands"] },
          { title: "Company", links: ["About", "Press", "Careers", "Contact"] },
          { title: "Legal", links: ["Privacy", "Terms", "Cookies", "Accessibility"] },
        ].map(group => (
          <div key={group.title}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2,
                color: P.sageMist,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              {group.title}
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
              {group.links.map(l => (
                <li key={l}>
                  <a
                    href="#"
                    style={{ color: "rgba(247,243,233,0.72)", textDecoration: "none", fontSize: 14 }}
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        style={{
          maxWidth: 1280,
          margin: "48px auto 0",
          paddingTop: 24,
          borderTop: "1px solid rgba(247,243,233,0.10)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          fontSize: 12,
          color: "rgba(247,243,233,0.55)",
        }}
      >
        <span>© {new Date().getFullYear()} The Tailored Company · All rights reserved</span>
        <span>thetailoredcompany.com</span>
      </div>
    </footer>
  );
}

// ─── Main ──────────────────────────────────────────────────
export default function Landing() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: P.parchment,
        color: P.ink,
        fontFamily: FONT_SANS,
        overflowX: "hidden",
        overflowY: "auto",
        height: "100vh",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
        html, body, #root { background: ${P.parchment}; }
        body { -webkit-font-smoothing: antialiased; }
        a { transition: opacity 0.2s ease, transform 0.2s ease; }
        a:hover { opacity: 0.88; }
        @media (max-width: 900px) {
          .tlc-hero-grid, .tlc-tech-grid {
            grid-template-columns: 1fr !important;
          }
          .tlc-nav-links {
            display: none !important;
          }
          .tlc-footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .tlc-footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
        /* Force this page to scroll over the root no-scroll rule */
        :root { overflow: auto !important; }
      `}</style>
      <LandingNav />
      <Hero />
      <PressMarquee />
      <ValuePillars />
      <HowItWorks />
      <TechShowcase />
      <Testimonials />
      <FinalCta />
      <Footer />
    </div>
  );
}
