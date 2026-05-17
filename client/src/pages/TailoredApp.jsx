import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import * as THREE from "three";
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import { trpc } from "@/lib/trpc";

// ─── Design Tokens · Earthy Luxury Palette ─────────────────
// Sage, forest, olive, beige, tan, sand, cream, clay/cocoa brown, warm gray.
// No orange. Editorial accent is a warm clay brown, not terracotta.
// The original "gold" / "tailor" tokens are remapped to the new palette so the
// entire app inherits the new identity without thousands of surgical edits.
const PALETTE = {
  sage: "#9CAF88",
  forest: "#6B8E5A",
  olive: "#8B9556",
  beige: "#F5F1E8",
  tan: "#D2B48C",
  sand: "#C19A6B",
  cream: "#F7F3E9",
  clay: "#7C5A3A",
  cocoa: "#5B4636",
  warmGray: "#8B8680",
  // Derived shades
  forestDeep: "#4F6B43",
  sageDeep: "#7A9070",
  sageMist: "#C4D2B6",
  ink: "#2C3327",
  inkSoft: "#4A5043",
  parchment: "#FBF8F1",
  bark: "#5B4636",
  oat: "#E8DFCB",
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
  border: "rgba(75,65,52,0.10)",
  borderLight: "rgba(75,65,52,0.18)",
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
  // Warning — sand
  warning: PALETTE.sand,
  warningBg: "rgba(193,154,107,0.14)",
  warningBorder: "rgba(193,154,107,0.32)",
  // Danger — clay brown (no orange)
  danger: PALETTE.clay,
  // Tailor accent — warm clay brown as the editorial pop
  tailor: PALETTE.clay,
  tailorBg: "rgba(124,90,58,0.10)",
  tailorBorder: "rgba(124,90,58,0.28)",
  // Glass effects
  glass: "rgba(255,253,247,0.55)",
  glassBorder: "rgba(75,65,52,0.10)",
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
    label: "Shop",
    eyebrow: "Client edit",
    title: "Measurement-led wardrobe planning",
    blurb:
      "Shop across retailers with fit scoring, sizing logic, and alteration planning built into every recommendation.",
  },
  {
    id: "trending",
    icon: <FireIcon />,
    label: "Signals",
    eyebrow: "Market view",
    title: "Demand worth acting on",
    blurb:
      "Trend movement filtered through your measurements, return risk, and brand-specific sizing patterns.",
  },
  {
    id: "brands",
    icon: <TagIcon />,
    label: "Brands",
    eyebrow: "Brand map",
    title: "Where your fit works best",
    blurb:
      "See which labels consistently match your proportions before you even open the product page.",
  },
  {
    id: "style",
    icon: <SparkleIcon />,
    label: "Styling",
    eyebrow: "Stylist notes",
    title: "Body-led styling intelligence",
    blurb:
      "Shape analysis, fit logic, and practical outfit direction for building a sharper wardrobe.",
  },
  {
    id: "profile",
    icon: <UserIcon />,
    label: "Profile",
    eyebrow: "Fit passport",
    title: "Your fit record",
    blurb:
      "The living record of what fits, what you saved, and which alteration briefs are ready to use.",
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
  // Premium ceramic/marble finish in warm cream + sage cast. Reads as a
  // sculpted figurine, not a literal mannequin — distinctive and on-brand.
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: 0xeadfc8, // warm cream
    roughness: 0.42,
    metalness: 0.0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.6,
    sheen: 0.6,
    sheenRoughness: 0.4,
    sheenColor: new THREE.Color(0x9cae88), // sage sheen — earthy luxe cast
    side: THREE.FrontSide,
    envMapIntensity: 0.85,
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
        { y: 2.56, rx: 0.11, rz: 0.1, ox: sx * 0.92 },
        { y: 2.46, rx: 0.1, rz: 0.088, ox: sx + sign * 0.01 },
        { y: 2.28, rx: 0.082, rz: 0.072, ox: sx + sign * 0.05 },
        { y: 2.1, rx: 0.075, rz: 0.065, ox: sx + sign * 0.07 },
        { y: 1.9, rx: 0.068, rz: 0.062, ox: sx + sign * 0.09 },
        { y: 1.55, rx: 0.058, rz: 0.054, ox: sx + sign * 0.11 },
        { y: 1.15, rx: 0.045, rz: 0.042, ox: sx + sign * 0.13 },
        { y: 0.82, rx: 0.035, rz: 0.032, ox: sx + sign * 0.14 },
        { y: 0.62, rx: 0.035, rz: 0.018, ox: sx + sign * 0.14 },
      ],
      24,
      skinMat
    );
  };
  group.add(buildArm(-1));
  group.add(buildArm(1));
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
    gap = 0.04,
    segs = 64,
    cat = item?.category || "Tops";
  const hexColor = item?.color || "#c9a96e",
    color = new THREE.Color(hexColor);
  const fab = (item?.fabric || "").toLowerCase();
  const isDenim = fab.includes("denim"),
    isSilk = fab.includes("silk") || fab.includes("satin"),
    isKnit =
      fab.includes("knit") || fab.includes("jersey") || fab.includes("modal"),
    isLeather = fab.includes("leather");
  const fabricMat = new THREE.MeshPhysicalMaterial({
    color,
    roughness: isDenim ? 0.92 : isSilk ? 0.22 : isKnit ? 0.88 : 0.75,
    metalness: isSilk ? 0.05 : 0,
    clearcoat: isSilk ? 0.35 : 0.04,
    clearcoatRoughness: isSilk ? 0.25 : 0.8,
    sheen: isKnit ? 0.6 : isSilk ? 0.5 : 0.2,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(hexColor).multiplyScalar(isSilk ? 2.2 : 1.4),
    side: THREE.FrontSide,
    envMapIntensity: isSilk ? 1.2 : 0.3,
  });
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
  }
  return group;
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
    const accent = new THREE.PointLight(0x7c5a3a, 0.35, 8); // warm clay kicker
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

  // Anchor points in viewer-relative percentages (top=0, bottom=100)
  const anchors = [
    { y: 22, label: "Bust", value: `${bust}"`, color: C.forest },
    { y: 41, label: "Waist", value: `${waist}"`, color: C.terracotta },
    { y: 55, label: "Hips", value: `${hips}"`, color: C.olive },
    { y: 10, label: "Shoulder", value: `${shoulder}"`, color: C.sage },
    { y: 78, label: "Inseam", value: `${inseam}"`, color: C.tan },
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
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 20px 40px rgba(75,65,52,0.10)",
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

      {/* Premium annotation overlay */}
      {annotated && width >= 240 && (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {anchors.map((a, i) => {
            const yPx = (height * a.y) / 100;
            const labelOnLeft = i % 2 === 0;
            const x1 = labelOnLeft ? width * 0.32 : width * 0.68;
            const x2 = labelOnLeft ? width * 0.10 : width * 0.90;
            return (
              <g key={a.label} style={{ animation: `tbFadeIn 0.7s ${i * 0.08}s both` }}>
                <circle cx={width / 2} cy={yPx} r={3.5} fill={a.color} opacity={0.85} />
                <circle cx={width / 2} cy={yPx} r={7} fill="none" stroke={a.color} strokeOpacity={0.35} strokeWidth={1} />
                <line
                  x1={width / 2}
                  y1={yPx}
                  x2={x1}
                  y2={yPx}
                  stroke={a.color}
                  strokeOpacity={0.55}
                  strokeWidth={1}
                  strokeDasharray="2 3"
                />
                <line
                  x1={x1}
                  y1={yPx}
                  x2={x2}
                  y2={yPx}
                  stroke={a.color}
                  strokeOpacity={0.55}
                  strokeWidth={1}
                />
                <text
                  x={labelOnLeft ? x2 + 2 : x2 - 2}
                  y={yPx - 4}
                  fontSize="9"
                  fontWeight="800"
                  letterSpacing="1.5"
                  fill={C.muted}
                  textAnchor={labelOnLeft ? "start" : "end"}
                  style={{ textTransform: "uppercase" }}
                >
                  {a.label}
                </text>
                <text
                  x={labelOnLeft ? x2 + 2 : x2 - 2}
                  y={yPx + 8}
                  fontSize="12"
                  fontWeight="700"
                  fill={a.color}
                  textAnchor={labelOnLeft ? "start" : "end"}
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
              background: "rgba(255,253,247,0.85)",
              padding: "4px 10px",
              borderRadius: 999,
              border: `1px solid ${C.goldBorder}`,
            }}
          >
            ● Live Scan · 33 pose landmarks
          </div>
        </>
      )}
    </div>
  );
}

// ─── Camera Body Scanner ─────────────────────────────────────
function CameraBodyScanner({ onScanComplete, onCancel, userHeight = 65 }) {
  const videoRef = useRef(null),
    canvasRef = useRef(null),
    streamRef = useRef(null);
  const landmarkerRef = useRef(null),
    animRef = useRef(null);
  const countdownRef = useRef(null),
    processingRef = useRef(null);
  const frontFramesRef = useRef([]),
    sideFramesRef = useRef([]);
  const mountedRef = useRef(true);
  const clamp = useCallback(
    (value, min, max) => Math.max(min, Math.min(max, value)),
    []
  );
  const [phase, setPhase] = useState("loading");
  const [feedback, setFeedback] = useState("Initializing AI...");
  const [confidence, setConfidence] = useState(0);
  const [progress, setProgress] = useState(0);
  const [turnCountdown, setTurnCountdown] = useState(3);
  const [measurements, setMeasurements] = useState(null);
  const [liveM, setLiveM] = useState(null);
  const [facingMode] = useState("user");
  const [loadProgress, setLoadProgress] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [scanGuide, setScanGuide] = useState({
    score: 0,
    bodyFill: 0,
    centered: false,
    stable: false,
    aligned: false,
  });

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (processingRef.current) clearTimeout(processingRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach(t => t.stop());
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  // Init camera + model
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        if (!mountedRef.current) return;
        setPhase("loading");
        setLoadProgress("Loading AI vision system...");
        setFeedback("Loading AI model...");

        // Use pinned version matching installed package
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        if (cancelled || !mountedRef.current) return;
        setLoadProgress("Initializing pose detection...");

        // Use full model (faster than heavy, more accurate than lite) with GPU fallback
        let landmarker;
        try {
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.6,
            minPosePresenceConfidence: 0.6,
            minTrackingConfidence: 0.6,
          });
        } catch (gpuErr) {
          // Fallback to CPU if GPU delegate fails
          console.warn("GPU delegate failed, falling back to CPU:", gpuErr);
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.6,
            minPosePresenceConfidence: 0.6,
            minTrackingConfidence: 0.6,
          });
        }
        if (cancelled || !mountedRef.current) return;
        landmarkerRef.current = landmarker;
        setLoadProgress("Requesting camera access...");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
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
        if (!video) return;
        video.srcObject = stream;

        // Wait for video to be truly ready before proceeding
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("Video load timeout")),
            10000
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

        await video.play();
        if (cancelled || !mountedRef.current) return;

        // Verify video has valid dimensions
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          throw new Error("Camera returned empty video stream");
        }

        setPhase("ready");
        setFeedback("Stand 6–8 ft away so your full body is visible");
        setLoadProgress("");
      } catch (err) {
        console.error("Scanner init error:", err);
        if (!cancelled && mountedRef.current) {
          setPhase("error");
          if (err.name === "NotAllowedError") {
            setFeedback(
              "Camera access denied. Please allow camera access in your browser settings and try again."
            );
          } else if (err.name === "NotFoundError") {
            setFeedback(
              "No camera found. Please connect a camera and try again."
            );
          } else if (
            err.name === "NotReadableError" ||
            err.name === "AbortError"
          ) {
            setFeedback(
              "Camera is in use by another app. Close other apps using the camera and try again."
            );
          } else if (err.message?.includes("timeout")) {
            setFeedback("Camera took too long to start. Please try again.");
          } else {
            setFeedback(
              `Scanner error: ${err.message || "Unknown error"}. Tap retry or enter manually.`
            );
          }
        }
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [facingMode, retryCount]);

  const avgFrames = useCallback(frames => {
    if (!frames.length) return null;
    return frames[0].map((_, idx) => {
      const vals = frames.map(f => f[idx]);
      const good = vals.filter(v => (v.visibility || 0) > 0.45);
      if (!good.length) return vals[0];
      const nn = good.length;
      return {
        x: good.reduce((s, v) => s + v.x, 0) / nn,
        y: good.reduce((s, v) => s + v.y, 0) / nn,
        z: good.reduce((s, v) => s + (v.z || 0), 0) / nn,
        visibility: good.reduce((s, v) => s + (v.visibility || 0), 0) / nn,
      };
    });
  }, []);

  const evaluateFrame = useCallback(
    (lm, ph) => {
      const nose = lm?.[0],
        lS = lm?.[11],
        rS = lm?.[12],
        lH = lm?.[23],
        rH = lm?.[24],
        lA = lm?.[27],
        rA = lm?.[28];
      if (!nose || !lS || !rS || !lH || !rH || !lA || !rA) {
        return {
          ok: false,
          score: 0,
          avgVis: 0,
          bodyFill: 0,
          centered: false,
          stable: false,
          aligned: false,
          reason: "Step into frame so your head, hips, and ankles are visible",
        };
      }

      const keyPoints = [nose, lS, rS, lH, rH, lA, rA];
      const avgVis =
        keyPoints.reduce((sum, point) => sum + (point.visibility || 0), 0) /
        keyPoints.length;
      const shoulderMidX = (lS.x + rS.x) / 2;
      const hipMidX = (lH.x + rH.x) / 2;
      const centerOffset = Math.abs((shoulderMidX + hipMidX) / 2 - 0.5);
      const ankleMidY = (lA.y + rA.y) / 2;
      const bodyHeight = Math.abs(nose.y - ankleMidY);
      const shoulderTilt = Math.abs(lS.y - rS.y);
      const hipTilt = Math.abs(lH.y - rH.y);
      const shoulderDepthDiff = Math.abs((lS.z || 0) - (rS.z || 0));
      const hipDepthDiff = Math.abs((lH.z || 0) - (rH.z || 0));
      const shoulderSpan = Math.abs(lS.x - rS.x);
      const centered = centerOffset < 0.1;
      const fullBody = bodyHeight > 0.58;
      const stable = shoulderTilt < 0.05 && hipTilt < 0.05;
      const aligned =
        ph === "front"
          ? shoulderDepthDiff < 0.13 && hipDepthDiff < 0.12
          : shoulderDepthDiff > 0.06 ||
            hipDepthDiff > 0.06 ||
            shoulderSpan < 0.12;
      const bodyFill = clamp(Math.round((bodyHeight / 0.76) * 100), 0, 100);

      const orientationScore =
        ph === "front"
          ? clamp(1 - (shoulderDepthDiff + hipDepthDiff) / 2 / 0.16, 0, 1)
          : clamp(
              (Math.max(shoulderDepthDiff, hipDepthDiff) - 0.02) / 0.08,
              0,
              1
            );

      const score = clamp(
        avgVis * 45 +
          clamp(1 - centerOffset / 0.18, 0, 1) * 18 +
          clamp((bodyHeight - 0.5) / 0.22, 0, 1) * 18 +
          clamp(1 - (shoulderTilt + hipTilt) / 0.14, 0, 1) * 8 +
          orientationScore * 11,
        0,
        100
      );

      let reason = "Hold still — improving accuracy";
      if (!fullBody)
        reason = "Step back so your full body and ankles are visible";
      else if (!centered) reason = "Center your body inside the guide frame";
      else if (!stable) reason = "Square your shoulders and hold still";
      else if (!aligned)
        reason =
          ph === "front"
            ? "Face the camera straight on"
            : "Turn fully sideways so one shoulder leads";
      else if (avgVis < 0.65)
        reason =
          "Improve lighting and keep your arms slightly away from your body";
      else
        reason =
          ph === "front"
            ? "Excellent — scanning front..."
            : "Excellent — scanning side...";

      return {
        ok:
          score >= (ph === "front" ? 72 : 68) &&
          fullBody &&
          centered &&
          stable &&
          aligned &&
          avgVis > 0.55,
        score: Math.round(score),
        avgVis,
        bodyFill,
        centered,
        stable,
        aligned,
        reason,
      };
    },
    [clamp]
  );

  const computeMeasurements = useCallback(
    (frontFrames, sideFrames) => {
      const frontLm = avgFrames(frontFrames);
      if (!frontLm) return null;
      const lS = frontLm[11],
        rS = frontLm[12],
        lH = frontLm[23],
        rH = frontLm[24],
        lA = frontLm[27],
        rA = frontLm[28],
        nose = frontLm[0];
      if (!lS || !rS || !lH || !rH || !lA || !rA || !nose) return null;
      const bodyH = Math.abs(nose.y - (lA.y + rA.y) / 2);
      if (bodyH < 0.05) return null;
      const scale = userHeight / bodyH;
      const shoulderW = Math.abs(lS.x - rS.x) * scale * 1.01;
      const hipW = Math.abs(lH.x - rH.x) * scale * 1.02;
      const waistW = (shoulderW * 0.48 + hipW * 0.52) * 0.78;

      // Use side scan data for depth if available, otherwise estimate from front
      let chestDepth, hipDepth, waistDepth;
      const sideLm = avgFrames(sideFrames);
      if (sideLm && sideLm[11] && sideLm[23]) {
        const sideBodyH = Math.abs(
          sideLm[0].y - (sideLm[27].y + sideLm[28].y) / 2
        );
        const sideScale = sideBodyH > 0.05 ? userHeight / sideBodyH : scale;
        const depthFromLandmarks = (a, b, fallback) => {
          const zDepth = Math.abs((a?.z || 0) - (b?.z || 0)) * sideScale * 2.15;
          const xDepth = Math.abs((a?.x || 0) - (b?.x || 0)) * sideScale;
          return Math.max(zDepth, xDepth, fallback);
        };
        chestDepth = depthFromLandmarks(
          sideLm[11],
          sideLm[12],
          shoulderW * 0.68
        );
        hipDepth = depthFromLandmarks(sideLm[23], sideLm[24], hipW * 0.72);
        waistDepth = clamp(
          ((chestDepth + hipDepth) / 2) *
            (waistW / Math.max((shoulderW + hipW) / 2, 1)),
          chestDepth * 0.72,
          hipDepth * 1.02
        );
      } else {
        chestDepth = shoulderW * 0.68;
        hipDepth = hipW * 0.7;
        waistDepth = ((chestDepth + hipDepth) / 2) * 0.82;
      }

      const ellipseC = (w, d) =>
        Math.PI * Math.sqrt(((w / 2) ** 2 + (d / 2) ** 2) / 2) * 2;
      const bustC = ellipseC(shoulderW * 0.95, chestDepth) * 1.08;
      const waistC = ellipseC(waistW, waistDepth);
      const hipC = ellipseC(hipW * 1.02, hipDepth) * 1.06;
      const inseam =
        Math.abs((lH.y + rH.y) / 2 - (lA.y + rA.y) / 2) * scale * 0.97;
      const round = v => Math.round(v * 2) / 2;
      return {
        bust: round(Math.max(28, Math.min(52, bustC))),
        waist: round(Math.max(20, Math.min(44, waistC))),
        hips: round(Math.max(30, Math.min(56, hipC))),
        inseam: round(Math.max(22, Math.min(36, inseam))),
        shoulder: round(Math.max(12, Math.min(20, shoulderW))),
      };
    },
    [userHeight, avgFrames, clamp]
  );

  const runScanPhase = useCallback(
    (framesTarget, durationMs, ph, onDone) => {
      const startTime = Date.now();
      let lastTime = -1;
      framesTarget.current = [];
      const targetFrames = ph === "front" ? 22 : 16;
      const maxDuration = durationMs + (ph === "front" ? 3500 : 3000);
      const tick = () => {
        if (!mountedRef.current) return;
        const video = videoRef.current,
          canvas = canvasRef.current;
        if (!video || !canvas || !landmarkerRef.current) return;
        const now = Date.now(),
          elapsed = now - startTime;
        const captureRatio = clamp(
          framesTarget.current.length / targetFrames,
          0,
          1
        );
        const timeRatio = clamp(elapsed / durationMs, 0, 1);
        setProgress(Math.round((captureRatio * 0.72 + timeRatio * 0.28) * 100));
        if (video.readyState >= 2 && video.currentTime !== lastTime) {
          lastTime = video.currentTime;
          try {
            const result = landmarkerRef.current.detectForVideo(video, now);
            const ctx = canvas.getContext("2d");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (result.landmarks?.length > 0) {
              const lm = result.landmarks[0];
              const frameQuality = evaluateFrame(lm, ph);
              if (frameQuality.ok) framesTarget.current.push([...lm]);
              const drawUtils = new DrawingUtils(ctx);
              drawUtils.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, {
                color: "rgba(201,169,110,0.6)",
                lineWidth: 2.5,
              });
              drawUtils.drawLandmarks(lm, {
                color: "rgba(201,169,110,0.9)",
                fillColor: "rgba(201,169,110,0.25)",
                lineWidth: 1,
                radius: 4,
              });
              setConfidence(
                Math.round(frameQuality.avgVis * 45 + frameQuality.score * 0.55)
              );
              setScanGuide({
                score: frameQuality.score,
                bodyFill: frameQuality.bodyFill,
                centered: frameQuality.centered,
                stable: frameQuality.stable,
                aligned: frameQuality.aligned,
              });
              if (
                framesTarget.current.length % 6 === 0 &&
                framesTarget.current.length >= 8
              ) {
                const liveEst = computeMeasurements(framesTarget.current, []);
                if (liveEst) setLiveM(liveEst);
              }
              setFeedback(frameQuality.reason);
            } else {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              setScanGuide({
                score: 0,
                bodyFill: 0,
                centered: false,
                stable: false,
                aligned: false,
              });
              setFeedback("No body detected — step into frame");
            }
          } catch (detectErr) {
            console.warn("Detection frame error:", detectErr);
          }
        }
        if (
          elapsed < durationMs ||
          (framesTarget.current.length < targetFrames && elapsed < maxDuration)
        ) {
          animRef.current = requestAnimationFrame(tick);
        } else {
          onDone(framesTarget.current);
        }
      };
      animRef.current = requestAnimationFrame(tick);
    },
    [computeMeasurements, evaluateFrame, clamp]
  );

  const startScan = useCallback(() => {
    if (!landmarkerRef.current || !videoRef.current) return;
    setPhase("front");
    setProgress(0);
    setLiveM(null);
    setConfidence(0);
    setScanGuide({
      score: 0,
      bodyFill: 0,
      centered: false,
      stable: false,
      aligned: false,
    });
    setFeedback("Stand facing forward, arms slightly out");
    runScanPhase(frontFramesRef, 6500, "front", frontFrames => {
      if (!mountedRef.current) return;
      if (frontFrames.length < 18) {
        setPhase("ready");
        setFeedback(
          `Only ${frontFrames.length} high-quality front frames captured — face the camera straight on and keep your full body inside the guide.`
        );
        return;
      }
      setPhase("turning");
      setProgress(0);
      setTurnCountdown(3);
      let count = 3;
      countdownRef.current = setInterval(() => {
        if (!mountedRef.current) {
          clearInterval(countdownRef.current);
          return;
        }
        count--;
        setTurnCountdown(count);
        if (count <= 0) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          if (!mountedRef.current) return;
          setPhase("side");
          setFeedback("Hold side profile still...");
          runScanPhase(sideFramesRef, 5200, "side", sideFrames => {
            if (!mountedRef.current) return;
            if (sideFrames.length < 12) {
              setPhase("ready");
              setFeedback(
                `Only ${sideFrames.length} clear side frames captured — turn fully sideways and keep shoulders stacked.`
              );
              return;
            }
            setPhase("processing");
            processingRef.current = setTimeout(() => {
              if (!mountedRef.current) return;
              const meas = computeMeasurements(frontFrames, sideFrames);
              if (meas) {
                setMeasurements(meas);
                setPhase("done");
                setFeedback("Scan complete!");
              } else {
                setPhase("ready");
                setFeedback(
                  "Couldn't compute measurements — try standing further back with arms slightly out"
                );
              }
              processingRef.current = null;
            }, 600);
          });
        }
      }, 1000);
    });
  }, [runScanPhase, computeMeasurements]);

  const handleRetry = useCallback(() => {
    // Cleanup existing resources
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (processingRef.current) {
      clearTimeout(processingRef.current);
      processingRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (landmarkerRef.current) {
      try {
        landmarkerRef.current.close();
      } catch (e) {}
      landmarkerRef.current = null;
    }
    setPhase("loading");
    setFeedback("Retrying...");
    setConfidence(0);
    setProgress(0);
    setLiveM(null);
    setMeasurements(null);
    setScanGuide({
      score: 0,
      bodyFill: 0,
      centered: false,
      stable: false,
      aligned: false,
    });
    setRetryCount(c => c + 1);
  }, []);

  const confirmMeasurements = useCallback(() => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    onScanComplete(measurements);
  }, [measurements, onScanComplete]);

  const isActive = phase === "front" || phase === "side";
  const totalFrames =
    frontFramesRef.current.length + sideFramesRef.current.length;
  const accuracy = Math.min(96, 72 + Math.round(totalFrames / 4));

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
      {(phase === "front" || phase === "side" || phase === "turning") && (
        <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 320 }}>
          {["FRONT", "SIDE"].map((label, i) => {
            const done = i === 0 && (phase === "side" || phase === "turning"),
              active =
                (i === 0 && phase === "front") || (i === 1 && phase === "side");
            return (
              <div
                key={label}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: active
                    ? C.goldBg
                    : done
                      ? "rgba(74,222,128,0.1)"
                      : C.card,
                  border: `1px solid ${active ? C.goldBorder : done ? C.successBorder : C.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: active ? C.gold : done ? C.success : C.border,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: active ? C.gold : done ? C.success : C.muted,
                    letterSpacing: 1,
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
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
          border: `1px solid ${isActive ? C.goldBorder : C.border}`,
          background: "#000",
          boxShadow: isActive ? `0 0 40px rgba(201,169,110,0.2)` : "none",
          transition: "all 0.3s",
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: facingMode === "user" ? "scaleX(-1)" : "none",
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            transform: facingMode === "user" ? "scaleX(-1)" : "none",
          }}
        />
        {(phase === "ready" || isActive) && (
          <>
            <div
              style={{
                position: "absolute",
                left: "18%",
                right: "18%",
                top: "10%",
                bottom: "10%",
                borderRadius: 28,
                border: `1px dashed ${isActive ? C.goldBorder : C.borderLight}`,
                boxShadow: `inset 0 0 0 1px ${isActive ? "rgba(215,176,108,0.14)" : "rgba(255,255,255,0.04)"}`,
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
              background: "rgba(0,0,0,0.85)",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                border: `2px solid ${C.border}`,
                borderTopColor: C.gold,
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p
              style={{
                fontSize: 12,
                color: C.muted,
                margin: 0,
                textAlign: "center",
                padding: "0 24px",
              }}
            >
              {feedback}
            </p>
            {loadProgress && (
              <p
                style={{ fontSize: 10, color: C.gold, margin: 0, opacity: 0.7 }}
              >
                {loadProgress}
              </p>
            )}
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
              Face your left side to the camera
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
        {phase === "processing" && (
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
              Computing 3D measurements...
            </p>
          </div>
        )}
        {isActive && confidence > 0 && (
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
                  confidence > 70
                    ? C.success
                    : confidence > 40
                      ? C.warning
                      : C.danger,
              }}
            />
            <span style={{ fontSize: 10, fontWeight: 700, color: C.accent }}>
              {confidence}%
            </span>
          </div>
        )}
        {isActive && (
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
              minWidth: 118,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                Quality
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color:
                    scanGuide.score >= 72
                      ? C.success
                      : scanGuide.score >= 55
                        ? C.warning
                        : C.danger,
                }}
              >
                {scanGuide.score}%
              </span>
            </div>
            {[
              ["Centered", scanGuide.centered],
              ["Full body", scanGuide.bodyFill >= 75],
              [
                phase === "front" ? "Facing front" : "Turned side",
                scanGuide.aligned && scanGuide.stable,
              ],
            ].map(([label, ok]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 9, color: C.mutedLight }}>
                  {label}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: ok ? C.success : C.muted,
                  }}
                >
                  {ok ? "OK" : "Fix"}
                </span>
              </div>
            ))}
          </div>
        )}
        {isActive && (
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
              {phase === "front"
                ? frontFramesRef.current.length
                : sideFramesRef.current.length}{" "}
              high-quality frames captured
            </span>
          </div>
        )}
      </div>
      {isActive && (
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
      {phase !== "turning" && phase !== "loading" && phase !== "processing" && (
        <p
          style={{
            fontSize: 12,
            color:
              phase === "error"
                ? C.danger
                : phase === "done"
                  ? C.success
                  : isActive
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
      {isActive && liveM && (
        <div
          style={{
            width: "100%",
            maxWidth: 320,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 6,
          }}
        >
          {[
            ["bust", liveM.bust],
            ["waist", liveM.waist],
            ["hips", liveM.hips],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                padding: "6px 8px",
                background: C.goldBg,
                border: `1px solid ${C.goldBorder}`,
                borderRadius: 8,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: C.goldLight,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {k}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>
                {v}"
              </div>
            </div>
          ))}
        </div>
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
              ~{accuracy}% accuracy · {totalFrames} frames · 3D elliptical model
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
              setLiveM(null);
              setFeedback("Stand 6–8 ft away so your full body is visible");
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
            boxShadow: `0 4px 20px rgba(201,169,110,0.3)`,
          }}
        >
          Start 3D Body Scan
        </button>
      )}
      {phase === "error" && (
        <div
          style={{
            width: "100%",
            maxWidth: 320,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button
            onClick={handleRetry}
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 12,
              border: "none",
              background: `linear-gradient(135deg,${C.gold},${C.goldDark})`,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retry Scanner
          </button>
          <button
            onClick={onCancel}
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
            }}
          >
            Enter Manually Instead
          </button>
        </div>
      )}
      {(phase === "ready" || isActive) && (
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
    color: "#C4A882",
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
    color: "#CC0000",
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
    color: "#D31334",
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
    color: "#FF0000",
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
    color: "#C4A67A",
    colors: ["#C4A67A", "#1a1a1a", "#F5F0E8"],
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
    color: "#C4A882",
    colors: ["#C4A882", "#1a1a1a", "#F5F0E8", "#8B4A5A", "#6A5A4A"],
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
    colors: ["#E8E5E0", "#C4956a", "#6A8FA8", "#2D2D2D", "#8B4A5A"],
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
    colors: ["#F5F0E8", "#1a1a1a", "#C4956a", "#6A8FA8"],
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
    colors: ["#E8E5E0", "#1a1a1a", "#A0B8A0", "#C4956a"],
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
    colors: ["#E8E0D4", "#1A1A1A", "#C4A67A"],
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
    colors: ["#2D2D2D", "#D31334", "#4A6480"],
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
    color: "#C4A67A",
    colors: ["#C4A67A", "#E8E5E0", "#D4A5A5"],
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
    colors: ["#F5F0E8", "#1A1A1A", "#6A8FA8", "#D4A5A5", "#C4A67A"],
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
    colors: ["#2D2D2D", "#E8E0D4", "#C4A67A"],
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
    color: "#C4A67A",
    colors: ["#C4A67A", "#1A1A1A", "#F5F0E8"],
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
    colors: ["#5A6B4A", "#1A1A1A", "#E8E5E0", "#C4A882"],
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
    color: "#C4A882",
    colors: ["#C4A882", "#1A1A1A", "#D4A5A5", "#87CEEB"],
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
    colors: ["#F5F0E8", "#1A1A1A", "#D31334"],
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
    color: "#C4A882",
    colors: ["#C4A882", "#1A1A1A", "#D4A5A5"],
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
    colors: ["#2D2D2D", "#C4A67A", "#F5F0E8"],
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
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: C.accent,
        transition: "all 0.2s",
        gap: 4,
        padding: label ? "0 12px 0 8px" : "0 10px",
      }}
    >
      <ChevronLeft size={18} />
      {label && <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>}
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

  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(145deg, ${item.color} 0%, ${item.color}88 100%)`,
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
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              border: `1px solid ${C.border}`,
              borderRadius: 20,
              background:
                "radial-gradient(circle at top, rgba(255,255,255,0.16), transparent 48%), rgba(10,10,10,0.22)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: 18,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: C.gold,
                  marginBottom: 10,
                }}
              >
                {item.brand}
              </div>
              <div
                style={{
                  fontSize: "clamp(18px, 4vw, 28px)",
                  lineHeight: 1,
                  color: "rgba(255,255,255,0.18)",
                  fontFamily: font.serif,
                }}
              >
                {item.category}
              </div>
            </div>
            <div
              style={{
                alignSelf: "flex-start",
                padding: "10px 14px",
                borderRadius: 999,
                border: `1px solid ${C.border}`,
                background: "rgba(10,10,10,0.22)",
                color: C.accent,
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              Photo unavailable
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
              "linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
            animation: "pulse 1.4s ease-in-out infinite",
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
      ? C.goldBg
      : "rgba(255,255,255,0.1)"
    : "transparent";
  const border = active
    ? gold
      ? C.goldBorder
      : "rgba(255,255,255,0.15)"
    : C.border;
  const color = active ? (gold ? C.gold : C.accent) : C.muted;
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 16px",
        borderRadius: 20,
        border: `1px solid ${border}`,
        background: bg,
        color,
        fontSize: 11,
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "all 0.2s",
        letterSpacing: 0.3,
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
          <p className="tb-sidebar-eyebrow">Fit Intelligence</p>
          <h1 className="tb-brand-lockup__title">The Tailored Company</h1>
          <p className="tb-sidebar-copy">
            Fashion that fits every body. Body-scanned measurements, fit-scored
            across 20 brands, and a circular wardrobe with fewer returns.
          </p>
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
          <div className="tb-sidebar-stats">
            <div>
              <span className="tb-sidebar-stat__value">
                {inferBodyShape(userBody)}
              </span>
              <span className="tb-sidebar-stat__label">Shape profile</span>
            </div>
            <div>
              <span className="tb-sidebar-stat__value">
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
            "radial-gradient(circle, rgba(210,180,140,0.40) 0%, transparent 70%)",
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
              fontSize: 48,
              fontWeight: 500,
              color: C.accent,
              lineHeight: 1.05,
              margin: 0,
              letterSpacing: -1.5,
            }}
          >
            Fashion that fits
            <br />
            <span style={{ color: C.clay, fontStyle: "italic", fontWeight: 600 }}>
              every body.
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
              lineHeight: 1.7,
              maxWidth: 280,
              margin: 0,
            }}
          >
            Shop any retailer with MediaPipe-powered body scanning, real-time
            fit scoring across 20 brands, professional tailoring, and a
            measurement-matched circular wardrobe.
          </p>
        </div>

        <div
          className="tb-splash__features"
          style={{
            opacity: phase >= 3 ? 1 : 0,
            transition: "opacity 0.7s 0.5s",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            width: "100%",
            maxWidth: 280,
            marginTop: 8,
          }}
        >
          {[
            { Icon: CameraIcon, text: "33 pose landmarks · under 60 seconds" },
            { Icon: TargetIcon, text: "Real-time fit scoring · 85 pieces, 20 brands" },
            { Icon: ScissorsIcon, text: "Professional tailoring · circular resale" },
          ].map(({ Icon, text }) => (
            <div
              key={text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(8px)",
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                boxShadow: "0 4px 14px rgba(75,65,52,0.06)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: C.goldBg,
                  border: `1px solid ${C.goldBorder}`,
                  color: C.forest,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={16} />
              </div>
              <span style={{ fontSize: 13, color: C.accent, fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="tb-splash__cta"
        style={{
          width: "100%",
          maxWidth: 320,
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? "translateY(0)" : "translateY(12px)",
          transition: "all 0.7s cubic-bezier(0.22,1,0.36,1) 0.6s",
        }}
      >
        <button
          onClick={onContinue}
          style={{
            width: "100%",
            padding: "18px 0",
            borderRadius: 16,
            border: "none",
            background: `linear-gradient(135deg, ${C.forest}, ${C.forestDeep})`,
            color: C.cream,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 0.6,
            cursor: "pointer",
            boxShadow: `0 12px 32px rgba(107,142,90,0.38)`,
          }}
        >
          Build Your Fit Profile
        </button>
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: C.muted,
            marginTop: 14,
          }}
        >
          Private on-device profile · Works across retailers
        </p>
      </div>
    </div>
  );
}

// ─── Onboarding Screen ─────────────────────────────────────
function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState("choose");
  const [useMetric, setUseMetric] = useState(false);
  const [body, setBody] = useState({ ...DEFAULT_BODY });
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(5);
  const [heightCm, setHeightCm] = useState(165);
  const [scanning, setScanning] = useState(false);

  const heightInches = useMetric
    ? Math.round(heightCm / 2.54)
    : heightFt * 12 + heightIn;

  const handleScanComplete = meas => {
    setBody(meas);
    setScanning(false);
    setStep("review");
  };

  const SliderRow = ({ label, key2, min, max, unit = '"', step2 = 0.5 }) => (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 13, color: C.accent, fontWeight: 500 }}>
          {label}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>
          {body[key2]}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step2}
        value={body[key2]}
        onChange={e =>
          setBody(b => ({ ...b, [key2]: parseFloat(e.target.value) }))
        }
        style={{ width: "100%", accentColor: C.gold, cursor: "pointer" }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
        }}
      >
        <span style={{ fontSize: 9, color: C.muted }}>
          {min}
          {unit}
        </span>
        <span style={{ fontSize: 9, color: C.muted }}>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );

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
              3D Body Scan
            </h2>
            <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
              MediaPipe · 33 pose landmarks · under 60 seconds, on-device
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
            onCancel={() => setScanning(false)}
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
                  background: C.goldBg,
                  border: `1px solid ${C.goldBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CameraIcon size={22} />
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
                    AI Body Scan
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
                  Phone camera capture · MediaPipe locks 33 body landmarks in
                  under 60 seconds. Frames stay on your device.
                </p>
              </div>
            </div>
          </GlassCard>

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
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <MeasureIcon size={20} />
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
                  Enter Manually
                </span>
                <p
                  style={{
                    fontSize: 12,
                    color: C.muted,
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  Enter measurements from a tape measure or clothing label for a
                  direct, controlled setup.
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
    return (
      <div
        className="tb-screen tb-screen--onboarding-manual"
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
            marginBottom: 8,
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
            <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
              Drag sliders to match your measurements
            </p>
          </div>
        </div>

        <div
          className="tb-screen__body tb-onboarding-manual__body"
          style={{ flex: 1, padding: "16px 18px 100px", overflow: "auto" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
              padding: "10px 14px",
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
            }}
          >
            <span style={{ fontSize: 12, color: C.muted }}>Units</span>
            <div style={{ display: "flex", gap: 6 }}>
              <Pill
                label="in / ft"
                active={!useMetric}
                onClick={() => setUseMetric(false)}
              />
              <Pill
                label="cm / m"
                active={useMetric}
                onClick={() => setUseMetric(true)}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <p
              style={{
                fontSize: 11,
                color: C.gold,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontWeight: 600,
                marginBottom: 14,
              }}
            >
              Height
            </p>
            {useMetric ? (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{ fontSize: 13, color: C.accent, fontWeight: 500 }}
                  >
                    Height
                  </span>
                  <span
                    style={{ fontSize: 14, fontWeight: 700, color: C.gold }}
                  >
                    {heightCm} cm
                  </span>
                </div>
                <input
                  type="range"
                  min={140}
                  max={200}
                  step={1}
                  value={heightCm}
                  onChange={e => setHeightCm(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: C.gold }}
                />
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 13, color: C.accent }}>Feet</span>
                    <span
                      style={{ fontSize: 14, fontWeight: 700, color: C.gold }}
                    >
                      {heightFt}ft
                    </span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={7}
                    step={1}
                    value={heightFt}
                    onChange={e => setHeightFt(parseInt(e.target.value))}
                    style={{ width: "100%", accentColor: C.gold }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 13, color: C.accent }}>
                      Inches
                    </span>
                    <span
                      style={{ fontSize: 14, fontWeight: 700, color: C.gold }}
                    >
                      {heightIn}"
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={11}
                    step={1}
                    value={heightIn}
                    onChange={e => setHeightIn(parseInt(e.target.value))}
                    style={{ width: "100%", accentColor: C.gold }}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ height: 1, background: C.border, marginBottom: 24 }} />
          <p
            style={{
              fontSize: 11,
              color: C.gold,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            Body Measurements
          </p>
          <SliderRow label="Bust / Chest" key2="bust" min={28} max={52} />
          <SliderRow label="Waist" key2="waist" min={20} max={44} />
          <SliderRow label="Hips" key2="hips" min={30} max={56} />
          <SliderRow label="Inseam" key2="inseam" min={22} max={36} />
          <SliderRow label="Shoulder Width" key2="shoulder" min={12} max={20} />

          <div
            className="tb-onboarding-preview"
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 8,
              marginBottom: 16,
            }}
          >
            <Body3DViewer
              body={body}
              width={200}
              height={280}
              autoRotate
              annotated
              variant="studio"
            />
          </div>
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
          <button
            onClick={() => onComplete(body)}
            style={{
              width: "100%",
              padding: "15px 0",
              borderRadius: 12,
              border: "none",
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 1,
              cursor: "pointer",
            }}
          >
            Save & Start Shopping
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
              Scan complete — review below
            </p>
          </div>
        </div>
        <div
          className="tb-screen__body"
          style={{ flex: 1, padding: "0 18px 100px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Body3DViewer
              body={body}
              width={240}
              height={340}
              autoRotate
              annotated
              variant="scan"
            />
          </div>
          <div
            className="tb-review-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 20,
            }}
          >
            {Object.entries(body).map(([k, v]) => (
              <GlassCard key={k} style={{ padding: "12px 14px" }}>
                <div
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    textTransform: "capitalize",
                    marginBottom: 4,
                  }}
                >
                  {k}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.gold }}>
                  {v}"
                </div>
              </GlassCard>
            ))}
          </div>
          <div
            style={{
              padding: "12px 14px",
              background: C.successBg,
              border: `1px solid ${C.successBorder}`,
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <CheckCircle size={16} />
              <p
                style={{
                  fontSize: 12,
                  color: C.success,
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                Measurements captured successfully. You can fine-tune these
                anytime in your profile.
              </p>
            </div>
          </div>
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
          <button
            onClick={() => onComplete(body)}
            style={{
              width: "100%",
              padding: "15px 0",
              borderRadius: 12,
              border: "none",
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 1,
              cursor: "pointer",
            }}
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }
  return null;
}

// ─── Home Screen ───────────────────────────────────────────
function HomeScreen({
  catalog,
  onItemClick,
  favorites,
  toggleFav,
  onNav,
  userBody,
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("fit");
  const categories = ["All", "Tops", "Bottoms", "Dresses", "Outerwear"];

  const filtered = useMemo(() => {
    let items = catalog;
    if (search)
      items = items.filter(
        i =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.brand.toLowerCase().includes(search.toLowerCase())
      );
    if (category !== "All") items = items.filter(i => i.category === category);
    if (sortBy === "fit") items = [...items].sort((a, b) => b.fit - a.fit);
    else if (sortBy === "price_asc")
      items = [...items].sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc")
      items = [...items].sort((a, b) => b.price - a.price);
    return items;
  }, [catalog, search, category, sortBy]);

  const topPicks = useMemo(
    () =>
      catalog
        .filter(i => i.fit >= 90)
        .sort((a, b) => b.fit - a.fit)
        .slice(0, 5),
    [catalog]
  );
  const avgFit = Math.round(
    catalog.reduce((s, i) => s + i.fit, 0) / catalog.length
  );
  const perfectFits = catalog.filter(i => i.fit >= 90).length;

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
              Your Edit
            </h2>
            <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
              {perfectFits} ready-to-order fits · avg {avgFit}% match
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                color: C.muted,
                fontSize: 11,
                padding: "6px 10px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="fit">Best Fit</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <div
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <SearchIcon size={15} />
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search brands, pieces, or categories..."
            style={{
              width: "100%",
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "10px 12px 10px 36px",
              color: C.accent,
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Category pills */}
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 12,
            scrollbarWidth: "none",
          }}
        >
          {categories.map(c => (
            <Pill
              key={c}
              label={c}
              active={category === c}
              onClick={() => setCategory(c)}
            />
          ))}
        </div>
      </div>

      <div
        className="tb-screen__body"
        style={{ flex: 1, overflow: "auto", padding: "0 18px 90px" }}
      >
        {/* Top Picks Hero */}
        {!search && category === "All" && (
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TargetIcon size={14} />
                <span
                  style={{ fontSize: 13, fontWeight: 600, color: C.accent }}
                >
                  Most Ready to Order
                </span>
              </div>
              <button
                onClick={() => setSortBy("fit")}
                style={{
                  background: "none",
                  border: "none",
                  color: C.gold,
                  fontSize: 11,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                See all →
              </button>
            </div>
            <div
              className="tb-top-picks-row"
              style={{
                display: "flex",
                gap: 12,
                overflowX: "auto",
                scrollbarWidth: "none",
                paddingBottom: 4,
              }}
            >
              {topPicks.map(item => (
                <div
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  style={{ flexShrink: 0, width: 150, cursor: "pointer" }}
                >
                  <GlassCard hover style={{ overflow: "hidden" }}>
                    <ProductImage item={item} style={{ height: 160 }}>
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
                          fontSize: 13,
                          fontWeight: 700,
                          color: C.accent,
                          marginTop: 4,
                        }}
                      >
                        ${item.price}
                      </div>
                    </div>
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fit confidence summary */}
        {!search && category === "All" && (
          <div
            className="tb-home-summary"
            style={{
              padding: "14px 16px",
              background: C.goldBg,
              border: `1px solid ${C.goldBorder}`,
              borderRadius: 14,
              marginBottom: 20,
              display: "flex",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  color: C.goldLight,
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                Your Fit Profile
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.gold }}>
                {avgFit}%
              </div>
              <div style={{ fontSize: 10, color: C.muted }}>
                average match across {catalog.length} items
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                ["Perfect (90%+)", perfectFits, C.success],
                [
                  "Good (75–89%)",
                  catalog.filter(i => i.fit >= 75 && i.fit < 90).length,
                  C.warning,
                ],
                [
                  "Fair (<75%)",
                  catalog.filter(i => i.fit < 75).length,
                  C.danger,
                ],
              ].map(([label, count, color]) => (
                <div
                  key={label}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: color,
                    }}
                  />
                  <span style={{ fontSize: 10, color: C.muted }}>{label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        <div
          className="tb-catalog-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {filtered.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => onItemClick(item)}
              isFav={favorites.has(item.id)}
              toggleFav={toggleFav}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                border: `1px solid ${C.border}`,
                background: C.card,
                color: C.gold,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <SearchIcon size={20} />
            </div>
            <p style={{ fontSize: 14, color: C.muted }}>
              No items found for "{search}"
            </p>
          </div>
        )}
      </div>
      <NavBar active="home" onNav={onNav} />
    </div>
  );
}

// ─── Trending Screen ───────────────────────────────────────
function TrendingScreen({ catalog, onItemClick, favorites, toggleFav, onNav }) {
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

        {/* Trend stats banner */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 16,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {[
            { key: "demand", count: demandSignals.length },
            { key: "editorial", count: editorialPicks.length },
            { key: "staple", count: clientFavorites.length },
            { key: "seasonal", count: seasonalSignals.length },
          ].map(({ key, count }) => {
            const { statLabel, color, Icon } = TREND_SECTION_META[key];
            return (
              <div
                key={key}
                style={{
                  flexShrink: 0,
                  padding: "10px 14px",
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ color, display: "flex" }}>
                  <Icon size={16} />
                </div>
                <div>
                  <div
                    style={{ fontSize: 14, fontWeight: 700, color: C.accent }}
                  >
                    {count}
                  </div>
                  <div
                    style={{ fontSize: 9, color: C.muted, letterSpacing: 0.5 }}
                  >
                    {statLabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="tb-screen__body"
        style={{ flex: 1, overflow: "auto", padding: "0 18px 90px" }}
      >
        {!!demandSignals.length && (
          <Section
            title={TREND_SECTION_META.demand.title}
            IconComp={TREND_SECTION_META.demand.Icon}
            items={demandSignals}
            color={TREND_SECTION_META.demand.color}
          />
        )}
        {!!editorialPicks.length && (
          <Section
            title={TREND_SECTION_META.editorial.title}
            IconComp={TREND_SECTION_META.editorial.Icon}
            items={editorialPicks}
            color={TREND_SECTION_META.editorial.color}
          />
        )}
        {!!clientFavorites.length && (
          <Section
            title={TREND_SECTION_META.staple.title}
            IconComp={TREND_SECTION_META.staple.Icon}
            items={clientFavorites}
            color={TREND_SECTION_META.staple.color}
          />
        )}
        {!!seasonalSignals.length && (
          <Section
            title={TREND_SECTION_META.seasonal.title}
            IconComp={TREND_SECTION_META.seasonal.Icon}
            items={seasonalSignals}
            color={TREND_SECTION_META.seasonal.color}
          />
        )}
        <Section
          title="All Active Signals"
          IconComp={TrendingUpIcon}
          items={trendingItems}
        />
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
            const topFit = items.length
              ? Math.max(...items.map(i => i.fit))
              : 0;
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
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: b.color || "#1a1a1a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid rgba(255,255,255,0.1)`,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}
                    >
                      {b.logo}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.accent,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {b.name}
                    </div>
                    <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>
                      {items.length} items
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

