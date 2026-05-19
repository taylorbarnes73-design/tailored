import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Scroll to a section by id without changing the URL hash. The app uses
// wouter's hash router — `<a href="#tool">` would set location to /tool and
// hit NotFound. We intercept clicks and scroll programmatically instead.
function scrollToId(id) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (el && typeof el.scrollIntoView === "function") {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
function handleAnchorClick(id) {
  return (e) => {
    e.preventDefault();
    scrollToId(id);
  };
}

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

// ─── Utilities ────────────────────────────────────────────
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function round1(v) { return Math.round(v * 10) / 10; }
function cmToIn(cm) { return cm / 2.54; }
function inToCm(inch) { return inch * 2.54; }

// Default body measurements in inches (a credible average to start)
const DEFAULT_MEASUREMENTS = {
  height: 66,     // ~167.6 cm
  chest: 36,      // bust/chest girth
  waist: 29,
  hip: 38,
  shoulder: 15.5,
  inseam: 30,
  sleeve: 24,
  neck: 14,
};

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
const IconCamera = ({ size }) => (<Ico size={size}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></Ico>);
const IconRotate = ({ size }) => (<Ico size={size}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></Ico>);
const IconRuler = ({ size }) => (<Ico size={size}><path d="M2 16 16 2l6 6L8 22Z"/><path d="M7 17l-3-3"/><path d="M11 13l-2-2"/><path d="M15 9l-3-3"/><path d="M19 5l-2-2"/></Ico>);
const IconLock = ({ size }) => (<Ico size={size}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Ico>);

// ─── Section: Nav ─────────────────────────────────────────
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
        <a href="#top" onClick={handleAnchorClick("top")} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 22 }} className="tlc-nav-links">
          {[
            ["Try the tool", "tool"],
            ["Get measurements", "measure"],
            ["How it works", "how"],
            ["Shipping", "shipping"],
            ["FAQ", "faq"],
          ].map(([label, id]) => (
            <a key={label} href={`#${id}`} onClick={handleAnchorClick(id)} style={{
              color: P.inkSoft, fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}>{label}</a>
          ))}
          <a href="#tool" onClick={handleAnchorClick("tool")} style={{
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

// ─── Hero ─────────────────────────────────────────────────
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
            A website tool · not a shop, not an app
          </div>
          <h1 style={{
            fontFamily: FONT_SERIF, fontSize: "clamp(44px, 5.6vw, 78px)",
            lineHeight: 1.02, letterSpacing: -1.6, color: P.ink, fontWeight: 500, margin: 0,
          }}>
            Paste a link.
            <br/>
            <span style={{ color: P.moss, fontStyle: "italic" }}>We tailor it to fit.</span>
          </h1>
          <p style={{
            marginTop: 22, fontSize: 18, lineHeight: 1.55, color: P.inkSoft, maxWidth: 560,
          }}>
            Five steps, one page. <strong>Paste</strong> a product link → we <strong>get the fit info</strong>{" "}
            → you <strong>get your measurements</strong> with two photos → you <strong>drag the alterations</strong>{" "}
            you want → <strong>go</strong>: ship the piece to us. We don’t sell clothes.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
            <a href="#tool" onClick={handleAnchorClick("tool")} style={{
              background: `linear-gradient(135deg, ${P.forest}, ${P.forestDeep})`,
              color: P.cream, padding: "16px 26px", borderRadius: 14,
              fontSize: 15, fontWeight: 700, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 10,
              boxShadow: "0 16px 34px rgba(107,142,90,0.32)",
            }}>
              Paste a product link <IconArrow/>
            </a>
            <a href="#measure" onClick={handleAnchorClick("measure")} style={{
              background: "rgba(242,243,238,0.7)", color: P.ink,
              padding: "16px 24px", borderRadius: 14,
              fontSize: 15, fontWeight: 700, textDecoration: "none",
              border: `1px solid rgba(45,55,42,0.14)`,
              display: "inline-flex", alignItems: "center", gap: 10,
            }}><IconCamera size={16}/> Get your measurements</a>
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
        <BodyAvatar
          measurements={DEFAULT_MEASUREMENTS}
          alterations={{ hemDelta: 0, waistDelta: 0, sleeveDelta: 0 }}
          view="front"
          showGarment
          showCallouts={false}
          compact
        />
      </div>
    </div>
  );
}

// ─── Body Avatar (BMI Visualizer / 3DHBGen-inspired) ──────
// Renders a full-body, neutral-pose silhouette whose proportions deform
// from measurement state. Front / 3-4 / Side views simulate orbit.
// Optionally overlays garment + drag-to-alter handles + measurement
// callouts. Pure SVG — no WebGL, no MediaPipe, no external deps.
function BodyAvatar({
  measurements = DEFAULT_MEASUREMENTS,
  alterations = { hemDelta: 0, waistDelta: 0, sleeveDelta: 0 },
  setAlterations,
  view = "front",
  showGarment = false,
  showCallouts = false,
  showHandles = false,
  garmentType = "pants",
  compact = false,
}) {
  const draggingRef = useRef(null);
  const PX_PER_IN = 14;
  const a = alterations;

  // Convert measurements → silhouette geometry on a 500×760 viewBox.
  // Height drives vertical scale; chest/waist/hip drive horizontal radii.
  // We keep proportions credible: head + neck pinned at top; legs span
  // from hip to ankle; arms drop from shoulder to wrist.
  const m = measurements;
  const totalHeight = clamp(m.height, 54, 80); // inches
  // Map height to viewBox top/bottom of figure (head crown to ankle).
  const figureTop = 60;
  const figureBottom = 730;
  const figurePx = figureBottom - figureTop;
  // Anatomical fractions (rough, neutral pose) of total figure height
  const headFrac = 0.13;
  const neckFrac = 0.04;
  const torsoFrac = 0.30;       // shoulder line → waist
  const hipFrac = 0.10;          // waist → hip
  const legFrac = 0.43;          // hip → ankle
  // Y positions
  const headY = figureTop + figurePx * headFrac * 0.5;       // head center
  const headBottom = figureTop + figurePx * headFrac;
  const shoulderY = headBottom + figurePx * neckFrac;
  const waistY = shoulderY + figurePx * torsoFrac;
  const hipY = waistY + figurePx * hipFrac;
  const ankleY = figureBottom;
  const cx = 250; // center x

  // Horizontal half-widths derived from girth (girth ≈ π × width)
  // so widthPx = girthIn × PX_PER_IN / π for an oval-ish profile.
  const halfChest = clamp((m.chest * PX_PER_IN) / Math.PI / 2, 36, 110);
  const halfWaist = clamp((m.waist * PX_PER_IN) / Math.PI / 2, 28, 100);
  const halfHip = clamp((m.hip * PX_PER_IN) / Math.PI / 2, 36, 115);
  const halfShoulder = clamp((m.shoulder * PX_PER_IN) / 2, 50, 120);
  const halfNeck = clamp((m.neck * PX_PER_IN) / Math.PI / 2, 16, 30);
  const headRx = clamp(halfNeck * 1.7, 32, 56);
  const headRy = headRx * 1.18;

  // View transform: 3/4 squashes x by 0.85, side by 0.55 (silhouette
  // narrows as we rotate). Side view uses depth-based widths instead of
  // chest/hip widths, but we keep things simple and approximate here.
  const xScale = view === "side" ? 0.55 : view === "three-quarter" ? 0.85 : 1;
  const sx = (offset) => cx + offset * xScale;

  // Garment positions (all in same coords as avatar)
  const sleeveBaseY = waistY - figurePx * 0.05;          // upper sleeve
  const sleeveY = sleeveBaseY + a.sleeveDelta * PX_PER_IN;
  const hemBaseY = ankleY - 30;
  const hemY = hemBaseY + a.hemDelta * PX_PER_IN;
  const waistInset = (-a.waistDelta) * (PX_PER_IN / 2); // negative delta = take in

  // Drag handlers
  const startDrag = (handle) => (e) => {
    if (!setAlterations) return;
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
      if (d.handle === "hem") next.hemDelta = clamp(round1(dy / PX_PER_IN), -4, 4);
      else if (d.handle === "waist") next.waistDelta = clamp(round1(-Math.abs(dx) / PX_PER_IN * Math.sign(dx)), -3, 3);
      else if (d.handle === "sleeve") next.sleeveDelta = clamp(round1(dy / PX_PER_IN), -3, 3);
      setAlterations(next);
    };
    const up = () => {
      draggingRef.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // Body silhouette path — front view, smooth taper through chest/waist/hip
  const bodyPath = `
    M ${sx(-halfShoulder)} ${shoulderY}
    C ${sx(-halfShoulder)} ${shoulderY + 30}, ${sx(-halfChest * 1.05)} ${(shoulderY + waistY) / 2}, ${sx(-halfWaist)} ${waistY}
    C ${sx(-halfWaist - 4)} ${waistY + 18}, ${sx(-halfHip)} ${hipY - 18}, ${sx(-halfHip)} ${hipY}
    L ${sx(-halfHip * 0.42)} ${ankleY}
    L ${sx(-halfHip * 0.06)} ${ankleY}
    L ${sx(-halfHip * 0.04)} ${(hipY + ankleY) / 2}
    L ${sx(halfHip * 0.04)} ${(hipY + ankleY) / 2}
    L ${sx(halfHip * 0.06)} ${ankleY}
    L ${sx(halfHip * 0.42)} ${ankleY}
    L ${sx(halfHip)} ${hipY}
    C ${sx(halfHip)} ${hipY - 18}, ${sx(halfWaist + 4)} ${waistY + 18}, ${sx(halfWaist)} ${waistY}
    C ${sx(halfChest * 1.05)} ${(shoulderY + waistY) / 2}, ${sx(halfShoulder)} ${shoulderY + 30}, ${sx(halfShoulder)} ${shoulderY}
    Z
  `;
  // Arms — drop from shoulder to wrist (~waistY + 60)
  const armLeftPath = `
    M ${sx(-halfShoulder)} ${shoulderY}
    C ${sx(-halfShoulder - 16)} ${shoulderY + 60}, ${sx(-halfShoulder - 22)} ${waistY}, ${sx(-halfShoulder - 18)} ${waistY + 60}
    L ${sx(-halfShoulder + 4)} ${waistY + 60}
    C ${sx(-halfShoulder + 6)} ${waistY}, ${sx(-halfShoulder + 6)} ${shoulderY + 60}, ${sx(-halfShoulder + 6)} ${shoulderY + 4}
    Z
  `;
  const armRightPath = `
    M ${sx(halfShoulder)} ${shoulderY}
    C ${sx(halfShoulder + 16)} ${shoulderY + 60}, ${sx(halfShoulder + 22)} ${waistY}, ${sx(halfShoulder + 18)} ${waistY + 60}
    L ${sx(halfShoulder - 4)} ${waistY + 60}
    C ${sx(halfShoulder - 6)} ${waistY}, ${sx(halfShoulder - 6)} ${shoulderY + 60}, ${sx(halfShoulder - 6)} ${shoulderY + 4}
    Z
  `;

  // Garment paths (shirt + pants), driven by waist delta and sleeve/hem
  const shirtPath = `
    M ${sx(-halfShoulder + 4)} ${shoulderY + 6}
    L ${sx(-halfShoulder - 8)} ${sleeveY}
    L ${sx(-halfShoulder - 22)} ${sleeveY + 12}
    L ${sx(-halfShoulder + 4)} ${sleeveY + 24}
    L ${sx(-halfWaist - 6)} ${waistY + 12}
    L ${sx(halfWaist + 6)} ${waistY + 12}
    L ${sx(halfShoulder - 4)} ${sleeveY + 24}
    L ${sx(halfShoulder + 22)} ${sleeveY + 12}
    L ${sx(halfShoulder + 8)} ${sleeveY}
    L ${sx(halfShoulder - 4)} ${shoulderY + 6}
    C ${sx(halfShoulder - 24)} ${shoulderY + 4}, ${sx(halfShoulder - 40)} ${shoulderY + 16}, ${sx(0)} ${shoulderY + 16}
    C ${sx(-halfShoulder + 40)} ${shoulderY + 16}, ${sx(-halfShoulder + 24)} ${shoulderY + 4}, ${sx(-halfShoulder + 4)} ${shoulderY + 6}
    Z
  `;
  // Pants
  const pantsLeftPath = `
    M ${sx(-halfHip + waistInset)} ${hipY}
    L ${sx(-halfHip * 0.42)} ${hemY}
    L ${sx(-halfHip * 0.04)} ${hemY}
    L ${sx(-halfHip * 0.04)} ${hipY}
    Z
  `;
  const pantsRightPath = `
    M ${sx(halfHip * 0.04)} ${hipY}
    L ${sx(halfHip * 0.04)} ${hemY}
    L ${sx(halfHip * 0.42)} ${hemY}
    L ${sx(halfHip - waistInset)} ${hipY}
    Z
  `;
  const waistbandPath = `
    M ${sx(-halfHip + waistInset)} ${hipY - 12}
    L ${sx(halfHip - waistInset)} ${hipY - 12}
    L ${sx(halfHip - waistInset)} ${hipY + 4}
    L ${sx(-halfHip + waistInset)} ${hipY + 4}
    Z
  `;

  return (
    <div style={{
      position: "relative", width: "100%",
      aspectRatio: compact ? "5/6" : "4/6",
      background: `linear-gradient(180deg, ${P.cream} 0%, ${P.beige} 100%)`,
      borderRadius: 20,
      border: `1px solid rgba(45,55,42,0.10)`,
      overflow: "hidden",
      touchAction: showHandles ? "none" : "auto",
    }}>
      <svg viewBox="0 0 500 760" width="100%" height="100%"
        preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        <defs>
          <pattern id="grid-av" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M 22 0 L 0 0 0 22" fill="none" stroke={P.warmGray} strokeOpacity="0.14" strokeWidth="0.5"/>
          </pattern>
          <linearGradient id="bodyFillAv" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E8DCC6"/>
            <stop offset="55%" stopColor="#D6C5A8"/>
            <stop offset="100%" stopColor="#B5A589"/>
          </linearGradient>
          <linearGradient id="garmentFillAv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={P.forest}/>
            <stop offset="100%" stopColor={P.forestDeep}/>
          </linearGradient>
          <linearGradient id="shirtFillAv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={P.oat}/>
            <stop offset="100%" stopColor={P.taupe}/>
          </linearGradient>
        </defs>
        <rect width="500" height="760" fill="url(#grid-av)"/>

        {/* head */}
        <ellipse cx={cx} cy={headY} rx={headRx * xScale} ry={headRy} fill="url(#bodyFillAv)"/>
        {/* neck */}
        <rect x={cx - halfNeck * xScale} y={headBottom - 2} width={halfNeck * 2 * xScale} height={shoulderY - headBottom + 4} fill="url(#bodyFillAv)"/>
        {/* arms first (so torso overlaps) */}
        <path d={armLeftPath} fill="url(#bodyFillAv)" stroke="rgba(45,55,42,0.10)" strokeWidth="1"/>
        <path d={armRightPath} fill="url(#bodyFillAv)" stroke="rgba(45,55,42,0.10)" strokeWidth="1"/>
        {/* torso + legs */}
        <path d={bodyPath} fill="url(#bodyFillAv)" stroke="rgba(45,55,42,0.12)" strokeWidth="1"/>

        {/* garment overlay */}
        {showGarment && (
          <g>
            <path d={shirtPath} fill="url(#shirtFillAv)" stroke="rgba(45,55,42,0.18)" strokeWidth="1"/>
            {garmentType === "pants" && (
              <g>
                <path d={waistbandPath} fill="url(#garmentFillAv)" stroke="rgba(45,55,42,0.25)" strokeWidth="1"/>
                <path d={pantsLeftPath} fill="url(#garmentFillAv)" stroke="rgba(45,55,42,0.2)" strokeWidth="1"/>
                <path d={pantsRightPath} fill="url(#garmentFillAv)" stroke="rgba(45,55,42,0.2)" strokeWidth="1"/>
                {Math.abs(a.hemDelta) > 0.05 && (
                  <line x1={sx(-halfHip * 0.42)} y1={hemBaseY} x2={sx(halfHip * 0.42)} y2={hemBaseY}
                    stroke={P.warmGray} strokeDasharray="5 5" strokeWidth="1.5" opacity="0.6"/>
                )}
              </g>
            )}
          </g>
        )}

        {/* measurement callouts (3DHBGen-inspired curves + labels) */}
        {showCallouts && (
          <g>
            <Callout y={shoulderY - 14} x1={sx(-halfShoulder) - 14} x2={sx(halfShoulder) + 14}
              label={`Shoulder ${m.shoulder.toFixed(1)}"`} side="top"/>
            <Callout y={(shoulderY + waistY) / 2} x1={sx(-halfChest) - 14} x2={sx(halfChest) + 14}
              label={`Chest ${m.chest.toFixed(1)}"`} side="top"/>
            <Callout y={waistY} x1={sx(-halfWaist) - 14} x2={sx(halfWaist) + 14}
              label={`Waist ${m.waist.toFixed(1)}"`} side="bottom"/>
            <Callout y={hipY + 6} x1={sx(-halfHip) - 14} x2={sx(halfHip) + 14}
              label={`Hip ${m.hip.toFixed(1)}"`} side="bottom"/>
            {/* inseam vertical */}
            <line x1={sx(halfHip * 0.04) + 22} y1={hipY} x2={sx(halfHip * 0.04) + 22} y2={ankleY}
              stroke={P.forestDeep} strokeWidth="1.4" strokeDasharray="3 3"/>
            <text x={sx(halfHip * 0.04) + 28} y={(hipY + ankleY) / 2} fontSize="11" fontWeight="800"
              fill={P.forestDeep} style={{ fontFamily: FONT_SANS }}>
              Inseam {m.inseam.toFixed(1)}"
            </text>
            {/* total height */}
            <line x1={28} y1={figureTop} x2={28} y2={figureBottom}
              stroke={P.forestDeep} strokeWidth="1.4"/>
            <line x1={22} y1={figureTop} x2={34} y2={figureTop} stroke={P.forestDeep} strokeWidth="1.4"/>
            <line x1={22} y1={figureBottom} x2={34} y2={figureBottom} stroke={P.forestDeep} strokeWidth="1.4"/>
            <text x={42} y={(figureTop + figureBottom) / 2} fontSize="11" fontWeight="800"
              fill={P.forestDeep} style={{ fontFamily: FONT_SANS }}>
              Height {Math.floor(m.height / 12)}'{Math.round(m.height % 12)}"
            </text>
          </g>
        )}

        {/* drag handles */}
        {showHandles && (
          <g>
            {/* HEM handle */}
            <g onPointerDown={startDrag("hem")} style={{ cursor: "ns-resize" }}
              role="slider" aria-label="Drag to shorten or lengthen the hem" tabIndex={0}>
              <line x1={sx(-halfHip * 0.42)} y1={hemY} x2={sx(halfHip * 0.42)} y2={hemY}
                stroke={P.cream} strokeWidth="2" opacity="0.85"/>
              <circle cx={cx} cy={hemY} r="22" fill="rgba(0,0,0,0.001)"/>
              <circle cx={cx} cy={hemY} r="14" fill={P.cream} stroke={P.forest} strokeWidth="2.5"/>
              <line x1={cx - 6} y1={hemY - 4} x2={cx - 6} y2={hemY + 4} stroke={P.forest} strokeWidth="2"/>
              <line x1={cx + 6} y1={hemY - 4} x2={cx + 6} y2={hemY + 4} stroke={P.forest} strokeWidth="2"/>
              <text x={cx + 22} y={hemY + 4} fontSize="13" fill={P.ink} fontWeight="700"
                style={{ fontFamily: FONT_SANS }}>Hem · drag ↕</text>
            </g>
            {/* WAIST handles */}
            <g onPointerDown={startDrag("waist")} style={{ cursor: "ew-resize" }}
              role="slider" aria-label="Drag to take in or let out the waist" tabIndex={0}>
              <circle cx={sx(-halfHip + waistInset) - 6} cy={hipY - 4} r="22" fill="rgba(0,0,0,0.001)"/>
              <circle cx={sx(-halfHip + waistInset) - 6} cy={hipY - 4} r="14" fill={P.cream} stroke={P.forest} strokeWidth="2.5"/>
              <circle cx={sx(halfHip - waistInset) + 6} cy={hipY - 4} r="22" fill="rgba(0,0,0,0.001)"/>
              <circle cx={sx(halfHip - waistInset) + 6} cy={hipY - 4} r="14" fill={P.cream} stroke={P.forest} strokeWidth="2.5"/>
              <text x={sx(halfHip) + 28} y={hipY - 2} fontSize="13" fill={P.ink} fontWeight="700"
                style={{ fontFamily: FONT_SANS }}>Waist · drag ↔</text>
            </g>
            {/* SLEEVE handle */}
            <g onPointerDown={startDrag("sleeve")} style={{ cursor: "ns-resize" }}
              role="slider" aria-label="Drag to shorten or lengthen the sleeve" tabIndex={0}>
              <circle cx={sx(-halfShoulder - 18)} cy={sleeveY + 12} r="22" fill="rgba(0,0,0,0.001)"/>
              <circle cx={sx(-halfShoulder - 18)} cy={sleeveY + 12} r="14"
                fill={P.cream} stroke={P.forest} strokeWidth="2.5"/>
              <line x1={sx(-halfShoulder - 18) - 6} y1={sleeveY + 8} x2={sx(-halfShoulder - 18) - 6} y2={sleeveY + 16} stroke={P.forest} strokeWidth="2"/>
              <line x1={sx(-halfShoulder - 18) + 6} y1={sleeveY + 8} x2={sx(-halfShoulder - 18) + 6} y2={sleeveY + 16} stroke={P.forest} strokeWidth="2"/>
              <text x={14} y={sleeveY + 4} fontSize="13" fill={P.ink} fontWeight="700"
                style={{ fontFamily: FONT_SANS }}>Sleeve · drag ↕</text>
            </g>
          </g>
        )}

        {/* status badge */}
        <g>
          <rect x="20" y="20" width="220" height="28" rx="14"
            fill="rgba(242,243,238,0.92)" stroke="rgba(107,142,90,0.32)"/>
          <circle cx="36" cy="34" r="4" fill={P.forest}/>
          <text x="48" y="38" fontSize="10" fontWeight="800"
            fill={P.forestDeep} style={{ fontFamily: FONT_SANS, letterSpacing: 1.6 }}>
            ESTIMATED · {view.toUpperCase()} VIEW
          </text>
        </g>
      </svg>
    </div>
  );
}

function Callout({ y, x1, x2, label, side = "top" }) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={P.forestDeep} strokeWidth="1.4" strokeDasharray="3 3"/>
      <line x1={x1} y1={y - 4} x2={x1} y2={y + 4} stroke={P.forestDeep} strokeWidth="1.4"/>
      <line x1={x2} y1={y - 4} x2={x2} y2={y + 4} stroke={P.forestDeep} strokeWidth="1.4"/>
      <text x={x2 + 6} y={side === "top" ? y - 4 : y + 12}
        fontSize="11" fontWeight="800" fill={P.forestDeep}
        style={{ fontFamily: FONT_SANS }}>{label}</text>
    </g>
  );
}

