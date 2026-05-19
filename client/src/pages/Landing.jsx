import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── Palette · earthy, sustainable (NO orange/amber/copper/terracotta/rust/gold)
const P = {
  sage: "#9CAF88",
  sageMist: "#C4D2B6",
  forest: "#6B8E5A",
  forestDeep: "#4F6B43",
  moss: "#3F5535",
  olive: "#8B9556",
  beige: "#EDEEE8",
  cream: "#F2F3EE",
  parchment: "#F2F3EE",
  taupe: "#A8AE9A",
  stone: "#9AA88E",
  cocoa: "#3A4537",
  brown: "#544A3E",
  warmGray: "#7C857B",
  ink: "#1F2620",
  inkSoft: "#3A4137",
  oat: "#DBDEC9",
};
const FONT_SERIF = "'Cormorant Garamond', Georgia, serif";
const FONT_SANS = "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif";

// ─── tiny icons ───────────────────────────────────────────
const Ico = ({ children, size = 22, sw = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const IconLink = ({ size }) => (<Ico size={size}><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></Ico>);
const IconScissors = ({ size }) => (<Ico size={size}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></Ico>);
const IconBox = ({ size }) => (<Ico size={size}><path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Ico>);
const IconTruck = ({ size }) => (<Ico size={size}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></Ico>);
const IconCheck = ({ size = 16 }) => (<Ico size={size} sw={2.4}><polyline points="20 6 9 17 4 12"/></Ico>);
const IconArrow = ({ size = 18 }) => (<Ico size={size} sw={2}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></Ico>);
const IconShield = ({ size }) => (<Ico size={size}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Ico>);
const IconUpload = ({ size }) => (<Ico size={size}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Ico>);
const IconLeaf = ({ size }) => (<Ico size={size}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.5c1 1.5.5 7-2 10.5-2.5 3.5-5.5 4.8-7.5 4.5"/><path d="M2 22c1-3 4.5-7 9-7"/></Ico>);

// ─── Section: Nav (lean, marketing site) ──────────────────
function SiteNav() {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(242,243,238,0.85)",
      backdropFilter: "blur(18px)",
      borderBottom: `1px solid rgba(45,55,42,0.08)`,
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "16px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <a href="#top" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `linear-gradient(135deg, ${P.forest}, ${P.forestDeep})`,
            color: P.cream, fontFamily: FONT_SERIF, fontSize: 20, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>T</div>
          <div>
            <div style={{ fontFamily: FONT_SERIF, fontWeight: 600, fontSize: 18, color: P.ink, lineHeight: 1 }}>
              The Tailored Company
            </div>
            <div style={{ fontSize: 10, letterSpacing: 1.8, color: P.warmGray, fontWeight: 700, marginTop: 4, textTransform: "uppercase" }}>
              Online tailoring · made to fit
            </div>
          </div>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }} className="tlc-nav-links">
          {[
            ["Try the tool", "#tool"],
            ["How it works", "#how"],
            ["Shipping", "#shipping"],
            ["FAQ", "#faq"],
          ].map(([label, href]) => (
            <a key={label} href={href} style={{
              color: P.inkSoft, fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}>{label}</a>
          ))}
          <a href="#tool" style={{
            background: P.ink, color: P.cream,
            padding: "10px 18px", borderRadius: 999,
            fontSize: 13, fontWeight: 700, textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            Start with a link <IconArrow size={14}/>
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─── Section: Hero ────────────────────────────────────────
function Hero() {
  return (
    <section id="top" style={{
      position: "relative", overflow: "hidden",
      padding: "84px 24px 80px",
      background: `
        radial-gradient(55% 65% at 18% 18%, rgba(156,175,136,0.30) 0%, transparent 60%),
        radial-gradient(50% 60% at 88% 78%, rgba(168,174,154,0.34) 0%, transparent 60%),
        linear-gradient(180deg, ${P.parchment} 0%, ${P.beige} 100%)
      `,
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,0.95fr)",
        gap: 56, alignItems: "center",
      }} className="tlc-hero-grid">
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 14px", borderRadius: 999,
            background: "rgba(242,243,238,0.7)",
            border: `1px solid rgba(107,142,90,0.30)`,
            color: P.forestDeep, fontSize: 11, fontWeight: 800,
            letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 24,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: P.forest }}/>
            Online tailoring · paste a link, get it altered
          </div>
          <h1 style={{
            fontFamily: FONT_SERIF, fontSize: "clamp(44px, 5.6vw, 78px)",
            lineHeight: 1.02, letterSpacing: -1.6, color: P.ink, fontWeight: 500, margin: 0,
          }}>
            Buy any garment online.
            <br/>
            <span style={{ color: P.moss, fontStyle: "italic" }}>We tailor it to fit.</span>
          </h1>
          <p style={{
            marginTop: 22, fontSize: 18, lineHeight: 1.55, color: P.inkSoft, maxWidth: 560,
          }}>
            Paste a product link from any retailer. We pull the size chart, render an estimated
            try-on preview on your body, and let you <em>drag the hem, waist, or sleeve</em> exactly
            where you want it. Order the piece yourself, ship it to us, we alter it and send it back.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
            <a href="#tool" style={{
              background: `linear-gradient(135deg, ${P.forest}, ${P.forestDeep})`,
              color: P.cream, padding: "16px 26px", borderRadius: 14,
              fontSize: 15, fontWeight: 700, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 10,
              boxShadow: "0 16px 34px rgba(107,142,90,0.32)",
            }}>
              Paste a product link <IconArrow/>
            </a>
            <a href="#how" style={{
              background: "rgba(242,243,238,0.7)", color: P.ink,
              padding: "16px 24px", borderRadius: 14,
              fontSize: 15, fontWeight: 700, textDecoration: "none",
              border: `1px solid rgba(45,55,42,0.14)`,
              display: "inline-flex", alignItems: "center", gap: 10,
            }}>See how it works</a>
          </div>
          <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 20, color: P.warmGray, fontSize: 13 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <IconShield size={16}/> Tailor-reviewed before any cut
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <IconLeaf size={16}/> Fewer returns, less landfill
            </span>
          </div>
        </div>
        <div>
          <HeroVisual/>
        </div>
      </div>
    </section>
  );
}

// ─── Hero side visual: a small static preview of the tool ─
function HeroVisual() {
  return (
    <div style={{
      position: "relative", width: "100%", maxWidth: 520,
      margin: "0 auto",
      borderRadius: 28,
      background: `linear-gradient(180deg, ${P.cream} 0%, ${P.beige} 100%)`,
      border: `1px solid rgba(45,55,42,0.10)`,
      boxShadow: "0 50px 110px rgba(45,55,42,0.18), inset 0 1px 0 rgba(255,255,255,0.7)",
      padding: 22,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          padding: "6px 10px", borderRadius: 999,
          background: "rgba(107,142,90,0.14)",
          color: P.forestDeep, fontSize: 10, fontWeight: 800, letterSpacing: 1.6,
          textTransform: "uppercase",
        }}>Drag-to-alter preview</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <BodyGarmentPreview compact/>
      </div>
    </div>
  );
}

// ─── Body + Garment SVG with optional draggable handles ──
// alterations: { hemDelta, waistDelta, sleeveDelta } in inches (signed)
// onChange: setter
function BodyGarmentPreview({ compact = false, alterations, onChange, garmentType = "pants" }) {
  const localState = useState({ hemDelta: 0, waistDelta: 0, sleeveDelta: 0 });
  const a = alterations ?? localState[0];
  const setA = onChange ?? localState[1];
  const svgRef = useRef(null);
  const draggingRef = useRef(null);

  // Base SVG coords: viewBox 0 0 500 760
  // Convert pixel drag delta to inches: rough scale 1in = 14px (visualization only)
  const PX_PER_IN = 14;

  const startDrag = (handle) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      start: { ...a },
    };
    const move = (ev) => {
      const d = draggingRef.current;
      if (!d) return;
      const dx = ev.clientX - d.startX;
      const dy = ev.clientY - d.startY;
      const next = { ...d.start };
      if (d.handle === "hem") {
        next.hemDelta = clamp(round1(-dy / PX_PER_IN), -4, 4);
      } else if (d.handle === "waist") {
        next.waistDelta = clamp(round1(-Math.abs(dx) / PX_PER_IN * Math.sign(dx)), -3, 3);
      } else if (d.handle === "sleeve") {
        next.sleeveDelta = clamp(round1(-dy / PX_PER_IN), -3, 3);
      }
      setA(next);
    };
    const up = () => {
      draggingRef.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const isInteractive = !!onChange;

  // Garment geometry adjustments
  const hemY = 700 + a.hemDelta * PX_PER_IN; // pants hem y (deeper y = longer)
  const waistInset = a.waistDelta * (PX_PER_IN / 2); // taken in (negative = tighter)
  const sleeveY = 360 + a.sleeveDelta * PX_PER_IN;

  return (
    <div style={{
      position: "relative", width: "100%",
      aspectRatio: compact ? "5/6" : "4/6",
      background: `linear-gradient(180deg, ${P.cream} 0%, ${P.beige} 100%)`,
      borderRadius: 20,
      border: `1px solid rgba(45,55,42,0.10)`,
      overflow: "hidden",
      touchAction: isInteractive ? "none" : "auto",
    }}>
      <svg
        ref={svgRef}
        viewBox="0 0 500 760"
        width="100%" height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
      >
        <defs>
          <pattern id="grid-prev" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M 22 0 L 0 0 0 22" fill="none" stroke={P.warmGray} strokeOpacity="0.14" strokeWidth="0.5"/>
          </pattern>
          <linearGradient id="bodyFillPrev" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E8DCC6"/>
            <stop offset="55%" stopColor="#D6C5A8"/>
            <stop offset="100%" stopColor="#B5A589"/>
          </linearGradient>
          <linearGradient id="garmentFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={P.forest}/>
            <stop offset="100%" stopColor={P.forestDeep}/>
          </linearGradient>
          <linearGradient id="shirtFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={P.oat}/>
            <stop offset="100%" stopColor={P.taupe}/>
          </linearGradient>
        </defs>
        <rect width="500" height="760" fill="url(#grid-prev)"/>

        {/* Body silhouette (head + torso + legs) */}
        {/* head */}
        <ellipse cx="250" cy="120" rx="48" ry="58" fill="url(#bodyFillPrev)"/>
        {/* neck */}
        <rect x="232" y="170" width="36" height="30" fill="url(#bodyFillPrev)"/>
        {/* torso */}
        <path d="M180 200
                 C 180 220 178 260 184 320
                 L 188 400
                 C 188 420 195 430 215 432
                 L 285 432
                 C 305 430 312 420 312 400
                 L 316 320
                 C 322 260 320 220 320 200
                 Z" fill="url(#bodyFillPrev)"/>
        {/* arms */}
        <path d="M180 200 C 168 220 158 280 156 340 C 154 380 158 410 164 432 L 184 430 C 186 410 184 380 188 340 C 192 280 196 220 196 200 Z" fill="url(#bodyFillPrev)"/>
        <path d="M320 200 C 332 220 342 280 344 340 C 346 380 342 410 336 432 L 316 430 C 314 410 316 380 312 340 C 308 280 304 220 304 200 Z" fill="url(#bodyFillPrev)"/>
        {/* legs */}
        <path d="M210 432 L 218 720 L 248 720 L 252 432 Z" fill="url(#bodyFillPrev)"/>
        <path d="M252 432 L 282 720 L 290 720 L 290 432 Z" fill="url(#bodyFillPrev)"/>

        {/* GARMENT — shirt (always shown) */}
        <path d={`
          M 184 200
          L 184 ${sleeveY}
          L 160 ${sleeveY + 8}
          L 156 ${sleeveY + 24}
          L 188 ${sleeveY + 18}
          L 188 430
          L 312 430
          L 312 ${sleeveY + 18}
          L 344 ${sleeveY + 24}
          L 340 ${sleeveY + 8}
          L 316 ${sleeveY}
          L 316 200
          C 300 196 280 208 250 208
          C 220 208 200 196 184 200
          Z
        `} fill="url(#shirtFill)" stroke="rgba(45,55,42,0.18)" strokeWidth="1"/>

        {/* GARMENT — pants */}
        {garmentType === "pants" && (
          <g>
            {/* waist band, with optional take-in (inset) */}
            <path d={`
              M ${188 + waistInset} 432
              L ${312 - waistInset} 432
              L ${312 - waistInset} 446
              L ${188 + waistInset} 446
              Z
            `} fill="url(#garmentFill)" stroke="rgba(45,55,42,0.25)" strokeWidth="1"/>
            {/* left leg */}
            <path d={`
              M ${188 + waistInset} 446
              L 200 ${hemY}
              L 252 ${hemY}
              L 252 446
              Z
            `} fill="url(#garmentFill)" stroke="rgba(45,55,42,0.2)" strokeWidth="1"/>
            {/* right leg */}
            <path d={`
              M 252 446
              L 252 ${hemY}
              L 304 ${hemY}
              L ${312 - waistInset} 446
              Z
            `} fill="url(#garmentFill)" stroke="rgba(45,55,42,0.2)" strokeWidth="1"/>
            {/* original hem ghost when altered */}
            {Math.abs(a.hemDelta) > 0.05 && (
              <line x1="195" y1={700} x2="310" y2={700}
                stroke={P.warmGray} strokeDasharray="5 5" strokeWidth="1.5" opacity="0.6"/>
            )}
          </g>
        )}

        {/* Handles (drag targets) */}
        {isInteractive && (
          <g>
            {/* HEM handle (vertical drag) */}
            <g
              onPointerDown={startDrag("hem")}
              style={{ cursor: "ns-resize" }}
            >
              <line x1="200" y1={hemY} x2="304" y2={hemY}
                stroke={P.cream} strokeWidth="2" opacity="0.85"/>
              <circle cx="252" cy={hemY} r="14"
                fill={P.cream} stroke={P.forest} strokeWidth="2.5"/>
              <line x1="246" y1={hemY - 4} x2="246" y2={hemY + 4} stroke={P.forest} strokeWidth="2"/>
              <line x1="258" y1={hemY - 4} x2="258" y2={hemY + 4} stroke={P.forest} strokeWidth="2"/>
              <text x="270" y={hemY + 4} fontSize="13" fill={P.ink} fontWeight="700"
                style={{ fontFamily: FONT_SANS }}>
                Hem · drag ↕
              </text>
            </g>
            {/* WAIST handle (horizontal drag) */}
            <g
              onPointerDown={startDrag("waist")}
              style={{ cursor: "ew-resize" }}
            >
              <circle cx={188 + waistInset - 6} cy={438} r="11"
                fill={P.cream} stroke={P.forest} strokeWidth="2.5"/>
              <line x1={185 + waistInset - 6} y1="438" x2={191 + waistInset - 6} y2="438" stroke={P.forest} strokeWidth="2"/>
              <circle cx={312 - waistInset + 6} cy={438} r="11"
                fill={P.cream} stroke={P.forest} strokeWidth="2.5"/>
              <line x1={309 - waistInset + 6} y1="438" x2={315 - waistInset + 6} y2="438" stroke={P.forest} strokeWidth="2"/>
              <text x="360" y="442" fontSize="13" fill={P.ink} fontWeight="700"
                style={{ fontFamily: FONT_SANS }}>
                Waist · drag ↔
              </text>
            </g>
            {/* SLEEVE handle */}
            <g
              onPointerDown={startDrag("sleeve")}
              style={{ cursor: "ns-resize" }}
            >
              <circle cx="156" cy={sleeveY + 18} r="11"
                fill={P.cream} stroke={P.forest} strokeWidth="2.5"/>
              <line x1="153" y1={sleeveY + 18} x2="159" y2={sleeveY + 18} stroke={P.forest} strokeWidth="2"/>
              <text x="14" y={sleeveY + 4} fontSize="13" fill={P.ink} fontWeight="700"
                style={{ fontFamily: FONT_SANS }}>
                Sleeve ↕
              </text>
            </g>
          </g>
        )}

        {/* Status badge */}
        <g>
          <rect x="20" y="20" width="200" height="28" rx="14"
            fill="rgba(242,243,238,0.92)" stroke="rgba(107,142,90,0.32)"/>
          <circle cx="36" cy="34" r="4" fill={P.forest}/>
          <text x="48" y="38" fontSize="10" fontWeight="800"
            fill={P.forestDeep} style={{ fontFamily: FONT_SANS, letterSpacing: 1.6 }}>
            ESTIMATED TRY-ON PREVIEW
          </text>
        </g>
      </svg>
    </div>
  );
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function round1(v) { return Math.round(v * 10) / 10; }

// ─── Section: Tool — paste a link, extract specs, drag-to-alter ─
function ToolSection() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState("idle"); // idle | extracting | extracted
  const [product, setProduct] = useState(null);
  const [alterations, setAlterations] = useState({ hemDelta: 0, waistDelta: 0, sleeveDelta: 0 });

  const examples = [
    { name: "Everlane · Way-High Drape Pant", host: "everlane.com" },
    { name: "Reformation · Linen Trouser", host: "thereformation.com" },
    { name: "COS · Wide-Leg Pant", host: "cos.com" },
    { name: "Madewell · Curvy Demi Boot Jean", host: "madewell.com" },
  ];

  const extract = (linkOverride) => {
    const link = linkOverride ?? url;
    if (!link) return;
    setUrl(link);
    setState("extracting");
    setProduct(null);
    setAlterations({ hemDelta: 0, waistDelta: 0, sleeveDelta: 0 });
    setTimeout(() => {
      const host = safeHost(link);
      setProduct({
        retailer: host || "retailer.com",
        name: pickName(host),
        category: "Pants",
        sizeRec: "US 6",
        sizeChart: [
          { label: "Waist (size 6)", value: '27.5"' },
          { label: "Hip (size 6)", value: '37.5"' },
          { label: "Inseam (size 6)", value: '31.0"' },
          { label: "Leg opening", value: '14.0"' },
        ],
        fabric: "Mid-weight linen · 4% stretch",
        notes: "Runs long. Many customers shorten the inseam 1–2 inches.",
      });
      setState("extracted");
    }, 1100);
  };

  const altBrief = useMemo(() => buildBrief(alterations), [alterations]);

  return (
    <section id="tool" style={{
      padding: "100px 24px",
      background: `linear-gradient(180deg, ${P.beige} 0%, ${P.parchment} 100%)`,
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="The website tool"
          title={<>Paste a link. Drag the fit. <em style={{ color: P.moss }}>Done.</em></>}
          body="Try it right here — no install, no app. We pull the product specs, render an estimated try-on preview on your measurements, and let you adjust the fit in real time."
        />

        {/* URL input */}
        <div style={{
          background: P.cream,
          border: `1px solid rgba(45,55,42,0.10)`,
          borderRadius: 24, padding: 24,
          boxShadow: "0 24px 60px rgba(45,55,42,0.06)",
          marginTop: 36,
        }}>
          <div style={{
            display: "flex", gap: 10, flexWrap: "wrap", alignItems: "stretch",
          }}>
            <div style={{
              flex: 1, minWidth: 240,
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 16px",
              background: P.parchment,
              border: `1px solid rgba(45,55,42,0.12)`,
              borderRadius: 14,
            }}>
              <IconLink size={20}/>
              <input
                type="url"
                placeholder="Paste a product URL (https://…)"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") extract(); }}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontFamily: FONT_SANS, fontSize: 15, color: P.ink,
                }}
              />
            </div>
            <button
              onClick={() => extract()}
              disabled={!url || state === "extracting"}
              style={{
                background: `linear-gradient(135deg, ${P.forest}, ${P.forestDeep})`,
                color: P.cream, padding: "14px 22px",
                borderRadius: 14, border: "none",
                fontSize: 14, fontWeight: 800, cursor: "pointer",
                letterSpacing: 0.4, opacity: !url || state === "extracting" ? 0.5 : 1,
                display: "inline-flex", alignItems: "center", gap: 8,
              }}
            >
              {state === "extracting" ? "Extracting specs…" : "Extract product specs"}
              {state !== "extracting" && <IconArrow size={16}/>}
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: P.warmGray, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase" }}>
              Try one
            </span>
            {examples.map(ex => (
              <button
                key={ex.host}
                onClick={() => extract(`https://${ex.host}/products/example`)}
                style={{
                  background: "transparent",
                  border: `1px solid rgba(107,142,90,0.32)`,
                  color: P.forestDeep, fontWeight: 700, fontSize: 12,
                  padding: "6px 10px", borderRadius: 999, cursor: "pointer",
                }}
              >{ex.name}</button>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: P.warmGray }}>
            Demo mode — extracted specs are illustrative while we expand retailer coverage.
          </div>
        </div>

        {/* Two-column: preview + brief */}
        {state === "extracted" && product && (
          <div style={{
            marginTop: 28,
            display: "grid",
            gridTemplateColumns: "minmax(0,1.05fr) minmax(0,0.95fr)",
            gap: 24,
          }} className="tlc-tool-grid">
            <div style={{
              background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
              borderRadius: 24, padding: 22,
              boxShadow: "0 24px 60px rgba(45,55,42,0.06)",
            }}>
              <ProductHeader product={product}/>
              <div style={{ marginTop: 14 }}>
                <BodyGarmentPreview
                  alterations={alterations}
                  onChange={setAlterations}
                />
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: P.warmGray }}>
                Drag the circular handles on the hem, waist, or sleeve. Numbers update live in the
                alteration brief on the right.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateRows: "auto auto 1fr", gap: 16 }}>
              <SpecCard product={product}/>
              <AlterationBrief alterations={alterations} brief={altBrief} onReset={() => setAlterations({ hemDelta:0, waistDelta:0, sleeveDelta:0 })}/>
              <SendToTailorCTA/>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function pickName(host) {
  if (!host) return "Linen Trouser";
  if (host.includes("everlane")) return "Way-High Drape Pant";
  if (host.includes("reformation")) return "Linen Trouser";
  if (host.includes("cos")) return "Wide-Leg Pant";
  if (host.includes("madewell")) return "Curvy Demi Boot Jean";
  return "Tailored Trouser";
}
function safeHost(u) {
  try { return new URL(u).host.replace(/^www\./, ""); } catch { return ""; }
}

function ProductHeader({ product }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.8, color: P.warmGray, textTransform: "uppercase" }}>
          From {product.retailer}
        </div>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 24, fontWeight: 600, color: P.ink, lineHeight: 1.1, marginTop: 4 }}>
          {product.name}
        </div>
      </div>
      <div style={{
        padding: "6px 12px", borderRadius: 999,
        background: "rgba(107,142,90,0.14)",
        color: P.forestDeep, fontSize: 11, fontWeight: 800, letterSpacing: 1.4,
        textTransform: "uppercase",
      }}>
        Recommended size · {product.sizeRec}
      </div>
    </div>
  );
}

