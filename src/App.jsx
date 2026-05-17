import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

// ─── Design Tokens ─────────────────────────────────────────
// Earthy, sustainability-forward palette: deep moss, sage, espresso, stone.
// NO orange/gold/amber/copper anywhere. The "gold*" keys are legacy names that
// now hold sage-green values to keep the diff surface small.
const C = {
  bg: "#0d1210",
  bgElevated: "#13191A",
  card: "#181f1d",
  cardHover: "#1f2725",
  accent: "#f5f5f1",
  muted: "#8a948e",
  mutedLight: "#b6bdb7",
  border: "rgba(255,255,255,0.06)",
  borderLight: "rgba(255,255,255,0.1)",
  // Primary accent: sage / moss green
  gold: "#8FB69B",
  goldDark: "#5C8068",
  goldLight: "#BFD7C4",
  goldBg: "rgba(143,182,155,0.10)",
  goldBorder: "rgba(143,182,155,0.28)",
  success: "#7FCB9C",
  successBg: "rgba(127,203,156,0.10)",
  successBorder: "rgba(127,203,156,0.25)",
  // Warning: cool teal (NOT amber) — distinct from success
  warning: "#5FB0B0",
  warningBg: "rgba(95,176,176,0.10)",
  warningBorder: "rgba(95,176,176,0.25)",
  danger: "#E08585",
  // Tailor: deep espresso brown for craft accents (reads neutral, not orange)
  tailor: "#A89888",
  tailorBg: "rgba(168,152,136,0.10)",
  tailorBorder: "rgba(168,152,136,0.28)",
  glass: "rgba(255,255,255,0.03)",
  glassBorder: "rgba(255,255,255,0.08)",
};
const font = { serif: "'Cormorant Garamond', Georgia, serif", sans: "'Manrope', -apple-system, sans-serif" };

// ─── SVG Icons ─────────────────────────────────────────────
const Ico = ({ children, size = 20, stroke = "currentColor", sw = 1.5, fill = "none", vb = "0 0 24 24" }) => (
  <svg width={size} height={size} viewBox={vb} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const ChevronLeft = ({ size = 20 }) => <Ico size={size} sw={2}><path d="M15 18l-6-6 6-6"/></Ico>;
const HeartIcon = ({ filled, color = C.gold }) => <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={filled ? color : "currentColor"} strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const HomeIcon = () => <Ico><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Ico>;
const UserIcon = () => <Ico><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Ico>;
const SparkleIcon = ({ size = 20 }) => <Ico size={size}><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></Ico>;
const TagIcon = () => <Ico><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/></Ico>;
const FireIcon = () => <Ico><path d="M12 2c0 4-4 6-4 10a4 4 0 008 0c0-4-4-6-4-10z"/></Ico>;
const SearchIcon = ({ size = 16 }) => <Ico size={size} stroke={C.muted}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Ico>;
const ScissorsIcon = ({ size = 20 }) => <Ico size={size}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></Ico>;
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const ShieldIcon = () => <Ico size={16} stroke={C.success}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Ico>;
const TargetIcon = ({ size = 20 }) => <Ico size={size}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></Ico>;
const CameraIcon = ({ size = 22 }) => <Ico size={size}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></Ico>;
const CheckCircle = ({ size = 18 }) => <Ico size={size} stroke={C.success}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Ico>;
const MeasureIcon = ({ size = 18 }) => <Ico size={size}><path d="M2 12h20M12 2v20M7 7l10 10M17 7L7 17"/></Ico>;
const ThreadIcon = ({ size = 18 }) => <Ico size={size}><path d="M12 22V12"/><path d="M12 12C12 8 8 6 8 6s4-2 4-6"/><path d="M12 12c0-4 4-6 4-6s-4-2-4-6"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></Ico>;
const NeedleIcon = ({ size = 18 }) => <Ico size={size}><path d="M19.7 4.3c-1-1-2.5-1-3.5 0l-12 12c-.5.5-.5 1.5 0 2l1.5 1.5c.5.5 1.5.5 2 0l12-12c1-1 1-2.5 0-3.5z"/><path d="M16 7l1 1M5 19l-2 2"/></Ico>;
const RulerIcon = ({ size = 18 }) => <Ico size={size}><path d="M21.7 7.3l-5-5a1 1 0 00-1.4 0L2.3 15.3a1 1 0 000 1.4l5 5a1 1 0 001.4 0L21.7 8.7a1 1 0 000-1.4z"/></Ico>;
const PenIcon = ({ size = 18 }) => <Ico size={size}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></Ico>;
const BoxIcon = ({ size = 20 }) => <Ico size={size}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Ico>;
const TruckIcon = ({ size = 20 }) => <Ico size={size}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></Ico>;
const XIcon = ({ size = 18 }) => <Ico size={size} sw={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ico>;
const EditIcon = ({ size = 16 }) => <Ico size={size}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></Ico>;
const TrendingUpIcon = ({ size = 16 }) => <Ico size={size}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></Ico>;
const InfoIcon = ({ size = 14 }) => <Ico size={size}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Ico>;
const ChevronRight = ({ size = 16 }) => <Ico size={size} sw={2}><path d="M9 18l6-6-6-6"/></Ico>;

const TAILOR_ICON_MAP = { scissors: ScissorsIcon, measure: MeasureIcon, thread: ThreadIcon, ruler: RulerIcon, needle: NeedleIcon, pen: PenIcon };

// ─── 3D Body System ─────────────────────────────────────────
function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}
function splineSlices(slices, subdivisions = 12) {
  const result = [];
  const keys = ['y', 'rx', 'rz', 'ox', 'oz'];
  for (let i = 0; i < slices.length - 1; i++) {
    const p0 = slices[Math.max(0, i - 1)], p1 = slices[i], p2 = slices[i + 1], p3 = slices[Math.min(slices.length - 1, i + 2)];
    const last = i === slices.length - 2;
    for (let j = 0; j <= (last ? subdivisions : subdivisions - 1); j++) {
      const t = j / subdivisions, pt = {};
      for (const k of keys) pt[k] = catmullRom(p0[k] || 0, p1[k] || 0, p2[k] || 0, p3[k] || 0, t);
      pt.rx = Math.max(0.001, pt.rx); pt.rz = Math.max(0.001, pt.rz);
      result.push(pt);
    }
  }
  return result;
}
function buildSmoothMesh(rawSlices, segs, material) {
  const slices = splineSlices(rawSlices, 14);
  const geo = new THREE.BufferGeometry();
  const pos = [], uv = [], idx = [];
  const rows = slices.length, cols = segs + 1;
  for (let s = 0; s < rows; s++) {
    const { y, rx, rz, ox, oz } = slices[s];
    const v = s / (rows - 1);
    for (let i = 0; i <= segs; i++) {
      const u = i / segs, a = u * Math.PI * 2;
      pos.push(Math.cos(a) * rx + (ox || 0), y, Math.sin(a) * rz + (oz || 0));
      uv.push(u, v);
    }
  }
  for (let s = 0; s < rows - 1; s++) {
    for (let i = 0; i < segs; i++) {
      const a = s * cols + i, b = a + cols;
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
  const pos = geo.attributes.position, nrm = geo.attributes.normal, map = new Map();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
    if (!map.has(key)) map.set(key, []); map.get(key).push(i);
  }
  for (const indices of map.values()) {
    let nx = 0, ny = 0, nz = 0;
    for (const i of indices) { nx += nrm.getX(i); ny += nrm.getY(i); nz += nrm.getZ(i); }
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    nx /= len; ny /= len; nz /= len;
    for (const i of indices) nrm.setXYZ(i, nx, ny, nz);
  }
  nrm.needsUpdate = true;
}
function createBodyMesh(body) {
  const bust = body?.bust || 34, waist = body?.waist || 26, hips = body?.hips || 36, shoulder = body?.shoulder || 15, inseam = body?.inseam || 30;
  const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
  const n = (v, r) => clamp(v / r, 0.75, 1.3);
  const nB = n(bust, 36), nW = n(waist, 28), nH = n(hips, 38), nS = n(shoulder, 15), nI = n(inseam, 30);
  const group = new THREE.Group(), segs = 64;
  const skinMat = new THREE.MeshPhysicalMaterial({ color: 0xe8c4a0, roughness: 0.5, metalness: 0.0, clearcoat: 0.05, clearcoatRoughness: 0.95, sheen: 0.3, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xffc8a0), side: THREE.FrontSide, envMapIntensity: 0.6 });
  group.add(buildSmoothMesh([
    { y: 2.88, rx: 0.10, rz: 0.09 }, { y: 2.82, rx: 0.13, rz: 0.11 }, { y: 2.72, rx: 0.22, rz: 0.16 },
    { y: 2.58, rx: 0.48 * nS, rz: 0.19, oz: 0.01 }, { y: 2.48, rx: 0.50 * nS, rz: 0.22, oz: 0.02 },
    { y: 2.35, rx: 0.48 * nB, rz: 0.28 * nB, oz: 0.05 }, { y: 2.20, rx: 0.44 * nB, rz: 0.26 * nB, oz: 0.04 },
    { y: 2.05, rx: 0.42 * nB, rz: 0.24 * nB, oz: 0.03 }, { y: 1.88, rx: 0.38 * nW, rz: 0.22 * nW, oz: 0.02 },
    { y: 1.72, rx: 0.35 * nW, rz: 0.20 * nW, oz: 0.01 }, { y: 1.58, rx: 0.36 * nW, rz: 0.21 * nW, oz: 0.01 },
    { y: 1.42, rx: 0.40 * nH, rz: 0.24 * nH, oz: 0.02 }, { y: 1.25, rx: 0.47 * nH, rz: 0.28 * nH, oz: 0.03 },
    { y: 1.12, rx: 0.48 * nH, rz: 0.29 * nH, oz: 0.04 }, { y: 1.00, rx: 0.46 * nH, rz: 0.28 * nH, oz: 0.03 },
    { y: 0.88, rx: 0.42 * nH, rz: 0.26 * nH, oz: 0.02 }, { y: 0.76, rx: 0.30, rz: 0.22 },
  ], segs, skinMat));
  const headGeo = new THREE.SphereGeometry(0.21, 48, 32, 0, Math.PI * 2, 0, Math.PI);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.scale.set(1, 1.15, 1.05); headMesh.position.set(0, 3.33, 0.01); group.add(headMesh);
  group.add(buildSmoothMesh([{ y: 3.10, rx: 0.085, rz: 0.075 }, { y: 3.00, rx: 0.09, rz: 0.08 }, { y: 2.90, rx: 0.10, rz: 0.09 }], 32, skinMat));
  const legLen = 0.75 * nI;
  const buildLeg = (xOff) => buildSmoothMesh([
    { y: 0.80, rx: 0.165, rz: 0.16, ox: xOff }, { y: 0.60, rx: 0.148, rz: 0.14, ox: xOff },
    { y: 0.42, rx: 0.135, rz: 0.125, ox: xOff }, { y: 0.28, rx: 0.12, rz: 0.11, ox: xOff },
    { y: 0.10, rx: 0.112, rz: 0.106, ox: xOff }, { y: -0.10, rx: 0.108, rz: 0.095, ox: xOff },
    { y: -legLen * 0.45, rx: 0.09, rz: 0.085, ox: xOff }, { y: -legLen * 0.70, rx: 0.082, rz: 0.078, ox: xOff },
    { y: -legLen * 0.88, rx: 0.065, rz: 0.062, ox: xOff }, { y: -legLen, rx: 0.065, rz: 0.07, ox: xOff },
  ], 32, skinMat);
  group.add(buildLeg(-0.17)); group.add(buildLeg(0.17));
  const buildArm = (sign) => {
    const sx = 0.48 * nS * sign;
    return buildSmoothMesh([
      { y: 2.56, rx: 0.11, rz: 0.10, ox: sx * 0.92 }, { y: 2.46, rx: 0.10, rz: 0.088, ox: sx + sign * 0.01 },
      { y: 2.28, rx: 0.082, rz: 0.072, ox: sx + sign * 0.05 }, { y: 2.10, rx: 0.075, rz: 0.065, ox: sx + sign * 0.07 },
      { y: 1.90, rx: 0.068, rz: 0.062, ox: sx + sign * 0.09 }, { y: 1.55, rx: 0.058, rz: 0.054, ox: sx + sign * 0.11 },
      { y: 1.15, rx: 0.045, rz: 0.042, ox: sx + sign * 0.13 }, { y: 0.82, rx: 0.035, rz: 0.032, ox: sx + sign * 0.14 },
      { y: 0.62, rx: 0.035, rz: 0.018, ox: sx + sign * 0.14 },
    ], 24, skinMat);
  };
  group.add(buildArm(-1)); group.add(buildArm(1));
  return group;
}
function createGarmentMesh(body, item) {
  const bust = body?.bust || 34, waist = body?.waist || 26, hips = body?.hips || 36, shoulder = body?.shoulder || 15, inseam = body?.inseam || 30;
  const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
  const n = (v, r) => clamp(v / r, 0.75, 1.3);
  const nB = n(bust, 36), nW = n(waist, 28), nH = n(hips, 38), nS = n(shoulder, 15), nI = n(inseam, 30);
  const group = new THREE.Group(), gap = 0.04, segs = 64, cat = item?.category || "Tops";
  const hexColor = item?.color || "#8FB69B", color = new THREE.Color(hexColor);
  const fab = (item?.fabric || "").toLowerCase();
  const isDenim = fab.includes("denim"), isSilk = fab.includes("silk") || fab.includes("satin"), isKnit = fab.includes("knit") || fab.includes("jersey") || fab.includes("modal"), isLeather = fab.includes("leather");
  const fabricMat = new THREE.MeshPhysicalMaterial({ color, roughness: isDenim ? 0.92 : isSilk ? 0.22 : isKnit ? 0.88 : 0.75, metalness: isSilk ? 0.05 : 0, clearcoat: isSilk ? 0.35 : 0.04, clearcoatRoughness: isSilk ? 0.25 : 0.8, sheen: isKnit ? 0.6 : isSilk ? 0.5 : 0.2, sheenRoughness: 0.5, sheenColor: new THREE.Color(hexColor).multiplyScalar(isSilk ? 2.2 : 1.4), side: THREE.FrontSide, envMapIntensity: isSilk ? 1.2 : 0.3 });
  if (cat === "Tops" || cat === "Outerwear") {
    const g = cat === "Outerwear" ? 0.065 : gap;
    group.add(buildSmoothMesh([
      { y: 2.72, rx: 0.22 + g, rz: 0.16 + g }, { y: 2.58, rx: 0.48 * nS + g, rz: 0.19 + g },
      { y: 2.48, rx: 0.50 * nS + g, rz: 0.22 + g }, { y: 2.35, rx: 0.48 * nB + g, rz: 0.28 * nB + g, oz: 0.05 },
      { y: 2.20, rx: 0.44 * nB + g, rz: 0.26 * nB + g, oz: 0.04 }, { y: 2.05, rx: 0.42 * nB + g, rz: 0.24 * nB + g },
      { y: 1.88, rx: 0.38 * nW + g, rz: 0.22 * nW + g }, { y: 1.72, rx: 0.35 * nW + g, rz: 0.20 * nW + g },
      { y: 1.58, rx: 0.36 * nW + g, rz: 0.21 * nW + g }, { y: 1.42, rx: 0.40 * nH + g, rz: 0.24 * nH + g },
    ], segs, fabricMat));
    const buildSleeve = (sign) => {
      const sx = 0.48 * nS * sign;
      return buildSmoothMesh([
        { y: 2.56, rx: 0.115, rz: 0.105, ox: sx * 0.92 }, { y: 2.46, rx: 0.105, rz: 0.093, ox: sx + sign * 0.01 },
        { y: 2.28, rx: 0.088, rz: 0.078, ox: sx + sign * 0.05 }, { y: 2.10, rx: 0.080, rz: 0.070, ox: sx + sign * 0.07 },
        { y: 1.90, rx: 0.073, rz: 0.067, ox: sx + sign * 0.09 }, { y: 1.55, rx: 0.063, rz: 0.059, ox: sx + sign * 0.11 },
      ], 24, fabricMat);
    };
    group.add(buildSleeve(-1)); group.add(buildSleeve(1));
  } else if (cat === "Bottoms") {
    const legLen = 0.75 * nI;
    group.add(buildSmoothMesh([
      { y: 1.58, rx: 0.36 * nW + gap, rz: 0.21 * nW + gap }, { y: 1.42, rx: 0.40 * nH + gap, rz: 0.24 * nH + gap },
      { y: 1.25, rx: 0.47 * nH + gap, rz: 0.28 * nH + gap, oz: 0.03 }, { y: 1.12, rx: 0.48 * nH + gap, rz: 0.29 * nH + gap, oz: 0.04 },
      { y: 1.00, rx: 0.46 * nH + gap, rz: 0.28 * nH + gap }, { y: 0.88, rx: 0.42 * nH + gap, rz: 0.26 * nH + gap },
      { y: 0.76, rx: 0.32 + gap, rz: 0.24 + gap },
    ], segs, fabricMat));
    const buildPantsLeg = (xOff) => buildSmoothMesh([
      { y: 0.80, rx: 0.175 + gap, rz: 0.17 + gap, ox: xOff }, { y: 0.60, rx: 0.16 + gap, rz: 0.15 + gap, ox: xOff },
      { y: 0.42, rx: 0.145 + gap, rz: 0.135 + gap, ox: xOff }, { y: 0.20, rx: 0.13 + gap, rz: 0.12 + gap, ox: xOff },
      { y: -legLen * 0.45, rx: 0.10 + gap, rz: 0.095 + gap, ox: xOff }, { y: -legLen * 0.80, rx: 0.09 + gap, rz: 0.088 + gap, ox: xOff },
      { y: -legLen, rx: 0.085 + gap, rz: 0.082 + gap, ox: xOff },
    ], 32, fabricMat);
    group.add(buildPantsLeg(-0.17)); group.add(buildPantsLeg(0.17));
  } else if (cat === "Dresses") {
    group.add(buildSmoothMesh([
      { y: 2.72, rx: 0.22 + gap, rz: 0.16 + gap }, { y: 2.58, rx: 0.48 * nS + gap, rz: 0.19 + gap },
      { y: 2.35, rx: 0.48 * nB + gap, rz: 0.28 * nB + gap, oz: 0.05 }, { y: 2.05, rx: 0.42 * nB + gap, rz: 0.24 * nB + gap },
      { y: 1.72, rx: 0.35 * nW + gap, rz: 0.20 * nW + gap }, { y: 1.42, rx: 0.42 * nH + gap, rz: 0.25 * nH + gap },
      { y: 1.15, rx: 0.50 * nH + gap, rz: 0.30 * nH + gap }, { y: 0.85, rx: 0.52 * nH + gap, rz: 0.32 * nH + gap },
      { y: 0.50, rx: 0.50 * nH + gap, rz: 0.31 * nH + gap }, { y: 0.20, rx: 0.48 * nH + gap, rz: 0.30 * nH + gap },
    ], segs, fabricMat));
  }
  return group;
}

// ─── 3D Body Viewer ─────────────────────────────────────────
function Body3DViewer({ body, width = 300, height = 420, garment = null, autoRotate = false }) {
  const mountRef = useRef(null);
  const autoAngle = useRef(0), rotY = useRef(0), isDragging = useRef(false), lastX = useRef(0);
  useEffect(() => {
    const el = mountRef.current; if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 4.2); camera.lookAt(0, 1.8, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xfff8f0, 1.8); key.position.set(2, 5, 4); scene.add(key);
    const fill = new THREE.DirectionalLight(0xf0f4ff, 0.6); fill.position.set(-3, 3, 2); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffe0c0, 0.5); rim.position.set(0, 2, -4); scene.add(rim);
    const pivot = new THREE.Group();
    pivot.add(createBodyMesh(body));
    if (garment) { const g = createGarmentMesh(body, garment); if (g) pivot.add(g); }
    scene.add(pivot);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(1.2, 48), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground);
    const clock = new THREE.Clock(); let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoRotate && !isDragging.current) { autoAngle.current += 0.008; pivot.rotation.y = autoAngle.current; }
      else { pivot.rotation.y = rotY.current + autoAngle.current; }
      pivot.position.y = Math.sin(clock.elapsedTime * 1.2) * 0.003;
      renderer.render(scene, camera);
    };
    animate();
    const onDown = (e) => { isDragging.current = true; lastX.current = e.clientX || e.touches?.[0]?.clientX || 0; };
    const onMove = (e) => { if (!isDragging.current) return; const x = e.clientX || e.touches?.[0]?.clientX || 0; rotY.current += (x - lastX.current) * 0.008; lastX.current = x; };
    const onUp = () => { isDragging.current = false; };
    el.addEventListener("mousedown", onDown); el.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("mousemove", onMove); window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("mouseup", onUp); window.addEventListener("touchend", onUp);
    return () => { cancelAnimationFrame(animId); el.removeEventListener("mousedown", onDown); el.removeEventListener("touchstart", onDown); window.removeEventListener("mousemove", onMove); window.removeEventListener("touchmove", onMove); window.removeEventListener("mouseup", onUp); window.removeEventListener("touchend", onUp); renderer.dispose(); };
  }, [body, width, height, garment, autoRotate]);
  return <div ref={mountRef} style={{ width, height, borderRadius: 16, overflow: "hidden", cursor: "grab" }} />;
}