// ─── Linear flow strip ────────────────────────────────────
function FlowStrip() {
  const steps = [
    { k: "1", t: "Paste link" },
    { k: "2", t: "Get info" },
    { k: "3", t: "Measure" },
    { k: "4", t: "Alter" },
    { k: "5", t: "Go" },
  ];
  return (
    <div style={{
      marginTop: 22, display: "inline-flex", alignItems: "center", gap: 10,
      flexWrap: "wrap",
      background: "rgba(242,243,238,0.7)",
      border: `1px solid rgba(45,55,42,0.10)`,
      padding: "10px 14px", borderRadius: 999,
    }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.k}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            color: P.ink, fontSize: 12, fontWeight: 800,
            letterSpacing: 1.2, textTransform: "uppercase",
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: 999,
              background: P.forest, color: P.cream,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800,
            }}>{s.k}</span>
            {s.t}
          </span>
          {i < steps.length - 1 && (
            <span style={{ color: P.warmGray, fontSize: 14, fontWeight: 800 }}>→</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Tool: paste a link, extract specs ────────────────────
function ToolSection({ product, setProduct, state, setState, url, setUrl }) {
  const examples = [
    { host: "everlane.com" },
    { host: "thereformation.com" },
    { host: "cos.com" },
    { host: "madewell.com" },
  ];

  const extract = (linkOverride) => {
    const link = linkOverride ?? url;
    if (!link) return;
    setUrl(link);
    setState("extracting");
    setProduct(null);
    setTimeout(() => {
      const host = safeHost(link);
      setProduct(buildProductForHost(host));
      setState("extracted");
    }, 1100);
  };

  return (
    <section id="tool" style={{
      padding: "100px 24px",
      background: `linear-gradient(180deg, ${P.beige} 0%, ${P.parchment} 100%)`,
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="Step 1 + 2 · Paste, get info"
          title={<>Paste → Get info → Measure → Alter → <em style={{ color: P.moss }}>Go.</em></>}
          body="The whole tool, on one page. Paste a URL, we pull the fit info from the listing, you get measured with two photos, drag the alterations you want, and submit."
        />
        <FlowStrip/>

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
              Example link
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
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >https://{ex.host}/…</button>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: P.warmGray }}>
            Demo mode — paste any product URL, or click an example to load a sample extraction.
            Specs are illustrative while we expand retailer coverage.
          </div>
        </div>

        {state === "extracted" && product && (
          <div style={{
            marginTop: 28,
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
            gap: 24,
          }} className="tlc-tool-grid">
            <ProductCard product={product}/>
            <SpecCard product={product}/>
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCard({ product }) {
  return (
    <div style={{
      background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
      borderRadius: 24, padding: 22,
      boxShadow: "0 24px 60px rgba(45,55,42,0.06)",
    }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.8, color: P.warmGray, textTransform: "uppercase" }}>
        From {product.retailer}
      </div>
      <div style={{ fontFamily: FONT_SERIF, fontSize: 26, fontWeight: 600, color: P.ink, lineHeight: 1.1, marginTop: 4 }}>
        {product.name}
      </div>
      <div style={{ marginTop: 10, fontSize: 13, color: P.inkSoft }}>
        <strong>Category:</strong> {product.category}
      </div>
      <div style={{ marginTop: 6, fontSize: 13, color: P.inkSoft }}>
        <strong>Fabric:</strong> {product.fabric}
      </div>
      <div style={{ marginTop: 6, fontSize: 13, color: P.inkSoft, fontStyle: "italic" }}>
        {product.notes}
      </div>
      <a href="#measure" onClick={handleAnchorClick("measure")} style={{
        marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8,
        background: P.ink, color: P.cream,
        padding: "10px 16px", borderRadius: 999,
        textDecoration: "none", fontWeight: 800, fontSize: 13,
      }}>Next · Get your measurements <IconArrow size={14}/></a>
    </div>
  );
}

function SpecCard({ product }) {
  return (
    <div style={{
      background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
      borderRadius: 24, padding: 22,
      boxShadow: "0 24px 60px rgba(45,55,42,0.06)",
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, color: P.warmGray, textTransform: "uppercase", marginBottom: 10 }}>
        Extracted size chart · {product.sizeRec}
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
    </div>
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
function buildProductForHost(host) {
  return {
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
    // Numeric specs used by the sizing engine
    sizes: [
      { label: "US 0", waist: 24.5, hip: 34.5, inseam: 31, shoulder: 14.0, chest: 33 },
      { label: "US 2", waist: 25.5, hip: 35.5, inseam: 31, shoulder: 14.4, chest: 34 },
      { label: "US 4", waist: 26.5, hip: 36.5, inseam: 31, shoulder: 14.8, chest: 35 },
      { label: "US 6", waist: 27.5, hip: 37.5, inseam: 31, shoulder: 15.2, chest: 36 },
      { label: "US 8", waist: 28.5, hip: 38.5, inseam: 31, shoulder: 15.6, chest: 37 },
      { label: "US 10", waist: 29.5, hip: 39.5, inseam: 31, shoulder: 16.0, chest: 38 },
      { label: "US 12", waist: 31.0, hip: 41.0, inseam: 31, shoulder: 16.4, chest: 39.5 },
      { label: "US 14", waist: 32.5, hip: 42.5, inseam: 31, shoulder: 16.8, chest: 41 },
    ],
    fabric: "Mid-weight linen · 4% stretch",
    notes: "Runs long. Many customers shorten the inseam 1–2 inches.",
  };
}

// ─── Measurements scan flow (3DLOOK / Choozr-inspired) ────
// Stepper: Prepare → Front photo → Side photo → Measurements →
// Recommendation. Self-scan / assisted toggle. Simulated capture
// with silhouette guide, alignment/confidence meter, countdown,
// confirm/retake. NO getUserMedia — purely simulated UI; produces
// estimated measurements (height-anchored) with confidence scores.
function MeasureSection({ measurements, setMeasurements, onComplete }) {
  const STEPS = ["Prepare", "Front photo", "Side photo", "Measurements", "Recommendation"];
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState("self"); // self | assisted
  const [seedHeight, setSeedHeight] = useState(measurements.height);
  const [unit, setUnit] = useState("in");

  // Capture state per shot: idle | aligning | capturing | confirming | done
  const [front, setFront] = useState({ status: "idle", confidence: 0 });
  const [side, setSide] = useState({ status: "idle", confidence: 0 });
  const [scanResult, setScanResult] = useState(null); // object of measurements + per-key confidence

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  return (
    <section id="measure" style={{ padding: "100px 24px", background: `linear-gradient(180deg, ${P.parchment} 0%, ${P.beige} 100%)` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="Step 3 · Get your measurements"
          title={<>Two photos. <em style={{ color: P.moss }}>Estimated measurements</em> in seconds.</>}
          body="An AI-guided two-photo measurement preview, inspired by 3DLOOK Mobile Tailor and Choozr. The demo simulates capture for your privacy — when we ship the production scan, your photos are used only for measurement, no account needed, deletable any time, never shared or sold."
        />

        {/* Stepper */}
        <div style={{
          marginTop: 28,
          display: "flex", flexWrap: "wrap", gap: 6,
          background: P.cream,
          border: `1px solid rgba(45,55,42,0.10)`,
          borderRadius: 999,
          padding: 6,
          width: "fit-content",
        }}>
          {STEPS.map((label, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <button key={label} onClick={() => setStep(i)} style={{
                padding: "8px 14px", borderRadius: 999, border: "none", cursor: "pointer",
                background: active ? P.forest : done ? "rgba(107,142,90,0.18)" : "transparent",
                color: active ? P.cream : done ? P.forestDeep : P.inkSoft,
                fontWeight: 800, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 999,
                  background: active ? P.cream : done ? P.forest : "rgba(45,55,42,0.10)",
                  color: active ? P.forest : done ? P.cream : P.inkSoft,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 900,
                }}>{done ? "✓" : i + 1}</span>
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 24 }}>
          {step === 0 && (
            <PrepareStep mode={mode} setMode={setMode} seedHeight={seedHeight}
              setSeedHeight={setSeedHeight} unit={unit} setUnit={setUnit} onContinue={next}/>
          )}
          {step === 1 && (
            <CaptureStep
              kind="front" capture={front} setCapture={setFront}
              mode={mode}
              onComplete={() => { setFront(c => ({ ...c, status: "done" })); next(); }}
              onBack={prev}
            />
          )}
          {step === 2 && (
            <CaptureStep
              kind="side" capture={side} setCapture={setSide}
              mode={mode}
              onComplete={() => {
                setSide(c => ({ ...c, status: "done" }));
                // Compute estimated measurements from the seed height +
                // simulated front/side confidences. Variation is a small
                // realistic deviation from the population baseline.
                const result = simulateMeasurementResult({
                  heightIn: seedHeight,
                  frontConf: front.confidence || 0.86,
                  sideConf: side.confidence || 0.84,
                });
                setScanResult(result);
                setMeasurements({ ...measurements, ...result.values, height: seedHeight });
                next();
              }}
              onBack={prev}
            />
          )}
          {step === 3 && scanResult && (
            <MeasurementResultStep
              result={scanResult} unit={unit} setUnit={setUnit}
              measurements={measurements} setMeasurements={setMeasurements}
              onContinue={() => { next(); onComplete && onComplete(); }} onBack={prev}/>
          )}
          {step === 4 && (
            <ScanCompletionStep onBack={prev}/>
          )}
        </div>
      </div>
    </section>
  );
}

function PrepareStep({ mode, setMode, seedHeight, setSeedHeight, unit, setUnit, onContinue }) {
  return (
    <div style={{
      background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
      borderRadius: 24, padding: 24,
      display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 24,
    }} className="tlc-tool-grid">
      <div>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 26, color: P.ink, fontWeight: 600, marginBottom: 12 }}>
          Before you start
        </div>
        <Checklist items={[
          ["Wear tight-fitting clothes (gym kit, leggings, fitted top).", true],
          ["Stand 6–8 feet from your phone, against a plain wall.", true],
          ["Even, indoor light. No backlight or strong shadows.", true],
          ["Phone vertical, propped at hip height. Floor visible.", true],
          ["Hair off the shoulders. Bare feet if possible.", true],
        ]}/>
        <div style={{
          marginTop: 18, padding: 14,
          borderRadius: 14, background: "rgba(107,142,90,0.10)",
          border: `1px solid rgba(107,142,90,0.28)`,
          color: P.forestDeep, fontSize: 13, lineHeight: 1.55,
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <IconLock size={18}/>
          <div>
            <strong>Privacy first.</strong> Your photos are used only to estimate
            measurements. No account is needed, you can delete anytime, and we never
            share or sell your scan. The current demo simulates capture client-side
            for safety.
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 22, color: P.ink, fontWeight: 600, marginBottom: 12 }}>
          Scan mode
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            ["self", "Self-scan", "Hands-free with a 5-second timer. Phone propped, you step into the silhouette."],
            ["assisted", "Assisted", "A friend taps the shutter. Faster alignment, slightly higher confidence."],
          ].map(([k, label, body]) => {
            const active = mode === k;
            return (
              <button key={k} onClick={() => setMode(k)} style={{
                textAlign: "left",
                background: active ? "rgba(107,142,90,0.14)" : P.parchment,
                border: `1px solid ${active ? P.forest : "rgba(45,55,42,0.12)"}`,
                borderRadius: 16, padding: 14, cursor: "pointer",
                fontFamily: FONT_SANS,
              }}>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 18, fontWeight: 600, color: P.ink }}>{label}</div>
                <div style={{ fontSize: 12, color: P.inkSoft, marginTop: 6, lineHeight: 1.5 }}>{body}</div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, color: P.warmGray, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>
            Your height — used to anchor scale
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="number"
              min={48} max={84} step={0.5}
              value={unit === "in" ? seedHeight : Math.round(inToCm(seedHeight))}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isFinite(v)) return;
                setSeedHeight(unit === "in" ? clamp(v, 48, 84) : clamp(cmToIn(v), 48, 84));
              }}
              style={{
                width: 120, background: P.parchment,
                border: `1px solid rgba(45,55,42,0.12)`,
                borderRadius: 12, padding: "10px 12px", fontFamily: FONT_SANS, fontSize: 15, color: P.ink, outline: "none",
              }}
            />
            <UnitToggle unit={unit} setUnit={setUnit}/>
            <div style={{ color: P.warmGray, fontSize: 12 }}>
              {Math.floor(seedHeight / 12)}'{Math.round(seedHeight % 12)}" / {Math.round(inToCm(seedHeight))} cm
            </div>
          </div>
        </div>

        <button onClick={onContinue} style={{
          marginTop: 22,
          background: `linear-gradient(135deg, ${P.forest}, ${P.forestDeep})`,
          color: P.cream, padding: "14px 22px",
          borderRadius: 14, border: "none",
          fontSize: 14, fontWeight: 800, cursor: "pointer",
          letterSpacing: 0.4,
          display: "inline-flex", alignItems: "center", gap: 8,
        }}>
          Continue · Front photo <IconArrow size={16}/>
        </button>
      </div>
    </div>
  );
}

function UnitToggle({ unit, setUnit }) {
  return (
    <div style={{
      display: "inline-flex", padding: 4, borderRadius: 999,
      background: P.parchment, border: `1px solid rgba(45,55,42,0.12)`,
    }}>
      {["in", "cm"].map(u => (
        <button key={u} onClick={() => setUnit(u)} style={{
          padding: "6px 12px", borderRadius: 999, border: "none", cursor: "pointer",
          background: unit === u ? P.forest : "transparent",
          color: unit === u ? P.cream : P.inkSoft,
          fontWeight: 800, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase",
        }}>{u}</button>
      ))}
    </div>
  );
}

function Checklist({ items }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
      {items.map(([text], i) => (
        <li key={i} style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "10px 12px",
          background: P.parchment,
          border: `1px solid rgba(45,55,42,0.08)`,
          borderRadius: 12,
          fontSize: 14, color: P.ink,
        }}>
          <span style={{ color: P.forest, marginTop: 1 }}><IconCheck size={16}/></span>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Capture step (front or side) ─────────────────────────
function CaptureStep({ kind, capture, setCapture, mode, onComplete, onBack }) {
  // Status: idle | aligning | capturing (countdown) | confirming | done
  const [countdown, setCountdown] = useState(null);
  const intervalRef = useRef(null);
  // Confidence rises as the user "aligns" — we simulate this by ramping
  // a value while the status is "aligning". When ≥ 0.8 the shutter unlocks.
  const conf = capture.confidence ?? 0;

  useEffect(() => {
    if (capture.status !== "aligning") return;
    const id = window.setInterval(() => {
      setCapture(c => {
        const nextConf = Math.min(1, (c.confidence || 0) + 0.04 + Math.random() * 0.03);
        return { ...c, confidence: nextConf };
      });
    }, 130);
    intervalRef.current = id;
    return () => window.clearInterval(id);
  }, [capture.status, setCapture]);

  const startAlign = () => {
    setCapture({ status: "aligning", confidence: 0.18 });
  };
  const startCapture = () => {
    setCountdown(mode === "self" ? 5 : 3);
    setCapture(c => ({ ...c, status: "capturing" }));
  };
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCapture(c => ({ ...c, status: "confirming" }));
      setCountdown(null);
      return;
    }
    const t = window.setTimeout(() => setCountdown(n => (n === null ? null : n - 1)), 850);
    return () => window.clearTimeout(t);
  }, [countdown, setCapture]);

  const confirm = () => onComplete();
  const retake = () => setCapture({ status: "aligning", confidence: 0.22 });

  const ready = conf >= 0.8;

  return (
    <div style={{
      background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
      borderRadius: 24, padding: 24,
      display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,0.95fr)", gap: 24,
    }} className="tlc-tool-grid">
      {/* Camera frame (simulated) */}
      <div style={{
        position: "relative",
        background: "#0f1410",
        borderRadius: 22,
        aspectRatio: "9/14",
        overflow: "hidden",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
      }}>
        <SimulatedCameraView kind={kind} status={capture.status} confidence={conf} countdown={countdown}/>
      </div>

      {/* Right side: instructions, alignment meter, controls */}
      <div>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 26, color: P.ink, fontWeight: 600 }}>
          {kind === "front" ? "Front photo" : "Side photo"}
        </div>
        <div style={{ marginTop: 8, color: P.inkSoft, fontSize: 14, lineHeight: 1.55 }}>
          {kind === "front"
            ? "Stand facing your phone, feet shoulder-width apart, arms 30–45° away from body, palms forward. Look straight ahead."
            : "Turn 90° to your right. Arms straight down, palms on thighs. Heels together, look straight ahead."}
        </div>

        <PostureGuide kind={kind}/>

        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11, color: P.warmGray, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 6 }}>
            Alignment confidence
          </div>
          <div style={{
            position: "relative", height: 12, borderRadius: 999,
            background: P.parchment, overflow: "hidden",
            border: `1px solid rgba(45,55,42,0.12)`,
          }}>
            <div style={{
              position: "absolute", inset: 0,
              width: `${Math.round(conf * 100)}%`,
              background: ready ? P.forest : P.taupe,
              transition: "width 80ms linear",
            }}/>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: ready ? P.forestDeep : P.warmGray, fontWeight: 700 }}>
            {ready ? `Aligned · ${Math.round(conf * 100)}% — ready to capture` : `${Math.round(conf * 100)}% — keep arms 30–45° from body, fill the silhouette`}
          </div>
        </div>

        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {capture.status === "idle" && (
            <button onClick={startAlign} style={btnPrimary}>
              <IconCamera size={16}/> Start aligning
            </button>
          )}
          {capture.status === "aligning" && (
            <>
              <button onClick={startCapture} disabled={!ready} style={{ ...btnPrimary, opacity: ready ? 1 : 0.5, cursor: ready ? "pointer" : "not-allowed" }}>
                <IconCamera size={16}/> Capture {kind} photo
              </button>
              <button onClick={() => setCapture({ status: "idle", confidence: 0 })} style={btnGhost}>Cancel</button>
            </>
          )}
          {capture.status === "capturing" && (
            <button disabled style={{ ...btnPrimary, opacity: 0.7 }}>
              Capturing in {countdown ?? 0}…
            </button>
          )}
          {capture.status === "confirming" && (
            <>
              <button onClick={confirm} style={btnPrimary}>
                <IconCheck size={16}/> Looks good · continue
              </button>
              <button onClick={retake} style={btnGhost}>
                <IconRotate size={16}/> Retake
              </button>
            </>
          )}
          <button onClick={onBack} style={btnGhost}>Back</button>
        </div>

        <div style={{ marginTop: 14, fontSize: 12, color: P.warmGray, lineHeight: 1.5 }}>
          {mode === "self"
            ? "Self-scan: 5-second timer after you confirm alignment."
            : "Assisted: a helper taps the shutter — 3-second confirm timer."}
        </div>
      </div>
    </div>
  );
}