function SpecCard({ product }) {
  return (
    <div style={{
      background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
      borderRadius: 20, padding: 18,
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, color: P.warmGray, textTransform: "uppercase", marginBottom: 10 }}>
        Extracted specs
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {product.sizeChart.map(row => (
          <div key={row.label} style={{
            padding: "8px 10px", background: P.parchment,
            borderRadius: 10, border: `1px solid rgba(45,55,42,0.08)`,
          }}>
            <div style={{ fontSize: 10, color: P.warmGray, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase" }}>
              {row.label}
            </div>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 18, fontWeight: 600, color: P.ink }}>
              {row.value}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 13, color: P.inkSoft }}>
        <strong>Fabric:</strong> {product.fabric}
      </div>
      <div style={{ marginTop: 6, fontSize: 13, color: P.inkSoft, fontStyle: "italic" }}>
        {product.notes}
      </div>
    </div>
  );
}

function buildBrief({ hemDelta, waistDelta, sleeveDelta }) {
  const lines = [];
  if (Math.abs(hemDelta) >= 0.1) {
    lines.push(hemDelta > 0
      ? `Lengthen hem by ${hemDelta.toFixed(1)}"` // unusual but supported on cuffed/turn-up
      : `Shorten hem (inseam) by ${Math.abs(hemDelta).toFixed(1)}"`);
  }
  if (Math.abs(waistDelta) >= 0.1) {
    lines.push(waistDelta < 0
      ? `Take in waist by ${Math.abs(waistDelta).toFixed(1)}" (center back)`
      : `Let out waist by ${waistDelta.toFixed(1)}"`);
  }
  if (Math.abs(sleeveDelta) >= 0.1) {
    lines.push(sleeveDelta > 0
      ? `Lengthen sleeve by ${sleeveDelta.toFixed(1)}"`
      : `Shorten sleeve by ${Math.abs(sleeveDelta).toFixed(1)}"`);
  }
  if (!lines.length) lines.push("No alterations yet — drag a handle on the preview to start.");
  return lines;
}

function AlterationBrief({ alterations, brief, onReset }) {
  return (
    <div style={{
      background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
      borderRadius: 20, padding: 18,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, color: P.warmGray, textTransform: "uppercase" }}>
          Alteration brief · live
        </div>
        <button onClick={onReset} style={{
          background: "transparent", border: `1px solid rgba(45,55,42,0.16)`,
          padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: P.inkSoft,
          cursor: "pointer",
        }}>Reset</button>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
        {brief.map((line, i) => (
          <li key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "10px 12px",
            background: P.parchment,
            border: `1px solid rgba(45,55,42,0.08)`,
            borderRadius: 12,
            fontSize: 14, color: P.ink,
          }}>
            <span style={{ marginTop: 2, color: P.forest }}><IconScissors size={16}/></span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <div style={{
        marginTop: 12,
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
      }}>
        {[
          ["Hem", `${alterations.hemDelta > 0 ? "+" : ""}${alterations.hemDelta.toFixed(1)}"`],
          ["Waist", `${alterations.waistDelta > 0 ? "+" : ""}${alterations.waistDelta.toFixed(1)}"`],
          ["Sleeve", `${alterations.sleeveDelta > 0 ? "+" : ""}${alterations.sleeveDelta.toFixed(1)}"`],
        ].map(([k, v]) => (
          <div key={k} style={{
            padding: "8px 10px", borderRadius: 10,
            background: "rgba(107,142,90,0.10)",
            border: `1px solid rgba(107,142,90,0.22)`,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 10, color: P.warmGray, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase" }}>{k}</div>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 18, fontWeight: 600, color: P.ink }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: P.warmGray }}>
        A human tailor reviews this brief before any cutting begins.
      </div>
    </div>
  );
}

function SendToTailorCTA() {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${P.cocoa}, ${P.brown})`,
      color: P.cream, borderRadius: 20, padding: 20,
    }}>
      <div style={{ fontFamily: FONT_SERIF, fontSize: 22, fontWeight: 600, lineHeight: 1.1 }}>
        Ready when you are.
      </div>
      <div style={{ fontSize: 13, opacity: 0.85, marginTop: 8 }}>
        Order the piece from the retailer yourself. Then start your tailoring order and we’ll
        guide you to ship it to <strong>123 Main Street</strong>.
      </div>
      <a href="#shipping" style={{
        marginTop: 14, display: "inline-flex", alignItems: "center", gap: 8,
        background: P.cream, color: P.ink,
        padding: "10px 16px", borderRadius: 999,
        textDecoration: "none", fontWeight: 800, fontSize: 13,
      }}>Start tailoring order <IconArrow size={14}/></a>
    </div>
  );
}

// ─── Section header helper ───────────────────────────────
function SectionHeader({ eyebrow, title, body }) {
  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{
        fontSize: 11, fontWeight: 800, letterSpacing: 2.4,
        color: P.forest, textTransform: "uppercase", marginBottom: 14,
      }}>{eyebrow}</div>
      <h2 style={{
        fontFamily: FONT_SERIF, fontSize: "clamp(36px, 4.2vw, 56px)",
        lineHeight: 1.05, letterSpacing: -1.2, color: P.ink, fontWeight: 500, margin: 0,
      }}>{title}</h2>
      {body && (
        <p style={{ marginTop: 18, fontSize: 17, color: P.inkSoft, lineHeight: 1.6, maxWidth: 640 }}>
          {body}
        </p>
      )}
    </div>
  );
}

// ─── Section: How it works ───────────────────────────────
function HowItWorks() {
  const steps = [
    { n: "01", Icon: IconLink, title: "Paste a product link", body: "We pull the listing — name, image, size chart, fabric, and fit notes — straight from the retailer page." },
    { n: "02", Icon: IconScissors, title: "Drag the fit you want", body: "Pull the hem, waist, or sleeve on your body preview. Each drag becomes a precise alteration measurement." },
    { n: "03", Icon: IconBox, title: "Order it yourself + send proof", body: "Buy the garment from the retailer in your name. Upload your order confirmation and tracking so we know it’s coming." },
    { n: "04", Icon: IconTruck, title: "Ship to 123 Main Street", body: "When it arrives at your door, drop it in the prepaid mailer to The Tailored Company at 123 Main Street." },
    { n: "05", Icon: IconCheck, title: "We alter, then ship it back", body: "A human tailor reviews your brief, makes the alterations, and ships the finished piece to you." },
  ];
  return (
    <section id="how" style={{ padding: "100px 24px", background: P.parchment }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="How it works"
          title={<>Five steps. <em style={{ color: P.moss }}>No app required.</em></>}
          body="Everything happens right on this site. You order the garment from the retailer; we handle the tailoring."
        />
        <div style={{
          marginTop: 36,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}>
          {steps.map(({ n, Icon, title, body }) => (
            <article key={n} style={{
              background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
              borderRadius: 20, padding: 22,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: `linear-gradient(135deg, ${P.sageMist}, ${P.cream})`,
                  border: `1px solid rgba(107,142,90,0.30)`,
                  color: P.forestDeep,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}><Icon size={22}/></div>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 26, color: P.taupe, fontWeight: 600 }}>{n}</div>
              </div>
              <h3 style={{ fontFamily: FONT_SERIF, fontSize: 22, color: P.ink, fontWeight: 600, lineHeight: 1.1, margin: 0 }}>{title}</h3>
              <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55, color: P.inkSoft }}>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section: Shipping / proof-of-order ──────────────────
function ShippingSection() {
  const [order, setOrder] = useState({ orderId: "", retailer: "", tracking: "" });
  const [proofName, setProofName] = useState(null);
  const fileRef = useRef(null);
  const update = (k) => (e) => setOrder(o => ({ ...o, [k]: e.target.value }));
  const onFile = (e) => {
    const f = e.target.files?.[0];
    setProofName(f ? f.name : null);
  };

  return (
    <section id="shipping" style={{ padding: "100px 24px", background: `linear-gradient(180deg, ${P.parchment} 0%, ${P.beige} 100%)` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="Order + ship"
          title={<>Show proof of order. Ship to <em style={{ color: P.moss }}>123 Main Street.</em></>}
          body="You buy the garment in your name from the retailer. We never handle your payment. Upload your order confirmation so we know what to expect, then drop the piece in the mail when it arrives."
        />

        <div style={{
          marginTop: 36,
          display: "grid",
          gridTemplateColumns: "minmax(0,1.05fr) minmax(0,0.95fr)",
          gap: 24,
        }} className="tlc-ship-grid">
          {/* Proof of order form */}
          <div style={{
            background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
            borderRadius: 24, padding: 22,
          }}>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 22, color: P.ink, fontWeight: 600, marginBottom: 12 }}>
              Step 1 · Proof of order
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <Field label="Retailer" placeholder="Everlane" value={order.retailer} onChange={update("retailer")}/>
              <Field label="Order number" placeholder="EV-1029384" value={order.orderId} onChange={update("orderId")}/>
              <Field label="Tracking number" placeholder="1Z…" value={order.tracking} onChange={update("tracking")}/>
              <div>
                <label style={{ fontSize: 11, color: P.warmGray, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase" }}>
                  Upload order confirmation
                </label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{
                    marginTop: 6, width: "100%",
                    background: P.parchment, border: `1px dashed rgba(45,55,42,0.2)`,
                    borderRadius: 12, padding: "16px 14px",
                    display: "flex", alignItems: "center", gap: 10,
                    color: P.inkSoft, fontWeight: 700, cursor: "pointer", fontSize: 14,
                  }}
                >
                  <IconUpload size={20}/>
                  {proofName ? proofName : "Click to attach a screenshot or PDF"}
                </button>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onFile} style={{ display: "none" }}/>
                <div style={{ marginTop: 6, fontSize: 12, color: P.warmGray }}>
                  Demo only — your file stays on this page and is not uploaded.
                </div>
              </div>
            </div>
          </div>

          {/* Shipping label */}
          <div style={{
            background: `linear-gradient(135deg, ${P.cream}, ${P.oat})`,
            border: `1px solid rgba(45,55,42,0.10)`,
            borderRadius: 24, padding: 22,
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 22, color: P.ink, fontWeight: 600 }}>
              Step 2 · Ship to The Tailored Company
            </div>
            <div style={{
              background: P.cream, borderRadius: 16, padding: 18,
              border: `1px dashed rgba(45,55,42,0.2)`,
            }}>
              <div style={{ fontSize: 10, color: P.warmGray, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase" }}>Ship to</div>
              <div style={{ fontFamily: FONT_SERIF, fontSize: 22, color: P.ink, fontWeight: 600, marginTop: 4 }}>
                The Tailored Company
              </div>
              <div style={{ fontSize: 14, color: P.inkSoft, marginTop: 4 }}>
                123 Main Street<br/>
                Attn: Tailoring intake<br/>
                (temporary intake address — full label provided after checkout)
              </div>
            </div>
            <ol style={{ paddingLeft: 18, margin: 0, color: P.inkSoft, fontSize: 14, lineHeight: 1.6 }}>
              <li>Order arrives at your door from the retailer.</li>
              <li>Drop it in the prepaid mailer we email you.</li>
              <li>We alter it (typically 5–7 business days).</li>
              <li>We ship the finished piece back to you.</li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, placeholder, value, onChange }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 11, color: P.warmGray, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase" }}>
        {label}
      </div>
      <input
        type="text" placeholder={placeholder} value={value} onChange={onChange}
        style={{
          marginTop: 6, width: "100%",
          background: P.parchment, border: `1px solid rgba(45,55,42,0.12)`,
          borderRadius: 12, padding: "12px 14px",
          fontFamily: FONT_SANS, fontSize: 14, color: P.ink, outline: "none",
        }}
      />
    </label>
  );
}

// ─── Section: Sustainability + tailor trust ──────────────
function TrustSection() {
  const items = [
    { title: "A human tailor reviews every brief", body: "AI drafts the alteration spec from your drags. A tailor checks fabric, seam allowance, and feasibility before scissors touch the cloth." },
    { title: "Buy once, wear longer", body: "Tailored garments fit better, get worn more, and get returned less. Less waste, fewer landfill miles." },
    { title: "Your measurements stay yours", body: "We don’t sell your fit profile. We use it once to do your alterations." },
  ];
  return (
    <section style={{ padding: "100px 24px", background: P.parchment }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="Why tailoring (still) matters"
          title={<>Made for <em style={{ color: P.moss }}>your</em> body. Not the average.</>}
        />
        <div style={{
          marginTop: 36,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}>
          {items.map(({ title, body }) => (
            <article key={title} style={{
              background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
              borderRadius: 20, padding: 22,
            }}>
              <h3 style={{ fontFamily: FONT_SERIF, fontSize: 22, color: P.ink, fontWeight: 600, lineHeight: 1.15, margin: 0 }}>{title}</h3>
              <p style={{ marginTop: 8, fontSize: 14, color: P.inkSoft, lineHeight: 1.6 }}>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section: FAQ ────────────────────────────────────────
function FAQ() {
  const faqs = [
    {
      q: "Do I have to download an app?",
      a: "No. Everything is right here on the website. We may release a companion app later for repeat customers, but it’s never required.",
    },
    {
      q: "How does the body preview work?",
      a: "We render an estimated try-on preview using the garment’s size chart and a measurement-based avatar. It’s a visual guide, not a perfect cloth simulation — your tailor reviews everything before any cutting.",
    },
    {
      q: "Why do I have to buy the garment myself?",
      a: "We don’t resell. You order in your name from the retailer (so returns and warranties stay with you), then ship the piece to us for alterations.",
    },
    {
      q: "Where do I ship the garment?",
      a: "To The Tailored Company at 123 Main Street, our temporary intake address. We’ll include a prepaid label and detailed instructions with your order.",
    },
    {
      q: "What can the drag-to-alter tool actually change?",
      a: "Hem / inseam length, waist take-in or let-out, and sleeve length today. We’re adding shoulder, taper, and rise next.",
    },
    {
      q: "What if my alteration isn’t feasible on this fabric?",
      a: "A tailor reviews the brief and flags anything risky — like recutting a fully lined garment or shortening a finished cuff — before work begins. You confirm before any cuts.",
    },
  ];
  return (
    <section id="faq" style={{ padding: "100px 24px", background: `linear-gradient(180deg, ${P.beige} 0%, ${P.parchment} 100%)` }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <SectionHeader eyebrow="FAQ" title={<>Common <em style={{ color: P.moss }}>questions.</em></>}/>
        <div style={{ marginTop: 28, display: "grid", gap: 12 }}>
          {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a}/>)}
        </div>
      </div>
    </section>
  );
}
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
      borderRadius: 16, overflow: "hidden",
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", textAlign: "left",
        background: "transparent", border: "none", padding: "16px 18px",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        fontFamily: FONT_SANS,
      }}>
        <span style={{ fontFamily: FONT_SERIF, fontSize: 19, color: P.ink, fontWeight: 600 }}>{q}</span>
        <span style={{ color: P.forestDeep, fontWeight: 800, fontSize: 18 }}>{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 18px 18px", color: P.inkSoft, fontSize: 14, lineHeight: 1.6 }}>{a}</div>
      )}
    </div>
  );
}

// ─── Section: Footer ─────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      background: P.cocoa, color: P.oat, padding: "48px 24px",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 22, fontWeight: 600, color: P.cream }}>The Tailored Company</div>
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
            Online tailoring for clothing you bought anywhere. A website tool — not an app.
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase", opacity: 0.7 }}>Intake address</div>
          <div style={{ marginTop: 6, fontSize: 14 }}>
            123 Main Street<br/>
            Attn: Tailoring intake
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase", opacity: 0.7 }}>Site</div>
          <div style={{ marginTop: 6, display: "grid", gap: 4, fontSize: 14 }}>
            <a href="#tool" style={{ color: P.oat, textDecoration: "none" }}>Try the tool</a>
            <a href="#how" style={{ color: P.oat, textDecoration: "none" }}>How it works</a>
            <a href="#shipping" style={{ color: P.oat, textDecoration: "none" }}>Shipping</a>
            <a href="#faq" style={{ color: P.oat, textDecoration: "none" }}>FAQ</a>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase", opacity: 0.7 }}>A note</div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
            Member app coming later. For now, the website is the whole product.
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Responsive helper styles ────────────────────────────
function ResponsiveStyles() {
  return (
    <style>{`
      @media (max-width: 900px) {
        .tlc-hero-grid, .tlc-tool-grid, .tlc-ship-grid {
          grid-template-columns: 1fr !important;
        }
        .tlc-nav-links a:not(:last-child) { display: none !important; }
      }
    `}</style>
  );
}

// ─── Page ────────────────────────────────────────────────
export default function Landing() {
  return (
    <div style={{
      background: P.parchment, minHeight: "100vh",
      color: P.ink, fontFamily: FONT_SANS,
    }}>
      <ResponsiveStyles/>
      <SiteNav/>
      <Hero/>
      <ToolSection/>
      <HowItWorks/>
      <ShippingSection/>
      <TrustSection/>
      <FAQ/>
      <Footer/>
    </div>
  );
}