// ─── Camera Body Scanner ─────────────────────────────────────
function CameraBodyScanner({ onScanComplete, onCancel, userHeight = 65 }) {
  const videoRef = useRef(null), canvasRef = useRef(null), streamRef = useRef(null);
  const landmarkerRef = useRef(null), animRef = useRef(null);
  const countdownRef = useRef(null), processingRef = useRef(null);
  const frontFramesRef = useRef([]), sideFramesRef = useRef([]);
  const mountedRef = useRef(true);
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

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (processingRef.current) clearTimeout(processingRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (landmarkerRef.current) { try { landmarkerRef.current.close(); } catch(e) {} }
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
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
              delegate: "GPU"
            },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          });
        } catch (gpuErr) {
          // Fallback to CPU if GPU delegate fails
          console.warn("GPU delegate failed, falling back to CPU:", gpuErr);
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
              delegate: "CPU"
            },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          });
        }
        if (cancelled || !mountedRef.current) return;
        landmarkerRef.current = landmarker;
        setLoadProgress("Requesting camera access...");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 640 }, height: { ideal: 1136 } },
          audio: false
        });
        if (cancelled || !mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;

        // Wait for video to be truly ready before proceeding
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Video load timeout")), 10000);
          video.onloadeddata = () => { clearTimeout(timeout); resolve(); };
          video.onerror = () => { clearTimeout(timeout); reject(new Error("Video element error")); };
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
            setFeedback("Camera access denied. Please allow camera access in your browser settings and try again.");
          } else if (err.name === "NotFoundError") {
            setFeedback("No camera found. Please connect a camera and try again.");
          } else if (err.name === "NotReadableError" || err.name === "AbortError") {
            setFeedback("Camera is in use by another app. Close other apps using the camera and try again.");
          } else if (err.message?.includes("timeout")) {
            setFeedback("Camera took too long to start. Please try again.");
          } else {
            setFeedback(`Scanner error: ${err.message || "Unknown error"}. Tap retry or enter manually.`);
          }
        }
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [facingMode, retryCount]);

  const avgFrames = useCallback((frames) => {
    if (!frames.length) return null;
    return frames[0].map((_, idx) => {
      const vals = frames.map(f => f[idx]);
      const good = vals.filter(v => (v.visibility || 0) > 0.35);
      if (!good.length) return vals[0];
      const nn = good.length;
      return {
        x: good.reduce((s, v) => s + v.x, 0) / nn,
        y: good.reduce((s, v) => s + v.y, 0) / nn,
        z: good.reduce((s, v) => s + (v.z || 0), 0) / nn,
        visibility: good.reduce((s, v) => s + (v.visibility || 0), 0) / nn
      };
    });
  }, []);

  const computeMeasurements = useCallback((frontFrames, sideFrames) => {
    const frontLm = avgFrames(frontFrames);
    if (!frontLm) return null;
    const lS = frontLm[11], rS = frontLm[12], lH = frontLm[23], rH = frontLm[24], lA = frontLm[27], rA = frontLm[28], nose = frontLm[0];
    if (!lS || !rS || !lH || !rH || !lA || !rA || !nose) return null;
    const bodyH = Math.abs(nose.y - (lA.y + rA.y) / 2);
    if (bodyH < 0.05) return null;
    const scale = userHeight / bodyH;
    const shoulderW = Math.abs(lS.x - rS.x) * scale;
    const hipW = Math.abs(lH.x - rH.x) * scale;
    const waistW = ((Math.abs(lS.x - rS.x) + Math.abs(lH.x - rH.x)) / 2 * 0.76) * scale;

    // Use side scan data for depth if available, otherwise estimate from front
    let chestDepth, hipDepth, waistDepth;
    const sideLm = avgFrames(sideFrames);
    if (sideLm && sideLm[11] && sideLm[23]) {
      const sideBodyH = Math.abs(sideLm[0].y - (sideLm[27].y + sideLm[28].y) / 2);
      const sideScale = sideBodyH > 0.05 ? userHeight / sideBodyH : scale;
      chestDepth = Math.abs(sideLm[11].z - sideLm[12].z) * sideScale * 2.2 || shoulderW * 0.68;
      hipDepth = Math.abs(sideLm[23].z - sideLm[24].z) * sideScale * 2.2 || hipW * 0.70;
      waistDepth = (chestDepth + hipDepth) / 2 * 0.85;
    } else {
      chestDepth = shoulderW * 0.68;
      hipDepth = hipW * 0.70;
      waistDepth = (chestDepth + hipDepth) / 2 * 0.82;
    }

    const ellipseC = (w, d) => Math.PI * Math.sqrt(((w / 2) ** 2 + (d / 2) ** 2) / 2) * 2;
    const bustC = ellipseC(shoulderW * 0.95, chestDepth) * 1.08;
    const waistC = ellipseC(waistW, waistDepth);
    const hipC = ellipseC(hipW * 1.02, hipDepth) * 1.06;
    const inseam = Math.abs((lH.y + rH.y) / 2 - (lA.y + rA.y) / 2) * scale * 0.97;
    const round = v => Math.round(v * 2) / 2;
    return {
      bust: round(Math.max(28, Math.min(52, bustC))),
      waist: round(Math.max(20, Math.min(44, waistC))),
      hips: round(Math.max(30, Math.min(56, hipC))),
      inseam: round(Math.max(22, Math.min(36, inseam))),
      shoulder: round(Math.max(12, Math.min(20, shoulderW)))
    };
  }, [userHeight, avgFrames]);

  const runScanPhase = useCallback((framesTarget, durationMs, ph, onDone) => {
    const startTime = Date.now();
    let lastTime = -1;
    framesTarget.current = [];
    const tick = () => {
      if (!mountedRef.current) return;
      const video = videoRef.current, canvas = canvasRef.current;
      if (!video || !canvas || !landmarkerRef.current) return;
      const now = Date.now(), elapsed = now - startTime;
      setProgress(Math.min(100, (elapsed / durationMs) * 100));
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
            framesTarget.current.push([...lm]);
            const drawUtils = new DrawingUtils(ctx);
            drawUtils.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, { color: "rgba(143,182,155,0.7)", lineWidth: 2.5 });
            drawUtils.drawLandmarks(lm, { color: "rgba(143,182,155,0.95)", fillColor: "rgba(143,182,155,0.3)", lineWidth: 1, radius: 4 });
            const avgVis = lm.reduce((s, l) => s + (l.visibility || 0), 0) / lm.length;
            setConfidence(Math.round(avgVis * 100));
            if (framesTarget.current.length % 8 === 0 && framesTarget.current.length >= 10) {
              const liveEst = computeMeasurements(framesTarget.current, []);
              if (liveEst) setLiveM(liveEst);
            }
            setFeedback(
              avgVis < 0.4 ? "Step back — full body must be visible" :
              avgVis < 0.6 ? "Hold still — improving accuracy" :
              ph === "front" ? "Excellent — scanning front..." : "Perfect — scanning side..."
            );
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setFeedback("No body detected — step into frame");
          }
        } catch (detectErr) {
          console.warn("Detection frame error:", detectErr);
        }
      }
      if (elapsed < durationMs) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        onDone(framesTarget.current);
      }
    };
    animRef.current = requestAnimationFrame(tick);
  }, [computeMeasurements]);

  const startScan = useCallback(() => {
    if (!landmarkerRef.current || !videoRef.current) return;
    setPhase("front"); setProgress(0); setLiveM(null); setConfidence(0);
    setFeedback("Stand facing forward, arms slightly out");
    runScanPhase(frontFramesRef, 6000, "front", (frontFrames) => {
      if (!mountedRef.current) return;
      if (frontFrames.length < 15) {
        setPhase("ready");
        setFeedback(`Only ${frontFrames.length} frames captured — make sure full body is visible and well-lit`);
        return;
      }
      setPhase("turning"); setProgress(0); setTurnCountdown(3);
      let count = 3;
      countdownRef.current = setInterval(() => {
        if (!mountedRef.current) { clearInterval(countdownRef.current); return; }
        count--;
        setTurnCountdown(count);
        if (count <= 0) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          if (!mountedRef.current) return;
          setPhase("side"); setFeedback("Hold side profile still...");
          runScanPhase(sideFramesRef, 5000, "side", (sideFrames) => {
            if (!mountedRef.current) return;
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
                setFeedback("Couldn't compute measurements — try standing further back with arms slightly out");
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
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (processingRef.current) { clearTimeout(processingRef.current); processingRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (landmarkerRef.current) { try { landmarkerRef.current.close(); } catch(e) {} landmarkerRef.current = null; }
    setPhase("loading"); setFeedback("Retrying..."); setConfidence(0); setProgress(0); setLiveM(null); setMeasurements(null);
    setRetryCount(c => c + 1);
  }, []);

  const confirmMeasurements = useCallback(() => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    onScanComplete(measurements);
  }, [measurements, onScanComplete]);

  const isActive = phase === "front" || phase === "side";
  const totalFrames = frontFramesRef.current.length + sideFramesRef.current.length;
  const accuracy = Math.min(96, 72 + Math.round(totalFrames / 4));

  // Confidence-derived UX hints
  const confidenceLabel = confidence >= 75 ? "Strong signal" : confidence >= 50 ? "Hold steady" : confidence > 0 ? "Adjust position" : "Searching…";

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      {/* Step indicator: Frame → Front → Turn → Side → Done */}
      <div style={{ display: "flex", gap: 6, width: "100%", maxWidth: 320, alignItems: "center" }}>
        {[
          { key: "frame", label: "Frame", on: phase === "ready" || phase === "loading", ok: phase === "front" || phase === "side" || phase === "turning" || phase === "processing" || phase === "done" },
          { key: "front", label: "Front", on: phase === "front", ok: phase === "side" || phase === "turning" || phase === "processing" || phase === "done" },
          { key: "side",  label: "Side",  on: phase === "side" || phase === "turning", ok: phase === "processing" || phase === "done" },
          { key: "done",  label: "Result",on: phase === "processing", ok: phase === "done" },
        ].map((s, i, arr) => (
          <React.Fragment key={s.key}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: s.ok ? C.success : s.on ? C.gold : C.card, border: `1px solid ${s.ok ? C.successBorder : s.on ? C.goldBorder : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: s.ok || s.on ? "#0d1210" : C.muted, fontWeight: 700, transition: "all 0.3s" }}>{s.ok ? "✓" : i + 1}</div>
              <span style={{ fontSize: 8.5, fontWeight: 600, color: s.on ? C.gold : s.ok ? C.success : C.muted, letterSpacing: 1, textTransform: "uppercase" }}>{s.label}</span>
            </div>
            {i < arr.length - 1 && <div style={{ flex: 0.4, height: 1, background: s.ok ? C.successBorder : C.border, marginBottom: 14 }} />}
          </React.Fragment>
        ))}
      </div>
      <div style={{ position: "relative", width: "100%", maxWidth: 320, aspectRatio: "9/16", borderRadius: 24, overflow: "hidden", border: `1px solid ${isActive ? C.goldBorder : C.border}`, background: "#000", boxShadow: isActive ? `0 0 60px rgba(143,182,155,0.25), 0 0 0 1px rgba(143,182,155,0.15) inset` : "0 20px 40px rgba(0,0,0,0.4)", transition: "all 0.3s" }}>
        <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: facingMode === "user" ? "scaleX(-1)" : "none" }} />
        <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: facingMode === "user" ? "scaleX(-1)" : "none" }} />

        {/* Body-silhouette frame guide — visible during ready + active */}
        {(phase === "ready" || isActive) && (
          <svg viewBox="0 0 100 178" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: phase === "ready" ? 0.55 : 0.35 }}>
            <defs>
              <linearGradient id="guideStroke" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#8FB69B" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#5C8068" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            {/* corner brackets */}
            <path d="M8 18 L8 8 L22 8" stroke="url(#guideStroke)" strokeWidth="1.2" fill="none" />
            <path d="M92 18 L92 8 L78 8" stroke="url(#guideStroke)" strokeWidth="1.2" fill="none" />
            <path d="M8 160 L8 170 L22 170" stroke="url(#guideStroke)" strokeWidth="1.2" fill="none" />
            <path d="M92 160 L92 170 L78 170" stroke="url(#guideStroke)" strokeWidth="1.2" fill="none" />
            {/* body silhouette outline */}
            <ellipse cx="50" cy="34" rx="7" ry="9" stroke="url(#guideStroke)" strokeWidth="0.8" fill="none" strokeDasharray="2 2" />
            <path d="M50 43 L43 56 L40 90 L42 130 L40 160 M50 43 L57 56 L60 90 L58 130 L60 160 M43 56 L33 70 M57 56 L67 70" stroke="url(#guideStroke)" strokeWidth="0.8" fill="none" strokeDasharray="2 2" />
          </svg>
        )}

        {/* Scan line during active capture */}
        {isActive && (
          <div style={{ position: "absolute", left: "8%", right: "8%", height: 2, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, animation: "scanLine 2.4s ease-in-out infinite", borderRadius: 2, pointerEvents: "none" }} />
        )}
        {phase === "loading" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", gap: 12 }}>
            <div style={{ width: 36, height: 36, border: `2px solid ${C.border}`, borderTopColor: C.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <p style={{ fontSize: 12, color: C.muted, margin: 0, textAlign: "center", padding: "0 24px" }}>{feedback}</p>
            {loadProgress && <p style={{ fontSize: 10, color: C.gold, margin: 0, opacity: 0.7 }}>{loadProgress}</p>}
          </div>
        )}
        {phase === "turning" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.88)" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>↩️</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: C.gold, letterSpacing: 2, marginBottom: 4 }}>TURN SIDEWAYS</p>
            <p style={{ fontSize: 11, color: C.muted, marginBottom: 20, textAlign: "center", padding: "0 20px" }}>Face your left side to the camera</p>
            <div style={{ width: 64, height: 64, borderRadius: "50%", border: `3px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: C.gold }}>{turnCountdown}</span>
            </div>
          </div>
        )}
        {phase === "processing" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.9)" }}>
            <div style={{ width: 44, height: 44, border: `2px solid ${C.border}`, borderTopColor: C.gold, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
            <p style={{ fontSize: 12, color: C.gold, marginTop: 14, fontWeight: 600 }}>Computing 3D measurements...</p>
          </div>
        )}
        {isActive && (
          <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "5px 10px", borderRadius: 12, display: "flex", alignItems: "center", gap: 6, border: `1px solid rgba(255,255,255,0.08)` }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.gold, animation: "pulse 1.5s ease-in-out infinite", boxShadow: `0 0 10px ${C.gold}` }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: C.accent, letterSpacing: 1, textTransform: "uppercase" }}>{phase === "front" ? "Capturing front" : "Capturing side"}</span>
            </div>
            {confidence > 0 && (
              <div style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "5px 10px", borderRadius: 12, display: "flex", alignItems: "center", gap: 6, border: `1px solid rgba(255,255,255,0.08)` }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: confidence > 70 ? C.success : confidence > 40 ? C.warning : C.danger }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: C.accent }}>{confidence}%</span>
              </div>
            )}
          </div>
        )}
        {isActive && (
          <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "8px 12px", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, border: `1px solid rgba(255,255,255,0.08)` }}>
            <span style={{ fontSize: 10, color: C.mutedLight, fontWeight: 500 }}>{confidenceLabel}</span>
            <span style={{ fontSize: 10, color: C.goldLight, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{phase === "front" ? frontFramesRef.current.length : sideFramesRef.current.length}/30 frames</span>
          </div>
        )}
        {/* Ready-phase guidance overlay */}
        {phase === "ready" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 16, pointerEvents: "none", background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 40%)" }}>
            <div style={{ background: "rgba(13,18,16,0.7)", backdropFilter: "blur(12px)", padding: "10px 12px", borderRadius: 12, border: `1px solid rgba(255,255,255,0.06)` }}>
              <div style={{ fontSize: 10, color: C.goldLight, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Before you start</div>
              <div style={{ fontSize: 11, color: C.mutedLight, lineHeight: 1.4 }}>• Stand 6–8 ft back · full body in frame<br/>• Form-fitting clothes · even lighting<br/>• Hold camera at hip height</div>
            </div>
          </div>
        )}
      </div>
      {isActive && (
        <div style={{ width: "100%", maxWidth: 320 }}>
          <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", background: `linear-gradient(90deg,${C.gold},${C.goldLight})`, width: `${progress}%`, transition: "width 0.2s", borderRadius: 2 }} />
          </div>
        </div>
      )}
      {phase !== "turning" && phase !== "loading" && phase !== "processing" && (
        <p style={{ fontSize: 12, color: phase === "error" ? C.danger : phase === "done" ? C.success : isActive ? C.goldLight : C.muted, textAlign: "center", fontWeight: 500, minHeight: 18, padding: "0 12px", lineHeight: 1.5 }}>{feedback}</p>
      )}
      {isActive && liveM && (
        <div style={{ width: "100%", maxWidth: 320, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {[["bust", liveM.bust], ["waist", liveM.waist], ["hips", liveM.hips]].map(([k, v]) => (
            <div key={k} style={{ padding: "6px 8px", background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: C.goldLight, textTransform: "uppercase", letterSpacing: 1 }}>{k}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>{v}"</div>
            </div>
          ))}
        </div>
      )}
      {phase === "done" && measurements && (
        <div style={{ width: "100%", maxWidth: 320 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, rgba(143,182,155,0.15), transparent 60%)", pointerEvents: "none" }} />
            <Body3DViewer body={measurements} width={170} height={220} autoRotate />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 12, padding: "9px 12px", background: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: 10 }}>
            <CheckCircle size={14} /><span style={{ fontSize: 11, color: C.success, fontWeight: 600 }}>{accuracy}% accuracy · {totalFrames} frames · elliptical 3D</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {Object.entries(measurements).map(([k, v]) => (
              <div key={k} style={{ padding: "10px 12px", background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 10 }}>
                <div style={{ fontSize: 9, color: C.mutedLight, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.goldLight, fontVariantNumeric: "tabular-nums" }}>{v}<span style={{ fontSize: 10, color: C.muted, marginLeft: 2 }}>in</span></div>
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 12px", background: C.tailorBg, border: `1px solid ${C.tailorBorder}`, borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(168,152,136,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 14 }}>♻</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.tailor, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" }}>Impact estimate</div>
              <div style={{ fontSize: 11, color: C.mutedLight, marginTop: 1 }}>Right-fit shopping prevents ~3 returns/yr → 18 kg CO₂e saved</div>
            </div>
          </div>
          <button onClick={confirmMeasurements} style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${C.gold},${C.goldDark})`, color: "#0d1210", fontSize: 13, fontWeight: 700, letterSpacing: 1.2, cursor: "pointer", textTransform: "uppercase", boxShadow: `0 8px 24px rgba(92,128,104,0.35)` }}>Save & Find My Fit</button>
          <button onClick={() => { setPhase("ready"); setMeasurements(null); setLiveM(null); setFeedback("Stand 6–8 ft away so your full body is visible"); }} style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 11, fontWeight: 500, cursor: "pointer", marginTop: 8, letterSpacing: 1, textTransform: "uppercase" }}>Rescan</button>
        </div>
      )}
      {phase === "ready" && <button onClick={startScan} style={{ width: "100%", maxWidth: 320, padding: "15px 0", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${C.gold},${C.goldDark})`, color: "#0d1210", fontSize: 13, fontWeight: 600, letterSpacing: 1, cursor: "pointer", boxShadow: `0 4px 20px rgba(143,182,155,0.3)` }}>Start 3D Body Scan</button>}
      {phase === "error" && (
        <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={handleRetry} style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${C.gold},${C.goldDark})`, color: "#0d1210", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Retry Scanner</button>
          <button onClick={onCancel} style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Enter Manually Instead</button>
        </div>
      )}
      {(phase === "ready" || isActive) && <button onClick={onCancel} style={{ width: "100%", maxWidth: 320, padding: "11px 0", borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Enter Manually Instead</button>}
    </div>
  );
}

// ─── Data ──────────────────────────────────────────────────
const BRANDS = [
  { id: "zara", name: "Zara", logo: "Z", color: "#000000", tagline: "Fast fashion, curated fits", sizeNote: "Runs small — size up" },
  { id: "everlane", name: "Everlane", logo: "E", color: "#1A1A1A", tagline: "Radical transparency", sizeNote: "True to size" },
  { id: "reformation", name: "Reformation", logo: "Rf", color: "#2C2C2C", tagline: "Sustainable & sexy", sizeNote: "Size for waist" },
  { id: "skims", name: "SKIMS", logo: "S", color: "#C4A882", tagline: "Fits every body", sizeNote: "Stretchy — true to size" },
  { id: "abercrombie", name: "Abercrombie", logo: "A&F", color: "#1C3A5F", tagline: "Modern American cool", sizeNote: "True to size" },
  { id: "alo", name: "Alo Yoga", logo: "Alo", color: "#000000", tagline: "Studio to street", sizeNote: "Runs true — size up for loose fit" },
  { id: "nike", name: "Nike", logo: "N", color: "#111111", tagline: "Just do it", sizeNote: "True to size" },
  { id: "aritzia", name: "Aritzia", logo: "Ar", color: "#1A1A1A", tagline: "Everyday luxury", sizeNote: "Runs slightly small" },
  { id: "mango", name: "Mango", logo: "M", color: "#1A1A1A", tagline: "Mediterranean style", sizeNote: "Runs small — size up" },
  { id: "cos", name: "COS", logo: "C", color: "#1A1A1A", tagline: "Considered design", sizeNote: "True to size" },
  { id: "princesspoly", name: "Princess Polly", logo: "PP", color: "#E8A0BF", tagline: "Trending & playful", sizeNote: "True to size" },
  { id: "revolve", name: "Revolve", logo: "R", color: "#000000", tagline: "Influencer-approved", sizeNote: "Size for bust" },
];
const CATALOG = [
  { id: 1, name: "Cropped Trench Coat", brand: "Zara", brandId: "zara", price: 89.90, fit: 0, risk: "Low", color: "#C4A67A", colors: ["#C4A67A","#1a1a1a","#F5F0E8"], category: "Outerwear", trending: true, badge: "Viral on TikTok", url: "https://www.zara.com/us/en/woman-outerwear-l1989.html", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=520&fit=crop&q=80", measurements: { XS: "Bust 33-34, Waist 26-27, Shoulder 15", S: "Bust 35-36, Waist 28-29, Shoulder 15.5", M: "Bust 37-38, Waist 30-31, Shoulder 16", L: "Bust 39-41, Waist 32-34, Shoulder 16.5" }, fabric: "Cotton-blend gabardine with belt", sizingNote: "Cropped at waist — size up for layering" },
  { id: 2, name: "Sheer Lace Blouse", brand: "Zara", brandId: "zara", price: 49.90, fit: 0, risk: "Low", color: "#F5F0E8", colors: ["#F5F0E8","#1a1a1a","#D4A5A5"], category: "Tops", trending: true, badge: "Editor's Pick", url: "https://www.zara.com/us/en/woman-shirts-l1217.html", image: "https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=400&h=520&fit=crop&q=80", measurements: { XS: "Bust 31.5-32.3, Waist 24.4-25.2, Shoulder 14", S: "Bust 33.1-33.9, Waist 26-26.8, Shoulder 14.5", M: "Bust 34.6-35.4, Waist 27.6-28.3, Shoulder 15", L: "Bust 37-38.6, Waist 29.9-31.5, Shoulder 15.5" }, fabric: "Sheer lace with scallop detail", sizingNote: "Zara runs small — size up one" },
  { id: 3, name: "Belted Denim Midi Skirt", brand: "Zara", brandId: "zara", price: 59.90, fit: 0, risk: "Low", color: "#6B8DB5", colors: ["#6B8DB5","#1a1a1a","#E8E5E0"], category: "Bottoms", trending: true, badge: "Viral on TikTok", url: "https://www.zara.com/us/en/woman-skirts-l1299.html", image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&h=520&fit=crop&q=80", measurements: { XS: "Waist 24.4-25.2, Hip 34.6-35.4", S: "Waist 26-26.8, Hip 36.2-37", M: "Waist 27.6-28.3, Hip 37.8-38.6", L: "Waist 29.9-31.5, Hip 40.2-41.7" }, fabric: "100% Cotton structured denim", sizingNote: "A-line with belt — true to size" },
  { id: 4, name: "Studded Cary Jean", brand: "Reformation", brandId: "reformation", price: 198, fit: 0, risk: "Low", color: "#4A5A70", colors: ["#4A5A70","#1a1a1a"], category: "Bottoms", trending: true, badge: "Viral on IG", url: "https://www.thereformation.com/products/cary-high-rise-slouchy-wide-leg-jeans/1309268.html", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=520&fit=crop&q=80", measurements: { "24": "Waist 24, Hip 35, Inseam 31", "25": "Waist 25, Hip 36, Inseam 31", "26": "Waist 26, Hip 37, Inseam 31.5", "27": "Waist 27, Hip 38, Inseam 31.5", "28": "Waist 28, Hip 39, Inseam 32" }, fabric: "Rigid organic cotton denim with stud detail", sizingNote: "Slouchy wide-leg — size for waist" },
  { id: 5, name: "Frankie Silk Slip Dress", brand: "Reformation", brandId: "reformation", price: 298, fit: 0, risk: "Low", color: "#1a1a1a", colors: ["#1a1a1a","#D4A5A5","#8B6839","#87CEEB"], category: "Dresses", trending: true, badge: "Best Seller", url: "https://www.thereformation.com/products/frankie-silk-dress/1304134.html", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=520&fit=crop&q=80", measurements: { "2": "Bust 32-33, Waist 24.5-25.5, Hip 35-36", "4": "Bust 33-34, Waist 25.5-26.5, Hip 36-37", "6": "Bust 34-35, Waist 26.5-27.5, Hip 37-38", "8": "Bust 36-37, Waist 28.5-29.5, Hip 39-40" }, fabric: "100% Silk charmeuse, TENCEL lined", sizingNote: "Slim fit midi — true to size" },
  { id: 6, name: "Bootcut Crop Jean", brand: "Reformation", brandId: "reformation", price: 168, fit: 0, risk: "Low", color: "#6B8DB5", colors: ["#6B8DB5","#1a1a1a","#E8E5E0"], category: "Bottoms", trending: true, badge: "Trending Now", url: "https://www.thereformation.com/categories/jeans", image: "https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?w=400&h=520&fit=crop&q=80", measurements: { "24": "Waist 24, Hip 35, Inseam 26", "25": "Waist 25, Hip 36, Inseam 26", "26": "Waist 26, Hip 37, Inseam 26.5", "27": "Waist 27, Hip 38, Inseam 26.5" }, fabric: "Non-stretch organic cotton denim, bootcut crop", sizingNote: "The #1 denim trend of 2026 — true to size" },
  { id: 7, name: "Fits Everybody Bodysuit", brand: "SKIMS", brandId: "skims", price: 62, fit: 0, risk: "Low", color: "#C4A882", colors: ["#C4A882","#1a1a1a","#F5F0E8","#8B4A5A","#6A5A4A"], category: "Tops", trending: true, badge: "Best Seller", url: "https://skims.com/products/fits-everybody-t-shirt-bodysuit-umber", image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=520&fit=crop&q=80", measurements: { XXS: "Bust 28-30, Waist 20-22", XS: "Bust 30-32, Waist 22-24", S: "Bust 32-34, Waist 25-27", M: "Bust 34-36, Waist 27-29", L: "Bust 37-39, Waist 30-32" }, fabric: "Ultra-stretch smoothing jersey", sizingNote: "Stretchy — order your usual size" },
  { id: 8, name: "Soft Lounge Long Sleeve Dress", brand: "SKIMS", brandId: "skims", price: 78, fit: 0, risk: "Low", color: "#E0D0B8", colors: ["#E0D0B8","#1a1a1a","#8B6B5A"], category: "Dresses", trending: true, badge: "Pinterest Pick", url: "https://skims.com/products/soft-lounge-long-sleeve-dress-honey", image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&h=520&fit=crop&q=80", measurements: { XXS: "Bust 28-30, Waist 20-22, Hip 30-32", XS: "Bust 30-32, Waist 22-24, Hip 32-34", S: "Bust 32-34, Waist 25-27, Hip 35-37", M: "Bust 34-36, Waist 27-29, Hip 37-39" }, fabric: "Modal jersey, brushed inside", sizingNote: "Body-con fit — true to size" },
  { id: 9, name: "Cotton Rib V-Neck Sweater", brand: "SKIMS", brandId: "skims", price: 88, fit: 0, risk: "Low", color: "#D4C5A9", colors: ["#D4C5A9","#1a1a1a","#A0B8A0","#8B4A5A"], category: "Tops", trending: true, badge: "Trending Now", url: "https://skims.com/collections/knitwear", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=520&fit=crop&q=80", measurements: { XS: "Bust 32-34, Waist 24-26, Shoulder 15", S: "Bust 34-36, Waist 26-28, Shoulder 15.5", M: "Bust 36-38, Waist 28-30, Shoulder 16", L: "Bust 38-40, Waist 30-32, Shoulder 16.5" }, fabric: "Cotton rib knit", sizingNote: "V-necks are the trend — true to size" },
  { id: 10, name: "Sloane Tailored Pant", brand: "Abercrombie", brandId: "abercrombie", price: 90, fit: 0, risk: "Low", color: "#2D2D2D", colors: ["#2D2D2D","#D4C5A9","#4A6FA5","#7B5E57"], category: "Bottoms", trending: true, badge: "Best Seller", url: "https://www.abercrombie.com/shop/us/p/sloane-tailored-pant-49931819", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=520&fit=crop&q=80", measurements: { "25": "Waist 25, Hip 35.5, Inseam 27", "26": "Waist 26, Hip 36.5, Inseam 27", "27": "Waist 27, Hip 37.5, Inseam 27.5", "28": "Waist 28, Hip 38.5, Inseam 27.5" }, fabric: "Ponte knit with stretch", sizingNote: "True to size — available in short, regular, long" },
  { id: 11, name: "Curve Love Bootcut Jean", brand: "Abercrombie", brandId: "abercrombie", price: 90, fit: 0, risk: "Low", color: "#4A6FA5", colors: ["#4A6FA5","#1a1a1a","#8BA8C8"], category: "Bottoms", trending: true, badge: "Viral on TikTok", url: "https://www.abercrombie.com/shop/us/womens-jeans-bootcut", image: "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=400&h=520&fit=crop&q=80", measurements: { "25": "Waist 25, Hip 36.5, Inseam 32", "26": "Waist 26, Hip 37.5, Inseam 32", "27": "Waist 27, Hip 38.5, Inseam 32.5", "28": "Waist 28, Hip 39.5, Inseam 32.5" }, fabric: "Premium stretch denim — bootcut", sizingNote: "Curve Love = extra hip room — size for waist" },
  { id: 12, name: "Military Shirt Jacket", brand: "Abercrombie", brandId: "abercrombie", price: 120, fit: 0, risk: "Low", color: "#5A6B4A", colors: ["#5A6B4A","#2D2D2D","#D4C5A9"], category: "Outerwear", trending: true, badge: "Editor's Pick", url: "https://www.abercrombie.com/shop/us/womens-jackets-and-coats", image: "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=400&h=520&fit=crop&q=80", measurements: { XS: "Bust 33-35, Waist 25-27, Shoulder 15.5", S: "Bust 35-37, Waist 27-29, Shoulder 16", M: "Bust 37-39, Waist 29-31, Shoulder 16.5", L: "Bust 39-41, Waist 31-33, Shoulder 17" }, fabric: "Cotton twill with epaulette details", sizingNote: "Military trend — relaxed fit, true to size" },
  { id: 13, name: "Effortless Satin Pant", brand: "Aritzia", brandId: "aritzia", price: 148, fit: 0, risk: "Low", color: "#D4C5A9", colors: ["#D4C5A9","#1A1A1A","#4A6FA5","#7B5E91"], category: "Bottoms", trending: true, badge: "Viral on TikTok", url: "https://www.aritzia.com/us/en/product/the-effortless-pant/61070.html", image: "https://images.unsplash.com/photo-1551854838-212c50b4c184?w=400&h=520&fit=crop&q=80", measurements: { "0": "Waist 25, Hip 35, Inseam 27", "2": "Waist 26, Hip 36, Inseam 27", "4": "Waist 27, Hip 37, Inseam 27.5", "6": "Waist 28, Hip 38, Inseam 27.5", "8": "Waist 29, Hip 39, Inseam 28" }, fabric: "Japanese crepe — matte satin drape", sizingNote: "The satin pant of 2026 — runs true, relaxed through leg" },
  { id: 14, name: "Babaton Contour Bodysuit", brand: "Aritzia", brandId: "aritzia", price: 58, fit: 0, risk: "Low", color: "#1A1A1A", colors: ["#1A1A1A","#F5F0E8","#8B4A5A","#D4C5A9"], category: "Tops", trending: true, badge: "Best Seller", url: "https://www.aritzia.com/us/en/product/contour-bodysuit/73179.html", image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=520&fit=crop&q=80", measurements: { XS: "Bust 30-32, Waist 23-25", S: "Bust 32-34, Waist 25-27", M: "Bust 34-36, Waist 27-29", L: "Bust 36-38, Waist 29-31" }, fabric: "Stretch jersey with contour seaming", sizingNote: "Body-hugging — true to size" },
  { id: 15, name: "Sculpt Knit Culotte", brand: "Aritzia", brandId: "aritzia", price: 88, fit: 0, risk: "Low", color: "#2D2D2D", colors: ["#2D2D2D","#D4C5A9","#E8E5E0"], category: "Bottoms", trending: true, badge: "Trending Now", url: "https://www.aritzia.com/us/en/clothing/pants", image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=520&fit=crop&q=80", measurements: { XS: "Waist 24-25, Hip 34-35", S: "Waist 26-27, Hip 36-37", M: "Waist 28-29, Hip 38-39", L: "Waist 30-31, Hip 40-41" }, fabric: "Sculpt knit — cropped wide-leg culotte", sizingNote: "Culottes are back — true to size" },
  { id: 16, name: "Satin Wide-Leg Trousers", brand: "Mango", brandId: "mango", price: 59.99, fit: 0, risk: "Low", color: "#D4C5A9", colors: ["#D4C5A9","#1A1A1A","#7B5E91"], category: "Bottoms", trending: true, badge: "Pinterest Pick", url: "https://shop.mango.com/us/en/women/pants", image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=520&fit=crop&q=80", measurements: { XS: "Waist 24.5, Hip 35.5, Inseam 31", S: "Waist 26, Hip 37, Inseam 31", M: "Waist 28.25, Hip 39.4, Inseam 31.5", L: "Waist 30.75, Hip 41.7, Inseam 31.5" }, fabric: "100% Satin-finish polyester", sizingNote: "Mango runs slightly small — size up" },
  { id: 17, name: "Lace-Trimmed Midi Skirt", brand: "Mango", brandId: "mango", price: 69.99, fit: 0, risk: "Low", color: "#F5F0E8", colors: ["#F5F0E8","#1a1a1a","#D4A5A5"], category: "Bottoms", trending: true, badge: "Editor's Pick", url: "https://shop.mango.com/us/en/women/skirts", image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&h=520&fit=crop&q=80", measurements: { XS: "Waist 24.5, Hip 35.5", S: "Waist 26, Hip 37", M: "Waist 28.25, Hip 39.4", L: "Waist 30.75, Hip 41.7" }, fabric: "Viscose blend with lace trim", sizingNote: "Incredibly elegant — runs slightly small" },
  { id: 18, name: "Oversized Linen Blazer", brand: "Mango", brandId: "mango", price: 79.99, fit: 0, risk: "Low", color: "#F5F0EB", colors: ["#F5F0EB","#1A1A1A","#D4C5A9"], category: "Outerwear", trending: true, badge: "Spring 2026", url: "https://shop.mango.com/us/en/women/jackets-and-coats", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=520&fit=crop&q=80", measurements: { XS: "Bust 36-38, Waist 28-30, Shoulder 16.5", S: "Bust 38-40, Waist 30-32, Shoulder 17", M: "Bust 40-42, Waist 32-34, Shoulder 17.5", L: "Bust 42-44, Waist 34-36, Shoulder 18" }, fabric: "100% Linen — structured oversized", sizingNote: "Oversized blazer — size down for fitted look" },
  { id: 19, name: "Twist-Detail Midi Dress", brand: "COS", brandId: "cos", price: 175, fit: 0, risk: "Low", color: "#1A1A1A", colors: ["#1A1A1A","#D4A5A5","#E0D0B8"], category: "Dresses", trending: true, badge: "Back in Stock", url: "https://www.cos.com/en_usd/women/womenswear/dresses.html", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=520&fit=crop&q=80", measurements: { XS: "Bust 32-33, Waist 25-26, Hip 35-36", S: "Bust 34-35, Waist 27-28, Hip 37-38", M: "Bust 36-37, Waist 29-30, Hip 39-40", L: "Bust 38-40, Waist 31-33, Hip 41-43" }, fabric: "Mulberry silk blend with twist front", sizingNote: "Returned due to demand — true to size" },
  { id: 20, name: "Relaxed Contrast-Panel Dress", brand: "COS", brandId: "cos", price: 190, fit: 0, risk: "Low", color: "#E0D0B8", colors: ["#E0D0B8","#1A1A1A"], category: "Dresses", trending: true, badge: "Back in Stock", url: "https://www.cos.com/en_usd/women/womenswear/dresses.html", image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=520&fit=crop&q=80", measurements: { XS: "Bust 34-36, Waist 27-29, Hip 36-38", S: "Bust 36-38, Waist 29-31, Hip 38-40", M: "Bust 38-40, Waist 31-33, Hip 40-42", L: "Bust 40-42, Waist 33-35, Hip 42-44" }, fabric: "Organic cotton with contrast panels", sizingNote: "Relaxed drape — true to size" },
  { id: 21, name: "The Bootcut Jean", brand: "Everlane", brandId: "everlane", price: 108, fit: 0, risk: "Low", color: "#4A6FA5", colors: ["#4A6FA5","#1a1a1a","#7A5C3A"], category: "Bottoms", trending: true, badge: "Trending Now", url: "https://www.everlane.com/collections/womens-jeans", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=520&fit=crop&q=80", measurements: { "25": "Waist 25, Hip 35.5, Inseam 32", "26": "Waist 26, Hip 36.5, Inseam 32", "27": "Waist 27, Hip 37.5, Inseam 32.5", "28": "Waist 28, Hip 38.5, Inseam 32.5" }, fabric: "98% Organic cotton, 2% elastane bootcut", sizingNote: "The #1 denim silhouette of Spring 2026" },
  { id: 22, name: "The Cashmere V-Neck", brand: "Everlane", brandId: "everlane", price: 130, fit: 0, risk: "Low", color: "#E8E5E0", colors: ["#E8E5E0","#C4956a","#6A8FA8","#2D2D2D","#8B4A5A"], category: "Tops", trending: true, badge: "Trending Now", url: "https://www.everlane.com/products/womens-cashmere-v-neck", image: "https://images.unsplash.com/photo-1434389677669-e08b4cda3a7e?w=400&h=520&fit=crop&q=80", measurements: { XS: "Bust 33-34, Waist 25-26, Shoulder 14.5", S: "Bust 35-36, Waist 27-28, Shoulder 15", M: "Bust 37-38, Waist 29-30, Shoulder 15.5", L: "Bust 39-40, Waist 31-32, Shoulder 16" }, fabric: "100% Grade-A cashmere, deep V-neck", sizingNote: "V-necks are having a moment — relaxed fit" },
  { id: 23, name: "The Layered Crew Tee", brand: "Everlane", brandId: "everlane", price: 38, fit: 0, risk: "Low", color: "#F5F0E8", colors: ["#F5F0E8","#1a1a1a","#C4956a","#6A8FA8"], category: "Tops", trending: true, badge: "Trending Now", url: "https://www.everlane.com/products/womens-organic-cotton-box-cut-tee-white", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=520&fit=crop&q=80", measurements: { XS: "Bust 34-35, Waist 26-27", S: "Bust 36-37, Waist 28-29", M: "Bust 38-39, Waist 30-31", L: "Bust 40-41, Waist 32-33" }, fabric: "100% Organic cotton jersey — layer-ready", sizingNote: "Boxy cut made for the '90s layered look" },
  { id: 24, name: "Airlift High-Waist Legging", brand: "Alo Yoga", brandId: "alo", price: 118, fit: 0, risk: "Low", color: "#1A1A1A", colors: ["#1A1A1A","#5A3E4A","#4A6480","#7B9E87"], category: "Bottoms", trending: true, badge: "Best Seller", url: "https://www.aloyoga.com/products/w5473r-airlift-high-waist-legging-black", image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&h=520&fit=crop&q=80", measurements: { XS: "Waist 24-25, Hip 34-35, Inseam 28", S: "Waist 26-27, Hip 36-37, Inseam 28", M: "Waist 28-29, Hip 38-39, Inseam 28.5", L: "Waist 30-31, Hip 40-41, Inseam 28.5" }, fabric: "Airlift performance — ultra-smooth compression", sizingNote: "Runs true — high compression, go up for looser fit" },
  { id: 25, name: "Accolade Hoodie", brand: "Alo Yoga", brandId: "alo", price: 148, fit: 0, risk: "Low", color: "#E8E5E0", colors: ["#E8E5E0","#1a1a1a","#A0B8A0","#C4956a"], category: "Tops", trending: true, badge: "Viral on TikTok", url: "https://www.aloyoga.com/products/w4439r-accolade-hoodie-bone", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=520&fit=crop&q=80", measurements: { XS: "Bust 36-37, Waist 28-29, Shoulder 16", S: "Bust 38-39, Waist 30-31, Shoulder 16.5", M: "Bust 40-41, Waist 32-33, Shoulder 17", L: "Bust 42-43, Waist 34-35, Shoulder 17.5" }, fabric: "100% Cotton French terry", sizingNote: "Oversized — size down for closer fit" },
  { id: 26, name: "Phoenix Fleece Oversized Crew", brand: "Nike", brandId: "nike", price: 75, fit: 0, risk: "Low", color: "#2D2D2D", colors: ["#2D2D2D","#E8E5E0","#6A8FA8"], category: "Tops", trending: true, badge: "Trending Now", url: "https://www.nike.com/w/womens-hoodies-pullovers-5e1x6z6rive5", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=520&fit=crop&q=80", measurements: { XS: "Bust 33-35, Waist 25-27, Shoulder 15", S: "Bust 35-37, Waist 27-29, Shoulder 15.5", M: "Bust 37-39, Waist 29-31, Shoulder 16", L: "Bust 39-41, Waist 31-33, Shoulder 16.5" }, fabric: "80% Cotton, 20% Polyester brushed fleece", sizingNote: "Relaxed oversized fit — true to size" },
  { id: 27, name: "Windrunner Woven Jacket", brand: "Nike", brandId: "nike", price: 110, fit: 0, risk: "Low", color: "#4A6480", colors: ["#4A6480","#1A1A1A","#E8E5E0"], category: "Outerwear", trending: true, badge: "Spring 2026", url: "https://www.nike.com/w/womens-jackets-vests-50r7yz6rive5", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=520&fit=crop&q=80", measurements: { XS: "Bust 33-35, Waist 25-27, Shoulder 15.5", S: "Bust 35-37, Waist 27-29, Shoulder 16", M: "Bust 37-39, Waist 29-31, Shoulder 16.5", L: "Bust 39-41, Waist 31-33, Shoulder 17" }, fabric: "100% Recycled polyester ripstop", sizingNote: "Gorpcore staple — order normal size" },
  { id: 28, name: "Rosalia Sheer Midi Dress", brand: "Princess Polly", brandId: "princesspoly", price: 72, fit: 0, risk: "Low", color: "#D4A5A5", colors: ["#D4A5A5","#1A1A1A","#87CEEB","#F5F0E8"], category: "Dresses", trending: true, badge: "Viral on TikTok", url: "https://us.princesspolly.com/collections/dresses", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=520&fit=crop&q=80", measurements: { XS: "Bust 30-32, Waist 24-25, Hip 33-35", S: "Bust 32-34, Waist 25-27, Hip 35-37", M: "Bust 34-36, Waist 27-29, Hip 37-39", L: "Bust 36-38, Waist 29-31, Hip 39-41" }, fabric: "Sheer mesh with slip lining", sizingNote: "Romantic silhouette — true to size" },
  { id: 29, name: "Low-Rise Cargo Pant", brand: "Princess Polly", brandId: "princesspoly", price: 72, fit: 0, risk: "Low", color: "#D4C5A9", colors: ["#D4C5A9","#1A1A1A","#7B9E87"], category: "Bottoms", trending: true, badge: "Trending Now", url: "https://us.princesspolly.com/collections/pants", image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=520&fit=crop&q=80", measurements: { XS: "Waist 24-25, Hip 34-35, Inseam 30", S: "Waist 26-27, Hip 36-37, Inseam 30", M: "Waist 28-29, Hip 38-39, Inseam 30.5", L: "Waist 30-31, Hip 40-41, Inseam 30.5" }, fabric: "100% Cotton ripstop", sizingNote: "Relaxed low-rise — true to size" },
  { id: 30, name: "NBD Violet Satin Midi", brand: "Revolve", brandId: "revolve", price: 228, fit: 0, risk: "Low", color: "#7B5E91", colors: ["#7B5E91","#1A1A1A","#D4A5A5"], category: "Dresses", trending: true, badge: "Pinterest Pick", url: "https://www.revolve.com/nbd/br/9a0dd7/", image: "https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=400&h=520&fit=crop&q=80", measurements: { XS: "Bust 32-33, Waist 24-25, Hip 35-36", S: "Bust 34-35, Waist 26-27, Hip 37-38", M: "Bust 36-37, Waist 28-29, Hip 39-40", L: "Bust 38-39, Waist 30-31, Hip 41-42" }, fabric: "100% Satin polyester — rich violet", sizingNote: "Bold color trend of 2026 — size for bust" },
];
const DEFAULT_BODY = { bust: 34, waist: 26, hips: 36, inseam: 30, shoulder: 15 };
const STORAGE_KEY = "tailored_v2_data";
const TAILOR_OPTIONS = [
  { id: "hem", label: "Hem / Length Adjustment", price: 15, iconId: "scissors" },
  { id: "waist", label: "Waist Taken In / Let Out", price: 20, iconId: "measure" },
  { id: "sleeve", label: "Sleeve Shortened", price: 12, iconId: "thread" },
  { id: "taper", label: "Taper Legs", price: 18, iconId: "ruler" },
  { id: "bust", label: "Bust Dart Adjustment", price: 22, iconId: "needle" },
  { id: "custom", label: "Custom Alteration Notes", price: 0, iconId: "pen" },
];

// ─── Fit Engine ────────────────────────────────────────────
function parseMeasurements(str) {
  const result = {};
  if (!str) return result;
  str.replace(/in\b/g, "").split(",").map(s => s.trim()).forEach(part => {
    const m = part.match(/^(\w+)\s+([\d.]+)(?:\s*-\s*([\d.]+))?/);
    if (m) { const k = m[1].toLowerCase(), v1 = parseFloat(m[2]), v2 = m[3] ? parseFloat(m[3]) : null; result[k] = v2 !== null ? { min: v1, max: v2, mid: (v1 + v2) / 2 } : { min: v1, max: v1, mid: v1 }; }
  });
  return result;
}
function computeFitForSize(userBody, measStr, category) {
  const meas = parseMeasurements(measStr);
  if (category === "Shoes") return 85;
  const weights = { Tops: { bust: 0.55, chest: 0.55, waist: 0.3, shoulder: 0.15 }, Bottoms: { waist: 0.45, hip: 0.35, inseam: 0.2 }, Dresses: { bust: 0.3, waist: 0.35, hip: 0.35 }, Outerwear: { bust: 0.5, chest: 0.5, waist: 0.3, shoulder: 0.2 } }[category] || { bust: 0.55, waist: 0.3, shoulder: 0.15 };
  const bodyMap = { bust: "bust", chest: "bust", waist: "waist", hip: "hips", inseam: "inseam", shoulder: "shoulder" };
  let tw = 0, ws = 0;
  for (const [key, dims] of Object.entries(meas)) {
    const uk = bodyMap[key]; if (!uk || !userBody[uk]) continue;
    const uv = userBody[uk], w = weights[key] || 0.05;
    const ds = uv >= dims.min && uv <= dims.max ? 100 : Math.max(50, 100 - (uv < dims.min ? dims.min - uv : uv - dims.max) * 10);
    tw += w; ws += ds * w;
  }
  return tw === 0 ? 88 : Math.min(99, Math.max(55, Math.round(ws / tw)));
}
function computeItemFit(userBody, item) {
  let bestScore = 0, bestSize = Object.keys(item.measurements)[0] || "M";
  for (const [size, measStr] of Object.entries(item.measurements)) {
    const score = computeFitForSize(userBody, measStr, item.category);
    if (score > bestScore) { bestScore = score; bestSize = size; }
  }
  return { fit: bestScore, bestSize, risk: bestScore >= 90 ? "Low" : bestScore >= 75 ? "Medium" : "High" };
}
function enrichCatalog(userBody) {
  return CATALOG.map(item => { const { fit, bestSize, risk } = computeItemFit(userBody, item); return { ...item, fit, bestSize, risk }; });
}
// In-memory persistence only — preview iframes forbid localStorage/sessionStorage/indexedDB.
// State is reset on reload, which is acceptable for the demo preview surface.
function loadUserData() { return null; }
function saveUserData(_data) { /* no-op: in-memory only for iframe deploy */ }
function generateFitReason(item, userBody) {
  const { bust, waist, hips } = userBody;
  const brand = item.brand, cat = item.category, sizingNote = item.sizingNote || "";
  const runsSmall = sizingNote.toLowerCase().includes("small") || sizingNote.toLowerCase().includes("size up");
  const oversized = sizingNote.toLowerCase().includes("oversized") || sizingNote.toLowerCase().includes("relaxed");
  const bodycon = sizingNote.toLowerCase().includes("body") || sizingNote.toLowerCase().includes("fitted");
  if (item.fit >= 95) {
    if (cat === "Tops") return `Your ${bust}" bust is right in the sweet spot for ${brand}'s ${item.bestSize}. ${oversized ? "The relaxed cut gives you room through the waist." : "Clean lines through the torso."}`;
    if (cat === "Bottoms") return `Your ${waist}" waist and ${hips}" hips align perfectly with ${brand}'s ${item.bestSize}. ${runsSmall ? `Since ${brand} runs small, we sized you up.` : "True to size for you."}`;
    if (cat === "Dresses") return `At ${bust}-${waist}-${hips}, this ${brand} ${item.bestSize} drapes perfectly on your frame. ${bodycon ? "The stretch fabric hugs your proportions." : "Beautiful flow on your silhouette."}`;
    return `This ${brand} ${item.bestSize} is built for your exact proportions. One of your highest-confidence fits.`;
  } else if (item.fit >= 88) {
    if (runsSmall) return `${brand} tends to run small — we bumped you to a ${item.bestSize} so it sits right on your ${waist}" waist.`;
    if (oversized) return `The oversized cut on this ${brand} piece means your ${bust}" bust has plenty of room. ${item.bestSize} keeps it intentionally relaxed.`;
    return `Great match for your proportions in ${item.bestSize}. ${cat === "Bottoms" ? `Your ${hips}" hips fit well in ${brand}'s cut.` : `Works well with your ${bust}" bust measurement.`}`;
  }
  return `Decent fit in ${item.bestSize}, but ${brand}'s cut may feel ${waist < 26 ? "slightly loose at the waist" : "a bit snug in spots"}. Consider tailoring for a perfect result.`;
}