const btnPrimary = {
  background: `linear-gradient(135deg, ${P.forest}, ${P.forestDeep})`,
  color: P.cream, padding: "12px 18px",
  borderRadius: 12, border: "none",
  fontSize: 14, fontWeight: 800, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 8,
};
const btnGhost = {
  background: "transparent", color: P.inkSoft,
  padding: "12px 16px", borderRadius: 12,
  border: `1px solid rgba(45,55,42,0.16)`,
  fontSize: 13, fontWeight: 700, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 8,
};

// Simulated camera viewfinder: dark gradient, framing brackets, silhouette
// guide overlay, scan-line during capture, confidence-tinted overlay.
function SimulatedCameraView({ kind, status, confidence, countdown }) {
  const ready = confidence >= 0.8;
  return (
    <svg viewBox="0 0 360 560" width="100%" height="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="vfBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a221b"/>
          <stop offset="100%" stopColor="#0c1110"/>
        </linearGradient>
        <linearGradient id="silFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ready ? P.forest : P.taupe} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={ready ? P.forestDeep : P.stone} stopOpacity="0.32"/>
        </linearGradient>
      </defs>
      <rect width="360" height="560" fill="url(#vfBg)"/>

      {/* corner brackets */}
      {[
        ["M 14 28 L 14 14 L 28 14"],
        ["M 332 14 L 346 14 L 346 28"],
        ["M 14 532 L 14 546 L 28 546"],
        ["M 332 546 L 346 546 L 346 532"],
      ].map((d, i) => (
        <path key={i} d={d[0]} stroke={ready ? P.sage : "#fff"} strokeOpacity="0.6" strokeWidth="2.5" fill="none"/>
      ))}

      {/* silhouette guide */}
      <g transform="translate(180,40)">
        {kind === "front" ? <FrontSilhouette fill="url(#silFill)" stroke={ready ? P.sage : "#9aa48f"}/>
          : <SideSilhouette fill="url(#silFill)" stroke={ready ? P.sage : "#9aa48f"}/>}
      </g>

      {/* scan line during capture */}
      {status === "capturing" && (
        <rect x="0" y={(((Date.now() / 12) % 520) | 0)} width="360" height="2" fill={P.sage} opacity="0.7"/>
      )}

      {/* countdown overlay */}
      {status === "capturing" && countdown !== null && (
        <g>
          <circle cx="180" cy="280" r="56" fill="rgba(0,0,0,0.45)"/>
          <text x="180" y="298" textAnchor="middle" fontSize="56" fontWeight="900" fill="#fff" style={{ fontFamily: FONT_SERIF }}>
            {countdown}
          </text>
        </g>
      )}

      {/* confirming overlay */}
      {status === "confirming" && (
        <g>
          <rect x="60" y="240" width="240" height="80" rx="14" fill="rgba(0,0,0,0.55)" stroke={P.sage}/>
          <text x="180" y="280" textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff" style={{ fontFamily: FONT_SANS }}>
            Photo captured
          </text>
          <text x="180" y="304" textAnchor="middle" fontSize="12" fill="#cdd5c4" style={{ fontFamily: FONT_SANS }}>
            Confirm or retake on the right →
          </text>
        </g>
      )}

      {/* HUD */}
      <g>
        <rect x="14" y="500" width="332" height="42" rx="10" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.08)"/>
        <text x="26" y="518" fontSize="10" fontWeight="800" fill="#cdd5c4" letterSpacing="1.6">
          {kind.toUpperCase()} CAPTURE · SIMULATED
        </text>
        <text x="26" y="534" fontSize="11" fill="#9aa48f">
          {status === "idle" && "Tap “Start aligning” →"}
          {status === "aligning" && (ready ? "Aligned — ready to capture" : "Step into the silhouette")}
          {status === "capturing" && "Hold still…"}
          {status === "confirming" && "Confirm or retake"}
          {status === "done" && "Done"}
        </text>
      </g>
    </svg>
  );
}

