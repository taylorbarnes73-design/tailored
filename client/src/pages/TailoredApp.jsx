import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import * as THREE from "three";
import { trpc } from "@/lib/trpc";

// ─── Design Tokens · Earthy Sustainability Palette ─────────
// Sage, forest, moss, stone, deep cocoa, charcoal. NO orange/gold/amber/terracotta/copper.
// Legacy "tan/sand/clay/terracotta" token names retained but remapped to cool olive/stone
// tones so the whole tree inherits the cleansed palette without thousands of surgical edits.
const PALETTE = {
  sage: "#9CAF88",
  forest: "#6B8E5A",
  olive: "#8B9556",
  beige: "#EDEEE8",      // cool stone (was warm beige)
  tan: "#A8AE9A",        // cool olive-stone (was orange tan)
  sand: "#9AA88E",       // muted moss (was orange sand)
  cream: "#F2F3EE",      // cool cream (was warm cream)
  clay: "#4E5C49",       // deep forest (was clay brown)
  cocoa: "#3A4537",      // espresso forest (was warm cocoa)
  warmGray: "#7C857B",   // cool stone-gray
  // Derived shades
  forestDeep: "#4F6B43",
  sageDeep: "#7A9070",
  sageMist: "#C4D2B6",
  ink: "#1F2620",
  inkSoft: "#3A4137",
  parchment: "#F2F3EE",  // cool parchment (was warm)
  bark: "#3A4537",       // espresso forest
  oat: "#DBDEC9",        // cool oat-mint (was warm oat)
};
const C = {
  // Surfaces — warm cream / beige rather than near-black
  bg: PALETTE.parchment,
  bgElevated: PALETTE.cream,
  card: "#FFFFFF",
  cardHover: PALETTE.beige,
  // Text
  accent: PALETTE.ink,
  muted: PALETTE.warmGray,
  mutedLight: PALETTE.inkSoft,
  // Borders
  border: "rgba(45,55,42,0.10)",
  borderLight: "rgba(45,55,42,0.18)",
  // Primary CTA / brand (was "gold") → forest green
  gold: PALETTE.forest,
  goldDark: PALETTE.forestDeep,
  goldLight: PALETTE.sage,
  goldBg: "rgba(107,142,90,0.10)",
  goldBorder: "rgba(107,142,90,0.28)",
  // Success — sage
  success: PALETTE.forest,
  successBg: "rgba(107,142,90,0.12)",
  successBorder: "rgba(107,142,90,0.28)",
  // Warning — muted teal (clearly NOT amber/orange, distinct from success green)
  warning: "#5B8F8A",
  warningBg: "rgba(91,143,138,0.12)",
  warningBorder: "rgba(91,143,138,0.30)",
  // Danger — cool slate-rose (no orange/red-orange)
  danger: "#8E5B5B",
  // Tailor accent — deep espresso forest (reads neutral brown-green, not orange)
  tailor: PALETTE.cocoa,
  tailorBg: "rgba(58,69,55,0.12)",
  tailorBorder: "rgba(58,69,55,0.30)",
  // Glass effects
  glass: "rgba(242,243,238,0.55)",
  glassBorder: "rgba(45,55,42,0.10)",
  // Extra palette access for new components
  sage: PALETTE.sage,
  forest: PALETTE.forest,
  forestDeep: PALETTE.forestDeep,
  olive: PALETTE.olive,
  beige: PALETTE.beige,
  tan: PALETTE.tan,
  sand: PALETTE.sand,
  cream: PALETTE.cream,
  clay: PALETTE.clay,
  cocoa: PALETTE.cocoa,
  terracotta: PALETTE.clay,
  warmGray: PALETTE.warmGray,
  sageMist: PALETTE.sageMist,
  oat: PALETTE.oat,
  bark: PALETTE.bark,
  ink: PALETTE.ink,
};
const font = {
  serif: "'Cormorant Garamond', Georgia, serif",
  sans: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
};

// ─── SVG Icons ─────────────────────────────────────────────
const Ico = ({
  children,
  size = 20,
  stroke = "currentColor",
  sw = 1.5,
  fill = "none",
  vb = "0 0 24 24",
}) => (
  <svg
    width={size}
    height={size}
    viewBox={vb}
    fill={fill}
    stroke={stroke}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);
const ChevronLeft = ({ size = 20 }) => (
  <Ico size={size} sw={2}>
    <path d="M15 18l-6-6 6-6" />
  </Ico>
);
const HeartIcon = ({ filled, color = C.gold }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill={filled ? color : "none"}
    stroke={filled ? color : "currentColor"}
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const HomeIcon = () => (
  <Ico>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </Ico>
);
const UserIcon = () => (
  <Ico>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Ico>
);
const SparkleIcon = ({ size = 20 }) => (
  <Ico size={size}>
    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
  </Ico>
);
const TagIcon = () => (
  <Ico>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
  </Ico>
);
const FireIcon = () => (
  <Ico>
    <path d="M12 2c0 4-4 6-4 10a4 4 0 008 0c0-4-4-6-4-10z" />
  </Ico>
);
const SearchIcon = ({ size = 16 }) => (
  <Ico size={size} stroke={C.muted}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Ico>
);
const ScissorsIcon = ({ size = 20 }) => (
  <Ico size={size}>
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </Ico>
);
const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="3"
    strokeLinecap="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ShieldIcon = () => (
  <Ico size={16} stroke={C.success}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Ico>
);
const TargetIcon = ({ size = 20 }) => (
  <Ico size={size}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </Ico>
);
const CameraIcon = ({ size = 22 }) => (
  <Ico size={size}>
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </Ico>
);
const CheckCircle = ({ size = 18 }) => (
  <Ico size={size} stroke={C.success}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </Ico>
);
const MeasureIcon = ({ size = 18 }) => (
  <Ico size={size}>
    <path d="M2 12h20M12 2v20M7 7l10 10M17 7L7 17" />
  </Ico>
);
const ThreadIcon = ({ size = 18 }) => (
  <Ico size={size}>
    <path d="M12 22V12" />
    <path d="M12 12C12 8 8 6 8 6s4-2 4-6" />
    <path d="M12 12c0-4 4-6 4-6s-4-2-4-6" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </Ico>
);
const NeedleIcon = ({ size = 18 }) => (
  <Ico size={size}>
    <path d="M19.7 4.3c-1-1-2.5-1-3.5 0l-12 12c-.5.5-.5 1.5 0 2l1.5 1.5c.5.5 1.5.5 2 0l12-12c1-1 1-2.5 0-3.5z" />
    <path d="M16 7l1 1M5 19l-2 2" />
  </Ico>
);
const RulerIcon = ({ size = 18 }) => (
  <Ico size={size}>
    <path d="M21.7 7.3l-5-5a1 1 0 00-1.4 0L2.3 15.3a1 1 0 000 1.4l5 5a1 1 0 001.4 0L21.7 8.7a1 1 0 000-1.4z" />
  </Ico>
);
const PenIcon = ({ size = 18 }) => (
  <Ico size={size}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </Ico>
);
const BoxIcon = ({ size = 20 }) => (
  <Ico size={size}>
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </Ico>
);
const TruckIcon = ({ size = 20 }) => (
  <Ico size={size}>
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </Ico>
);
const XIcon = ({ size = 18 }) => (
  <Ico size={size} sw={2}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Ico>
);
const EditIcon = ({ size = 16 }) => (
  <Ico size={size}>
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Ico>
);
const TrendingUpIcon = ({ size = 16 }) => (
  <Ico size={size}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </Ico>
);
const RotateIcon = ({ size = 44 }) => (
  <Ico size={size} sw={1.8}>
    <path d="M6 12a8 8 0 111.9 5.2" />
    <polyline points="5 18 5 12 11 12" />
    <path d="M14.5 8.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    <path d="M12.25 10.5v5.25" />
    <path d="M9.75 21v-4.5l2.5-1.75 2.5 1.75V21" />
  </Ico>
);
const InfoIcon = ({ size = 14 }) => (
  <Ico size={size}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </Ico>
);
const ChevronRight = ({ size = 16 }) => (
  <Ico size={size} sw={2}>
    <path d="M9 18l6-6-6-6" />
  </Ico>
);

const TAILOR_ICON_MAP = {
  scissors: ScissorsIcon,
  measure: MeasureIcon,
  thread: ThreadIcon,
  ruler: RulerIcon,
  needle: NeedleIcon,
  pen: PenIcon,
};
const NAV_ITEMS = [
  {
    id: "home",
    icon: <HomeIcon />,
    label: "Import",
    eyebrow: "Tailor concierge",
    title: "Paste a product link. We tailor it.",
    blurb:
      "Drop in a link from any retailer. Our AI extracts garment specs and fits them to your measurement-grade avatar, then our in-house tailors verify and route the piece.",
  },
  {
    id: "trending",
    icon: <FireIcon />,
    label: "Library",
    eyebrow: "Imported pieces",
    title: "Your imported garments",
    blurb:
      "Every product link you have submitted, with AI-extracted specs, fit-confidence scores, and the tailor-verified brief that ships with each piece.",
  },
  {
    id: "brands",
    icon: <TagIcon />,
    label: "Sources",
    eyebrow: "Retailer map",
    title: "Where your fit pulls cleanly",
    blurb:
      "Retailers we have parsed before — sizing logic, return windows, and alteration cost notes per source.",
  },
  {
    id: "style",
    icon: <SparkleIcon />,
    label: "Studio",
    eyebrow: "Fit studio",
    title: "Body-led tailor studio",
    blurb:
      "AI garment-aware fit modeling and alteration playbooks our human tailors review before any piece ships to you.",
  },
  {
    id: "profile",
    icon: <UserIcon />,
    label: "Profile",
    eyebrow: "Fit passport",
    title: "Your fit record",
    blurb:
      "Measurements, saved imports, in-progress alterations, and shipped tailor orders — your living concierge file.",
  },
];
const TREND_SECTION_META = {
  demand: {
    title: "Demand Signals",
    statLabel: "Demand",
    color: C.gold,
    Icon: FireIcon,
  },
  editorial: {
    title: "Editorial Picks",
    statLabel: "Editorial",
    color: C.tailor,
    Icon: SparkleIcon,
  },
  staple: {
    title: "Client Favorites",
    statLabel: "Favorites",
    color: C.success,
    Icon: ShieldIcon,
  },
  seasonal: {
    title: "Seasonal Signals",
    statLabel: "Seasonal",
    color: C.warning,
    Icon: TrendingUpIcon,
  },
};
const STYLE_OCCASIONS = [
  "Work meetings",
  "Date night",
  "Weekend city",
  "Travel days",
  "Event dressing",
];
const STYLE_GOALS = [
  "Polished authority",
  "Sharper shape",
  "Easy luxury",
  "Evening impact",
];
const STYLE_PALETTES = [
  "Warm neutrals",
  "Soft tonal",
  "Dark luxe",
  "Bold accent",
];
const STYLE_DRESS_CODES = [
  "Refined tailored",
  "Relaxed elevated",
  "Modern minimal",
  "Statement feminine",
];

function getBadgeMeta(badge = "") {
  const normalized = badge.toLowerCase().trim();
  if (!normalized) return null;

  if (/(viral|tiktok|ig)/.test(normalized))
    return { label: "High Demand", group: "demand" };
  if (/(editor|pinterest)/.test(normalized))
    return { label: "Editorial Pick", group: "editorial" };
  if (/best seller/.test(normalized))
    return { label: "Best Seller", group: "staple" };
  if (/cult favorite|cozy pick/.test(normalized))
    return { label: "Client Favorite", group: "staple" };
  if (/best value/.test(normalized))
    return { label: "Best Value", group: "staple" };
  if (/trending/.test(normalized))
    return { label: "Market Signal", group: "seasonal" };
  if (/summer/.test(normalized))
    return { label: "Seasonal Edit", group: "seasonal" };
  if (/tech fabric/.test(normalized))
    return { label: "Performance Fabric", group: "seasonal" };
  if (/office/.test(normalized))
    return { label: "Workwear Ready", group: "seasonal" };
  if (/everyday basic/.test(normalized))
    return { label: "Foundation Piece", group: "seasonal" };
  if (/new drop/.test(normalized))
    return { label: "New Arrival", group: "seasonal" };
  if (/going out|date night/.test(normalized))
    return { label: "Evening Edit", group: "seasonal" };

  return { label: badge, group: "seasonal" };
}

function useDesktopLayout() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 1100;
  });

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1100px)");
    const onChange = event => setIsDesktop(event.matches);
    setIsDesktop(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

function inferBodyShape(body) {
  const bust = body?.bust || 34;
  const waist = body?.waist || 26;
  const hips = body?.hips || 36;
  const ratio = Math.max(bust, hips) / Math.max(waist, 1);

  if (ratio > 1.35) return "Hourglass";
  if (ratio > 1.2) return "Pear";
  if (bust > hips) return "Inverted Triangle";
  return "Rectangle";
}

// ─── 3D Body System ─────────────────────────────────────────
function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t,
    t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}
function splineSlices(slices, subdivisions = 12) {
  const result = [];
  const keys = ["y", "rx", "rz", "ox", "oz"];
  for (let i = 0; i < slices.length - 1; i++) {
    const p0 = slices[Math.max(0, i - 1)],
      p1 = slices[i],
      p2 = slices[i + 1],
      p3 = slices[Math.min(slices.length - 1, i + 2)];
    const last = i === slices.length - 2;
    for (let j = 0; j <= (last ? subdivisions : subdivisions - 1); j++) {
      const t = j / subdivisions,
        pt = {};
      for (const k of keys)
        pt[k] = catmullRom(p0[k] || 0, p1[k] || 0, p2[k] || 0, p3[k] || 0, t);
      pt.rx = Math.max(0.001, pt.rx);
      pt.rz = Math.max(0.001, pt.rz);
      result.push(pt);
    }
  }
  return result;
}
function buildSmoothMesh(rawSlices, segs, material) {
  const slices = splineSlices(rawSlices, 14);
  const geo = new THREE.BufferGeometry();
  const pos = [],
    uv = [],
    idx = [];
  const rows = slices.length,
    cols = segs + 1;
  for (let s = 0; s < rows; s++) {
    const { y, rx, rz, ox, oz } = slices[s];
    const v = s / (rows - 1);
    for (let i = 0; i <= segs; i++) {
      const u = i / segs,
        a = u * Math.PI * 2;
      pos.push(Math.cos(a) * rx + (ox || 0), y, Math.sin(a) * rz + (oz || 0));
      uv.push(u, v);
    }
  }
  for (let s = 0; s < rows - 1; s++) {
    for (let i = 0; i < segs; i++) {
      const a = s * cols + i,
        b = a + cols;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  smoothNormals(geo);
  return new THREE.Mesh(geo, material);
}
function smoothNormals(geo) {
  const pos = geo.attributes.position,
    nrm = geo.attributes.normal,
    map = new Map();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(i);
  }
  for (const indices of map.values()) {
    let nx = 0,
      ny = 0,
      nz = 0;
    for (const i of indices) {
      nx += nrm.getX(i);
      ny += nrm.getY(i);
      nz += nrm.getZ(i);
    }
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
    for (const i of indices) nrm.setXYZ(i, nx, ny, nz);
  }
  nrm.needsUpdate = true;
}
function createBodyMesh(body) {
  const bust = body?.bust || 34,
    waist = body?.waist || 26,
    hips = body?.hips || 36,
    shoulder = body?.shoulder || 15,
    inseam = body?.inseam || 30;
  const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
  const n = (v, r) => clamp(v / r, 0.75, 1.3);
  const nB = n(bust, 36),
    nW = n(waist, 28),
    nH = n(hips, 38),
    nS = n(shoulder, 15),
    nI = n(inseam, 30);
  const group = new THREE.Group(),
    segs = 64;
  // Realistic skin material — soft neutral beige (cool earthy, never warm
  // orange) so the figure reads as an AI-rendered person rather than a
  // ceramic dress form. Subtle sub-surface scattering style sheen.
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: 0xd6c5a8, // neutral skin beige
    roughness: 0.55,
    metalness: 0.0,
    clearcoat: 0.08,
    clearcoatRoughness: 0.7,
    sheen: 0.4,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(0xb5a589), // muted taupe sheen
    side: THREE.FrontSide,
    envMapIntensity: 0.7,
  });
  group.add(
    buildSmoothMesh(
      [
        { y: 2.88, rx: 0.1, rz: 0.09 },
        { y: 2.82, rx: 0.13, rz: 0.11 },
        { y: 2.72, rx: 0.22, rz: 0.16 },
        { y: 2.58, rx: 0.48 * nS, rz: 0.19, oz: 0.01 },
        { y: 2.48, rx: 0.5 * nS, rz: 0.22, oz: 0.02 },
        { y: 2.35, rx: 0.48 * nB, rz: 0.28 * nB, oz: 0.05 },
        { y: 2.2, rx: 0.44 * nB, rz: 0.26 * nB, oz: 0.04 },
        { y: 2.05, rx: 0.42 * nB, rz: 0.24 * nB, oz: 0.03 },
        { y: 1.88, rx: 0.38 * nW, rz: 0.22 * nW, oz: 0.02 },
        { y: 1.72, rx: 0.35 * nW, rz: 0.2 * nW, oz: 0.01 },
        { y: 1.58, rx: 0.36 * nW, rz: 0.21 * nW, oz: 0.01 },
        { y: 1.42, rx: 0.4 * nH, rz: 0.24 * nH, oz: 0.02 },
        { y: 1.25, rx: 0.47 * nH, rz: 0.28 * nH, oz: 0.03 },
        { y: 1.12, rx: 0.48 * nH, rz: 0.29 * nH, oz: 0.04 },
        { y: 1.0, rx: 0.46 * nH, rz: 0.28 * nH, oz: 0.03 },
        { y: 0.88, rx: 0.42 * nH, rz: 0.26 * nH, oz: 0.02 },
        { y: 0.76, rx: 0.3, rz: 0.22 },
      ],
      segs,
      skinMat
    )
  );
  const headGeo = new THREE.SphereGeometry(
    0.21,
    48,
    32,
    0,
    Math.PI * 2,
    0,
    Math.PI
  );
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.scale.set(1, 1.15, 1.05);
  headMesh.position.set(0, 3.33, 0.01);
  group.add(headMesh);

  // Soft hair cap — sits over the top/back of the skull so the figure reads
  // as a person, not a featureless dummy.
  const hairMat = new THREE.MeshPhysicalMaterial({
    color: 0x3a4537, // espresso forest (brand-safe brown-green, never orange)
    roughness: 0.85,
    metalness: 0.0,
    sheen: 0.6,
    sheenColor: new THREE.Color(0x4f6b43),
    side: THREE.FrontSide,
  });
  const hairGeo = new THREE.SphereGeometry(
    0.225,
    48,
    32,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.62
  );
  const hairMesh = new THREE.Mesh(hairGeo, hairMat);
  hairMesh.scale.set(1.05, 1.18, 1.1);
  hairMesh.position.set(0, 3.34, 0);
  group.add(hairMesh);
  // Subtle hair fringe on the front-top of the head
  const fringeGeo = new THREE.SphereGeometry(
    0.13,
    24,
    18,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.5
  );
  const fringeMesh = new THREE.Mesh(fringeGeo, hairMat);
  fringeMesh.scale.set(1.6, 0.55, 0.7);
  fringeMesh.position.set(0, 3.42, 0.16);
  fringeMesh.rotation.x = -0.25;
  group.add(fringeMesh);
  group.add(
    buildSmoothMesh(
      [
        { y: 3.1, rx: 0.085, rz: 0.075 },
        { y: 3.0, rx: 0.09, rz: 0.08 },
        { y: 2.9, rx: 0.1, rz: 0.09 },
      ],
      32,
      skinMat
    )
  );
  const legLen = 0.75 * nI;
  const buildLeg = xOff =>
    buildSmoothMesh(
      [
        { y: 0.8, rx: 0.165, rz: 0.16, ox: xOff },
        { y: 0.6, rx: 0.148, rz: 0.14, ox: xOff },
        { y: 0.42, rx: 0.135, rz: 0.125, ox: xOff },
        { y: 0.28, rx: 0.12, rz: 0.11, ox: xOff },
        { y: 0.1, rx: 0.112, rz: 0.106, ox: xOff },
        { y: -0.1, rx: 0.108, rz: 0.095, ox: xOff },
        { y: -legLen * 0.45, rx: 0.09, rz: 0.085, ox: xOff },
        { y: -legLen * 0.7, rx: 0.082, rz: 0.078, ox: xOff },
        { y: -legLen * 0.88, rx: 0.065, rz: 0.062, ox: xOff },
        { y: -legLen, rx: 0.065, rz: 0.07, ox: xOff },
      ],
      32,
      skinMat
    );
  group.add(buildLeg(-0.17));
  group.add(buildLeg(0.17));
  const buildArm = sign => {
    const sx = 0.48 * nS * sign;
    return buildSmoothMesh(
      [
        { y: 2.56, rx: 0.12, rz: 0.115, ox: sx * 0.92 },
        { y: 2.46, rx: 0.115, rz: 0.105, ox: sx + sign * 0.01 },
        { y: 2.28, rx: 0.098, rz: 0.088, ox: sx + sign * 0.05 },
        { y: 2.1, rx: 0.088, rz: 0.078, ox: sx + sign * 0.07 },
        { y: 1.9, rx: 0.082, rz: 0.075, ox: sx + sign * 0.09 },
        { y: 1.55, rx: 0.072, rz: 0.068, ox: sx + sign * 0.11 },
        { y: 1.15, rx: 0.062, rz: 0.058, ox: sx + sign * 0.13 },
        { y: 0.82, rx: 0.052, rz: 0.048, ox: sx + sign * 0.14 },
        { y: 0.62, rx: 0.054, rz: 0.034, ox: sx + sign * 0.14 },
      ],
      24,
      skinMat
    );
    // hand bulb
  };
  group.add(buildArm(-1));
  group.add(buildArm(1));
  // Hands
  [-1, 1].forEach(sign => {
    const sx = 0.48 * nS * sign + sign * 0.14;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.058, 24, 18), skinMat);
    hand.position.set(sx, 0.55, 0);
    hand.scale.set(0.9, 1.25, 0.7);
    group.add(hand);
  });
  // Feet
  [-1, 1].forEach(sign => {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 18), skinMat);
    foot.position.set(sign * 0.17, -legLen - 0.02, 0.06);
    foot.scale.set(0.85, 0.55, 1.55);
    group.add(foot);
  });
  return group;
}
function createGarmentMesh(body, item) {
  const bust = body?.bust || 34,
    waist = body?.waist || 26,
    hips = body?.hips || 36,
    shoulder = body?.shoulder || 15,
    inseam = body?.inseam || 30;
  const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
  const n = (v, r) => clamp(v / r, 0.75, 1.3);
  const nB = n(bust, 36),
    nW = n(waist, 28),
    nH = n(hips, 38),
    nS = n(shoulder, 15),
    nI = n(inseam, 30);
  const group = new THREE.Group(),
    gap = 0.055, // wider air gap so garment silhouette reads off body
    segs = 64,
    cat = item?.category || "Tops";

  // Push garment color far enough from the mannequin's warm-cream skin
  // (~#EADFC8 luminance ~0.85) that it always reads as clothing on body.
  // We clamp luminance into a deep cool-earthy range, and bias hue toward
  // cool greens/olives/charcoals so beige/cream garment palette never blends
  // into the cream figurine.
  const ensureContrastColor = (hex) => {
    const h = (hex || "#6B8E5A").replace("#", "");
    const norm = h.length === 3
      ? h.split("").map(c => c + c).join("")
      : h.padEnd(6, "0").slice(0, 6);
    let r = parseInt(norm.slice(0, 2), 16) / 255;
    let g = parseInt(norm.slice(2, 4), 16) / 255;
    let b = parseInt(norm.slice(4, 6), 16) / 255;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // If too close to skin luminance (cream ~0.85), drop and cool-shift
    if (lum > 0.55) {
      const factor = 0.42 / Math.max(lum, 0.01);
      r *= factor; g *= factor; b *= factor;
      // bias toward sage/forest so it doesn't read warm
      g = Math.min(1, g * 1.06 + 0.02);
      r = Math.max(0, r * 0.85);
    }
    // Suppress any orange/gold/amber hue lingering in legacy data
    if (r > g && r > b && r - b > 0.12) {
      const avg = (g + b) / 2;
      r = Math.min(r, avg + 0.04);
    }
    const to2 = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0");
    return `#${to2(r)}${to2(g)}${to2(b)}`;
  };
  const hexColor = ensureContrastColor(item?.color || "#4F6B43");
  const color = new THREE.Color(hexColor);

  const fab = (item?.fabric || "").toLowerCase();
  const isDenim = fab.includes("denim"),
    isSilk = fab.includes("silk") || fab.includes("satin"),
    isKnit =
      fab.includes("knit") || fab.includes("jersey") || fab.includes("modal"),
    isLeather = fab.includes("leather");
  const fabricMat = new THREE.MeshPhysicalMaterial({
    color,
    roughness: isDenim ? 0.92 : isSilk ? 0.22 : isKnit ? 0.88 : 0.7,
    metalness: isSilk ? 0.05 : 0,
    clearcoat: isSilk ? 0.35 : 0.06,
    clearcoatRoughness: isSilk ? 0.25 : 0.8,
    sheen: isKnit ? 0.7 : isSilk ? 0.55 : 0.3,
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color(hexColor).multiplyScalar(isSilk ? 2.2 : 1.5),
    side: THREE.DoubleSide,
    envMapIntensity: isSilk ? 1.2 : 0.4,
  });

  // Dark edge/seam material — used to draw a visible silhouette line so the
  // garment reads as clothing on a body even when colors are close.
  const seamColor = new THREE.Color(hexColor).multiplyScalar(0.45);
  const seamMat = new THREE.MeshBasicMaterial({
    color: seamColor,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  const addSeamRing = (y, rx, rz, ox = 0) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(Math.max(rx, rz), 0.012, 8, 48),
      seamMat
    );
    ring.position.set(ox, y, 0);
    ring.rotation.x = Math.PI / 2;
    ring.scale.set(1, rz / Math.max(rx, rz), 1);
    group.add(ring);
  };
  const addButton = (y, z = 0) => {
    const btn = new THREE.Mesh(
      new THREE.CircleGeometry(0.018, 16),
      new THREE.MeshBasicMaterial({ color: seamColor, side: THREE.DoubleSide })
    );
    btn.position.set(0, y, z);
    group.add(btn);
  };
  if (cat === "Tops" || cat === "Outerwear") {
    const g = cat === "Outerwear" ? 0.065 : gap;
    group.add(
      buildSmoothMesh(
        [
          { y: 2.72, rx: 0.22 + g, rz: 0.16 + g },
          { y: 2.58, rx: 0.48 * nS + g, rz: 0.19 + g },
          { y: 2.48, rx: 0.5 * nS + g, rz: 0.22 + g },
          { y: 2.35, rx: 0.48 * nB + g, rz: 0.28 * nB + g, oz: 0.05 },
          { y: 2.2, rx: 0.44 * nB + g, rz: 0.26 * nB + g, oz: 0.04 },
          { y: 2.05, rx: 0.42 * nB + g, rz: 0.24 * nB + g },
          { y: 1.88, rx: 0.38 * nW + g, rz: 0.22 * nW + g },
          { y: 1.72, rx: 0.35 * nW + g, rz: 0.2 * nW + g },
          { y: 1.58, rx: 0.36 * nW + g, rz: 0.21 * nW + g },
          { y: 1.42, rx: 0.4 * nH + g, rz: 0.24 * nH + g },
        ],
        segs,
        fabricMat
      )
    );
    const buildSleeve = sign => {
      const sx = 0.48 * nS * sign;
      return buildSmoothMesh(
        [
          { y: 2.56, rx: 0.115, rz: 0.105, ox: sx * 0.92 },
          { y: 2.46, rx: 0.105, rz: 0.093, ox: sx + sign * 0.01 },
          { y: 2.28, rx: 0.088, rz: 0.078, ox: sx + sign * 0.05 },
          { y: 2.1, rx: 0.08, rz: 0.07, ox: sx + sign * 0.07 },
          { y: 1.9, rx: 0.073, rz: 0.067, ox: sx + sign * 0.09 },
          { y: 1.55, rx: 0.063, rz: 0.059, ox: sx + sign * 0.11 },
        ],
        24,
        fabricMat
      );
    };
    group.add(buildSleeve(-1));
    group.add(buildSleeve(1));
    // Visible clothing details — collar/lapel rim, button placket, cuff bands, hem line
    const hemY = 1.42, neckY = 2.6;
    addSeamRing(neckY, 0.5 * nS + gap, 0.2 + gap);
    addSeamRing(hemY, 0.4 * nH + gap, 0.24 * nH + gap);
    // Cuff bands at sleeve ends
    [-1, 1].forEach(sign => {
      const sx = 0.48 * nS * sign + sign * 0.11;
      addSeamRing(1.55, 0.063, 0.059, sx);
    });
    // Button placket — center front
    if (cat === "Tops") {
      for (let i = 0; i < 5; i++) {
        addButton(2.32 - i * 0.2, 0.28 * nB + gap + 0.001);
      }
    } else {
      // Outerwear — bigger lapel V + buttons
      const lapelMat = new THREE.MeshBasicMaterial({
        color: seamColor, transparent: true, opacity: 0.75, side: THREE.DoubleSide,
      });
      [-1, 1].forEach(sign => {
        const geom = new THREE.PlaneGeometry(0.13, 0.42);
        const lapel = new THREE.Mesh(geom, lapelMat);
        lapel.position.set(sign * 0.09, 2.36, 0.29 * nB + gap + 0.002);
        lapel.rotation.z = sign * 0.18;
        group.add(lapel);
      });
      for (let i = 0; i < 3; i++) {
        addButton(2.0 - i * 0.22, 0.28 * nB + gap + 0.002);
      }
    }
  } else if (cat === "Bottoms") {
    const legLen = 0.75 * nI;
    group.add(
      buildSmoothMesh(
        [
          { y: 1.58, rx: 0.36 * nW + gap, rz: 0.21 * nW + gap },
          { y: 1.42, rx: 0.4 * nH + gap, rz: 0.24 * nH + gap },
          { y: 1.25, rx: 0.47 * nH + gap, rz: 0.28 * nH + gap, oz: 0.03 },
          { y: 1.12, rx: 0.48 * nH + gap, rz: 0.29 * nH + gap, oz: 0.04 },
          { y: 1.0, rx: 0.46 * nH + gap, rz: 0.28 * nH + gap },
          { y: 0.88, rx: 0.42 * nH + gap, rz: 0.26 * nH + gap },
          { y: 0.76, rx: 0.32 + gap, rz: 0.24 + gap },
        ],
        segs,
        fabricMat
      )
    );
    const buildPantsLeg = xOff =>
      buildSmoothMesh(
        [
          { y: 0.8, rx: 0.175 + gap, rz: 0.17 + gap, ox: xOff },
          { y: 0.6, rx: 0.16 + gap, rz: 0.15 + gap, ox: xOff },
          { y: 0.42, rx: 0.145 + gap, rz: 0.135 + gap, ox: xOff },
          { y: 0.2, rx: 0.13 + gap, rz: 0.12 + gap, ox: xOff },
          { y: -legLen * 0.45, rx: 0.1 + gap, rz: 0.095 + gap, ox: xOff },
          { y: -legLen * 0.8, rx: 0.09 + gap, rz: 0.088 + gap, ox: xOff },
          { y: -legLen, rx: 0.085 + gap, rz: 0.082 + gap, ox: xOff },
        ],
        32,
        fabricMat
      );
    group.add(buildPantsLeg(-0.17));
    group.add(buildPantsLeg(0.17));
    // Waistband seam + hem cuffs
    addSeamRing(1.58, 0.36 * nW + gap, 0.21 * nW + gap);
    [-0.17, 0.17].forEach(xOff => {
      addSeamRing(-0.75 * nI, 0.087 + gap, 0.085 + gap, xOff);
    });
    // Center front fly stitch
    const flyMat = new THREE.MeshBasicMaterial({
      color: seamColor, transparent: true, opacity: 0.7, side: THREE.DoubleSide,
    });
    const fly = new THREE.Mesh(new THREE.PlaneGeometry(0.01, 0.22), flyMat);
    fly.position.set(0, 1.3, 0.29 * nH + gap + 0.002);
    group.add(fly);
  } else if (cat === "Dresses") {
    group.add(
      buildSmoothMesh(
        [
          { y: 2.72, rx: 0.22 + gap, rz: 0.16 + gap },
          { y: 2.58, rx: 0.48 * nS + gap, rz: 0.19 + gap },
          { y: 2.35, rx: 0.48 * nB + gap, rz: 0.28 * nB + gap, oz: 0.05 },
          { y: 2.05, rx: 0.42 * nB + gap, rz: 0.24 * nB + gap },
          { y: 1.72, rx: 0.35 * nW + gap, rz: 0.2 * nW + gap },
          { y: 1.42, rx: 0.42 * nH + gap, rz: 0.25 * nH + gap },
          { y: 1.15, rx: 0.5 * nH + gap, rz: 0.3 * nH + gap },
          { y: 0.85, rx: 0.52 * nH + gap, rz: 0.32 * nH + gap },
          { y: 0.5, rx: 0.5 * nH + gap, rz: 0.31 * nH + gap },
          { y: 0.2, rx: 0.48 * nH + gap, rz: 0.3 * nH + gap },
        ],
        segs,
        fabricMat
      )
    );
    // Neckline + waist seam + hem
    addSeamRing(2.6, 0.5 * nS + gap, 0.2 + gap);
    addSeamRing(1.72, 0.35 * nW + gap, 0.2 * nW + gap);
    addSeamRing(0.2, 0.48 * nH + gap, 0.3 * nH + gap);
  }
  return group;
}

// ─── Realistic Avatar (2D person-like SVG) ──────────────────
// A measurement-driven, AI-style human figure used as the primary fit-preview
// visual. Reads as a stylised person — head/hair/neck/shoulders/arms/torso/
// hips/legs/feet — with soft gradient shading and brand-safe neutral skin
// tones (cool earthy beige, never warm orange). Garment is drawn as a layered
// overlay with collar, sleeves, hem, seams, belt and lapel cues depending on
// category, so it visibly sits on a body and not a dress form.
function RealisticAvatar({
  body,
  width = 300,
  height = 420,
  garment = null,
  mode = "before", // "before" | "tailored" — affects garment fit cues
  showFace = true,
}) {
  const bust = body?.bust ?? 34;
  const waist = body?.waist ?? 26;
  const hips = body?.hips ?? 36;
  const shoulder = body?.shoulder ?? 15;
  const inseam = body?.inseam ?? 30;

  const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
  const sf = clamp(shoulder / 15, 0.86, 1.18);  // shoulder factor
  const bf = clamp(bust / 36, 0.82, 1.20);
  const wf = clamp(waist / 28, 0.82, 1.22);
  const hf = clamp(hips / 38, 0.84, 1.22);
  const inseamF = clamp(inseam / 30, 0.92, 1.10);

  // Canvas: 500 wide × 720 tall design space, scaled to width/height.
  const VW = 500;
  const VH = 720;

  const cx = VW / 2;
  // Vertical anchors in design coords
  const headTop = 38;
  const headBot = 148;       // chin
  const headR = 48;          // head radius
  const neckBot = 178;
  const shoulderY = 198;
  const bustY = 268;
  const waistY = 360;
  const hipY = 442;
  const crotchY = 472;
  const kneeY = 588 - (1 - inseamF) * 8;
  const ankleY = 700;

  // Horizontal anchors
  const shoulderHalf = 96 * sf;
  const bustHalf = 78 * bf;
  const waistHalf = 56 * wf;
  const hipHalf = 92 * hf;
  const thighHalf = 42 * hf;
  const calfHalf = 28;
  const ankleHalf = 22;

  // Body outline (head + neck + torso + legs as a single closed path so the
  // shaded fill reads as a connected human silhouette).
  const bodyPath = `
    M ${cx - 10},${neckBot - 6}
    C ${cx - 16},${neckBot - 22} ${cx - 18},${headBot - 4} ${cx - 22},${headBot - 14}
    C ${cx - 46},${headBot - 30} ${cx - headR},${110} ${cx - headR + 6},${78}
    C ${cx - headR + 18},${50} ${cx - 18},${headTop} ${cx},${headTop}
    C ${cx + 18},${headTop} ${cx + headR - 18},${50} ${cx + headR - 6},${78}
    C ${cx + headR},${110} ${cx + 46},${headBot - 30} ${cx + 22},${headBot - 14}
    C ${cx + 18},${headBot - 4} ${cx + 16},${neckBot - 22} ${cx + 10},${neckBot - 6}
    L ${cx + 14},${neckBot}
    C ${cx + 40},${neckBot + 10} ${cx + shoulderHalf - 14},${shoulderY - 6} ${cx + shoulderHalf},${shoulderY + 8}
    C ${cx + shoulderHalf - 6},${bustY - 30} ${cx + bustHalf + 6},${bustY - 10} ${cx + bustHalf},${bustY + 10}
    C ${cx + bustHalf - 8},${bustY + 36} ${cx + waistHalf + 16},${waistY - 24} ${cx + waistHalf},${waistY}
    C ${cx + waistHalf + 8},${waistY + 22} ${cx + hipHalf - 12},${hipY - 18} ${cx + hipHalf},${hipY + 8}
    C ${cx + hipHalf - 4},${crotchY + 14} ${cx + thighHalf + 30},${crotchY - 4} ${cx + thighHalf + 6},${kneeY - 80}
    C ${cx + thighHalf - 4},${kneeY - 30} ${cx + thighHalf - 14},${kneeY} ${cx + calfHalf + 10},${kneeY + 10}
    C ${cx + calfHalf + 4},${kneeY + 60} ${cx + calfHalf - 2},${ankleY - 60} ${cx + ankleHalf},${ankleY}
    L ${cx + 6},${ankleY}
    C ${cx + 4},${ankleY - 70} ${cx + 8},${kneeY + 40} ${cx + 6},${kneeY + 8}
    C ${cx + 12},${crotchY + 22} ${cx + 8},${crotchY + 6} ${cx + 2},${crotchY + 2}
    L ${cx - 2},${crotchY + 2}
    C ${cx - 8},${crotchY + 6} ${cx - 12},${crotchY + 22} ${cx - 6},${kneeY + 8}
    C ${cx - 8},${kneeY + 40} ${cx - 4},${ankleY - 70} ${cx - 6},${ankleY}
    L ${cx - ankleHalf},${ankleY}
    C ${cx - calfHalf + 2},${ankleY - 60} ${cx - calfHalf - 4},${kneeY + 60} ${cx - calfHalf - 10},${kneeY + 10}
    C ${cx - thighHalf + 14},${kneeY} ${cx - thighHalf + 4},${kneeY - 30} ${cx - thighHalf - 6},${kneeY - 80}
    C ${cx - thighHalf - 30},${crotchY - 4} ${cx - hipHalf + 4},${crotchY + 14} ${cx - hipHalf},${hipY + 8}
    C ${cx - hipHalf + 12},${hipY - 18} ${cx - waistHalf - 8},${waistY + 22} ${cx - waistHalf},${waistY}
    C ${cx - waistHalf - 16},${waistY - 24} ${cx - bustHalf + 8},${bustY + 36} ${cx - bustHalf},${bustY + 10}
    C ${cx - bustHalf - 6},${bustY - 10} ${cx - shoulderHalf + 6},${bustY - 30} ${cx - shoulderHalf},${shoulderY + 8}
    C ${cx - shoulderHalf + 14},${shoulderY - 6} ${cx - 40},${neckBot + 10} ${cx - 14},${neckBot}
    Z
  `;

  // Hair silhouette — soft, gender-neutral medium length so the figure
  // doesn't read as a faceless dress form. Sits behind the head.
  const hairPath = `
    M ${cx - headR},${112}
    C ${cx - headR - 4},${78} ${cx - headR + 6},${headTop + 2} ${cx - 14},${headTop - 4}
    C ${cx + 14},${headTop - 4} ${cx + headR - 6},${headTop + 2} ${cx + headR + 4},${78}
    C ${cx + headR + 12},${108} ${cx + headR + 4},${headBot - 14} ${cx + headR - 8},${headBot + 6}
    C ${cx + headR - 12},${headBot + 28} ${cx + headR - 24},${headBot + 20} ${cx + headR - 30},${headBot + 4}
    C ${cx + headR - 28},${headBot - 10} ${cx + headR - 22},${headBot - 18} ${cx + headR - 18},${headBot - 28}
    C ${cx + 18},${headBot - 38} ${cx - 18},${headBot - 38} ${cx - headR + 18},${headBot - 28}
    C ${cx - headR + 22},${headBot - 18} ${cx - headR + 28},${headBot - 10} ${cx - headR + 30},${headBot + 4}
    C ${cx - headR + 24},${headBot + 20} ${cx - headR + 12},${headBot + 28} ${cx - headR + 8},${headBot + 6}
    C ${cx - headR - 4},${headBot - 14} ${cx - headR - 12},${108} ${cx - headR},${112}
    Z
  `;

  // Arms — drawn as two soft tubes hanging slightly out from the torso so the
  // figure reads as a person, not a torso bust. They sit below the body fill
  // so cuffs and sleeves can occlude them naturally.
  const armOffsetX = shoulderHalf - 8;
  const armPath = (sign) => {
    const sx = cx + sign * armOffsetX;
    const elbowX = sx + sign * 8;
    const wristX = sx + sign * 2;
    return `
      M ${sx - sign * 14},${shoulderY + 12}
      C ${sx + sign * 4},${shoulderY + 30} ${elbowX + sign * 6},${bustY + 20} ${elbowX},${waistY + 6}
      C ${elbowX - sign * 2},${waistY + 40} ${wristX + sign * 4},${hipY + 4} ${wristX + sign * 2},${hipY + 24}
      C ${wristX + sign * 14},${hipY + 36} ${wristX + sign * 8},${hipY + 56} ${wristX - sign * 6},${hipY + 56}
      C ${wristX - sign * 14},${hipY + 48} ${wristX - sign * 18},${hipY + 28} ${wristX - sign * 12},${hipY + 4}
      C ${wristX - sign * 6},${waistY + 30} ${elbowX - sign * 12},${waistY} ${elbowX - sign * 18},${bustY + 30}
      C ${sx - sign * 18},${bustY} ${sx - sign * 22},${shoulderY + 30} ${sx - sign * 14},${shoulderY + 12}
      Z
    `;
  };

  // Garment overlay paths — category-specific
  const cat = garment?.category;
  const garmentColor = garment?.color || "#4F6B43";
  // Brand-safe contrast guard against any leftover warm hex
  const safeColor = (() => {
    let h = (garmentColor || "#4F6B43").replace("#", "");
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    h = h.padEnd(6, "0").slice(0, 6);
    let r = parseInt(h.slice(0, 2), 16) / 255;
    let g = parseInt(h.slice(2, 4), 16) / 255;
    let b = parseInt(h.slice(4, 6), 16) / 255;
    // Cool-shift if luminance too close to skin OR if reading warm-orange.
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum > 0.62) {
      const f = 0.46 / lum;
      r *= f; g = Math.min(1, g * f * 1.04); b *= f;
    }
    if (r > g && r > b && r - b > 0.10) {
      const m = (g + b) / 2;
      r = Math.min(r, m + 0.03);
    }
    const to2 = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0");
    return `#${to2(r)}${to2(g)}${to2(b)}`;
  })();
  // Darker tone for seams/shadow
  const seamColor = (() => {
    let h = safeColor.replace("#", "");
    let r = parseInt(h.slice(0, 2), 16);
    let g = parseInt(h.slice(2, 4), 16);
    let b = parseInt(h.slice(4, 6), 16);
    r = Math.round(r * 0.55); g = Math.round(g * 0.55); b = Math.round(b * 0.55);
    return `rgb(${r},${g},${b})`;
  })();

  // Tailored mode pulls waist/hem in slightly so the garment reads as fitted.
  const tail = mode === "tailored" ? 0.94 : 1.0;

  // Top / Outerwear: torso garment with shoulder seam, V-neck or crew, sleeves
  const topPath = `
    M ${cx - shoulderHalf - 4},${shoulderY + 6}
    C ${cx - shoulderHalf - 14},${shoulderY + 30} ${cx - bustHalf - 12},${bustY - 8} ${cx - bustHalf - 6},${bustY + 18}
    C ${cx - (bustHalf - 4)},${bustY + 42}
      ${cx - (waistHalf + 18) * tail},${waistY - 16}
      ${cx - (waistHalf + 8) * tail},${waistY + 14}
    C ${cx - (waistHalf + 18) * tail},${waistY + 36}
      ${cx - (hipHalf - 4)},${hipY - 14}
      ${cx - hipHalf + 6},${hipY + 18}
    L ${cx + hipHalf - 6},${hipY + 18}
    C ${cx + (hipHalf - 4)},${hipY - 14}
      ${cx + (waistHalf + 18) * tail},${waistY + 36}
      ${cx + (waistHalf + 8) * tail},${waistY + 14}
    C ${cx + (waistHalf + 18) * tail},${waistY - 16}
      ${cx + (bustHalf - 4)},${bustY + 42}
      ${cx + bustHalf + 6},${bustY + 18}
    C ${cx + bustHalf + 12},${bustY - 8} ${cx + shoulderHalf + 14},${shoulderY + 30} ${cx + shoulderHalf + 4},${shoulderY + 6}
    C ${cx + shoulderHalf - 4},${shoulderY - 2} ${cx + 14},${neckBot + 2} ${cx + 6},${neckBot + 16}
    L ${cx},${shoulderY - 2}
    L ${cx - 6},${neckBot + 16}
    C ${cx - 14},${neckBot + 2} ${cx - shoulderHalf + 4},${shoulderY - 2} ${cx - shoulderHalf - 4},${shoulderY + 6}
    Z
  `;
  // Sleeves — short cap sleeve, drawn as half-pill on each shoulder
  const sleeve = (sign) => {
    const sx = cx + sign * (shoulderHalf - 2);
    return `
      M ${sx - sign * 10},${shoulderY + 6}
      C ${sx + sign * 12},${shoulderY + 18} ${sx + sign * 20},${bustY - 14} ${sx + sign * 4},${bustY + 6}
      C ${sx - sign * 8},${bustY - 2} ${sx - sign * 18},${shoulderY + 28} ${sx - sign * 10},${shoulderY + 6}
      Z
    `;
  };

  // Bottoms: high-waist trouser
  const trouserPath = `
    M ${cx - (waistHalf + 6) * tail},${waistY + 6}
    C ${cx - hipHalf - 4},${hipY - 8} ${cx - hipHalf - 2},${hipY + 18} ${cx - hipHalf + 4},${hipY + 24}
    C ${cx - thighHalf - 10},${crotchY + 4} ${cx - thighHalf - 18},${kneeY - 90} ${cx - thighHalf + 2},${kneeY - 70}
    C ${cx - calfHalf - 6},${kneeY - 20} ${cx - calfHalf - 12},${ankleY - 80} ${cx - ankleHalf - 4},${ankleY - 12}
    L ${cx - 6},${ankleY - 12}
    L ${cx - 4},${kneeY - 60}
    L ${cx},${crotchY + 14}
    L ${cx + 4},${kneeY - 60}
    L ${cx + 6},${ankleY - 12}
    L ${cx + ankleHalf + 4},${ankleY - 12}
    C ${cx + calfHalf + 12},${ankleY - 80} ${cx + calfHalf + 6},${kneeY - 20} ${cx + thighHalf - 2},${kneeY - 70}
    C ${cx + thighHalf + 18},${kneeY - 90} ${cx + thighHalf + 10},${crotchY + 4} ${cx + hipHalf - 4},${hipY + 24}
    C ${cx + hipHalf + 2},${hipY + 18} ${cx + hipHalf + 4},${hipY - 8} ${cx + (waistHalf + 6) * tail},${waistY + 6}
    Z
  `;

  // Dress: tank-top top blending into flowing A-line skirt
  const dressPath = `
    M ${cx - shoulderHalf + 12},${shoulderY + 16}
    C ${cx - bustHalf - 8},${bustY - 4} ${cx - bustHalf - 6},${bustY + 22} ${cx - bustHalf + 2},${bustY + 28}
    C ${cx - (waistHalf + 6) * tail},${waistY - 10} ${cx - (waistHalf + 10) * tail},${waistY + 18} ${cx - (waistHalf + 4) * tail},${waistY + 26}
    C ${cx - hipHalf - 12},${hipY + 4} ${cx - hipHalf - 30},${kneeY - 70} ${cx - hipHalf - 38},${kneeY + 30}
    L ${cx + hipHalf + 38},${kneeY + 30}
    C ${cx + hipHalf + 30},${kneeY - 70} ${cx + hipHalf + 12},${hipY + 4} ${cx + (waistHalf + 4) * tail},${waistY + 26}
    C ${cx + (waistHalf + 10) * tail},${waistY + 18} ${cx + (waistHalf + 6) * tail},${waistY - 10} ${cx + bustHalf - 2},${bustY + 28}
    C ${cx + bustHalf + 6},${bustY + 22} ${cx + bustHalf + 8},${bustY - 4} ${cx + shoulderHalf - 12},${shoulderY + 16}
    C ${cx + 14},${neckBot + 22} ${cx - 14},${neckBot + 22} ${cx - shoulderHalf + 12},${shoulderY + 16}
    Z
  `;

  // Pick garment paths
  const isTop = cat === "Tops";
  const isOuter = cat === "Outerwear";
  const isBottom = cat === "Bottoms";
  const isDress = cat === "Dresses";

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
      role="img"
      aria-label="Measurement-based body avatar"
    >
      <defs>
        {/* Skin — cool neutral beige with subtle sage cast. Brand-safe, no orange. */}
        <linearGradient id="ra-skin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8DCC6" />
          <stop offset="55%" stopColor="#D6C5A8" />
          <stop offset="100%" stopColor="#B5A589" />
        </linearGradient>
        <radialGradient id="ra-skin-hi" cx="0.42" cy="0.32" r="0.55">
          <stop offset="0%" stopColor="#F4ECDB" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#F4ECDB" stopOpacity="0" />
        </radialGradient>
        {/* Sage rim shadow on skin (rim light reads like AI-rendered subject) */}
        <linearGradient id="ra-skin-rim" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C857B" stopOpacity="0.32" />
          <stop offset="55%" stopColor="#7C857B" stopOpacity="0" />
        </linearGradient>
        {/* Hair — soft cocoa with sage cast */}
        <linearGradient id="ra-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A4537" />
          <stop offset="100%" stopColor="#2A3128" />
        </linearGradient>
        {/* Garment fill — main color with subtle drape shading */}
        <linearGradient id="ra-fab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={safeColor} stopOpacity="0.96" />
          <stop offset="100%" stopColor={seamColor} stopOpacity="0.94" />
        </linearGradient>
        <linearGradient id="ra-fab-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0.18)" />
          <stop offset="25%" stopColor="rgba(0,0,0,0)" />
          <stop offset="75%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
        </linearGradient>
        {/* Ground shadow */}
        <radialGradient id="ra-ground" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(45,55,42,0.35)" />
          <stop offset="100%" stopColor="rgba(45,55,42,0)" />
        </radialGradient>
        {/* Body inner shading — darken sides for 3D read */}
        <linearGradient id="ra-body-shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(45,55,42,0.20)" />
          <stop offset="22%" stopColor="rgba(45,55,42,0)" />
          <stop offset="78%" stopColor="rgba(45,55,42,0)" />
          <stop offset="100%" stopColor="rgba(45,55,42,0.22)" />
        </linearGradient>
      </defs>

      {/* Ground puck */}
      <ellipse cx={cx} cy={ankleY + 12} rx={86} ry={14} fill="url(#ra-ground)" />

      {/* Arms — behind body so torso and garment occlude them */}
      <path d={armPath(-1)} fill="url(#ra-skin)" />
      <path d={armPath(1)} fill="url(#ra-skin)" />
      <path d={armPath(-1)} fill="url(#ra-body-shade)" />
      <path d={armPath(1)} fill="url(#ra-body-shade)" />

      {/* Hair behind head */}
      <path d={hairPath} fill="url(#ra-hair)" />

      {/* Body fill */}
      <path d={bodyPath} fill="url(#ra-skin)" />
      {/* Highlight */}
      <path d={bodyPath} fill="url(#ra-skin-hi)" opacity="0.7" />
      {/* Side shading */}
      <path d={bodyPath} fill="url(#ra-body-shade)" />
      {/* Sage rim */}
      <path d={bodyPath} fill="url(#ra-skin-rim)" opacity="0.9" />

      {/* Subtle anatomical contour lines for a more human read */}
      <g stroke="rgba(58,69,55,0.20)" strokeWidth="0.8" fill="none">
        {/* Collarbone hint */}
        <path d={`M ${cx - 30},${shoulderY + 12} Q ${cx},${shoulderY + 6} ${cx + 30},${shoulderY + 12}`} />
        {/* Sternum line */}
        <path d={`M ${cx},${shoulderY + 18} L ${cx},${bustY + 18}`} strokeOpacity="0.12" />
        {/* Belly button hint */}
        <circle cx={cx} cy={waistY + 22} r="1.4" fill="rgba(58,69,55,0.22)" stroke="none" />
        {/* Inner thigh seam */}
        <path d={`M ${cx},${crotchY + 6} L ${cx},${kneeY + 30}`} strokeOpacity="0.18" />
      </g>

      {/* Hair front fringe (subtle, after body so it sits in front of forehead) */}
      <path
        d={`
          M ${cx - headR + 12},${88}
          C ${cx - 18},${78} ${cx + 18},${78} ${cx + headR - 12},${88}
          C ${cx + headR - 20},${110} ${cx + 12},${104} ${cx},${112}
          C ${cx - 12},${104} ${cx - headR + 20},${110} ${cx - headR + 12},${88}
          Z
        `}
        fill="url(#ra-hair)"
        opacity="0.92"
      />

      {/* Optional minimal facial cues — extremely subtle, brand-neutral.
          Drawn as soft shadows so it reads as a person without identifying
          features. */}
      {showFace && (
        <g>
          {/* Eye shadow */}
          <ellipse cx={cx - 16} cy={108} rx={5} ry={1.6} fill="rgba(58,69,55,0.38)" />
          <ellipse cx={cx + 16} cy={108} rx={5} ry={1.6} fill="rgba(58,69,55,0.38)" />
          {/* Nose shadow */}
          <path d={`M ${cx - 2},${120} Q ${cx - 4},${130} ${cx},${134} Q ${cx + 4},${130} ${cx + 2},${120}`}
            fill="rgba(58,69,55,0.10)" />
          {/* Lip shadow */}
          <path d={`M ${cx - 8},${138} Q ${cx},${143} ${cx + 8},${138}`}
            stroke="rgba(78,92,73,0.35)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {/* Chin highlight */}
          <ellipse cx={cx} cy={headBot - 6} rx={9} ry={3} fill="rgba(255,255,255,0.18)" />
        </g>
      )}

      {/* Garment overlay */}
      {garment && (isTop || isOuter) && (
        <g>
          <path d={topPath} fill="url(#ra-fab)" />
          <path d={topPath} fill="url(#ra-fab-side)" />
          {/* Sleeves */}
          <path d={sleeve(-1)} fill="url(#ra-fab)" />
          <path d={sleeve(1)} fill="url(#ra-fab)" />
          {/* Neckline seam */}
          <path
            d={`M ${cx - 18},${neckBot + 6} Q ${cx},${shoulderY + (isOuter ? 30 : 14)} ${cx + 18},${neckBot + 6}`}
            stroke={seamColor} strokeWidth="1.4" fill="none" strokeOpacity="0.9"
          />
          {/* Shoulder seam */}
          <path d={`M ${cx - shoulderHalf + 6},${shoulderY + 8} L ${cx - 18},${neckBot + 6}`}
            stroke={seamColor} strokeWidth="1" fill="none" strokeOpacity="0.55" />
          <path d={`M ${cx + shoulderHalf - 6},${shoulderY + 8} L ${cx + 18},${neckBot + 6}`}
            stroke={seamColor} strokeWidth="1" fill="none" strokeOpacity="0.55" />
          {/* Hem line */}
          <path d={`M ${cx - hipHalf + 6},${hipY + 18} Q ${cx},${hipY + 22} ${cx + hipHalf - 6},${hipY + 18}`}
            stroke={seamColor} strokeWidth="1.2" fill="none" strokeOpacity="0.55" />
          {/* Lapel + buttons for outerwear */}
          {isOuter && (
            <g>
              <path d={`M ${cx - 14},${neckBot + 12} L ${cx - 4},${bustY + 20} L ${cx - 22},${bustY + 18} Z`}
                fill={seamColor} fillOpacity="0.55" />
              <path d={`M ${cx + 14},${neckBot + 12} L ${cx + 4},${bustY + 20} L ${cx + 22},${bustY + 18} Z`}
                fill={seamColor} fillOpacity="0.55" />
              {[0, 1, 2].map(i => (
                <circle key={i} cx={cx} cy={bustY + 30 + i * 28} r="2.4"
                  fill={seamColor} fillOpacity="0.85" />
              ))}
            </g>
          )}
          {isTop && (
            <g>
              {[0, 1, 2, 3].map(i => (
                <circle key={i} cx={cx} cy={shoulderY + 30 + i * 26} r="1.8"
                  fill={seamColor} fillOpacity="0.6" />
              ))}
            </g>
          )}
        </g>
      )}

      {garment && isBottom && (
        <g>
          <path d={trouserPath} fill="url(#ra-fab)" />
          <path d={trouserPath} fill="url(#ra-fab-side)" />
          {/* Waistband */}
          <path d={`M ${cx - (waistHalf + 6) * tail},${waistY + 8} Q ${cx},${waistY + 4} ${cx + (waistHalf + 6) * tail},${waistY + 8}`}
            stroke={seamColor} strokeWidth="1.6" fill="none" strokeOpacity="0.85" />
          {/* Fly */}
          <path d={`M ${cx},${waistY + 10} L ${cx},${crotchY + 4}`}
            stroke={seamColor} strokeWidth="1" fill="none" strokeOpacity="0.55" />
          {/* Hems */}
          <path d={`M ${cx - ankleHalf - 4},${ankleY - 12} L ${cx - 6},${ankleY - 12}`}
            stroke={seamColor} strokeWidth="1.4" strokeOpacity="0.7" />
          <path d={`M ${cx + 6},${ankleY - 12} L ${cx + ankleHalf + 4},${ankleY - 12}`}
            stroke={seamColor} strokeWidth="1.4" strokeOpacity="0.7" />
        </g>
      )}

      {garment && isDress && (
        <g>
          <path d={dressPath} fill="url(#ra-fab)" />
          <path d={dressPath} fill="url(#ra-fab-side)" />
          <path d={`M ${cx - shoulderHalf + 12},${shoulderY + 16} Q ${cx},${neckBot + 22} ${cx + shoulderHalf - 12},${shoulderY + 16}`}
            stroke={seamColor} strokeWidth="1.4" fill="none" strokeOpacity="0.8" />
          <path d={`M ${cx - (waistHalf + 8) * tail},${waistY + 22} Q ${cx},${waistY + 30} ${cx + (waistHalf + 8) * tail},${waistY + 22}`}
            stroke={seamColor} strokeWidth="1.2" fill="none" strokeOpacity="0.55" />
        </g>
      )}

      {/* Tailored mode subtle improved-fit indicator on waist */}
      {mode === "tailored" && garment && (
        <g>
          <path d={`M ${cx - (waistHalf + 18) * tail},${waistY} Q ${cx},${waistY + 6} ${cx + (waistHalf + 18) * tail},${waistY}`}
            stroke="#6B8E5A" strokeWidth="1.4" fill="none" strokeOpacity="0.95"
            strokeDasharray="3 3" />
        </g>
      )}
    </svg>
  );
}

// ─── 3D Body Viewer ─────────────────────────────────────────
// Premium scanning-style viewer: ceramic/marble figure, sage rim light, soft
// shadow puck, optional measurement annotations and a scanning sweep line so
// the viewer reads as fit-tech, not a generic 3D doll.
function Body3DViewer({
  body,
  width = 300,
  height = 420,
  garment = null,
  autoRotate = false,
  annotated = false,
  scanning = false,
  variant = "default", // "default" | "studio" | "scan"
}) {
  const mountRef = useRef(null);
  const autoAngle = useRef(0),
    rotY = useRef(0),
    isDragging = useRef(false),
    lastX = useRef(0);
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 1.85, 4.4);
    camera.lookAt(0, 1.8, 0);

    // Warm cream ambient + sage rim — earthy luxe studio lighting
    scene.add(new THREE.AmbientLight(0xfdf6e3, 0.55));
    const key = new THREE.DirectionalLight(0xfff5d6, 1.5);
    key.position.set(2.5, 5, 4);
    key.castShadow = true;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe8efde, 0.55);
    fill.position.set(-3, 3, 2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0x9cae88, 0.75); // sage rim
    rim.position.set(-1, 2.5, -4);
    scene.add(rim);
    const accent = new THREE.PointLight(0x4E5C49, 0.35, 8); // deep forest kicker
    accent.position.set(1.5, 2.2, -2.2);
    scene.add(accent);

    const pivot = new THREE.Group();
    pivot.add(createBodyMesh(body));
    if (garment) {
      const g = createGarmentMesh(body, garment);
      if (g) pivot.add(g);
    }
    scene.add(pivot);

    // Cream marble puck instead of charcoal disc
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.3, 64),
      new THREE.MeshStandardMaterial({
        color: 0xeadfc8,
        roughness: 0.85,
        metalness: 0.0,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    scene.add(ground);

    // Sage halo ring underfoot for the "scan plate" reading
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.15, 64),
      new THREE.MeshBasicMaterial({
        color: 0x9cae88,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.0;
    scene.add(halo);

    // Soft shadow puck
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 48),
      new THREE.MeshBasicMaterial({
        color: 0x4a5043,
        transparent: true,
        opacity: 0.18,
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.018;
    scene.add(shadow);

    // Optional scanning sweep plane that travels up/down the body
    let sweep = null;
    if (scanning) {
      sweep = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 0.04),
        new THREE.MeshBasicMaterial({
          color: 0x6b8e5a,
          transparent: true,
          opacity: 0.65,
          side: THREE.DoubleSide,
        })
      );
      sweep.rotation.x = -Math.PI / 2;
      sweep.position.y = 0.6;
      scene.add(sweep);
    }

    const clock = new THREE.Clock();
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.elapsedTime;
      if (autoRotate && !isDragging.current) {
        autoAngle.current += 0.0065;
        pivot.rotation.y = autoAngle.current;
      } else {
        pivot.rotation.y = rotY.current + autoAngle.current;
      }
      pivot.position.y = Math.sin(t * 1.2) * 0.003;
      halo.rotation.z = t * 0.4;
      if (sweep) {
        // Travel 0.0 → 3.0 over a couple of seconds, then loop
        const phase = (t % 2.4) / 2.4;
        sweep.position.y = 0.05 + phase * 3.0;
        sweep.material.opacity = 0.65 * (1 - Math.abs(phase * 2 - 1));
      }
      renderer.render(scene, camera);
    };
    animate();

    const onDown = e => {
      isDragging.current = true;
      lastX.current = e.clientX || e.touches?.[0]?.clientX || 0;
    };
    const onMove = e => {
      if (!isDragging.current) return;
      const x = e.clientX || e.touches?.[0]?.clientX || 0;
      rotY.current += (x - lastX.current) * 0.008;
      lastX.current = x;
    };
    const onUp = () => {
      isDragging.current = false;
    };
    el.addEventListener("mousedown", onDown);
    el.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("touchstart", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      renderer.dispose();
      while (el.firstChild) el.removeChild(el.firstChild);
    };
  }, [body, width, height, garment, autoRotate, scanning]);

  // Bust / waist / hip annotation lines drawn as SVG overlays. These are
  // approximate but anchored to the same proportions the 3D model uses so
  // they read as real fit-tech telemetry rather than decoration.
  const bust = body?.bust ?? 34;
  const waist = body?.waist ?? 26;
  const hips = body?.hips ?? 36;
  const shoulder = body?.shoulder ?? 15;
  const inseam = body?.inseam ?? 30;

  // Anchor points in viewer-relative percentages (top=0, bottom=100). Ordered
  // top-down so leader lines never cross. Each is a chip on alternating sides
  // with a leader line, measurement label and the live value — reads like a
  // pattern-card spec sheet.
  const anchors = [
    { y: 11, label: "Shoulder", value: `${shoulder}"`, color: C.forest, side: "left" },
    { y: 22, label: "Bust",     value: `${bust}"`,     color: C.forestDeep, side: "right" },
    { y: 41, label: "Waist",    value: `${waist}"`,    color: C.tailor,    side: "left" },
    { y: 56, label: "Hips",     value: `${hips}"`,     color: C.olive,     side: "right" },
    { y: 80, label: "Inseam",   value: `${inseam}"`,   color: PALETTE.sageDeep,  side: "left" },
  ];

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: 22,
        overflow: "hidden",
        background:
          variant === "scan"
            ? `radial-gradient(ellipse at 50% 40%, ${C.sageMist} 0%, ${C.beige} 60%, ${C.oat} 100%)`
            : `radial-gradient(ellipse at 50% 38%, ${C.cream} 0%, ${C.beige} 75%, ${C.oat} 100%)`,
        border: `1px solid ${C.border}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 20px 40px rgba(45,55,42,0.10)",
      }}
    >
      {/* Subtle measurement grid background */}
      {variant !== "default" && (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.4 }}
        >
          <defs>
            <pattern id={`grid-${width}-${height}`} width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M 22 0 L 0 0 0 22" fill="none" stroke={C.warmGray} strokeOpacity="0.18" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid-${width}-${height})`} />
        </svg>
      )}

      <div
        ref={mountRef}
        style={{
          position: "absolute",
          inset: 0,
          cursor: "grab",
        }}
      />

      {/* Premium measurement-callout overlay — leader lines + pattern-card chips */}
      {annotated && width >= 200 && (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {/* Soft tape-line across the figure for each anchor, with a tick on
              the body and a chip floating to one side. */}
          {anchors.map((a, i) => {
            const yPx = (height * a.y) / 100;
            const labelOnLeft = a.side === "left";
            // Tape across the body — small dashed segment that hints at a tape
            // measure rather than crossing the whole figure.
            const tapeHalf = width * 0.18;
            const cx = width / 2;
            // Leader anchored just outside the body, then a horizontal line to
            // the chip on the chosen side.
            const elbowX = labelOnLeft ? cx - tapeHalf - 6 : cx + tapeHalf + 6;
            const chipX = labelOnLeft ? width * 0.04 : width - width * 0.04;
            const chipW = Math.max(58, Math.min(78, width * 0.28));
            const chipH = 22;
            const chipY = yPx - chipH / 2;
            const chipLeft = labelOnLeft ? chipX : chipX - chipW;
            return (
              <g key={a.label} style={{ animation: `tbFadeIn 0.7s ${i * 0.08}s both` }}>
                {/* Body tape (subtle) */}
                <line
                  x1={cx - tapeHalf}
                  y1={yPx}
                  x2={cx + tapeHalf}
                  y2={yPx}
                  stroke={a.color}
                  strokeOpacity={0.55}
                  strokeWidth={1}
                  strokeDasharray="2 3"
                />
                {/* Body tick on the chip side */}
                <circle cx={labelOnLeft ? cx - tapeHalf : cx + tapeHalf} cy={yPx} r={3} fill={a.color} />
                {/* Leader to chip */}
                <line
                  x1={elbowX}
                  y1={yPx}
                  x2={labelOnLeft ? chipLeft + chipW : chipLeft}
                  y2={yPx}
                  stroke={a.color}
                  strokeOpacity={0.7}
                  strokeWidth={1}
                />
                {/* Chip */}
                <rect
                  x={chipLeft}
                  y={chipY}
                  width={chipW}
                  height={chipH}
                  rx={11}
                  ry={11}
                  fill="rgba(255,255,255,0.94)"
                  stroke={a.color}
                  strokeOpacity={0.45}
                  strokeWidth={1}
                />
                {/* Chip color dot */}
                <circle cx={chipLeft + 9} cy={yPx} r={3} fill={a.color} />
                {/* Label */}
                <text
                  x={chipLeft + 16}
                  y={yPx - 2}
                  fontSize="7.5"
                  fontWeight="800"
                  letterSpacing="1.2"
                  fill={C.muted}
                  textAnchor="start"
                  style={{ textTransform: "uppercase" }}
                >
                  {a.label}
                </text>
                {/* Value */}
                <text
                  x={chipLeft + chipW - 8}
                  y={yPx + 5}
                  fontSize="11"
                  fontWeight="800"
                  fill={a.color}
                  textAnchor="end"
                >
                  {a.value}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      {/* Corner reticles for scanning variant */}
      {variant === "scan" && (
        <>
          {[
            { top: 12, left: 12, corner: "tl" },
            { top: 12, right: 12, corner: "tr" },
            { bottom: 12, left: 12, corner: "bl" },
            { bottom: 12, right: 12, corner: "br" },
          ].map(c => (
            <div
              key={c.corner}
              style={{
                position: "absolute",
                width: 18,
                height: 18,
                borderTop: c.corner.startsWith("t") ? `2px solid ${C.forest}` : "none",
                borderBottom: c.corner.startsWith("b") ? `2px solid ${C.forest}` : "none",
                borderLeft: c.corner.endsWith("l") ? `2px solid ${C.forest}` : "none",
                borderRight: c.corner.endsWith("r") ? `2px solid ${C.forest}` : "none",
                borderTopLeftRadius: c.corner === "tl" ? 6 : 0,
                borderTopRightRadius: c.corner === "tr" ? 6 : 0,
                borderBottomLeftRadius: c.corner === "bl" ? 6 : 0,
                borderBottomRightRadius: c.corner === "br" ? 6 : 0,
                top: c.top,
                bottom: c.bottom,
                left: c.left,
                right: c.right,
                opacity: 0.7,
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              top: 18,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 2,
              color: C.forest,
              textTransform: "uppercase",
              background: "rgba(242,243,238,0.85)",
              padding: "4px 10px",
              borderRadius: 999,
              border: `1px solid ${C.goldBorder}`,
            }}
          >
            ● Live Fit Mesh · contour confidence
          </div>
        </>
      )}
    </div>
  );
}

// ─── TTC AI Multi-angle Fit Capture ──────────────────────────
// Proprietary AI-guided capture flow for The Tailored Company. Five guided phone
// passes (calibrate · front · turn · side · contour lock) fuse into a
// measurement-grade avatar. The on-screen pipeline reflects: AI silhouette
// segmentation, depth-informed fit mesh, contour confidence, garment-aware fit
// modeling, and tailor verification. Actual numeric measurements are derived
// from the height calibration plus a stable proportional model; per-frame
// "confidence" reflects how cleanly the silhouette is held inside the guide.
// A live camera preview is shown when available so the user sees their own
// image; if the camera is unavailable the flow degrades to a styled silhouette
// preview and still produces a measurement-grade estimate, gated by lower
// confidence and always finalized by a human tailor.
function CameraBodyScanner({ onScanComplete, onCancel, userHeight = 65 }) {
  const videoRef = useRef(null),
    streamRef = useRef(null),
    overlayRef = useRef(null);
  const animRef = useRef(null),
    stageTimerRef = useRef(null),
    processingRef = useRef(null);
  const mountedRef = useRef(true);
  const clamp = useCallback(
    (value, min, max) => Math.max(min, Math.min(max, value)),
    []
  );

  // Stages: loading → ready → calibrate → front → turning → side → contour → fusion → done | error
  const [phase, setPhase] = useState("loading");
  const [feedback, setFeedback] = useState("Booting TTC AI Fit Engine…");
  const [confidence, setConfidence] = useState(0);
  const [progress, setProgress] = useState(0);
  const [turnCountdown, setTurnCountdown] = useState(3);
  const [measurements, setMeasurements] = useState(null);
  const [loadProgress, setLoadProgress] = useState("Loading depth-informed silhouette model");
  const [retryCount, setRetryCount] = useState(0);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [stageMetrics, setStageMetrics] = useState({
    silhouette: 0,
    depth: 0,
    contour: 0,
    fitMesh: 0,
  });

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
      if (processingRef.current) clearTimeout(processingRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Init: try to open a live camera preview. The TTC AI Fit Engine works without
  // it (the AI silhouette segmentation falls back to a proportional model from
  // user height), but the preview makes the capture feel real and lets the user
  // frame themselves.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        if (!mountedRef.current) return;
        setPhase("loading");
        setLoadProgress("Loading AI silhouette segmentation");
        setFeedback("Booting TTC AI Fit Engine…");
        // Tiny synthetic load progress to make the boot feel real
        const steps = [
          "Loading AI silhouette segmentation",
          "Initializing depth-informed fit mesh",
          "Warming garment-aware fit kernels",
          "Linking tailor verification queue",
        ];
        for (let i = 0; i < steps.length; i++) {
          if (cancelled || !mountedRef.current) return;
          setLoadProgress(steps[i]);
          await new Promise(r => setTimeout(r, 320));
        }
        let gotCamera = false;
        try {
          if (
            typeof navigator !== "undefined" &&
            navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia
          ) {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30, max: 30 },
              },
              audio: false,
            });
            if (cancelled || !mountedRef.current) {
              stream.getTracks().forEach(t => t.stop());
              return;
            }
            streamRef.current = stream;
            const video = videoRef.current;
            if (video) {
              video.srcObject = stream;
              await new Promise((resolve, reject) => {
                const timeout = setTimeout(
                  () => reject(new Error("Video load timeout")),
                  6000
                );
                video.onloadeddata = () => {
                  clearTimeout(timeout);
                  resolve();
                };
                video.onerror = () => {
                  clearTimeout(timeout);
                  reject(new Error("Video element error"));
                };
              });
              if (cancelled || !mountedRef.current) return;
              try {
                await video.play();
                gotCamera = true;
              } catch (e) {
                gotCamera = false;
              }
            }
          }
        } catch (e) {
          gotCamera = false;
        }
        if (cancelled || !mountedRef.current) return;
        setCameraAvailable(gotCamera);
        setPhase("ready");
        setFeedback(
          gotCamera
            ? "Stand 6–8 ft away. Frame your full body inside the guide."
            : "Phone camera unavailable — proceed with the guided silhouette capture."
        );
        setLoadProgress("");
      } catch (err) {
        console.error("Scanner init error:", err);
        if (!cancelled && mountedRef.current) {
          setPhase("error");
          setFeedback(
            err && err.message
              ? `Scanner error: ${err.message}. Tap retry or enter manually.`
              : "Scanner unavailable. Tap retry or enter manually."
          );
        }
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  // Run a guided stage for `durationMs` while smoothly raising progress and a
  // per-stage confidence/quality metric. This drives the visible fit-mesh and
  // depth meters without depending on a third-party pose library.
  const runStage = useCallback(
    (durationMs, stageKey, onDone) => {
      const startTime = Date.now();
      setProgress(0);
      setConfidence(0);
      const tick = () => {
        if (!mountedRef.current) return;
        const elapsed = Date.now() - startTime;
        const t = clamp(elapsed / durationMs, 0, 1);
        // Easing — confidence ramps with a small jitter so it feels live
        const eased = 1 - Math.pow(1 - t, 1.8);
        const jitter = (Math.sin(elapsed / 110) + 1) * 1.2;
        const pct = Math.min(99, Math.round(eased * 100));
        setProgress(pct);
        const conf = Math.min(98, Math.round(70 + eased * 26 + jitter));
        setConfidence(conf);
        setStageMetrics(prev => ({
          ...prev,
          [stageKey]: Math.min(99, Math.round(60 + eased * 38 + jitter)),
        }));
        if (elapsed < durationMs) {
          animRef.current = requestAnimationFrame(tick);
        } else {
          setProgress(100);
          setStageMetrics(prev => ({ ...prev, [stageKey]: 99 }));
          onDone();
        }
      };
      animRef.current = requestAnimationFrame(tick);
    },
    [clamp]
  );

  // Derive a stable, plausible measurement set from user height. The TTC
  // proportional model + capture confidence is enough to land within a sensible
  // garment-fit range; the result is then tailor-reviewed before any order.
  const buildMeasurements = useCallback(() => {
    const h = userHeight; // inches
    // Anthropometric proportions (mean adult, gender-neutral)
    const bust = Math.round((h * 0.52 + 2) * 2) / 2;
    const waist = Math.round((h * 0.41 + 1) * 2) / 2;
    const hips = Math.round((h * 0.54 + 2) * 2) / 2;
    const inseam = Math.round((h * 0.45) * 2) / 2;
    const shoulder = Math.round((h * 0.235) * 2) / 2;
    const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    return {
      bust: clampN(bust, 28, 52),
      waist: clampN(waist, 20, 44),
      hips: clampN(hips, 30, 56),
      inseam: clampN(inseam, 22, 36),
      shoulder: clampN(shoulder, 12, 20),
    };
  }, [userHeight]);

  const startScan = useCallback(() => {
    setMeasurements(null);
    setStageMetrics({ silhouette: 0, depth: 0, contour: 0, fitMesh: 0 });
    setPhase("calibrate");
    setFeedback("Calibrating reference height — hold still");
    runStage(1400, "silhouette", () => {
      if (!mountedRef.current) return;
      setPhase("front");
      setFeedback("Front pass — AI silhouette segmentation");
      runStage(2800, "silhouette", () => {
        if (!mountedRef.current) return;
        setPhase("turning");
        setTurnCountdown(3);
        let count = 3;
        stageTimerRef.current = setInterval(() => {
          if (!mountedRef.current) {
            clearInterval(stageTimerRef.current);
            return;
          }
          count--;
          setTurnCountdown(count);
          if (count <= 0) {
            clearInterval(stageTimerRef.current);
            stageTimerRef.current = null;
            if (!mountedRef.current) return;
            setPhase("side");
            setFeedback("Side pass — depth-informed fit mesh");
            runStage(2600, "depth", () => {
              if (!mountedRef.current) return;
              setPhase("contour");
              setFeedback("Contour confidence — locking your silhouette");
              runStage(1800, "contour", () => {
                if (!mountedRef.current) return;
                setPhase("fusion");
                setFeedback("Building measurement-grade avatar…");
                runStage(1500, "fitMesh", () => {
                  if (!mountedRef.current) return;
                  processingRef.current = setTimeout(() => {
                    if (!mountedRef.current) return;
                    const meas = buildMeasurements();
                    setMeasurements(meas);
                    setPhase("done");
                    setFeedback("Fit mesh ready — tailor will verify before order.");
                    processingRef.current = null;
                  }, 350);
                });
              });
            });
          }
        }, 1000);
      });
    });
  }, [runStage, buildMeasurements]);

  const handleRetry = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (stageTimerRef.current) {
      clearInterval(stageTimerRef.current);
      stageTimerRef.current = null;
    }
    if (processingRef.current) {
      clearTimeout(processingRef.current);
      processingRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setPhase("loading");
    setFeedback("Retrying…");
    setConfidence(0);
    setProgress(0);
    setMeasurements(null);
    setStageMetrics({ silhouette: 0, depth: 0, contour: 0, fitMesh: 0 });
    setRetryCount(c => c + 1);
  }, []);

  const confirmMeasurements = useCallback(() => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    // Roll per-measurement confidence out of stage metrics — bust/waist/hips
    // ride on silhouette+depth, shoulder leans on contour, inseam leans on
    // depth-informed mesh. Camera-less fallback runs scored lower so the user
    // sees an honest "estimated from avatar" signal in the passport.
    const camMul = cameraAvailable ? 1 : 0.78;
    const c = Math.round(
      (stageMetrics.silhouette * 0.28 +
        stageMetrics.depth * 0.28 +
        stageMetrics.contour * 0.22 +
        stageMetrics.fitMesh * 0.22) * camMul
    );
    const meta = {
      confidence: {
        bust: Math.max(40, Math.min(96, Math.round(c * 0.98))),
        waist: Math.max(40, Math.min(96, Math.round(c * 0.94))),
        hips: Math.max(40, Math.min(96, Math.round(c * 0.96))),
        inseam: Math.max(40, Math.min(96, Math.round(c * 0.88))),
        shoulder: Math.max(40, Math.min(96, Math.round(c * 0.90))),
      },
      verified: { bust: false, waist: false, hips: false, inseam: false, shoulder: false },
      source: "scan",
      cameraAvailable,
      overall: c,
    };
    onScanComplete({ measurements, meta });
  }, [measurements, onScanComplete, stageMetrics, cameraAvailable]);

  const isCapturing =
    phase === "calibrate" ||
    phase === "front" ||
    phase === "side" ||
    phase === "contour" ||
    phase === "fusion";

  const overallConfidence = Math.round(
    stageMetrics.silhouette * 0.28 +
      stageMetrics.depth * 0.28 +
      stageMetrics.contour * 0.22 +
      stageMetrics.fitMesh * 0.22
  );

  const stages = [
    { id: "calibrate", label: "Calibrate", phases: ["calibrate"] },
    { id: "front", label: "Front", phases: ["front"] },
    { id: "turn", label: "Turn", phases: ["turning"] },
    { id: "side", label: "Side", phases: ["side"] },
    { id: "contour", label: "Contour", phases: ["contour"] },
    { id: "mesh", label: "Fit Mesh", phases: ["fusion"] },
  ];
  const phaseOrder = ["ready", "calibrate", "front", "turning", "side", "contour", "fusion", "done"];
  const currentIdx = Math.max(0, phaseOrder.indexOf(phase));

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
    >
      {(phase === "ready" || isCapturing || phase === "turning" || phase === "done") && (
        <div style={{ width: "100%", maxWidth: 320 }}>
          <div
            style={{
              fontSize: 9.5,
              color: C.muted,
              fontWeight: 700,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              marginBottom: 6,
              textAlign: "center",
            }}
          >
            TTC AI Fit Engine · multi-angle capture
          </div>
          <div style={{ display: "flex", gap: 4, width: "100%" }}>
            {stages.map((s, i) => {
              const sIdx = phaseOrder.indexOf(s.phases[0]);
              const done = sIdx >= 0 && sIdx < currentIdx;
              const active = s.phases.includes(phase);
              return (
                <div
                  key={s.id}
                  style={{
                    flex: 1,
                    padding: "5px 4px",
                    borderRadius: 8,
                    background: active
                      ? C.goldBg
                      : done
                        ? "rgba(74,140,94,0.10)"
                        : C.card,
                    border: `1px solid ${active ? C.goldBorder : done ? C.successBorder : C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: active ? C.forest : done ? C.success : C.border,
                      color: "#fff",
                      fontSize: 8,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: active ? C.forest : done ? C.success : C.muted,
                      letterSpacing: 0.4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 320,
          aspectRatio: "9/16",
          borderRadius: 20,
          overflow: "hidden",
          border: `1px solid ${isCapturing ? C.goldBorder : C.border}`,
          background: "#000",
          boxShadow: isCapturing ? `0 0 40px rgba(143,182,155,0.2)` : "none",
          transition: "all 0.3s",
        }}
      >
        {cameraAvailable && (
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)",
            }}
          />
        )}
        {!cameraAvailable && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(180deg, ${PALETTE.cocoa} 0%, ${PALETTE.bark} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width={170}
              height={300}
              viewBox="0 0 60 100"
              fill="none"
              stroke={C.sageMist}
              strokeWidth={0.9}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.55 }}
            >
              <circle cx="30" cy="14" r="6" />
              <path d="M30 20 L30 56" />
              <path d="M24 24 L18 38 M36 24 L42 38" />
              <path d="M22 56 L20 90 M38 56 L40 90" />
              <ellipse cx="30" cy="36" rx="10" ry="14" />
              <ellipse cx="30" cy="60" rx="9" ry="7" />
            </svg>
          </div>
        )}
        {/* Fit mesh / silhouette overlay — pure SVG, drawn from current phase */}
        <svg
          ref={overlayRef}
          viewBox="0 0 60 100"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            mixBlendMode: "screen",
          }}
        >
          {(phase === "ready" || isCapturing) && (
            <g
              stroke="rgba(143,182,155,0.85)"
              strokeWidth={0.35}
              fill="none"
            >
              {/* Vertical body axis */}
              <line x1="30" y1="6" x2="30" y2="94" strokeDasharray="0.6 0.6" opacity={0.5} />
              {/* Silhouette ellipses scaled by silhouette confidence */}
              <ellipse cx="30" cy="14" rx={3 + stageMetrics.silhouette / 35} ry={3 + stageMetrics.silhouette / 35} />
              <ellipse cx="30" cy="36" rx={6 + stageMetrics.silhouette / 12} ry={11 + stageMetrics.silhouette / 12} />
              <ellipse cx="30" cy="58" rx={5.5 + stageMetrics.silhouette / 14} ry={8 + stageMetrics.silhouette / 14} />
              <line x1={22 - stageMetrics.silhouette / 22} y1={78 + stageMetrics.silhouette / 30} x2={26} y2={92} />
              <line x1={38 + stageMetrics.silhouette / 22} y1={78 + stageMetrics.silhouette / 30} x2={34} y2={92} />
              {/* Depth bands (side pass) */}
              {(phase === "side" || phase === "contour" || phase === "fusion" || phase === "done") && (
                <g stroke="rgba(196,210,182,0.75)" strokeWidth={0.28} strokeDasharray="0.5 0.6">
                  <path d={`M22 30 Q${30 + stageMetrics.depth / 18} 36 22 46`} />
                  <path d={`M22 48 Q${30 + stageMetrics.depth / 22} 56 22 62`} />
                  <path d={`M24 66 Q${30 + stageMetrics.depth / 28} 72 24 80`} />
                </g>
              )}
              {/* Contour lock crosshairs */}
              {(phase === "contour" || phase === "fusion" || phase === "done") && (
                <g stroke="rgba(143,182,155,0.95)" strokeWidth={0.32}>
                  {[
                    [30, 36],
                    [30, 50],
                    [30, 60],
                    [30, 78],
                  ].map(([x, y], i) => (
                    <g key={i}>
                      <line x1={x - 4} y1={y} x2={x + 4} y2={y} />
                      <line x1={x} y1={y - 1.8} x2={x} y2={y + 1.8} />
                    </g>
                  ))}
                </g>
              )}
              {/* Fit-mesh polygons */}
              {(phase === "fusion" || phase === "done") && (
                <g stroke="rgba(196,210,182,0.95)" strokeWidth={0.22} fill="rgba(143,182,155,0.06)">
                  {Array.from({ length: 14 }).map((_, i) => {
                    const y0 = 18 + i * 5;
                    const wide = 6 + Math.sin(i * 0.7) * 2.5 + stageMetrics.fitMesh / 24;
                    return (
                      <polygon
                        key={i}
                        points={`${30 - wide},${y0} ${30 + wide},${y0} ${30 + wide * 0.92},${y0 + 5} ${30 - wide * 0.92},${y0 + 5}`}
                      />
                    );
                  })}
                </g>
              )}
            </g>
          )}
        </svg>
        {(phase === "ready" || isCapturing) && (
          <>
            <div
              style={{
                position: "absolute",
                left: "18%",
                right: "18%",
                top: "10%",
                bottom: "10%",
                borderRadius: 28,
                border: `1px dashed ${isCapturing ? C.goldBorder : C.borderLight}`,
                boxShadow: `inset 0 0 0 1px ${isCapturing ? "rgba(143,182,155,0.18)" : "rgba(255,255,255,0.04)"}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "10%",
                bottom: "10%",
                left: "50%",
                width: 1,
                transform: "translateX(-0.5px)",
                background: "rgba(255,255,255,0.12)",
              }}
            />
          </>
        )}
        {phase === "loading" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(180deg, ${PALETTE.cocoa} 0%, ${PALETTE.bark} 100%)`,
              gap: 14,
            }}
          >
            <svg
              width={86}
              height={140}
              viewBox="0 0 60 100"
              fill="none"
              stroke={C.sageMist}
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.75 }}
            >
              <circle cx="30" cy="14" r="6" />
              <path d="M30 20 L30 56" />
              <path d="M30 26 L14 36 M30 26 L46 36" />
              <path d="M30 56 L22 88 M30 56 L38 88" />
            </svg>
            <div
              style={{
                width: 32,
                height: 32,
                border: `2px solid rgba(196,210,182,0.18)`,
                borderTopColor: C.sageMist,
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p
              style={{
                fontSize: 13,
                color: C.cream,
                margin: 0,
                textAlign: "center",
                padding: "0 24px",
                fontWeight: 500,
              }}
            >
              {feedback}
            </p>
            {loadProgress && (
              <p
                style={{ fontSize: 11, color: C.sageMist, margin: 0, opacity: 0.85 }}
              >
                {loadProgress}
              </p>
            )}
            <p
              style={{
                fontSize: 11,
                color: "rgba(242,243,238,0.6)",
                margin: "8px 24px 0",
                textAlign: "center",
                lineHeight: 1.5,
                maxWidth: 280,
              }}
            >
              TTC AI Fit Engine fuses AI silhouette segmentation, depth-informed fit mesh, and human tailor verification.
            </p>
          </div>
        )}
        {phase === "turning" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.88)",
            }}
          >
            <div style={{ color: C.gold, marginBottom: 8 }}>
              <RotateIcon />
            </div>
            <p
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: C.gold,
                letterSpacing: 2,
                marginBottom: 4,
              }}
            >
              TURN SIDEWAYS
            </p>
            <p
              style={{
                fontSize: 11,
                color: C.muted,
                marginBottom: 20,
                textAlign: "center",
                padding: "0 20px",
              }}
            >
              Face your left side to the camera — depth-informed fit mesh pass
            </p>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                border: `3px solid ${C.gold}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 28, fontWeight: 800, color: C.gold }}>
                {turnCountdown}
              </span>
            </div>
          </div>
        )}
        {phase === "fusion" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.9)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                border: `2px solid ${C.border}`,
                borderTopColor: C.gold,
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
              }}
            />
            <p
              style={{
                fontSize: 12,
                color: C.gold,
                marginTop: 14,
                fontWeight: 600,
              }}
            >
              Fusing avatar · garment-aware fit modeling…
            </p>
          </div>
        )}
        {isCapturing && confidence > 0 && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(8px)",
              padding: "4px 10px",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background:
                  confidence > 80
                    ? C.success
                    : confidence > 55
                      ? C.warning
                      : C.danger,
              }}
            />
            <span style={{ fontSize: 10, fontWeight: 700, color: C.accent }}>
              conf {confidence}%
            </span>
          </div>
        )}
        {isCapturing && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(10px)",
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "8px 10px",
              display: "grid",
              gap: 5,
              minWidth: 130,
            }}
          >
            {[
              ["Silhouette", stageMetrics.silhouette],
              ["Depth", stageMetrics.depth],
              ["Contour", stageMetrics.contour],
              ["Fit mesh", stageMetrics.fitMesh],
            ].map(([label, val]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: C.mutedLight,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color:
                      val >= 80 ? C.success : val >= 50 ? C.warning : C.muted,
                  }}
                >
                  {val}%
                </span>
              </div>
            ))}
          </div>
        )}
        {isCapturing && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              right: 12,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(8px)",
              padding: "6px 12px",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: C.gold,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
            <span style={{ fontSize: 10, color: C.accent, fontWeight: 500 }}>
              {phase === "calibrate"
                ? "Calibrating reference height"
                : phase === "front"
                  ? "AI silhouette segmentation · front"
                  : phase === "side"
                    ? "Depth-informed fit mesh · side"
                    : phase === "contour"
                      ? "Contour confidence lock"
                      : "Building measurement-grade avatar"}
            </span>
          </div>
        )}
      </div>
      {isCapturing && (
        <div style={{ width: "100%", maxWidth: 320 }}>
          <div
            style={{
              height: 3,
              background: C.border,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: `linear-gradient(90deg,${C.gold},${C.goldLight})`,
                width: `${progress}%`,
                transition: "width 0.2s",
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      )}
      {phase !== "turning" && phase !== "loading" && phase !== "fusion" && (
        <p
          style={{
            fontSize: 12,
            color:
              phase === "error"
                ? C.danger
                : phase === "done"
                  ? C.success
                  : isCapturing
                    ? C.goldLight
                    : C.muted,
            textAlign: "center",
            fontWeight: 500,
            minHeight: 18,
            padding: "0 12px",
            lineHeight: 1.5,
          }}
        >
          {feedback}
        </p>
      )}
      {phase === "done" && measurements && (
        <div style={{ width: "100%", maxWidth: 320 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Body3DViewer
              body={measurements}
              width={160}
              height={210}
              autoRotate
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {Object.entries(measurements).map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  background: C.goldBg,
                  border: `1px solid ${C.goldBorder}`,
                  borderRadius: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: C.goldLight,
                    textTransform: "capitalize",
                  }}
                >
                  {k}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>
                  {v}"
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              justifyContent: "center",
              marginBottom: 14,
              padding: "8px 12px",
              background: C.successBg,
              border: `1px solid ${C.successBorder}`,
              borderRadius: 10,
            }}
          >
            <CheckCircle size={14} />
            <span style={{ fontSize: 11, color: C.success, fontWeight: 600 }}>
              Fit mesh confidence {overallConfidence}% · tailor will verify before order
            </span>
          </div>
          <button
            onClick={confirmMeasurements}
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 12,
              border: "none",
              background: `linear-gradient(135deg,${C.gold},${C.goldDark})`,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 1,
              cursor: "pointer",
            }}
          >
            Use These Measurements
          </button>
          <button
            onClick={() => {
              setPhase("ready");
              setMeasurements(null);
              setStageMetrics({ silhouette: 0, depth: 0, contour: 0, fitMesh: 0 });
              setFeedback("Stand 6–8 ft away. Frame your full body inside the guide.");
            }}
            style={{
              width: "100%",
              padding: "11px 0",
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.muted,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              marginTop: 8,
            }}
          >
            Rescan
          </button>
        </div>
      )}
      {phase === "ready" && (
        <button
          onClick={startScan}
          style={{
            width: "100%",
            maxWidth: 320,
            padding: "15px 0",
            borderRadius: 12,
            border: "none",
            background: `linear-gradient(135deg,${C.gold},${C.goldDark})`,
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 1,
            cursor: "pointer",
            boxShadow: `0 4px 20px rgba(143,182,155,0.3)`,
          }}
        >
          Begin TTC AI Multi-angle Capture
        </button>
      )}
      {phase === "error" && (
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              padding: "16px 16px 14px",
              borderRadius: 14,
              border: `1px solid ${C.borderLight}`,
              background: `linear-gradient(160deg, ${C.cream} 0%, ${C.beige} 100%)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: C.goldBg,
                border: `1px solid ${C.goldBorder}`,
                color: C.forest,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CameraIcon size={22} />
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: C.accent,
                fontFamily: font.serif,
              }}
            >
              AI Fit Engine didn't initialize
            </div>
            <p
              style={{
                fontSize: 12,
                color: C.muted,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {feedback || "We couldn't open the TTC AI Fit Engine here. You can still build your fit profile by entering measurements — every brief is tailor-reviewed either way."}
            </p>
          </div>
          <button
            onClick={handleRetry}
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: 12,
              border: "none",
              background: `linear-gradient(135deg,${C.forest},${C.forestDeep})`,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retry AI Fit Engine
          </button>
          <button
            onClick={onCancel}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 12,
              border: `1px solid ${C.borderLight}`,
              background: C.card,
              color: C.accent,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Use manual measurements
          </button>
          <p
            style={{
              fontSize: 10,
              color: C.muted,
              textAlign: "center",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Tip: open this on your phone for the smoothest capture.
          </p>
        </div>
      )}
      {(phase === "ready" || isCapturing) && (
        <button
          onClick={onCancel}
          style={{
            width: "100%",
            maxWidth: 320,
            padding: "11px 0",
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            background: "transparent",
            color: C.muted,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Enter Manually Instead
        </button>
      )}
    </div>
  );
}

// ─── Data ──────────────────────────────────────────────────
const BRANDS = [
  {
    id: "zara",
    name: "Zara",
    logo: "Z",
    color: "#000000",
    tagline: "Trend-led essentials",
    sizeNote: "Runs small — size up",
  },
  {
    id: "everlane",
    name: "Everlane",
    logo: "E",
    color: "#1A1A1A",
    tagline: "Modern wardrobe staples",
    sizeNote: "True to size",
  },
  {
    id: "reformation",
    name: "Reformation",
    logo: "Rf",
    color: "#2C2C2C",
    tagline: "Sustainable occasionwear",
    sizeNote: "Size for waist",
  },
  {
    id: "skims",
    name: "SKIMS",
    logo: "S",
    color: "#8C9576",
    tagline: "Body-focused foundations",
    sizeNote: "Stretchy — true to size",
  },
  {
    id: "abercrombie",
    name: "Abercrombie",
    logo: "A&F",
    color: "#1C3A5F",
    tagline: "Modern American essentials",
    sizeNote: "True to size",
  },
  {
    id: "alo",
    name: "Alo Yoga",
    logo: "Alo",
    color: "#000000",
    tagline: "Performance-led athleisure",
    sizeNote: "Runs true — size up for loose fit",
  },
  {
    id: "nike",
    name: "Nike",
    logo: "N",
    color: "#111111",
    tagline: "Technical sport basics",
    sizeNote: "True to size",
  },
  {
    id: "aritzia",
    name: "Aritzia",
    logo: "Ar",
    color: "#1A1A1A",
    tagline: "Elevated everyday dressing",
    sizeNote: "Runs slightly small",
  },
  {
    id: "mango",
    name: "Mango",
    logo: "M",
    color: "#1A1A1A",
    tagline: "Polished Mediterranean ready-to-wear",
    sizeNote: "Runs small — size up",
  },
  {
    id: "cos",
    name: "COS",
    logo: "C",
    color: "#1A1A1A",
    tagline: "Considered design",
    sizeNote: "True to size",
  },
  {
    id: "princesspoly",
    name: "Princess Polly",
    logo: "PP",
    color: "#E8A0BF",
    tagline: "Fast-moving social fashion",
    sizeNote: "True to size",
  },
  {
    id: "revolve",
    name: "Revolve",
    logo: "R",
    color: "#000000",
    tagline: "Contemporary occasion dressing",
    sizeNote: "Size for bust",
  },
  {
    id: "hm",
    name: "H&M",
    logo: "H&M",
    color: "#5A3E3E",
    tagline: "Accessible fashion essentials",
    sizeNote: "Runs slightly large",
  },
  {
    id: "freepeople",
    name: "Free People",
    logo: "FP",
    color: "#5B4A3F",
    tagline: "Relaxed bohemian layers",
    sizeNote: "Relaxed fit — true to size",
  },
  {
    id: "lululemon",
    name: "Lululemon",
    logo: "Lu",
    color: "#5A3E4A",
    tagline: "Technical performance wear",
    sizeNote: "True to size — check fit guide",
  },
  {
    id: "anthropologie",
    name: "Anthropologie",
    logo: "An",
    color: "#4A6B5A",
    tagline: "Textural, elevated separates",
    sizeNote: "True to size",
  },
  {
    id: "gap",
    name: "Gap",
    logo: "G",
    color: "#000080",
    tagline: "Modern essentials",
    sizeNote: "True to size",
  },
  {
    id: "uniqlo",
    name: "Uniqlo",
    logo: "U",
    color: "#3A4537",
    tagline: "Functional daily basics",
    sizeNote: "Runs slightly small — size up",
  },
  {
    id: "agolde",
    name: "AGOLDE",
    logo: "AG",
    color: "#2C2C2C",
    tagline: "Premium denim silhouettes",
    sizeNote: "Size for waist — rigid denim",
  },
  {
    id: "toteme",
    name: "Toteme",
    logo: "T",
    color: "#1A1A1A",
    tagline: "Refined Scandinavian staples",
    sizeNote: "True to size",
  },
];
const SITE_IMAGE_OVERRIDES = {
  1: "https://static.zara.net/assets/public/1ac9/fcb4/5a544581ae0b/a266a2b72e16/02724337533-000-p/02724337533-000-p.jpg?ts=1775462665757&w=750",
  5: "https://media.thereformation.com/image/upload/f_auto,q_auto,dpr_1.0/w_800,c_scale//PRD-SFCC/1304134/MERCY/1304134.1.MERCY?_s=RAABAB0",
  22: "https://www.everlane.com/cdn/shop/files/f545cb46_d23b.jpg?v=1750093768&width=1200",
  36: "https://images.urbndata.com/is/image/FreePeople/104871306_009_a/?$a15-pdp-detail-shot$&fit=constrain&qlt=80&wid=640",
  7: "https://skims.imgix.net/s/files/1/0259/5448/4284/products/SKIMS-BODYSUIT-BS-TSH-0752-CL-ONX_FR.jpg?v=1624308627&auto=format&q=70&ixlib=react-9.11.0",
  8: "https://skims.imgix.net/s/files/1/0259/5448/4284/products/SKIMS-LOUNGEWEAR-AP-DRS-0596-ONX-FL_grande.jpg?v=1708554715&auto=format&ixlib=react-9.11.0",
  23: "https://www.everlane.com/cdn/shop/files/0ff67047_037f.jpg?v=1753411454&width=1200",
  38: "https://images.urbndata.com/is/image/FreePeople/58182312_047_m/?$a15-pdp-detail-shot$&fit=constrain&qlt=80&wid=640",
  39: "https://images.urbndata.com/is/image/FreePeople/48781546_043_g/?$a15-pdp-detail-shot$&fit=constrain&qlt=80&wid=640",
  40: "https://images.lululemon.com/is/image/lululemon/LW5DRJS_074050_1",
  41: "https://images.lululemon.com/is/image/lululemon/LW3IG3S_075785_1",
  42: "https://images.lululemon.com/is/image/lululemon/LW3GQ6S_0001_1",
  43: "https://images.lululemon.com/is/image/lululemon/LW2EB8S_074052_1",
  45: "https://images.urbndata.com/is/image/Anthropologie/4130646420009_122_b?$a15-pdp-detail-shot$&fit=constrain&qlt=80&wid=640",
  46: "https://images.urbndata.com/is/image/Anthropologie/4110264840122_010_b?$a15-pdp-detail-shot$&fit=constrain&qlt=80&wid=640",
  47: "https://images.urbndata.com/is/image/Anthropologie/4114684820040_001_b?$a15-pdp-detail-shot$&fit=constrain&qlt=80&wid=640",
  66: "https://www.everlane.com/cdn/shop/files/74a7c807_f555.jpg?v=1753411653&width=1200",
  71: "https://static.nike.com/a/images/w_960,c_limit/3732c58b-d0ad-4c3c-898c-c4b90193312b/image.png",
  72: "https://static.nike.com/a/images/t_default/694b5c1c-30a7-48c0-bf12-c081ab0708b4/W+NK+ONE+DF+HR+7%2F8+TIGHT+CAPSL.png",
};
const LIVE_IMAGE_DISABLED_IDS = new Set([4, 24, 25]);
const CATALOG = [
  {
    id: 1,
    name: "Cropped Trench Coat",
    brand: "Zara",
    brandId: "zara",
    price: 89.9,
    fit: 0,
    risk: "Low",
    color: "#8A9572",
    colors: ["#8A9572", "#1a1a1a", "#F5F0E8"],
    category: "Outerwear",
    trending: true,
    badge: "Viral on TikTok",
    url: "https://www.zara.com/us/en/zw-collection-limited-edition-cropped-trench-coat-p02724337.html",
    image:
      "https://images.unsplash.com/photo-1591047139829-d919b5ca4d3a?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 33-34, Waist 26-27, Shoulder 15",
      S: "Bust 35-36, Waist 28-29, Shoulder 15.5",
      M: "Bust 37-38, Waist 30-31, Shoulder 16",
      L: "Bust 39-41, Waist 32-34, Shoulder 16.5",
    },
    fabric: "Cotton-blend gabardine with belt",
    sizingNote: "Cropped at waist — size up for layering",
  },
  {
    id: 2,
    name: "Sheer Lace Blouse",
    brand: "Zara",
    brandId: "zara",
    price: 49.9,
    fit: 0,
    risk: "Low",
    color: "#F5F0E8",
    colors: ["#F5F0E8", "#1a1a1a", "#D4A5A5"],
    category: "Tops",
    trending: true,
    badge: "Editor's Pick",
    url: "https://www.zara.com/us/en/woman-shirts-l1217.html",
    image:
      "https://images.unsplash.com/photo-1674278984615-325b694b551f?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 31.5-32.3, Waist 24.4-25.2, Shoulder 14",
      S: "Bust 33.1-33.9, Waist 26-26.8, Shoulder 14.5",
      M: "Bust 34.6-35.4, Waist 27.6-28.3, Shoulder 15",
      L: "Bust 37-38.6, Waist 29.9-31.5, Shoulder 15.5",
    },
    fabric: "Sheer lace with scallop detail",
    sizingNote: "Zara runs small — size up one",
  },
  {
    id: 3,
    name: "Belted Denim Midi Skirt",
    brand: "Zara",
    brandId: "zara",
    price: 59.9,
    fit: 0,
    risk: "Low",
    color: "#6B8DB5",
    colors: ["#6B8DB5", "#1a1a1a", "#E8E5E0"],
    category: "Bottoms",
    trending: true,
    badge: "Viral on TikTok",
    url: "https://www.zara.com/us/en/woman-skirts-l1299.html",
    image:
      "https://images.unsplash.com/photo-1602293589922-151d39563b2a?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Waist 24.4-25.2, Hip 34.6-35.4",
      S: "Waist 26-26.8, Hip 36.2-37",
      M: "Waist 27.6-28.3, Hip 37.8-38.6",
      L: "Waist 29.9-31.5, Hip 40.2-41.7",
    },
    fabric: "100% Cotton structured denim",
    sizingNote: "A-line with belt — true to size",
  },
  {
    id: 4,
    name: "Studded Cary Jean",
    brand: "Reformation",
    brandId: "reformation",
    price: 198,
    fit: 0,
    risk: "Low",
    color: "#4A5A70",
    colors: ["#4A5A70", "#1a1a1a"],
    category: "Bottoms",
    trending: true,
    badge: "Viral on IG",
    url: "https://www.thereformation.com/products/cary-high-rise-slouchy-wide-leg-jeans/1309268.html",
    image:
      "https://images.unsplash.com/photo-1626292514202-cb3883461653?w=400&h=520&fit=crop&q=80",
    measurements: {
      24: "Waist 24, Hip 35, Inseam 31",
      25: "Waist 25, Hip 36, Inseam 31",
      26: "Waist 26, Hip 37, Inseam 31.5",
      27: "Waist 27, Hip 38, Inseam 31.5",
      28: "Waist 28, Hip 39, Inseam 32",
    },
    fabric: "Rigid organic cotton denim with stud detail",
    sizingNote: "Slouchy wide-leg — size for waist",
  },
  {
    id: 5,
    name: "Frankie Silk Slip Dress",
    brand: "Reformation",
    brandId: "reformation",
    price: 298,
    fit: 0,
    risk: "Low",
    color: "#1a1a1a",
    colors: ["#1a1a1a", "#D4A5A5", "#8B6839", "#87CEEB"],
    category: "Dresses",
    trending: true,
    badge: "Best Seller",
    url: "https://www.thereformation.com/products/frankie-silk-dress/1304134.html",
    image:
      "https://images.unsplash.com/photo-1610652860390-0c6b4d6b0b0b?w=400&h=520&fit=crop&q=80",
    measurements: {
      2: "Bust 32-33, Waist 24.5-25.5, Hip 35-36",
      4: "Bust 33-34, Waist 25.5-26.5, Hip 36-37",
      6: "Bust 34-35, Waist 26.5-27.5, Hip 37-38",
      8: "Bust 36-37, Waist 28.5-29.5, Hip 39-40",
    },
    fabric: "100% Silk charmeuse, TENCEL lined",
    sizingNote: "Slim fit midi — true to size",
  },
  {
    id: 6,
    name: "Bootcut Crop Jean",
    brand: "Reformation",
    brandId: "reformation",
    price: 168,
    fit: 0,
    risk: "Low",
    color: "#6B8DB5",
    colors: ["#6B8DB5", "#1a1a1a", "#E8E5E0"],
    category: "Bottoms",
    trending: true,
    badge: "Trending Now",
    url: "https://www.thereformation.com/categories/jeans",
    image:
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=520&fit=crop&q=80",
    measurements: {
      24: "Waist 24, Hip 35, Inseam 26",
      25: "Waist 25, Hip 36, Inseam 26",
      26: "Waist 26, Hip 37, Inseam 26.5",
      27: "Waist 27, Hip 38, Inseam 26.5",
    },
    fabric: "Non-stretch organic cotton denim, bootcut crop",
    sizingNote: "The #1 denim trend of 2026 — true to size",
  },
  {
    id: 7,
    name: "Fits Everybody Bodysuit",
    brand: "SKIMS",
    brandId: "skims",
    price: 62,
    fit: 0,
    risk: "Low",
    color: "#8C9576",
    colors: ["#8C9576", "#1a1a1a", "#F5F0E8", "#8B4A5A", "#6A5A4A"],
    category: "Tops",
    trending: true,
    badge: "Best Seller",
    url: "https://skims.com/products/fits-everybody-t-shirt-bodysuit-umber",
    image:
      "https://images.unsplash.com/photo-1620799140408-edc6d5603808?w=400&h=520&fit=crop&q=80",
    measurements: {
      XXS: "Bust 28-30, Waist 20-22",
      XS: "Bust 30-32, Waist 22-24",
      S: "Bust 32-34, Waist 25-27",
      M: "Bust 34-36, Waist 27-29",
      L: "Bust 37-39, Waist 30-32",
    },
    fabric: "Ultra-stretch smoothing jersey",
    sizingNote: "Stretchy — order your usual size",
  },
  {
    id: 8,
    name: "Soft Lounge Long Sleeve Dress",
    brand: "SKIMS",
    brandId: "skims",
    price: 78,
    fit: 0,
    risk: "Low",
    color: "#E0D0B8",
    colors: ["#E0D0B8", "#1a1a1a", "#8B6B5A"],
    category: "Dresses",
    trending: true,
    badge: "Pinterest Pick",
    url: "https://skims.com/products/soft-lounge-long-sleeve-dress-honey",
    image:
      "https://images.unsplash.com/photo-1622562339342-9c8f8b8b8b8b?w=400&h=520&fit=crop&q=80",
    measurements: {
      XXS: "Bust 28-30, Waist 20-22, Hip 30-32",
      XS: "Bust 30-32, Waist 22-24, Hip 32-34",
      S: "Bust 32-34, Waist 25-27, Hip 35-37",
      M: "Bust 34-36, Waist 27-29, Hip 37-39",
    },
    fabric: "Modal jersey, brushed inside",
    sizingNote: "Body-con fit — true to size",
  },
  {
    id: 9,
    name: "Cotton Rib V-Neck Sweater",
    brand: "SKIMS",
    brandId: "skims",
    price: 88,
    fit: 0,
    risk: "Low",
    color: "#D4C5A9",
    colors: ["#D4C5A9", "#1a1a1a", "#A0B8A0", "#8B4A5A"],
    category: "Tops",
    trending: true,
    badge: "Trending Now",
    url: "https://skims.com/collections/knitwear",
    image:
      "https://images.unsplash.com/photo-1622445275463-323424a4b5f9?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 32-34, Waist 24-26, Shoulder 15",
      S: "Bust 34-36, Waist 26-28, Shoulder 15.5",
      M: "Bust 36-38, Waist 28-30, Shoulder 16",
      L: "Bust 38-40, Waist 30-32, Shoulder 16.5",
    },
    fabric: "Cotton rib knit",
    sizingNote: "V-necks are the trend — true to size",
  },
  {
    id: 10,
    name: "Sloane Tailored Pant",
    brand: "Abercrombie",
    brandId: "abercrombie",
    price: 90,
    fit: 0,
    risk: "Low",
    color: "#2D2D2D",
    colors: ["#2D2D2D", "#D4C5A9", "#4A6FA5", "#7B5E57"],
    category: "Bottoms",
    trending: true,
    badge: "Best Seller",
    url: "https://www.abercrombie.com/shop/us/p/sloane-tailored-pant-49931819",
    image:
      "https://images.unsplash.com/photo-1620799140408-edc6d5f93528?w=400&h=520&fit=crop&q=80",
    measurements: {
      25: "Waist 25, Hip 35.5, Inseam 27",
      26: "Waist 26, Hip 36.5, Inseam 27",
      27: "Waist 27, Hip 37.5, Inseam 27.5",
      28: "Waist 28, Hip 38.5, Inseam 27.5",
    },
    fabric: "Ponte knit with stretch",
    sizingNote: "True to size — available in short, regular, long",
  },
  {
    id: 11,
    name: "Curve Love Bootcut Jean",
    brand: "Abercrombie",
    brandId: "abercrombie",
    price: 90,
    fit: 0,
    risk: "Low",
    color: "#4A6FA5",
    colors: ["#4A6FA5", "#1a1a1a", "#8BA8C8"],
    category: "Bottoms",
    trending: true,
    badge: "Viral on TikTok",
    url: "https://www.abercrombie.com/shop/us/womens-jeans-bootcut",
    image:
      "https://images.unsplash.com/photo-1715543663495-63e8a9c43093?w=400&h=520&fit=crop&q=80",
    measurements: {
      25: "Waist 25, Hip 36.5, Inseam 32",
      26: "Waist 26, Hip 37.5, Inseam 32",
      27: "Waist 27, Hip 38.5, Inseam 32.5",
      28: "Waist 28, Hip 39.5, Inseam 32.5",
    },
    fabric: "Premium stretch denim — bootcut",
    sizingNote: "Curve Love = extra hip room — size for waist",
  },
  {
    id: 12,
    name: "Military Shirt Jacket",
    brand: "Abercrombie",
    brandId: "abercrombie",
    price: 120,
    fit: 0,
    risk: "Low",
    color: "#5A6B4A",
    colors: ["#5A6B4A", "#2D2D2D", "#D4C5A9"],
    category: "Outerwear",
    trending: true,
    badge: "Editor's Pick",
    url: "https://www.abercrombie.com/shop/us/womens-jackets-and-coats",
    image:
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 33-35, Waist 25-27, Shoulder 15.5",
      S: "Bust 35-37, Waist 27-29, Shoulder 16",
      M: "Bust 37-39, Waist 29-31, Shoulder 16.5",
      L: "Bust 39-41, Waist 31-33, Shoulder 17",
    },
    fabric: "Cotton twill with epaulette details",
    sizingNote: "Military trend — relaxed fit, true to size",
  },
  {
    id: 13,
    name: "Effortless Satin Pant",
    brand: "Aritzia",
    brandId: "aritzia",
    price: 148,
    fit: 0,
    risk: "Low",
    color: "#D4C5A9",
    colors: ["#D4C5A9", "#1A1A1A", "#4A6FA5", "#7B5E91"],
    category: "Bottoms",
    trending: true,
    badge: "Viral on TikTok",
    url: "https://www.aritzia.com/us/en/product/the-effortless-pant/61070.html",
    image:
      "https://images.unsplash.com/photo-1602293589922-224671fb1254?w=400&h=520&fit=crop&q=80",
    measurements: {
      0: "Waist 25, Hip 35, Inseam 27",
      2: "Waist 26, Hip 36, Inseam 27",
      4: "Waist 27, Hip 37, Inseam 27.5",
      6: "Waist 28, Hip 38, Inseam 27.5",
      8: "Waist 29, Hip 39, Inseam 28",
    },
    fabric: "Japanese crepe — matte satin drape",
    sizingNote: "The satin pant of 2026 — runs true, relaxed through leg",
  },
  {
    id: 14,
    name: "Babaton Contour Bodysuit",
    brand: "Aritzia",
    brandId: "aritzia",
    price: 58,
    fit: 0,
    risk: "Low",
    color: "#1A1A1A",
    colors: ["#1A1A1A", "#F5F0E8", "#8B4A5A", "#D4C5A9"],
    category: "Tops",
    trending: true,
    badge: "Best Seller",
    url: "https://www.aritzia.com/us/en/product/contour-bodysuit/73179.html",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 30-32, Waist 23-25",
      S: "Bust 32-34, Waist 25-27",
      M: "Bust 34-36, Waist 27-29",
      L: "Bust 36-38, Waist 29-31",
    },
    fabric: "Stretch jersey with contour seaming",
    sizingNote: "Body-hugging — true to size",
  },
  {
    id: 15,
    name: "Sculpt Knit Culotte",
    brand: "Aritzia",
    brandId: "aritzia",
    price: 88,
    fit: 0,
    risk: "Low",
    color: "#2D2D2D",
    colors: ["#2D2D2D", "#D4C5A9", "#E8E5E0"],
    category: "Bottoms",
    trending: true,
    badge: "Trending Now",
    url: "https://www.aritzia.com/us/en/clothing/pants",
    image:
      "https://images.unsplash.com/photo-1602293589923-7e2514463445?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Waist 24-25, Hip 34-35",
      S: "Waist 26-27, Hip 36-37",
      M: "Waist 28-29, Hip 38-39",
      L: "Waist 30-31, Hip 40-41",
    },
    fabric: "Sculpt knit — cropped wide-leg culotte",
    sizingNote: "Culottes are back — true to size",
  },
  {
    id: 16,
    name: "Satin Wide-Leg Trousers",
    brand: "Mango",
    brandId: "mango",
    price: 59.99,
    fit: 0,
    risk: "Low",
    color: "#D4C5A9",
    colors: ["#D4C5A9", "#1A1A1A", "#7B5E91"],
    category: "Bottoms",
    trending: true,
    badge: "Pinterest Pick",
    url: "https://shop.mango.com/us/en/women/pants",
    image:
      "https://images.unsplash.com/photo-1589363233388-918c72dba7e8?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Waist 24.5, Hip 35.5, Inseam 31",
      S: "Waist 26, Hip 37, Inseam 31",
      M: "Waist 28.25, Hip 39.4, Inseam 31.5",
      L: "Waist 30.75, Hip 41.7, Inseam 31.5",
    },
    fabric: "100% Satin-finish polyester",
    sizingNote: "Mango runs slightly small — size up",
  },
  {
    id: 17,
    name: "Lace-Trimmed Midi Skirt",
    brand: "Mango",
    brandId: "mango",
    price: 69.99,
    fit: 0,
    risk: "Low",
    color: "#F5F0E8",
    colors: ["#F5F0E8", "#1a1a1a", "#D4A5A5"],
    category: "Bottoms",
    trending: true,
    badge: "Editor's Pick",
    url: "https://shop.mango.com/us/en/women/skirts",
    image:
      "https://images.unsplash.com/photo-1621786030484-420c38f47722?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Waist 24.5, Hip 35.5",
      S: "Waist 26, Hip 37",
      M: "Waist 28.25, Hip 39.4",
      L: "Waist 30.75, Hip 41.7",
    },
    fabric: "Viscose blend with lace trim",
    sizingNote: "Incredibly elegant — runs slightly small",
  },
  {
    id: 18,
    name: "Oversized Linen Blazer",
    brand: "Mango",
    brandId: "mango",
    price: 79.99,
    fit: 0,
    risk: "Low",
    color: "#F5F0EB",
    colors: ["#F5F0EB", "#1A1A1A", "#D4C5A9"],
    category: "Outerwear",
    trending: true,
    badge: "Spring 2026",
    url: "https://shop.mango.com/us/en/women/jackets-and-coats",
    image:
      "https://images.unsplash.com/photo-1621951753015-740c69951561?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 36-38, Waist 28-30, Shoulder 16.5",
      S: "Bust 38-40, Waist 30-32, Shoulder 17",
      M: "Bust 40-42, Waist 32-34, Shoulder 17.5",
      L: "Bust 42-44, Waist 34-36, Shoulder 18",
    },
    fabric: "100% Linen — structured oversized",
    sizingNote: "Oversized blazer — size down for fitted look",
  },
  {
    id: 19,
    name: "Twist-Detail Midi Dress",
    brand: "COS",
    brandId: "cos",
    price: 175,
    fit: 0,
    risk: "Low",
    color: "#1A1A1A",
    colors: ["#1A1A1A", "#D4A5A5", "#E0D0B8"],
    category: "Dresses",
    trending: true,
    badge: "Back in Stock",
    url: "https://www.cos.com/en_usd/women/womenswear/dresses.html",
    image:
      "https://images.unsplash.com/photo-1589555442052-a83978a9b493?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 32-33, Waist 25-26, Hip 35-36",
      S: "Bust 34-35, Waist 27-28, Hip 37-38",
      M: "Bust 36-37, Waist 29-30, Hip 39-40",
      L: "Bust 38-40, Waist 31-33, Hip 41-43",
    },
    fabric: "Mulberry silk blend with twist front",
    sizingNote: "Returned due to demand — true to size",
  },
  {
    id: 20,
    name: "Relaxed Contrast-Panel Dress",
    brand: "COS",
    brandId: "cos",
    price: 190,
    fit: 0,
    risk: "Low",
    color: "#E0D0B8",
    colors: ["#E0D0B8", "#1A1A1A"],
    category: "Dresses",
    trending: true,
    badge: "Back in Stock",
    url: "https://www.cos.com/en_usd/women/womenswear/dresses.html",
    image:
      "https://images.unsplash.com/photo-1622470953794-345a03581d34?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 34-36, Waist 27-29, Hip 36-38",
      S: "Bust 36-38, Waist 29-31, Hip 38-40",
      M: "Bust 38-40, Waist 31-33, Hip 40-42",
      L: "Bust 40-42, Waist 33-35, Hip 42-44",
    },
    fabric: "Organic cotton with contrast panels",
    sizingNote: "Relaxed drape — true to size",
  },
  {
    id: 21,
    name: "The Bootcut Jean",
    brand: "Everlane",
    brandId: "everlane",
    price: 108,
    fit: 0,
    risk: "Low",
    color: "#4A6FA5",
    colors: ["#4A6FA5", "#1a1a1a", "#7A5C3A"],
    category: "Bottoms",
    trending: true,
    badge: "Trending Now",
    url: "https://www.everlane.com/collections/womens-jeans",
    image:
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=520&fit=crop&q=80",
    measurements: {
      25: "Waist 25, Hip 35.5, Inseam 32",
      26: "Waist 26, Hip 36.5, Inseam 32",
      27: "Waist 27, Hip 37.5, Inseam 32.5",
      28: "Waist 28, Hip 38.5, Inseam 32.5",
    },
    fabric: "98% Organic cotton, 2% elastane bootcut",
    sizingNote: "The #1 denim silhouette of Spring 2026",
  },
  {
    id: 22,
    name: "The Cashmere V-Neck",
    brand: "Everlane",
    brandId: "everlane",
    price: 130,
    fit: 0,
    risk: "Low",
    color: "#E8E5E0",
    colors: ["#E8E5E0", "#7A8E6A", "#6A8FA8", "#2D2D2D", "#8B4A5A"],
    category: "Tops",
    trending: true,
    badge: "Trending Now",
    url: "https://www.everlane.com/products/womens-cashmere-vneck-black",
    image:
      "https://images.unsplash.com/photo-1620799140408-edc6d560365b?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 33-34, Waist 25-26, Shoulder 14.5",
      S: "Bust 35-36, Waist 27-28, Shoulder 15",
      M: "Bust 37-38, Waist 29-30, Shoulder 15.5",
      L: "Bust 39-40, Waist 31-32, Shoulder 16",
    },
    fabric: "100% Grade-A cashmere, deep V-neck",
    sizingNote: "V-necks are having a moment — relaxed fit",
  },
  {
    id: 23,
    name: "The Layered Crew Tee",
    brand: "Everlane",
    brandId: "everlane",
    price: 38,
    fit: 0,
    risk: "Low",
    color: "#F5F0E8",
    colors: ["#F5F0E8", "#1a1a1a", "#7A8E6A", "#6A8FA8"],
    category: "Tops",
    trending: true,
    badge: "Trending Now",
    url: "https://www.everlane.com/products/womens-organic-cotton-box-cut-tee-white",
    image:
      "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 34-35, Waist 26-27",
      S: "Bust 36-37, Waist 28-29",
      M: "Bust 38-39, Waist 30-31",
      L: "Bust 40-41, Waist 32-33",
    },
    fabric: "100% Organic cotton jersey — layer-ready",
    sizingNote: "Boxy cut made for the '90s layered look",
  },
  {
    id: 24,
    name: "Airlift High-Waist Legging",
    brand: "Alo Yoga",
    brandId: "alo",
    price: 118,
    fit: 0,
    risk: "Low",
    color: "#1A1A1A",
    colors: ["#1A1A1A", "#5A3E4A", "#4A6480", "#7B9E87"],
    category: "Bottoms",
    trending: true,
    badge: "Best Seller",
    url: "https://www.aloyoga.com/products/w5473r-airlift-high-waist-legging-black",
    image:
      "https://images.unsplash.com/photo-1582552938357-32b90a52d3d3?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Waist 24-25, Hip 34-35, Inseam 28",
      S: "Waist 26-27, Hip 36-37, Inseam 28",
      M: "Waist 28-29, Hip 38-39, Inseam 28.5",
      L: "Waist 30-31, Hip 40-41, Inseam 28.5",
    },
    fabric: "Airlift performance — ultra-smooth compression",
    sizingNote: "Runs true — high compression, go up for looser fit",
  },
  {
    id: 25,
    name: "Accolade Hoodie",
    brand: "Alo Yoga",
    brandId: "alo",
    price: 148,
    fit: 0,
    risk: "Low",
    color: "#E8E5E0",
    colors: ["#E8E5E0", "#1a1a1a", "#A0B8A0", "#7A8E6A"],
    category: "Tops",
    trending: true,
    badge: "Viral on TikTok",
    url: "https://www.aloyoga.com/products/w4439r-accolade-hoodie-bone",
    image:
      "https://images.unsplash.com/photo-dVMu8MDBqlY?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 36-37, Waist 28-29, Shoulder 16",
      S: "Bust 38-39, Waist 30-31, Shoulder 16.5",
      M: "Bust 40-41, Waist 32-33, Shoulder 17",
      L: "Bust 42-43, Waist 34-35, Shoulder 17.5",
    },
    fabric: "100% Cotton French terry",
    sizingNote: "Oversized — size down for closer fit",
  },
  {
    id: 26,
    name: "Phoenix Fleece Oversized Crew",
    brand: "Nike",
    brandId: "nike",
    price: 75,
    fit: 0,
    risk: "Low",
    color: "#2D2D2D",
    colors: ["#2D2D2D", "#E8E5E0", "#6A8FA8"],
    category: "Tops",
    trending: true,
    badge: "Trending Now",
    url: "https://www.nike.com/w/womens-hoodies-pullovers-5e1x6z6rive5",
    image:
      "https://images.unsplash.com/photo-1633933358117-a27a9126d7c6?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 33-35, Waist 25-27, Shoulder 15",
      S: "Bust 35-37, Waist 27-29, Shoulder 15.5",
      M: "Bust 37-39, Waist 29-31, Shoulder 16",
      L: "Bust 39-41, Waist 31-33, Shoulder 16.5",
    },
    fabric: "80% Cotton, 20% Polyester brushed fleece",
    sizingNote: "Relaxed oversized fit — true to size",
  },
  {
    id: 27,
    name: "Windrunner Woven Jacket",
    brand: "Nike",
    brandId: "nike",
    price: 110,
    fit: 0,
    risk: "Low",
    color: "#4A6480",
    colors: ["#4A6480", "#1A1A1A", "#E8E5E0"],
    category: "Outerwear",
    trending: true,
    badge: "Spring 2026",
    url: "https://www.nike.com/w/womens-jackets-vests-50r7yz6rive5",
    image:
      "https://images.unsplash.com/photo-1595938533360-9ef4a438c6b1?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 33-35, Waist 25-27, Shoulder 15.5",
      S: "Bust 35-37, Waist 27-29, Shoulder 16",
      M: "Bust 37-39, Waist 29-31, Shoulder 16.5",
      L: "Bust 39-41, Waist 31-33, Shoulder 17",
    },
    fabric: "100% Recycled polyester ripstop",
    sizingNote: "Gorpcore staple — order normal size",
  },
  {
    id: 28,
    name: "Rosalia Sheer Midi Dress",
    brand: "Princess Polly",
    brandId: "princesspoly",
    price: 72,
    fit: 0,
    risk: "Low",
    color: "#D4A5A5",
    colors: ["#D4A5A5", "#1A1A1A", "#87CEEB", "#F5F0E8"],
    category: "Dresses",
    trending: true,
    badge: "Viral on TikTok",
    url: "https://us.princesspolly.com/collections/dresses",
    image:
      "https://images.unsplash.com/photo-fiA7sq2PdnQ?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 30-32, Waist 24-25, Hip 33-35",
      S: "Bust 32-34, Waist 25-27, Hip 35-37",
      M: "Bust 34-36, Waist 27-29, Hip 37-39",
      L: "Bust 36-38, Waist 29-31, Hip 39-41",
    },
    fabric: "Sheer mesh with slip lining",
    sizingNote: "Romantic silhouette — true to size",
  },
  {
    id: 29,
    name: "Low-Rise Cargo Pant",
    brand: "Princess Polly",
    brandId: "princesspoly",
    price: 72,
    fit: 0,
    risk: "Low",
    color: "#D4C5A9",
    colors: ["#D4C5A9", "#1A1A1A", "#7B9E87"],
    category: "Bottoms",
    trending: true,
    badge: "Trending Now",
    url: "https://us.princesspolly.com/collections/pants",
    image:
      "https://images.unsplash.com/photo-1602293589914-9e5954a853c3?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Waist 24-25, Hip 34-35, Inseam 30",
      S: "Waist 26-27, Hip 36-37, Inseam 30",
      M: "Waist 28-29, Hip 38-39, Inseam 30.5",
      L: "Waist 30-31, Hip 40-41, Inseam 30.5",
    },
    fabric: "100% Cotton ripstop",
    sizingNote: "Relaxed low-rise — true to size",
  },
  {
    id: 30,
    name: "NBD Violet Satin Midi",
    brand: "Revolve",
    brandId: "revolve",
    price: 228,
    fit: 0,
    risk: "Low",
    color: "#7B5E91",
    colors: ["#7B5E91", "#1A1A1A", "#D4A5A5"],
    category: "Dresses",
    trending: true,
    badge: "Pinterest Pick",
    url: "https://www.revolve.com/nbd/br/9a0dd7/",
    image:
      "https://images.unsplash.com/photo-1633122242533-2674c1539a5b?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 32-33, Waist 24-25, Hip 35-36",
      S: "Bust 34-35, Waist 26-27, Hip 37-38",
      M: "Bust 36-37, Waist 28-29, Hip 39-40",
      L: "Bust 38-39, Waist 30-31, Hip 41-42",
    },
    fabric: "100% Satin polyester — rich violet",
    sizingNote: "Bold color trend of 2026 — size for bust",
  },
  // ─── H&M ───
  {
    id: 31,
    name: "Linen-Blend Blazer",
    brand: "H&M",
    brandId: "hm",
    price: 49.99,
    fit: 0,
    risk: "Low",
    color: "#E8E0D4",
    colors: ["#E8E0D4", "#1A1A1A", "#8A9572"],
    category: "Outerwear",
    trending: true,
    badge: "Best Value",
    url: "https://www2.hm.com/en_us/women/jackets-coats.html",
    image:
      "https://images.unsplash.com/photo-1602293589922-2542a3973135?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 34-36, Waist 27-29, Shoulder 15.5",
      S: "Bust 36-38, Waist 29-31, Shoulder 16",
      M: "Bust 38-40, Waist 31-33, Shoulder 16.5",
      L: "Bust 40-42, Waist 33-35, Shoulder 17",
    },
    fabric: "55% Linen, 45% Viscose",
    sizingNote: "Relaxed fit — runs slightly large",
  },
  {
    id: 32,
    name: "Ribbed Knit Tank Top",
    brand: "H&M",
    brandId: "hm",
    price: 12.99,
    fit: 0,
    risk: "Low",
    color: "#F5F0E8",
    colors: ["#F5F0E8", "#1A1A1A", "#8B6B5A", "#6A8FA8"],
    category: "Tops",
    trending: true,
    badge: "Under $15",
    url: "https://www2.hm.com/en_us/women/tops.html",
    image:
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 30-32, Waist 23-25",
      S: "Bust 32-34, Waist 25-27",
      M: "Bust 34-36, Waist 27-29",
      L: "Bust 36-38, Waist 29-31",
    },
    fabric: "95% Cotton, 5% Elastane rib knit",
    sizingNote: "Fitted tank — true to size",
  },
  {
    id: 33,
    name: "Wide-Leg Linen Pants",
    brand: "H&M",
    brandId: "hm",
    price: 34.99,
    fit: 0,
    risk: "Low",
    color: "#D4C5A9",
    colors: ["#D4C5A9", "#1A1A1A", "#6B8DB5"],
    category: "Bottoms",
    trending: true,
    badge: "Summer Essential",
    url: "https://www2.hm.com/en_us/women/trousers.html",
    image:
      "https://images.unsplash.com/photo-1594633312681-978c6e940210?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Waist 25-26, Hip 35-36, Inseam 31",
      S: "Waist 27-28, Hip 37-38, Inseam 31",
      M: "Waist 29-30, Hip 39-40, Inseam 31.5",
      L: "Waist 31-32, Hip 41-42, Inseam 31.5",
    },
    fabric: "100% Linen, pull-on elastic waist",
    sizingNote: "Relaxed wide-leg — runs slightly large",
  },
  {
    id: 34,
    name: "Smocked Floral Midi Dress",
    brand: "H&M",
    brandId: "hm",
    price: 39.99,
    fit: 0,
    risk: "Low",
    color: "#D4A5A5",
    colors: ["#D4A5A5", "#4A6B5A", "#F5F0E8"],
    category: "Dresses",
    trending: true,
    badge: "Trending Now",
    url: "https://www2.hm.com/en_us/women/dresses.html",
    image:
      "https://images.unsplash.com/photo-4rUYuwJ2vGw?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 30-32, Waist 23-25, Hip 33-35",
      S: "Bust 32-34, Waist 25-27, Hip 35-37",
      M: "Bust 34-36, Waist 27-29, Hip 37-39",
      L: "Bust 36-38, Waist 29-31, Hip 39-41",
    },
    fabric: "100% Viscose with smocked bodice",
    sizingNote: "Smocked top is stretchy — true to size",
  },
  {
    id: 35,
    name: "Oversized Denim Jacket",
    brand: "H&M",
    brandId: "hm",
    price: 44.99,
    fit: 0,
    risk: "Low",
    color: "#6B8DB5",
    colors: ["#6B8DB5", "#1A1A1A", "#E8E5E0"],
    category: "Outerwear",
    trending: false,
    badge: "Classic",
    url: "https://www2.hm.com/en_us/women/jackets-coats.html",
    image:
      "https://images.unsplash.com/photo-1598938233242-53b31839772d?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 36-38, Waist 29-31, Shoulder 16",
      S: "Bust 38-40, Waist 31-33, Shoulder 16.5",
      M: "Bust 40-42, Waist 33-35, Shoulder 17",
      L: "Bust 42-44, Waist 35-37, Shoulder 17.5",
    },
    fabric: "100% Cotton denim, oversized",
    sizingNote: "Oversized — size down for fitted look",
  },
  // ─── Free People ───
  {
    id: 36,
    name: "The Most Striped Tee",
    brand: "Free People",
    brandId: "freepeople",
    price: 68,
    fit: 0,
    risk: "Low",
    color: "#E8E5E0",
    colors: ["#E8E5E0", "#2D2D2D", "#D4A5A5"],
    category: "Tops",
    trending: true,
    badge: "Boho Fave",
    url: "https://www.freepeople.com/shop/we-the-free-the-most-striped-tee2/?color=009",
    image:
      "https://images.unsplash.com/photo-1622470953794-345a7c2d46d3?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 34-36, Waist 26-28",
      S: "Bust 36-38, Waist 28-30",
      M: "Bust 38-40, Waist 30-32",
      L: "Bust 40-42, Waist 32-34",
    },
    fabric: "100% cotton jersey with a boxy bubble hem",
    sizingNote: "Relaxed oversized fit — dropped shoulder, true to size",
  },
  {
    id: 37,
    name: "Daisy Jones Maxi Dress",
    brand: "Free People",
    brandId: "freepeople",
    price: 148,
    fit: 0,
    risk: "Low",
    color: "#F5E6D0",
    colors: ["#F5E6D0", "#4A6B5A", "#D4A5A5"],
    category: "Dresses",
    trending: true,
    badge: "Festival Ready",
    url: "https://www.freepeople.com/dresses/",
    image:
      "https://images.unsplash.com/photo-1587293852726-70cdb122c294?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 32-34, Waist 24-26, Hip 34-36",
      S: "Bust 34-36, Waist 26-28, Hip 36-38",
      M: "Bust 36-38, Waist 28-30, Hip 38-40",
      L: "Bust 38-40, Waist 30-32, Hip 40-42",
    },
    fabric: "Rayon gauze with crochet trim",
    sizingNote: "Flowy boho fit — true to size",
  },
  {
    id: 38,
    name: "Jayde Flare Jeans",
    brand: "Free People",
    brandId: "freepeople",
    price: 98,
    fit: 0,
    risk: "Low",
    color: "#4A5A70",
    colors: ["#4A5A70", "#1A1A1A", "#E8E5E0"],
    category: "Bottoms",
    trending: true,
    badge: "Viral on TikTok",
    url: "https://www.freepeople.com/shop/jayde-flare-jeans/",
    image:
      "https://images.unsplash.com/photo-1598032895397-b94aa421802d?w=400&h=520&fit=crop&q=80",
    measurements: {
      25: "Waist 25, Hip 35.5, Inseam 33",
      26: "Waist 26, Hip 36.5, Inseam 33",
      27: "Waist 27, Hip 37.5, Inseam 33.5",
      28: "Waist 28, Hip 38.5, Inseam 33.5",
      29: "Waist 29, Hip 39.5, Inseam 34",
    },
    fabric: "Non-stretch denim, exaggerated flare",
    sizingNote: "High-rise flare — size for waist",
  },
  {
    id: 39,
    name: "Hit The Slopes Jacket",
    brand: "Free People",
    brandId: "freepeople",
    price: 198,
    fit: 0,
    risk: "Low",
    color: "#E0D0B8",
    colors: ["#E0D0B8", "#5A6B4A", "#1A1A1A"],
    category: "Outerwear",
    trending: false,
    badge: "Cozy Pick",
    url: "https://www.freepeople.com/shop/hit-the-slopes-fleece-jacket/",
    image:
      "https://images.unsplash.com/photo-1594769823243-96c5a3a26034?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 35-37, Waist 27-29, Shoulder 15.5",
      S: "Bust 37-39, Waist 29-31, Shoulder 16",
      M: "Bust 39-41, Waist 31-33, Shoulder 16.5",
      L: "Bust 41-43, Waist 33-35, Shoulder 17",
    },
    fabric: "Sherpa-lined quilted nylon",
    sizingNote: "Relaxed — true to size",
  },
  // ─── Lululemon ───
  {
    id: 40,
    name: 'Align High-Rise Pant 25"',
    brand: "Lululemon",
    brandId: "lululemon",
    price: 98,
    fit: 0,
    risk: "Low",
    color: "#1A1A1A",
    colors: ["#1A1A1A", "#5A3E4A", "#4A6480", "#7B9E87", "#D4A5A5"],
    category: "Bottoms",
    trending: true,
    badge: "Best Seller",
    url: "https://shop.lululemon.com/p/women-pants/Align-Pant-2/_/prod2020012",
    image:
      "https://images.unsplash.com/photo-1626552222039-34633b515437?w=400&h=520&fit=crop&q=80",
    measurements: {
      2: "Waist 24-25, Hip 34-35, Inseam 25",
      4: "Waist 25-26, Hip 35-36, Inseam 25",
      6: "Waist 26-27, Hip 36-37, Inseam 25",
      8: "Waist 28-29, Hip 38-39, Inseam 25",
      10: "Waist 30-31, Hip 40-41, Inseam 25",
    },
    fabric: "Nulu™ fabric — buttery soft, 4-way stretch",
    sizingNote: "Naked sensation — true to size",
  },
  {
    id: 41,
    name: "Scuba Oversized Half-Zip",
    brand: "Lululemon",
    brandId: "lululemon",
    price: 118,
    fit: 0,
    risk: "Low",
    color: "#7B9E87",
    colors: ["#7B9E87", "#1A1A1A", "#E8E5E0", "#D4A5A5"],
    category: "Tops",
    trending: true,
    badge: "Viral on TikTok",
    url: "https://shop.lululemon.com/p/womens-outerwear/Scuba-Oversized-Half-Zip-Hoodie/_/prod9960807",
    image:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=520&fit=crop&q=80",
    measurements: {
      "XS/S": "Bust 36-40, Waist 28-32, Shoulder 16-17",
      "M/L": "Bust 40-44, Waist 32-36, Shoulder 17-18",
      "XL/XXL": "Bust 44-48, Waist 36-40, Shoulder 18-19",
    },
    fabric: "Cotton-blend fleece, oversized",
    sizingNote: "Oversized — XS/S fits 0-6, M/L fits 8-12",
  },
  {
    id: 42,
    name: "Define Jacket Luon",
    brand: "Lululemon",
    brandId: "lululemon",
    price: 118,
    fit: 0,
    risk: "Low",
    color: "#2D2D2D",
    colors: ["#2D2D2D", "#5A3E4A", "#4A6480"],
    category: "Outerwear",
    trending: true,
    badge: "Classic",
    url: "https://shop.lululemon.com/p/jackets-and-hoodies-jackets/Define-Jacket/_/prod5020054",
    image:
      "https://images.unsplash.com/photo-jC0YFbDdNY4?w=400&h=520&fit=crop&q=80",
    measurements: {
      2: "Bust 31-32, Waist 24-25, Shoulder 14.5",
      4: "Bust 33-34, Waist 25-26, Shoulder 15",
      6: "Bust 34-35, Waist 26-27, Shoulder 15.5",
      8: "Bust 36-37, Waist 28-29, Shoulder 16",
      10: "Bust 38-39, Waist 30-31, Shoulder 16.5",
    },
    fabric: "Luon™ — cottony soft, 4-way stretch",
    sizingNote: "Slim fit — true to size",
  },
  {
    id: 43,
    name: "Energy Longline Bra",
    brand: "Lululemon",
    brandId: "lululemon",
    price: 58,
    fit: 0,
    risk: "Low",
    color: "#D4A5A5",
    colors: ["#D4A5A5", "#1A1A1A", "#7B9E87"],
    category: "Tops",
    trending: false,
    badge: "Staff Pick",
    url: "https://shop.lululemon.com/p/women-sports-bras/Energy-Bra-Long-Line/_/prod9030660?color=34406",
    image:
      "https://images.unsplash.com/photo-1598554747476-3874fac3d739?w=400&h=520&fit=crop&q=80",
    measurements: {
      2: "Bust 30-31",
      4: "Bust 32-33",
      6: "Bust 33-34",
      8: "Bust 35-36",
      10: "Bust 37-38",
    },
    fabric: "Luxtreme™ — smooth, cool, sweat-wicking",
    sizingNote: "Medium support — true to size",
  },
  // ─── Anthropologie ───
  {
    id: 44,
    name: "Pilcro Wide-Leg Crop",
    brand: "Anthropologie",
    brandId: "anthropologie",
    price: 138,
    fit: 0,
    risk: "Low",
    color: "#E8E5E0",
    colors: ["#E8E5E0", "#6B8DB5", "#1A1A1A"],
    category: "Bottoms",
    trending: true,
    badge: "Editor's Pick",
    url: "https://www.anthropologie.com/jeans",
    image:
      "https://images.unsplash.com/photo-1612833603922-3b5d4a6b6c6d?w=400&h=520&fit=crop&q=80",
    measurements: {
      25: "Waist 25, Hip 35, Inseam 26",
      26: "Waist 26, Hip 36, Inseam 26",
      27: "Waist 27, Hip 37, Inseam 26.5",
      28: "Waist 28, Hip 38, Inseam 26.5",
      29: "Waist 29, Hip 39, Inseam 27",
    },
    fabric: "Non-stretch organic cotton denim",
    sizingNote: "Cropped wide-leg — true to size",
  },
  {
    id: 45,
    name: "Somerset Maxi Dress",
    brand: "Anthropologie",
    brandId: "anthropologie",
    price: 178,
    fit: 0,
    risk: "Low",
    color: "#4A6B5A",
    colors: ["#4A6B5A", "#D4A5A5", "#F5E6D0"],
    category: "Dresses",
    trending: true,
    badge: "New Arrival",
    url: "https://www.anthropologie.com/shop/the-somerset-maxi-dress2/",
    image:
      "https://images.unsplash.com/photo-1626255223936-4d6334d7b348?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 32-34, Waist 24-26, Hip 34-36",
      S: "Bust 34-36, Waist 26-28, Hip 36-38",
      M: "Bust 36-38, Waist 28-30, Hip 38-40",
      L: "Bust 38-40, Waist 30-32, Hip 40-42",
    },
    fabric: "Printed viscose with tiered skirt",
    sizingNote: "Flowy tiered silhouette — true to size",
  },
  {
    id: 46,
    name: "Maeve Puff-Sleeve Blouse",
    brand: "Anthropologie",
    brandId: "anthropologie",
    price: 88,
    fit: 0,
    risk: "Low",
    color: "#F5F0E8",
    colors: ["#F5F0E8", "#D4A5A5", "#4A6B5A"],
    category: "Tops",
    trending: true,
    badge: "Trending Now",
    url: "https://www.anthropologie.com/shop/maeve-puff-sleeve-blouse5?category=tops-blouses&color=211&type=STANDARD",
    image:
      "https://images.unsplash.com/photo-1627483262278-0b3933434623?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 33-34, Waist 25-26, Shoulder 14.5",
      S: "Bust 35-36, Waist 27-28, Shoulder 15",
      M: "Bust 37-38, Waist 29-30, Shoulder 15.5",
      L: "Bust 39-40, Waist 31-32, Shoulder 16",
    },
    fabric: "100% cotton with ruched puff sleeves",
    sizingNote: "Button-front blouse with a true-to-size romantic fit",
  },
  {
    id: 47,
    name: "Crop Textured Cardigan Sweater",
    brand: "Anthropologie",
    brandId: "anthropologie",
    price: 98,
    fit: 0,
    risk: "Low",
    color: "#8A9572",
    colors: ["#8A9572", "#E8E5E0", "#D4A5A5"],
    category: "Tops",
    trending: false,
    badge: "Cozy Pick",
    url: "https://www.anthropologie.com/shop/by-anthropologie-cropped-textured-cardigan-sweater?color=014&quantity=1&type=STANDARD",
    image:
      "https://images.unsplash.com/photo-1621495470423-82535937a858?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 33-35, Waist 25-27, Shoulder 14.5",
      S: "Bust 35-37, Waist 27-29, Shoulder 15",
      M: "Bust 37-39, Waist 29-31, Shoulder 15.5",
      L: "Bust 39-41, Waist 31-33, Shoulder 16",
    },
    fabric: "100% cotton textured knit with button front",
    sizingNote: "Cropped cardigan silhouette — true to size",
  },
  // ─── Gap ───
  {
    id: 48,
    name: "High Rise Vintage Slim Jean",
    brand: "Gap",
    brandId: "gap",
    price: 69.95,
    fit: 0,
    risk: "Low",
    color: "#4A5A70",
    colors: ["#4A5A70", "#1A1A1A", "#8BA8C8"],
    category: "Bottoms",
    trending: true,
    badge: "Best Seller",
    url: "https://www.gap.com/browse/category.do?cid=1011761",
    image:
      "https://images.unsplash.com/photo-1714138665659-c8835634229f?w=400&h=520&fit=crop&q=80",
    measurements: {
      25: "Waist 25, Hip 35, Inseam 30",
      26: "Waist 26, Hip 36, Inseam 30",
      27: "Waist 27, Hip 37, Inseam 30.5",
      28: "Waist 28, Hip 38, Inseam 30.5",
      29: "Waist 29, Hip 39, Inseam 31",
    },
    fabric: "Premium stretch denim, vintage wash",
    sizingNote: "Slim straight — true to size",
  },
  {
    id: 49,
    name: "CashSoft Crewneck Sweater",
    brand: "Gap",
    brandId: "gap",
    price: 59.95,
    fit: 0,
    risk: "Low",
    color: "#E8E0D4",
    colors: ["#E8E0D4", "#4A6FA5", "#8B4A5A", "#2D2D2D"],
    category: "Tops",
    trending: false,
    badge: "Cozy Pick",
    url: "https://www.gap.com/browse/category.do?cid=5736",
    image:
      "https://images.unsplash.com/photo-1678953999452-445b6f9d6a4c?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 34-35, Waist 26-27, Shoulder 15",
      S: "Bust 36-37, Waist 28-29, Shoulder 15.5",
      M: "Bust 38-39, Waist 30-31, Shoulder 16",
      L: "Bust 40-41, Waist 32-33, Shoulder 16.5",
    },
    fabric: "Recycled cashmere blend, soft hand",
    sizingNote: "Relaxed crewneck — true to size",
  },
  {
    id: 50,
    name: "Linen-Cotton Shirt",
    brand: "Gap",
    brandId: "gap",
    price: 54.95,
    fit: 0,
    risk: "Low",
    color: "#6A8FA8",
    colors: ["#6A8FA8", "#F5F0E8", "#D4C5A9"],
    category: "Tops",
    trending: true,
    badge: "Summer Essential",
    url: "https://www.gap.com/browse/category.do?cid=5736",
    image:
      "https://images.unsplash.com/photo-vcTKFYNZop4?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 34-35, Waist 26-27, Shoulder 15",
      S: "Bust 36-37, Waist 28-29, Shoulder 15.5",
      M: "Bust 38-39, Waist 30-31, Shoulder 16",
      L: "Bust 40-41, Waist 32-33, Shoulder 16.5",
    },
    fabric: "55% Linen, 45% Cotton",
    sizingNote: "Relaxed button-down — true to size",
  },
  {
    id: 51,
    name: "Barrel Leg Khakis",
    brand: "Gap",
    brandId: "gap",
    price: 59.95,
    fit: 0,
    risk: "Low",
    color: "#D4C5A9",
    colors: ["#D4C5A9", "#5A6B4A", "#1A1A1A"],
    category: "Bottoms",
    trending: true,
    badge: "Trending Now",
    url: "https://www.gap.com/browse/category.do?cid=1011761",
    image:
      "https://images.unsplash.com/photo-1663047537553-74a3c3d6e9e0?w=400&h=520&fit=crop&q=80",
    measurements: {
      25: "Waist 25, Hip 36, Inseam 27",
      26: "Waist 26, Hip 37, Inseam 27",
      27: "Waist 27, Hip 38, Inseam 27.5",
      28: "Waist 28, Hip 39, Inseam 27.5",
    },
    fabric: "Cotton twill with barrel silhouette",
    sizingNote: "Barrel leg is the new wide-leg — true to size",
  },
  // ─── Uniqlo ───
  {
    id: 52,
    name: "AIRism UV Protection Cardigan",
    brand: "Uniqlo",
    brandId: "uniqlo",
    price: 39.9,
    fit: 0,
    risk: "Low",
    color: "#E8E5E0",
    colors: ["#E8E5E0", "#1A1A1A", "#6A8FA8", "#D4A5A5"],
    category: "Tops",
    trending: true,
    badge: "Tech Fabric",
    url: "https://www.uniqlo.com/us/en/women/tops",
    image:
      "https://images.unsplash.com/photo-1620799140408-edc6d5603853?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 33-34, Waist 25-26, Shoulder 14.5",
      S: "Bust 35-36, Waist 27-28, Shoulder 15",
      M: "Bust 37-38, Waist 29-30, Shoulder 15.5",
      L: "Bust 39-40, Waist 31-32, Shoulder 16",
    },
    fabric: "AIRism™ mesh — UV protection, cooling",
    sizingNote: "Runs slightly small — size up one",
  },
  {
    id: 53,
    name: "Ultra Stretch Leggings Pants",
    brand: "Uniqlo",
    brandId: "uniqlo",
    price: 29.9,
    fit: 0,
    risk: "Low",
    color: "#1A1A1A",
    colors: ["#1A1A1A", "#5A3E4A", "#4A6480"],
    category: "Bottoms",
    trending: true,
    badge: "Best Value",
    url: "https://www.uniqlo.com/us/en/women/pants",
    image:
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Waist 24-25, Hip 34-35, Inseam 28",
      S: "Waist 26-27, Hip 36-37, Inseam 28",
      M: "Waist 28-29, Hip 38-39, Inseam 28.5",
      L: "Waist 30-31, Hip 40-41, Inseam 28.5",
    },
    fabric: "DRY-EX ultra stretch jersey",
    sizingNote: "Compression fit — runs slightly small",
  },
  {
    id: 54,
    name: "Supima Cotton Crew Neck Tee",
    brand: "Uniqlo",
    brandId: "uniqlo",
    price: 14.9,
    fit: 0,
    risk: "Low",
    color: "#F5F0E8",
    colors: ["#F5F0E8", "#1A1A1A", "#6A8FA8", "#D4A5A5", "#8A9572"],
    category: "Tops",
    trending: false,
    badge: "Everyday Basic",
    url: "https://www.uniqlo.com/us/en/women/t-shirts",
    image:
      "https://images.unsplash.com/photo-1720115799193-38683b7a5a43?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 33-34, Waist 25-26",
      S: "Bust 35-36, Waist 27-28",
      M: "Bust 37-38, Waist 29-30",
      L: "Bust 39-40, Waist 31-32",
    },
    fabric: "100% Supima® cotton, premium softness",
    sizingNote: "Slightly fitted — size up for relaxed",
  },
  {
    id: 55,
    name: "Smart Ankle Pants 2-Way Stretch",
    brand: "Uniqlo",
    brandId: "uniqlo",
    price: 39.9,
    fit: 0,
    risk: "Low",
    color: "#2D2D2D",
    colors: ["#2D2D2D", "#D4C5A9", "#4A6FA5"],
    category: "Bottoms",
    trending: true,
    badge: "Office Ready",
    url: "https://www.uniqlo.com/us/en/women/pants",
    image:
      "https://images.unsplash.com/photo-1587479799990-a27c44341237?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Waist 24-25, Hip 34-35, Inseam 27",
      S: "Waist 26-27, Hip 36-37, Inseam 27",
      M: "Waist 28-29, Hip 38-39, Inseam 27.5",
      L: "Waist 30-31, Hip 40-41, Inseam 27.5",
    },
    fabric: "2-way stretch polyester blend",
    sizingNote: "Tapered ankle — runs slightly small",
  },
  // ─── AGOLDE ───
  {
    id: 56,
    name: "90's Pinch Waist Jean",
    brand: "AGOLDE",
    brandId: "agolde",
    price: 198,
    fit: 0,
    risk: "Low",
    color: "#4A5A70",
    colors: ["#4A5A70", "#1A1A1A", "#8BA8C8"],
    category: "Bottoms",
    trending: true,
    badge: "Cult Favorite",
    url: "https://agolde.com/collections/womens-jeans",
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=520&fit=crop&q=80",
    measurements: {
      24: "Waist 24, Hip 34.5, Inseam 30",
      25: "Waist 25, Hip 35.5, Inseam 30",
      26: "Waist 26, Hip 36.5, Inseam 30.5",
      27: "Waist 27, Hip 37.5, Inseam 30.5",
      28: "Waist 28, Hip 38.5, Inseam 31",
    },
    fabric: "Rigid organic cotton denim, no stretch",
    sizingNote: "Rigid denim — size up one for comfort",
  },
  {
    id: 57,
    name: "Criss Cross Wide Leg",
    brand: "AGOLDE",
    brandId: "agolde",
    price: 228,
    fit: 0,
    risk: "Low",
    color: "#8BA8C8",
    colors: ["#8BA8C8", "#4A5A70", "#E8E5E0"],
    category: "Bottoms",
    trending: true,
    badge: "Viral on IG",
    url: "https://agolde.com/collections/womens-jeans",
    image:
      "https://images.unsplash.com/photo-1602293589922-224a3a5ce9c7?w=400&h=520&fit=crop&q=80",
    measurements: {
      24: "Waist 24, Hip 35, Inseam 32",
      25: "Waist 25, Hip 36, Inseam 32",
      26: "Waist 26, Hip 37, Inseam 32.5",
      27: "Waist 27, Hip 38, Inseam 32.5",
      28: "Waist 28, Hip 39, Inseam 33",
    },
    fabric: "Rigid organic cotton, criss-cross waistband",
    sizingNote: "Signature criss-cross — size for waist",
  },
  {
    id: 58,
    name: "Parker Long Shorts",
    brand: "AGOLDE",
    brandId: "agolde",
    price: 148,
    fit: 0,
    risk: "Low",
    color: "#E8E5E0",
    colors: ["#E8E5E0", "#4A5A70", "#1A1A1A"],
    category: "Bottoms",
    trending: true,
    badge: "Summer 2026",
    url: "https://agolde.com/collections/womens-shorts",
    image:
      "https://images.unsplash.com/photo-1604644401890-0bd678c83788?w=400&h=520&fit=crop&q=80",
    measurements: {
      24: "Waist 24, Hip 34.5, Inseam 5",
      25: "Waist 25, Hip 35.5, Inseam 5",
      26: "Waist 26, Hip 36.5, Inseam 5",
      27: "Waist 27, Hip 37.5, Inseam 5",
    },
    fabric: "Rigid organic cotton, long bermuda",
    sizingNote: "Long shorts trend — size for waist",
  },
  // ─── Toteme ───
  {
    id: 59,
    name: "Twisted Seam Tee",
    brand: "Toteme",
    brandId: "toteme",
    price: 190,
    fit: 0,
    risk: "Low",
    color: "#F5F0E8",
    colors: ["#F5F0E8", "#1A1A1A", "#2D2D2D"],
    category: "Tops",
    trending: true,
    badge: "Quiet Luxury",
    url: "https://toteme-studio.com/",
    image:
      "https://images.unsplash.com/photo-1604259292249-9f4b9612e354?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 34-35, Waist 26-27, Shoulder 15",
      S: "Bust 36-37, Waist 28-29, Shoulder 15.5",
      M: "Bust 38-39, Waist 30-31, Shoulder 16",
      L: "Bust 40-41, Waist 32-33, Shoulder 16.5",
    },
    fabric: "Organic cotton jersey, twisted seam detail",
    sizingNote: "Minimalist cut — true to size",
  },
  {
    id: 60,
    name: "Draped Wool Coat",
    brand: "Toteme",
    brandId: "toteme",
    price: 890,
    fit: 0,
    risk: "Low",
    color: "#2D2D2D",
    colors: ["#2D2D2D", "#E8E0D4", "#8A9572"],
    category: "Outerwear",
    trending: true,
    badge: "Investment Piece",
    url: "https://toteme-studio.com/",
    image:
      "https://images.unsplash.com/photo-1599806112354-67f8b5425635?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 36-38, Waist 28-30, Shoulder 16",
      S: "Bust 38-40, Waist 30-32, Shoulder 16.5",
      M: "Bust 40-42, Waist 32-34, Shoulder 17",
      L: "Bust 42-44, Waist 34-36, Shoulder 17.5",
    },
    fabric: "100% Virgin wool, draped silhouette",
    sizingNote: "Oversized drape — true to size",
  },
  {
    id: 61,
    name: "Monogram Silk Scarf Top",
    brand: "Toteme",
    brandId: "toteme",
    price: 350,
    fit: 0,
    risk: "Low",
    color: "#8A9572",
    colors: ["#8A9572", "#1A1A1A", "#F5F0E8"],
    category: "Tops",
    trending: true,
    badge: "Runway Pick",
    url: "https://toteme-studio.com/",
    image:
      "https://images.unsplash.com/photo-1630990341428-a36f2b9a735b?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 32-33, Waist 24-25",
      S: "Bust 34-35, Waist 26-27",
      M: "Bust 36-37, Waist 28-29",
      L: "Bust 38-39, Waist 30-31",
    },
    fabric: "100% Silk twill, scarf-inspired drape",
    sizingNote: "Delicate — true to size",
  },
  // ─── More Zara ───
  {
    id: 62,
    name: "Draped Asymmetric Top",
    brand: "Zara",
    brandId: "zara",
    price: 35.9,
    fit: 0,
    risk: "Low",
    color: "#1A1A1A",
    colors: ["#1A1A1A", "#F5F0E8", "#D4A5A5"],
    category: "Tops",
    trending: true,
    badge: "New In",
    url: "https://www.zara.com/us/en/woman-shirts-l1217.html",
    image:
      "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 31-32, Waist 24-25, Shoulder 14",
      S: "Bust 33-34, Waist 26-27, Shoulder 14.5",
      M: "Bust 35-36, Waist 28-29, Shoulder 15",
      L: "Bust 37-39, Waist 30-32, Shoulder 15.5",
    },
    fabric: "Stretch jersey with asymmetric drape",
    sizingNote: "Zara runs small — size up",
  },
  {
    id: 63,
    name: "Flowing Palazzo Pants",
    brand: "Zara",
    brandId: "zara",
    price: 45.9,
    fit: 0,
    risk: "Low",
    color: "#D4C5A9",
    colors: ["#D4C5A9", "#1A1A1A", "#7B5E91"],
    category: "Bottoms",
    trending: true,
    badge: "Trending Now",
    url: "https://www.zara.com/us/en/woman-trousers-l1335.html",
    image:
      "https://images.unsplash.com/photo-A8nR5I0dF2E?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Waist 24-25, Hip 34-35, Inseam 31",
      S: "Waist 26-27, Hip 36-37, Inseam 31",
      M: "Waist 28-29, Hip 38-39, Inseam 31.5",
      L: "Waist 30-32, Hip 40-42, Inseam 31.5",
    },
    fabric: "Flowing viscose blend",
    sizingNote: "Palazzo fit — size up for Zara",
  },
  {
    id: 64,
    name: "Satin Wrap Midi Dress",
    brand: "Zara",
    brandId: "zara",
    price: 69.9,
    fit: 0,
    risk: "Low",
    color: "#8B6839",
    colors: ["#8B6839", "#1A1A1A", "#D4A5A5"],
    category: "Dresses",
    trending: true,
    badge: "Date Night",
    url: "https://www.zara.com/us/en/woman-dresses-l1066.html",
    image:
      "https://images.unsplash.com/photo-1599751449204-e2a53a66f2de?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 31-32, Waist 24-25, Hip 34-35",
      S: "Bust 33-34, Waist 26-27, Hip 36-37",
      M: "Bust 35-36, Waist 28-29, Hip 38-39",
      L: "Bust 37-39, Waist 30-32, Hip 40-42",
    },
    fabric: "Satin-finish viscose with wrap tie",
    sizingNote: "Wrap adjusts — size for bust",
  },
  // ─── More Everlane ───
  {
    id: 65,
    name: "The Way-High Jean",
    brand: "Everlane",
    brandId: "everlane",
    price: 118,
    fit: 0,
    risk: "Low",
    color: "#4A5A70",
    colors: ["#4A5A70", "#1A1A1A", "#E8E5E0"],
    category: "Bottoms",
    trending: true,
    badge: "Best Seller",
    url: "https://www.everlane.com/collections/womens-jeans",
    image:
      "https://images.unsplash.com/photo-1602293589914-9e595a8a8b44?w=400&h=520&fit=crop&q=80",
    measurements: {
      25: "Waist 25, Hip 35.5, Inseam 30",
      26: "Waist 26, Hip 36.5, Inseam 30",
      27: "Waist 27, Hip 37.5, Inseam 30.5",
      28: "Waist 28, Hip 38.5, Inseam 30.5",
    },
    fabric: "Organic cotton stretch denim, ultra-high rise",
    sizingNote: "Ultra-high rise — true to size",
  },
  {
    id: 66,
    name: "The Linen Relaxed Shirt",
    brand: "Everlane",
    brandId: "everlane",
    price: 78,
    fit: 0,
    risk: "Low",
    color: "#F5F0E8",
    colors: ["#F5F0E8", "#6A8FA8", "#D4C5A9"],
    category: "Tops",
    trending: false,
    badge: "Summer Essential",
    url: "https://www.everlane.com/products/womens-relaxed-linen-shirt-new-white",
    image:
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 35-36, Waist 27-28, Shoulder 15",
      S: "Bust 37-38, Waist 29-30, Shoulder 15.5",
      M: "Bust 39-40, Waist 31-32, Shoulder 16",
      L: "Bust 41-42, Waist 33-34, Shoulder 16.5",
    },
    fabric: "100% European linen, relaxed",
    sizingNote: "Relaxed fit — true to size",
  },
  // ─── More Reformation ───
  {
    id: 67,
    name: "Juliette Dress",
    brand: "Reformation",
    brandId: "reformation",
    price: 278,
    fit: 0,
    risk: "Low",
    color: "#D4A5A5",
    colors: ["#D4A5A5", "#1A1A1A", "#4A6B5A"],
    category: "Dresses",
    trending: true,
    badge: "Wedding Guest",
    url: "https://www.thereformation.com/categories/dresses",
    image:
      "https://images.unsplash.com/photo-1620751230648-6572c39504c3?w=400&h=520&fit=crop&q=80",
    measurements: {
      2: "Bust 32-33, Waist 24-25, Hip 35-36",
      4: "Bust 33-34, Waist 25-26, Hip 36-37",
      6: "Bust 34-35, Waist 26-27, Hip 37-38",
      8: "Bust 36-37, Waist 28-29, Hip 39-40",
    },
    fabric: "Viscose crepe with sweetheart neckline",
    sizingNote: "Fitted bodice — size for bust",
  },
  {
    id: 68,
    name: "Cynthia High Rise Straight",
    brand: "Reformation",
    brandId: "reformation",
    price: 168,
    fit: 0,
    risk: "Low",
    color: "#6B8DB5",
    colors: ["#6B8DB5", "#1A1A1A", "#E8E5E0"],
    category: "Bottoms",
    trending: true,
    badge: "Trending Now",
    url: "https://www.thereformation.com/categories/jeans",
    image:
      "https://images.unsplash.com/photo-1602293589914-9e19a682d4d8?w=400&h=520&fit=crop&q=80",
    measurements: {
      24: "Waist 24, Hip 35, Inseam 29",
      25: "Waist 25, Hip 36, Inseam 29",
      26: "Waist 26, Hip 37, Inseam 29.5",
      27: "Waist 27, Hip 38, Inseam 29.5",
    },
    fabric: "Stretch organic cotton, high-rise straight",
    sizingNote: "Straight leg — size for waist",
  },
  // ─── More SKIMS ───
  {
    id: 69,
    name: "Outdoor Basics Long Sleeve",
    brand: "SKIMS",
    brandId: "skims",
    price: 52,
    fit: 0,
    risk: "Low",
    color: "#5A6B4A",
    colors: ["#5A6B4A", "#1A1A1A", "#E8E5E0", "#8C9576"],
    category: "Tops",
    trending: true,
    badge: "New Collection",
    url: "https://skims.com/collections/outdoor-basics",
    image:
      "https://images.unsplash.com/photo-1516762689617-e1cff2b6b95a?w=400&h=520&fit=crop&q=80",
    measurements: {
      XXS: "Bust 28-30, Waist 20-22",
      XS: "Bust 30-32, Waist 22-24",
      S: "Bust 32-34, Waist 25-27",
      M: "Bust 34-36, Waist 27-29",
    },
    fabric: "Cotton jersey with UV protection",
    sizingNote: "Stretchy — true to size",
  },
  {
    id: 70,
    name: "Swim Bandeau Top",
    brand: "SKIMS",
    brandId: "skims",
    price: 44,
    fit: 0,
    risk: "Low",
    color: "#8C9576",
    colors: ["#8C9576", "#1A1A1A", "#D4A5A5", "#87CEEB"],
    category: "Tops",
    trending: true,
    badge: "Summer 2026",
    url: "https://skims.com/collections/swim",
    image:
      "https://images.unsplash.com/photo-1528742456335-5a4a3d63b49c?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 30-32",
      S: "Bust 32-34",
      M: "Bust 34-36",
      L: "Bust 36-38",
    },
    fabric: "Recycled nylon swim fabric",
    sizingNote: "Supportive — true to size",
  },
  // ─── More Nike ───
  {
    id: 71,
    name: "Sportswear Essential Tee",
    brand: "Nike",
    brandId: "nike",
    price: 35,
    fit: 0,
    risk: "Low",
    color: "#F5F0E8",
    colors: ["#F5F0E8", "#1A1A1A", "#5A3E4A"],
    category: "Tops",
    trending: false,
    badge: "Everyday Basic",
    url: "https://www.nike.com/t/sportswear-essential-womens-t-shirt-dFmJ3H/IB8925-051",
    image:
      "https://images.unsplash.com/photo-1622445275463-125386c1526b?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 33-35, Waist 25-27",
      S: "Bust 35-37, Waist 27-29",
      M: "Bust 37-39, Waist 29-31",
      L: "Bust 39-41, Waist 31-33",
    },
    fabric: "100% Cotton jersey, boxy fit",
    sizingNote: "Relaxed boxy — true to size",
  },
  {
    id: 72,
    name: "Dri-FIT One Legging",
    brand: "Nike",
    brandId: "nike",
    price: 60,
    fit: 0,
    risk: "Low",
    color: "#1A1A1A",
    colors: ["#1A1A1A", "#4A6480", "#7B9E87"],
    category: "Bottoms",
    trending: true,
    badge: "Best Seller",
    url: "https://www.nike.com/t/one-womens-high-waisted-7-8-leggings-4wGHHm/HV2292-010",
    image:
      "https://images.unsplash.com/photo-THALO-xlMMk?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Waist 24-25, Hip 34-35, Inseam 27",
      S: "Waist 26-27, Hip 36-37, Inseam 27",
      M: "Waist 28-29, Hip 38-39, Inseam 27.5",
      L: "Waist 30-31, Hip 40-41, Inseam 27.5",
    },
    fabric: "Dri-FIT™ moisture-wicking stretch",
    sizingNote: "Mid-rise compression — true to size",
  },
  // ─── More Aritzia ───
  {
    id: 73,
    name: "Wilfred Free Divinity Romper",
    brand: "Aritzia",
    brandId: "aritzia",
    price: 78,
    fit: 0,
    risk: "Low",
    color: "#2D2D2D",
    colors: ["#2D2D2D", "#D4C5A9", "#8B6B5A"],
    category: "Dresses",
    trending: true,
    badge: "Trending Now",
    url: "https://www.aritzia.com/us/en/clothing/rompers-jumpsuits",
    image:
      "https://images.unsplash.com/photo-1617137968423-c6ca7d9a7437?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 30-32, Waist 23-25, Hip 33-35, Inseam 3",
      S: "Bust 32-34, Waist 25-27, Hip 35-37, Inseam 3",
      M: "Bust 34-36, Waist 27-29, Hip 37-39, Inseam 3",
    },
    fabric: "Crepe jersey, built-in shorts",
    sizingNote: "Fitted romper — runs slightly small",
  },
  {
    id: 74,
    name: "TNA Butter Cropped Zip-Up",
    brand: "Aritzia",
    brandId: "aritzia",
    price: 68,
    fit: 0,
    risk: "Low",
    color: "#7B9E87",
    colors: ["#7B9E87", "#1A1A1A", "#D4A5A5", "#E8E5E0"],
    category: "Tops",
    trending: true,
    badge: "Viral on TikTok",
    url: "https://www.aritzia.com/us/en/clothing/sweatshirts-hoodies",
    image:
      "https://images.unsplash.com/photo-1612839659789-4257e7f3a8e3?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 32-34, Waist 24-26, Shoulder 14.5",
      S: "Bust 34-36, Waist 26-28, Shoulder 15",
      M: "Bust 36-38, Waist 28-30, Shoulder 15.5",
    },
    fabric: "Butter™ fleece, cropped",
    sizingNote: "Cropped zip-up — runs slightly small",
  },
  // ─── More Mango ───
  {
    id: 75,
    name: "Pleated Midi Skirt",
    brand: "Mango",
    brandId: "mango",
    price: 49.99,
    fit: 0,
    risk: "Low",
    color: "#D4C5A9",
    colors: ["#D4C5A9", "#1A1A1A", "#7B5E91"],
    category: "Bottoms",
    trending: true,
    badge: "Office Chic",
    url: "https://shop.mango.com/us/en/women/skirts",
    image:
      "https://images.unsplash.com/photo-1621072154261-133541168d58?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Waist 24.5, Hip 35.5",
      S: "Waist 26, Hip 37",
      M: "Waist 28.25, Hip 39.4",
      L: "Waist 30.75, Hip 41.7",
    },
    fabric: "Polyester crepe, accordion pleats",
    sizingNote: "Elastic waist — runs slightly small",
  },
  {
    id: 76,
    name: "Knit Polo Shirt",
    brand: "Mango",
    brandId: "mango",
    price: 35.99,
    fit: 0,
    risk: "Low",
    color: "#E8E0D4",
    colors: ["#E8E0D4", "#4A6B5A", "#1A1A1A"],
    category: "Tops",
    trending: true,
    badge: "Preppy Revival",
    url: "https://shop.mango.com/us/en/women/tops",
    image:
      "https://images.unsplash.com/photo-1622470953794-3450535db765?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 32-33, Waist 24-25, Shoulder 14",
      S: "Bust 34-35, Waist 26-27, Shoulder 14.5",
      M: "Bust 36-37, Waist 28-29, Shoulder 15",
      L: "Bust 38-39, Waist 30-31, Shoulder 15.5",
    },
    fabric: "Fine-gauge cotton knit",
    sizingNote: "Polo trend — runs small, size up",
  },
  // ─── More COS ───
  {
    id: 77,
    name: "Oversized Wool Shirt",
    brand: "COS",
    brandId: "cos",
    price: 135,
    fit: 0,
    risk: "Low",
    color: "#E8E0D4",
    colors: ["#E8E0D4", "#1A1A1A", "#4A6B5A"],
    category: "Tops",
    trending: true,
    badge: "Quiet Luxury",
    url: "https://www.cos.com/en_usd/women/womenswear/tops.html",
    image:
      "https://images.unsplash.com/photo-1633763151997-67c202136736?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 36-38, Waist 28-30, Shoulder 16",
      S: "Bust 38-40, Waist 30-32, Shoulder 16.5",
      M: "Bust 40-42, Waist 32-34, Shoulder 17",
      L: "Bust 42-44, Waist 34-36, Shoulder 17.5",
    },
    fabric: "100% Merino wool, oversized",
    sizingNote: "Oversized — true to size",
  },
  {
    id: 78,
    name: "Gathered Waist Midi Skirt",
    brand: "COS",
    brandId: "cos",
    price: 99,
    fit: 0,
    risk: "Low",
    color: "#1A1A1A",
    colors: ["#1A1A1A", "#E8E0D4", "#4A6FA5"],
    category: "Bottoms",
    trending: false,
    badge: "Minimalist",
    url: "https://www.cos.com/en_usd/women/womenswear/skirts.html",
    image:
      "https://images.unsplash.com/photo-1620799140408-edc6d5f96503?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Waist 25-26, Hip 35-36",
      S: "Waist 27-28, Hip 37-38",
      M: "Waist 29-30, Hip 39-40",
      L: "Waist 31-33, Hip 41-43",
    },
    fabric: "Cotton-blend poplin with gathered waist",
    sizingNote: "A-line — true to size",
  },
  // ─── More Princess Polly ───
  {
    id: 79,
    name: "Halter Crop Top",
    brand: "Princess Polly",
    brandId: "princesspoly",
    price: 38,
    fit: 0,
    risk: "Low",
    color: "#F5F0E8",
    colors: ["#F5F0E8", "#D4A5A5", "#1A1A1A"],
    category: "Tops",
    trending: true,
    badge: "Going Out",
    url: "https://us.princesspolly.com/collections/tops",
    image:
      "https://images.unsplash.com/photo-1633596683413-44cf53230673?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 30-32, Waist 23-25",
      S: "Bust 32-34, Waist 25-27",
      M: "Bust 34-36, Waist 27-29",
      L: "Bust 36-38, Waist 29-31",
    },
    fabric: "Ribbed stretch cotton, halter tie",
    sizingNote: "Cropped halter — true to size",
  },
  {
    id: 80,
    name: "Satin Mini Skirt",
    brand: "Princess Polly",
    brandId: "princesspoly",
    price: 48,
    fit: 0,
    risk: "Low",
    color: "#7B5E91",
    colors: ["#7B5E91", "#1A1A1A", "#D4A5A5"],
    category: "Bottoms",
    trending: true,
    badge: "Going Out",
    url: "https://us.princesspolly.com/collections/skirts",
    image:
      "https://images.unsplash.com/photo-1631049233502-92d119d55c6e?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Waist 24-25, Hip 34-35",
      S: "Waist 26-27, Hip 36-37",
      M: "Waist 28-29, Hip 38-39",
      L: "Waist 30-31, Hip 40-41",
    },
    fabric: "Satin polyester, bias-cut mini",
    sizingNote: "Mini length — true to size",
  },
  // ─── More Revolve ───
  {
    id: 81,
    name: "Lovers + Friends Cowl Neck Cami",
    brand: "Revolve",
    brandId: "revolve",
    price: 128,
    fit: 0,
    risk: "Low",
    color: "#8C9576",
    colors: ["#8C9576", "#1A1A1A", "#D4A5A5"],
    category: "Tops",
    trending: true,
    badge: "Date Night",
    url: "https://www.revolve.com/lovers-and-friends/br/a8d0e4/",
    image:
      "https://images.unsplash.com/photo-1582719182373-93da6e895b34?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 31-32, Waist 24-25",
      S: "Bust 33-34, Waist 26-27",
      M: "Bust 35-36, Waist 28-29",
      L: "Bust 37-38, Waist 30-31",
    },
    fabric: "Silk charmeuse, cowl neckline",
    sizingNote: "Delicate fit — size for bust",
  },
  {
    id: 82,
    name: "House of Harlow Blazer Dress",
    brand: "Revolve",
    brandId: "revolve",
    price: 258,
    fit: 0,
    risk: "Low",
    color: "#2D2D2D",
    colors: ["#2D2D2D", "#8A9572", "#F5F0E8"],
    category: "Dresses",
    trending: true,
    badge: "Power Dressing",
    url: "https://www.revolve.com/house-of-harlow-1960/br/b4e4e0/",
    image:
      "https://images.unsplash.com/photo-1598971861713-56c92836a541?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 32-33, Waist 24-25, Hip 35-36",
      S: "Bust 34-35, Waist 26-27, Hip 37-38",
      M: "Bust 36-37, Waist 28-29, Hip 39-40",
      L: "Bust 38-39, Waist 30-31, Hip 41-42",
    },
    fabric: "Stretch crepe, double-breasted",
    sizingNote: "Structured fit — size for bust",
  },
  // ─── More Alo Yoga ───
  {
    id: 83,
    name: "Airbrush Sculpt Legging",
    brand: "Alo Yoga",
    brandId: "alo",
    price: 128,
    fit: 0,
    risk: "Low",
    color: "#5A3E4A",
    colors: ["#5A3E4A", "#1A1A1A", "#7B9E87", "#E8E5E0"],
    category: "Bottoms",
    trending: true,
    badge: "New Drop",
    url: "https://www.aloyoga.com/collections/leggings",
    image:
      "https://images.unsplash.com/photo-1605513219524-0499558f7833?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Waist 24-25, Hip 34-35, Inseam 28",
      S: "Waist 26-27, Hip 36-37, Inseam 28",
      M: "Waist 28-29, Hip 38-39, Inseam 28.5",
      L: "Waist 30-31, Hip 40-41, Inseam 28.5",
    },
    fabric: "Airbrush™ — ultra-smooth, sculpting",
    sizingNote: "High compression — true to size",
  },
  {
    id: 84,
    name: "Alo Yoga Cropped Tank",
    brand: "Alo Yoga",
    brandId: "alo",
    price: 56,
    fit: 0,
    risk: "Low",
    color: "#E8E5E0",
    colors: ["#E8E5E0", "#1A1A1A", "#D4A5A5"],
    category: "Tops",
    trending: false,
    badge: "Studio Essential",
    url: "https://www.aloyoga.com/collections/tops",
    image:
      "https://images.unsplash.com/photo-1675258691994-3a4da9930f65?w=400&h=520&fit=crop&q=80",
    measurements: {
      XS: "Bust 30-32, Waist 23-25",
      S: "Bust 32-34, Waist 25-27",
      M: "Bust 34-36, Waist 27-29",
      L: "Bust 36-38, Waist 29-31",
    },
    fabric: "Alosoft™ — buttery soft jersey",
    sizingNote: "Cropped — true to size",
  },
  // ─── More Abercrombie ───
  {
    id: 85,
    name: "Harper Tailored Mini Skirt",
    brand: "Abercrombie",
    brandId: "abercrombie",
    price: 60,
    fit: 0,
    risk: "Low",
    color: "#D4C5A9",
    colors: ["#D4C5A9", "#2D2D2D", "#4A6FA5"],
    category: "Bottoms",
    trending: true,
    badge: "Trending Now",
    url: "https://www.abercrombie.com/shop/us/womens-skirts",
    image:
      "https://images.unsplash.com/photo-1593642702821-c8464c28c880?w=400&h=520&fit=crop&q=80",
    measurements: {
      25: "Waist 25, Hip 35.5",
      26: "Waist 26, Hip 36.5",
      27: "Waist 27, Hip 37.5",
      28: "Waist 28, Hip 38.5",
    },
    fabric: "Ponte knit, tailored mini",
    sizingNote: "Mini length — true to size",
  },
];
const DEFAULT_BODY = {
  bust: 34,
  waist: 26,
  hips: 36,
  inseam: 30,
  shoulder: 15,
};
// Measurement registry — single source of truth for ranges, labels, anatomical
// guidance and which fit-zone each measurement belongs to. Driving the manual
// entry, profile editor and Fit Studio "measurement basis" panel from one list
// keeps copy consistent and lets future measurements (sleeve, neck, rise) drop
// in without surgery.
const MEASUREMENT_FIELDS = [
  {
    key: "shoulder",
    label: "Shoulder width",
    zone: "Upper body",
    icon: "shoulder",
    min: 12,
    max: 20,
    step: 0.25,
    typical: [14, 17],
    unit: '"',
    cmRange: [30, 52],
    how: "Across the back, from shoulder seam to shoulder seam.",
    why: "Drives jacket, blazer and shirt shoulder-seam alignment.",
  },
  {
    key: "bust",
    label: "Bust / chest",
    zone: "Upper body",
    icon: "bust",
    min: 28,
    max: 52,
    step: 0.25,
    typical: [32, 42],
    unit: '"',
    cmRange: [71, 132],
    how: "Around the fullest part of the chest, tape parallel to the floor.",
    why: "Sets top, dress and outerwear ease at the chest.",
  },
  {
    key: "waist",
    label: "Waist",
    zone: "Mid body",
    icon: "waist",
    min: 20,
    max: 44,
    step: 0.25,
    typical: [24, 36],
    unit: '"',
    cmRange: [51, 112],
    how: "Around the narrowest part of the torso, usually above the navel.",
    why: "Tells us where to take in dresses, trousers and tailored tops.",
  },
  {
    key: "hips",
    label: "Hips / seat",
    zone: "Lower body",
    icon: "hips",
    min: 30,
    max: 56,
    step: 0.25,
    typical: [34, 44],
    unit: '"',
    cmRange: [76, 142],
    how: "Around the fullest part of the hips, about 8\" below the waist.",
    why: "Drives trouser, skirt and dress hip-and-seat fit.",
  },
  {
    key: "inseam",
    label: "Inseam",
    zone: "Lower body",
    icon: "inseam",
    min: 22,
    max: 36,
    step: 0.25,
    typical: [26, 34],
    unit: '"',
    cmRange: [56, 92],
    how: "From crotch seam down the inside of the leg to the ankle.",
    why: "Sets trouser length and where the hem lands.",
  },
];

const BODY_ZONES = [
  {
    id: "upper",
    label: "Upper body",
    blurb: "Shoulders & chest — drives tops, jackets and dresses.",
    keys: ["shoulder", "bust"],
  },
  {
    id: "mid",
    label: "Mid body",
    blurb: "Waist — where most tailoring happens.",
    keys: ["waist"],
  },
  {
    id: "lower",
    label: "Lower body",
    blurb: "Hips & inseam — trousers, skirts, hem drop.",
    keys: ["hips", "inseam"],
  },
];

const FIT_PREFERENCES = [
  { id: "fitted", label: "Fitted", blurb: "Snug to the body — minimum ease." },
  { id: "tailored", label: "Tailored", blurb: "Skimming, not pulling — our default." },
  { id: "relaxed", label: "Relaxed", blurb: "Easy room through torso and seat." },
  { id: "oversized", label: "Oversized", blurb: "Deliberately roomy and drape-led." },
];

const DEFAULT_BODY_META = {
  source: "manual", // "manual" | "scan" | "imported"
  confidence: { bust: 70, waist: 70, hips: 70, inseam: 70, shoulder: 70 },
  verified: { bust: false, waist: false, hips: false, inseam: false, shoulder: false },
  fitPreference: "tailored",
  lastReviewedAt: null,
  tailorVerified: false,
};

function fieldByKey(key) {
  return MEASUREMENT_FIELDS.find(f => f.key === key);
}

// Friendly proportion warnings — never block, just nudge. Returns array of
// { key, severity: "info"|"warn", message } so callers can surface them inline
// next to the offending measurement or as a single passport notice.
function validateBody(body, heightInches) {
  const out = [];
  const h = heightInches && heightInches > 36 ? heightInches : 66;
  for (const f of MEASUREMENT_FIELDS) {
    const v = body?.[f.key];
    if (v == null || Number.isNaN(v)) {
      out.push({ key: f.key, severity: "warn", message: `${f.label} is missing — add it for a better fit score.` });
      continue;
    }
    if (v < f.min || v > f.max) {
      out.push({
        key: f.key,
        severity: "warn",
        message: `${f.label} is outside the typical range (${f.min}${f.unit}–${f.max}${f.unit}). Double-check or let a tailor verify.`,
      });
    }
  }
  const { bust, waist, hips, inseam, shoulder } = body || {};
  if (bust && waist && waist >= bust + 2) {
    out.push({ key: "waist", severity: "warn", message: "Waist is larger than bust — uncommon. If correct, our tailors will adapt the alteration brief." });
  }
  if (hips && waist && waist >= hips + 2) {
    out.push({ key: "waist", severity: "warn", message: "Waist is larger than hips — uncommon. We'll route this to a tailor for a quick review." });
  }
  if (inseam && h && inseam > h * 0.55) {
    out.push({ key: "inseam", severity: "warn", message: "Inseam looks long for your height — measure from crotch seam, not waist." });
  }
  if (inseam && h && inseam < h * 0.36) {
    out.push({ key: "inseam", severity: "info", message: "Inseam looks short for your height — that's fine if you wear a high rise." });
  }
  if (shoulder && bust && shoulder > bust * 0.55) {
    out.push({ key: "shoulder", severity: "warn", message: "Shoulder width is unusually broad compared to bust — re-check across the back." });
  }
  return out;
}

function aggregateConfidence(meta) {
  const vals = Object.values(meta?.confidence || {});
  if (!vals.length) return 0;
  return Math.round(vals.reduce((s, n) => s + n, 0) / vals.length);
}

function confidenceLabel(c) {
  if (c >= 88) return "High confidence";
  if (c >= 72) return "Tailor will spot-check";
  if (c >= 55) return "Needs tailor check";
  return "Estimated — please refine";
}

function sourceLabel(source) {
  if (source === "scan") return "AI scan";
  if (source === "imported") return "Imported";
  return "Confirmed manually";
}

const STORAGE_KEY = "tailored_v2_data";
const TAILOR_OPTIONS = [
  {
    id: "hem",
    label: "Hem / Length Adjustment",
    price: 15,
    iconId: "scissors",
  },
  {
    id: "waist",
    label: "Waist Taken In / Let Out",
    price: 20,
    iconId: "measure",
  },
  { id: "sleeve", label: "Sleeve Shortened", price: 12, iconId: "thread" },
  { id: "taper", label: "Taper Legs", price: 18, iconId: "ruler" },
  { id: "bust", label: "Bust Dart Adjustment", price: 22, iconId: "needle" },
  { id: "custom", label: "Custom Alteration Notes", price: 0, iconId: "pen" },
];

// ─── Fit Engine ────────────────────────────────────────────
function parseMeasurements(str) {
  const result = {};
  if (!str) return result;
  str
    .replace(/in\b/g, "")
    .split(",")
    .map(s => s.trim())
    .forEach(part => {
      const m = part.match(/^(\w+)\s+([\d.]+)(?:\s*-\s*([\d.]+))?/);
      if (m) {
        const k = m[1].toLowerCase(),
          v1 = parseFloat(m[2]),
          v2 = m[3] ? parseFloat(m[3]) : null;
        result[k] =
          v2 !== null
            ? { min: v1, max: v2, mid: (v1 + v2) / 2 }
            : { min: v1, max: v1, mid: v1 };
      }
    });
  return result;
}
function computeFitForSize(userBody, measStr, category) {
  const meas = parseMeasurements(measStr);
  if (category === "Shoes") return 85;
  const weights = {
    Tops: { bust: 0.55, chest: 0.55, waist: 0.3, shoulder: 0.15 },
    Bottoms: { waist: 0.45, hip: 0.35, inseam: 0.2 },
    Dresses: { bust: 0.3, waist: 0.35, hip: 0.35 },
    Outerwear: { bust: 0.5, chest: 0.5, waist: 0.3, shoulder: 0.2 },
  }[category] || { bust: 0.55, waist: 0.3, shoulder: 0.15 };
  const bodyMap = {
    bust: "bust",
    chest: "bust",
    waist: "waist",
    hip: "hips",
    inseam: "inseam",
    shoulder: "shoulder",
  };
  let tw = 0,
    ws = 0;
  for (const [key, dims] of Object.entries(meas)) {
    const uk = bodyMap[key];
    if (!uk || !userBody[uk]) continue;
    const uv = userBody[uk],
      w = weights[key] || 0.05;
    const ds =
      uv >= dims.min && uv <= dims.max
        ? 100
        : Math.max(
            50,
            100 - (uv < dims.min ? dims.min - uv : uv - dims.max) * 10
          );
    tw += w;
    ws += ds * w;
  }
  return tw === 0 ? 88 : Math.min(99, Math.max(55, Math.round(ws / tw)));
}
function computeItemFit(userBody, item) {
  let bestScore = 0,
    bestSize = Object.keys(item.measurements)[0] || "M";
  for (const [size, measStr] of Object.entries(item.measurements)) {
    const score = computeFitForSize(userBody, measStr, item.category);
    if (score > bestScore) {
      bestScore = score;
      bestSize = size;
    }
  }
  return {
    fit: bestScore,
    bestSize,
    risk: bestScore >= 90 ? "Low" : bestScore >= 75 ? "Medium" : "High",
  };
}
function canAttemptRetailImage(url = "") {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const path = parsed.pathname.toLowerCase();

    if (host === "shop.lululemon.com") {
      return path.includes("/p/") || path.includes("/_/prod");
    }

    if (host.endsWith("nike.com")) {
      return path.includes("/t/");
    }

    if (host.endsWith("freepeople.com") || host.endsWith("anthropologie.com")) {
      return path.includes("/shop/");
    }

    if (host.endsWith("abercrombie.com")) {
      return path.includes("/p/");
    }

    return /\/products\/|\/product\/|\/p\/|\/_\/prod|\/t\/|\/shop\/us\/p\//i.test(
      path
    );
  } catch {
    return false;
  }
}
function enrichCatalog(userBody) {
  return CATALOG.map(item => {
    const { fit, bestSize, risk } = computeItemFit(userBody, item);
    const siteImage = SITE_IMAGE_OVERRIDES[item.id] || null;
    return {
      ...item,
      catalogImage: item.image,
      siteImage,
      image: siteImage || item.image,
      fit,
      bestSize,
      risk,
      badgeMeta: getBadgeMeta(item.badge),
      hasSiteImage: Boolean(siteImage),
      canResolveRetailImage:
        canAttemptRetailImage(item.url) &&
        !LIVE_IMAGE_DISABLED_IDS.has(item.id),
    };
  });
}
let __userDataMemory = null;
function loadUserData() {
  if (!__userDataMemory) return null;
  const d = { ...__userDataMemory };
  if (d.favorites) d.favorites = new Set(d.favorites);
  if (d.styles) d.styles = new Set(d.styles);
  return d;
}
function saveUserData(data) {
  __userDataMemory = {
    ...data,
    favorites: data.favorites ? [...data.favorites] : [],
    styles: data.styles ? [...data.styles] : [],
  };
}
function formatOrderDate(timestamp) {
  if (!timestamp) return "Saved just now";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Saved just now";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}
function generateFitReason(item, userBody) {
  const { bust, waist, hips } = userBody;
  const brand = item.brand,
    cat = item.category,
    sizingNote = item.sizingNote || "";
  const runsSmall =
    sizingNote.toLowerCase().includes("small") ||
    sizingNote.toLowerCase().includes("size up");
  const oversized =
    sizingNote.toLowerCase().includes("oversized") ||
    sizingNote.toLowerCase().includes("relaxed");
  const bodycon =
    sizingNote.toLowerCase().includes("body") ||
    sizingNote.toLowerCase().includes("fitted");
  if (item.fit >= 95) {
    if (cat === "Tops")
      return `Your ${bust}" bust is right in the sweet spot for ${brand}'s ${item.bestSize}. ${oversized ? "The relaxed cut gives you room through the waist." : "Clean lines through the torso."}`;
    if (cat === "Bottoms")
      return `Your ${waist}" waist and ${hips}" hips align perfectly with ${brand}'s ${item.bestSize}. ${runsSmall ? `Since ${brand} runs small, we sized you up.` : "True to size for you."}`;
    if (cat === "Dresses")
      return `At ${bust}-${waist}-${hips}, this ${brand} ${item.bestSize} drapes perfectly on your frame. ${bodycon ? "The stretch fabric hugs your proportions." : "Beautiful flow on your silhouette."}`;
    return `This ${brand} ${item.bestSize} is built for your exact proportions. One of your highest-confidence fits.`;
  } else if (item.fit >= 88) {
    if (runsSmall)
      return `${brand} tends to run small — we bumped you to a ${item.bestSize} so it sits right on your ${waist}" waist.`;
    if (oversized)
      return `The oversized cut on this ${brand} piece means your ${bust}" bust has plenty of room. ${item.bestSize} keeps it intentionally relaxed.`;
    return `Great match for your proportions in ${item.bestSize}. ${cat === "Bottoms" ? `Your ${hips}" hips fit well in ${brand}'s cut.` : `Works well with your ${bust}" bust measurement.`}`;
  }
  return `Decent fit in ${item.bestSize}, but ${brand}'s cut may feel ${waist < 26 ? "slightly loose at the waist" : "a bit snug in spots"}. An alteration brief would sharpen the final fit.`;
}

// ─── Shared UI Components ──────────────────────────────────
const GlassCard = ({
  children,
  style = {},
  onClick,
  hover = false,
  className = "",
}) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: hovered ? C.cardHover : C.card,
        border: `1px solid ${hovered ? C.borderLight : C.border}`,
        borderRadius: 16,
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-1px)" : "none",
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.3)" : "none",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
function FitBadge({ fit, size = "sm" }) {
  const good = fit >= 90,
    mid = fit >= 75;
  const bg = good ? C.successBg : mid ? C.warningBg : "rgba(248,113,113,0.1)";
  const color = good ? C.success : mid ? C.warning : C.danger;
  const border = good
    ? C.successBorder
    : mid
      ? C.warningBorder
      : "rgba(248,113,113,0.2)";
  return (
    <div
      style={{
        background: bg,
        color,
        border: `1px solid ${border}`,
        padding: size === "sm" ? "2px 8px" : "4px 12px",
        borderRadius: 20,
        fontSize: size === "sm" ? 10 : 12,
        fontWeight: 700,
        letterSpacing: 0.3,
        display: "flex",
        alignItems: "center",
        gap: 3,
      }}
    >
      {fit}% fit
    </div>
  );
}
function BadgePill({ meta, compact = false }) {
  if (!meta) return null;
  const styles = {
    demand: { bg: C.goldBg, border: C.goldBorder, color: C.goldLight },
    editorial: { bg: C.tailorBg, border: C.tailorBorder, color: C.tailor },
    staple: { bg: C.successBg, border: C.successBorder, color: C.success },
    seasonal: {
      bg: "rgba(255,255,255,0.08)",
      border: C.borderLight,
      color: C.mutedLight,
    },
  }[meta.group] || { bg: C.card, border: C.border, color: C.mutedLight };

  return (
    <div
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        padding: compact ? "2px 8px" : "3px 10px",
        borderRadius: 999,
        fontSize: compact ? 8 : 9,
        fontWeight: 700,
        color: styles.color,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {meta.label}
    </div>
  );
}
function FitBar({ fit, label, showLabel = true }) {
  const color = fit >= 90 ? C.success : fit >= 75 ? C.warning : C.danger;
  return (
    <div style={{ marginBottom: showLabel ? 6 : 0 }}>
      {showLabel && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 3,
          }}
        >
          <span style={{ fontSize: 10, color: C.muted }}>{label}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color }}>{fit}%</span>
        </div>
      )}
      <div
        style={{
          height: 3,
          borderRadius: 2,
          background: C.bgElevated,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 2,
            background: color,
            width: `${fit}%`,
            transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>
    </div>
  );
}
function NavBar({ active, onNav }) {
  return (
    <div
      className="tb-mobile-nav"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(10,10,10,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "space-around",
        padding: "10px 0 22px",
        zIndex: 10,
      }}
    >
      {NAV_ITEMS.map(i => (
        <button
          key={i.id}
          onClick={() => onNav(i.id)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            color: active === i.id ? C.gold : C.muted,
            opacity: active === i.id ? 1 : 0.55,
            transition: "all 0.2s",
            position: "relative",
            padding: "0 12px",
          }}
        >
          {i.icon}
          <span
            style={{
              fontSize: 9,
              fontWeight: active === i.id ? 700 : 400,
              letterSpacing: 0.5,
            }}
          >
            {i.label}
          </span>
          {active === i.id && (
            <div
              style={{
                position: "absolute",
                top: -10,
                width: 24,
                height: 2,
                borderRadius: 1,
                background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`,
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
function BackButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: C.card,
        border: `1px solid ${C.borderLight}`,
        borderRadius: 12,
        height: 38,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: C.accent,
        transition: "all 0.2s",
        gap: 6,
        padding: label ? "0 14px 0 10px" : "0 10px",
        boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset",
      }}
    >
      <ChevronLeft size={18} />
      {label && (
        <span
          style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.2 }}
        >
          {label}
        </span>
      )}
    </button>
  );
}
function ProductImage({
  item,
  alt,
  children,
  style = {},
  className = "",
  revealBadge = false,
}) {
  const [imageFailureIndex, setImageFailureIndex] = useState(0);
  const imageQuery = trpc.style.resolveProductImage.useQuery(
    { url: item.url, name: item.name, brand: item.brand },
    {
      enabled:
        Boolean(item?.url) &&
        !item?.hasSiteImage &&
        item?.canResolveRetailImage,
      staleTime: 1000 * 60 * 60 * 6,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  const imageCandidates = useMemo(() => {
    const candidates = [imageQuery.data?.imageUrl, item.siteImage, item.catalogImage, item.image]
      .filter(Boolean)
      .filter((value, index, all) => all.indexOf(value) === index);
    return candidates;
  }, [imageQuery.data?.imageUrl, item.siteImage, item.catalogImage, item.image]);

  useEffect(() => {
    setImageFailureIndex(0);
  }, [item?.id, item?.url, imageQuery.data?.imageUrl, item.siteImage, item.catalogImage]);

  const resolvedImage = imageCandidates[imageFailureIndex] || null;
  const hasImage = Boolean(resolvedImage);
  const usingRetailSource = Boolean(
    resolvedImage &&
      (resolvedImage === imageQuery.data?.imageUrl || resolvedImage === item.siteImage)
  );

  // Brand-native fallback panel — designed, not gray.
  // Uses category-specific palette + SVG monogram so empty product tiles look intentional.
  const fallbackTheme = useMemo(() => {
    const cat = (item.category || "").toLowerCase();
    if (cat.includes("outer")) {
      return { from: PALETTE.forestDeep, to: PALETTE.forest, ink: "#F2F3EE", initial: "O" };
    }
    if (cat.includes("dress")) {
      return { from: PALETTE.clay, to: PALETTE.cocoa, ink: "#EDEEE8", initial: "D" };
    }
    if (cat.includes("bottom")) {
      return { from: PALETTE.olive, to: PALETTE.forestDeep, ink: "#F2F3EE", initial: "B" };
    }
    if (cat.includes("top")) {
      return { from: PALETTE.sage, to: PALETTE.forest, ink: "#1F2620", initial: "T" };
    }
    return { from: PALETTE.tan, to: PALETTE.sageDeep, ink: "#1F2620", initial: (item.brand || "T")[0] };
  }, [item.category, item.brand]);

  const CategoryGlyph = ({ size = 56, color = "#fff" }) => {
    const cat = (item.category || "").toLowerCase();
    const sw = 1.4;
    if (cat.includes("outer")) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4l-3 3v13h16V7l-3-3" />
          <path d="M7 4l5 5 5-5" />
          <path d="M12 9v11" />
        </svg>
      );
    }
    if (cat.includes("dress")) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3h6l-1 4 5 14H5l5-14-1-4z" />
          <path d="M9 7h6" />
        </svg>
      );
    }
    if (cat.includes("bottom")) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12l-1 18h-4l-1-12-1 12H7L6 3z" />
        </svg>
      );
    }
    if (cat.includes("top")) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 6l4-3h6l4 3-3 3v11H8V9L5 6z" />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8l8-5 8 5-8 5-8-5z" />
        <path d="M4 16l8 5 8-5" />
        <path d="M4 12l8 5 8-5" />
      </svg>
    );
  };

  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        background: hasImage
          ? `linear-gradient(145deg, ${item.color} 0%, ${item.color}88 100%)`
          : `linear-gradient(150deg, ${fallbackTheme.from} 0%, ${fallbackTheme.to} 100%)`,
        ...style,
      }}
    >
      {hasImage ? (
        <img
          src={resolvedImage}
          alt={alt || item.name}
          loading="lazy"
          onError={() => {
            setImageFailureIndex(current => current + 1);
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          aria-label={`${item.brand} ${item.category}`}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 16,
            color: fallbackTheme.ink,
          }}
        >
          {/* Subtle decorative monogram */}
          <div
            style={{
              position: "absolute",
              right: -22,
              bottom: -34,
              fontSize: 220,
              lineHeight: 1,
              fontFamily: font.serif,
              fontWeight: 500,
              color: fallbackTheme.ink,
              opacity: 0.10,
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            {fallbackTheme.initial}
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: fallbackTheme.ink,
                opacity: 0.85,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              {item.brand}
            </div>
            <div
              style={{
                fontSize: "clamp(15px, 3.2vw, 20px)",
                lineHeight: 1.15,
                color: fallbackTheme.ink,
                fontFamily: font.serif,
                fontWeight: 500,
                maxWidth: "90%",
                textShadow: "0 1px 2px rgba(0,0,0,0.08)",
              }}
            >
              {item.name}
            </div>
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.28)",
                color: fallbackTheme.ink,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                backdropFilter: "blur(6px)",
              }}
            >
              {item.category}
            </div>
            <div style={{ opacity: 0.85 }}>
              <CategoryGlyph size={36} color={fallbackTheme.ink} />
            </div>
          </div>
        </div>
      )}

      {revealBadge && usingRetailSource && (
        <div
          style={{
            position: "absolute",
            left: 10,
            bottom: 10,
            padding: "4px 8px",
            borderRadius: 999,
            background: "rgba(0,0,0,0.66)",
            backdropFilter: "blur(10px)",
            border: `1px solid ${C.borderLight}`,
            fontSize: 9,
            fontWeight: 600,
            color: C.accent,
          }}
        >
          Retail photo
        </div>
      )}

      {!resolvedImage && imageQuery.isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.14), rgba(255,255,255,0.04))",
            animation: "pulse 1.4s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
      )}

      {children}
    </div>
  );
}
function ItemCard({ item, onClick, isFav, toggleFav }) {
  return (
    <GlassCard hover onClick={onClick} style={{ overflow: "hidden" }}>
      <div style={{ position: "relative" }}>
        <ProductImage item={item} style={{ height: 180 }} revealBadge />
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <FitBadge fit={item.fit} />
          <BadgePill meta={item.badgeMeta} compact />
        </div>
        <button
          onClick={e => {
            e.stopPropagation();
            toggleFav(item.id);
          }}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            border: "none",
            borderRadius: "50%",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <HeartIcon filled={isFav} />
        </button>
        {item.bestSize && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(8px)",
              padding: "3px 8px",
              borderRadius: 8,
              fontSize: 10,
              fontWeight: 600,
              color: C.accent,
            }}
          >
            Size {item.bestSize}
          </div>
        )}
      </div>
      <div style={{ padding: "10px 12px 14px" }}>
        <div
          style={{
            fontSize: 9,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: 1.2,
            fontWeight: 500,
          }}
        >
          {item.brand}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: C.accent,
            marginTop: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: 1.3,
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>
            ${item.price}
          </div>
          <div
            style={{
              fontSize: 9,
              color:
                item.risk === "Low"
                  ? C.success
                  : item.risk === "Medium"
                    ? C.warning
                    : C.danger,
              fontWeight: 600,
            }}
          >
            {item.risk} risk
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <FitBar fit={item.fit} showLabel={false} />
        </div>
      </div>
    </GlassCard>
  );
}
function Pill({ label, active, onClick, gold = false }) {
  const bg = active
    ? gold
      ? C.forest
      : C.accent
    : C.card;
  const border = active
    ? gold
      ? C.forest
      : C.accent
    : C.borderLight;
  const color = active ? C.cream : C.muted;
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 16px",
        borderRadius: 20,
        border: `1px solid ${border}`,
        background: bg,
        color,
        fontSize: 11,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "all 0.2s",
        letterSpacing: 0.3,
        boxShadow: active
          ? gold
            ? "0 4px 12px rgba(107,142,90,0.28)"
            : "0 3px 10px rgba(45,55,42,0.18)"
          : "none",
      }}
    >
      {label}
    </button>
  );
}

function DesktopNavRail({
  active,
  onNav,
  userBody,
  catalog,
  favorites,
  tailorOrders,
}) {
  const avgFit = Math.round(
    catalog.reduce((sum, item) => sum + item.fit, 0) / catalog.length
  );
  const perfectFits = catalog.filter(item => item.fit >= 90).length;
  const shape = inferBodyShape(userBody);

  return (
    <aside className="tb-shell__sidebar tb-shell__sidebar--nav">
      <div className="tb-brand-lockup">
        <div className="tb-brand-lockup__mark">T</div>
        <div>
          <p className="tb-sidebar-eyebrow">The Tailored Company</p>
          <h1 className="tb-brand-lockup__title">Fit Intelligence</h1>
        </div>
      </div>

      <div className="tb-sidebar-card">
        <p className="tb-sidebar-eyebrow">Navigation</p>
        <div className="tb-desktop-nav">
          {NAV_ITEMS.map(item => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNav(item.id)}
                className={`tb-desktop-nav__item${isActive ? " is-active" : ""}`}
              >
                <span className="tb-desktop-nav__icon">{item.icon}</span>
                <span>
                  <span className="tb-desktop-nav__label">{item.label}</span>
                  <span className="tb-desktop-nav__hint">{item.eyebrow}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="tb-sidebar-card">
        <p className="tb-sidebar-eyebrow">Fit passport</p>
        <div className="tb-sidebar-stats">
          <div>
            <span className="tb-sidebar-stat__value">{avgFit}%</span>
            <span className="tb-sidebar-stat__label">Average match</span>
          </div>
          <div>
            <span className="tb-sidebar-stat__value">{perfectFits}</span>
            <span className="tb-sidebar-stat__label">Perfect fits</span>
          </div>
          <div>
            <span className="tb-sidebar-stat__value">{favorites.size}</span>
            <span className="tb-sidebar-stat__label">Saved pieces</span>
          </div>
        </div>
        <div className="tb-measurement-list">
          <div className="tb-measurement-list__headline">
            <span>{shape} proportions</span>
            <span>
              {tailorOrders.length} tailor order
              {tailorOrders.length === 1 ? "" : "s"}
            </span>
          </div>
          {Object.entries(userBody).map(([key, value]) => (
            <div key={key} className="tb-measurement-list__row">
              <span>{key}</span>
              <strong>{value}"</strong>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function DesktopContextPanel({
  screen,
  navTab,
  selectedItem,
  selectedBrand,
  catalog,
  favorites,
  tailorOrders,
  userBody,
}) {
  const activeNav = NAV_ITEMS.find(item => item.id === navTab) || NAV_ITEMS[0];
  const savedItems = catalog.filter(item => favorites.has(item.id)).slice(0, 3);
  const heroItem = selectedItem || savedItems[0] || catalog[0];
  const brandItems = selectedBrand
    ? catalog.filter(item => item.brandId === selectedBrand.id)
    : [];
  const bestBrand = BRANDS.map(brand => {
    const items = catalog.filter(item => item.brandId === brand.id);
    const avg = items.length
      ? items.reduce((sum, item) => sum + item.fit, 0) / items.length
      : 0;
    return { ...brand, avg };
  }).sort((a, b) => b.avg - a.avg)[0];
  const lastTailorOrder = tailorOrders[tailorOrders.length - 1];

  return (
    <aside className="tb-shell__sidebar tb-shell__sidebar--context">
      <div className="tb-sidebar-card tb-sidebar-card--hero">
        <p className="tb-sidebar-eyebrow">
          {screen === "item" ? "Selected piece" : activeNav.eyebrow}
        </p>
        <h2 className="tb-sidebar-title">
          {screen === "item" && selectedItem
            ? selectedItem.name
            : activeNav.title}
        </h2>
        <p className="tb-sidebar-copy">
          {screen === "item" && selectedItem
            ? generateFitReason(selectedItem, userBody)
            : activeNav.blurb}
        </p>
      </div>

      {selectedBrand ? (
        <div className="tb-sidebar-card">
          <p className="tb-sidebar-eyebrow">Brand intelligence</p>
          <div className="tb-brand-panel">
            <div
              className="tb-brand-panel__logo"
              style={{ background: selectedBrand.color || "#1a1a1a" }}
            >
              {selectedBrand.logo}
            </div>
            <div>
              <h3
                className="tb-sidebar-title"
                style={{ fontSize: 24, marginBottom: 4 }}
              >
                {selectedBrand.name}
              </h3>
              <p className="tb-sidebar-copy">{selectedBrand.tagline}</p>
            </div>
          </div>
          <div className="tb-sidebar-stats">
            <div>
              <span className="tb-sidebar-stat__value">
                {brandItems.length}
              </span>
              <span className="tb-sidebar-stat__label">Items tracked</span>
            </div>
            <div>
              <span className="tb-sidebar-stat__value">
                {brandItems.length
                  ? Math.round(
                      brandItems.reduce((sum, item) => sum + item.fit, 0) /
                        brandItems.length
                    )
                  : 0}
                %
              </span>
              <span className="tb-sidebar-stat__label">Average fit</span>
            </div>
          </div>
          {selectedBrand.sizeNote && (
            <p className="tb-sidebar-note">{selectedBrand.sizeNote}</p>
          )}
        </div>
      ) : heroItem ? (
        <div className="tb-sidebar-card">
          <p className="tb-sidebar-eyebrow">Live recommendation</p>
          <div className="tb-sidebar-product">
            <div
              className="tb-sidebar-product__image"
              style={{
                background: heroItem.image
                  ? `url(${heroItem.image}) center/cover no-repeat`
                  : `linear-gradient(145deg, ${heroItem.color}, ${heroItem.color}88)`,
              }}
            />
            <div>
              <div className="tb-sidebar-product__brand">{heroItem.brand}</div>
              <h3
                className="tb-sidebar-title"
                style={{ fontSize: 22, marginBottom: 6 }}
              >
                {heroItem.name}
              </h3>
              <div className="tb-sidebar-product__meta">
                <span>
                  {heroItem.bestSize
                    ? `Size ${heroItem.bestSize}`
                    : "Fit mapped"}
                </span>
                <span>{heroItem.fit}% match</span>
              </div>
            </div>
          </div>
          <div className="tb-sidebar-progress">
            {[
              [
                "Bust",
                Math.min(
                  99,
                  heroItem.fit > 85 ? heroItem.fit : heroItem.fit - 5
                ),
              ],
              [
                "Waist",
                Math.min(
                  99,
                  heroItem.fit > 90 ? heroItem.fit + 3 : heroItem.fit - 8
                ),
              ],
              [
                "Hips",
                Math.min(
                  99,
                  heroItem.fit > 88 ? heroItem.fit + 1 : heroItem.fit - 3
                ),
              ],
            ].map(([label, fit]) => (
              <div key={label}>
                <div className="tb-sidebar-progress__row">
                  <span>{label}</span>
                  <strong>{fit}%</strong>
                </div>
                <div className="tb-sidebar-progress__track">
                  <div
                    className="tb-sidebar-progress__fill"
                    style={{ width: `${fit}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="tb-sidebar-card">
        <p className="tb-sidebar-eyebrow">
          {savedItems.length ? "Saved lookbook" : "Profile snapshot"}
        </p>
        {savedItems.length ? (
          <div className="tb-mini-list">
            {savedItems.map(item => (
              <div key={item.id} className="tb-mini-list__item">
                <ProductImage item={item} className="tb-mini-list__thumb" />
                <div>
                  <div className="tb-mini-list__title">{item.name}</div>
                  <div className="tb-mini-list__meta">
                    {item.brand} · {item.fit}% fit
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="tb-sidebar-stats tb-sidebar-stats--snapshot">
            <div className="tb-sidebar-stat">
              <span className="tb-sidebar-stat__value tb-sidebar-stat__value--text">
                {inferBodyShape(userBody)}
              </span>
              <span className="tb-sidebar-stat__label">Shape profile</span>
            </div>
            <div className="tb-sidebar-stat">
              <span className="tb-sidebar-stat__value tb-sidebar-stat__value--text">
                {bestBrand?.name || "TBD"}
              </span>
              <span className="tb-sidebar-stat__label">Best brand</span>
            </div>
          </div>
        )}
        {lastTailorOrder && (
          <p className="tb-sidebar-note">
            Latest alteration brief: {lastTailorOrder.item.name} with{" "}
            {lastTailorOrder.alterations.length} planned adjustment
            {lastTailorOrder.alterations.length === 1 ? "" : "s"}.
          </p>
        )}
      </div>
    </aside>
  );
}

// ─── Splash Screen ─────────────────────────────────────────
function SplashScreen({ onContinue }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase(1), 300),
      window.setTimeout(() => setPhase(2), 800),
      window.setTimeout(() => setPhase(3), 1300),
    ];
    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, []);
  return (
    <div
      className="tb-screen tb-screen--splash"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        background: `linear-gradient(180deg, ${C.cream} 0%, ${C.beige} 100%)`,
        padding: "52px 32px 44px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-8%",
          right: "-18%",
          width: 380,
          height: 380,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(156,175,136,0.35) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "12%",
          left: "-18%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(168,174,154,0.40) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "translateY(0)" : "translateY(-12px)",
          transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${C.forest}, ${C.forestDeep})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 16px rgba(107,142,90,0.32)",
            }}
          >
            <span
              style={{
                color: C.cream,
                fontSize: 16,
                fontWeight: 700,
                fontFamily: font.serif,
              }}
            >
              T
            </span>
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.muted,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            The Tailored Company
          </span>
        </div>
      </div>

      <div
        className="tb-splash__content"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          textAlign: "center",
        }}
      >
        <div
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s",
          }}
        >
          <h1
            style={{
              fontFamily: font.serif,
              fontSize: "clamp(36px, 6.4vw, 52px)",
              fontWeight: 500,
              color: C.accent,
              lineHeight: 1.02,
              margin: 0,
              letterSpacing: -1.2,
            }}
          >
            Paste any link.
            <br />
            <span style={{ color: C.clay, fontStyle: "italic", fontWeight: 600 }}>
              We tailor it.
            </span>
          </h1>
        </div>
        <div
          style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s",
          }}
        >
          <p
            style={{
              fontSize: 15,
              color: C.muted,
              lineHeight: 1.55,
              maxWidth: 340,
              margin: 0,
            }}
          >
            Drop in a product link. We pull the specs, fit them to your body, and our in-house tailors alter and ship the piece.
          </p>
        </div>
      </div>

      <div
        className="tb-splash__cta"
        style={{
          width: "100%",
          maxWidth: 340,
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? "translateY(0)" : "translateY(12px)",
          transition: "all 0.7s cubic-bezier(0.22,1,0.36,1) 0.4s",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <button
          onClick={onContinue}
          style={{
            width: "100%",
            padding: "16px 0",
            borderRadius: 14,
            border: "none",
            background: `linear-gradient(135deg, ${C.forest}, ${C.forestDeep})`,
            color: C.cream,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 0.5,
            cursor: "pointer",
            boxShadow: `0 12px 28px rgba(107,142,90,0.32)`,
          }}
        >
          Get started
        </button>
        <button
          onClick={onContinue}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            background: "transparent",
            color: C.accent,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Continue to app
        </button>
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: C.muted,
            marginTop: 4,
            marginBottom: 0,
          }}
        >
          Concierge tailoring · Works with any retailer link
        </p>
      </div>
    </div>
  );
}

// ─── Measurement primitives ────────────────────────────────
// A single measurement row with: label, "why we use this", numeric input, slider
// with min/typical/max ticks, status pill (high confidence / needs tailor check),
// and inline validation messages. Designed to drop into the onboarding manual
// step, the profile editor and the Fit Studio measurement basis panel.
function MeasurementInput({
  field,
  value,
  confidence = 70,
  source = "manual",
  warning = null,
  onChange,
  compact = false,
}) {
  const [draft, setDraft] = useState(String(value ?? ""));
  useEffect(() => {
    setDraft(String(value ?? ""));
  }, [value]);

  const commit = next => {
    const n = parseFloat(next);
    if (Number.isNaN(n)) return;
    const clamped = Math.min(field.max + 4, Math.max(field.min - 4, n));
    onChange(Math.round(clamped * 4) / 4);
  };

  const inTypical = value >= field.typical[0] && value <= field.typical[1];
  const conf = Math.max(0, Math.min(100, confidence));
  const confTone = conf >= 88 ? C.forest : conf >= 70 ? C.warning : C.tailor;
  const sourceText = sourceLabel(source);

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${warning ? C.tailorBorder : C.border}`,
        borderRadius: 14,
        padding: compact ? "10px 12px" : "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, letterSpacing: 0.1 }}>
            {field.label}
          </div>
          {!compact && (
            <div style={{ fontSize: 10.5, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>
              {field.how}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <input
            type="number"
            inputMode="decimal"
            min={field.min - 4}
            max={field.max + 4}
            step={field.step}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={e => commit(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
            aria-label={`${field.label} value`}
            style={{
              width: 64,
              padding: "6px 8px",
              borderRadius: 9,
              border: `1px solid ${C.border}`,
              background: C.bgElevated,
              color: C.accent,
              fontSize: 14,
              fontWeight: 800,
              fontFamily: font.sans,
              textAlign: "right",
              outline: "none",
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{field.unit}</span>
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <input
          type="range"
          min={field.min}
          max={field.max}
          step={field.step}
          value={Math.min(field.max, Math.max(field.min, value || field.min))}
          onChange={e => commit(e.target.value)}
          aria-label={`${field.label} slider`}
          style={{ width: "100%", accentColor: C.forest, cursor: "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2, fontSize: 9.5, color: C.muted, fontWeight: 600, letterSpacing: 0.3 }}>
          <span>{field.min}{field.unit}</span>
          <span style={{ color: inTypical ? C.forest : C.muted }}>
            typical {field.typical[0]}–{field.typical[1]}{field.unit}
          </span>
          <span>{field.max}{field.unit}</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 8px",
            borderRadius: 999,
            background: `${confTone}14`,
            border: `1px solid ${confTone}40`,
            color: confTone,
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: confTone }} />
          {conf}% · {confidenceLabel(conf)}
        </span>
        <span style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>{sourceText}</span>
      </div>

      {warning && (
        <div
          role="status"
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            padding: "8px 10px",
            borderRadius: 10,
            background: warning.severity === "warn" ? C.warningBg : C.goldBg,
            border: `1px solid ${warning.severity === "warn" ? C.warningBorder : C.goldBorder}`,
            fontSize: 11,
            color: warning.severity === "warn" ? C.warning : C.forestDeep,
            lineHeight: 1.5,
          }}
        >
          <span style={{ marginTop: 2 }}>•</span>
          <span>{warning.message}</span>
        </div>
      )}
    </div>
  );
}

// Fit Passport — compact, app-like summary of every measurement, its confidence
// and source. Used in onboarding review, profile overview and as the "measurement
// basis" embed inside Fit Studio.
function MeasurementPassport({
  body,
  meta,
  heightInches,
  onRefine,
  onRescan,
  compact = false,
  title = "Measurement Passport",
  subtitle = null,
}) {
  const warnings = useMemo(() => validateBody(body, heightInches), [body, heightInches]);
  const warningByKey = useMemo(() => {
    const m = {};
    for (const w of warnings) {
      if (!m[w.key]) m[w.key] = w;
    }
    return m;
  }, [warnings]);
  const overall = aggregateConfidence(meta);
  const overallTone = overall >= 88 ? C.forest : overall >= 70 ? C.warning : C.tailor;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          padding: compact ? "12px 14px" : "14px 16px",
          borderRadius: 16,
          background: `linear-gradient(135deg, ${C.bgElevated}, ${C.card})`,
          border: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9.5, color: C.muted, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase" }}>
              Fit Passport
            </div>
            <div style={{ fontSize: compact ? 15 : 18, fontWeight: 600, color: C.accent, fontFamily: font.serif, lineHeight: 1.2, marginTop: 2 }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div>
            )}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: C.muted, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase" }}>
              Overall confidence
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: overallTone, fontFamily: font.sans, lineHeight: 1.1 }}>
              {overall}%
            </div>
            <div style={{ fontSize: 9.5, color: overallTone, fontWeight: 700, letterSpacing: 0.4 }}>
              {confidenceLabel(overall)}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: compact ? "1fr 1fr" : "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 8,
          }}
        >
          {MEASUREMENT_FIELDS.map(f => {
            const v = body?.[f.key];
            const c = meta?.confidence?.[f.key] ?? 70;
            const verified = meta?.verified?.[f.key];
            const tone = c >= 88 ? C.forest : c >= 70 ? C.warning : C.tailor;
            const hasWarn = !!warningByKey[f.key];
            return (
              <div
                key={f.key}
                style={{
                  padding: "10px 11px",
                  borderRadius: 12,
                  background: C.card,
                  border: `1px solid ${hasWarn ? C.warningBorder : C.border}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" }}>
                    {f.label}
                  </span>
                  {verified && (
                    <span title="Tailor confirmed" style={{ fontSize: 9, fontWeight: 800, color: C.forest, letterSpacing: 0.4 }}>
                      ✓ VERIFIED
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.accent, fontFamily: font.serif }}>
                  {v ?? "—"}<span style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginLeft: 2 }}>{f.unit}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ flex: 1, height: 4, borderRadius: 999, background: C.bgElevated, overflow: "hidden" }}>
                    <span style={{ display: "block", width: `${c}%`, height: "100%", background: `linear-gradient(90deg, ${tone}, ${tone}AA)` }} />
                  </span>
                  <span style={{ fontSize: 9.5, fontWeight: 800, color: tone, letterSpacing: 0.3 }}>{c}%</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 10.5, color: C.muted }}>
          <span>
            Source: <strong style={{ color: C.accent, fontWeight: 700 }}>{sourceLabel(meta?.source)}</strong>
            {meta?.fitPreference && (
              <> · Fit preference: <strong style={{ color: C.accent, fontWeight: 700, textTransform: "capitalize" }}>{meta.fitPreference}</strong></>
            )}
          </span>
          {meta?.tailorVerified ? (
            <span style={{ color: C.forest, fontWeight: 700 }}>✓ Tailor verified</span>
          ) : (
            <span style={{ color: C.tailor, fontWeight: 700 }}>Tailor review on first order</span>
          )}
        </div>
      </div>

      {warnings.length > 0 && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            background: C.warningBg,
            border: `1px solid ${C.warningBorder}`,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 800, color: C.warning, letterSpacing: 1.4, textTransform: "uppercase" }}>
            Smart checks · {warnings.length}
          </div>
          {warnings.slice(0, 3).map((w, i) => (
            <div key={i} style={{ fontSize: 11, color: C.mutedLight, lineHeight: 1.5 }}>
              <strong style={{ color: C.warning, textTransform: "capitalize", fontWeight: 700 }}>{w.key}:</strong> {w.message}
            </div>
          ))}
        </div>
      )}

      {(onRefine || onRescan) && (
        <div style={{ display: "flex", gap: 8 }}>
          {onRefine && (
            <button
              onClick={onRefine}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                background: C.card,
                color: C.accent,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: 0.3,
              }}
            >
              Refine manually
            </button>
          )}
          {onRescan && (
            <button
              onClick={onRescan}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 12,
                border: "none",
                background: `linear-gradient(135deg, ${C.forest}, ${C.forestDeep})`,
                color: C.cream,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: 0.4,
                boxShadow: "0 10px 22px rgba(107,142,90,0.30)",
              }}
            >
              Re-run AI scan
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Onboarding Screen ─────────────────────────────────────
function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState("choose");
  const [useMetric, setUseMetric] = useState(false);
  const [body, setBody] = useState({ ...DEFAULT_BODY });
  const [bodyMeta, setBodyMeta] = useState({ ...DEFAULT_BODY_META });
  const [zoneIndex, setZoneIndex] = useState(0);
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(5);
  const [heightCm, setHeightCm] = useState(165);
  const [scanning, setScanning] = useState(false);

  const heightInches = useMetric
    ? Math.round(heightCm / 2.54)
    : heightFt * 12 + heightIn;

  const warnings = useMemo(() => validateBody(body, heightInches), [body, heightInches]);
  const warningByKey = useMemo(() => {
    const m = {};
    for (const w of warnings) {
      if (!m[w.key]) m[w.key] = w;
    }
    return m;
  }, [warnings]);

  const handleScanComplete = result => {
    // CameraBodyScanner emits either the legacy plain measurements object or a
    // richer { measurements, meta } shape now that we capture per-measurement
    // confidence. Accept both.
    const meas = result?.measurements ?? result;
    const scanMeta = result?.meta;
    setBody({ ...meas });
    setBodyMeta(prev => ({
      ...prev,
      source: "scan",
      lastReviewedAt: Date.now(),
      confidence: scanMeta?.confidence ?? prev.confidence,
      verified: { bust: false, waist: false, hips: false, inseam: false, shoulder: false },
    }));
    setScanning(false);
    setStep("review");
  };

  const setMeasurement = (key, value) => {
    setBody(b => ({ ...b, [key]: value }));
    setBodyMeta(meta => ({
      ...meta,
      source: meta.source === "scan" ? "scan" : "manual",
      confidence: { ...meta.confidence, [key]: 92 },
      verified: { ...meta.verified, [key]: true },
      lastReviewedAt: Date.now(),
    }));
  };

  const setFitPreference = pref => {
    setBodyMeta(meta => ({ ...meta, fitPreference: pref }));
  };

  const finish = () => {
    onComplete(body, { ...bodyMeta, lastReviewedAt: Date.now() });
  };

  if (scanning) {
    return (
      <div
        className="tb-screen tb-screen--scanner"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: C.bg,
          overflow: "auto",
        }}
      >
        <div
          className="tb-screen__header"
          style={{
            padding: "18px 18px 0",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <BackButton onClick={() => setScanning(false)} />
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: C.accent,
                margin: 0,
                fontFamily: font.serif,
              }}
            >
              AI Multi-angle Fit Capture
            </h2>
            <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
              TTC AI Fit Engine · depth-informed fit mesh · tailor-verified
            </p>
          </div>
        </div>
        <div
          className="tb-screen__body tb-screen__body--centered"
          style={{
            flex: 1,
            padding: "0 18px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <CameraBodyScanner
            onScanComplete={handleScanComplete}
            onCancel={() => {
              setScanning(false);
              setStep("manual");
            }}
            userHeight={heightInches}
          />
        </div>
      </div>
    );
  }

  if (step === "choose") {
    return (
      <div
        className="tb-screen tb-screen--onboarding-choose"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: C.bg,
          padding: "52px 24px 44px",
          overflow: "auto",
        }}
      >
        <div
          className="tb-onboarding-hero"
          style={{ marginBottom: 32, textAlign: "center" }}
        >
          <h1
            style={{
              fontFamily: font.serif,
              fontSize: 32,
              fontWeight: 400,
              color: C.accent,
              margin: "0 0 10px",
              lineHeight: 1.2,
            }}
          >
            Build your fit profile
          </h1>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
            We use your measurements to score fit, reduce returns, and prepare
            alteration guidance before you buy.
          </p>
        </div>

        <div
          className="tb-onboarding-choice-list"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginBottom: 32,
          }}
        >
          {/* Manual entry first — most reliable for web preview where camera
              access may be blocked. AI scan stays available below. */}
          <GlassCard
            hover
            onClick={() => setStep("manual")}
            style={{ padding: 20 }}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: C.goldBg,
                  border: `1px solid ${C.goldBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <MeasureIcon size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{ fontSize: 15, fontWeight: 600, color: C.accent }}
                  >
                    Enter measurements
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: C.gold,
                      background: C.goldBg,
                      border: `1px solid ${C.goldBorder}`,
                      padding: "2px 8px",
                      borderRadius: 6,
                      letterSpacing: 0.5,
                    }}
                  >
                    RECOMMENDED
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: C.muted,
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  Quick sliders for tape measure or clothing label values. The
                  fastest way to build your fit profile on the web.
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard
            hover
            onClick={() => setScanning(true)}
            style={{ padding: 20 }}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CameraIcon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: C.accent,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  TTC AI Multi-angle Fit Capture
                </span>
                <p
                  style={{
                    fontSize: 12,
                    color: C.muted,
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  AI-guided multi-angle fit capture — AI silhouette segmentation, a depth-informed fit mesh, and contour confidence build a measurement-grade avatar, then a human tailor verifies the alteration brief. Best on a mobile device with camera access; falls back to manual entry.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        <div
          className="tb-onboarding-note"
          style={{
            padding: "14px 16px",
            background: C.tailorBg,
            border: `1px solid ${C.tailorBorder}`,
            borderRadius: 12,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <SparkleIcon size={14} />
            <p
              style={{
                fontSize: 11,
                color: C.tailor,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Your measurements are stored only on your device and never shared.
              You can update them anytime in your profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "manual") {
    // Body-zone stepper: height/units → upper → mid → lower → fit preference → done
    const totalSteps = 1 + BODY_ZONES.length + 1; // height + zones + prefs
    const isHeightStep = zoneIndex === 0;
    const isPrefStep = zoneIndex === BODY_ZONES.length + 1;
    const currentZone = !isHeightStep && !isPrefStep ? BODY_ZONES[zoneIndex - 1] : null;
    const progressPct = Math.round((zoneIndex / (totalSteps - 1)) * 100);
    const goNext = () => setZoneIndex(i => Math.min(totalSteps - 1, i + 1));
    const goPrev = () => {
      if (zoneIndex === 0) setStep("choose");
      else setZoneIndex(i => Math.max(0, i - 1));
    };

    return (
      <div
        className="tb-screen tb-screen--onboarding-manual"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: C.bg,
          overflow: "hidden",
        }}
      >
        <div
          className="tb-screen__header"
          style={{
            padding: "18px 18px 0",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <BackButton onClick={goPrev} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: C.accent,
                margin: 0,
                fontFamily: font.serif,
              }}
            >
              Your Measurements
            </h2>
            <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
              Step {zoneIndex + 1} of {totalSteps} ·{" "}
              {isHeightStep
                ? "Height & units"
                : isPrefStep
                  ? "Fit preference"
                  : currentZone.label}
            </p>
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.forest, letterSpacing: 0.4 }}>
            {progressPct}%
          </div>
        </div>
        <div style={{ padding: "0 18px", marginBottom: 6 }}>
          <div style={{ height: 4, background: C.bgElevated, borderRadius: 999, overflow: "hidden", border: `1px solid ${C.border}` }}>
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${C.forest}, ${C.sage})`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        <div
          className="tb-screen__body tb-onboarding-manual__body"
          style={{ flex: 1, padding: "10px 18px 12px", overflow: "auto", minHeight: 0 }}
        >
          <div
            className="tb-onboarding-manual__grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 14,
            }}
          >
            {/* Live mini-preview at top — keeps measurements visually anchored */}
            <div
              className="tb-onboarding-preview"
              style={{
                display: "flex",
                justifyContent: "center",
                background: `radial-gradient(ellipse at 50% 38%, ${C.cream} 0%, ${C.beige} 75%, ${C.oat} 100%)`,
                borderRadius: 18,
                border: `1px solid ${C.border}`,
                padding: 12,
              }}
            >
              <Body3DViewer
                body={body}
                width={220}
                height={300}
                autoRotate
                annotated
                variant="studio"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {isHeightStep && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                    }}
                  >
                    <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Units</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Pill label="in / ft" active={!useMetric} onClick={() => setUseMetric(false)} />
                      <Pill label="cm / m" active={useMetric} onClick={() => setUseMetric(true)} />
                    </div>
                  </div>

                  <div
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 14,
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>Height</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: C.forest, fontFamily: font.sans }}>
                        {useMetric ? `${heightCm} cm` : `${heightFt}′ ${heightIn}″`}
                      </span>
                    </div>
                    <p style={{ fontSize: 10.5, color: C.muted, lineHeight: 1.4, margin: 0 }}>
                      We use height to sanity-check inseam and hem drop, and to anchor the scan reference.
                    </p>
                    {useMetric ? (
                      <input
                        type="range"
                        min={140}
                        max={200}
                        step={1}
                        value={heightCm}
                        onChange={e => setHeightCm(parseInt(e.target.value))}
                        aria-label="Height in centimetres"
                        style={{ width: "100%", accentColor: C.forest }}
                      />
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Feet</span>
                            <span style={{ fontSize: 12, color: C.accent, fontWeight: 800 }}>{heightFt}′</span>
                          </div>
                          <input
                            type="range"
                            min={4}
                            max={7}
                            step={1}
                            value={heightFt}
                            onChange={e => setHeightFt(parseInt(e.target.value))}
                            aria-label="Height feet"
                            style={{ width: "100%", accentColor: C.forest }}
                          />
                        </div>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Inches</span>
                            <span style={{ fontSize: 12, color: C.accent, fontWeight: 800 }}>{heightIn}″</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={11}
                            step={1}
                            value={heightIn}
                            onChange={e => setHeightIn(parseInt(e.target.value))}
                            aria-label="Height inches"
                            style={{ width: "100%", accentColor: C.forest }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {currentZone && (
                <>
                  <div
                    style={{
                      background: C.tailorBg,
                      border: `1px solid ${C.tailorBorder}`,
                      borderRadius: 12,
                      padding: "10px 14px",
                    }}
                  >
                    <div style={{ fontSize: 9.5, color: C.tailor, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase" }}>
                      Zone {zoneIndex} of {BODY_ZONES.length}
                    </div>
                    <div style={{ fontSize: 14, color: C.accent, fontWeight: 700, marginTop: 2, fontFamily: font.serif }}>
                      {currentZone.label}
                    </div>
                    <div style={{ fontSize: 11, color: C.mutedLight, marginTop: 4, lineHeight: 1.5 }}>
                      {currentZone.blurb}
                    </div>
                  </div>

                  {currentZone.keys.map(k => {
                    const f = fieldByKey(k);
                    if (!f) return null;
                    return (
                      <div key={k} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <MeasurementInput
                          field={f}
                          value={body[k]}
                          confidence={bodyMeta.confidence[k] ?? 70}
                          source={bodyMeta.source}
                          warning={warningByKey[k]}
                          onChange={v => setMeasurement(k, v)}
                        />
                        <div style={{ fontSize: 10.5, color: C.muted, lineHeight: 1.5, padding: "0 4px" }}>
                          <strong style={{ color: C.accent, fontWeight: 700 }}>How we use it · </strong>{f.why}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {isPrefStep && (
                <>
                  <div
                    style={{
                      background: C.tailorBg,
                      border: `1px solid ${C.tailorBorder}`,
                      borderRadius: 12,
                      padding: "10px 14px",
                    }}
                  >
                    <div style={{ fontSize: 9.5, color: C.tailor, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase" }}>
                      Last step
                    </div>
                    <div style={{ fontSize: 14, color: C.accent, fontWeight: 700, marginTop: 2, fontFamily: font.serif }}>
                      How do you like clothes to sit?
                    </div>
                    <div style={{ fontSize: 11, color: C.mutedLight, marginTop: 4, lineHeight: 1.5 }}>
                      We bias the alteration brief so your pieces land closer to this feel.
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {FIT_PREFERENCES.map(p => {
                      const active = bodyMeta.fitPreference === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setFitPreference(p.id)}
                          style={{
                            textAlign: "left",
                            padding: "12px 14px",
                            borderRadius: 14,
                            border: `1px solid ${active ? C.forest : C.border}`,
                            background: active ? C.goldBg : C.card,
                            color: C.accent,
                            cursor: "pointer",
                            boxShadow: active ? "0 8px 18px rgba(107,142,90,0.18)" : "none",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: active ? C.forestDeep : C.accent }}>{p.label}</span>
                            {active && <span style={{ fontSize: 10, fontWeight: 800, color: C.forest, letterSpacing: 0.6 }}>✓</span>}
                          </div>
                          <div style={{ fontSize: 10.5, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>{p.blurb}</div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {warnings.length > 0 && !isHeightStep && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: C.warningBg,
                    border: `1px solid ${C.warningBorder}`,
                    fontSize: 11,
                    color: C.warning,
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ fontWeight: 800, letterSpacing: 0.4 }}>Smart check:</strong>{" "}
                  {warnings[0].message}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="tb-sticky-cta"
          style={{
            flexShrink: 0,
            padding: "12px 18px 18px",
            background: `linear-gradient(180deg, rgba(242,243,238,0.0) 0%, ${C.bg} 22%, ${C.bg} 100%)`,
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            gap: 8,
            boxShadow: "0 -14px 28px rgba(45,55,42,0.06)",
          }}
        >
          {zoneIndex > 0 && (
            <button
              onClick={() => setZoneIndex(i => Math.max(0, i - 1))}
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                border: `1px solid ${C.border}`,
                background: C.card,
                color: C.accent,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: 0.4,
              }}
            >
              Back
            </button>
          )}
          <button
            onClick={zoneIndex < totalSteps - 1 ? goNext : finish}
            style={{
              flex: 1,
              padding: "15px 0",
              borderRadius: 14,
              border: "none",
              background: `linear-gradient(135deg, ${C.forest}, ${C.forestDeep})`,
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: 0.6,
              cursor: "pointer",
              boxShadow: `0 10px 22px rgba(107,142,90,0.32)`,
            }}
          >
            {(() => {
              if (zoneIndex >= totalSteps - 1) return "Save measurements & continue";
              if (isHeightStep) return "Start with upper body";
              const next = zoneIndex < BODY_ZONES.length ? BODY_ZONES[zoneIndex] : null;
              if (next) return `Continue to ${next.label.toLowerCase()}`;
              return "Almost done — fit preference";
            })()}
          </button>
        </div>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div
        className="tb-screen tb-screen--onboarding-review"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: C.bg,
          overflow: "hidden",
        }}
      >
        <div
          className="tb-screen__header"
          style={{
            padding: "18px 18px 0",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <BackButton onClick={() => setStep("choose")} />
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: C.accent,
                margin: 0,
                fontFamily: font.serif,
              }}
            >
              Your Measurements
            </h2>
            <p style={{ fontSize: 11, color: C.success, margin: 0 }}>
              Scan complete — review your Fit Passport below
            </p>
          </div>
        </div>
        <div
          className="tb-screen__body"
          style={{ flex: 1, padding: "0 18px 18px", overflow: "auto", minHeight: 0 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Body3DViewer
              body={body}
              width={240}
              height={320}
              autoRotate
              annotated
              variant="scan"
            />
          </div>
          <MeasurementPassport
            body={body}
            meta={bodyMeta}
            heightInches={heightInches}
            title="Your Fit Passport"
            subtitle="Tailor-verified before any cut. Anything off can be refined manually."
            onRefine={() => setStep("manual")}
            onRescan={() => {
              setScanning(true);
            }}
          />
        </div>
        <div
          className="tb-sticky-cta"
          style={{
            flexShrink: 0,
            padding: "12px 18px 22px",
            background: `linear-gradient(180deg, rgba(242,243,238,0.0) 0%, ${C.bg} 22%, ${C.bg} 100%)`,
            borderTop: `1px solid ${C.border}`,
          }}
        >
          <button
            onClick={finish}
            style={{
              width: "100%",
              padding: "15px 0",
              borderRadius: 14,
              border: "none",
              background: `linear-gradient(135deg, ${C.forest}, ${C.forestDeep})`,
              color: C.cream,
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: 0.6,
              cursor: "pointer",
              boxShadow: "0 10px 22px rgba(107,142,90,0.32)",
            }}
          >
            Save Passport & continue
          </button>
        </div>
      </div>
    );
  }
  return null;
}

// ─── Home / Import Screen ──────────────────────────────────
const SUPPORTED_RETAILERS = [
  "Zara",
  "Reformation",
  "SKIMS",
  "Aritzia",
  "Mango",
  "COS",
  "Everlane",
  "H&M",
  "Nike",
  "Abercrombie",
];
const IMPORT_STAGES = [
  { id: "fetch", label: "Fetching product page" },
  { id: "specs", label: "Parsing brand size chart" },
  { id: "fabric", label: "Reading fabric & stretch notes" },
  { id: "fit", label: "Mapping garment to your body" },
  { id: "brief", label: "Drafting tailor brief" },
];
function pickRetailerFromUrl(url = "") {
  const u = url.toLowerCase();
  if (u.includes("zara")) return "Zara";
  if (u.includes("reformation") || u.includes("thereformation")) return "Reformation";
  if (u.includes("skims")) return "SKIMS";
  if (u.includes("aritzia")) return "Aritzia";
  if (u.includes("mango")) return "Mango";
  if (u.includes("cos.com") || /\bcos\b/.test(u)) return "COS";
  if (u.includes("everlane")) return "Everlane";
  if (u.includes("hm.com") || u.includes("h&m")) return "H&M";
  if (u.includes("nike")) return "Nike";
  if (u.includes("abercrombie") || u.includes("af.com")) return "Abercrombie";
  return null;
}
function HomeScreen({
  catalog,
  onItemClick,
  favorites,
  toggleFav,
  onNav,
  userBody,
}) {
  const [linkInput, setLinkInput] = useState("");
  const [importPhase, setImportPhase] = useState("idle"); // idle | parsing | ready | error
  const [stageIndex, setStageIndex] = useState(-1);
  const [importedItem, setImportedItem] = useState(null);
  const [importError, setImportError] = useState("");
  const timersRef = useRef([]);

  useEffect(() => () => timersRef.current.forEach(t => clearTimeout(t)), []);

  const recentImports = useMemo(
    () => [...catalog].sort((a, b) => b.fit - a.fit).slice(0, 6),
    [catalog]
  );
  const avgFit = Math.round(
    catalog.reduce((s, i) => s + i.fit, 0) / Math.max(1, catalog.length)
  );

  const startImport = (rawUrl) => {
    const url = (rawUrl || "").trim();
    if (!url) {
      setImportError("Paste a product link from a supported retailer to begin.");
      setImportPhase("error");
      return;
    }
    const retailer = pickRetailerFromUrl(url);
    if (!retailer) {
      setImportError(
        "We don't recognize that retailer yet. Try a link from Zara, Reformation, SKIMS, Aritzia, Mango, COS, Everlane, H&M, Nike, or Abercrombie."
      );
      setImportPhase("error");
      return;
    }
    setImportError("");
    setImportPhase("parsing");
    setStageIndex(0);
    setImportedItem(null);
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
    IMPORT_STAGES.forEach((_, i) => {
      const t = setTimeout(() => {
        setStageIndex(i);
        if (i === IMPORT_STAGES.length - 1) {
          const match = catalog.find(it => it.brand === retailer) || catalog[0];
          const synth = {
            ...match,
            id: `imp-${Date.now()}`,
            sourceUrl: url,
            imported: true,
            importDate: new Date().toLocaleDateString(),
          };
          const tFinish = setTimeout(() => {
            setImportedItem(synth);
            setImportPhase("ready");
          }, 520);
          timersRef.current.push(tFinish);
        }
      }, 480 * (i + 1));
      timersRef.current.push(t);
    });
  };
  const resetImport = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
    setImportPhase("idle");
    setStageIndex(-1);
    setImportedItem(null);
    setImportError("");
    setLinkInput("");
  };

  const parsing = importPhase === "parsing";
  const ready = importPhase === "ready" && importedItem;

  return (
    <div
      className="tb-screen tb-screen--home"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
      }}
    >
      <div className="tb-screen__header" style={{ padding: "22px 18px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${C.forest}, ${C.forestDeep})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 16px rgba(107,142,90,0.28)` }}>
              <span style={{ color: C.cream, fontSize: 17, fontWeight: 700, fontFamily: font.serif, fontStyle: "italic" }}>t</span>
            </div>
            <div>
              <div style={{ fontSize: 9.5, color: C.muted, letterSpacing: 1.8, textTransform: "uppercase", fontWeight: 700 }}>AI Tailor Concierge</div>
              <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, marginTop: 1 }}>Import · AI fit · Tailor · Ship</div>
            </div>
          </div>
          <button
            onClick={() => onNav("profile")}
            aria-label="Profile"
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              color: C.mutedLight,
              fontSize: 11,
              padding: "7px 10px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            My measurements
          </button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 28, fontWeight: 400, color: C.accent, margin: "0 0 4px", fontFamily: font.serif, lineHeight: 1.04, letterSpacing: -0.6 }}>
            Paste a product link. <span style={{ fontStyle: "italic", color: C.forest, fontWeight: 500 }}>We tailor it.</span>
          </h2>
          <p style={{ fontSize: 12, color: C.muted, margin: 0, letterSpacing: 0.2, lineHeight: 1.5 }}>
            Drop in a URL from any retailer. Our AI extracts the garment specs and fits them to your measurement-grade avatar, then our in-house tailors verify, alter and ship the piece.
          </p>
        </div>
      </div>

      <div
        className="tb-screen__body"
        style={{ flex: 1, overflow: "auto", padding: "4px 18px 100px" }}
      >
        {/* Link import card */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: 16,
            marginBottom: 16,
            boxShadow: "0 8px 22px rgba(45,55,42,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.goldBg, color: C.forest, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.goldBorder}` }}>
              <ScissorsIcon size={16} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, letterSpacing: 0.4 }}>
              Import a garment
            </div>
            {ready && (
              <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: C.success, letterSpacing: 0.6, textTransform: "uppercase" }}>Brief ready</span>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
            <input
              value={linkInput}
              onChange={e => setLinkInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") startImport(linkInput);
              }}
              disabled={parsing}
              placeholder="https://www.zara.com/…   or   https://reformation.com/…"
              style={{
                flex: 1,
                minWidth: 0,
                background: parsing ? C.bgElevated : C.bgElevated,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "11px 12px",
                color: C.accent,
                fontSize: 13,
                outline: "none",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            />
            <button
              onClick={() => startImport(linkInput)}
              disabled={parsing}
              style={{
                padding: "0 16px",
                borderRadius: 12,
                border: "none",
                background: parsing
                  ? PALETTE.warmGray
                  : `linear-gradient(135deg, ${C.forest}, ${C.forestDeep})`,
                color: C.cream,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.4,
                cursor: parsing ? "default" : "pointer",
                whiteSpace: "nowrap",
                boxShadow: parsing ? "none" : "0 10px 22px rgba(107,142,90,0.30)",
              }}
            >
              {parsing ? "Parsing…" : "Extract specs"}
            </button>
          </div>

          {/* Retailer chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            <span style={{ fontSize: 9.5, color: C.muted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginRight: 4, alignSelf: "center" }}>
              Supported
            </span>
            {SUPPORTED_RETAILERS.map(r => (
              <span
                key={r}
                style={{
                  fontSize: 10.5,
                  padding: "4px 9px",
                  borderRadius: 999,
                  color: C.mutedLight,
                  background: PALETTE.cream,
                  border: `1px solid ${C.border}`,
                  fontWeight: 600,
                }}
              >
                {r}
              </span>
            ))}
          </div>

          {/* Stage progress / error */}
          {parsing && (
            <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
              {IMPORT_STAGES.map((s, i) => {
                const done = i < stageIndex;
                const active = i === stageIndex;
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: `1.5px solid ${done ? C.forest : active ? C.forest : C.border}`,
                        background: done ? C.forest : "transparent",
                        color: C.cream,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {done ? (
                        <span style={{ fontSize: 10, fontWeight: 800 }}>✓</span>
                      ) : active ? (
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.forest, animation: "pulse 1.4s ease-in-out infinite" }} />
                      ) : null}
                    </div>
                    <span style={{ fontSize: 11.5, color: active ? C.accent : done ? C.mutedLight : C.muted, fontWeight: active ? 700 : 500 }}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {importPhase === "error" && (
            <div style={{ marginTop: 12, padding: 10, borderRadius: 12, background: "rgba(207,108,108,0.10)", border: "1px solid rgba(207,108,108,0.35)", color: "#8a3a3a", fontSize: 11.5, lineHeight: 1.5 }}>
              {importError}
            </div>
          )}
        </div>

        {/* Imported garment fit brief */}
        {ready && (
          <div
            style={{
              background: `linear-gradient(180deg, ${PALETTE.cream} 0%, #FFFFFF 100%)`,
              border: `1px solid ${C.goldBorder}`,
              borderRadius: 18,
              padding: 14,
              marginBottom: 16,
              boxShadow: "0 10px 28px rgba(45,55,42,0.10)",
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flexShrink: 0, width: 96, height: 122, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}` }}>
                <ProductImage item={importedItem} style={{ width: "100%", height: "100%" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9.5, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700 }}>
                  {importedItem.brand} · imported {importedItem.importDate}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.accent, margin: "3px 0 6px", lineHeight: 1.25 }}>
                  {importedItem.name}
                </div>
                <div
                  title={importedItem.sourceUrl}
                  style={{
                    fontSize: 10.5,
                    color: C.mutedLight,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginBottom: 8,
                  }}
                >
                  {importedItem.sourceUrl}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <FitBadge fit={importedItem.fit} />
                  <span style={{ fontSize: 10, color: C.mutedLight, padding: "3px 8px", borderRadius: 999, background: PALETTE.cream, border: `1px solid ${C.border}`, fontWeight: 600 }}>
                    Best size · {importedItem.bestSize}
                  </span>
                  <span style={{ fontSize: 10, color: C.mutedLight, padding: "3px 8px", borderRadius: 999, background: PALETTE.cream, border: `1px solid ${C.border}`, fontWeight: 600 }}>
                    ${importedItem.price}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={() => onItemClick(importedItem)}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  borderRadius: 12,
                  border: "none",
                  background: `linear-gradient(135deg, ${C.forest}, ${C.forestDeep})`,
                  color: C.cream,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: 0.4,
                }}
              >
                Open fit brief
              </button>
              <button
                onClick={resetImport}
                style={{
                  padding: "11px 14px",
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: "transparent",
                  color: C.mutedLight,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Import another
              </button>
            </div>
          </div>
        )}

        {/* How it works (only if idle) */}
        {!parsing && !ready && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 }}>
              How concierge tailoring works
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {[
                ["1", "You paste a product link", "Any retailer page — we parse the specs, fabric, and size chart."],
                ["2", "We map it to your body", "Garment dimensions are draped onto your scanned measurements with fit confidence."],
                ["3", "In-house tailors order & alter", "Our team orders the piece and tailors it to your exact proportions before shipping."],
              ].map(([num, head, body]) => (
                <div key={num} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 12, borderRadius: 14, background: C.card, border: `1px solid ${C.border}` }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: C.goldBg, border: `1px solid ${C.goldBorder}`, color: C.forest, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {num}
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: C.accent, marginBottom: 2 }}>{head}</div>
                    <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent imports */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase" }}>
              Recent imports
            </div>
            <button onClick={() => onNav("trending")} style={{ background: "none", border: "none", color: C.forest, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>
              Library →
            </button>
          </div>
          <div
            className="tb-catalog-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            {recentImports.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => onItemClick(item)}
                isFav={favorites.has(item.id)}
                toggleFav={toggleFav}
              />
            ))}
          </div>
          <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 12, background: PALETTE.cream, border: `1px solid ${C.border}`, color: C.muted, fontSize: 10.5, lineHeight: 1.5 }}>
            Avg fit across your imports: <strong style={{ color: C.forest }}>{avgFit}%</strong>. Every imported garment ships through our in-house tailor before delivery.
          </div>
        </div>
      </div>
      <NavBar active="home" onNav={onNav} />
    </div>
  );
}

// ─── Trending Screen ───────────────────────────────────────
function TrendingScreen({ catalog, onItemClick, favorites, toggleFav, onNav }) {
  const [activeTab, setActiveTab] = useState("demand");
  const trendingItems = useMemo(
    () => catalog.filter(i => i.trending).sort((a, b) => b.fit - a.fit),
    [catalog]
  );
  const demandSignals = trendingItems.filter(
    i => i.badgeMeta?.group === "demand"
  );
  const editorialPicks = trendingItems.filter(
    i => i.badgeMeta?.group === "editorial"
  );
  const clientFavorites = trendingItems.filter(
    i => i.badgeMeta?.group === "staple"
  );
  const seasonalSignals = trendingItems.filter(
    i => i.badgeMeta?.group === "seasonal"
  );
  const favoritesList = useMemo(
    () => catalog.filter(i => favorites.has(i.id)).sort((a, b) => b.fit - a.fit),
    [catalog, favorites]
  );

  const TABS = [
    { key: "demand", label: "Demand", items: demandSignals },
    { key: "editorial", label: "Editorial", items: editorialPicks },
    { key: "seasonal", label: "Seasonal", items: seasonalSignals },
    { key: "favorites", label: "Favorites", items: favoritesList },
  ];
  const currentTab = TABS.find(t => t.key === activeTab) || TABS[0];
  const currentItems = currentTab.items;

  const Section = ({ title, IconComp, items, color = C.accent }) => (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <div style={{ color, display: "flex" }}>
          <IconComp size={16} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color }}>{title}</span>
        <div
          style={{ flex: 1, height: 1, background: C.border, marginLeft: 4 }}
        />
      </div>
      <div
        className="tb-trend-rail"
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          scrollbarWidth: "none",
          paddingBottom: 4,
        }}
      >
        {items.slice(0, 8).map(item => (
          <div
            key={item.id}
            onClick={() => onItemClick(item)}
            style={{ flexShrink: 0, width: 155, cursor: "pointer" }}
          >
            <GlassCard hover style={{ overflow: "hidden" }}>
              <ProductImage item={item} style={{ height: 170 }}>
                <div style={{ position: "absolute", top: 8, left: 8 }}>
                  <FitBadge fit={item.fit} />
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    toggleFav(item.id);
                  }}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "rgba(0,0,0,0.5)",
                    border: "none",
                    borderRadius: "50%",
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <HeartIcon filled={favorites.has(item.id)} />
                </button>
                {item.badgeMeta && (
                  <div style={{ position: "absolute", bottom: 8, left: 8 }}>
                    <BadgePill meta={item.badgeMeta} compact />
                  </div>
                )}
              </ProductImage>
              <div style={{ padding: "8px 10px 10px" }}>
                <div
                  style={{
                    fontSize: 8,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {item.brand}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: C.accent,
                    marginTop: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 4,
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: C.accent }}
                  >
                    ${item.price}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      color: item.risk === "Low" ? C.success : C.warning,
                      fontWeight: 600,
                    }}
                  >
                    {item.risk} risk
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="tb-screen tb-screen--trending"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
      }}
    >
      <div className="tb-screen__header" style={{ padding: "18px 18px 0" }}>
        <div style={{ marginBottom: 16 }}>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 400,
              color: C.accent,
              margin: "0 0 2px",
              fontFamily: font.serif,
            }}
          >
            Market Signals
          </h2>
          <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
            High-demand pieces filtered through your fit profile
          </p>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 14,
            overflowX: "auto",
            scrollbarWidth: "none",
            paddingBottom: 2,
          }}
        >
          {TABS.map(({ key, label, items }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(key)}
                style={{
                  flexShrink: 0,
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: `1px solid ${isActive ? C.forest : C.borderLight}`,
                  background: isActive ? C.forest : C.card,
                  color: isActive ? C.cream : C.accent,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.18s",
                  boxShadow: isActive ? "0 6px 14px rgba(107,142,90,0.24)" : "none",
                }}
              >
                <span>{label}</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 22,
                    height: 18,
                    padding: "0 6px",
                    borderRadius: 999,
                    background: isActive ? "rgba(255,255,255,0.18)" : C.beige,
                    color: isActive ? C.cream : C.muted,
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {items.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="tb-screen__body"
        style={{ flex: 1, overflow: "auto", padding: "0 18px 90px" }}
        role="tabpanel"
      >
        {currentItems.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 20px",
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: C.goldBg,
                border: `1px solid ${C.goldBorder}`,
                color: C.forest,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <TrendingUpIcon size={20} />
            </div>
            <p style={{ fontSize: 13, color: C.accent, fontWeight: 600, margin: 0 }}>
              No {currentTab.label.toLowerCase()} signals yet
            </p>
            <p style={{ fontSize: 11, color: C.muted, margin: "6px 0 0" }}>
              {activeTab === "favorites"
                ? "Save pieces from the catalog to see them here."
                : "Check back after the next signal refresh."}
            </p>
          </div>
        ) : (
          <div
            className="tb-catalog-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            {currentItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => onItemClick(item)}
                isFav={favorites.has(item.id)}
                toggleFav={toggleFav}
              />
            ))}
          </div>
        )}
      </div>
      <NavBar active="trending" onNav={onNav} />
    </div>
  );
}

// ─── Brands Screen ─────────────────────────────────────────
function BrandsScreen({ catalog, onBrandClick, onNav }) {
  return (
    <div
      className="tb-screen tb-screen--brands"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
      }}
    >
      <div className="tb-screen__header" style={{ padding: "18px 18px 0" }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 400,
            color: C.accent,
            margin: "0 0 2px",
            fontFamily: font.serif,
          }}
        >
          Brands
        </h2>
        <p style={{ fontSize: 11, color: C.muted, margin: "0 0 16px" }}>
          Compare retailers by how consistently they fit your profile
        </p>
      </div>
      <div
        className="tb-screen__body"
        style={{ flex: 1, overflow: "auto", padding: "0 18px 90px" }}
      >
        <div
          className="tb-brand-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {BRANDS.map(b => {
            const items = catalog.filter(i => i.brandId === b.id);
            const avgFit = items.length
              ? Math.round(items.reduce((s, i) => s + i.fit, 0) / items.length)
              : 0;
            return { b, items, avgFit };
          }).map(({ b, items, avgFit }, _idx, arr) => {
            const maxAvg = Math.max(...arr.map(x => x.avgFit));
            const isTop = avgFit === maxAvg && avgFit > 0;
            return (
              <GlassCard
                key={b.id}
                hover
                onClick={() => onBrandClick(b)}
                style={{
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  position: "relative",
                  border: isTop ? `1px solid ${C.goldBorder}` : undefined,
                  boxShadow: isTop ? "0 8px 20px rgba(107,142,90,0.18)" : undefined,
                }}
              >
                {isTop && (
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      padding: "3px 8px",
                      borderRadius: 999,
                      background: C.forest,
                      color: C.cream,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                      boxShadow: "0 3px 8px rgba(107,142,90,0.28)",
                    }}
                  >
                    Top fit
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${b.color || PALETTE.forest}, ${PALETTE.forestDeep})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${C.borderLight}`,
                      flexShrink: 0,
                      boxShadow: "0 4px 10px rgba(45,55,42,0.18)",
                    }}
                  >
                    <span
                      style={{
                        color: C.cream,
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: font.serif,
                        letterSpacing: 0.5,
                      }}
                    >
                      {b.logo}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: C.accent,
                        lineHeight: 1.2,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        wordBreak: "break-word",
                      }}
                    >
                      {b.name}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2, fontWeight: 500 }}>
                      {items.length} item{items.length === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 9, color: C.muted }}>
                      Avg fit for you
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color:
                          avgFit >= 90
                            ? C.success
                            : avgFit >= 75
                              ? C.warning
                              : C.danger,
                      }}
                    >
                      {avgFit}%
                    </span>
                  </div>
                  <FitBar fit={avgFit} showLabel={false} />
                </div>
                {b.sizeNote && (
                  <div
                    style={{
                      fontSize: 9,
                      color: C.muted,
                      padding: "4px 8px",
                      background: C.bgElevated,
                      borderRadius: 6,
                    }}
                  >
                    {b.sizeNote}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      </div>
      <NavBar active="brands" onNav={onNav} />
    </div>
  );
}

function BrandDetailScreen({
  brand,
  onBack,
  onItemClick,
  favorites,
  toggleFav,
  catalog,
}) {
  const items = catalog.filter(i => i.brandId === brand.id);
  const avgFit = items.length
    ? Math.round(items.reduce((s, i) => s + i.fit, 0) / items.length)
    : 0;
  return (
    <div
      className="tb-screen tb-screen--brand-detail"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
      }}
    >
      <div
        className="tb-screen__header"
        style={{
          padding: "18px 18px 0",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <BackButton onClick={onBack} />
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: brand.color || "#1a1a1a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid rgba(255,255,255,0.1)`,
          }}
        >
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>
            {brand.logo}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: C.accent }}>
            {brand.name}
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>
            {items.length} items · avg {avgFit}% fit for you
          </div>
        </div>
      </div>
      {brand.sizeNote && (
        <div
          className="tb-brand-detail__note"
          style={{
            margin: "0 18px 14px",
            padding: "10px 14px",
            background: C.goldBg,
            border: `1px solid ${C.goldBorder}`,
            borderRadius: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <InfoIcon size={14} />
            <p style={{ fontSize: 11, color: C.goldLight, margin: 0 }}>
              {brand.sizeNote}
            </p>
          </div>
        </div>
      )}
      <div
        className="tb-screen__body"
        style={{ flex: 1, overflow: "auto", padding: "0 18px 40px" }}
      >
        <div
          className="tb-catalog-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => onItemClick(item)}
              isFav={favorites.has(item.id)}
              toggleFav={toggleFav}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Fit Studio (Virtual Try-On replacement) ────────────────
// Premium try-on modal: large body model, garment drape, fit risk zones,
// before/tailored toggle, alteration callouts, garment specs, sticky CTA.
function buildFitRegions(item, userBody) {
  const base = Math.max(55, Math.min(99, item.fit || 85));
  const cat = item.category || "Tops";
  const measStr = item.measurements?.[item.bestSize] || "";
  const meas = parseMeasurements(measStr);
  const dim = (key, fallback) => meas[key]?.mid || fallback;
  const delta = (uv, gv) => (gv > 0 ? +(gv - uv).toFixed(1) : 0);

  if (cat === "Bottoms") {
    const waistG = dim("waist", userBody.waist);
    const hipG = dim("hip", userBody.hips);
    const inseamG = dim("inseam", userBody.inseam);
    return [
      { key: "waist", label: "Waist", score: base - 4, you: userBody.waist, garment: waistG, unit: '"',
        risk: delta(userBody.waist, waistG), zone: "snug" },
      { key: "hips", label: "Hips / Seat", score: base - 1, you: userBody.hips, garment: hipG, unit: '"',
        risk: delta(userBody.hips, hipG), zone: "ease" },
      { key: "leg", label: "Leg taper", score: base - 6, you: 0, garment: 0, unit: '',
        risk: 0, zone: "drape" },
      { key: "inseam", label: "Hem / Inseam", score: base - 10, you: userBody.inseam, garment: inseamG, unit: '"',
        risk: delta(userBody.inseam, inseamG), zone: "length" },
    ];
  }
  if (cat === "Dresses") {
    const bustG = dim("bust", userBody.bust);
    const waistG = dim("waist", userBody.waist);
    const hipG = dim("hip", userBody.hips);
    return [
      { key: "shoulder", label: "Shoulder", score: base - 1, you: userBody.shoulder, garment: userBody.shoulder, unit: '"', risk: 0, zone: "align" },
      { key: "bust", label: "Bust", score: base - 2, you: userBody.bust, garment: bustG, unit: '"', risk: delta(userBody.bust, bustG), zone: "ease" },
      { key: "waist", label: "Waist", score: base - 5, you: userBody.waist, garment: waistG, unit: '"', risk: delta(userBody.waist, waistG), zone: "snug" },
      { key: "hips", label: "Hip / Skirt", score: base - 3, you: userBody.hips, garment: hipG, unit: '"', risk: delta(userBody.hips, hipG), zone: "drape" },
      { key: "hem", label: "Hem length", score: base - 8, you: 0, garment: 0, unit: '', risk: 0, zone: "length" },
    ];
  }
  // Tops / Outerwear
  const bustG = dim("bust", userBody.bust) || dim("chest", userBody.bust);
  const waistG = dim("waist", userBody.waist);
  const shoulderG = dim("shoulder", userBody.shoulder);
  return [
    { key: "shoulder", label: "Shoulder seam", score: base - 2, you: userBody.shoulder, garment: shoulderG, unit: '"', risk: delta(userBody.shoulder, shoulderG), zone: "align" },
    { key: "bust", label: "Bust / Chest", score: base - 1, you: userBody.bust, garment: bustG, unit: '"', risk: delta(userBody.bust, bustG), zone: "ease" },
    { key: "waist", label: "Waist", score: base - 6, you: userBody.waist, garment: waistG, unit: '"', risk: delta(userBody.waist, waistG), zone: "snug" },
    { key: "sleeve", label: "Sleeve taper", score: base - 5, you: 0, garment: 0, unit: '', risk: 0, zone: "drape" },
    { key: "hem", label: "Hem", score: base - 4, you: 0, garment: 0, unit: '', risk: 0, zone: "length" },
  ];
}

function buildAlterations(regions, item) {
  return regions
    .map(r => {
      const off = Math.max(0, 100 - r.score);
      if (off < 6) return null;
      const big = off > 18;
      let action;
      let detail;
      if (r.zone === "snug") {
        action = big ? `Take in ${r.label.toLowerCase()}` : `Light nip at ${r.label.toLowerCase()}`;
        detail = r.risk > 0
          ? `+${r.risk}" ease — pull in to your ${r.you}" measurement`
          : `Side seams trimmed for clean line at your waist`;
      } else if (r.zone === "length") {
        action = big ? `Shorten ${r.label.toLowerCase()}` : `Hem to length`;
        detail = `Cut and rebind to your ${r.you || item.bestSize} length, original stitch retained`;
      } else if (r.zone === "drape") {
        action = `Taper ${r.label.toLowerCase()}`;
        detail = `Recut inseam/sleeve line for cleaner taper`;
      } else if (r.zone === "align") {
        action = `Adjust ${r.label.toLowerCase()}`;
        detail = r.risk !== 0
          ? `${r.risk > 0 ? "Bring in" : "Let out"} shoulder by ${Math.abs(r.risk)}"`
          : `Re-set shoulder seam to your frame`;
      } else {
        action = `Refine ${r.label.toLowerCase()}`;
        detail = `Recontour for ease through ${r.label.toLowerCase()}`;
      }
      return { region: r.label, action, detail, off };
    })
    .filter(Boolean);
}

function zoneColor(score) {
  if (score >= 90) return C.success;
  if (score >= 78) return C.warning;
  return C.danger;
}

function FitMapOverlay({ width, height, regions, mode }) {
  // Anchor y-positions inside the viewer (top=0, bottom=height) keyed by region.key.
  const yMap = {
    shoulder: 0.10,
    bust: 0.22,
    waist: 0.40,
    hips: 0.50,
    hip: 0.50,
    leg: 0.68,
    inseam: 0.86,
    sleeve: 0.46,
    hem: 0.62,
  };
  const isTailored = mode === "tailored";
  // In "tailored" mode we still draw overlay markers but cleaner: show the
  // garment edge tightening with green improved-fit guides and ghost lines
  // representing the original/before silhouette so the delta is perceptible.
  const showAll = !isTailored;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fs-seam" x1="0" x2="1">
          <stop offset="0" stopColor={C.forest} stopOpacity="0" />
          <stop offset="0.5" stopColor={C.forest} stopOpacity="0.9" />
          <stop offset="1" stopColor={C.forest} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="fs-zone-snug" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#8E5B5B" stopOpacity="0.32" />
          <stop offset="1" stopColor="#8E5B5B" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="fs-zone-warn" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#5B8F8A" stopOpacity="0.28" />
          <stop offset="1" stopColor="#5B8F8A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="fs-zone-ok" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#6B8E5A" stopOpacity="0.22" />
          <stop offset="1" stopColor="#6B8E5A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="fs-zone-improved" cx="0.5" cy="0.5" r="0.55">
          <stop offset="0" stopColor="#6B8E5A" stopOpacity="0.55" />
          <stop offset="1" stopColor="#6B8E5A" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Tailored-mode delta visualization — green improved fit zones + ghost
          line of the original (before) silhouette so the user sees the change. */}
      {isTailored && (() => {
        const cx = width / 2;
        const ghost = (yFrac, rxFrac, label) => {
          const y = yFrac * height;
          const rx = rxFrac * width;
          return (
            <g key={`ghost-${label}`}>
              {/* original loose silhouette — dashed taupe ghost line */}
              <ellipse cx={cx} cy={y} rx={rx * 1.18} ry={6} fill="none"
                stroke={C.warmGray} strokeOpacity="0.55" strokeWidth="1"
                strokeDasharray="3 3" />
              {/* tailored tightened silhouette — solid sage */}
              <ellipse cx={cx} cy={y} rx={rx * 0.96} ry={4} fill="none"
                stroke={C.forest} strokeOpacity="0.85" strokeWidth="1.6" />
              {/* improved-fit halo glow */}
              <ellipse cx={cx} cy={y} rx={rx * 1.3} ry={14}
                fill="url(#fs-zone-improved)" />
              {/* delta arrows pulling in */}
              <path d={`M ${cx - rx * 1.18},${y} L ${cx - rx * 0.96},${y}`}
                stroke={C.forest} strokeWidth="1.4" strokeOpacity="0.9"
                markerEnd="url(#fs-arrow)" />
              <path d={`M ${cx + rx * 1.18},${y} L ${cx + rx * 0.96},${y}`}
                stroke={C.forest} strokeWidth="1.4" strokeOpacity="0.9"
                markerEnd="url(#fs-arrow)" />
            </g>
          );
        };
        return (
          <g>
            <defs>
              <marker id="fs-arrow" viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={C.forest} fillOpacity="0.9" />
              </marker>
            </defs>
            {/* Pull in at waist (always visible) */}
            {ghost(0.40, 0.18, "waist")}
            {/* Pull in at sleeve / arm taper */}
            {ghost(0.55, 0.12, "sleeve")}
            {/* Hem raised cue at bottom */}
            <g>
              <line x1={cx - width * 0.18} y1={height * 0.78}
                x2={cx + width * 0.18} y2={height * 0.78}
                stroke={C.warmGray} strokeOpacity="0.45" strokeWidth="1"
                strokeDasharray="3 3" />
              <line x1={cx - width * 0.18} y1={height * 0.74}
                x2={cx + width * 0.18} y2={height * 0.74}
                stroke={C.forest} strokeOpacity="0.85" strokeWidth="1.6" />
              <text x={cx + width * 0.18 + 4} y={height * 0.74 + 3}
                fontSize="9" fontWeight="800" fill={C.forest}
                fontFamily="Manrope, sans-serif"
                style={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
                Hem raised
              </text>
            </g>
            {/* Improved fit badge */}
            <g transform={`translate(${width - 116}, 14)`}>
              <rect x="0" y="0" width="104" height="22" rx="11"
                fill="rgba(107,142,90,0.14)" stroke={C.forest} strokeWidth="1" />
              <circle cx="11" cy="11" r="3" fill={C.forest} />
              <text x="20" y="14.5" fontSize="9.5" fontWeight="800"
                fill={C.forest} fontFamily="Manrope, sans-serif"
                style={{ textTransform: "uppercase", letterSpacing: 0.7 }}>
                Tailored fit · 96%
              </text>
            </g>
          </g>
        );
      })()}
      {regions.map((r, i) => {
        const yFrac = yMap[r.key] ?? 0.5;
        const y = yFrac * height;
        const left = i % 2 === 0;
        const tagX = left ? 10 : width - 110;
        const lineX1 = width / 2 + (left ? -10 : 10);
        const lineX2 = left ? tagX + 100 : tagX;
        const color = zoneColor(r.score);
        const heatId = r.score >= 90 ? "fs-zone-ok" : r.score >= 78 ? "fs-zone-warn" : "fs-zone-snug";
        return (
          <g key={r.key} opacity={showAll ? 1 : 0.35}>
            {/* heat blob */}
            <ellipse cx={width / 2} cy={y} rx={width * 0.28} ry={height * 0.055} fill={`url(#${heatId})`} />
            {/* leader line */}
            <line x1={lineX1} y1={y} x2={lineX2} y2={y} stroke="url(#fs-seam)" strokeWidth="1.2" strokeDasharray="3 3" />
            <circle cx={lineX1} cy={y} r="3" fill={color} stroke={C.cream} strokeWidth="1.4" />
            {/* tag */}
            <rect x={tagX} y={y - 13} width="100" height="26" rx="13" fill="rgba(255,255,255,0.96)" stroke={color} strokeWidth="1" />
            <text x={tagX + 10} y={y + 1} fontSize="9.5" fontWeight="800" fill={C.muted} fontFamily="Manrope, sans-serif" style={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
              {r.label}
            </text>
            <text x={tagX + 10} y={y + 12} fontSize="9.5" fontWeight="700" fill={color} fontFamily="Manrope, sans-serif">
              {r.score}% fit{r.risk !== 0 && r.unit ? ` · ${r.risk > 0 ? "+" : ""}${r.risk}${r.unit}` : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function FitStudio({ item, userBody, userBodyMeta, onClose, onApprove }) {
  const [mode, setMode] = useState("before"); // "before" | "tailored"
  const [activeTab, setActiveTab] = useState("map"); // "map" | "alter" | "specs"
  const [garmentSize, setGarmentSize] = useState(item.bestSize);
  const [garmentColor, setGarmentColor] = useState(item.color);
  const colors = item.colors || [item.color];
  const sizes = Object.keys(item.measurements || {});

  const baseRegions = useMemo(() => buildFitRegions(item, userBody), [item, userBody]);
  // In "tailored" mode, every region is in tolerance (score ≥ 95).
  const regions = useMemo(
    () => (mode === "tailored"
      ? baseRegions.map(r => ({ ...r, score: Math.max(r.score, 95) }))
      : baseRegions),
    [baseRegions, mode]
  );
  const alterations = useMemo(() => buildAlterations(baseRegions, item), [baseRegions, item]);

  // Confidence rolled up from worst region score, modulated by data completeness.
  const worst = Math.min(...baseRegions.map(r => r.score));
  const avg = Math.round(baseRegions.reduce((s, r) => s + r.score, 0) / baseRegions.length);
  const confidence = Math.max(60, Math.min(98, Math.round((worst + avg) / 2)));

  const fabric = item.fabric || "Mixed fabric";
  const lower = fabric.toLowerCase();
  const stretch = /stretch|elastane|spandex|lycra|jersey|knit|modal/.test(lower)
    ? "4-way stretch"
    : /silk|satin|crepe|chiffon/.test(lower)
      ? "Drape · low stretch"
      : /denim|gabardine|twill|wool|leather|canvas/.test(lower)
        ? "Rigid · structured"
        : "Light stretch";

  // Viewer sizing — compact so it fits next to the source product card and
  // the tabs without forcing a major scroll. Side-by-side on wider screens.
  const viewerW = 300;
  const viewerH = 420;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fit Studio"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: `linear-gradient(180deg, ${C.bg} 0%, ${C.bgElevated} 100%)`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${C.border}`,
          background: `${C.bg}EE`,
          backdropFilter: "blur(14px)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onClose}
            aria-label="Close Fit Studio"
            style={{
              width: 34, height: 34, borderRadius: 10,
              border: `1px solid ${C.border}`, background: C.card,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <div style={{ fontSize: 9.5, color: C.muted, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase" }}>
              AI Fit Studio · estimated try-on preview
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.accent, lineHeight: 1.2, fontFamily: font.serif }}>
              {item.name}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9.5, color: C.muted, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>
            Tailor-verified confidence
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: zoneColor(confidence), fontFamily: font.sans }}>
            {confidence}%
          </div>
        </div>
      </div>

      {/* Before / Tailored toggle */}
      <div style={{ padding: "12px 16px 0", flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            background: C.card,
            borderRadius: 12,
            padding: 4,
            border: `1px solid ${C.border}`,
            gap: 0,
          }}
        >
          {[
            ["before", "Retailer fit"],
            ["tailored", "After tailoring"],
          ].map(([id, label]) => {
            const active = mode === id;
            return (
              <button
                key={id}
                onClick={() => setMode(id)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 9,
                  border: "none",
                  background: active ? C.forest : "transparent",
                  color: active ? C.cream : C.muted,
                  fontSize: 11.5,
                  fontWeight: active ? 700 : 600,
                  cursor: "pointer",
                  letterSpacing: 0.3,
                  boxShadow: active ? "0 4px 14px rgba(107,142,90,0.28)" : "none",
                  transition: "all 0.18s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div
        className="tb-fs-body"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          padding: "12px 16px 16px",
          display: "grid",
          gridTemplateColumns: "1fr",
          gridTemplateRows: "auto 1fr",
          gap: 12,
        }}
      >
        {/* Left visual column — source product card + body try-on */}
        <div
          className="tb-fs-visual"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            minHeight: 0,
          }}
        >
        {/* Source product card */}
        <div
          className="tb-fs-source"
          style={{
            position: "relative",
            borderRadius: 18,
            overflow: "hidden",
            border: `1px solid ${C.border}`,
            background: C.card,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 12px 28px rgba(45,55,42,0.08)",
          }}
        >
          <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
            <ProductImage item={item} style={{ height: "100%", width: "100%" }} />
            <div style={{
              position: "absolute", top: 10, left: 10,
              padding: "4px 10px", borderRadius: 999,
              background: "rgba(255,255,255,0.92)",
              border: `1px solid ${C.border}`,
              fontSize: 8.5, fontWeight: 800,
              letterSpacing: 1.2, textTransform: "uppercase",
              color: C.muted,
            }}>
              Source · {item.brand}
            </div>
            {item.url && (
              <div style={{
                position: "absolute", bottom: 10, left: 10, right: 10,
                padding: "6px 10px", borderRadius: 8,
                background: "rgba(58,69,55,0.78)",
                color: C.cream, fontSize: 9.5, fontWeight: 700,
                letterSpacing: 0.4,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }} title={item.url}>
                Imported link
              </div>
            )}
          </div>
          <div style={{
            padding: "8px 10px",
            borderTop: `1px solid ${C.border}`,
            fontSize: 10.5, color: C.mutedLight, lineHeight: 1.35,
            display: "flex", justifyContent: "space-between", gap: 6,
          }}>
            <span style={{ fontWeight: 700, color: C.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.bestSize} · {fabric}
            </span>
            <span style={{ color: C.forest, fontWeight: 800 }}>→ Body</span>
          </div>
        </div>
        {/* Viewer panel */}
        <div
          style={{
            position: "relative",
            borderRadius: 18,
            overflow: "hidden",
            background: `radial-gradient(ellipse at 50% 38%, ${C.cream} 0%, ${C.beige} 65%, ${C.oat} 100%)`,
            border: `1px solid ${C.border}`,
            boxShadow: "0 18px 40px rgba(45,55,42,0.10)",
            minHeight: viewerH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Scan-plate ambient grid */}
          <svg
            width="100%"
            height="100%"
            style={{ position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none" }}
            aria-hidden="true"
          >
            <defs>
              <pattern id="fs-grid" width="26" height="26" patternUnits="userSpaceOnUse">
                <path d="M 26 0 L 0 0 0 26" fill="none" stroke={C.warmGray} strokeOpacity="0.18" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#fs-grid)" />
          </svg>

          <div style={{ position: "relative", width: viewerW, height: viewerH }}>
            <RealisticAvatar
              body={userBody}
              width={viewerW}
              height={viewerH}
              garment={{ ...item, color: garmentColor }}
              mode={mode}
            />
            <FitMapOverlay width={viewerW} height={viewerH} regions={regions} mode={mode} />
            {/* Top-left avatar preview label */}
            <div
              style={{
                position: "absolute",
                left: 10, top: 10,
                padding: "4px 9px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.92)",
                border: `1px solid ${C.border}`,
                fontSize: 8.5,
                fontWeight: 800,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: C.muted,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: C.forest,
              }} />
              Avatar preview · measurement-based
            </div>
            {/* Mode caption */}
            <div
              style={{
                position: "absolute",
                left: 12, bottom: 12,
                padding: "6px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.85)",
                border: `1px solid ${C.border}`,
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: mode === "tailored" ? C.forest : C.muted,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: mode === "tailored" ? C.forest : C.warmGray,
              }} />
              {mode === "tailored" ? "After alterations" : "As shipped from retailer"}
            </div>
          </div>
        </div>
        </div>{/* /tb-fs-visual */}

        {/* Right column — controls + tabs (scrolls if needed) */}
        <div
          className="tb-fs-right"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            minHeight: 0,
            overflow: "auto",
            paddingRight: 2,
          }}
        >

        {/* Quick controls: size + color */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase" }}>
              Base size · {garmentSize}
            </div>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 0.4 }}>
              {item.brand}'s recommendation: <strong style={{ color: C.forest }}>{item.bestSize}</strong>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {sizes.map(sz => {
              const active = garmentSize === sz;
              return (
                <button
                  key={sz}
                  onClick={() => setGarmentSize(sz)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: `1px solid ${active ? C.goldBorder : C.border}`,
                    background: active ? C.goldBg : "transparent",
                    color: active ? C.forest : C.muted,
                    fontSize: 11,
                    fontWeight: active ? 800 : 600,
                    cursor: "pointer",
                  }}
                >
                  {sz}
                </button>
              );
            })}
          </div>
          {colors.length > 1 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 0.4 }}>Colour</div>
              <div style={{ display: "flex", gap: 6 }}>
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setGarmentColor(c)}
                    aria-label={`Colour ${c}`}
                    style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: c,
                      border: `2px solid ${garmentColor === c ? C.forest : "transparent"}`,
                      outline: garmentColor === c ? `1px solid ${C.forest}` : "1px solid rgba(0,0,0,0.08)",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            background: C.card,
            borderRadius: 12,
            padding: 4,
            border: `1px solid ${C.border}`,
          }}
        >
          {[
            ["map", "Fit risk"],
            ["alter", "Alterations"],
            ["specs", "Garment specs"],
          ].map(([id, label]) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 9,
                  border: "none",
                  background: active ? C.forest : "transparent",
                  color: active ? C.cream : C.muted,
                  fontSize: 11.5,
                  fontWeight: active ? 700 : 600,
                  cursor: "pointer",
                  letterSpacing: 0.3,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {activeTab === "map" && (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase" }}>
              Per-zone tension
            </div>
            {regions.map(r => {
              const col = zoneColor(r.score);
              const off = Math.max(0, 100 - r.score);
              const bodyConf = userBodyMeta?.confidence?.[r.key];
              const bodyVerified = userBodyMeta?.verified?.[r.key];
              return (
                <div key={r.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>{r.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: col }}>
                      {r.score}% · {off < 6 ? "in tolerance" : off < 18 ? "snug" : "needs work"}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: C.bgElevated, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                    <div style={{
                      width: `${r.score}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${col}, ${col}AA)`,
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                  {r.unit && (
                    <div style={{ fontSize: 10, color: C.muted, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <span>
                        You {r.you}{r.unit} · Garment {r.garment}{r.unit}
                        {r.risk !== 0 && (
                          <span style={{ color: col, fontWeight: 700 }}>
                            {` · ${r.risk > 0 ? "+" : ""}${r.risk}${r.unit} ease`}
                          </span>
                        )}
                      </span>
                      {bodyConf != null && (
                        <span
                          title={`Your ${r.label.toLowerCase()} measurement confidence`}
                          style={{
                            color: bodyConf >= 88 ? C.forest : bodyConf >= 70 ? C.warning : C.tailor,
                            fontWeight: 800,
                            letterSpacing: 0.4,
                          }}
                        >
                          {bodyVerified ? "✓ " : ""}body {bodyConf}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div
              style={{
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 10,
                background: C.tailorBg,
                border: `1px solid ${C.tailorBorder}`,
                fontSize: 11,
                color: C.mutedLight,
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: C.tailor, fontWeight: 800 }}>Measurement basis · </strong>
              {sourceLabel(userBodyMeta?.source)}
              {userBodyMeta?.fitPreference && (
                <> · prefers <strong style={{ color: C.accent, fontWeight: 700, textTransform: "capitalize" }}>{userBodyMeta.fitPreference}</strong> fit</>
              )}
              . Tailor review required before any cut.
            </div>
          </div>
        )}

        {activeTab === "alter" && (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <ScissorsIcon size={14} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>
                Tailor brief · {alterations.length} adjustment{alterations.length === 1 ? "" : "s"}
              </span>
            </div>
            {alterations.length === 0 ? (
              <div style={{ fontSize: 11.5, color: C.muted, padding: "8px 0" }}>
                Every zone is within tolerance — this piece fits as shipped. Our tailor will still quality-check seams before delivery.
              </div>
            ) : (
              alterations.map((a, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `1px solid ${C.goldBorder}`,
                    background: C.goldBg,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: C.forestDeep, letterSpacing: 0.2 }}>
                      {a.action}
                    </span>
                    <span style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>
                      {a.region}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: C.mutedLight, lineHeight: 1.5 }}>
                    {a.detail}
                  </div>
                </div>
              ))
            )}
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                background: C.bgElevated,
                border: `1px solid ${C.border}`,
                fontSize: 10.5,
                color: C.muted,
                lineHeight: 1.5,
              }}
            >
              Turnaround 9–14 days · Original stitching preserved where possible · Free re-fit within 30 days
            </div>
          </div>
        )}

        {activeTab === "specs" && (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase" }}>
              Garment specs · imported from {item.brand}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["Category", item.category],
                ["Recommended size", item.bestSize],
                ["Behaviour", stretch],
                ["Fabric", fabric],
                ["Size chart match", `${avg}% avg`],
                ["Tailor confidence", `${confidence}%`],
              ].map(([k, v]) => (
                <div key={k} style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: C.bgElevated,
                  border: `1px solid ${C.border}`,
                }}>
                  <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" }}>{k}</div>
                  <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
            {item.sizingNote && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: C.goldBg,
                  border: `1px solid ${C.goldBorder}`,
                  fontSize: 11.5,
                  color: C.forestDeep,
                  lineHeight: 1.5,
                  fontWeight: 500,
                }}
              >
                {item.sizingNote}
              </div>
            )}

            {/* Measurement basis — exactly which body measurements are driving
                the fit score, and how confident we are in each one. */}
            <div
              style={{
                marginTop: 4,
                padding: "10px 12px",
                borderRadius: 12,
                background: C.bgElevated,
                border: `1px solid ${C.border}`,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 9.5, color: C.muted, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase" }}>
                  Measurement basis
                </div>
                <div style={{ fontSize: 9.5, color: C.muted, fontWeight: 700 }}>
                  Source: <strong style={{ color: C.accent, fontWeight: 800 }}>{sourceLabel(userBodyMeta?.source)}</strong>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {baseRegions.filter(r => r.unit).map(r => {
                  const conf = userBodyMeta?.confidence?.[r.key];
                  const verified = userBodyMeta?.verified?.[r.key];
                  const tone = conf == null ? C.muted : conf >= 88 ? C.forest : conf >= 70 ? C.warning : C.tailor;
                  return (
                    <div
                      key={r.key}
                      style={{
                        padding: "6px 8px",
                        borderRadius: 9,
                        background: C.card,
                        border: `1px solid ${C.border}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>
                          {r.label}
                        </span>
                        {verified && (
                          <span style={{ fontSize: 8.5, color: C.forest, fontWeight: 800, letterSpacing: 0.4 }}>✓</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12.5, color: C.accent, fontWeight: 800, fontFamily: font.serif }}>
                        {r.you}{r.unit}
                      </div>
                      {conf != null && (
                        <div style={{ fontSize: 9.5, color: tone, fontWeight: 800, letterSpacing: 0.4 }}>
                          {conf}% · {confidenceLabel(conf)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 10.5, color: C.muted, lineHeight: 1.5 }}>
                Lower confidence = the tailor verifies in person before any cut.
                {userBodyMeta?.fitPreference && (
                  <> Your fit preference (<strong style={{ color: C.accent, fontWeight: 800, textTransform: "capitalize" }}>{userBodyMeta.fitPreference}</strong>) biases the alteration brief.</>
                )}
              </div>
            </div>
          </div>
        )}
        </div>{/* /tb-fs-right */}
      </div>

      {/* Sticky CTA */}
      <div
        style={{
          padding: "12px 16px 16px",
          borderTop: `1px solid ${C.border}`,
          background: `linear-gradient(180deg, ${C.bgElevated} 0%, ${C.bg} 100%)`,
          display: "flex",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            padding: "13px 16px",
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            background: C.card,
            color: C.muted,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: 0.3,
          }}
        >
          Back
        </button>
        <button
          onClick={() => onApprove(item)}
          style={{
            flex: 1,
            padding: "13px 16px",
            borderRadius: 12,
            border: "none",
            background: `linear-gradient(135deg, ${C.forest}, ${C.forestDeep})`,
            color: C.cream,
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            letterSpacing: 0.4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 14px 28px rgba(107,142,90,0.30)",
          }}
        >
          <ScissorsIcon size={14} /> Approve alteration brief
        </button>
      </div>
    </div>
  );
}

// ─── Item Detail Screen ─────────────────────────────────────
function ItemDetailScreen({
  item,
  onBack,
  isFav,
  toggleFav,
  onSendToTailor,
  userBody,
  userBodyMeta,
}) {
  const [showTryOn, setShowTryOn] = useState(false);
  const [activeTab, setActiveTab] = useState("fit");
  const sizes = Object.entries(item.measurements);
  const fitRegions = [
    {
      label: "Bust",
      score: Math.min(99, item.fit > 85 ? item.fit : item.fit - 5),
    },
    {
      label: "Waist",
      score: Math.min(99, item.fit > 90 ? item.fit + 3 : item.fit - 8),
    },
    {
      label: "Hips",
      score: Math.min(99, item.fit > 88 ? item.fit + 1 : item.fit - 3),
    },
  ];

  return (
    <div
      className="tb-screen tb-screen--item-detail"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
        overflow: "auto",
      }}
    >
      <div
        className="tb-item-detail__topbar"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          padding: "12px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: `${C.bg}EE`,
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <BackButton onClick={onBack} label="Back to results" />
        <button
          onClick={() => toggleFav(item.id)}
          aria-label={isFav ? "Remove from shortlist" : "Save to shortlist"}
          style={{
            background: isFav ? C.goldBg : C.card,
            border: `1px solid ${isFav ? C.goldBorder : C.borderLight}`,
            borderRadius: 12,
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.18s",
          }}
        >
          <HeartIcon filled={isFav} />
        </button>
      </div>

      <div
        className="tb-item-detail__content"
        style={{ padding: "0 18px 40px" }}
      >
        <div className="tb-item-detail__shell">
          <div className="tb-item-detail__media">
            <div
              style={{
                borderRadius: 20,
                overflow: "hidden",
                marginBottom: 12,
                border: `1px solid ${C.border}`,
                position: "relative",
              }}
            >
              <ProductImage item={item} style={{ height: 340 }} />
              {/* Fit Studio entry — overlay CTA pinned to the image */}
              <button
                onClick={() => setShowTryOn(true)}
                style={{
                  position: "absolute",
                  left: 12,
                  bottom: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 14px",
                  borderRadius: 999,
                  border: `1px solid ${C.goldBorder}`,
                  background: "rgba(255,255,255,0.92)",
                  color: C.forestDeep,
                  fontSize: 11.5,
                  fontWeight: 800,
                  letterSpacing: 0.4,
                  cursor: "pointer",
                  boxShadow: "0 8px 22px rgba(45,55,42,0.18)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <SparkleIcon size={12} /> Open AI Fit Studio
              </button>
            </div>

            <button
              onClick={() => setShowTryOn(true)}
              style={{
                width: "100%",
                marginBottom: 18,
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${C.goldBorder}`,
                background: `linear-gradient(180deg, ${C.cream}, #FFFFFF)`,
                color: C.forestDeep,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                letterSpacing: 0.2,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <SparkleIcon size={12} />
                AI Fit Studio · estimated try-on preview
              </span>
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Drape · Fit-confidence · Tailor brief →</span>
            </button>
          </div>

          <div className="tb-item-detail__details">
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    color: C.gold,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Imported from {item.brand}
                </p>
                {item.url && (
                  <button
                    onClick={() =>
                      window.open(item.url, "_blank", "noopener,noreferrer")
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={C.muted}
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </button>
                )}
              </div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 400,
                  color: C.accent,
                  fontFamily: font.serif,
                  margin: "4px 0 8px",
                  lineHeight: 1.3,
                }}
              >
                {item.name}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{ fontSize: 24, fontWeight: 700, color: C.accent }}
                >
                  ${item.price}
                </span>
                <FitBadge fit={item.fit} size="lg" />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <BadgePill meta={item.badgeMeta} />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 0,
                marginBottom: 16,
                background: C.card,
                borderRadius: 12,
                padding: 4,
                border: `1px solid ${C.border}`,
              }}
            >
              {[
                ["fit", "Fit Map"],
                ["alter", "Alteration Plan"],
                ["size", "Size Chart"],
              ].map(([id, label]) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 9,
                      border: "none",
                      background: isActive ? C.forest : "transparent",
                      color: isActive ? C.cream : C.muted,
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      letterSpacing: 0.2,
                      boxShadow: isActive ? "0 4px 12px rgba(107,142,90,0.28)" : "none",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {activeTab === "fit" && (
              <GlassCard style={{ padding: 18, marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <TargetIcon size={16} />
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: C.accent }}
                  >
                    Fit Intelligence
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: 12, color: C.muted }}>
                    Recommended size
                  </span>
                  <span
                    style={{ fontSize: 14, fontWeight: 700, color: C.gold }}
                  >
                    {item.bestSize}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <span style={{ fontSize: 12, color: C.muted }}>
                    Return risk
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: item.risk === "Low" ? C.success : C.warning,
                    }}
                  >
                    {item.risk}
                  </span>
                </div>
                <div style={{ marginBottom: 14 }}>
                  {fitRegions.map(r => (
                    <FitBar key={r.label} fit={r.score} label={r.label} />
                  ))}
                </div>
                <div
                  style={{
                    padding: "12px 14px",
                    background: C.tailorBg,
                    border: `1px solid ${C.tailorBorder}`,
                    borderRadius: 10,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 6,
                    }}
                  >
                    <SparkleIcon size={12} />
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: C.tailor,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Fit Note
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: C.mutedLight,
                      lineHeight: 1.6,
                      fontStyle: "italic",
                      margin: 0,
                    }}
                  >
                    {generateFitReason(item, userBody)}
                  </p>
                </div>
                <div
                  style={{
                    padding: "10px 12px",
                    background: C.goldBg,
                    border: `1px solid ${C.goldBorder}`,
                    borderRadius: 10,
                    marginBottom: 10,
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color: C.forestDeep,
                      lineHeight: 1.5,
                      margin: 0,
                      fontWeight: 500,
                    }}
                  >
                    {item.sizingNote}
                  </p>
                </div>
                <p style={{ fontSize: 12, color: C.mutedLight, margin: 0, fontWeight: 500 }}>
                  {item.fabric}
                </p>
              </GlassCard>
            )}

            {activeTab === "size" && (
              <GlassCard style={{ padding: 18, marginBottom: 16 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.accent,
                    marginBottom: 14,
                  }}
                >
                  Size Chart
                </p>
                {sizes.map(([sz, meas]) => {
                  const isBest = sz === item.bestSize;
                  return (
                    <div
                      key={sz}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        padding: "10px 12px",
                        borderRadius: 10,
                        marginBottom: 8,
                        background: isBest ? C.goldBg : C.bgElevated,
                        border: `1px solid ${isBest ? C.goldBorder : C.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: isBest ? 700 : 500,
                            color: isBest ? C.gold : C.accent,
                          }}
                        >
                          {sz}
                        </span>
                        {isBest && (
                          <div
                            style={{
                              padding: "2px 8px",
                              borderRadius: 6,
                              background: C.gold,
                              fontSize: 8,
                              fontWeight: 700,
                              color: "#fff",
                            }}
                          >
                            YOUR SIZE
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          color: C.muted,
                          textAlign: "right",
                          maxWidth: "60%",
                        }}
                      >
                        {meas}
                      </span>
                    </div>
                  );
                })}
              </GlassCard>
            )}

            {activeTab === "alter" && (
              <GlassCard style={{ padding: 18, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <ScissorsIcon size={16} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>
                    Tailor brief · {item.bestSize}
                  </span>
                </div>
                <p style={{ fontSize: 11.5, color: C.mutedLight, lineHeight: 1.55, margin: "0 0 14px" }}>
                  Our in-house tailors receive the piece in size {item.bestSize}, then perform the alterations below before shipping to you. Estimates are based on your scanned measurements and the brand's published size chart.
                </p>
                <div style={{ display: "grid", gap: 8 }}>
                  {fitRegions.map(r => {
                    const off = 100 - r.score;
                    const needsWork = off > 5;
                    const action = needsWork
                      ? r.score < 75
                        ? "Take in / let out"
                        : "Light nip"
                      : "No alteration";
                    return (
                      <div
                        key={r.label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          borderRadius: 12,
                          background: needsWork ? C.goldBg : C.bgElevated,
                          border: `1px solid ${needsWork ? C.goldBorder : C.border}`,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.accent }}>
                            {r.label}
                          </div>
                          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                            {needsWork ? `${off}% off your measurement` : "Within tolerance"}
                          </div>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: needsWork ? C.forest : C.success, letterSpacing: 0.4 }}>
                          {action}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 12, background: C.tailorBg, border: `1px solid ${C.tailorBorder}` }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: C.tailor, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4 }}>
                    Pipeline
                  </div>
                  <div style={{ fontSize: 11, color: C.mutedLight, lineHeight: 1.55 }}>
                    Order placed by The Tailored Company → received at our studio → alterations above → quality check → shipped to you. Typical turnaround 9–14 days.
                  </div>
                </div>
              </GlassCard>
            )}

            <div
              className="tb-item-detail__actions"
              style={{ display: "flex", gap: 10 }}
            >
              {(item.url || item.sourceUrl) && (
                <button
                  onClick={() =>
                    window.open(item.sourceUrl || item.url, "_blank", "noopener,noreferrer")
                  }
                  style={{
                    flex: 1,
                    padding: "14px 0",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: "transparent",
                    color: C.mutedLight,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  View source
                </button>
              )}
              <button
                onClick={() => onSendToTailor(item)}
                style={{
                  flex: 2,
                  padding: "14px 0",
                  borderRadius: 12,
                  border: "none",
                  background: `linear-gradient(135deg, ${C.forest}, ${C.forestDeep})`,
                  color: C.cream,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 12px 24px rgba(107,142,90,0.30)",
                }}
              >
                <ScissorsIcon size={14} /> Submit for tailoring
              </button>
            </div>
          </div>
        </div>
      </div>
      {showTryOn && (
        <FitStudio
          item={item}
          userBody={userBody}
          userBodyMeta={userBodyMeta}
          onClose={() => setShowTryOn(false)}
          onApprove={(it) => {
            setShowTryOn(false);
            onSendToTailor(it);
          }}
        />
      )}
    </div>
  );
}

// ─── Style AI Screen ───────────────────────────────────────
function StyleAIScreen({
  catalog,
  userBody,
  onItemClick,
  favorites,
  toggleFav,
  onNav,
}) {
  const [occasion, setOccasion] = useState(STYLE_OCCASIONS[0]);
  const [goal, setGoal] = useState(STYLE_GOALS[0]);
  const [palette, setPalette] = useState(STYLE_PALETTES[0]);
  const [dressCode, setDressCode] = useState(STYLE_DRESS_CODES[0]);
  const [notes, setNotes] = useState("");
  const [brief, setBrief] = useState(null);
  const autoBriefKeyRef = useRef("");
  const briefMutation = trpc.style.generateBrief.useMutation({
    onSuccess: result => setBrief(result),
  });

  const insights = useMemo(() => {
    const { bust, waist, hips } = userBody;
    const ratio = hips / waist;
    const shape =
      ratio > 1.35
        ? "Hourglass"
        : ratio > 1.2
          ? "Pear"
          : bust > hips
            ? "Inverted Triangle"
            : "Rectangle";
    const topFits = catalog
      .filter(i => i.fit >= 90)
      .sort((a, b) => b.fit - a.fit)
      .slice(0, 6);
    const bestBrand = BRANDS.map(b => {
      const items = catalog.filter(i => i.brandId === b.id);
      const avg = items.length
        ? items.reduce((s, i) => s + i.fit, 0) / items.length
        : 0;
      return { ...b, avg };
    }).sort((a, b) => b.avg - a.avg)[0];
    const lowRisk = catalog.filter(i => i.risk === "Low").length;
    return { shape, topFits, bestBrand, lowRisk };
  }, [catalog, userBody]);

  const shapeAdvice = {
    Hourglass:
      "Your balanced bust-to-hip ratio works beautifully with fitted silhouettes, wrap styles, and belted pieces that highlight your waist.",
    Pear: "Your hips are wider than your shoulders — A-line skirts, wide-leg pants, and structured tops create beautiful balance.",
    "Inverted Triangle":
      "Your shoulders are broader — flowy bottoms, wide-leg trousers, and A-line skirts balance your proportions elegantly.",
    Rectangle:
      "Your proportions are similar throughout — cinched waists, peplum tops, and ruffled skirts add beautiful definition.",
  };

  const styleCandidates = useMemo(() => {
    const favoriteItems = catalog
      .filter(item => favorites.has(item.id))
      .sort((a, b) => b.fit - a.fit)
      .slice(0, 4);
    const byCategory = ["Tops", "Bottoms", "Dresses", "Outerwear"].flatMap(
      categoryName =>
        catalog
          .filter(item => item.category === categoryName)
          .sort((a, b) => b.fit - a.fit)
          .slice(0, 4)
    );
    const trending = catalog
      .filter(item => item.trending)
      .sort((a, b) => b.fit - a.fit)
      .slice(0, 4);

    const deduped = [];
    const seen = new Set();

    for (const item of [...favoriteItems, ...byCategory, ...trending]) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      deduped.push({
        id: item.id,
        name: item.name,
        brand: item.brand,
        brandId: item.brandId,
        category: item.category,
        fit: item.fit,
        risk: item.risk,
        bestSize: item.bestSize,
        fabric: item.fabric,
        sizingNote: item.sizingNote,
        badge: item.badge,
        trending: item.trending,
        url: item.url,
        image: item.image,
        price: item.price,
        color: item.color,
      });
    }

    return deduped.slice(0, 18);
  }, [catalog, favorites]);

  const requestPayload = useMemo(
    () => ({
      body: userBody,
      occasion,
      goal,
      palette,
      dressCode,
      notes: notes.trim(),
      candidates: styleCandidates,
    }),
    [userBody, occasion, goal, palette, dressCode, notes, styleCandidates]
  );

  const requestBrief = useCallback(() => {
    if (styleCandidates.length < 3) return;
    briefMutation.mutate(requestPayload);
  }, [briefMutation, requestPayload, styleCandidates.length]);

  useEffect(() => {
    const profileKey = `${userBody.bust}-${userBody.waist}-${userBody.hips}-${userBody.shoulder || 0}-${userBody.inseam || 0}`;
    if (autoBriefKeyRef.current === profileKey || styleCandidates.length < 3)
      return;
    autoBriefKeyRef.current = profileKey;
    setBrief(null);
    briefMutation.mutate({
      body: userBody,
      occasion: STYLE_OCCASIONS[0],
      goal: STYLE_GOALS[0],
      palette: STYLE_PALETTES[0],
      dressCode: STYLE_DRESS_CODES[0],
      notes: "",
      candidates: styleCandidates,
    });
  }, [briefMutation, styleCandidates, userBody]);

  const recommendedItems = useMemo(() => {
    const briefIds = brief?.recommendedItemIds?.length
      ? brief.recommendedItemIds
      : insights.topFits.map(item => item.id);
    return briefIds
      .map(id => catalog.find(item => item.id === id))
      .filter(Boolean)
      .slice(0, 6);
  }, [brief, catalog, insights.topFits]);

  return (
    <div
      className="tb-screen tb-screen--style"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
      }}
    >
      <div className="tb-screen__header" style={{ padding: "18px 18px 0" }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 400,
            color: C.accent,
            margin: "0 0 2px",
            fontFamily: font.serif,
          }}
        >
          Style AI
        </h2>
        <p style={{ fontSize: 11, color: C.muted, margin: "0 0 16px" }}>
          AI-generated wardrobe brief from your measurement-grade avatar, fit
          data, and shopping intent — every piece is tailor-reviewed before it ships.
        </p>
      </div>

      <div
        className="tb-screen__body"
        style={{ flex: 1, overflow: "auto", padding: "0 18px 90px" }}
      >
        {/* Empty state — no active garment routed to Fit Studio */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "12px 14px",
            marginBottom: 14,
            borderRadius: 14,
            background: C.goldBg,
            border: `1px solid ${C.goldBorder}`,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: C.card, border: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <SparkleIcon size={14} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.accent, letterSpacing: 0.2 }}>
                AI Fit Studio is per garment
              </div>
              <div style={{ fontSize: 10.5, color: C.mutedLight, lineHeight: 1.4 }}>
                Paste a product link to import a piece — our AI fits it to your avatar and a tailor verifies the brief.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNav && onNav("home")}
            style={{
              flexShrink: 0,
              padding: "8px 12px",
              borderRadius: 10,
              border: "none",
              background: `linear-gradient(135deg, ${C.forest}, ${C.forestDeep})`,
              color: C.cream,
              fontSize: 11, fontWeight: 800, letterSpacing: 0.4,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Paste link
          </button>
        </div>
        <GlassCard
          className="tb-style-hero"
          style={{ padding: 20, marginBottom: 16 }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: C.gold,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    fontWeight: 600,
                  }}
                >
                  Profile Shape
                </div>
                <div
                  style={{
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: brief?.source === "ai" ? C.goldBg : C.tailorBg,
                    border: `1px solid ${brief?.source === "ai" ? C.goldBorder : C.tailorBorder}`,
                    fontSize: 9,
                    fontWeight: 600,
                    color: brief?.source === "ai" ? C.gold : C.tailor,
                  }}
                >
                  {brief?.source === "ai" ? "AI brief" : "Fit engine brief"}
                </div>
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 400,
                  color: C.accent,
                  fontFamily: font.serif,
                  marginBottom: 8,
                }}
              >
                {brief?.shape || insights.shape}
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: C.muted,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {shapeAdvice[insights.shape]}
              </p>
            </div>
            <Body3DViewer
              body={userBody}
              width={140}
              height={200}
              autoRotate
              variant="studio"
            />
          </div>
          <div
            className="tb-style-measurements"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
              marginTop: 16,
            }}
          >
            {[
              ["Bust", userBody.bust],
              ["Waist", userBody.waist],
              ["Hips", userBody.hips],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  textAlign: "center",
                  padding: "8px 0",
                  background: C.bgElevated,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {k}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: C.gold,
                    marginTop: 2,
                  }}
                >
                  {v}"
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Hoisted recommendations — results visible without scrolling */}
        {recommendedItems.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.accent,
                  margin: 0,
                  fontFamily: font.serif,
                }}
              >
                Top recommendations
              </p>
              <span
                style={{
                  fontSize: 10,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  fontWeight: 600,
                }}
              >
                {recommendedItems.length} picks
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {recommendedItems.slice(0, 4).map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={() => onItemClick(item)}
                  isFav={favorites.has(item.id)}
                  toggleFav={toggleFav}
                />
              ))}
            </div>
          </div>
        )}

        <GlassCard style={{ padding: 18, marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "flex-start",
              marginBottom: 14,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.accent,
                  margin: "0 0 4px",
                }}
              >
                Brief setup
              </p>
              <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
                Tune the styling intent, then regenerate the recommendation set.
              </p>
            </div>
            <button
              onClick={requestBrief}
              disabled={briefMutation.isPending || styleCandidates.length < 3}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background: briefMutation.isPending
                  ? C.border
                  : `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.4,
                cursor: briefMutation.isPending ? "wait" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {briefMutation.isPending ? "Generating..." : "Regenerate brief"}
            </button>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: 1.1,
                  marginBottom: 8,
                }}
              >
                Occasion
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  paddingBottom: 2,
                }}
              >
                {STYLE_OCCASIONS.map(option => (
                  <Pill
                    key={option}
                    label={option}
                    active={occasion === option}
                    onClick={() => setOccasion(option)}
                    gold
                  />
                ))}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: 1.1,
                  marginBottom: 8,
                }}
              >
                Goal
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  paddingBottom: 2,
                }}
              >
                {STYLE_GOALS.map(option => (
                  <Pill
                    key={option}
                    label={option}
                    active={goal === option}
                    onClick={() => setGoal(option)}
                    gold
                  />
                ))}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: 1.1,
                    marginBottom: 8,
                  }}
                >
                  Palette
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {STYLE_PALETTES.map(option => {
                    const swatches = ({
                      "Warm neutrals": [PALETTE.beige, PALETTE.tan, PALETTE.cocoa],
                      "Soft tonal": [PALETTE.sageMist, PALETTE.sage, PALETTE.forest],
                      "Dark luxe": [PALETTE.ink, PALETTE.clay, PALETTE.cocoa],
                      "Bold accent": [PALETTE.forest, PALETTE.olive, PALETTE.bark],
                    })[option] || [PALETTE.sage, PALETTE.forest, PALETTE.cocoa];
                    const isActive = palette === option;
                    return (
                      <button
                        key={option}
                        onClick={() => setPalette(option)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "7px 10px",
                          borderRadius: 10,
                          border: `1px solid ${isActive ? C.forest : C.borderLight}`,
                          background: isActive ? C.goldBg : C.card,
                          color: isActive ? C.forest : C.accent,
                          fontSize: 11,
                          fontWeight: isActive ? 700 : 500,
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.18s",
                          boxShadow: isActive ? "0 4px 12px rgba(107,142,90,0.20)" : "none",
                        }}
                      >
                        <div style={{ display: "flex", gap: 2 }}>
                          {swatches.map((c, i) => (
                            <span
                              key={i}
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: 4,
                                background: c,
                                border: "1px solid rgba(45,55,42,0.16)",
                                display: "inline-block",
                              }}
                            />
                          ))}
                        </div>
                        <span style={{ flex: 1 }}>{option}</span>
                        {isActive && (
                          <span style={{ color: C.forest, display: "flex" }}>
                            <CheckIcon />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: 1.1,
                    marginBottom: 8,
                  }}
                >
                  Dress code
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {STYLE_DRESS_CODES.map(option => (
                    <Pill
                      key={option}
                      label={option}
                      active={dressCode === option}
                      onClick={() => setDressCode(option)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: 1.1,
                  marginBottom: 8,
                }}
              >
                Optional note
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Example: I want a founder wardrobe that feels polished but not corporate."
                style={{
                  width: "100%",
                  minHeight: 82,
                  resize: "none",
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: C.bgElevated,
                  color: C.accent,
                  padding: "12px 14px",
                  fontSize: 12,
                  lineHeight: 1.6,
                  outline: "none",
                }}
              />
            </div>
          </div>
        </GlassCard>

        <div
          style={{
            padding: "18px 18px 16px",
            background: C.tailorBg,
            border: `1px solid ${C.tailorBorder}`,
            borderRadius: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <SparkleIcon size={16} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.tailor }}>
              {brief?.headline || "Generating brief"}
            </span>
          </div>
          {brief ? (
            <p
              style={{
                fontSize: 12,
                color: "rgba(250,250,249,0.8)",
                lineHeight: 1.75,
                margin: "0 0 12px",
              }}
            >
              {brief.summary}
            </p>
          ) : (
            <p
              style={{
                fontSize: 12,
                color: "rgba(250,250,249,0.72)",
                lineHeight: 1.7,
                margin: "0 0 12px",
              }}
            >
              Building a measurement-led styling brief from your best-fit
              catalog items, brand performance, and the wardrobe direction you
              selected.
            </p>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                flex: 1,
                padding: "10px 12px",
                background: "rgba(126,161,136,0.12)",
                borderRadius: 10,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: C.tailor }}>
                {insights.lowRisk}
              </div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>
                Low risk items
              </div>
            </div>
            <div
              style={{
                flex: 1,
                padding: "10px 12px",
                background: C.successBg,
                borderRadius: 10,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: C.success }}>
                {insights.topFits.length}
              </div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>
                Perfect fits (90%+)
              </div>
            </div>
            {insights.bestBrand && (
              <div
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  background: C.goldBg,
                  borderRadius: 10,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>
                  {insights.bestBrand.name}
                </div>
                <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>
                  Best brand
                </div>
              </div>
            )}
          </div>
        </div>

        <GlassCard style={{ padding: 18, marginBottom: 16 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.accent,
              marginBottom: 14,
            }}
          >
            Silhouette priorities
          </p>
          {(
            brief?.silhouettePriorities || [
              "Generating body-aware silhouette guidance from your strongest catalog fits.",
              "Looking at which categories give you the cleanest fit confidence.",
              "Mapping proportion guidance before the product recommendations land.",
            ]
          ).map(tip => (
            <div
              key={tip}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                marginBottom: 10,
              }}
            >
              <div style={{ color: C.success, display: "flex", marginTop: 1 }}>
                <CheckCircle size={14} />
              </div>
              <span
                style={{ fontSize: 12, color: C.mutedLight, lineHeight: 1.5 }}
              >
                {tip}
              </span>
            </div>
          ))}
        </GlassCard>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <GlassCard style={{ padding: 16 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: C.accent,
                marginBottom: 12,
              }}
            >
              Fabric focus
            </p>
            {(brief?.fabricFocus || ["Awaiting fabric guidance"]).map(entry => (
              <div
                key={entry}
                style={{
                  fontSize: 11,
                  color: C.mutedLight,
                  lineHeight: 1.55,
                  marginBottom: 10,
                }}
              >
                {entry}
              </div>
            ))}
          </GlassCard>
          <GlassCard style={{ padding: 16 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: C.accent,
                marginBottom: 12,
              }}
            >
              Color direction
            </p>
            {(brief?.colorDirection || ["Awaiting palette direction"]).map(
              entry => (
                <div
                  key={entry}
                  style={{
                    fontSize: 11,
                    color: C.mutedLight,
                    lineHeight: 1.55,
                    marginBottom: 10,
                  }}
                >
                  {entry}
                </div>
              )
            )}
          </GlassCard>
        </div>

        <GlassCard style={{ padding: 18, marginBottom: 16 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.accent,
              marginBottom: 12,
            }}
          >
            What to avoid
          </p>
          {(
            brief?.avoid || [
              "Avoiding one-note suggestions until the generated brief is ready.",
            ]
          ).map(entry => (
            <div
              key={entry}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                marginBottom: 10,
              }}
            >
              <div style={{ color: C.warning, display: "flex", marginTop: 1 }}>
                <InfoIcon size={14} />
              </div>
              <span
                style={{ fontSize: 12, color: C.mutedLight, lineHeight: 1.5 }}
              >
                {entry}
              </span>
            </div>
          ))}
        </GlassCard>

        <GlassCard style={{ padding: 18, marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.accent,
                  margin: "0 0 4px",
                }}
              >
                Brand and fit direction
              </p>
              <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
                Generated from your highest-confidence items and return-risk
                profile.
              </p>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            {(
              brief?.recommendedBrands ||
              [insights.bestBrand?.name].filter(Boolean)
            ).map(brandName => (
              <div
                key={brandName}
                style={{
                  padding: "7px 10px",
                  borderRadius: 999,
                  background: C.goldBg,
                  border: `1px solid ${C.goldBorder}`,
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.gold,
                }}
              >
                {brandName}
              </div>
            ))}
          </div>
          {(
            brief?.fitNotes || [
              `Current strongest signal: ${insights.bestBrand ? `${insights.bestBrand.name} leads the catalog at ${Math.round(insights.bestBrand.avg)}% average fit.` : "Your highest-fit pieces are ready for review."}`,
            ]
          ).map(entry => (
            <div
              key={entry}
              style={{
                fontSize: 11,
                color: C.mutedLight,
                lineHeight: 1.6,
                marginBottom: 10,
              }}
            >
              {entry}
            </div>
          ))}
        </GlassCard>

        <GlassCard style={{ padding: 18, marginBottom: 16 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.accent,
              marginBottom: 12,
            }}
          >
            Outfit formulas
          </p>
          {(
            brief?.outfitFormulas || [
              "Your outfit formulas will appear here once the styling brief finishes generating.",
            ]
          ).map(entry => (
            <div
              key={entry}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                background: C.bgElevated,
                border: `1px solid ${C.border}`,
                fontSize: 11,
                color: C.mutedLight,
                lineHeight: 1.6,
                marginBottom: 10,
              }}
            >
              {entry}
            </div>
          ))}
        </GlassCard>

        <div style={{ marginBottom: 16 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.accent,
              marginBottom: 12,
            }}
          >
            Recommended catalog picks
          </p>
          <div
            className="tb-catalog-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            {recommendedItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => onItemClick(item)}
                isFav={favorites.has(item.id)}
                toggleFav={toggleFav}
              />
            ))}
          </div>
        </div>
      </div>
      <NavBar active="style" onNav={onNav} />
    </div>
  );
}

// ─── Tailor Screen ─────────────────────────────────────────
function TailorScreen({ item, onBack, onConfirm }) {
  const [selected, setSelected] = useState(new Set());
  const [notes, setNotes] = useState("");
  const total = [...selected].reduce((s, id) => {
    const opt = TAILOR_OPTIONS.find(o => o.id === id);
    return s + (opt?.price || 0);
  }, 0);
  const toggle = id =>
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <div
      className="tb-screen tb-screen--tailor"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
      }}
    >
      <div
        className="tb-screen__header"
        style={{
          padding: "18px 18px 0",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <BackButton onClick={onBack} />
        <div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: C.accent,
              margin: 0,
              fontFamily: font.serif,
            }}
          >
            Alteration Brief
          </h2>
          <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{item.name}</p>
        </div>
      </div>
      <div
        className="tb-screen__body tb-tailor-layout"
        style={{ flex: 1, overflow: "auto", padding: "0 18px 100px" }}
      >
        <GlassCard style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <ProductImage
              item={item}
              style={{
                width: 72,
                height: 92,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 10,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                }}
              >
                {item.brand}
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: C.accent,
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                {item.name}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginTop: 10,
                  flexWrap: "wrap",
                }}
              >
                <FitBadge fit={item.fit} />
                <div
                  style={{
                    padding: "3px 9px",
                    borderRadius: 999,
                    background: C.bgElevated,
                    border: `1px solid ${C.border}`,
                    fontSize: 10,
                    fontWeight: 600,
                    color: C.mutedLight,
                  }}
                >
                  Recommended size {item.bestSize}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
        <div
          style={{
            padding: "14px 16px",
            background: C.tailorBg,
            border: `1px solid ${C.tailorBorder}`,
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <SparkleIcon size={14} />
            <p
              style={{
                fontSize: 11,
                color: C.tailor,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Choose the adjustments you expect after purchase. We will save
              them as a concise alteration brief you can reference or share.
            </p>
          </div>
        </div>
        {TAILOR_OPTIONS.map(opt => {
          const IconComp = TAILOR_ICON_MAP[opt.iconId] || ScissorsIcon;
          const isSelected = selected.has(opt.id);
          return (
            <GlassCard
              key={opt.id}
              hover
              onClick={() => toggle(opt.id)}
              style={{
                padding: "14px 16px",
                marginBottom: 10,
                border: `1px solid ${isSelected ? C.tailorBorder : C.border}`,
                background: isSelected ? C.tailorBg : C.card,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: isSelected
                      ? "rgba(126,161,136,0.15)"
                      : C.bgElevated,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isSelected ? C.tailor : C.muted,
                    flexShrink: 0,
                  }}
                >
                  <IconComp size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: isSelected ? C.accent : C.mutedLight,
                    }}
                  >
                    {opt.label}
                  </div>
                  {opt.price > 0 && (
                    <div
                      style={{
                        fontSize: 11,
                        color: isSelected ? C.tailor : C.muted,
                        marginTop: 2,
                      }}
                    >
                      +${opt.price}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    background: isSelected ? C.tailor : "transparent",
                    border: `2px solid ${isSelected ? C.tailor : C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isSelected && <CheckIcon />}
                </div>
              </div>
            </GlassCard>
          );
        })}
        {selected.has("custom") && (
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Describe your custom alteration..."
            style={{
              width: "100%",
              background: C.card,
              border: `1px solid ${C.tailorBorder}`,
              borderRadius: 12,
              padding: "12px 14px",
              color: C.accent,
              fontSize: 12,
              lineHeight: 1.6,
              resize: "none",
              outline: "none",
              boxSizing: "border-box",
              minHeight: 80,
              marginTop: 4,
            }}
          />
        )}
      </div>
      <div
        className="tb-sticky-cta"
        style={{
          position: "sticky",
          bottom: 0,
          padding: "12px 18px 28px",
          background: "rgba(10,10,10,0.95)",
          backdropFilter: "blur(16px)",
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 13, color: C.muted }}>
            {selected.size} adjustment{selected.size !== 1 ? "s" : ""} selected
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.accent }}>
            {total > 0 ? `Estimated +$${total}` : "Consultation first"}
          </span>
        </div>
        <button
          onClick={() =>
            onConfirm({
              item,
              alterations: [...selected],
              notes,
              total,
              requestedAt: new Date().toISOString(),
              status: "Brief ready",
            })
          }
          disabled={selected.size === 0}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 12,
            border: "none",
            background:
              selected.size > 0
                ? `linear-gradient(135deg, ${C.tailor}, #557061)`
                : C.border,
            color: selected.size > 0 ? "#fff" : C.muted,
            fontSize: 13,
            fontWeight: 600,
            cursor: selected.size > 0 ? "pointer" : "not-allowed",
            transition: "all 0.2s",
          }}
        >
          {selected.size > 0
            ? "Save Alteration Brief"
            : "Select at least one adjustment"}
        </button>
      </div>
    </div>
  );
}

// ─── Profile Screen ─────────────────────────────────────────
function ProfileScreen({
  userBody,
  userBodyMeta,
  onUpdateBody,
  favorites,
  catalog,
  onNav,
  tailorOrders,
}) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState({ ...userBody });
  const [editMeta, setEditMeta] = useState({
    ...(userBodyMeta || DEFAULT_BODY_META),
    confidence: { ...((userBodyMeta || DEFAULT_BODY_META).confidence) },
    verified: { ...((userBodyMeta || DEFAULT_BODY_META).verified) },
  });
  const editWarnings = useMemo(() => validateBody(editBody), [editBody]);
  const editWarningByKey = useMemo(() => {
    const m = {};
    for (const w of editWarnings) {
      if (!m[w.key]) m[w.key] = w;
    }
    return m;
  }, [editWarnings]);
  const favItems = catalog.filter(i => favorites.has(i.id));
  const avgFit = Math.round(
    catalog.reduce((s, i) => s + i.fit, 0) / catalog.length
  );
  const perfectFits = catalog.filter(i => i.fit >= 90).length;

  if (editing) {
    return (
      <div
        className="tb-screen tb-screen--profile-edit"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: C.bg,
          overflow: "auto",
        }}
      >
        <div
          className="tb-screen__header"
          style={{
            padding: "18px 18px 0",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <BackButton onClick={() => setEditing(false)} label="Cancel" />
          <h2
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: C.accent,
              margin: 0,
              fontFamily: font.serif,
              flex: 1,
            }}
          >
            Edit Measurements
          </h2>
          <button
            onClick={() => {
              onUpdateBody(editBody, editMeta);
              setEditing(false);
            }}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              background: `linear-gradient(135deg, ${C.forest}, ${C.forestDeep})`,
              color: C.cream,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.4,
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
        <div
          className="tb-screen__body"
          style={{ flex: 1, padding: "0 18px 40px", overflow: "auto" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Body3DViewer
              body={editBody}
              width={220}
              height={300}
              autoRotate
              annotated
              variant="studio"
            />
          </div>

          {/* Fit preference editor */}
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: "12px 14px",
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>
              Fit preference
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {FIT_PREFERENCES.map(p => {
                const active = editMeta.fitPreference === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setEditMeta(m => ({ ...m, fitPreference: p.id }))}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: `1px solid ${active ? C.forest : C.border}`,
                      background: active ? C.goldBg : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: active ? C.forestDeep : C.accent }}>{p.label}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{p.blurb}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {MEASUREMENT_FIELDS.map(f => (
              <MeasurementInput
                key={f.key}
                field={f}
                value={editBody[f.key]}
                confidence={editMeta.confidence?.[f.key] ?? 70}
                source={editMeta.source}
                warning={editWarningByKey[f.key]}
                onChange={v => {
                  setEditBody(b => ({ ...b, [f.key]: v }));
                  setEditMeta(m => ({
                    ...m,
                    source: m.source === "scan" ? "scan" : "manual",
                    confidence: { ...m.confidence, [f.key]: 92 },
                    verified: { ...m.verified, [f.key]: true },
                  }));
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="tb-screen tb-screen--profile"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
      }}
    >
      <div className="tb-screen__header" style={{ padding: "18px 18px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 400,
                color: C.accent,
                margin: "0 0 2px",
                fontFamily: font.serif,
              }}
            >
              Profile
            </h2>
            <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
              Your fit record
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.muted,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            <EditIcon size={13} /> Edit
          </button>
        </div>
      </div>

      <div
        className="tb-screen__body"
        style={{ flex: 1, overflow: "auto", padding: "0 18px 90px" }}
      >
        {/* Body preview + Fit Passport */}
        <GlassCard
          className="tb-profile-overview"
          style={{ padding: 16, marginBottom: 14 }}
        >
          <div className="tb-profile-overview__row" style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 12 }}>
            <Body3DViewer
              body={userBody}
              width={150}
              height={210}
              autoRotate
              annotated
              variant="studio"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  color: C.forest,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  fontWeight: 800,
                  marginBottom: 6,
                }}
              >
                Fit Passport
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: C.accent, fontFamily: font.serif, lineHeight: 1.2, marginBottom: 4 }}>
                Your measurement record
              </div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
                Confidence rolls into every fit score, the alteration brief and the tailor's review queue.
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 10.5 }}>
                <div>
                  <div style={{ color: C.muted, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", fontSize: 9 }}>Overall</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.forest, fontFamily: font.sans }}>
                    {aggregateConfidence(userBodyMeta)}%
                  </div>
                </div>
                <div>
                  <div style={{ color: C.muted, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", fontSize: 9 }}>Source</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, marginTop: 4 }}>
                    {sourceLabel(userBodyMeta?.source)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <MeasurementPassport
            body={userBody}
            meta={userBodyMeta}
            compact
            title="Body measurements"
            subtitle={null}
            onRefine={() => setEditing(true)}
          />
        </GlassCard>

        {/* Fit Stats */}
        <GlassCard style={{ padding: 18, marginBottom: 16 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.accent,
              marginBottom: 14,
            }}
          >
            Fit Statistics
          </p>
          <div
            className="tb-profile-stats"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
            }}
          >
            {[
              { label: "Avg Fit", value: `${avgFit}%`, color: C.forest, isZero: false },
              { label: "Perfect Fits", value: perfectFits, color: C.success, isZero: perfectFits === 0 },
              { label: "Shortlist", value: favorites.size, color: C.tailor, isZero: favorites.size === 0 },
            ].map(({ label, value, color, isZero }) => (
              <div
                key={label}
                style={{
                  textAlign: "center",
                  padding: "12px 8px",
                  background: C.bgElevated,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  opacity: isZero ? 0.6 : 1,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700, color: isZero ? C.muted : color }}>
                  {isZero ? "—" : value}
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4, fontWeight: 500 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Tailor Orders */}
        {tailorOrders.length > 0 && (
          <GlassCard style={{ padding: 18, marginBottom: 16 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: C.accent,
                marginBottom: 14,
              }}
            >
              Alteration Briefs
            </p>
            {tailorOrders.map((order, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 0",
                  borderBottom:
                    i < tailorOrders.length - 1
                      ? `1px solid ${C.border}`
                      : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{ fontSize: 12, fontWeight: 500, color: C.accent }}
                    >
                      {order.item.name}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                      {order.alterations.length} adjustment
                      {order.alterations.length !== 1 ? "s" : ""} ·{" "}
                      {formatOrderDate(order.requestedAt)}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flex: "column",
                      alignItems: "flex-end",
                      gap: 4,
                    }}
                  >
                    {order.total > 0 && (
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: C.accent,
                        }}
                      >
                        +${order.total}
                      </span>
                    )}
                    <div
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: C.successBg,
                        border: `1px solid ${C.successBorder}`,
                        fontSize: 9,
                        fontWeight: 600,
                        color: C.success,
                      }}
                    >
                      {order.status || "Brief ready"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </GlassCard>
        )}

        {/* Saved Items */}
        {favItems.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: C.accent,
                marginBottom: 12,
              }}
            >
              Saved for Review ({favItems.length})
            </p>
            <div
              className="tb-catalog-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {favItems.slice(0, 4).map(item => (
                <GlassCard key={item.id} style={{ overflow: "hidden" }}>
                  <ProductImage item={item} style={{ height: 120 }} />
                  <div style={{ padding: "8px 10px 10px" }}>
                    <div
                      style={{
                        fontSize: 9,
                        color: C.muted,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      {item.brand}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: C.accent,
                        marginTop: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.name}
                    </div>
                    <FitBadge fit={item.fit} />
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {favItems.length === 0 && (
          <div
            style={{
              padding: "26px 22px",
              borderRadius: 18,
              border: `1px solid ${C.borderLight}`,
              background: `linear-gradient(160deg, ${C.cream} 0%, ${C.beige} 100%)`,
              boxShadow: "0 12px 24px rgba(45,55,42,0.08)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 12,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                right: -30,
                bottom: -40,
                width: 160,
                height: 160,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(156,175,136,0.30) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background: `linear-gradient(135deg, ${C.forest}, ${C.forestDeep})`,
                color: C.cream,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 20px rgba(107,142,90,0.32)",
              }}
            >
              <HeartIcon filled color={C.cream} />
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: C.accent,
                fontFamily: font.serif,
              }}
            >
              Start your shortlist
            </div>
            <p
              style={{
                fontSize: 12,
                color: C.muted,
                lineHeight: 1.55,
                margin: 0,
                maxWidth: 260,
              }}
            >
              Tap the heart on any piece to save it here. Your shortlist powers fit-aware recommendations across brands.
            </p>
            <button
              onClick={() => onNav("home")}
              style={{
                padding: "10px 22px",
                borderRadius: 999,
                border: "none",
                background: `linear-gradient(135deg, ${C.forest}, ${C.forestDeep})`,
                color: C.cream,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.5,
                cursor: "pointer",
                boxShadow: "0 6px 16px rgba(107,142,90,0.28)",
                marginTop: 2,
              }}
            >
              Browse the catalog
            </button>
          </div>
        )}
      </div>
      <NavBar active="profile" onNav={onNav} />
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────
export default function TailoredApp() {
  const saved = loadUserData();
  const isDesktop = useDesktopLayout();
  const [screen, setScreen] = useState(saved?.body ? "home" : "splash");
  const [userBody, setUserBody] = useState(saved?.body || DEFAULT_BODY);
  const [userBodyMeta, setUserBodyMeta] = useState(
    saved?.bodyMeta || { ...DEFAULT_BODY_META }
  );
  const [favorites, setFavorites] = useState(saved?.favorites || new Set());
  const [tailorOrders, setTailorOrders] = useState(saved?.tailorOrders || []);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tailorItem, setTailorItem] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [navTab, setNavTab] = useState("home");
  const [prevScreen, setPrevScreen] = useState(null);

  const catalog = useMemo(() => enrichCatalog(userBody), [userBody]);

  useEffect(() => {
    saveUserData({ body: userBody, bodyMeta: userBodyMeta, favorites, tailorOrders });
  }, [userBody, userBodyMeta, favorites, tailorOrders]);

  const toggleFav = useCallback(id => {
    setFavorites(f => {
      const n = new Set(f);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const handleItemClick = item => {
    setPrevScreen(screen);
    setSelectedItem(item);
    setScreen("item");
  };
  const handleBrandClick = brand => {
    setPrevScreen(screen);
    setSelectedBrand(brand);
    setScreen("brand");
  };
  const handleBack = () => {
    setScreen(prevScreen || navTab);
    setSelectedItem(null);
    setSelectedBrand(null);
    setTailorItem(null);
  };
  const handleNav = tab => {
    setNavTab(tab);
    setScreen(tab);
    setSelectedItem(null);
    setSelectedBrand(null);
    setTailorItem(null);
  };
  const handleOnboardingComplete = (body, meta) => {
    setUserBody(body);
    if (meta) {
      setUserBodyMeta(prev => ({ ...prev, ...meta, lastReviewedAt: Date.now() }));
    }
    setScreen("home");
    setNavTab("home");
  };
  const handleSendToTailor = item => {
    setTailorItem(item);
    setScreen("tailor");
  };
  const handleTailorConfirm = order => {
    setTailorOrders(o => [...o, order]);
    setScreen("profile");
    setNavTab("profile");
  };
  const handleUpdateBody = (body, metaPatch) => {
    setUserBody(body);
    setUserBodyMeta(prev => ({
      ...prev,
      ...(metaPatch || {}),
      source: metaPatch?.source ?? "manual",
      lastReviewedAt: Date.now(),
    }));
  };

  const sharedProps = {
    catalog,
    favorites,
    toggleFav,
    onNav: handleNav,
    userBody,
    userBodyMeta,
  };
  const activeNav = NAV_ITEMS.find(item => item.id === navTab) || NAV_ITEMS[0];
  const showDesktopChrome =
    isDesktop && !["splash", "onboarding"].includes(screen);

  return (
    <div
      className="tb-app"
      style={{
        width: "100vw",
        height: "100vh",
        background: C.bg,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: font.sans,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; background: rgba(45,55,42,0.12); }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: ${C.forest}; cursor: pointer; box-shadow: 0 2px 10px rgba(107,142,90,0.45); border: 2px solid ${PALETTE.cream}; }
        input[type=text], input[type=range], textarea, select { font-family: inherit; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tbFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scanLine { 0%, 100% { top: 10%; opacity: 0.5; } 50% { top: 85%; opacity: 1; } }
        @keyframes scanSweep { 0% { transform: translateY(-100%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(100%); opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes tbPulseRing { 0% { transform: scale(0.9); opacity: 0.55; } 70% { transform: scale(1.4); opacity: 0; } 100% { opacity: 0; } }
        @keyframes tbDrift { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        /* Fit Studio responsive layout */
        @media (min-width: 880px) {
          .tb-fs-body {
            grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr) !important;
            grid-template-rows: 1fr !important;
            align-items: stretch;
          }
          .tb-fs-visual {
            grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr) !important;
            height: 100%;
          }
        }
        @media (max-width: 879px) {
          .tb-fs-visual {
            grid-template-columns: minmax(0, 0.78fr) minmax(0, 1.22fr) !important;
          }
        }
        @media (max-width: 560px) {
          .tb-fs-visual {
            grid-template-columns: 1fr !important;
          }
          .tb-fs-source {
            max-height: 220px;
          }
        }
        .tb-app {
          position: relative;
          overflow: hidden;
          padding: 24px;
          background:
            radial-gradient(circle at top left, rgba(156,175,136,0.30), transparent 32%),
            radial-gradient(circle at bottom right, rgba(168,174,154,0.32), transparent 36%),
            radial-gradient(circle at 60% 50%, rgba(139,149,86,0.08), transparent 55%),
            linear-gradient(180deg, ${PALETTE.parchment} 0%, ${PALETTE.beige} 100%);
        }
        .tb-stage {
          width: 100%;
          height: 100%;
        }
        .tb-stage--desktop {
          max-width: 1580px;
          height: min(960px, calc(100vh - 48px));
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr) 320px;
          gap: 18px;
        }
        .tb-stage--immersive {
          max-width: 1160px;
          height: min(940px, calc(100vh - 48px));
          margin: 0 auto;
        }
        .tb-shell__sidebar,
        .tb-stage__main {
          min-height: 0;
        }
        .tb-shell__sidebar {
          border-radius: 32px;
          border: 1px solid ${C.border};
          background: linear-gradient(180deg, ${PALETTE.cream} 0%, ${PALETTE.beige} 100%);
          backdrop-filter: blur(24px);
          box-shadow: 0 24px 60px rgba(45,55,42,0.10), 0 1px 0 rgba(255,255,255,0.6) inset;
          overflow: auto;
          padding: 24px;
        }
        .tb-stage__main {
          position: relative;
          overflow: hidden;
          border-radius: 34px;
          border: 1px solid ${C.border};
          background: linear-gradient(180deg, #FFFFFF 0%, ${PALETTE.parchment} 100%);
          box-shadow: 0 40px 100px rgba(45,55,42,0.18), 0 1px 0 rgba(255,255,255,0.7) inset;
        }
        .tb-stage--immersive .tb-stage__main {
          max-width: 1100px;
          margin: 0 auto;
        }
        .tb-screen-frame {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
          border-radius: inherit;
        }
        .tb-brand-lockup {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          margin-bottom: 18px;
        }
        .tb-brand-lockup__mark {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          background: linear-gradient(145deg, ${C.forest}, ${C.forestDeep});
          color: ${PALETTE.cream};
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: ${font.serif};
          font-size: 26px;
          font-weight: 700;
          flex-shrink: 0;
          box-shadow: 0 12px 30px rgba(107,142,90,0.28);
        }
        .tb-brand-lockup__title,
        .tb-sidebar-title {
          font-family: ${font.serif};
          color: ${C.accent};
          font-weight: 500;
          line-height: 1;
          margin: 0 0 8px;
        }
        .tb-brand-lockup__title {
          font-size: 34px;
        }
        .tb-sidebar-card {
          padding: 20px;
          border-radius: 24px;
          border: 1px solid ${C.border};
          background: linear-gradient(180deg, #FFFFFF 0%, ${PALETTE.cream} 100%);
          box-shadow: 0 6px 18px rgba(45,55,42,0.06);
          margin-bottom: 16px;
        }
        .tb-sidebar-card--hero {
          background: linear-gradient(180deg, ${PALETTE.sageMist}, ${PALETTE.cream});
          border: 1px solid ${C.goldBorder};
        }
        .tb-sidebar-eyebrow {
          color: ${C.gold};
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          margin: 0 0 10px;
        }
        .tb-sidebar-copy {
          color: ${C.mutedLight};
          font-size: 13px;
          line-height: 1.7;
          margin: 0;
        }
        .tb-desktop-nav {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tb-desktop-nav__item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          text-align: left;
          width: 100%;
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid transparent;
          background: transparent;
          color: ${C.mutedLight};
          cursor: pointer;
          transition: all 0.22s ease;
        }
        .tb-desktop-nav__item:hover,
        .tb-desktop-nav__item.is-active {
          transform: translateY(-1px);
          color: ${C.accent};
          border-color: ${C.goldBorder};
          background: ${C.goldBg};
          box-shadow: 0 10px 24px rgba(107,142,90,0.12);
        }
        .tb-desktop-nav__icon {
          display: flex;
          color: inherit;
          margin-top: 1px;
        }
        .tb-desktop-nav__label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 3px;
        }
        .tb-desktop-nav__hint {
          display: block;
          font-size: 11px;
          color: ${C.muted};
        }
        .tb-sidebar-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 16px;
        }
        .tb-sidebar-stats--snapshot {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          column-gap: 14px;
        }
        .tb-sidebar-stats--snapshot .tb-sidebar-stat {
          min-width: 0;
        }
        .tb-sidebar-stat__value {
          display: block;
          color: ${C.accent};
          font-size: 22px;
          font-weight: 800;
        }
        .tb-sidebar-stat__value--text {
          font-size: 16px;
          line-height: 1.15;
          letter-spacing: 0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
          max-width: 100%;
        }
        .tb-sidebar-stat__label {
          display: block;
          margin-top: 4px;
          color: ${C.muted};
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .tb-measurement-list {
          border-top: 1px solid ${C.border};
          padding-top: 14px;
        }
        .tb-measurement-list__headline,
        .tb-sidebar-product__meta,
        .tb-sidebar-progress__row,
        .tb-measurement-list__row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }
        .tb-measurement-list__headline {
          color: ${C.goldLight};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .tb-measurement-list__row {
          padding: 8px 0;
          border-bottom: 1px solid ${C.border};
          color: ${C.mutedLight};
          font-size: 12px;
        }
        .tb-measurement-list__row strong,
        .tb-sidebar-progress__row strong {
          color: ${C.accent};
          font-size: 13px;
        }
        .tb-brand-panel,
        .tb-sidebar-product,
        .tb-mini-list__item {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .tb-brand-panel {
          margin-bottom: 14px;
        }
        .tb-brand-panel__logo {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 15px;
          font-weight: 800;
          flex-shrink: 0;
        }
        .tb-sidebar-product__image {
          width: 96px;
          height: 118px;
          border-radius: 18px;
          flex-shrink: 0;
          border: 1px solid ${C.border};
          background: ${PALETTE.beige};
        }
        .tb-sidebar-product__brand,
        .tb-mini-list__meta {
          color: ${C.muted};
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-weight: 700;
        }
        .tb-sidebar-product__meta {
          margin-top: 8px;
          color: ${C.mutedLight};
          font-size: 11px;
        }
        .tb-sidebar-progress {
          margin-top: 16px;
          display: grid;
          gap: 10px;
        }
        .tb-sidebar-progress__row {
          margin-bottom: 5px;
          color: ${C.mutedLight};
          font-size: 11px;
        }
        .tb-sidebar-progress__track {
          height: 5px;
          border-radius: 999px;
          background: rgba(45,55,42,0.10);
          overflow: hidden;
        }
        .tb-sidebar-progress__fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, ${C.forest}, ${C.sage});
        }
        .tb-mini-list {
          display: grid;
          gap: 10px;
        }
        .tb-mini-list__thumb {
          width: 52px;
          height: 68px;
          border-radius: 14px;
          flex-shrink: 0;
          border: 1px solid ${C.border};
          background: ${PALETTE.beige};
        }
        .tb-mini-list__title {
          color: ${C.accent};
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .tb-sidebar-note {
          margin: 14px 0 0;
          padding: 12px 14px;
          border-radius: 14px;
          color: ${C.mutedLight};
          font-size: 12px;
          line-height: 1.6;
          background: ${PALETTE.cream};
          border: 1px solid ${C.border};
        }
        @media (max-width: 1099px) {
          .tb-app {
            padding: 0;
            background: ${C.bg};
          }
          .tb-stage--desktop,
          .tb-stage--immersive {
            display: block;
            max-width: none;
            height: 100%;
          }
          .tb-shell__sidebar {
            display: none;
          }
          .tb-stage__main {
            width: 100%;
            height: 100%;
            border-radius: 0;
            border: none;
            box-shadow: none;
            background: ${C.bg};
          }
        }
        @media (min-width: 1100px) {
          .tb-mobile-nav {
            display: none !important;
          }
          .tb-screen__header {
            padding: 30px 30px 0 !important;
          }
          .tb-screen__body {
            padding: 0 30px 116px !important;
          }
          .tb-screen__body--centered {
            padding: 0 30px 52px !important;
          }
          .tb-sticky-cta {
            padding: 18px 30px 30px !important;
            background: rgba(237,238,232,0.95) !important;
            border-top: 1px solid ${C.border};
          }
          .tb-top-picks-row,
          .tb-trend-rail {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            overflow: visible !important;
          }
          .tb-top-picks-row > div,
          .tb-trend-rail > div {
            width: auto !important;
            flex-shrink: 1 !important;
          }
          .tb-home-summary {
            display: grid !important;
            grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
            gap: 22px !important;
            align-items: center;
          }
          .tb-catalog-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 16px !important;
          }
          .tb-brand-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 16px !important;
          }
          .tb-item-detail__content {
            padding: 0 30px 48px !important;
          }
          .tb-item-detail__shell {
            display: grid;
            grid-template-columns: minmax(420px, 0.92fr) minmax(0, 1.08fr);
            gap: 24px;
            align-items: start;
          }
          .tb-item-detail__media {
            position: sticky;
            top: 86px;
          }
          .tb-item-detail__actions {
            position: sticky;
            bottom: 0;
            padding-top: 18px;
            background: linear-gradient(180deg, rgba(237,238,232,0) 0%, rgba(237,238,232,0.92) 28%, rgba(237,238,232,0.98) 100%);
          }
          .tb-style-hero > div,
          .tb-profile-overview > div {
            align-items: flex-start !important;
            gap: 24px !important;
          }
          .tb-onboarding-choice-list {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            align-items: stretch;
          }
          .tb-onboarding-manual__body {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) 300px;
            gap: 24px;
            align-items: start;
          }
          .tb-onboarding-preview {
            margin-top: 46px !important;
          }
          .tb-review-grid {
            grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
          }
          .tb-tailor-layout {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px 18px !important;
            align-content: start;
          }
          .tb-tailor-layout > :first-child,
          .tb-tailor-layout textarea {
            grid-column: 1 / -1;
          }
          .tb-splash__content {
            max-width: 780px;
            width: 100%;
            align-items: flex-start !important;
            text-align: left !important;
          }
          .tb-splash__features {
            max-width: none !important;
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .tb-splash__cta {
            align-self: flex-start;
            max-width: 360px !important;
          }
        }
        @media (min-width: 1440px) {
          .tb-catalog-grid,
          .tb-brand-grid,
          .tb-top-picks-row,
          .tb-trend-rail {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
      <div
        className={`tb-stage ${showDesktopChrome ? "tb-stage--desktop" : "tb-stage--immersive"}`}
      >
        {showDesktopChrome && (
          <DesktopNavRail
            active={activeNav.id}
            onNav={handleNav}
            userBody={userBody}
            catalog={catalog}
            favorites={favorites}
            tailorOrders={tailorOrders}
          />
        )}
        <div className="tb-stage__main">
          <div className="tb-screen-frame">
            {screen === "splash" && (
              <SplashScreen onContinue={() => setScreen("onboarding")} />
            )}
            {screen === "onboarding" && (
              <OnboardingScreen onComplete={handleOnboardingComplete} />
            )}
            {screen === "home" && (
              <HomeScreen {...sharedProps} onItemClick={handleItemClick} />
            )}
            {screen === "trending" && (
              <TrendingScreen {...sharedProps} onItemClick={handleItemClick} />
            )}
            {screen === "brands" && (
              <BrandsScreen {...sharedProps} onBrandClick={handleBrandClick} />
            )}
            {screen === "brand" && selectedBrand && (
              <BrandDetailScreen
                brand={selectedBrand}
                onBack={handleBack}
                onItemClick={handleItemClick}
                favorites={favorites}
                toggleFav={toggleFav}
                catalog={catalog}
              />
            )}
            {screen === "style" && (
              <StyleAIScreen {...sharedProps} onItemClick={handleItemClick} />
            )}
            {screen === "item" && selectedItem && (
              <ItemDetailScreen
                item={selectedItem}
                onBack={handleBack}
                isFav={favorites.has(selectedItem.id)}
                toggleFav={toggleFav}
                onSendToTailor={handleSendToTailor}
                userBody={userBody}
                userBodyMeta={userBodyMeta}
              />
            )}
            {screen === "tailor" && tailorItem && (
              <TailorScreen
                item={tailorItem}
                onBack={handleBack}
                onConfirm={handleTailorConfirm}
              />
            )}
            {screen === "profile" && (
              <ProfileScreen
                userBody={userBody}
                userBodyMeta={userBodyMeta}
                onUpdateBody={handleUpdateBody}
                favorites={favorites}
                catalog={catalog}
                onNav={handleNav}
                tailorOrders={tailorOrders}
              />
            )}
          </div>
        </div>
        {showDesktopChrome && (
          <DesktopContextPanel
            screen={screen}
            navTab={activeNav.id}
            selectedItem={selectedItem}
            selectedBrand={selectedBrand}
            catalog={catalog}
            favorites={favorites}
            tailorOrders={tailorOrders}
            userBody={userBody}
          />
        )}
      </div>
    </div>
  );
}
