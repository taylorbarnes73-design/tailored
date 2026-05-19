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
        <a href="#top" onClick={handleAnchorClick("top")} style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
          <div style={{
            width: 42, height: 42, borderRadius: 4,
            background: P.ink,
            color: P.cream, fontFamily: FONT_SERIF, fontSize: 22, fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "center",
            letterSpacing: 0,
          }}>T</div>
          <div>
            <div style={{ fontFamily: FONT_SERIF, fontWeight: 500, fontSize: 19, color: P.ink, lineHeight: 1, letterSpacing: 0.3 }}>
              The Tailored Company
            </div>
            <div style={{ fontSize: 9.5, letterSpacing: 2.4, color: P.warmGray, fontWeight: 600, marginTop: 5, textTransform: "uppercase" }}>
              Private digital atelier · made to fit
            </div>
          </div>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }} className="tlc-nav-links">
          {[
            ["The fitting", "tool"],
            ["Measurement suite", "measure"],
            ["Atelier process", "how"],
            ["Concierge intake", "shipping"],
            ["FAQ", "faq"],
          ].map(([label, id]) => (
            <a key={label} href={`#${id}`} onClick={handleAnchorClick(id)} style={{
              color: P.inkSoft, fontSize: 12.5, fontWeight: 500, textDecoration: "none",
              letterSpacing: 0.3,
            }}>{label}</a>
          ))}
          <a href="#tool" onClick={handleAnchorClick("tool")} style={{
            background: P.ink, color: P.cream,
            padding: "11px 20px", borderRadius: 2,
            fontSize: 11, fontWeight: 600, textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 8,
            letterSpacing: 1.8, textTransform: "uppercase",
          }}>
            Begin the fitting <IconArrow size={13}/>
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
      padding: "112px 24px 108px",
      background: `
        radial-gradient(60% 70% at 14% 16%, rgba(196,210,182,0.22) 0%, transparent 62%),
        radial-gradient(52% 62% at 92% 82%, rgba(168,174,154,0.22) 0%, transparent 62%),
        linear-gradient(180deg, ${P.parchment} 0%, ${P.beige} 100%)
      `,
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,0.95fr)",
        gap: 72, alignItems: "center",
      }} className="tlc-hero-grid">
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "7px 14px", borderRadius: 999,
            background: "rgba(242,243,238,0.65)",
            border: `1px solid rgba(45,55,42,0.14)`,
            color: P.forestDeep, fontSize: 10, fontWeight: 700,
            letterSpacing: 2.6, textTransform: "uppercase", marginBottom: 28,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: P.forest }}/>
            By invitation of the cloth
          </div>
          <h1 style={{
            fontFamily: FONT_SERIF, fontSize: "clamp(46px, 6vw, 84px)",
            lineHeight: 1.0, letterSpacing: -1.8, color: P.ink, fontWeight: 400, margin: 0,
          }}>
            A private atelier,
            <br/>
            <span style={{ color: P.moss, fontStyle: "italic", fontWeight: 400 }}>tailored to the piece you love.</span>
          </h1>
          <p style={{
            marginTop: 26, fontSize: 17.5, lineHeight: 1.65, color: P.inkSoft, maxWidth: 540,
            fontWeight: 400,
          }}>
            Share the garment. Take your fit profile in two quiet photos.
            Refine the cut by hand on a live preview. Send it to our atelier for review,
            alteration, and return — concierge from intake to final stitch.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
            <a href="#tool" onClick={handleAnchorClick("tool")} style={{
              background: P.ink,
              color: P.cream, padding: "16px 28px", borderRadius: 2,
              fontSize: 12, fontWeight: 600, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 12,
              boxShadow: "0 18px 38px rgba(31,38,32,0.22)",
              letterSpacing: 2.2, textTransform: "uppercase",
            }}>
              Begin a fitting <IconArrow size={14}/>
            </a>
            <a href="#measure" onClick={handleAnchorClick("measure")} style={{
              background: "transparent", color: P.ink,
              padding: "16px 24px", borderRadius: 2,
              fontSize: 12, fontWeight: 600, textDecoration: "none",
              border: `1px solid rgba(45,55,42,0.32)`,
              display: "inline-flex", alignItems: "center", gap: 10,
              letterSpacing: 2.2, textTransform: "uppercase",
            }}>Take measurements</a>
          </div>
          <div style={{ marginTop: 36, display: "flex", flexWrap: "wrap", gap: 26, color: P.warmGray, fontSize: 12.5, letterSpacing: 0.2 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <IconShield size={15}/> Tailor-reviewed before a thread is cut
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <IconLock size={15}/> Discreet · your fit profile stays yours
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
      borderRadius: 2,
      background: `linear-gradient(180deg, ${P.cream} 0%, ${P.beige} 100%)`,
      border: `1px solid rgba(45,55,42,0.12)`,
      boxShadow: "0 60px 120px rgba(45,55,42,0.18), inset 0 1px 0 rgba(255,255,255,0.7)",
      padding: 24,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{
          fontSize: 9.5, color: P.warmGray, fontWeight: 700,
          letterSpacing: 2.6, textTransform: "uppercase",
        }}>Fitting room · preview</div>
        <div style={{ fontFamily: FONT_SERIF, fontStyle: "italic", fontSize: 13, color: P.moss }}>
          drag to refine
        </div>
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
              role="slider" aria-label="Set the break — drag to shorten or lengthen the hem" tabIndex={0}>
              <line x1={sx(-halfHip * 0.42)} y1={hemY} x2={sx(halfHip * 0.42)} y2={hemY}
                stroke={P.cream} strokeWidth="2" opacity="0.85"/>
              <circle cx={cx} cy={hemY} r="22" fill="rgba(0,0,0,0.001)"/>
              <circle cx={cx} cy={hemY} r="14" fill={P.cream} stroke={P.forest} strokeWidth="2.5"/>
              <line x1={cx - 6} y1={hemY - 4} x2={cx - 6} y2={hemY + 4} stroke={P.forest} strokeWidth="2"/>
              <line x1={cx + 6} y1={hemY - 4} x2={cx + 6} y2={hemY + 4} stroke={P.forest} strokeWidth="2"/>
              <text x={cx + 22} y={hemY + 4} fontSize="11" fill={P.ink} fontWeight="600"
                letterSpacing="1.6"
                style={{ fontFamily: FONT_SANS, textTransform: "uppercase" }}>SET THE BREAK ↕</text>
            </g>
            {/* WAIST handles */}
            <g onPointerDown={startDrag("waist")} style={{ cursor: "ew-resize" }}
              role="slider" aria-label="Refine waist ease — drag to take in or let out" tabIndex={0}>
              <circle cx={sx(-halfHip + waistInset) - 6} cy={hipY - 4} r="22" fill="rgba(0,0,0,0.001)"/>
              <circle cx={sx(-halfHip + waistInset) - 6} cy={hipY - 4} r="14" fill={P.cream} stroke={P.forest} strokeWidth="2.5"/>
              <circle cx={sx(halfHip - waistInset) + 6} cy={hipY - 4} r="22" fill="rgba(0,0,0,0.001)"/>
              <circle cx={sx(halfHip - waistInset) + 6} cy={hipY - 4} r="14" fill={P.cream} stroke={P.forest} strokeWidth="2.5"/>
              <text x={sx(halfHip) + 28} y={hipY - 2} fontSize="11" fill={P.ink} fontWeight="600"
                letterSpacing="1.6"
                style={{ fontFamily: FONT_SANS, textTransform: "uppercase" }}>REFINE WAIST ↔</text>
            </g>
            {/* SLEEVE handle */}
            <g onPointerDown={startDrag("sleeve")} style={{ cursor: "ns-resize" }}
              role="slider" aria-label="Set the sleeve — drag to shorten or lengthen" tabIndex={0}>
              <circle cx={sx(-halfShoulder - 18)} cy={sleeveY + 12} r="22" fill="rgba(0,0,0,0.001)"/>
              <circle cx={sx(-halfShoulder - 18)} cy={sleeveY + 12} r="14"
                fill={P.cream} stroke={P.forest} strokeWidth="2.5"/>
              <line x1={sx(-halfShoulder - 18) - 6} y1={sleeveY + 8} x2={sx(-halfShoulder - 18) - 6} y2={sleeveY + 16} stroke={P.forest} strokeWidth="2"/>
              <line x1={sx(-halfShoulder - 18) + 6} y1={sleeveY + 8} x2={sx(-halfShoulder - 18) + 6} y2={sleeveY + 16} stroke={P.forest} strokeWidth="2"/>
              <text x={14} y={sleeveY + 4} fontSize="11" fill={P.ink} fontWeight="600"
                letterSpacing="1.6"
                style={{ fontFamily: FONT_SANS, textTransform: "uppercase" }}>SET SLEEVE ↕</text>
            </g>
          </g>
        )}

        {/* status badge */}
        <g>
          <rect x="20" y="20" width="200" height="26" rx="2"
            fill="rgba(242,243,238,0.94)" stroke="rgba(45,55,42,0.18)"/>
          <circle cx="34" cy="33" r="3" fill={P.forest}/>
          <text x="46" y="37" fontSize="9.5" fontWeight="600"
            fill={P.inkSoft} style={{ fontFamily: FONT_SANS, letterSpacing: 2.4 }}>
            {view === "three-quarter" ? "THREE-QUARTER" : view.toUpperCase()} · FIT PROFILE
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
    { k: "I", t: "Share the piece" },
    { k: "II", t: "Garment brief" },
    { k: "III", t: "Fit profile" },
    { k: "IV", t: "Refine" },
    { k: "V", t: "Atelier" },
  ];
  return (
    <div style={{
      marginTop: 28, display: "inline-flex", alignItems: "center", gap: 14,
      flexWrap: "wrap",
      background: "rgba(242,243,238,0.7)",
      border: `1px solid rgba(45,55,42,0.12)`,
      padding: "12px 18px", borderRadius: 999,
    }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.k}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            color: P.ink, fontSize: 11, fontWeight: 600,
            letterSpacing: 1.8, textTransform: "uppercase",
          }}>
            <span style={{
              minWidth: 22, height: 22, borderRadius: 999,
              background: "transparent", color: P.forestDeep,
              border: `1px solid rgba(107,142,90,0.45)`,
              padding: "0 6px",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700, fontFamily: FONT_SERIF, letterSpacing: 0.6,
            }}>{s.k}</span>
            {s.t}
          </span>
          {i < steps.length - 1 && (
            <span style={{ color: P.warmGray, fontSize: 12, fontWeight: 400 }}>—</span>
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
      padding: "120px 24px",
      background: `linear-gradient(180deg, ${P.beige} 0%, ${P.parchment} 100%)`,
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="I — Share the garment"
          title={<>Begin with the piece. <em style={{ color: P.moss }}>We compose the brief.</em></>}
          body="Send us a link to the garment you would like tailored. Our system reads the maker's cut, cloth, and size chart, and prepares a private brief for the atelier — the first stitch of a made-to-fit alteration."
        />
        <FlowStrip/>

        {/* URL input */}
        <div style={{
          background: P.cream,
          border: `1px solid rgba(45,55,42,0.12)`,
          borderRadius: 4, padding: 32,
          boxShadow: "0 32px 70px rgba(45,55,42,0.07)",
          marginTop: 44,
        }}>
          <div style={{
            fontSize: 10, color: P.warmGray, fontWeight: 700,
            letterSpacing: 2.6, textTransform: "uppercase", marginBottom: 14,
          }}>
            The garment link
          </div>
          <div style={{
            display: "flex", gap: 10, flexWrap: "wrap", alignItems: "stretch",
          }}>
            <div style={{
              flex: 1, minWidth: 240,
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 18px",
              background: P.parchment,
              border: `1px solid rgba(45,55,42,0.14)`,
              borderRadius: 2,
            }}>
              <IconLink size={18}/>
              <input
                type="url"
                placeholder="https://maker.com/the-piece-you-love"
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
                background: P.ink,
                color: P.cream, padding: "14px 26px",
                borderRadius: 2, border: "none",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
                letterSpacing: 2.2, textTransform: "uppercase",
                opacity: !url || state === "extracting" ? 0.5 : 1,
                display: "inline-flex", alignItems: "center", gap: 10,
              }}
            >
              {state === "extracting" ? "Reading the cloth…" : "Compose the brief"}
              {state !== "extracting" && <IconArrow size={14}/>}
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: P.warmGray, fontWeight: 700, letterSpacing: 2.4, textTransform: "uppercase" }}>
              Try a sample house
            </span>
            {examples.map(ex => (
              <button
                key={ex.host}
                onClick={() => extract(`https://${ex.host}/products/example`)}
                style={{
                  background: "transparent",
                  border: `1px solid rgba(45,55,42,0.18)`,
                  color: P.inkSoft, fontWeight: 500, fontSize: 12,
                  padding: "6px 12px", borderRadius: 999, cursor: "pointer",
                  fontFamily: FONT_SERIF, fontStyle: "italic", letterSpacing: 0.2,
                }}
              >{ex.host}</button>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: P.warmGray, fontStyle: "italic", lineHeight: 1.6 }}>
            A working preview — share any garment link, or select a sample house. Retailer coverage
            is expanding as we extend the atelier's reach.
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
      background: P.cream, border: `1px solid rgba(45,55,42,0.12)`,
      borderRadius: 4, padding: 28,
      boxShadow: "0 24px 60px rgba(45,55,42,0.06)",
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2.6, color: P.warmGray, textTransform: "uppercase" }}>
        Maison · {product.retailer}
      </div>
      <div style={{ fontFamily: FONT_SERIF, fontSize: 28, fontWeight: 500, color: P.ink, lineHeight: 1.1, marginTop: 8, letterSpacing: -0.4 }}>
        {product.name}
      </div>
      <div style={{ height: 1, width: 40, background: P.taupe, margin: "16px 0" }}/>
      <dl style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "8px 16px", margin: 0, fontSize: 13.5 }}>
        <dt style={{ color: P.warmGray, fontStyle: "italic" }}>Category</dt>
        <dd style={{ color: P.ink }}>{product.category}</dd>
        <dt style={{ color: P.warmGray, fontStyle: "italic" }}>Cloth</dt>
        <dd style={{ color: P.ink }}>{product.fabric}</dd>
        <dt style={{ color: P.warmGray, fontStyle: "italic" }}>Atelier note</dt>
        <dd style={{ color: P.inkSoft, fontStyle: "italic" }}>{product.notes}</dd>
      </dl>
      <a href="#measure" onClick={handleAnchorClick("measure")} style={{
        marginTop: 22, display: "inline-flex", alignItems: "center", gap: 10,
        background: "transparent", color: P.ink,
        padding: "10px 0", borderBottom: `1px solid ${P.ink}`,
        textDecoration: "none", fontWeight: 600, fontSize: 11,
        letterSpacing: 2.2, textTransform: "uppercase",
      }}>Continue to your fit profile <IconArrow size={13}/></a>
    </div>
  );
}