function FrontSilhouette({ fill, stroke }) {
  return (
    <g>
      <path d="M 0 0
               C -22 0 -38 18 -38 40
               C -38 60 -22 78 0 78
               C 22 78 38 60 38 40
               C 38 18 22 0 0 0 Z
               M -68 90 L 68 90 L 88 130 L 88 200 L 60 280 L 56 460 L 32 460 L 24 280 L 0 260 L -24 280 L -32 460 L -56 460 L -60 280 L -88 200 L -88 130 Z"
        fill={fill} stroke={stroke} strokeWidth="2"/>
    </g>
  );
}
function SideSilhouette({ fill, stroke }) {
  return (
    <g>
      <path d="M 0 0
               C -22 0 -38 18 -38 40
               C -38 60 -22 78 0 78
               C 22 78 38 60 38 40
               C 38 18 22 0 0 0 Z
               M -22 90 L 30 90 L 40 130 L 36 230 L 32 280 L 28 460 L 8 460 L 4 280 L -8 230 L -12 130 Z"
        fill={fill} stroke={stroke} strokeWidth="2"/>
    </g>
  );
}

function PostureGuide({ kind }) {
  const items = kind === "front"
    ? [
        "Feet shoulder-width apart",
        "Arms 30–45° from body, palms forward",
        "Look straight ahead, relaxed shoulders",
      ]
    : [
        "Turn 90° to your right",
        "Heels together, knees soft",
        "Arms down, palms on thighs",
      ];
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: 6 }}>
      {items.map((t, i) => (
        <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, color: P.inkSoft, fontSize: 13 }}>
          <span style={{
            width: 18, height: 18, borderRadius: 999,
            background: "rgba(107,142,90,0.16)", color: P.forestDeep,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 11,
          }}>{i + 1}</span>
          {t}
        </li>
      ))}
    </ul>
  );
}