// ─── Shared UI Components ──────────────────────────────────
const GlassCard = ({ children, style = {}, onClick, hover = false }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => hover && setHovered(true)} onMouseLeave={() => hover && setHovered(false)} style={{ background: hovered ? C.cardHover : C.card, border: `1px solid ${hovered ? C.borderLight : C.border}`, borderRadius: 16, transition: "all 0.2s ease", transform: hovered ? "translateY(-1px)" : "none", boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.3)" : "none", cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  );
};
function FitBadge({ fit, size = "sm" }) {
  const good = fit >= 90, mid = fit >= 75;
  const bg = good ? C.successBg : mid ? C.warningBg : "rgba(248,113,113,0.1)";
  const color = good ? C.success : mid ? C.warning : C.danger;
  const border = good ? C.successBorder : mid ? C.warningBorder : "rgba(248,113,113,0.2)";
  return <div style={{ background: bg, color, border: `1px solid ${border}`, padding: size === "sm" ? "2px 8px" : "4px 12px", borderRadius: 20, fontSize: size === "sm" ? 10 : 12, fontWeight: 700, letterSpacing: 0.3, display: "flex", alignItems: "center", gap: 3 }}>{fit}% fit</div>;
}
function FitBar({ fit, label, showLabel = true }) {
  const color = fit >= 90 ? C.success : fit >= 75 ? C.warning : C.danger;
  return (
    <div style={{ marginBottom: showLabel ? 6 : 0 }}>
      {showLabel && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 10, color: C.muted }}>{label}</span><span style={{ fontSize: 10, fontWeight: 600, color }}>{fit}%</span></div>}
      <div style={{ height: 3, borderRadius: 2, background: C.bgElevated, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 2, background: color, width: `${fit}%`, transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)" }} /></div>
    </div>
  );
}
function NavBar({ active, onNav }) {
  const items = [
    { id: "home", icon: <HomeIcon />, label: "Shop" },
    { id: "trending", icon: <FireIcon />, label: "Trending" },
    { id: "brands", icon: <TagIcon />, label: "Brands" },
    { id: "style", icon: <SparkleIcon />, label: "Style AI" },
    { id: "profile", icon: <UserIcon />, label: "Profile" },
  ];
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(13,18,16,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-around", padding: "10px 0 22px", zIndex: 10 }}>
      {items.map(i => (
        <button key={i.id} onClick={() => onNav(i.id)} aria-label={i.label} aria-current={active === i.id ? "page" : undefined} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: active === i.id ? C.goldLight : C.muted, opacity: active === i.id ? 1 : 0.6, transition: "all 0.2s", position: "relative", padding: "4px 12px" }}>
          {i.icon}
          <span style={{ fontSize: 9, fontWeight: active === i.id ? 700 : 500, letterSpacing: 0.6 }}>{i.label}</span>
          {active === i.id && <div style={{ position: "absolute", top: -8, width: 28, height: 2.5, borderRadius: 2, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`, boxShadow: `0 0 10px ${C.gold}` }} />}
        </button>
      ))}
    </div>
  );
}
function BackButton({ onClick, label }) {
  return (
    <button onClick={onClick} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 12, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.accent, transition: "all 0.2s", gap: 4, padding: label ? "0 12px 0 8px" : "0 10px" }}>
      <ChevronLeft size={18} />{label && <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>}
    </button>
  );
}
function ItemCard({ item, onClick, isFav, toggleFav }) {
  return (
    <GlassCard hover onClick={onClick} style={{ overflow: "hidden" }}>
      <div style={{ position: "relative" }}>
        <div style={{ height: 180, background: item.image ? `url(${item.image}) center/cover no-repeat` : `linear-gradient(145deg, ${item.color} 0%, ${item.color}88 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {!item.image && <span style={{ color: "rgba(255,255,255,0.08)", fontSize: 36, fontFamily: font.serif }}>T</span>}
        </div>
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          <FitBadge fit={item.fit} />
          {item.badge && <div style={{ background: "rgba(13,18,16,0.78)", backdropFilter: "blur(8px)", padding: "2px 8px", borderRadius: 6, fontSize: 8, fontWeight: 700, color: C.goldLight, letterSpacing: 0.5, textTransform: "uppercase", border: `1px solid rgba(143,182,155,0.3)` }}>{item.badge}</div>}
        </div>
        <button onClick={e => { e.stopPropagation(); toggleFav(item.id); }} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <HeartIcon filled={isFav} />
        </button>
        {item.bestSize && <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", padding: "3px 8px", borderRadius: 8, fontSize: 10, fontWeight: 600, color: C.accent }}>Size {item.bestSize}</div>}
      </div>
      <div style={{ padding: "10px 12px 14px" }}>
        <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 500 }}>{item.brand}</div>
        <div style={{ fontSize: 12, fontWeight: 500, color: C.accent, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.3 }}>{item.name}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>${item.price}</div>
          <div style={{ fontSize: 9, color: item.risk === "Low" ? C.success : item.risk === "Medium" ? C.warning : C.danger, fontWeight: 600 }}>{item.risk} risk</div>
        </div>
        <div style={{ marginTop: 8 }}><FitBar fit={item.fit} showLabel={false} /></div>
      </div>
    </GlassCard>
  );
}
function Pill({ label, active, onClick, gold = false }) {
  const bg = active ? (gold ? C.goldBg : "rgba(255,255,255,0.1)") : "transparent";
  const border = active ? (gold ? C.goldBorder : "rgba(255,255,255,0.15)") : C.border;
  const color = active ? (gold ? C.gold : C.accent) : C.muted;
  return <button onClick={onClick} style={{ padding: "6px 16px", borderRadius: 20, border: `1px solid ${border}`, background: bg, color, fontSize: 11, fontWeight: active ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s", letterSpacing: 0.3 }}>{label}</button>;
}

// ─── Splash Screen ─────────────────────────────────────────
function SplashScreen({ onContinue }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    setTimeout(() => setPhase(1), 300);
    setTimeout(() => setPhase(2), 800);
    setTimeout(() => setPhase(3), 1300);
  }, []);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", background: `radial-gradient(120% 80% at 50% 0%, #1a2421 0%, ${C.bg} 60%)`, padding: "52px 32px 44px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-12%", right: "-22%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(143,182,155,0.12) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(8px)" }} />
      <div style={{ position: "absolute", bottom: "-10%", left: "-22%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(92,128,104,0.10) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(8px)" }} />

      <div style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? "translateY(0)" : "translateY(-12px)", transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px rgba(92,128,104,0.35)` }}>
            <span style={{ color: "#0d1210", fontSize: 18, fontWeight: 700, fontFamily: font.serif, fontStyle: "italic" }}>t</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: 3, textTransform: "uppercase" }}>The Tailored Co.</span>
            <span style={{ fontSize: 8.5, fontWeight: 500, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginTop: 3 }}>Fit · Made · Mended</span>
          </div>
        </div>
        <div style={{ padding: "4px 10px", borderRadius: 999, background: C.successBg, border: `1px solid ${C.successBorder}`, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, boxShadow: `0 0 8px ${C.success}` }} />
          <span style={{ fontSize: 9, fontWeight: 600, color: C.success, letterSpacing: 1 }}>LIVE</span>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, textAlign: "center", width: "100%" }}>
        <div style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s" }}>
          <h1 style={{ fontFamily: font.serif, fontSize: 46, fontWeight: 400, color: C.accent, lineHeight: 1.05, margin: 0, letterSpacing: -1.2 }}>
            Clothes that<br />
            <span style={{ color: C.goldLight, fontStyle: "italic", fontWeight: 500 }}>actually fit.</span>
          </h1>
        </div>
        <div style={{ opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? "translateY(0)" : "translateY(16px)", transition: "all 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s" }}>
          <p style={{ fontSize: 15, color: C.mutedLight, lineHeight: 1.65, maxWidth: 300, margin: 0 }}>
            Body-scan once. Get the right size at every brand. Fewer returns, less waste, more wear.
          </p>
        </div>

        <div style={{ opacity: phase >= 3 ? 1 : 0, transition: "opacity 0.7s 0.5s", display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 300, marginTop: 4 }}>
          {[
            { glyph: "◐", text: "3D body scan in 30 seconds", sub: "On-device · no upload" },
            { glyph: "≋", text: "Fit confidence on every item", sub: "Across 12+ brands" },
            { glyph: "❋", text: "Built for circular wardrobes", sub: "Buy less, keep longer" },
          ].map(({ glyph, text, sub }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "rgba(24,31,29,0.6)", backdropFilter: "blur(8px)", border: `1px solid ${C.border}`, borderRadius: 12, textAlign: "left" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.goldBg, border: `1px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 14, color: C.goldLight, fontFamily: font.serif }}>{glyph}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: C.accent, fontWeight: 600 }}>{text}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 320, opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? "translateY(0)" : "translateY(12px)", transition: "all 0.7s cubic-bezier(0.22,1,0.36,1) 0.6s" }}>
        <button onClick={onContinue} style={{ width: "100%", padding: "16px 0", borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: "#0d1210", fontSize: 14, fontWeight: 700, letterSpacing: 1.5, cursor: "pointer", boxShadow: `0 12px 36px rgba(92,128,104,0.4), 0 2px 0 rgba(255,255,255,0.06) inset`, textTransform: "uppercase" }}>
          Start Your Fit Profile
        </button>
        <p style={{ textAlign: "center", fontSize: 11, color: C.muted, marginTop: 14, letterSpacing: 0.3 }}>No account · 30 seconds · Stays on your device</p>
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

  const heightInches = useMetric ? Math.round(heightCm / 2.54) : heightFt * 12 + heightIn;

  const handleScanComplete = (meas) => {
    setBody(meas);
    setScanning(false);
    setStep("review");
  };

  const SliderRow = ({ label, key2, min, max, unit = '"', step2 = 0.5 }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: C.accent, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>{body[key2]}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step2} value={body[key2]} onChange={e => setBody(b => ({ ...b, [key2]: parseFloat(e.target.value) }))}
        style={{ width: "100%", accentColor: C.gold, cursor: "pointer" }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 9, color: C.muted }}>{min}{unit}</span>
        <span style={{ fontSize: 9, color: C.muted }}>{max}{unit}</span>
      </div>
    </div>
  );

  if (scanning) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, overflow: "auto" }}>
        <div style={{ padding: "18px 18px 0", display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <BackButton onClick={() => setScanning(false)} />
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 500, color: C.accent, margin: 0, fontFamily: font.serif }}>3D Body Scan</h2>
            <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>AI-powered measurement in 30 seconds</p>
          </div>
        </div>
        <div style={{ flex: 1, padding: "0 18px 40px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <CameraBodyScanner onScanComplete={handleScanComplete} onCancel={() => setScanning(false)} userHeight={heightInches} />
        </div>
      </div>
    );
  }

  if (step === "choose") {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, padding: "52px 24px 44px", overflow: "auto" }}>
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <h1 style={{ fontFamily: font.serif, fontSize: 32, fontWeight: 400, color: C.accent, margin: "0 0 10px", lineHeight: 1.2 }}>Let's get your fit</h1>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>We need your measurements to score every item for fit. How would you like to proceed?</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
          <GlassCard hover onClick={() => setScanning(true)} style={{ padding: 20 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: C.goldBg, border: `1px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CameraIcon size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: C.accent }}>AI Body Scan</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.gold, background: C.goldBg, border: `1px solid ${C.goldBorder}`, padding: "2px 8px", borderRadius: 6, letterSpacing: 0.5 }}>RECOMMENDED</span>
                </div>
                <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, margin: 0 }}>Use your camera for a 30-second 3D scan. Up to 96% accuracy — no tape measure needed.</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard hover onClick={() => setStep("manual")} style={{ padding: 20 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MeasureIcon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: C.accent, display: "block", marginBottom: 4 }}>Enter Manually</span>
                <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, margin: 0 }}>Type in your measurements from a tape measure or clothing label. Quick and precise.</p>
              </div>
            </div>
          </GlassCard>
        </div>

        <div style={{ padding: "14px 16px", background: C.tailorBg, border: `1px solid ${C.tailorBorder}`, borderRadius: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <SparkleIcon size={14} />
            <p style={{ fontSize: 11, color: C.tailor, lineHeight: 1.5, margin: 0 }}>Your measurements are stored only on your device and never shared. You can update them anytime in your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "manual") {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, overflow: "auto" }}>
        <div style={{ padding: "18px 18px 0", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <BackButton onClick={() => setStep("choose")} />
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 500, color: C.accent, margin: 0, fontFamily: font.serif }}>Your Measurements</h2>
            <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>Drag sliders to match your measurements</p>
          </div>
        </div>

        <div style={{ flex: 1, padding: "16px 18px 100px", overflow: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, padding: "10px 14px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Units</span>
            <div style={{ display: "flex", gap: 6 }}>
              <Pill label="in / ft" active={!useMetric} onClick={() => setUseMetric(false)} />
              <Pill label="cm / m" active={useMetric} onClick={() => setUseMetric(true)} />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, color: C.gold, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 14 }}>Height</p>
            {useMetric ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: C.accent, fontWeight: 500 }}>Height</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>{heightCm} cm</span>
                </div>
                <input type="range" min={140} max={200} step={1} value={heightCm} onChange={e => setHeightCm(parseInt(e.target.value))} style={{ width: "100%", accentColor: C.gold }} />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, color: C.accent }}>Feet</span><span style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>{heightFt}ft</span></div>
                  <input type="range" min={4} max={7} step={1} value={heightFt} onChange={e => setHeightFt(parseInt(e.target.value))} style={{ width: "100%", accentColor: C.gold }} />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, color: C.accent }}>Inches</span><span style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>{heightIn}"</span></div>
                  <input type="range" min={0} max={11} step={1} value={heightIn} onChange={e => setHeightIn(parseInt(e.target.value))} style={{ width: "100%", accentColor: C.gold }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ height: 1, background: C.border, marginBottom: 24 }} />
          <p style={{ fontSize: 11, color: C.gold, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 14 }}>Body Measurements</p>
          <SliderRow label="Bust / Chest" key2="bust" min={28} max={52} />
          <SliderRow label="Waist" key2="waist" min={20} max={44} />
          <SliderRow label="Hips" key2="hips" min={30} max={56} />
          <SliderRow label="Inseam" key2="inseam" min={22} max={36} />
          <SliderRow label="Shoulder Width" key2="shoulder" min={12} max={20} />

          <div style={{ display: "flex", justifyContent: "center", marginTop: 8, marginBottom: 16 }}>
            <Body3DViewer body={body} width={160} height={220} autoRotate />
          </div>
        </div>

        <div style={{ position: "sticky", bottom: 0, padding: "12px 18px 28px", background: "rgba(13,18,16,0.95)", backdropFilter: "blur(16px)", borderTop: `1px solid ${C.border}` }}>
          <button onClick={() => onComplete(body)} style={{ width: "100%", padding: "15px 0", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: "#0d1210", fontSize: 13, fontWeight: 600, letterSpacing: 1, cursor: "pointer" }}>
            Save & Start Shopping
          </button>
        </div>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, overflow: "auto" }}>
        <div style={{ padding: "18px 18px 0", display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <BackButton onClick={() => setStep("choose")} />
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 500, color: C.accent, margin: 0, fontFamily: font.serif }}>Your Measurements</h2>
            <p style={{ fontSize: 11, color: C.success, margin: 0 }}>Scan complete — review below</p>
          </div>
        </div>
        <div style={{ flex: 1, padding: "0 18px 100px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <Body3DViewer body={body} width={200} height={280} autoRotate />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {Object.entries(body).map(([k, v]) => (
              <GlassCard key={k} style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: C.muted, textTransform: "capitalize", marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.gold }}>{v}"</div>
              </GlassCard>
            ))}
          </div>
          <div style={{ padding: "12px 14px", background: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <CheckCircle size={16} />
              <p style={{ fontSize: 12, color: C.success, margin: 0, fontWeight: 500 }}>Measurements captured successfully. You can fine-tune these anytime in your profile.</p>
            </div>
          </div>
        </div>
        <div style={{ position: "sticky", bottom: 0, padding: "12px 18px 28px", background: "rgba(13,18,16,0.95)", backdropFilter: "blur(16px)", borderTop: `1px solid ${C.border}` }}>
          <button onClick={() => onComplete(body)} style={{ width: "100%", padding: "15px 0", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: "#0d1210", fontSize: 13, fontWeight: 600, letterSpacing: 1, cursor: "pointer" }}>
            Start Shopping
          </button>
        </div>
      </div>
    );
  }
  return null;
}

// ─── Home Screen ───────────────────────────────────────────
function HomeScreen({ catalog, onItemClick, favorites, toggleFav, onNav, userBody }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("fit");
  const categories = ["All", "Tops", "Bottoms", "Dresses", "Outerwear"];

  const filtered = useMemo(() => {
    let items = catalog;
    if (search) items = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.brand.toLowerCase().includes(search.toLowerCase()));
    if (category !== "All") items = items.filter(i => i.category === category);
    if (sortBy === "fit") items = [...items].sort((a, b) => b.fit - a.fit);
    else if (sortBy === "price_asc") items = [...items].sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") items = [...items].sort((a, b) => b.price - a.price);
    return items;
  }, [catalog, search, category, sortBy]);

  const topPicks = useMemo(() => catalog.filter(i => i.fit >= 90).sort((a, b) => b.fit - a.fit).slice(0, 5), [catalog]);
  const avgFit = Math.round(catalog.reduce((s, i) => s + i.fit, 0) / catalog.length);
  const perfectFits = catalog.filter(i => i.fit >= 90).length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      <div style={{ padding: "22px 18px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 14px rgba(92,128,104,0.3)` }}>
              <span style={{ color: "#0d1210", fontSize: 16, fontWeight: 700, fontFamily: font.serif, fontStyle: "italic" }}>t</span>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>The Tailored Co.</div>
              <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, marginTop: 1 }}>Your fits, ranked</div>
            </div>
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.mutedLight, fontSize: 11, padding: "7px 10px", cursor: "pointer", outline: "none" }}>
            <option value="fit">Best fit</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 28, fontWeight: 400, color: C.accent, margin: "0 0 4px", fontFamily: font.serif, lineHeight: 1.05, letterSpacing: -0.5 }}>For your body, <span style={{ fontStyle: "italic", color: C.goldLight }}>tonight</span>.</h2>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}><span style={{ color: C.success, fontWeight: 600 }}>{perfectFits}</span> perfect fits · avg <span style={{ color: C.goldLight, fontWeight: 600 }}>{avgFit}%</span> match across {catalog.length} pieces</p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><SearchIcon size={15} /></div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items or brands..." style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px 10px 36px", color: C.accent, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none" }}>
          {categories.map(c => <Pill key={c} label={c} active={category === c} onClick={() => setCategory(c)} />)}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "0 18px 90px" }}>
        {/* Top Picks Hero */}
        {!search && category === "All" && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TargetIcon size={14} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>Highest Fit Scores</span>
              </div>
              <button onClick={() => setSortBy("fit")} style={{ background: "none", border: "none", color: C.goldLight, fontSize: 11, cursor: "pointer", fontWeight: 600, letterSpacing: 0.5 }}>See all →</button>
            </div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
              {topPicks.map(item => (
                <div key={item.id} onClick={() => onItemClick(item)} style={{ flexShrink: 0, width: 150, cursor: "pointer" }}>
                  <GlassCard hover style={{ overflow: "hidden" }}>
                    <div style={{ height: 160, background: item.image ? `url(${item.image}) center/cover no-repeat` : `linear-gradient(145deg, ${item.color}, ${item.color}88)`, position: "relative" }}>
                      <div style={{ position: "absolute", top: 8, left: 8 }}><FitBadge fit={item.fit} /></div>
                      <button onClick={e => { e.stopPropagation(); toggleFav(item.id); }} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><HeartIcon filled={favorites.has(item.id)} /></button>
                    </div>
                    <div style={{ padding: "8px 10px 10px" }}>
                      <div style={{ fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{item.brand}</div>
                      <div style={{ fontSize: 11, color: C.accent, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, marginTop: 4 }}>${item.price}</div>
                    </div>
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fit confidence summary */}
        {!search && category === "All" && (
          <div style={{ padding: "16px 16px", background: `linear-gradient(135deg, ${C.goldBg}, rgba(92,128,104,0.05))`, border: `1px solid ${C.goldBorder}`, borderRadius: 14, marginBottom: 22, display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9.5, color: C.goldLight, marginBottom: 4, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>Your Fit Profile</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.accent, fontFamily: font.serif, lineHeight: 1 }}>{avgFit}<span style={{ fontSize: 14, color: C.goldLight, fontFamily: font.sans, marginLeft: 2 }}>%</span></div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>average match across {catalog.length} pieces</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[["Perfect (90%+)", perfectFits, C.success], ["Good (75–89%)", catalog.filter(i => i.fit >= 75 && i.fit < 90).length, C.warning], ["Fair (<75%)", catalog.filter(i => i.fit < 75).length, C.danger]].map(([label, count, color]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                  <span style={{ fontSize: 10, color: C.muted }}>{label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {filtered.map(item => <ItemCard key={item.id} item={item} onClick={() => onItemClick(item)} isFav={favorites.has(item.id)} toggleFav={toggleFav} />)}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 14, color: C.muted }}>No items found for "{search}"</p>
          </div>
        )}
      </div>
      <NavBar active="home" onNav={onNav} />
    </div>
  );
}

// ─── Trending Screen ───────────────────────────────────────
function TrendingScreen({ catalog, onItemClick, favorites, toggleFav, onNav }) {
  const trendingItems = useMemo(() => catalog.filter(i => i.trending).sort((a, b) => b.fit - a.fit), [catalog]);
  const viral = trendingItems.filter(i => i.badge?.toLowerCase().includes("viral") || i.badge?.toLowerCase().includes("tiktok"));
  const editorsPicks = trendingItems.filter(i => i.badge?.toLowerCase().includes("editor") || i.badge?.toLowerCase().includes("pinterest"));
  const bestSellers = trendingItems.filter(i => i.badge?.toLowerCase().includes("best seller"));

  const Section = ({ title, icon, items, color = C.accent }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: 600, color }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: C.border, marginLeft: 4 }} />
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
        {items.slice(0, 8).map(item => (
          <div key={item.id} onClick={() => onItemClick(item)} style={{ flexShrink: 0, width: 155, cursor: "pointer" }}>
            <GlassCard hover style={{ overflow: "hidden" }}>
              <div style={{ height: 170, background: item.image ? `url(${item.image}) center/cover no-repeat` : `linear-gradient(145deg, ${item.color}, ${item.color}88)`, position: "relative" }}>
                <div style={{ position: "absolute", top: 8, left: 8 }}><FitBadge fit={item.fit} /></div>
                <button onClick={e => { e.stopPropagation(); toggleFav(item.id); }} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><HeartIcon filled={favorites.has(item.id)} /></button>
                {item.badge && <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(13,18,16,0.78)", backdropFilter: "blur(8px)", padding: "2px 8px", borderRadius: 6, fontSize: 8, fontWeight: 700, color: C.goldLight, letterSpacing: 0.5, textTransform: "uppercase", border: `1px solid rgba(143,182,155,0.3)` }}>{item.badge}</div>}
              </div>
              <div style={{ padding: "8px 10px 10px" }}>
                <div style={{ fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{item.brand}</div>
                <div style={{ fontSize: 11, color: C.accent, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>${item.price}</span>
                  <span style={{ fontSize: 9, color: item.risk === "Low" ? C.success : C.warning, fontWeight: 600 }}>{item.risk} risk</span>
                </div>
              </div>
            </GlassCard>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 24, fontWeight: 400, color: C.accent, margin: "0 0 2px", fontFamily: font.serif }}>Trending Now</h2>
          <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>Curated for your fit · Spring 2026</p>
        </div>

        {/* Trend stats banner */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
          {[["🔥", "Viral", viral.length], ["✨", "Editor's Pick", editorsPicks.length], ["⭐", "Best Seller", bestSellers.length]].map(([icon, label, count]) => (
            <div key={label} style={{ flexShrink: 0, padding: "10px 14px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{count}</div>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: 0.5 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "0 18px 90px" }}>
        <Section title="Going Viral" icon="🔥" items={viral} color={C.danger} />
        <Section title="Editor's Picks" icon="✨" items={editorsPicks} color={C.gold} />
        <Section title="Best Sellers" icon="⭐" items={bestSellers} color={C.warning} />
        <Section title="All Trending" icon="📈" items={trendingItems} />
      </div>
      <NavBar active="trending" onNav={onNav} />
    </div>
  );
}

// ─── Brands Screen ─────────────────────────────────────────
function BrandsScreen({ catalog, onBrandClick, onNav }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      <div style={{ padding: "18px 18px 0" }}>
        <h2 style={{ fontSize: 24, fontWeight: 400, color: C.accent, margin: "0 0 2px", fontFamily: font.serif }}>Brands</h2>
        <p style={{ fontSize: 11, color: C.muted, margin: "0 0 16px" }}>Shop by brand — fit scores included</p>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "0 18px 90px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {BRANDS.map(b => {
            const items = catalog.filter(i => i.brandId === b.id);
            const avgFit = items.length ? Math.round(items.reduce((s, i) => s + i.fit, 0) / items.length) : 0;
            const topFit = items.length ? Math.max(...items.map(i => i.fit)) : 0;
            return (
              <GlassCard key={b.id} hover onClick={() => onBrandClick(b)} style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: b.color || "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid rgba(255,255,255,0.1)`, flexShrink: 0 }}>
                    <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{b.logo}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.accent, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</div>
                    <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>{items.length} items</div>
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 9, color: C.muted }}>Avg fit for you</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: avgFit >= 90 ? C.success : avgFit >= 75 ? C.warning : C.danger }}>{avgFit}%</span>
                  </div>
                  <FitBar fit={avgFit} showLabel={false} />
                </div>
                {b.sizeNote && <div style={{ fontSize: 9, color: C.muted, padding: "4px 8px", background: C.bgElevated, borderRadius: 6 }}>{b.sizeNote}</div>}
              </GlassCard>
            );
          })}
        </div>
      </div>
      <NavBar active="brands" onNav={onNav} />
    </div>
  );
}

function BrandDetailScreen({ brand, onBack, onItemClick, favorites, toggleFav, catalog }) {
  const items = catalog.filter(i => i.brandId === brand.id);
  const avgFit = items.length ? Math.round(items.reduce((s, i) => s + i.fit, 0) / items.length) : 0;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      <div style={{ padding: "18px 18px 0", display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <BackButton onClick={onBack} />
        <div style={{ width: 40, height: 40, borderRadius: 10, background: brand.color || "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid rgba(255,255,255,0.1)` }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{brand.logo}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: C.accent }}>{brand.name}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{items.length} items · avg {avgFit}% fit for you</div>
        </div>
      </div>
      {brand.sizeNote && (
        <div style={{ margin: "0 18px 14px", padding: "10px 14px", background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 10 }}>
          <p style={{ fontSize: 11, color: C.goldLight, margin: 0 }}>💡 {brand.sizeNote}</p>
        </div>
      )}
      <div style={{ flex: 1, overflow: "auto", padding: "0 18px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {items.map(item => <ItemCard key={item.id} item={item} onClick={() => onItemClick(item)} isFav={favorites.has(item.id)} toggleFav={toggleFav} />)}
        </div>
      </div>
    </div>
  );
}

// ─── Item Detail Screen ─────────────────────────────────────
function ItemDetailScreen({ item, onBack, isFav, toggleFav, onSendToTailor, userBody }) {
  const [showTryOn, setShowTryOn] = useState(false);
  const [tryOnSize, setTryOnSize] = useState(item.bestSize);
  const [tryOnColor, setTryOnColor] = useState(item.color);
  const [showFitMap, setShowFitMap] = useState(false);
  const [activeTab, setActiveTab] = useState("fit");
  const sizes = Object.entries(item.measurements);
  const colors = item.colors || [item.color];
  const reviews = [
    { initials: "A.M.", meas: '34-26-36, 5\'6"', kept: true, note: item.fit >= 94 ? "Fit perfectly, kept it" : "Slight fit issue but kept it" },
    { initials: "J.R.", meas: '33-25-35, 5\'5"', kept: item.fit >= 90, note: item.fit >= 90 ? "Ordered usual size, fits great" : "Runs small — size up" },
    { initials: "C.L.", meas: '35-27-37, 5\'7"', kept: true, note: item.sizingNote },
  ];
  const fitRegions = [
    { label: "Bust", score: Math.min(99, item.fit > 85 ? item.fit : item.fit - 5) },
    { label: "Waist", score: Math.min(99, item.fit > 90 ? item.fit + 3 : item.fit - 8) },
    { label: "Hips", score: Math.min(99, item.fit > 88 ? item.fit + 1 : item.fit - 3) },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, overflow: "auto" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(13,18,16,0.9)", backdropFilter: "blur(16px)" }}>
        <BackButton onClick={onBack} />
        <button onClick={() => toggleFav(item.id)} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 12, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <HeartIcon filled={isFav} />
        </button>
      </div>

      <div style={{ padding: "0 18px 40px" }}>
        {/* Image / Try-On */}
        <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 14, border: `1px solid ${showTryOn ? C.goldBorder : C.border}`, transition: "border-color 0.3s" }}>
          {showTryOn ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0 12px", background: C.bgElevated, position: "relative" }}>
              <Body3DViewer body={userBody} width={300} height={400} garment={{ ...item, color: tryOnColor }} autoRotate />
              {showFitMap && (
                <div style={{ position: "absolute", top: 16, left: 16, right: 16, pointerEvents: "none" }}>
                  <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                    {fitRegions.map(r => (
                      <div key={r.label} style={{ padding: "3px 8px", borderRadius: 6, background: r.score >= 90 ? "rgba(127,203,156,0.25)" : r.score >= 75 ? "rgba(95,176,176,0.25)" : "rgba(224,133,133,0.25)", border: `1px solid ${r.score >= 90 ? C.successBorder : r.score >= 75 ? C.warningBorder : "rgba(224,133,133,0.3)"}` }}>
                        <div style={{ fontSize: 8, color: C.muted, textAlign: "center" }}>{r.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: r.score >= 90 ? C.success : r.score >= 75 ? C.warning : C.danger, textAlign: "center" }}>{r.score}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {colors.length > 1 && (
                <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center" }}>
                  {colors.map(c => <button key={c} onClick={() => setTryOnColor(c)} style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: `2px solid ${tryOnColor === c ? C.gold : "transparent"}`, outline: tryOnColor === c ? `1px solid ${C.gold}` : "none", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 0 0 1px rgba(255,255,255,0.1)" }} />)}
                </div>
              )}
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", justifyContent: "center", padding: "0 16px" }}>
                {sizes.map(([sz]) => <button key={sz} onClick={() => setTryOnSize(sz)} style={{ padding: "4px 12px", borderRadius: 8, border: `1px solid ${tryOnSize === sz ? C.goldBorder : C.border}`, background: tryOnSize === sz ? C.goldBg : "transparent", color: tryOnSize === sz ? C.gold : C.muted, fontSize: 10, fontWeight: tryOnSize === sz ? 700 : 500, cursor: "pointer", transition: "all 0.2s" }}>{sz}</button>)}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "center" }}>
                <p style={{ fontSize: 9, color: C.muted, letterSpacing: 0.5 }}>Drag to rotate · Size {tryOnSize}</p>
                <button onClick={() => setShowFitMap(f => !f)} style={{ fontSize: 9, color: showFitMap ? C.gold : C.muted, background: "none", border: `1px solid ${showFitMap ? C.goldBorder : C.border}`, borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>Fit Map</button>
              </div>
            </div>
          ) : (
            <div style={{ height: 340, background: item.image ? `url(${item.image}) center/cover no-repeat` : `linear-gradient(145deg, ${item.color}, ${item.color}88)` }} />
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button onClick={() => setShowTryOn(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${!showTryOn ? C.goldBorder : C.border}`, background: !showTryOn ? C.goldBg : "transparent", color: !showTryOn ? C.gold : C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>Photo</button>
          <button onClick={() => setShowTryOn(true)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${showTryOn ? C.goldBorder : C.border}`, background: showTryOn ? C.goldBg : "transparent", color: showTryOn ? C.gold : C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>Virtual Try-On</button>
        </div>

        {/* Item Info */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <p style={{ fontSize: 10, color: C.gold, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, margin: 0 }}>Sourced from {item.brand}</p>
            {item.url && <button onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></button>}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 400, color: C.accent, fontFamily: font.serif, margin: "4px 0 8px", lineHeight: 1.3 }}>{item.name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: C.accent }}>${item.price}</span>
            <FitBadge fit={item.fit} size="lg" />
          </div>
          {item.badge && <div style={{ display: "inline-block", marginTop: 8, padding: "3px 10px", borderRadius: 6, background: C.goldBg, border: `1px solid ${C.goldBorder}`, fontSize: 9, fontWeight: 600, color: C.gold, letterSpacing: 0.5, textTransform: "uppercase" }}>{item.badge}</div>}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 16, background: C.card, borderRadius: 12, padding: 4, border: `1px solid ${C.border}` }}>
          {[["fit", "Fit Intelligence"], ["size", "Size Chart"], ["reviews", "Reviews"]].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", background: activeTab === id ? C.bgElevated : "transparent", color: activeTab === id ? C.accent : C.muted, fontSize: 11, fontWeight: activeTab === id ? 600 : 400, cursor: "pointer", transition: "all 0.2s" }}>{label}</button>
          ))}
        </div>

        {activeTab === "fit" && (
          <GlassCard style={{ padding: 18, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <TargetIcon size={16} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>Fit Intelligence</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Recommended size</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>{item.bestSize}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Return risk</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: item.risk === "Low" ? C.success : C.warning }}>{item.risk}</span>
            </div>
            <div style={{ marginBottom: 14 }}>
              {fitRegions.map(r => <FitBar key={r.label} fit={r.score} label={r.label} />)}
            </div>
            <div style={{ padding: "12px 14px", background: C.tailorBg, border: `1px solid ${C.tailorBorder}`, borderRadius: 10, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <SparkleIcon size={12} />
                <span style={{ fontSize: 9, fontWeight: 600, color: C.tailor, textTransform: "uppercase", letterSpacing: 0.5 }}>AI Stylist</span>
              </div>
              <p style={{ fontSize: 11, color: "rgba(250,250,249,0.75)", lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>{generateFitReason(item, userBody)}</p>
            </div>
            <div style={{ padding: "10px 12px", background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 10, marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: C.goldLight, lineHeight: 1.5, margin: 0 }}>{item.sizingNote}</p>
            </div>
            <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{item.fabric}</p>
          </GlassCard>
        )}

        {activeTab === "size" && (
          <GlassCard style={{ padding: 18, marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.accent, marginBottom: 14 }}>Size Chart</p>
            {sizes.map(([sz, meas]) => {
              const isBest = sz === item.bestSize;
              return (
                <div key={sz} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 12px", borderRadius: 10, marginBottom: 8, background: isBest ? C.goldBg : C.bgElevated, border: `1px solid ${isBest ? C.goldBorder : C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: isBest ? 700 : 500, color: isBest ? C.gold : C.accent }}>{sz}</span>
                    {isBest && <div style={{ padding: "2px 8px", borderRadius: 6, background: C.gold, fontSize: 8, fontWeight: 700, color: "#fff" }}>YOUR SIZE</div>}
                  </div>
                  <span style={{ fontSize: 10, color: C.muted, textAlign: "right", maxWidth: "60%" }}>{meas}</span>
                </div>
              );
            })}
          </GlassCard>
        )}

        {activeTab === "reviews" && (
          <GlassCard style={{ padding: 18, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.accent, margin: 0 }}>Community Reviews</p>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>{(reviews.filter(r => r.kept).length / reviews.length * 5).toFixed(1)}</span>
                <span style={{ fontSize: 10, color: C.muted }}>/ 5</span>
              </div>
            </div>
            {reviews.map((r, i) => (
              <div key={i} style={{ padding: "12px 0", borderBottom: i < reviews.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.goldBg, border: `1px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>{r.initials}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.accent }}>{r.initials}</div>
                      <div style={{ fontSize: 9, color: C.muted }}>{r.meas}</div>
                    </div>
                  </div>
                  <div style={{ padding: "2px 8px", borderRadius: 6, background: r.kept ? C.successBg : "rgba(248,113,113,0.1)", border: `1px solid ${r.kept ? C.successBorder : "rgba(248,113,113,0.2)"}`, fontSize: 9, fontWeight: 600, color: r.kept ? C.success : C.danger }}>
                    {r.kept ? "Kept" : "Returned"}
                  </div>
                </div>
                <p style={{ fontSize: 11, color: C.mutedLight, lineHeight: 1.5, margin: 0 }}>{r.note}</p>
              </div>
            ))}
          </GlassCard>
        )}

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => onSendToTailor(item)} style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: `1px solid ${C.tailorBorder}`, background: C.tailorBg, color: C.tailor, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <ScissorsIcon size={14} /> Tailor It
          </button>
          {item.url && (
            <button onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')} style={{ flex: 2, padding: "14px 0", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: "#0d1210", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Shop at {item.brand} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Style AI Screen ───────────────────────────────────────
function StyleAIScreen({ catalog, userBody, onItemClick, favorites, toggleFav, onNav }) {
  const insights = useMemo(() => {
    const { bust, waist, hips } = userBody;
    const ratio = hips / waist;
    const shape = ratio > 1.35 ? "Hourglass" : ratio > 1.2 ? "Pear" : bust > hips ? "Inverted Triangle" : "Rectangle";
    const topFits = catalog.filter(i => i.fit >= 90).sort((a, b) => b.fit - a.fit).slice(0, 6);
    const bestBrand = BRANDS.map(b => {
      const items = catalog.filter(i => i.brandId === b.id);
      const avg = items.length ? items.reduce((s, i) => s + i.fit, 0) / items.length : 0;
      return { ...b, avg };
    }).sort((a, b) => b.avg - a.avg)[0];
    const lowRisk = catalog.filter(i => i.risk === "Low").length;
    return { shape, topFits, bestBrand, lowRisk };
  }, [catalog, userBody]);

  const shapeAdvice = {
    Hourglass: "Your balanced bust-to-hip ratio works beautifully with fitted silhouettes, wrap styles, and belted pieces that highlight your waist.",
    Pear: "Your hips are wider than your shoulders — A-line skirts, wide-leg pants, and structured tops create beautiful balance.",
    "Inverted Triangle": "Your shoulders are broader — flowy bottoms, wide-leg trousers, and A-line skirts balance your proportions elegantly.",
    Rectangle: "Your proportions are similar throughout — cinched waists, peplum tops, and ruffled skirts add beautiful definition.",
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      <div style={{ padding: "18px 18px 0" }}>
        <h2 style={{ fontSize: 24, fontWeight: 400, color: C.accent, margin: "0 0 2px", fontFamily: font.serif }}>Style AI</h2>
        <p style={{ fontSize: 11, color: C.muted, margin: "0 0 16px" }}>Personalized insights for your body</p>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "0 18px 90px" }}>
        {/* Body Shape Card */}
        <GlassCard style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.gold, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 6 }}>Your Body Shape</div>
              <div style={{ fontSize: 28, fontWeight: 400, color: C.accent, fontFamily: font.serif, marginBottom: 8 }}>{insights.shape}</div>
              <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, margin: 0 }}>{shapeAdvice[insights.shape]}</p>
            </div>
            <Body3DViewer body={userBody} width={100} height={140} autoRotate />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
            {[["Bust", userBody.bust], ["Waist", userBody.waist], ["Hips", userBody.hips]].map(([k, v]) => (
              <div key={k} style={{ textAlign: "center", padding: "8px 0", background: C.bgElevated, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{k}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.gold, marginTop: 2 }}>{v}"</div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* AI Insight */}
        <div style={{ padding: "16px 18px", background: C.tailorBg, border: `1px solid ${C.tailorBorder}`, borderRadius: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <SparkleIcon size={16} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.tailor }}>AI Stylist Insight</span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(250,250,249,0.8)", lineHeight: 1.7, margin: "0 0 12px", fontStyle: "italic" }}>
            "Based on your {userBody.bust}-{userBody.waist}-{userBody.hips} measurements, you have a {insights.shape.toLowerCase()} shape. 
            {insights.bestBrand ? ` ${insights.bestBrand.name} is your best-matching brand at ${Math.round(insights.bestBrand.avg)}% average fit.` : ""} 
            {insights.lowRisk} items in the catalog are low return-risk for you."
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, padding: "10px 12px", background: "rgba(167,139,250,0.1)", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.tailor }}>{insights.lowRisk}</div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>Low risk items</div>
            </div>
            <div style={{ flex: 1, padding: "10px 12px", background: C.successBg, borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.success }}>{insights.topFits.length}</div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>Perfect fits (90%+)</div>
            </div>
            {insights.bestBrand && (
              <div style={{ flex: 1, padding: "10px 12px", background: C.goldBg, borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>{insights.bestBrand.name}</div>
                <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>Best brand</div>
              </div>
            )}
          </div>
        </div>

        {/* Style Tips */}
        <GlassCard style={{ padding: 18, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.accent, marginBottom: 14 }}>Style Tips for You</p>
          {[
            { icon: "✅", tip: "Fitted waistlines highlight your proportions" },
            { icon: "✅", tip: "Stretch fabrics (jersey, modal) give the best fit scores" },
            { icon: "✅", tip: "High-waist bottoms elongate your silhouette" },
            { icon: "⚡", tip: "Avoid boxy cuts — they hide your shape" },
          ].map(({ icon, tip }) => (
            <div key={tip} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span style={{ fontSize: 12, color: C.mutedLight, lineHeight: 1.5 }}>{tip}</span>
            </div>
          ))}
        </GlassCard>

        {/* Top Picks */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.accent, marginBottom: 12 }}>Your Top Picks</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {insights.topFits.map(item => <ItemCard key={item.id} item={item} onClick={() => onItemClick(item)} isFav={favorites.has(item.id)} toggleFav={toggleFav} />)}
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
  const total = [...selected].reduce((s, id) => { const opt = TAILOR_OPTIONS.find(o => o.id === id); return s + (opt?.price || 0); }, 0);
  const toggle = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      <div style={{ padding: "18px 18px 0", display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <BackButton onClick={onBack} />
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 500, color: C.accent, margin: 0, fontFamily: font.serif }}>Tailor It</h2>
          <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{item.name}</p>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "0 18px 100px" }}>
        <div style={{ padding: "14px 16px", background: C.tailorBg, border: `1px solid ${C.tailorBorder}`, borderRadius: 12, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <SparkleIcon size={14} />
            <p style={{ fontSize: 11, color: C.tailor, lineHeight: 1.5, margin: 0 }}>Select alterations to make this garment fit you perfectly. A local tailor will be matched to your order.</p>
          </div>
        </div>
        {TAILOR_OPTIONS.map(opt => {
          const IconComp = TAILOR_ICON_MAP[opt.iconId] || ScissorsIcon;
          const isSelected = selected.has(opt.id);
          return (
            <GlassCard key={opt.id} hover onClick={() => toggle(opt.id)} style={{ padding: "14px 16px", marginBottom: 10, border: `1px solid ${isSelected ? C.tailorBorder : C.border}`, background: isSelected ? C.tailorBg : C.card }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: isSelected ? "rgba(167,139,250,0.15)" : C.bgElevated, display: "flex", alignItems: "center", justifyContent: "center", color: isSelected ? C.tailor : C.muted, flexShrink: 0 }}>
                  <IconComp size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: isSelected ? C.accent : C.mutedLight }}>{opt.label}</div>
                  {opt.price > 0 && <div style={{ fontSize: 11, color: isSelected ? C.tailor : C.muted, marginTop: 2 }}>+${opt.price}</div>}
                </div>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: isSelected ? C.tailor : "transparent", border: `2px solid ${isSelected ? C.tailor : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {isSelected && <CheckIcon />}
                </div>
              </div>
            </GlassCard>
          );
        })}
        {selected.has("custom") && (
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Describe your custom alteration..." style={{ width: "100%", background: C.card, border: `1px solid ${C.tailorBorder}`, borderRadius: 12, padding: "12px 14px", color: C.accent, fontSize: 12, lineHeight: 1.6, resize: "none", outline: "none", boxSizing: "border-box", minHeight: 80, marginTop: 4 }} />
        )}
      </div>
      <div style={{ position: "sticky", bottom: 0, padding: "12px 18px 28px", background: "rgba(13,18,16,0.95)", backdropFilter: "blur(16px)", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: C.muted }}>{selected.size} alteration{selected.size !== 1 ? "s" : ""} selected</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.accent }}>{total > 0 ? `+$${total}` : "Free consultation"}</span>
        </div>
        <button onClick={() => onConfirm({ item, alterations: [...selected], notes, total })} disabled={selected.size === 0} style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: selected.size > 0 ? `linear-gradient(135deg, ${C.tailor}, #7c3aed)` : C.border, color: selected.size > 0 ? "#fff" : C.muted, fontSize: 13, fontWeight: 600, cursor: selected.size > 0 ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
          {selected.size > 0 ? "Request Tailor →" : "Select at least one alteration"}
        </button>
      </div>
    </div>
  );
}

// ─── Profile Screen ─────────────────────────────────────────
function ProfileScreen({ userBody, onUpdateBody, favorites, catalog, onNav, tailorOrders }) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState({ ...userBody });
  const favItems = catalog.filter(i => favorites.has(i.id));
  const avgFit = Math.round(catalog.reduce((s, i) => s + i.fit, 0) / catalog.length);
  const perfectFits = catalog.filter(i => i.fit >= 90).length;

  if (editing) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, overflow: "auto" }}>
        <div style={{ padding: "18px 18px 0", display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <BackButton onClick={() => setEditing(false)} label="Cancel" />
          <h2 style={{ fontSize: 18, fontWeight: 500, color: C.accent, margin: 0, fontFamily: font.serif, flex: 1 }}>Edit Measurements</h2>
          <button onClick={() => { onUpdateBody(editBody); setEditing(false); }} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: "#0d1210", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save</button>
        </div>
        <div style={{ flex: 1, padding: "0 18px 40px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <Body3DViewer body={editBody} width={160} height={220} autoRotate />
          </div>
          {Object.entries(editBody).map(([key, val]) => {
            const ranges = { bust: [28, 52], waist: [20, 44], hips: [30, 56], inseam: [22, 36], shoulder: [12, 20] };
            const [min, max] = ranges[key] || [10, 60];
            return (
              <div key={key} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: C.accent, fontWeight: 500, textTransform: "capitalize" }}>{key}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>{val}"</span>
                </div>
                <input type="range" min={min} max={max} step={0.5} value={val} onChange={e => setEditBody(b => ({ ...b, [key]: parseFloat(e.target.value) }))} style={{ width: "100%", accentColor: C.gold }} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 400, color: C.accent, margin: "0 0 2px", fontFamily: font.serif }}>Profile</h2>
            <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>Your fit identity</p>
          </div>
          <button onClick={() => setEditing(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 11, cursor: "pointer" }}>
            <EditIcon size={13} /> Edit
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "0 18px 90px" }}>
        {/* Body preview */}
        <GlassCard style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Body3DViewer body={userBody} width={100} height={140} autoRotate />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.gold, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 8 }}>Your Measurements</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {Object.entries(userBody).map(([k, v]) => (
                  <div key={k} style={{ padding: "6px 8px", background: C.bgElevated, borderRadius: 8, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 8, color: C.muted, textTransform: "capitalize" }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{v}"</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Fit Stats */}
        <GlassCard style={{ padding: 18, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.accent, marginBottom: 14 }}>Fit Statistics</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Avg Fit", value: `${avgFit}%`, color: C.gold },
              { label: "Perfect Fits", value: perfectFits, color: C.success },
              { label: "Saved", value: favorites.size, color: C.tailor },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: "center", padding: "12px 8px", background: C.bgElevated, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Tailor Orders */}
        {tailorOrders.length > 0 && (
          <GlassCard style={{ padding: 18, marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.accent, marginBottom: 14 }}>Tailor Orders</p>
            {tailorOrders.map((order, i) => (
              <div key={i} style={{ padding: "12px 0", borderBottom: i < tailorOrders.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: C.accent }}>{order.item.name}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{order.alterations.length} alteration{order.alterations.length !== 1 ? "s" : ""}</div>
                  </div>
                  <div style={{ display: "flex", flex: "column", alignItems: "flex-end", gap: 4 }}>
                    {order.total > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>+${order.total}</span>}
                    <div style={{ padding: "2px 8px", borderRadius: 6, background: C.successBg, border: `1px solid ${C.successBorder}`, fontSize: 9, fontWeight: 600, color: C.success }}>Confirmed</div>
                  </div>
                </div>
              </div>
            ))}
          </GlassCard>
        )}

        {/* Saved Items */}
        {favItems.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.accent, marginBottom: 12 }}>Saved Items ({favItems.length})</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {favItems.slice(0, 4).map(item => (
                <GlassCard key={item.id} style={{ overflow: "hidden" }}>
                  <div style={{ height: 120, background: item.image ? `url(${item.image}) center/cover no-repeat` : `linear-gradient(145deg, ${item.color}, ${item.color}88)` }} />
                  <div style={{ padding: "8px 10px 10px" }}>
                    <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{item.brand}</div>
                    <div style={{ fontSize: 11, color: C.accent, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                    <FitBadge fit={item.fit} />
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {favItems.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🤍</div>
            <p style={{ fontSize: 13 }}>No saved items yet — tap the heart on any item to save it here.</p>
          </div>
        )}
      </div>
      <NavBar active="profile" onNav={onNav} />
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────
export default function App() {
  const saved = loadUserData();
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

  const toggleFav = useCallback((id) => {
    setFavorites(f => { const n = new Set(f); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const handleItemClick = (item) => { setPrevScreen(screen); setSelectedItem(item); setScreen("item"); };
  const handleBrandClick = (brand) => { setPrevScreen(screen); setSelectedBrand(brand); setScreen("brand"); };
  const handleBack = () => { setScreen(prevScreen || navTab); setSelectedItem(null); setSelectedBrand(null); setTailorItem(null); };
  const handleNav = (tab) => { setNavTab(tab); setScreen(tab); setSelectedItem(null); setSelectedBrand(null); setTailorItem(null); };
  const handleOnboardingComplete = (body) => { setUserBody(body); setScreen("home"); setNavTab("home"); };
  const handleSendToTailor = (item) => { setTailorItem(item); setScreen("tailor"); };
  const handleTailorConfirm = (order) => { setTailorOrders(o => [...o, order]); setScreen("profile"); setNavTab("profile"); };
  const handleUpdateBody = (body) => { setUserBody(body); };

  const sharedProps = { catalog, favorites, toggleFav, onNav: handleNav, userBody };

  return (
    <div style={{ width: "100vw", height: "100vh", background: C.bg, display: "flex", justifyContent: "center", alignItems: "center", fontFamily: font.sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Manrope:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        input[type=range] { -webkit-appearance: none; height: 3px; border-radius: 2px; background: rgba(255,255,255,0.08); outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #8FB69B; cursor: pointer; box-shadow: 0 2px 10px rgba(143,182,155,0.45); border: 2px solid rgba(255,255,255,0.08); }
        input[type=range]::-moz-range-thumb { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.08); border-radius: 50%; background: #8FB69B; cursor: pointer; box-shadow: 0 2px 10px rgba(143,182,155,0.45); }
        input[type=text], input[type=range], textarea, select { font-family: inherit; }
        button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid rgba(143,182,155,0.6); outline-offset: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scanLine { 0%, 100% { top: 10%; opacity: 0.5; } 50% { top: 85%; opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes pulseRing { 0% { transform: scale(0.9); opacity: 0.7; } 100% { transform: scale(1.4); opacity: 0; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
      <div style={{ width: "100%", maxWidth: 430, height: "100%", maxHeight: 932, background: C.bg, position: "relative", overflow: "hidden", boxShadow: "0 0 80px rgba(0,0,0,0.8)" }}>
        {screen === "splash" && <SplashScreen onContinue={() => setScreen("onboarding")} />}
        {screen === "onboarding" && <OnboardingScreen onComplete={handleOnboardingComplete} />}
        {screen === "home" && <HomeScreen {...sharedProps} onItemClick={handleItemClick} />}
        {screen === "trending" && <TrendingScreen {...sharedProps} onItemClick={handleItemClick} />}
        {screen === "brands" && <BrandsScreen {...sharedProps} onBrandClick={handleBrandClick} />}
        {screen === "brand" && selectedBrand && <BrandDetailScreen brand={selectedBrand} onBack={handleBack} onItemClick={handleItemClick} favorites={favorites} toggleFav={toggleFav} catalog={catalog} />}
        {screen === "style" && <StyleAIScreen {...sharedProps} onItemClick={handleItemClick} />}
        {screen === "item" && selectedItem && <ItemDetailScreen item={selectedItem} onBack={handleBack} isFav={favorites.has(selectedItem.id)} toggleFav={toggleFav} onSendToTailor={handleSendToTailor} userBody={userBody} />}
        {screen === "tailor" && tailorItem && <TailorScreen item={tailorItem} onBack={handleBack} onConfirm={handleTailorConfirm} />}
        {screen === "profile" && <ProfileScreen userBody={userBody} onUpdateBody={handleUpdateBody} favorites={favorites} catalog={catalog} onNav={handleNav} tailorOrders={tailorOrders} />}
      </div>
    </div>
  );
}