function SpecCard({ product }) {
  return (
    <div style={{
      background: P.cream, border: `1px solid rgba(45,55,42,0.12)`,
      borderRadius: 4, padding: 28,
      boxShadow: "0 24px 60px rgba(45,55,42,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2.6, color: P.warmGray, textTransform: "uppercase" }}>
          Maker's measure
        </div>
        <div style={{ fontFamily: FONT_SERIF, fontStyle: "italic", color: P.moss, fontSize: 13 }}>
          base size · {product.sizeRec}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {product.sizeChart.map(row => (
          <div key={row.label} style={{
            padding: "12px 14px", background: P.parchment,
            borderRadius: 2, border: `1px solid rgba(45,55,42,0.10)`,
          }}>
            <div style={{ fontSize: 9.5, color: P.warmGray, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
              {row.label}
            </div>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 22, fontWeight: 500, color: P.ink, marginTop: 4 }}>
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
  const STEPS = ["Prepare", "Front view", "Side view", "Fit profile", "Atelier review"];
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
    <section id="measure" style={{ padding: "120px 24px", background: `linear-gradient(180deg, ${P.parchment} 0%, ${P.beige} 100%)` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="III — The measurement suite"
          title={<>A private digital fitting. <em style={{ color: P.moss }}>Two quiet photographs.</em></>}
          body="The measurement suite is your fitting room online. Two composed photographs — front and side — are read against your stated height to draft a precise fit profile. The current preview is fully simulated for your discretion; in the production atelier your images are used only to measure, never stored beyond your session, never shared."
        />

        {/* Stepper */}
        <div style={{
          marginTop: 36,
          display: "flex", flexWrap: "wrap", gap: 6,
          background: P.cream,
          border: `1px solid rgba(45,55,42,0.12)`,
          borderRadius: 999,
          padding: 6,
          width: "fit-content",
          boxShadow: "0 12px 32px rgba(45,55,42,0.05)",
        }}>
          {STEPS.map((label, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <button key={label} onClick={() => setStep(i)} style={{
                padding: "9px 16px", borderRadius: 999, border: "none", cursor: "pointer",
                background: active ? P.ink : done ? "rgba(79,107,67,0.10)" : "transparent",
                color: active ? P.cream : done ? P.forestDeep : P.inkSoft,
                fontWeight: 600, fontSize: 10.5, letterSpacing: 1.8, textTransform: "uppercase",
                display: "inline-flex", alignItems: "center", gap: 10,
                fontFamily: FONT_SANS,
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 999,
                  background: active ? P.cream : done ? P.forest : "rgba(45,55,42,0.08)",
                  color: active ? P.ink : done ? P.cream : P.inkSoft,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9.5, fontWeight: 700, fontFamily: FONT_SERIF,
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
      background: P.cream, border: `1px solid rgba(45,55,42,0.12)`,
      borderRadius: 4, padding: 32,
      display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 36,
      boxShadow: "0 24px 60px rgba(45,55,42,0.06)",
    }} className="tlc-tool-grid">
      <div>
        <div style={{ fontSize: 10, color: P.warmGray, fontWeight: 700, letterSpacing: 2.6, textTransform: "uppercase", marginBottom: 8 }}>
          The fitting room
        </div>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 30, color: P.ink, fontWeight: 500, marginBottom: 18, letterSpacing: -0.4, lineHeight: 1.1 }}>
          A few quiet preparations
        </div>
        <Checklist items={[
          ["A close-fitting layer — slip, fitted tee, or athletic kit.", true],
          ["Stand six to eight feet from the camera, a plain wall behind you.", true],
          ["Soft, even indoor light. Avoid backlight or hard shadow.", true],
          ["Phone framed vertically, propped at hip height, floor in view.", true],
          ["Hair clear of the shoulders. Bare feet, when possible.", true],
        ]}/>
        <div style={{
          marginTop: 22, padding: 18,
          borderRadius: 2, background: "rgba(79,107,67,0.06)",
          border: `1px solid rgba(79,107,67,0.22)`,
          color: P.forestDeep, fontSize: 13, lineHeight: 1.65,
          display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <IconLock size={18}/>
          <div>
            <span style={{ fontFamily: FONT_SERIF, fontStyle: "italic", color: P.moss, fontSize: 15 }}>In confidence.</span>{" "}
            Photographs are read only to draft your fit profile. No account required, your session
            is yours to clear at any time, and nothing is shared or sold. The preview before you is
            simulated entirely in this browser.
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, color: P.warmGray, fontWeight: 700, letterSpacing: 2.6, textTransform: "uppercase", marginBottom: 8 }}>
          Choose your fitting
        </div>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 22, color: P.ink, fontWeight: 500, marginBottom: 16, letterSpacing: -0.2 }}>
          Self-guided or assisted by a companion
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            ["self", "Private fitting", "Hands-free, with a five-second composure timer. Your phone is propped; you step quietly into frame."],
            ["assisted", "Assisted fitting", "A companion releases the shutter — quicker composure, slightly closer to a tailor's hand."],
          ].map(([k, label, body]) => {
            const active = mode === k;
            return (
              <button key={k} onClick={() => setMode(k)} style={{
                textAlign: "left",
                background: active ? "rgba(79,107,67,0.08)" : P.parchment,
                border: `1px solid ${active ? "rgba(79,107,67,0.5)" : "rgba(45,55,42,0.12)"}`,
                borderRadius: 2, padding: 18, cursor: "pointer",
                fontFamily: FONT_SANS,
              }}>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 19, fontWeight: 500, color: P.ink, letterSpacing: -0.2 }}>{label}</div>
                <div style={{ fontSize: 12.5, color: P.inkSoft, marginTop: 8, lineHeight: 1.6 }}>{body}</div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 10, color: P.warmGray, fontWeight: 700, letterSpacing: 2.4, textTransform: "uppercase", marginBottom: 10 }}>
            Stated height — the anchor of your fit profile
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
          marginTop: 28,
          background: P.ink,
          color: P.cream, padding: "14px 26px",
          borderRadius: 2, border: "none",
          fontSize: 11, fontWeight: 600, cursor: "pointer",
          letterSpacing: 2.2, textTransform: "uppercase",
          display: "inline-flex", alignItems: "center", gap: 12,
        }}>
          Continue · Front view <IconArrow size={14}/>
        </button>
      </div>
    </div>
  );
}

function UnitToggle({ unit, setUnit }) {
  return (
    <div style={{
      display: "inline-flex", padding: 3, borderRadius: 999,
      background: P.parchment, border: `1px solid rgba(45,55,42,0.14)`,
    }}>
      {["in", "cm"].map(u => (
        <button key={u} onClick={() => setUnit(u)} style={{
          padding: "6px 14px", borderRadius: 999, border: "none", cursor: "pointer",
          background: unit === u ? P.ink : "transparent",
          color: unit === u ? P.cream : P.inkSoft,
          fontWeight: 600, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase",
        }}>{u}</button>
      ))}
    </div>
  );
}

function Checklist({ items }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 }}>
      {items.map(([text], i) => (
        <li key={i} style={{
          display: "flex", alignItems: "flex-start", gap: 14,
          padding: "10px 0",
          borderBottom: i < items.length - 1 ? `1px solid rgba(45,55,42,0.08)` : "none",
          fontSize: 13.5, color: P.ink, lineHeight: 1.55,
        }}>
          <span style={{ color: P.forest, marginTop: 2, flexShrink: 0 }}><IconCheck size={14}/></span>
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
      background: P.cream, border: `1px solid rgba(45,55,42,0.12)`,
      borderRadius: 4, padding: 32,
      display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,0.95fr)", gap: 36,
      boxShadow: "0 24px 60px rgba(45,55,42,0.06)",
    }} className="tlc-tool-grid">
      {/* Camera frame (simulated) */}
      <div style={{
        position: "relative",
        background: "#0e1310",
        borderRadius: 2,
        aspectRatio: "9/14",
        overflow: "hidden",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05), 0 24px 50px rgba(31,38,32,0.35)",
      }}>
        <SimulatedCameraView kind={kind} status={capture.status} confidence={conf} countdown={countdown}/>
      </div>

      {/* Right side: instructions, alignment meter, controls */}
      <div>
        <div style={{ fontSize: 10, color: P.warmGray, fontWeight: 700, letterSpacing: 2.6, textTransform: "uppercase", marginBottom: 8 }}>
          {kind === "front" ? "Frame · front view" : "Frame · side view"}
        </div>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 30, color: P.ink, fontWeight: 500, lineHeight: 1.1, letterSpacing: -0.4 }}>
          {kind === "front" ? "Compose front — face the lens" : "Compose side — turn a quarter"}
        </div>
        <div style={{ marginTop: 12, color: P.inkSoft, fontSize: 14, lineHeight: 1.65 }}>
          {kind === "front"
            ? "Face the camera squarely. Feet shoulder-width. Arms held a hand's-breadth from the body, palms forward. A composed, gentle posture."
            : "Turn ninety degrees to the right. Heels together, knees softened. Arms easy at your sides, palms resting on the thigh. Gaze level."}
        </div>

        <PostureGuide kind={kind}/>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 10, color: P.warmGray, fontWeight: 700, letterSpacing: 2.4, textTransform: "uppercase", marginBottom: 8 }}>
            Composure
          </div>
          <div style={{
            position: "relative", height: 6, borderRadius: 999,
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
          <div style={{ marginTop: 8, fontSize: 12.5, color: ready ? P.forestDeep : P.warmGray, fontStyle: ready ? "normal" : "italic" }}>
            {ready ? `Composed at ${Math.round(conf * 100)}% — ready` : `${Math.round(conf * 100)}% — settle into the silhouette, hold the line`}
          </div>
        </div>

        <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {capture.status === "idle" && (
            <button onClick={startAlign} style={btnPrimary}>
              <IconCamera size={14}/> Step into frame
            </button>
          )}
          {capture.status === "aligning" && (
            <>
              <button onClick={startCapture} disabled={!ready} style={{ ...btnPrimary, opacity: ready ? 1 : 0.5, cursor: ready ? "pointer" : "not-allowed" }}>
                <IconCamera size={14}/> Take the {kind} view
              </button>
              <button onClick={() => setCapture({ status: "idle", confidence: 0 })} style={btnGhost}>Cancel</button>
            </>
          )}
          {capture.status === "capturing" && (
            <button disabled style={{ ...btnPrimary, opacity: 0.7 }}>
              Composing in {countdown ?? 0}…
            </button>
          )}
          {capture.status === "confirming" && (
            <>
              <button onClick={confirm} style={btnPrimary}>
                <IconCheck size={14}/> Keep · continue
              </button>
              <button onClick={retake} style={btnGhost}>
                <IconRotate size={14}/> Retake
              </button>
            </>
          )}
          <button onClick={onBack} style={btnGhost}>Back</button>
        </div>

        <div style={{ marginTop: 18, fontSize: 12, color: P.warmGray, lineHeight: 1.6, fontStyle: "italic" }}>
          {mode === "self"
            ? "A five-second composure timer follows the cue to take."
            : "With a companion at the shutter, a brief three-second confirmation follows."}
        </div>
      </div>
    </div>
  );
}