// Build estimated measurements from a height seed + capture confidences.
// We start from credible average ratios (Drillis & Contini, plus apparel
// industry averages), perturb each by ±2% × (1 - confidence) so the
// numbers feel plausible and slightly different each run.
function simulateMeasurementResult({ heightIn, frontConf, sideConf }) {
  const ratios = {
    chest: 0.530,
    waist: 0.435,
    hip: 0.560,
    shoulder: 0.235,
    inseam: 0.455,
    sleeve: 0.345,
    neck: 0.215,
  };
  const baseConf = (frontConf + sideConf) / 2;
  const values = {};
  const conf = {};
  for (const k of Object.keys(ratios)) {
    const base = ratios[k] * heightIn;
    const noise = (Math.random() * 2 - 1) * 0.02 * (1 - baseConf) * base;
    values[k] = round1(base + noise);
    // Per-key confidence biased by which photo informs it most
    const lean = (k === "shoulder" || k === "chest" || k === "hip") ? frontConf
      : (k === "inseam" || k === "sleeve") ? sideConf : baseConf;
    conf[k] = clamp(round1(lean - 0.02 + Math.random() * 0.04), 0.6, 0.99);
  }
  return { values, confidence: conf, overallConfidence: round1(baseConf) };
}

function MeasurementResultStep({ result, unit, setUnit, measurements, setMeasurements, onContinue, onBack }) {
  const fmt = (inches) => unit === "in"
    ? `${inches.toFixed(1)}"`
    : `${Math.round(inToCm(inches))} cm`;

  const groups = [
    { title: "Length", keys: ["height", "inseam", "sleeve"] },
    { title: "Girth", keys: ["chest", "waist", "hip", "neck"] },
    { title: "Width", keys: ["shoulder"] },
  ];
  const labels = {
    height: "Height", chest: "Chest / bust", waist: "Waist", hip: "Hip",
    shoulder: "Shoulder width", inseam: "Inseam", sleeve: "Sleeve length", neck: "Neck",
  };

  return (
    <div style={{
      background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
      borderRadius: 24, padding: 24,
      display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,0.9fr)", gap: 24,
    }} className="tlc-tool-grid">
      {/* Body map with callouts (left) */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 24, color: P.ink, fontWeight: 600 }}>
            Estimated measurements
          </div>
          <UnitToggle unit={unit} setUnit={setUnit}/>
        </div>
        <div style={{ marginTop: 14 }}>
          <BodyAvatar measurements={measurements} view="front" showCallouts/>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: P.warmGray, lineHeight: 1.5 }}>
          Overall scan confidence: <strong>{Math.round(result.overallConfidence * 100)}%</strong>.
          Measurements are estimates from your two photos and height anchor — your tailor reviews
          before any cut and fine-tunes against the garment in hand.
        </div>
      </div>

      {/* Measurements list with confidence bars + edit (right) */}
      <div>
        <div style={{ display: "grid", gap: 14 }}>
          {groups.map(({ title, keys }) => (
            <div key={title}>
              <div style={{ fontSize: 11, color: P.warmGray, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 8 }}>
                {title}
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {keys.map(k => {
                  const value = measurements[k];
                  const c = result.confidence[k] ?? 0.85;
                  return (
                    <div key={k} style={{
                      display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr",
                      gap: 10, alignItems: "center",
                      padding: "10px 12px", background: P.parchment,
                      border: `1px solid rgba(45,55,42,0.08)`, borderRadius: 12,
                    }}>
                      <div>
                        <div style={{ fontSize: 13, color: P.ink, fontWeight: 700 }}>{labels[k]}</div>
                        <div style={{ fontSize: 11, color: P.warmGray }}>
                          {k === "height" ? "anchor" : "estimated"}
                        </div>
                      </div>
                      <div>
                        <input
                          type="number"
                          step={0.1}
                          value={unit === "in" ? round1(value) : Math.round(inToCm(value))}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            if (!isFinite(v)) return;
                            const inches = unit === "in" ? v : cmToIn(v);
                            setMeasurements({ ...measurements, [k]: round1(inches) });
                          }}
                          style={{
                            width: "100%", background: P.cream,
                            border: `1px solid rgba(45,55,42,0.12)`,
                            borderRadius: 8, padding: "6px 8px",
                            fontFamily: FONT_SANS, fontSize: 14, color: P.ink, outline: "none",
                          }}
                        />
                        <div style={{ fontSize: 10, color: P.warmGray, marginTop: 2 }}>
                          {fmt(value)}
                        </div>
                      </div>
                      <div>
                        <div style={{
                          height: 8, borderRadius: 999, background: P.cream,
                          border: `1px solid rgba(45,55,42,0.10)`, overflow: "hidden",
                        }}>
                          <div style={{
                            width: `${Math.round(c * 100)}%`, height: "100%",
                            background: c >= 0.85 ? P.forest : c >= 0.7 ? P.olive : P.taupe,
                          }}/>
                        </div>
                        <div style={{ fontSize: 10, color: P.warmGray, marginTop: 2 }}>
                          {Math.round(c * 100)}% conf.
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={onContinue} style={btnPrimary}>
            Use these measurements <IconArrow size={16}/>
          </button>
          <button onClick={onBack} style={btnGhost}>
            <IconRotate size={16}/> Re-scan
          </button>
        </div>
      </div>
    </div>
  );
}

function ScanCompletionStep({ onBack }) {
  return (
    <div style={{
      background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
      borderRadius: 24, padding: 24,
    }}>
      <div style={{ fontFamily: FONT_SERIF, fontSize: 28, color: P.ink, fontWeight: 600 }}>
        Measurements saved to this session
      </div>
      <p style={{ marginTop: 8, color: P.inkSoft, fontSize: 14, lineHeight: 1.6, maxWidth: 720 }}>
        Your estimated measurements now drive the body visualizer below — change a slider, see
        the avatar update, and your size recommendation refresh in real time. Nothing leaves your
        browser in the demo.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <a href="#visualize" onClick={handleAnchorClick("visualize")} style={{ ...btnPrimary, textDecoration: "none" }}>
          See your body visualizer <IconArrow size={16}/>
        </a>
        <a href="#alter" onClick={handleAnchorClick("alter")} style={{ ...btnGhost, textDecoration: "none" }}>
          Skip to drag-to-alter
        </a>
        <button onClick={onBack} style={btnGhost}>Edit measurements</button>
      </div>
    </div>
  );
}

// ─── Body Visualizer (BMI Visualizer-style controls ↔ avatar) ──
function VisualizerSection({ measurements, setMeasurements }) {
  const [unit, setUnit] = useState("in");
  const [view, setView] = useState("front");

  const fields = [
    { k: "height", label: "Height", min: 54, max: 80, step: 0.5 },
    { k: "chest", label: "Chest / bust", min: 28, max: 60, step: 0.1 },
    { k: "waist", label: "Waist", min: 22, max: 56, step: 0.1 },
    { k: "hip", label: "Hip", min: 28, max: 60, step: 0.1 },
    { k: "shoulder", label: "Shoulder width", min: 12, max: 22, step: 0.1 },
    { k: "inseam", label: "Inseam", min: 22, max: 38, step: 0.1 },
    { k: "sleeve", label: "Sleeve length", min: 18, max: 30, step: 0.1 },
    { k: "neck", label: "Neck", min: 11, max: 20, step: 0.1 },
  ];

  return (
    <section id="visualize" style={{ padding: "100px 24px", background: P.parchment }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="Body visualizer"
          title={<>See your <em style={{ color: P.moss }}>shape.</em> Tweak any number.</>}
          body="Inspired by BMI Visualizer and 3DHBGen. Numeric input + slider on the left, full-figure avatar on the right. Front, three-quarter, and side views simulate orbit. Every change updates the avatar instantly and feeds the size recommendation."
        />

        <div style={{
          marginTop: 28,
          display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.2fr)", gap: 24,
        }} className="tlc-tool-grid">
          {/* Controls */}
          <div style={{
            background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
            borderRadius: 24, padding: 22,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              <div style={{ fontFamily: FONT_SERIF, fontSize: 22, color: P.ink, fontWeight: 600 }}>
                Measurements
              </div>
              <UnitToggle unit={unit} setUnit={setUnit}/>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {fields.map(f => (
                <SliderRow key={f.k} field={f} unit={unit}
                  value={measurements[f.k]}
                  onChange={(v) => setMeasurements({ ...measurements, [f.k]: round1(v) })}/>
              ))}
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => setMeasurements(DEFAULT_MEASUREMENTS)} style={btnGhost}>
                <IconRotate size={14}/> Reset to baseline
              </button>
            </div>
          </div>

          {/* Avatar */}
          <div style={{
            background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
            borderRadius: 24, padding: 22,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              <div style={{ fontFamily: FONT_SERIF, fontSize: 22, color: P.ink, fontWeight: 600 }}>
                Your body — {view === "three-quarter" ? "3/4 view" : `${view} view`}
              </div>
              <ViewToggle view={view} setView={setView}/>
            </div>
            <BodyAvatar measurements={measurements} view={view} showCallouts/>
            <div style={{ marginTop: 10, fontSize: 12, color: P.warmGray }}>
              Estimated render. The figure deforms from your numbers; we don't claim a true 3D mesh in the demo.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SliderRow({ field, value, onChange, unit }) {
  const display = unit === "in" ? round1(value) : Math.round(inToCm(value));
  const dispMin = unit === "in" ? field.min : Math.round(inToCm(field.min));
  const dispMax = unit === "in" ? field.max : Math.round(inToCm(field.max));
  const dispStep = unit === "in" ? field.step : 1;
  const setFromDisplay = (d) => {
    const inches = unit === "in" ? d : cmToIn(d);
    onChange(clamp(inches, field.min, field.max));
  };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontSize: 13, color: P.ink, fontWeight: 700 }}>{field.label}</div>
        <input
          type="number"
          step={dispStep} min={dispMin} max={dispMax}
          value={display}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isFinite(v)) return;
            setFromDisplay(v);
          }}
          style={{
            width: 84, background: P.parchment,
            border: `1px solid rgba(45,55,42,0.12)`,
            borderRadius: 8, padding: "4px 8px",
            fontFamily: FONT_SANS, fontSize: 13, color: P.ink, outline: "none",
            textAlign: "right",
          }}
        />
      </div>
      <input
        type="range" min={dispMin} max={dispMax} step={dispStep}
        value={display}
        onChange={(e) => setFromDisplay(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: P.forest }}
      />
    </div>
  );
}

function ViewToggle({ view, setView }) {
  const opts = [
    ["front", "Front"],
    ["three-quarter", "3/4"],
    ["side", "Side"],
  ];
  return (
    <div style={{
      display: "inline-flex", padding: 4, borderRadius: 999,
      background: P.parchment, border: `1px solid rgba(45,55,42,0.12)`,
    }}>
      {opts.map(([k, label]) => (
        <button key={k} onClick={() => setView(k)} style={{
          padding: "6px 12px", borderRadius: 999, border: "none", cursor: "pointer",
          background: view === k ? P.forest : "transparent",
          color: view === k ? P.cream : P.inkSoft,
          fontWeight: 800, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase",
        }}>{label}</button>
      ))}
    </div>
  );
}

// ─── Sizing recommendation engine ─────────────────────────
// Compares measurements (waist/hip/inseam/shoulder/chest) to garment
// size chart entries. Picks the size whose total absolute deviation
// across critical girths is smallest, with a small ease bonus toward
// the larger of two ties. Confidence reflects deviation tightness.
function recommendSize(product, measurements) {
  if (!product || !product.sizes || !measurements) return null;
  const m = measurements;
  // Weights — waist + hip dominate for pants; chest + shoulder for tops.
  const isTop = /shirt|top|blouse|jacket|coat/i.test(product.category || "");
  const W = isTop
    ? { chest: 0.4, shoulder: 0.3, waist: 0.2, hip: 0.1 }
    : { waist: 0.45, hip: 0.35, inseam: 0.05, shoulder: 0.05, chest: 0.10 };
  const scored = product.sizes.map(s => {
    let dev = 0;
    let count = 0;
    for (const k of Object.keys(W)) {
      if (typeof s[k] === "number" && typeof m[k] === "number") {
        dev += W[k] * Math.abs(s[k] - m[k]);
        count += W[k];
      }
    }
    return { size: s, deviation: count ? dev / count : 999 };
  }).sort((a, b) => a.deviation - b.deviation);
  const best = scored[0];
  const second = scored[1];
  // Confidence: 1.0 at deviation 0, 0.5 at deviation 1.5"
  const confidence = clamp(1 - best.deviation / 1.5, 0.4, 0.99);
  // Risks
  const risks = [];
  const s = best.size;
  if (typeof s.inseam === "number" && typeof m.inseam === "number") {
    const d = s.inseam - m.inseam;
    if (Math.abs(d) >= 0.5) {
      risks.push(d > 0
        ? { label: "Too long", detail: `Inseam runs ${d.toFixed(1)}" longer than your measurement — plan to shorten.` }
        : { label: "Too short", detail: `Inseam is ${Math.abs(d).toFixed(1)}" shorter than your measurement — limited fix.` });
    }
  }
  if (typeof s.waist === "number" && typeof m.waist === "number") {
    const ease = s.waist - m.waist;
    if (ease < -0.4) risks.push({ label: "Tight waist", detail: `Garment waist is ${Math.abs(ease).toFixed(1)}" smaller — risk of pull. Consider sizing up.` });
    if (ease > 1.6) risks.push({ label: "Loose waist", detail: `Garment waist is ${ease.toFixed(1)}" larger — easy take-in by your tailor.` });
  }
  if (isTop && typeof s.shoulder === "number" && typeof m.shoulder === "number") {
    const d = s.shoulder - m.shoulder;
    if (d < -0.3) risks.push({ label: "Shoulder tight", detail: `Garment shoulder runs ${Math.abs(d).toFixed(1)}" narrower — flag for tailor review.` });
    if (d > 0.5) risks.push({ label: "Shoulder wide", detail: `Garment shoulder is ${d.toFixed(1)}" wider — sleeve cap may need re-set.` });
  }
  return { recommended: s, alternative: second?.size, confidence, risks, scored };
}

// ─── Alter + recommendation section ──────────────────────
function AlterSection({ product, measurements, alterations, setAlterations }) {
  const recommendation = useMemo(() => recommendSize(product, measurements), [product, measurements]);
  const altBrief = useMemo(() => buildBrief(alterations), [alterations]);

  return (
    <section id="alter" style={{ padding: "100px 24px", background: `linear-gradient(180deg, ${P.parchment} 0%, ${P.beige} 100%)` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="Step 4 · Alter"
          title={<>Drag the fit you want. <em style={{ color: P.moss }}>Sized to you.</em></>}
          body="Your measurements drive the avatar; your size recommendation comes from comparing them to the listing's size chart. Drag the green handles on the body to refine — every change updates the alteration brief and notes any fit risks."
        />

        {!product && (
          <div style={{
            marginTop: 24, padding: 16,
            background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
            borderRadius: 16, color: P.inkSoft, fontSize: 14,
          }}>
            No product yet — paste a link in <a href="#tool" onClick={handleAnchorClick("tool")} style={{ color: P.forestDeep, fontWeight: 800 }}>step 1</a>.
            You can still play with the body visualizer above.
          </div>
        )}

        {product && (
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
              <ProductHeaderInline product={product} recommendation={recommendation}/>
              <div style={{
                marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8,
                padding: "6px 12px", borderRadius: 999,
                background: "rgba(107,142,90,0.12)",
                border: `1px solid rgba(107,142,90,0.28)`,
                color: P.forestDeep, fontSize: 12, fontWeight: 700,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: P.forest }}/>
                Drag the green handles for hem, waist, or sleeve.
              </div>
              <div style={{ marginTop: 12 }}>
                <BodyAvatar
                  measurements={measurements}
                  alterations={alterations} setAlterations={setAlterations}
                  view="front" showGarment showHandles
                />
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: P.warmGray }}>
                Numbers update live in the alteration brief on the right.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateRows: "auto auto auto 1fr", gap: 16 }}>
              <SizingCard recommendation={recommendation}/>
              <FitRiskCard recommendation={recommendation}/>
              <AlterationBrief alterations={alterations} brief={altBrief}
                onReset={() => setAlterations({ hemDelta: 0, waistDelta: 0, sleeveDelta: 0 })}/>
              <SendToTailorCTA/>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ProductHeaderInline({ product, recommendation }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.8, color: P.warmGray, textTransform: "uppercase" }}>
          From {product.retailer}
        </div>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 22, fontWeight: 600, color: P.ink, lineHeight: 1.1, marginTop: 4 }}>
          {product.name}
        </div>
      </div>
      <div style={{
        padding: "6px 12px", borderRadius: 999,
        background: "rgba(107,142,90,0.14)",
        color: P.forestDeep, fontSize: 11, fontWeight: 800, letterSpacing: 1.4,
        textTransform: "uppercase",
      }}>
        Recommended · {recommendation?.recommended?.label ?? product.sizeRec}
      </div>
    </div>
  );
}