// ─── Item Detail Screen ─────────────────────────────────────
function ItemDetailScreen({
  item,
  onBack,
  isFav,
  toggleFav,
  onSendToTailor,
  userBody,
}) {
  const [showTryOn, setShowTryOn] = useState(false);
  const [tryOnSize, setTryOnSize] = useState(item.bestSize);
  const [tryOnColor, setTryOnColor] = useState(item.color);
  const [showFitMap, setShowFitMap] = useState(false);
  const [activeTab, setActiveTab] = useState("fit");
  const sizes = Object.entries(item.measurements);
  const colors = item.colors || [item.color];
  const reviews = [
    {
      initials: "A.M.",
      meas: "34-26-36, 5'6\"",
      kept: true,
      note:
        item.fit >= 94
          ? "Fit perfectly, kept it"
          : "Slight fit issue but kept it",
    },
    {
      initials: "J.R.",
      meas: "33-25-35, 5'5\"",
      kept: item.fit >= 90,
      note:
        item.fit >= 90
          ? "Ordered usual size, fits great"
          : "Runs small — size up",
    },
    {
      initials: "C.L.",
      meas: "35-27-37, 5'7\"",
      kept: true,
      note: item.sizingNote,
    },
  ];
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
          padding: "14px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(10,10,10,0.9)",
          backdropFilter: "blur(16px)",
        }}
      >
        <BackButton onClick={onBack} />
        <button
          onClick={() => toggleFav(item.id)}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
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
                marginBottom: 14,
                border: `1px solid ${showTryOn ? C.goldBorder : C.border}`,
                transition: "border-color 0.3s",
              }}
            >
              {showTryOn ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px 0 12px",
                    background: C.bgElevated,
                    position: "relative",
                  }}
                >
                  <Body3DViewer
                    body={userBody}
                    width={300}
                    height={400}
                    garment={{ ...item, color: tryOnColor }}
                    autoRotate
                  />
                  {showFitMap && (
                    <div
                      style={{
                        position: "absolute",
                        top: 16,
                        left: 16,
                        right: 16,
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 4,
                          justifyContent: "center",
                        }}
                      >
                        {fitRegions.map(r => (
                          <div
                            key={r.label}
                            style={{
                              padding: "3px 8px",
                              borderRadius: 6,
                              background:
                                r.score >= 90
                                  ? "rgba(74,222,128,0.3)"
                                  : r.score >= 75
                                    ? "rgba(251,191,36,0.3)"
                                    : "rgba(248,113,113,0.3)",
                              border: `1px solid ${r.score >= 90 ? C.successBorder : r.score >= 75 ? C.warningBorder : "rgba(248,113,113,0.3)"}`,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 8,
                                color: C.muted,
                                textAlign: "center",
                              }}
                            >
                              {r.label}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color:
                                  r.score >= 90
                                    ? C.success
                                    : r.score >= 75
                                      ? C.warning
                                      : C.danger,
                                textAlign: "center",
                              }}
                            >
                              {r.score}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {colors.length > 1 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 10,
                        justifyContent: "center",
                      }}
                    >
                      {colors.map(c => (
                        <button
                          key={c}
                          onClick={() => setTryOnColor(c)}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: c,
                            border: `2px solid ${tryOnColor === c ? C.gold : "transparent"}`,
                            outline:
                              tryOnColor === c ? `1px solid ${C.gold}` : "none",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            boxShadow: "0 0 0 1px rgba(255,255,255,0.1)",
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginTop: 10,
                      flexWrap: "wrap",
                      justifyContent: "center",
                      padding: "0 16px",
                    }}
                  >
                    {sizes.map(([sz]) => (
                      <button
                        key={sz}
                        onClick={() => setTryOnSize(sz)}
                        style={{
                          padding: "4px 12px",
                          borderRadius: 8,
                          border: `1px solid ${tryOnSize === sz ? C.goldBorder : C.border}`,
                          background:
                            tryOnSize === sz ? C.goldBg : "transparent",
                          color: tryOnSize === sz ? C.gold : C.muted,
                          fontSize: 10,
                          fontWeight: tryOnSize === sz ? 700 : 500,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginTop: 8,
                      alignItems: "center",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 9,
                        color: C.muted,
                        letterSpacing: 0.5,
                      }}
                    >
                      Drag to rotate · Size {tryOnSize}
                    </p>
                    <button
                      onClick={() => setShowFitMap(f => !f)}
                      style={{
                        fontSize: 9,
                        color: showFitMap ? C.gold : C.muted,
                        background: "none",
                        border: `1px solid ${showFitMap ? C.goldBorder : C.border}`,
                        borderRadius: 6,
                        padding: "2px 8px",
                        cursor: "pointer",
                      }}
                    >
                      Fit Map
                    </button>
                  </div>
                </div>
              ) : (
                <ProductImage item={item} style={{ height: 340 }} />
              )}
            </div>

            <div
              className="tb-item-detail__toggle"
              style={{ display: "flex", gap: 8, marginBottom: 18 }}
            >
              <button
                onClick={() => setShowTryOn(false)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: `1px solid ${!showTryOn ? C.goldBorder : C.border}`,
                  background: !showTryOn ? C.goldBg : "transparent",
                  color: !showTryOn ? C.gold : C.muted,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Photo
              </button>
              <button
                onClick={() => setShowTryOn(true)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: `1px solid ${showTryOn ? C.goldBorder : C.border}`,
                  background: showTryOn ? C.goldBg : "transparent",
                  color: showTryOn ? C.gold : C.muted,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Virtual Try-On
              </button>
            </div>
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
                  Sourced from {item.brand}
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
                ["fit", "Fit Intelligence"],
                ["size", "Size Chart"],
                ["reviews", "Reviews"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 9,
                    border: "none",
                    background: activeTab === id ? C.bgElevated : "transparent",
                    color: activeTab === id ? C.accent : C.muted,
                    fontSize: 11,
                    fontWeight: activeTab === id ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {label}
                </button>
              ))}
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
                      fontSize: 11,
                      color: "rgba(250,250,249,0.75)",
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
                      fontSize: 11,
                      color: C.goldLight,
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {item.sizingNote}
                  </p>
                </div>
                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
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

            {activeTab === "reviews" && (
              <GlassCard style={{ padding: 18, marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.accent,
                      margin: 0,
                    }}
                  >
                    Community Reviews
                  </p>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <span
                      style={{ fontSize: 14, fontWeight: 700, color: C.gold }}
                    >
                      {(
                        (reviews.filter(r => r.kept).length / reviews.length) *
                        5
                      ).toFixed(1)}
                    </span>
                    <span style={{ fontSize: 10, color: C.muted }}>/ 5</span>
                  </div>
                </div>
                {reviews.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "12px 0",
                      borderBottom:
                        i < reviews.length - 1
                          ? `1px solid ${C.border}`
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: C.goldBg,
                            border: `1px solid ${C.goldBorder}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: C.gold,
                            }}
                          >
                            {r.initials}
                          </span>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: C.accent,
                            }}
                          >
                            {r.initials}
                          </div>
                          <div style={{ fontSize: 9, color: C.muted }}>
                            {r.meas}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: r.kept
                            ? C.successBg
                            : "rgba(248,113,113,0.1)",
                          border: `1px solid ${r.kept ? C.successBorder : "rgba(248,113,113,0.2)"}`,
                          fontSize: 9,
                          fontWeight: 600,
                          color: r.kept ? C.success : C.danger,
                        }}
                      >
                        {r.kept ? "Kept" : "Returned"}
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: 11,
                        color: C.mutedLight,
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {r.note}
                    </p>
                  </div>
                ))}
              </GlassCard>
            )}

            <div
              className="tb-item-detail__actions"
              style={{ display: "flex", gap: 10 }}
            >
              <button
                onClick={() => onSendToTailor(item)}
                style={{
                  flex: 1,
                  padding: "14px 0",
                  borderRadius: 12,
                  border: `1px solid ${C.tailorBorder}`,
                  background: C.tailorBg,
                  color: C.tailor,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <ScissorsIcon size={14} /> Build Alteration Brief
              </button>
              {item.url && (
                <button
                  onClick={() =>
                    window.open(item.url, "_blank", "noopener,noreferrer")
                  }
                  style={{
                    flex: 2,
                    padding: "14px 0",
                    borderRadius: 12,
                    border: "none",
                    background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Shop at {item.brand} →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
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
          Generate a real wardrobe brief from your measurements, fit data, and
          shopping intent.
        </p>
      </div>

      <div
        className="tb-screen__body"
        style={{ flex: 1, overflow: "auto", padding: "0 18px 90px" }}
      >
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
                <div style={{ display: "grid", gap: 8 }}>
                  {STYLE_PALETTES.map(option => (
                    <Pill
                      key={option}
                      label={option}
                      active={palette === option}
                      onClick={() => setPalette(option)}
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
  onUpdateBody,
  favorites,
  catalog,
  onNav,
  tailorOrders,
}) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState({ ...userBody });
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
              onUpdateBody(editBody);
              setEditing(false);
            }}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
        <div
          className="tb-screen__body"
          style={{ flex: 1, padding: "0 18px 40px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 20,
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
          {Object.entries(editBody).map(([key, val]) => {
            const ranges = {
              bust: [28, 52],
              waist: [20, 44],
              hips: [30, 56],
              inseam: [22, 36],
              shoulder: [12, 20],
            };
            const [min, max] = ranges[key] || [10, 60];
            return (
              <div key={key} style={{ marginBottom: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: C.accent,
                      fontWeight: 500,
                      textTransform: "capitalize",
                    }}
                  >
                    {key}
                  </span>
                  <span
                    style={{ fontSize: 14, fontWeight: 700, color: C.gold }}
                  >
                    {val}"
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={0.5}
                  value={val}
                  onChange={e =>
                    setEditBody(b => ({
                      ...b,
                      [key]: parseFloat(e.target.value),
                    }))
                  }
                  style={{ width: "100%", accentColor: C.gold }}
                />
              </div>
            );
          })}
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
        {/* Body preview */}
        <GlassCard
          className="tb-profile-overview"
          style={{ padding: 20, marginBottom: 16 }}
        >
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <Body3DViewer
              body={userBody}
              width={140}
              height={200}
              autoRotate
              variant="scan"
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  color: C.gold,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Your Measurements
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                }}
              >
                {Object.entries(userBody).map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      padding: "6px 8px",
                      background: C.bgElevated,
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 8,
                        color: C.muted,
                        textTransform: "capitalize",
                      }}
                    >
                      {k}
                    </div>
                    <div
                      style={{ fontSize: 13, fontWeight: 700, color: C.gold }}
                    >
                      {v}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
              { label: "Avg Fit", value: `${avgFit}%`, color: C.gold },
              { label: "Perfect Fits", value: perfectFits, color: C.success },
              { label: "Shortlist", value: favorites.size, color: C.tailor },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  textAlign: "center",
                  padding: "12px 8px",
                  background: C.bgElevated,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700, color }}>
                  {value}
                </div>
                <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>
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
              textAlign: "center",
              padding: "40px 20px",
              color: C.muted,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: `1px solid ${C.border}`,
                background: C.card,
                color: C.gold,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <HeartIcon />
            </div>
            <p style={{ fontSize: 13 }}>
              No pieces saved yet. Use the heart on any item to build a
              shortlist here.
            </p>
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
  const [favorites, setFavorites] = useState(saved?.favorites || new Set());
  const [tailorOrders, setTailorOrders] = useState(saved?.tailorOrders || []);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tailorItem, setTailorItem] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [navTab, setNavTab] = useState("home");
  const [prevScreen, setPrevScreen] = useState(null);

  const catalog = useMemo(() => enrichCatalog(userBody), [userBody]);

  useEffect(() => {
    saveUserData({ body: userBody, favorites, tailorOrders });
  }, [userBody, favorites, tailorOrders]);

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
  const handleOnboardingComplete = body => {
    setUserBody(body);
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
  const handleUpdateBody = body => {
    setUserBody(body);
  };

  const sharedProps = {
    catalog,
    favorites,
    toggleFav,
    onNav: handleNav,
    userBody,
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
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; background: rgba(75,65,52,0.12); }
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
        .tb-app {
          position: relative;
          overflow: hidden;
          padding: 24px;
          background:
            radial-gradient(circle at top left, rgba(156,175,136,0.30), transparent 32%),
            radial-gradient(circle at bottom right, rgba(210,180,140,0.32), transparent 36%),
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
          box-shadow: 0 24px 60px rgba(75,65,52,0.10), 0 1px 0 rgba(255,255,255,0.6) inset;
          overflow: auto;
          padding: 24px;
        }
        .tb-stage__main {
          position: relative;
          overflow: hidden;
          border-radius: 34px;
          border: 1px solid ${C.border};
          background: linear-gradient(180deg, #FFFFFF 0%, ${PALETTE.parchment} 100%);
          box-shadow: 0 40px 100px rgba(75,65,52,0.18), 0 1px 0 rgba(255,255,255,0.7) inset;
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
          box-shadow: 0 6px 18px rgba(75,65,52,0.06);
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
        .tb-sidebar-stat__value {
          display: block;
          color: ${C.accent};
          font-size: 22px;
          font-weight: 800;
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
          background: rgba(75,65,52,0.10);
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
            background: rgba(251,248,241,0.95) !important;
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
            background: linear-gradient(180deg, rgba(251,248,241,0) 0%, rgba(251,248,241,0.92) 28%, rgba(251,248,241,0.98) 100%);
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