const btnPrimary = {
  background: P.ink,
  color: P.cream, padding: "13px 22px",
  borderRadius: 2, border: "none",
  fontSize: 11, fontWeight: 600, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 10,
  letterSpacing: 2.2, textTransform: "uppercase",
};
const btnGhost = {
  background: "transparent", color: P.inkSoft,
  padding: "13px 20px", borderRadius: 2,
  border: `1px solid rgba(45,55,42,0.28)`,
  fontSize: 11, fontWeight: 600, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 10,
  letterSpacing: 2.2, textTransform: "uppercase",
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
          <rect x="60" y="240" width="240" height="80" rx="2" fill="rgba(0,0,0,0.55)" stroke={P.sage}/>
          <text x="180" y="278" textAnchor="middle" fontSize="17" fontWeight="500" fill="#fff" style={{ fontFamily: FONT_SERIF, letterSpacing: 0.4 }}>
            Composition taken
          </text>
          <text x="180" y="302" textAnchor="middle" fontSize="11" fill="#cdd5c4" style={{ fontFamily: FONT_SANS, letterSpacing: 1.4 }}>
            Confirm or retake →
          </text>
        </g>
      )}

      {/* HUD */}
      <g>
        <rect x="14" y="500" width="332" height="42" rx="2" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.08)"/>
        <text x="26" y="518" fontSize="9.5" fontWeight="600" fill="#cdd5c4" letterSpacing="2.4">
          {kind === "front" ? "FRONT VIEW · PREVIEW" : "SIDE VIEW · PREVIEW"}
        </text>
        <text x="26" y="534" fontSize="11" fill="#9aa48f" fontStyle="italic">
          {status === "idle" && "Begin when ready"}
          {status === "aligning" && (ready ? "Composed — release at will" : "Settle into the silhouette")}
          {status === "capturing" && "Hold the line…"}
          {status === "confirming" && "Confirm or retake"}
          {status === "done" && "Complete"}
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
        "Feet at shoulder width",
        "Arms a hand's-breadth from the body, palms forward",
        "Gaze level, shoulders eased",
      ]
    : [
        "A quarter turn to the right",
        "Heels together, knees softened",
        "Arms easy, palms resting at the thigh",
      ];
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: "18px 0 0", display: "grid", gap: 8 }}>
      {items.map((t, i) => (
        <li key={i} style={{ display: "flex", alignItems: "center", gap: 12, color: P.inkSoft, fontSize: 13 }}>
          <span style={{
            width: 22, height: 22, borderRadius: 999,
            background: "transparent", color: P.forestDeep,
            border: `1px solid rgba(79,107,67,0.4)`,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontWeight: 500, fontSize: 11, fontFamily: FONT_SERIF, fontStyle: "italic",
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
      background: P.cream, border: `1px solid rgba(45,55,42,0.12)`,
      borderRadius: 4, padding: 32,
      display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,0.9fr)", gap: 36,
      boxShadow: "0 24px 60px rgba(45,55,42,0.06)",
    }} className="tlc-tool-grid">
      {/* Body map with callouts (left) */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: P.warmGray, fontWeight: 700, letterSpacing: 2.6, textTransform: "uppercase" }}>
              Your fit profile
            </div>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 28, color: P.ink, fontWeight: 500, letterSpacing: -0.4, marginTop: 6 }}>
              Drafted measurements
            </div>
          </div>
          <UnitToggle unit={unit} setUnit={setUnit}/>
        </div>
        <div style={{ marginTop: 18 }}>
          <BodyAvatar measurements={measurements} view="front" showCallouts/>
        </div>
        <div style={{ marginTop: 14, fontSize: 12.5, color: P.warmGray, lineHeight: 1.65, fontStyle: "italic" }}>
          Atelier confidence — <strong style={{ fontStyle: "normal", color: P.forestDeep }}>{Math.round(result.overallConfidence * 100)}%</strong>.
          These are a tailor's first reading from two compositions and your stated height. The atelier
          refines against the cloth before any thread is taken up.
        </div>
      </div>

      {/* Measurements list with confidence bars + edit (right) */}
      <div>
        <div style={{ display: "grid", gap: 14 }}>
          {groups.map(({ title, keys }) => (
            <div key={title}>
              <div style={{ fontSize: 10, color: P.warmGray, fontWeight: 700, letterSpacing: 2.6, textTransform: "uppercase", marginBottom: 10 }}>
                {title}
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {keys.map(k => {
                  const value = measurements[k];
                  const c = result.confidence[k] ?? 0.85;
                  return (
                    <div key={k} style={{
                      display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr",
                      gap: 12, alignItems: "center",
                      padding: "12px 14px", background: P.parchment,
                      border: `1px solid rgba(45,55,42,0.10)`, borderRadius: 2,
                    }}>
                      <div>
                        <div style={{ fontSize: 13, color: P.ink, fontWeight: 500, fontFamily: FONT_SERIF, letterSpacing: -0.1 }}>{labels[k]}</div>
                        <div style={{ fontSize: 10.5, color: P.warmGray, fontStyle: "italic", marginTop: 2 }}>
                          {k === "height" ? "anchor" : "drafted"}
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
                        <div style={{ fontSize: 10, color: P.warmGray, marginTop: 4, fontStyle: "italic" }}>
                          {fmt(value)}
                        </div>
                      </div>
                      <div>
                        <div style={{
                          height: 4, borderRadius: 999, background: P.cream,
                          border: `1px solid rgba(45,55,42,0.10)`, overflow: "hidden",
                        }}>
                          <div style={{
                            width: `${Math.round(c * 100)}%`, height: "100%",
                            background: c >= 0.85 ? P.forest : c >= 0.7 ? P.olive : P.taupe,
                          }}/>
                        </div>
                        <div style={{ fontSize: 10, color: P.warmGray, marginTop: 4, fontStyle: "italic" }}>
                          {Math.round(c * 100)}% certain
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={onContinue} style={btnPrimary}>
            Accept this fit profile <IconArrow size={14}/>
          </button>
          <button onClick={onBack} style={btnGhost}>
            <IconRotate size={14}/> Retake the fitting
          </button>
        </div>
      </div>
    </div>
  );
}

function ScanCompletionStep({ onBack }) {
  return (
    <div style={{
      background: P.cream, border: `1px solid rgba(45,55,42,0.12)`,
      borderRadius: 4, padding: 36,
      boxShadow: "0 24px 60px rgba(45,55,42,0.06)",
    }}>
      <div style={{ fontSize: 10, color: P.warmGray, fontWeight: 700, letterSpacing: 2.6, textTransform: "uppercase", marginBottom: 10 }}>
        Atelier review
      </div>
      <div style={{ fontFamily: FONT_SERIF, fontSize: 34, color: P.ink, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1 }}>
        Your fit profile is composed.
      </div>
      <p style={{ marginTop: 14, color: P.inkSoft, fontSize: 15, lineHeight: 1.7, maxWidth: 720 }}>
        The figure below the suite now follows your numbers — adjust a slider and the rendering
        responds in kind, with the size recommendation refreshing alongside. Nothing leaves your
        browser in the preview.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
        <a href="#visualize" onClick={handleAnchorClick("visualize")} style={{ ...btnPrimary, textDecoration: "none" }}>
          See your figure <IconArrow size={14}/>
        </a>
        <a href="#alter" onClick={handleAnchorClick("alter")} style={{ ...btnGhost, textDecoration: "none" }}>
          Refine the garment
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
    <section id="visualize" style={{ padding: "120px 24px", background: P.parchment }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="The figure"
          title={<>Your silhouette, <em style={{ color: P.moss }}>rendered in confidence.</em></>}
          body="The figure on the right follows every number on the left — height, girth, length, width — and rotates between front, three-quarter, and side. A clear rendering, never a claim. A confidential reference for the atelier."
        />

        <div style={{
          marginTop: 40,
          display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.2fr)", gap: 28,
        }} className="tlc-tool-grid">
          {/* Controls */}
          <div style={{
            background: P.cream, border: `1px solid rgba(45,55,42,0.12)`,
            borderRadius: 4, padding: 28,
            boxShadow: "0 18px 50px rgba(45,55,42,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 10, color: P.warmGray, fontWeight: 700, letterSpacing: 2.6, textTransform: "uppercase" }}>
                  Adjust the numbers
                </div>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 24, color: P.ink, fontWeight: 500, marginTop: 6, letterSpacing: -0.3 }}>
                  Fit profile
                </div>
              </div>
              <UnitToggle unit={unit} setUnit={setUnit}/>
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              {fields.map(f => (
                <SliderRow key={f.k} field={f} unit={unit}
                  value={measurements[f.k]}
                  onChange={(v) => setMeasurements({ ...measurements, [f.k]: round1(v) })}/>
              ))}
            </div>
            <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => setMeasurements(DEFAULT_MEASUREMENTS)} style={btnGhost}>
                <IconRotate size={13}/> Return to baseline
              </button>
            </div>
          </div>

          {/* Avatar */}
          <div style={{
            background: P.cream, border: `1px solid rgba(45,55,42,0.12)`,
            borderRadius: 4, padding: 28,
            boxShadow: "0 18px 50px rgba(45,55,42,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 10, color: P.warmGray, fontWeight: 700, letterSpacing: 2.6, textTransform: "uppercase" }}>
                  {view === "three-quarter" ? "Three-quarter" : `${view} view`}
                </div>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 24, color: P.ink, fontWeight: 500, marginTop: 6, letterSpacing: -0.3 }}>
                  Your figure
                </div>
              </div>
              <ViewToggle view={view} setView={setView}/>
            </div>
            <BodyAvatar measurements={measurements} view={view} showCallouts/>
            <div style={{ marginTop: 14, fontSize: 12, color: P.warmGray, fontStyle: "italic", lineHeight: 1.6 }}>
              A composed rendering. The silhouette follows your stated measurements as a reference for the atelier — not a claim of a true cloth simulation.
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
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 13.5, color: P.ink, fontWeight: 500, fontFamily: FONT_SERIF, letterSpacing: -0.1 }}>{field.label}</div>
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
            borderRadius: 2, padding: "5px 10px",
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
    ["three-quarter", "¾"],
    ["side", "Side"],
  ];
  return (
    <div style={{
      display: "inline-flex", padding: 3, borderRadius: 999,
      background: P.parchment, border: `1px solid rgba(45,55,42,0.14)`,
    }}>
      {opts.map(([k, label]) => (
        <button key={k} onClick={() => setView(k)} style={{
          padding: "6px 14px", borderRadius: 999, border: "none", cursor: "pointer",
          background: view === k ? P.ink : "transparent",
          color: view === k ? P.cream : P.inkSoft,
          fontWeight: 600, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase",
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
    <section id="alter" style={{ padding: "120px 24px", background: `linear-gradient(180deg, ${P.parchment} 0%, ${P.beige} 100%)` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="IV — Refine the cut"
          title={<>Adjust the garment. <em style={{ color: P.moss }}>By hand, by eye.</em></>}
          body="Your measurements draw the figure; the maker's size chart draws the maison's recommendation. Adjust the hem, refine waist ease, set your preferred break — every gesture composes a precise alteration plan for the atelier."
        />

        {!product && (
          <div style={{
            marginTop: 28, padding: 22,
            background: P.cream, border: `1px solid rgba(45,55,42,0.12)`,
            borderRadius: 4, color: P.inkSoft, fontSize: 14, lineHeight: 1.6,
          }}>
            The garment is not yet in the room — <a href="#tool" onClick={handleAnchorClick("tool")} style={{ color: P.forestDeep, fontWeight: 600, fontFamily: FONT_SERIF, fontStyle: "italic" }}>begin a fitting</a> and we will compose the brief. The figure above remains at your disposal in the meantime.
          </div>
        )}

        {product && (
          <div style={{
            marginTop: 40,
            display: "grid",
            gridTemplateColumns: "minmax(0,1.05fr) minmax(0,0.95fr)",
            gap: 28,
          }} className="tlc-tool-grid">
            <div style={{
              background: P.cream, border: `1px solid rgba(45,55,42,0.12)`,
              borderRadius: 4, padding: 28,
              boxShadow: "0 24px 60px rgba(45,55,42,0.06)",
            }}>
              <ProductHeaderInline product={product} recommendation={recommendation}/>
              <div style={{
                marginTop: 16, display: "inline-flex", alignItems: "center", gap: 10,
                padding: "8px 14px", borderRadius: 999,
                background: "rgba(79,107,67,0.08)",
                border: `1px solid rgba(79,107,67,0.30)`,
                color: P.forestDeep, fontSize: 11, fontWeight: 600,
                letterSpacing: 1.8, textTransform: "uppercase",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: P.forest }}/>
                Adjust hem · refine waist · set sleeve
              </div>
              <div style={{ marginTop: 16 }}>
                <BodyAvatar
                  measurements={measurements}
                  alterations={alterations} setAlterations={setAlterations}
                  view="front" showGarment showHandles
                />
              </div>
              <div style={{ marginTop: 14, fontSize: 12, color: P.warmGray, fontStyle: "italic" }}>
                Every gesture writes itself into the alteration plan beside.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateRows: "auto auto auto 1fr", gap: 18 }}>
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
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2.6, color: P.warmGray, textTransform: "uppercase" }}>
          Maison · {product.retailer}
        </div>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 24, fontWeight: 500, color: P.ink, lineHeight: 1.1, marginTop: 6, letterSpacing: -0.3 }}>
          {product.name}
        </div>
      </div>
      <div style={{
        padding: "8px 14px", borderRadius: 2,
        background: P.ink,
        color: P.cream, fontSize: 10, fontWeight: 600, letterSpacing: 2.2,
        textTransform: "uppercase",
      }}>
        Atelier base · {recommendation?.recommended?.label ?? product.sizeRec}
      </div>
    </div>
  );
}

function SizingCard({ recommendation }) {
  if (!recommendation) {
    return (
      <div style={{
        background: P.cream, border: `1px solid rgba(45,55,42,0.12)`,
        borderRadius: 4, padding: 22,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.6, color: P.warmGray, textTransform: "uppercase" }}>
          Fit recommendation
        </div>
        <div style={{ marginTop: 12, color: P.inkSoft, fontSize: 13.5, fontStyle: "italic", lineHeight: 1.6 }}>
          Compose your fit profile to receive the atelier's reading.
        </div>
      </div>
    );
  }
  const { recommended, alternative, confidence } = recommendation;
  return (
    <div style={{
      background: P.cream, border: `1px solid rgba(45,55,42,0.12)`,
      borderRadius: 4, padding: 22,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.6, color: P.warmGray, textTransform: "uppercase" }}>
          Recommended base size
        </div>
        <div style={{ fontSize: 11, fontWeight: 500, color: P.forestDeep, fontFamily: FONT_SERIF, fontStyle: "italic" }}>
          {Math.round(confidence * 100)}% certain
        </div>
      </div>
      <div style={{ fontFamily: FONT_SERIF, fontSize: 32, color: P.ink, fontWeight: 500, lineHeight: 1.05, letterSpacing: -0.6 }}>
        {recommended.label}
      </div>
      {alternative && (
        <div style={{ marginTop: 8, fontSize: 13, color: P.inkSoft, fontStyle: "italic" }}>
          Or <strong style={{ fontStyle: "normal", color: P.ink }}>{alternative.label}</strong> for an easier line.
        </div>
      )}
      <div style={{
        marginTop: 14, height: 4, borderRadius: 999, background: P.parchment,
        border: `1px solid rgba(45,55,42,0.10)`, overflow: "hidden",
      }}>
        <div style={{
          width: `${Math.round(confidence * 100)}%`, height: "100%",
          background: confidence >= 0.85 ? P.forest : confidence >= 0.7 ? P.olive : P.taupe,
        }}/>
      </div>
      <div style={{ marginTop: 12, fontSize: 11.5, color: P.warmGray, lineHeight: 1.6, fontStyle: "italic" }}>
        Why this size — the atelier weighed your waist, hip, inseam, shoulder, and chest against
        the maker's chart and chose the closest reading across the critical lines.
      </div>
    </div>
  );
}

function FitRiskCard({ recommendation }) {
  const risks = recommendation?.risks ?? [];
  return (
    <div style={{
      background: P.cream, border: `1px solid rgba(45,55,42,0.12)`,
      borderRadius: 4, padding: 22,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.6, color: P.warmGray, textTransform: "uppercase", marginBottom: 12 }}>
        Atelier notes
      </div>
      {risks.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: P.forestDeep, fontSize: 13.5, fontWeight: 500, fontFamily: FONT_SERIF, fontStyle: "italic" }}>
          <IconCheck size={15}/> The cloth reads true to your profile.
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {risks.map((r, i) => (
            <li key={i} style={{
              padding: "12px 14px", background: P.parchment,
              border: `1px solid rgba(45,55,42,0.10)`, borderRadius: 2,
            }}>
              <div style={{ fontSize: 13, color: P.ink, fontWeight: 500, fontFamily: FONT_SERIF, letterSpacing: -0.1 }}>{r.label}</div>
              <div style={{ fontSize: 12.5, color: P.inkSoft, marginTop: 4, lineHeight: 1.55 }}>{r.detail}</div>
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
      ? `Lengthen the break by ${hemDelta.toFixed(1)}"`
      : `Shorten the inseam by ${Math.abs(hemDelta).toFixed(1)}"`);
  }
  if (Math.abs(waistDelta) >= 0.1) {
    lines.push(waistDelta < 0
      ? `Take in the waist by ${Math.abs(waistDelta).toFixed(1)}" at centre back`
      : `Let out the waist by ${waistDelta.toFixed(1)}"`);
  }
  if (Math.abs(sleeveDelta) >= 0.1) {
    lines.push(sleeveDelta > 0
      ? `Lengthen the sleeve by ${sleeveDelta.toFixed(1)}"`
      : `Shorten the sleeve by ${Math.abs(sleeveDelta).toFixed(1)}"`);
  }
  if (!lines.length) lines.push("The cloth is unaltered — adjust a handle on the figure to begin.");
  return lines;
}

function AlterationBrief({ alterations, brief, onReset }) {
  return (
    <div style={{
      background: P.cream, border: `1px solid rgba(45,55,42,0.12)`,
      borderRadius: 4, padding: 22,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.6, color: P.warmGray, textTransform: "uppercase" }}>
          Alteration plan · live
        </div>
        <button onClick={onReset} style={{
          background: "transparent", border: `1px solid rgba(45,55,42,0.18)`,
          padding: "5px 12px", borderRadius: 999, fontSize: 10, fontWeight: 600, color: P.inkSoft,
          cursor: "pointer", letterSpacing: 1.8, textTransform: "uppercase",
        }}>Clear</button>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
        {brief.map((line, i) => (
          <li key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            padding: "12px 14px",
            background: P.parchment,
            border: `1px solid rgba(45,55,42,0.10)`,
            borderRadius: 2,
            fontSize: 13.5, color: P.ink, lineHeight: 1.55,
            fontFamily: FONT_SERIF, letterSpacing: -0.1,
          }}>
            <span style={{ marginTop: 2, color: P.forest, flexShrink: 0 }}><IconScissors size={14}/></span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <div style={{
        marginTop: 14,
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10,
      }}>
        {[
          ["Hem", `${alterations.hemDelta > 0 ? "+" : ""}${alterations.hemDelta.toFixed(1)}"`],
          ["Waist", `${alterations.waistDelta > 0 ? "+" : ""}${alterations.waistDelta.toFixed(1)}"`],
          ["Sleeve", `${alterations.sleeveDelta > 0 ? "+" : ""}${alterations.sleeveDelta.toFixed(1)}"`],
        ].map(([k, v]) => (
          <div key={k} style={{
            padding: "10px 12px", borderRadius: 2,
            background: "rgba(79,107,67,0.08)",
            border: `1px solid rgba(79,107,67,0.22)`,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 9.5, color: P.warmGray, fontWeight: 600, letterSpacing: 2.2, textTransform: "uppercase" }}>{k}</div>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 19, fontWeight: 500, color: P.ink, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, fontSize: 11.5, color: P.warmGray, fontStyle: "italic", lineHeight: 1.55 }}>
        A tailor reads this plan against the cloth before a single thread is taken up.
      </div>
    </div>
  );
}

function SendToTailorCTA() {
  return (
    <div style={{
      background: P.ink,
      color: P.cream, borderRadius: 4, padding: 26,
      boxShadow: "0 18px 50px rgba(31,38,32,0.28)",
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2.6, textTransform: "uppercase", opacity: 0.65 }}>
        V — Send to the atelier
      </div>
      <div style={{ fontFamily: FONT_SERIF, fontSize: 26, fontWeight: 500, lineHeight: 1.1, marginTop: 8, letterSpacing: -0.4 }}>
        Entrust the piece.
      </div>
      <div style={{ fontSize: 13.5, opacity: 0.85, marginTop: 10, lineHeight: 1.65 }}>
        Order the garment from the maker in your own name. Submit your plan, and the concierge
        will guide its passage to the atelier — a private intake, a careful return.
      </div>
      <a href="#shipping" onClick={handleAnchorClick("shipping")} style={{
        marginTop: 18, display: "inline-flex", alignItems: "center", gap: 12,
        background: P.cream, color: P.ink,
        padding: "11px 20px", borderRadius: 2,
        textDecoration: "none", fontWeight: 600, fontSize: 11,
        letterSpacing: 2.2, textTransform: "uppercase",
      }}>Continue to concierge intake <IconArrow size={13}/></a>
    </div>
  );
}

// ─── Section header helper ───────────────────────────────
function SectionHeader({ eyebrow, title, body }) {
  return (
    <div style={{ maxWidth: 780 }}>
      <div style={{
        fontSize: 10.5, fontWeight: 600, letterSpacing: 3.2,
        color: P.forestDeep, textTransform: "uppercase", marginBottom: 18,
        display: "inline-flex", alignItems: "center", gap: 14,
      }}>
        <span style={{ width: 28, height: 1, background: P.forest }}/>
        {eyebrow}
      </div>
      <h2 style={{
        fontFamily: FONT_SERIF, fontSize: "clamp(34px, 4.2vw, 58px)",
        lineHeight: 1.05, letterSpacing: -1.4, color: P.ink, fontWeight: 400, margin: 0,
      }}>{title}</h2>
      {body && (
        <p style={{ marginTop: 22, fontSize: 17, color: P.inkSoft, lineHeight: 1.65, maxWidth: 640, fontWeight: 400 }}>
          {body}
        </p>
      )}
    </div>
  );
}

// ─── How it works ────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: "I", Icon: IconLink, title: "Share the garment", body: "Send a link to the piece you would like tailored. We read the maker's cut, cloth, and chart, and compose a private brief for the atelier." },
    { n: "II", Icon: IconRuler, title: "Compose your fit profile", body: "Two photographs, front and side, against your stated height — or enter measurements you already keep. Each line carries its own degree of certainty." },
    { n: "III", Icon: IconScissors, title: "Refine the cut by hand", body: "Adjust the hem, waist ease, sleeve, and break against a live preview of your figure. Every gesture is captured in measurement, ready for the workroom." },
    { n: "IV", Icon: IconBox, title: "Order in your own name", body: "You purchase the garment directly from the maker. We never take payment in your stead. Upload the confirmation so the concierge can attend its arrival." },
    { n: "V", Icon: IconTruck, title: "Concierge intake", body: "When the piece reaches you, place it in the prepaid mailer to our intake — 123 Main Street — addressed to the atelier." },
    { n: "VI", Icon: IconCheck, title: "Returned, ready to wear", body: "A tailor reviews your plan against the cloth, refines the cut by hand, and returns the finished piece to your door." },
  ];
  return (
    <section id="how" style={{ padding: "120px 24px", background: P.parchment }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="The atelier process"
          title={<>Six considered <em style={{ color: P.moss }}>movements.</em></>}
          body="The Tailored Company is a private tailoring service — not a shop, not a marketplace. You order the garment from the maker yourself; the atelier attends to the fitting, the alteration, and the return."
        />
        <div style={{
          marginTop: 48,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 18,
        }}>
          {steps.map(({ n, Icon, title, body }) => (
            <article key={n} style={{
              background: P.cream, border: `1px solid rgba(45,55,42,0.12)`,
              borderRadius: 4, padding: 28,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 2,
                  background: P.parchment,
                  border: `1px solid rgba(45,55,42,0.14)`,
                  color: P.forestDeep,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}><Icon size={20}/></div>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 24, color: P.taupe, fontWeight: 400, fontStyle: "italic", letterSpacing: 0.4 }}>{n}</div>
              </div>
              <h3 style={{ fontFamily: FONT_SERIF, fontSize: 22, color: P.ink, fontWeight: 500, lineHeight: 1.15, margin: 0, letterSpacing: -0.3 }}>{title}</h3>
              <p style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.65, color: P.inkSoft }}>{body}</p>
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
    <section id="shipping" style={{ padding: "120px 24px", background: `linear-gradient(180deg, ${P.parchment} 0%, ${P.beige} 100%)` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="V — Concierge intake"
          title={<>A private passage to <em style={{ color: P.moss }}>the atelier.</em></>}
          body="You purchase the garment from the maker in your own name; payment never passes through this house. Lodge your proof of order with the concierge, and we will attend to the cloth from intake to return."
        />

        <div style={{
          marginTop: 48,
          display: "grid",
          gridTemplateColumns: "minmax(0,1.05fr) minmax(0,0.95fr)",
          gap: 28,
        }} className="tlc-ship-grid">
          <div style={{
            background: P.cream, border: `1px solid rgba(45,55,42,0.12)`,
            borderRadius: 4, padding: 32,
            boxShadow: "0 20px 50px rgba(45,55,42,0.05)",
          }}>
            <div style={{ fontSize: 10, color: P.warmGray, fontWeight: 700, letterSpacing: 2.6, textTransform: "uppercase", marginBottom: 8 }}>
              Step one
            </div>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 26, color: P.ink, fontWeight: 500, marginBottom: 22, letterSpacing: -0.4 }}>
              Lodge proof of order
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              <Field label="Maison" placeholder="The Reformation" value={order.retailer} onChange={update("retailer")}/>
              <Field label="Order reference" placeholder="REF-104928" value={order.orderId} onChange={update("orderId")}/>
              <Field label="Carrier tracking" placeholder="1Z…" value={order.tracking} onChange={update("tracking")}/>
              <div>
                <label style={{ fontSize: 10, color: P.warmGray, fontWeight: 700, letterSpacing: 2.4, textTransform: "uppercase" }}>
                  Order confirmation
                </label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{
                    marginTop: 8, width: "100%",
                    background: P.parchment, border: `1px dashed rgba(45,55,42,0.22)`,
                    borderRadius: 2, padding: "18px 16px",
                    display: "flex", alignItems: "center", gap: 12,
                    color: P.inkSoft, fontWeight: 500, cursor: "pointer", fontSize: 13.5,
                    fontFamily: FONT_SERIF, fontStyle: proofName ? "normal" : "italic", letterSpacing: -0.1,
                  }}
                >
                  <IconUpload size={18}/>
                  {proofName ? proofName : "Attach a screenshot or PDF of your order"}
                </button>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onFile} style={{ display: "none" }}/>
                <div style={{ marginTop: 8, fontSize: 11.5, color: P.warmGray, fontStyle: "italic" }}>
                  In the preview the file remains on this page; nothing is transmitted.
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: `linear-gradient(135deg, ${P.cream}, ${P.oat})`,
            border: `1px solid rgba(45,55,42,0.12)`,
            borderRadius: 4, padding: 32,
            display: "flex", flexDirection: "column", gap: 18,
            boxShadow: "0 20px 50px rgba(45,55,42,0.05)",
          }}>
            <div>
              <div style={{ fontSize: 10, color: P.warmGray, fontWeight: 700, letterSpacing: 2.6, textTransform: "uppercase", marginBottom: 8 }}>
                Step two
              </div>
              <div style={{ fontFamily: FONT_SERIF, fontSize: 26, color: P.ink, fontWeight: 500, letterSpacing: -0.4 }}>
                Send the piece to the atelier
              </div>
            </div>
            <div style={{
              background: P.cream, borderRadius: 2, padding: 22,
              border: `1px solid rgba(45,55,42,0.14)`,
              position: "relative",
            }}>
              <div style={{ fontSize: 9.5, color: P.warmGray, fontWeight: 700, letterSpacing: 2.6, textTransform: "uppercase" }}>Intake address</div>
              <div style={{ height: 1, width: 28, background: P.taupe, margin: "10px 0" }}/>
              <div style={{ fontFamily: FONT_SERIF, fontSize: 22, color: P.ink, fontWeight: 500, marginTop: 4, letterSpacing: -0.2 }}>
                The Tailored Company
              </div>
              <div style={{ fontSize: 14, color: P.inkSoft, marginTop: 6, lineHeight: 1.65 }}>
                123 Main Street<br/>
                <span style={{ fontStyle: "italic", color: P.warmGray }}>Attn: Atelier intake</span>
              </div>
              <div style={{ marginTop: 14, fontSize: 11, color: P.warmGray, fontStyle: "italic", lineHeight: 1.55 }}>
                A temporary intake address — your full concierge label is issued upon confirmation.
              </div>
            </div>
            <ol style={{ padding: 0, margin: 0, listStyle: "none", color: P.inkSoft, fontSize: 14, lineHeight: 1.7, display: "grid", gap: 10 }}>
              {[
                "The maker's parcel reaches you.",
                "Place the piece in the prepaid mailer the concierge issues.",
                "The atelier reviews and alters — five to seven days, by hand.",
                "The finished piece is returned to your door.",
              ].map((t, i) => (
                <li key={i} style={{ display: "flex", gap: 14 }}>
                  <span style={{ fontFamily: FONT_SERIF, fontStyle: "italic", color: P.taupe, fontSize: 14, minWidth: 18 }}>{i + 1}.</span>
                  <span>{t}</span>
                </li>
              ))}
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
      <div style={{ fontSize: 10, color: P.warmGray, fontWeight: 700, letterSpacing: 2.4, textTransform: "uppercase" }}>
        {label}
      </div>
      <input
        type="text" placeholder={placeholder} value={value} onChange={onChange}
        style={{
          marginTop: 8, width: "100%",
          background: P.parchment, border: `1px solid rgba(45,55,42,0.14)`,
          borderRadius: 2, padding: "13px 16px",
          fontFamily: FONT_SANS, fontSize: 14, color: P.ink, outline: "none",
        }}
      />
    </label>
  );
}

// ─── Trust + FAQ + Footer ───────────────────────────────
function TrustSection() {
  const items = [
    { title: "A tailor reviews every plan", body: "The system drafts your alteration plan. A tailor reads the cloth, the seam allowance, and the feasibility of every line before scissors are lifted." },
    { title: "Made to wear longer", body: "A garment tailored to the body is worn more, returned less, and quietly outlasts the season's wardrobe." },
    { title: "Your fit profile stays yours", body: "Your measurements are used once, for your piece. Nothing is sold; nothing is shared." },
  ];
  return (
    <section style={{ padding: "120px 24px", background: P.parchment }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="The atelier promise"
          title={<>Made for <em style={{ color: P.moss }}>your</em> body, not the average.</>}
        />
        <div style={{
          marginTop: 48,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 18,
        }}>
          {items.map(({ title, body }) => (
            <article key={title} style={{
              background: P.cream, border: `1px solid rgba(45,55,42,0.12)`,
              borderRadius: 4, padding: 30,
            }}>
              <h3 style={{ fontFamily: FONT_SERIF, fontSize: 22, color: P.ink, fontWeight: 500, lineHeight: 1.2, margin: 0, letterSpacing: -0.3 }}>{title}</h3>
              <div style={{ height: 1, width: 28, background: P.taupe, margin: "14px 0" }}/>
              <p style={{ marginTop: 4, fontSize: 14, color: P.inkSoft, lineHeight: 1.7 }}>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "Is the service a website or an app?", a: "A website. The full experience lives here, on one private page. A companion application may be offered to returning patrons in time, but it is never required of you." },
    { q: "How does the measurement suite work?", a: "It is a private digital fitting — two composed photographs against a height anchor — drafting your measurements with a degree of certainty for each. The preview before you is fully simulated for your discretion; production fittings read only to measure, never to retain." },
    { q: "What does the figure render show me?", a: "Front, three-quarter, and side views, drawn from your stated measurements. The silhouette responds to your figures in real time — a confidential reference for the atelier, never a claim of a true cloth simulation." },
    { q: "How is the recommended size chosen?", a: "The atelier reads your waist, hip, inseam, shoulder, and chest against the maker's chart and selects the closest line across the critical measurements. Where the fit is uneasy, the notes will say so." },
    { q: "Why purchase the garment myself?", a: "The atelier never resells. You buy in your own name from the maker — keeping returns and provenance with you — and entrust the piece to us only for alteration." },
    { q: "Where is the atelier intake?", a: "The Tailored Company, 123 Main Street, addressed to Atelier intake. A full concierge label follows your confirmation, along with detailed instructions." },
    { q: "What does the refine step alter today?", a: "Hem and inseam, waist ease, and sleeve length. Shoulder, taper, and rise will join the suite in the next chapter of the atelier." },
    { q: "And my privacy?", a: "Your measurements remain in this browser throughout the preview. In production fittings, photographs are read only to measure, no account is asked of you, and your record may be cleared at any time. Nothing is shared or sold." },
  ];
  return (
    <section id="faq" style={{ padding: "120px 24px", background: `linear-gradient(180deg, ${P.beige} 0%, ${P.parchment} 100%)` }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <SectionHeader eyebrow="In quiet conversation" title={<>Questions, <em style={{ color: P.moss }}>kindly answered.</em></>}/>
        <div style={{ marginTop: 40, display: "grid", gap: 0, borderTop: `1px solid rgba(45,55,42,0.12)` }}>
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
      borderBottom: `1px solid rgba(45,55,42,0.12)`,
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", textAlign: "left",
        background: "transparent", border: "none", padding: "22px 4px",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        fontFamily: FONT_SANS,
      }}>
        <span style={{ fontFamily: FONT_SERIF, fontSize: 20, color: P.ink, fontWeight: 500, letterSpacing: -0.2, lineHeight: 1.3 }}>{q}</span>
        <span style={{ color: P.forestDeep, fontWeight: 300, fontSize: 22, fontFamily: FONT_SERIF, flexShrink: 0 }}>{open ? "—" : "+"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 4px 24px", color: P.inkSoft, fontSize: 14.5, lineHeight: 1.75, maxWidth: 720 }}>{a}</div>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer style={{
      background: P.ink, color: P.oat, padding: "72px 24px 48px",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gap: 36, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 22, fontWeight: 500, color: P.cream, letterSpacing: 0.3 }}>
              The Tailored Company
            </div>
            <div style={{ fontFamily: FONT_SERIF, fontStyle: "italic", fontSize: 13, color: P.sage, marginTop: 4 }}>
              A private digital atelier
            </div>
            <div style={{ marginTop: 18, fontSize: 13, opacity: 0.78, lineHeight: 1.7, maxWidth: 280 }}>
              A made-to-fit tailoring house for the pieces you already love. By invitation of the cloth.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2.6, textTransform: "uppercase", opacity: 0.55 }}>Atelier intake</div>
            <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.7 }}>
              123 Main Street<br/>
              <span style={{ fontStyle: "italic", opacity: 0.7 }}>Attn: Atelier intake</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2.6, textTransform: "uppercase", opacity: 0.55 }}>The fitting</div>
            <div style={{ marginTop: 12, display: "grid", gap: 8, fontSize: 13.5 }}>
              {[
                ["The fitting", "tool"],
                ["Measurement suite", "measure"],
                ["The figure", "visualize"],
                ["Refine the cut", "alter"],
                ["Atelier process", "how"],
                ["Concierge intake", "shipping"],
                ["FAQ", "faq"],
              ].map(([label, id]) => (
                <a key={id} href={`#${id}`} onClick={handleAnchorClick(id)} style={{ color: P.oat, textDecoration: "none", opacity: 0.78 }}>{label}</a>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2.6, textTransform: "uppercase", opacity: 0.55 }}>A quiet note</div>
            <div style={{ marginTop: 12, fontSize: 13, opacity: 0.78, lineHeight: 1.7, maxWidth: 260 }}>
              A companion application may be offered to returning patrons in time. For now, the website is the whole atelier.
            </div>
          </div>
        </div>
        <div style={{
          marginTop: 56, paddingTop: 24, borderTop: `1px solid rgba(255,255,255,0.08)`,
          display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between",
          fontSize: 11, opacity: 0.5, letterSpacing: 1.4, textTransform: "uppercase", fontWeight: 600,
        }}>
          <span>© The Tailored Company · Est. {new Date().getFullYear()}</span>
          <span style={{ fontFamily: FONT_SERIF, fontStyle: "italic", textTransform: "none", letterSpacing: 0.4, fontSize: 12 }}>
            measure once · cut by hand
          </span>
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