function SizingCard({ recommendation }) {
  if (!recommendation) {
    return (
      <div style={{
        background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
        borderRadius: 20, padding: 18,
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, color: P.warmGray, textTransform: "uppercase" }}>
          Size recommendation
        </div>
        <div style={{ marginTop: 8, color: P.inkSoft, fontSize: 14 }}>
          Add measurements to see a recommendation.
        </div>
      </div>
    );
  }
  const { recommended, alternative, confidence } = recommendation;
  return (
    <div style={{
      background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
      borderRadius: 20, padding: 18,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, color: P.warmGray, textTransform: "uppercase" }}>
          Size recommendation
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, color: P.forestDeep }}>
          {Math.round(confidence * 100)}% confidence
        </div>
      </div>
      <div style={{ fontFamily: FONT_SERIF, fontSize: 26, color: P.ink, fontWeight: 600, lineHeight: 1.1 }}>
        {recommended.label}
      </div>
      {alternative && (
        <div style={{ marginTop: 4, fontSize: 13, color: P.inkSoft }}>
          Alternative: <strong>{alternative.label}</strong> if you prefer a looser fit.
        </div>
      )}
      <div style={{
        marginTop: 10, height: 8, borderRadius: 999, background: P.parchment,
        border: `1px solid rgba(45,55,42,0.10)`, overflow: "hidden",
      }}>
        <div style={{
          width: `${Math.round(confidence * 100)}%`, height: "100%",
          background: confidence >= 0.85 ? P.forest : confidence >= 0.7 ? P.olive : P.taupe,
        }}/>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: P.warmGray, lineHeight: 1.5 }}>
        Compared your waist / hip / inseam / shoulder / chest to the listing's size chart and picked
        the smallest deviation across critical girths.
      </div>
    </div>
  );
}

function FitRiskCard({ recommendation }) {
  const risks = recommendation?.risks ?? [];
  return (
    <div style={{
      background: P.cream, border: `1px solid rgba(45,55,42,0.10)`,
      borderRadius: 20, padding: 18,
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, color: P.warmGray, textTransform: "uppercase", marginBottom: 10 }}>
        Fit risks
      </div>
      {risks.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: P.forestDeep, fontSize: 14, fontWeight: 700 }}>
          <IconCheck size={16}/> No major risks at this size.
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {risks.map((r, i) => (
            <li key={i} style={{
              padding: "10px 12px", background: P.parchment,
              border: `1px solid rgba(45,55,42,0.08)`, borderRadius: 12,
            }}>
              <div style={{ fontSize: 13, color: P.ink, fontWeight: 700 }}>{r.label}</div>
              <div style={{ fontSize: 12, color: P.inkSoft, marginTop: 4 }}>{r.detail}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function buildBrief({ hemDelta, waistDelta, sleeveDelta }) {
  const lines = [];
  if (Math.abs(hemDelta) >= 0.1) {
    lines.push(hemDelta > 0
      ? `Lengthen hem by ${hemDelta.toFixed(1)}"`
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
        Step 5 · Go.
      </div>
      <div style={{ fontSize: 13, opacity: 0.85, marginTop: 8 }}>
        Order the piece from the retailer yourself. Submit this alteration brief and we’ll
        guide you to ship it to <strong>123 Main Street</strong>. No browsing, no checkout here.
      </div>
      <a href="#shipping" onClick={handleAnchorClick("shipping")} style={{
        marginTop: 14, display: "inline-flex", alignItems: "center", gap: 8,
        background: P.cream, color: P.ink,
        padding: "10px 16px", borderRadius: 999,
        textDecoration: "none", fontWeight: 800, fontSize: 13,
      }}>Submit + ship to tailor <IconArrow size={14}/></a>
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

// ─── How it works ────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: "01", Icon: IconLink, title: "Paste a product link", body: "We pull the listing — name, image, size chart, fabric, and fit notes — straight from the retailer page." },
    { n: "02", Icon: IconRuler, title: "Get your measurements", body: "Two photos (front + side), or type in the numbers you already know. Estimated measurements with a confidence score for each." },
    { n: "03", Icon: IconScissors, title: "Drag the fit you want", body: "Pull the hem, waist, or sleeve on your body preview. Each drag becomes a precise alteration measurement." },
    { n: "04", Icon: IconBox, title: "Order it yourself + send proof", body: "Buy the garment from the retailer in your name. Upload your order confirmation and tracking so we know it’s coming." },
    { n: "05", Icon: IconTruck, title: "Ship to 123 Main Street", body: "When it arrives at your door, drop it in the prepaid mailer to The Tailored Company at 123 Main Street." },
    { n: "06", Icon: IconCheck, title: "We alter, then ship it back", body: "A human tailor reviews your brief, makes the alterations, and ships the finished piece to you." },
  ];
  return (
    <section id="how" style={{ padding: "100px 24px", background: P.parchment }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="How it works"
          title={<>Six steps. <em style={{ color: P.moss }}>One page.</em></>}
          body="The Tailored Company is a tailoring tool, not a store. You order the garment from the retailer in your name; we handle the alterations. Nothing to browse here."
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

// ─── Shipping section ────────────────────────────────────
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

// ─── Trust + FAQ + Footer ───────────────────────────────
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

function FAQ() {
  const faqs = [
    { q: "Do I have to download an app?", a: "No. Everything is right here on the website. We may release a companion app later for repeat customers, but it’s never required." },
    { q: "How does the measurement scan work?", a: "It's an AI-guided two-photo measurement preview, inspired by 3DLOOK Mobile Tailor and Choozr. The current demo simulates capture in your browser for safety; production scans use your two photos and a height anchor to estimate measurements with per-dimension confidence." },
    { q: "How does the body visualizer work?", a: "Front, three-quarter, and side views are rendered from your measurements as a vector silhouette. It deforms in real time as you change numbers — a visual guide, not a perfect cloth simulation. Your tailor reviews everything before any cutting." },
    { q: "How is my recommended size calculated?", a: "We compare your measurements (waist, hip, inseam, shoulder, chest) to the listing's size chart and pick the size with the smallest weighted deviation across critical girths. We flag fit risks like 'too long' or 'tight waist'." },
    { q: "Why do I have to buy the garment myself?", a: "We don’t resell. You order in your name from the retailer (so returns and warranties stay with you), then ship the piece to us for alterations." },
    { q: "Where do I ship the garment?", a: "To The Tailored Company at 123 Main Street, our temporary intake address. We’ll include a prepaid label and detailed instructions with your order." },
    { q: "What can the drag-to-alter tool actually change?", a: "Hem / inseam length, waist take-in or let-out, and sleeve length today. We’re adding shoulder, taper, and rise next." },
    { q: "What about my privacy?", a: "Your measurements stay in your browser during the demo. When the production scan ships, photos are used only to estimate measurements, no account is required, and you can delete your scan at any time. We don't share or sell scans." },
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

function Footer() {
  return (
    <footer style={{
      background: P.cocoa, color: P.oat, padding: "48px 24px",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 22, fontWeight: 600, color: P.cream }}>The Tailored Company</div>
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
            A tailoring tool for clothing you bought anywhere. Not a store, not an app — one page,
            five steps: paste, get info, measure, alter, go.
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
            <a href="#tool" onClick={handleAnchorClick("tool")} style={{ color: P.oat, textDecoration: "none" }}>Try the tool</a>
            <a href="#measure" onClick={handleAnchorClick("measure")} style={{ color: P.oat, textDecoration: "none" }}>Get measurements</a>
            <a href="#visualize" onClick={handleAnchorClick("visualize")} style={{ color: P.oat, textDecoration: "none" }}>Body visualizer</a>
            <a href="#alter" onClick={handleAnchorClick("alter")} style={{ color: P.oat, textDecoration: "none" }}>Drag-to-alter</a>
            <a href="#how" onClick={handleAnchorClick("how")} style={{ color: P.oat, textDecoration: "none" }}>How it works</a>
            <a href="#shipping" onClick={handleAnchorClick("shipping")} style={{ color: P.oat, textDecoration: "none" }}>Shipping</a>
            <a href="#faq" onClick={handleAnchorClick("faq")} style={{ color: P.oat, textDecoration: "none" }}>FAQ</a>
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
  // Shared, page-level state — measurements drive the visualizer + sizing,
  // alterations drive the brief, product drives the spec card + recommendation.
  const [measurements, setMeasurements] = useState(DEFAULT_MEASUREMENTS);
  const [alterations, setAlterations] = useState({ hemDelta: 0, waistDelta: 0, sleeveDelta: 0 });
  const [product, setProduct] = useState(null);
  const [extractState, setExtractState] = useState("idle");
  const [url, setUrl] = useState("");

  return (
    <div style={{
      background: P.parchment, minHeight: "100vh",
      color: P.ink, fontFamily: FONT_SANS,
    }}>
      <ResponsiveStyles/>
      <SiteNav/>
      <Hero/>
      <ToolSection
        product={product} setProduct={setProduct}
        state={extractState} setState={setExtractState}
        url={url} setUrl={setUrl}
      />
      <MeasureSection
        measurements={measurements}
        setMeasurements={setMeasurements}
      />
      <VisualizerSection
        measurements={measurements}
        setMeasurements={setMeasurements}
      />
      <AlterSection
        product={product}
        measurements={measurements}
        alterations={alterations}
        setAlterations={setAlterations}
      />
      <HowItWorks/>
      <ShippingSection/>
      <TrustSection/>
      <FAQ/>
      <Footer/>
    </div>
  );
}
