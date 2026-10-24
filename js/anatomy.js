// Schematic cardiac anatomy for the simulator.
//
// Patient coordinate frame (used everywhere in this project, units = cm here):
//   +x = patient's RIGHT, +y = ANTERIOR (toward the ceiling, patient supine),
//   +z = CRANIAL (toward the head). Origin = centre of the heart (isocentre).
//
// The ventricles are modelled as a blunt cone whose long axis runs from the
// base (AV groove) to the apex: leftward, anterior and caudal, as in a real
// chest. Native coronary arteries are described on that surface with (u, phi, s):
//   u   = 0 at the AV groove, 1 at the apex (negative = above the base)
//   phi = angle around the long axis in degrees (0 = anterior face,
//         +90 = acute (right/inferior) margin, -90 = obtuse (left lateral) margin)
//   s   = radial factor (1 = on the epicardial surface, <1 = inside)
// Bypass grafts are given as plain patient-frame points.

import * as THREE from 'three';

export const BASE = new THREE.Vector3(0.8, -0.8, 2.2);
export const APEX = new THREE.Vector3(-4.0, 3.6, -2.8);
export const BASE_RADIUS = 4.4;

const L = new THREE.Vector3().subVectors(APEX, BASE);
export const HEART_LENGTH = L.length();
L.normalize();
const ANT = new THREE.Vector3(0, 1, 0);
const E1 = ANT.clone().sub(L.clone().multiplyScalar(ANT.dot(L))).normalize(); // anterior face
const E2 = new THREE.Vector3().crossVectors(L, E1).normalize();                // acute margin

export const HEART_AXES = { L, E1, E2 };

export function radiusAt(u) {
  if (u <= 0) return BASE_RADIUS;
  if (u >= 1) return 0;
  return BASE_RADIUS * Math.sqrt(1 - u * u);
}

// Point on (or offset from) the heart surface.
export function surfacePoint(u, phiDeg, s = 1, lift = 0.25) {
  const phi = THREE.MathUtils.degToRad(phiDeg);
  const r = radiusAt(Math.max(u, 0)) * s + (s >= 0.99 ? lift : 0);
  const p = BASE.clone().addScaledVector(L, u * HEART_LENGTH);
  p.addScaledVector(E1, Math.cos(phi) * r).addScaledVector(E2, Math.sin(phi) * r);
  // near the apex the surface curves round the tip; keep vessels on it
  if (u > 0.92) p.addScaledVector(L, (u - 0.92) * 2.2);
  return p;
}

// Unit vector pointing away from the heart's long axis through p.
function radialOut(p) {
  const d = p.clone().sub(BASE);
  return d.sub(L.clone().multiplyScalar(d.dot(L))).normalize();
}

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------------------
// Great vessels
export const AORTIC_ROOT = BASE.clone().addScaledVector(L, -0.12 * HEART_LENGTH).addScaledVector(E1, 0.4);

export const AORTA_CURVE = new THREE.CatmullRomCurve3([
  AORTIC_ROOT.clone().addScaledVector(L, 0.6),
  AORTIC_ROOT.clone(),
  v3(1.6, 0.4, 5.2), v3(1.6, 0.0, 8.0), v3(0.6, -1.6, 10.2), v3(-1.0, -3.6, 10.0),
  v3(-1.8, -5.0, 7.5), v3(-1.8, -5.6, 3.0), v3(-1.6, -5.8, -4.0), v3(-1.2, -6.0, -12.0),
], false, 'centripetal');

export const PULM_CURVE = new THREE.CatmullRomCurve3([
  surfacePoint(0.05, 10, 0.85), surfacePoint(-0.12, 0, 0.9), v3(-1.2, 0.8, 5.6), v3(-1.8, -1.0, 7.0),
], false, 'centripetal');

export const SUBCLAVIAN_CURVE = new THREE.CatmullRomCurve3([
  v3(-0.9, -3.0, 10.4), v3(-1.8, -3.0, 12.8), v3(-4.5, -2.2, 14.8), v3(-8, -1.4, 15.3), v3(-12, -0.6, 14.6),
], false, 'centripetal');

export const ATRIA_CENTER = BASE.clone().addScaledVector(L, -0.22 * HEART_LENGTH).addScaledVector(E1, -1.6);

// Point on the ascending aorta wall, `toward` gives the side (unit-ish vector).
function aortaWall(t, toward, r = 1.35) {
  return AORTA_CURVE.getPointAt(t).addScaledVector(toward.clone().normalize(), r);
}

// ---------------------------------------------------------------------------
// Coronary tree. parent/at: the branch starts at fraction `at` along the parent.
// r0: radius (cm) at the origin, r1: radius at the tip.
// sys: which injection opacifies it: 'L', 'R' (native), 'LIMA', 'SVGR', 'SVGO' (grafts).
// pts: [u, phi, s] surface coords; xyz: patient-frame points; sub: [vesselId, from, to].
export const VESSELS = [
  // ---- Left coronary system ----
  { id: 'LM', name: 'Left main', sys: 'L', r0: 0.25, r1: 0.23,
    pts: [[-0.12, -25, 0.32], [-0.06, -28, 0.7], [0.0, -32, 1]] },
  { id: 'LAD', name: 'LAD', sys: 'L', parent: 'LM', at: 1, r0: 0.19, r1: 0.05,
    pts: [[0.06, -22, 1], [0.2, -14, 1], [0.4, -12, 1], [0.6, -12, 1], [0.8, -14, 1], [0.95, -20, 1], [1.02, 40, 1], [0.97, 120, 1]] },
  { id: 'D1', name: 'Diagonal 1', sys: 'L', parent: 'LAD', at: 0.16, r0: 0.12, r1: 0.04,
    pts: [[0.25, -30, 1], [0.38, -48, 1], [0.55, -62, 1], [0.72, -70, 1]] },
  { id: 'D2', name: 'Diagonal 2', sys: 'L', parent: 'LAD', at: 0.38, r0: 0.1, r1: 0.035,
    pts: [[0.5, -26, 1], [0.64, -42, 1], [0.8, -54, 1]] },
  { id: 'S1', name: 'Septal 1', sys: 'L', parent: 'LAD', at: 0.12, r0: 0.08, r1: 0.025,
    pts: [[0.26, 5, 0.85], [0.36, 30, 0.6], [0.46, 55, 0.4]] },
  { id: 'S2', name: 'Septal 2', sys: 'L', parent: 'LAD', at: 0.28, r0: 0.07, r1: 0.025,
    pts: [[0.46, 5, 0.85], [0.55, 30, 0.6], [0.64, 50, 0.4]] },
  { id: 'S3', name: 'Septal 3', sys: 'L', parent: 'LAD', at: 0.46, r0: 0.055, r1: 0.02,
    pts: [[0.64, 5, 0.85], [0.72, 28, 0.62], [0.8, 45, 0.45]] },
  { id: 'LCx', name: 'Circumflex', sys: 'L', parent: 'LM', at: 1, r0: 0.18, r1: 0.06,
    pts: [[0.02, -45, 1], [0.03, -70, 1], [0.03, -100, 1], [0.04, -130, 1], [0.05, -158, 1]] },
  { id: 'OM1', name: 'OM 1', sys: 'L', parent: 'LCx', at: 0.32, r0: 0.12, r1: 0.04,
    pts: [[0.12, -80, 1], [0.3, -82, 1], [0.5, -80, 1], [0.7, -76, 1]] },
  { id: 'OM2', name: 'OM 2', sys: 'L', parent: 'LCx', at: 0.62, r0: 0.11, r1: 0.035,
    pts: [[0.13, -118, 1], [0.32, -114, 1], [0.52, -106, 1], [0.68, -100, 1]] },
  { id: 'OM3', name: 'OM 3', sys: 'L', parent: 'LCx', at: 0.86, r0: 0.07, r1: 0.025,
    pts: [[0.12, -148, 1], [0.28, -144, 1], [0.45, -136, 1]] },

  // ---- Right coronary system ----
  { id: 'RCA', name: 'RCA', sys: 'R', r0: 0.22, r1: 0.13,
    pts: [[-0.12, 35, 0.32], [-0.05, 42, 0.75], [0.0, 50, 1], [0.03, 70, 1], [0.04, 95, 1], [0.05, 120, 1], [0.05, 142, 1], [0.05, 155, 1]] },
  { id: 'CB', name: 'Conus branch', sys: 'R', parent: 'RCA', at: 0.06, r0: 0.07, r1: 0.025,
    pts: [[0.08, 30, 1], [0.12, 12, 1], [0.14, -2, 1]] },
  { id: 'SAN', name: 'SA nodal', sys: 'R', parent: 'RCA', at: 0.1, r0: 0.06, r1: 0.025,
    pts: [[-0.08, 62, 1.02], [-0.2, 78, 0.95], [-0.32, 100, 0.85]] },
  { id: 'RVB', name: 'RV branch', sys: 'R', parent: 'RCA', at: 0.26, r0: 0.07, r1: 0.025,
    pts: [[0.12, 66, 1], [0.24, 52, 1], [0.36, 40, 1]] },
  { id: 'AM', name: 'Acute marginal', sys: 'R', parent: 'RCA', at: 0.45, r0: 0.09, r1: 0.03,
    pts: [[0.15, 88, 1], [0.35, 80, 1], [0.55, 70, 1], [0.7, 60, 1]] },
  { id: 'PDA', name: 'PDA', sys: 'R', parent: 'RCA', at: 1, r0: 0.11, r1: 0.035,
    pts: [[0.12, 152, 1], [0.3, 148, 1], [0.5, 146, 1], [0.7, 146, 1], [0.85, 146, 1]] },
  { id: 'PLV', name: 'PLV', sys: 'R', parent: 'RCA', at: 1, r0: 0.1, r1: 0.035,
    pts: [[0.06, 170, 1], [0.08, 188, 1], [0.15, 202, 1], [0.3, 210, 1]] },
  { id: 'PL2', name: 'PL 2', sys: 'R', parent: 'PLV', at: 0.45, r0: 0.06, r1: 0.025,
    pts: [[0.2, 192, 1], [0.35, 196, 1]] },
];

// Bypass grafts (added after the native tree so anastomosis points can be
// taken from the native curves).
function graftDefs(byId) {
  const lad = byId.LAD.curve.getPointAt(0.56);
  const rca = byId.RCA.curve.getPointAt(0.86);
  const om = byId.OM1.curve.getPointAt(0.45);
  const limaOrigin = SUBCLAVIAN_CURVE.getPointAt(0.55);
  const svgrOrigin = aortaWall(0.2, v3(0.55, 1, 0.1));
  const svgoOrigin = aortaWall(0.27, v3(-0.45, 1, 0.1));
  // end-to-side anastomosis: the graft lands on the artery heading downstream
  const approach = (vessel, t, back, lift) => {
    const c = byId[vessel].curve, p = c.getPointAt(t);
    return p.clone().addScaledVector(c.getTangentAt(t), -back).addScaledVector(radialOut(p), lift);
  };
  return [
    { id: 'LIMA', name: 'LIMA', sys: 'LIMA', r0: 0.13, r1: 0.1, graft: true,
      xyz: [limaOrigin, v3(-6.9, 1.0, 13.6), v3(-5.6, 5.8, 10.8), v3(-3.6, 8.3, 6.6), v3(-2.9, 8.2, 3.2),
        approach('LAD', 0.56, 2.6, 2.2), approach('LAD', 0.56, 1.0, 0.7), lad] },
    { id: 'LIMA_LAD', name: 'Distal LAD', sys: 'LIMA', parent: 'LIMA', at: 1, r0: 0.1, r1: 0.05, sub: ['LAD', 0.5, 1] },
    { id: 'SVGR', name: 'SVG → RCA', sys: 'SVGR', r0: 0.24, r1: 0.2, graft: true,
      xyz: [svgrOrigin, svgrOrigin.clone().add(v3(1.2, 1.0, -0.3)), v3(4.8, 3.4, 2.6), v3(6.2, 2.2, 0.0),
        approach('RCA', 0.86, 2.6, 2.0), approach('RCA', 0.86, 1.0, 0.6), rca] },
    { id: 'SVGR_RCA', name: 'Distal RCA', sys: 'SVGR', parent: 'SVGR', at: 1, r0: 0.14, r1: 0.12, sub: ['RCA', 0.78, 1] },
    { id: 'SVGR_PDA', name: 'PDA', sys: 'SVGR', parent: 'SVGR_RCA', at: 1, r0: 0.11, r1: 0.035, sub: ['PDA', 0, 1] },
    { id: 'SVGR_PLV', name: 'PLV', sys: 'SVGR', parent: 'SVGR_RCA', at: 1, r0: 0.1, r1: 0.035, sub: ['PLV', 0, 1] },
    { id: 'SVGO', name: 'SVG → OM', sys: 'SVGO', r0: 0.24, r1: 0.2, graft: true,
      xyz: [svgoOrigin, svgoOrigin.clone().add(v3(-0.8, 1.4, 0.2)), v3(-3.2, 4.4, 7.0), v3(-6.2, 3.4, 4.6),
        approach('OM1', 0.45, 2.8, 2.0), approach('OM1', 0.45, 1.0, 0.6), om] },
    { id: 'SVGO_OM', name: 'Distal OM 1', sys: 'SVGO', parent: 'SVGO', at: 1, r0: 0.11, r1: 0.04, sub: ['OM1', 0.3, 1] },
  ];
}

// Stenoses for the "lesions" toggle: position along the vessel, % diameter
// reduction, and length (fraction of the vessel).
export const LESIONS = [
  { vessel: 'LAD', at: 0.22, severity: 0.75, len: 0.06 },
  { vessel: 'LCx', at: 0.5, severity: 0.6, len: 0.09 },
  { vessel: 'OM1', at: 0.32, severity: 0.7, len: 0.1 },
  { vessel: 'RCA', at: 0.42, severity: 0.8, len: 0.05 },
  { vessel: 'D1', at: 0.14, severity: 0.5, len: 0.12 },
];

function buildCurves() {
  const byId = {};
  const add = (v) => {
    let pts;
    if (v.sub) {
      const [src, a, b] = v.sub;
      const c = byId[src].curve;
      pts = Array.from({ length: 12 }, (_, i) => c.getPointAt(a + ((b - a) * i) / 11));
    } else if (v.xyz) {
      pts = v.xyz.map((p) => p.clone());
    } else {
      pts = v.pts.map(([u, phi, s]) => surfacePoint(u, phi, s));
    }
    if (v.parent && !v.sub) {
      const p = byId[v.parent];
      pts.unshift(p.curve.getPointAt(v.at));
    }
    v.start = v.parent ? byId[v.parent].start + v.at * byId[v.parent].length : 0;
    v.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    v.length = v.curve.getLength();
    v.children = [];
    if (v.parent) byId[v.parent].children.push(v);
    byId[v.id] = v;
  };
  VESSELS.forEach(add);
  for (const g of graftDefs(byId)) { VESSELS.push(g); add(g); }
  for (const l of LESIONS) (byId[l.vessel].lesions ||= []).push(l);
  return byId;
}
export const VESSEL_BY_ID = buildCurves();

const smooth = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// Radius along a vessel: steps down after each side branch (Murray's law,
// r_parent^3 = r_distal^3 + r_branch^3), plus gentle taper to r1 at the tip.
// With `diseased`, focal stenoses narrow the lumen.
export function radiusProfile(v, diseased) {
  const drops = v.children.filter((c) => c.at < 0.98).map((c) => ({ at: c.at, r: c.r0 })).sort((a, b) => a.at - b.at);
  return (t) => {
    let r = v.r0;
    for (const d of drops) {
      const after = Math.cbrt(Math.max(r ** 3 - d.r ** 3, (r * 0.55) ** 3));
      r = r + (after - r) * smooth(d.at - 0.01, d.at + 0.03, t);
    }
    r *= 1 - 0.18 * t;                           // natural taper
    r = r + (v.r1 - r) * smooth(0.7, 1, t);      // fine distal tip
    r = Math.max(r, v.r1 * 0.8);
    if (diseased && v.lesions) {
      for (const l of v.lesions) {
        const x = (t - l.at) / l.len;
        r *= 1 - l.severity * Math.exp(-x * x * 2.5);
      }
    }
    return r;
  };
}

// Tube with a radius function. Indices are ordered from origin to tip so
// setDrawRange() reveals the vessel progressively (contrast injection).
export const linearRadius = (r0, r1) => (t) => r0 + (r1 - r0) * t;

export function taperedTube(curve, rf, segments = 64, radial = 10) {
  const frames = curve.computeFrenetFrames(segments, false);
  const pos = [], nrm = [], idx = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPointAt(t);
    const r = rf(t);
    const N = frames.normals[i], B = frames.binormals[i];
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const n = N.clone().multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a));
      nrm.push(n.x, n.y, n.z);
      pos.push(p.x + n.x * r, p.y + n.y * r, p.z + n.z * r);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j, b = a + radial + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setIndex(idx);
  g.userData.indicesPerSegment = radial * 6;
  g.userData.segments = segments;
  return g;
}

export function vesselGeometry(v, diseased = false) {
  v.geometries ||= {};
  const k = diseased && v.lesions ? 'd' : 'h';
  if (!v.geometries[k]) {
    // dense sampling so short stenoses keep their shape
    v.geometries[k] = taperedTube(v.curve, radiusProfile(v, k === 'd'), Math.max(32, Math.round(v.length * 12)));
  }
  return v.geometries[k];
}

// Ventricular "cone" surface, built in the same (u, phi) parametrisation.
export function ventricleGeometry() {
  const nu = 40, nphi = 48, pos = [], idx = [];
  for (let i = 0; i <= nu; i++) {
    const u = -0.04 + (1.04 * i) / nu;
    for (let j = 0; j <= nphi; j++) {
      const p = surfacePoint(Math.min(u, 1), (j / nphi) * 360, 0.999, 0);
      if (u >= 1) p.copy(APEX).addScaledVector(L, 0.18);
      pos.push(p.x, p.y, p.z);
    }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nphi; j++) {
    const a = i * (nphi + 1) + j, b = a + nphi + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------
// Left ventricular cavity (for the ventriculogram).
// Walls are defined relative to the LV long axis: the inferior wall faces the
// diaphragm, the anterior wall is opposite it, the septum faces the RV.
const LV_ANT = (() => { const a = v3(0, 0.3, 1); return a.sub(L.clone().multiplyScalar(a.dot(L))).normalize(); })();
const LV_SEPT = new THREE.Vector3().crossVectors(L, LV_ANT).normalize();
export const LV_WALLS = {
  anterior: LV_ANT, inferior: LV_ANT.clone().negate(), septal: LV_SEPT, lateral: LV_SEPT.clone().negate(),
};
const LV_BASE = BASE.clone().addScaledVector(L, 0.04 * HEART_LENGTH).addScaledVector(LV_WALLS.lateral, 1.0);
const LV_APEX = BASE.clone().addScaledVector(L, 0.88 * HEART_LENGTH).addScaledVector(LV_WALLS.lateral, 0.4);
const LV_AXIS = LV_APEX.clone().sub(LV_BASE);
const LV_LEN = LV_AXIS.length();
LV_AXIS.normalize();
const LV_R = 2.4;
export const LV_INFO = { base: LV_BASE, apex: LV_APEX, axis: LV_AXIS, length: LV_LEN, radius: LV_R };

export const WALL_MOTION = {
  normal: { name: 'Normal', mask: () => 0 },
  anterior: { name: 'Anterior / apical akinesis (LAD)', mask: (u, n) => Math.max(smooth(0.1, 0.7, n.dot(LV_WALLS.anterior)) * smooth(0.3, 0.6, u), smooth(0.72, 0.9, u)) },
  inferior: { name: 'Inferior akinesis (RCA)', mask: (u, n) => smooth(0.15, 0.7, n.dot(LV_WALLS.inferior)) * (1 - smooth(0.75, 0.92, u)) },
  lateral: { name: 'Lateral hypokinesis (LCx)', mask: (u, n) => 0.75 * smooth(0.15, 0.7, n.dot(LV_WALLS.lateral)) * (1 - smooth(0.8, 0.95, u)) },
};

const LV_NU = 36, LV_NPHI = 40, LV_UMIN = -0.16;
function lvBaseRadius(u) {
  if (u < 0) return LV_R * Math.sqrt(Math.max(0, 1 - (u / LV_UMIN) ** 2));
  return LV_R * Math.sqrt(Math.max(0, 1 - u ** 2.2));
}
export function lvGeometry() {
  const g = new THREE.BufferGeometry();
  const n = (LV_NU + 1) * (LV_NPHI + 1);
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const idx = [];
  for (let i = 0; i < LV_NU; i++) for (let j = 0; j < LV_NPHI; j++) {
    const a = i * (LV_NPHI + 1) + j, b = a + LV_NPHI + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  g.setIndex(idx);
  updateLV(g, 0, 'normal');
  return g;
}
// contraction: 0 = end-diastole, 1 = end-systole
const _n = new THREE.Vector3(), _p = new THREE.Vector3();
export function updateLV(g, contraction, wall = 'normal') {
  const pos = g.attributes.position.array;
  const mask = (WALL_MOTION[wall] || WALL_MOTION.normal).mask;
  let k = 0;
  for (let i = 0; i <= LV_NU; i++) {
    const u = LV_UMIN + ((1 - LV_UMIN) * i) / LV_NU;
    const uu = Math.max(u, 0);
    for (let j = 0; j <= LV_NPHI; j++) {
      const phi = (j / LV_NPHI) * Math.PI * 2;
      _n.copy(LV_WALLS.anterior).multiplyScalar(Math.cos(phi)).addScaledVector(LV_WALLS.septal, Math.sin(phi));
      const m = mask(uu, _n);
      const c = contraction * (1 - m);
      // ~35% radial shortening and ~12% long-axis shortening -> EF ~ 65%
      const r = lvBaseRadius(u) * (1 - 0.36 * c);
      const along = u * LV_LEN * (1 - 0.12 * c * smooth(0, 1, uu));
      _p.copy(LV_BASE).addScaledVector(LV_AXIS, along).addScaledVector(_n, r);
      pos[k++] = _p.x; pos[k++] = _p.y; pos[k++] = _p.z;
    }
  }
  g.attributes.position.needsUpdate = true;
  g.computeVertexNormals();
}
// Point on the LV wall in a given direction (for labels).
export function lvWallPoint(dir, u = 0.45) {
  return LV_BASE.clone().addScaledVector(LV_AXIS, u * LV_LEN).addScaledVector(dir, lvBaseRadius(u) * 1.05);
}

// ---------------------------------------------------------------------------
// Catheters: femoral approach, up the descending aorta and round the arch.
const DESC = [v3(-1.4, -5.9, -14), v3(-1.6, -5.7, -4), v3(-1.7, -5.4, 3), v3(-1.6, -4.6, 7.6)];
const ARCH = [v3(-0.6, -3.2, 9.6), v3(0.7, -1.4, 9.8), v3(1.4, -0.1, 7.6)];
const cath = (pts) => new THREE.CatmullRomCurve3(pts, false, 'centripetal');

function coronaryCatheter(target, tipDir) {
  return cath([...DESC, ...ARCH, v3(1.5 + tipDir.x, 0.4 + tipDir.y, 5.0), AORTIC_ROOT.clone().add(tipDir), target.curve.getPointAt(0)]);
}
function graftCatheter(origin, out) {
  return cath([...DESC, ...ARCH, origin.clone().addScaledVector(out, 0.7).add(v3(0, 0, 1.8)), origin]);
}
function pigtail() {
  const mid = LV_BASE.clone().addScaledVector(LV_AXIS, LV_LEN * 0.42);
  const pts = [...DESC, ...ARCH, v3(1.4, 0.2, 5.2), AORTIC_ROOT.clone(), LV_BASE.clone().addScaledVector(LV_AXIS, 0.4), mid];
  const c = LV_BASE.clone().addScaledVector(LV_AXIS, LV_LEN * 0.55).addScaledVector(LV_WALLS.anterior, 0.4);
  for (let i = 1; i <= 14; i++) {
    const a = Math.PI + (i / 14) * Math.PI * 2.2;
    pts.push(c.clone().addScaledVector(LV_AXIS, Math.cos(a) * 0.75 * -1).addScaledVector(LV_WALLS.anterior, Math.sin(a) * 0.75));
  }
  return cath(pts);
}
function imaCatheter(lima) {
  const sub = SUBCLAVIAN_CURVE;
  return cath([...DESC, v3(-1.4, -4.0, 9.6), sub.getPointAt(0.05), sub.getPointAt(0.25), sub.getPointAt(0.45), lima.curve.getPointAt(0)]);
}

export const CATHETERS = {
  L: coronaryCatheter(VESSEL_BY_ID.LM, v3(1.0, -0.8, 0.6)),
  R: coronaryCatheter(VESSEL_BY_ID.RCA, v3(-1.2, 0.2, 0.8)),
  LV: pigtail(),
  LIMA: imaCatheter(VESSEL_BY_ID.LIMA),
  SVGR: graftCatheter(VESSEL_BY_ID.SVGR.curve.getPointAt(0), v3(0.4, 1, 0)),
  SVGO: graftCatheter(VESSEL_BY_ID.SVGO.curve.getPointAt(0), v3(-0.3, 1, 0)),
};

// ---------------------------------------------------------------------------
// Post-CABG hardware: sternal wires, LIMA clips, SVG ostial ring markers.
export const STERNAL_WIRES = [11, 8.5, 6, 3.5, 1, -1.5].map((z) => v3(0.4, 8.8, z));
export const LIMA_CLIPS = [0.18, 0.3, 0.42, 0.54, 0.66, 0.76].map((t) => {
  const c = VESSEL_BY_ID.LIMA.curve;
  return { p: c.getPointAt(t), tangent: c.getTangentAt(t) };
});
export const GRAFT_MARKERS = ['SVGR', 'SVGO'].map((id) => {
  const c = VESSEL_BY_ID[id].curve;
  return { p: c.getPointAt(0.01), tangent: c.getTangentAt(0.01) };
});

// ---------------------------------------------------------------------------
// Injection targets: which vessels opacify and what the OSD shows.
export const TARGETS = {
  L: { name: 'Left coronary', osd: 'LCA', kind: 'coronary' },
  R: { name: 'Right coronary', osd: 'RCA', kind: 'coronary' },
  LV: { name: 'LV gram', osd: 'LV', kind: 'lv' },
  LIMA: { name: 'LIMA → LAD', osd: 'LIMA', kind: 'graft' },
  SVGR: { name: 'SVG → RCA', osd: 'SVG-RCA', kind: 'graft' },
  SVGO: { name: 'SVG → OM', osd: 'SVG-OM', kind: 'graft' },
};

// Where the operator pans the table for each injection (cm, patient frame).
// null = the default, centred on the native coronary tree.
function boxCenter(parts) {
  const box = new THREE.Box3();
  for (const [id, a = 0, b = 1] of parts) {
    const c = VESSEL_BY_ID[id].curve;
    for (let i = 0; i <= 20; i++) box.expandByPoint(c.getPointAt(a + ((b - a) * i) / 20));
  }
  return box.getCenter(new THREE.Vector3());
}
TARGETS.L.center = TARGETS.R.center = null;
TARGETS.LV.center = LV_BASE.clone().addScaledVector(LV_AXIS, LV_LEN * 0.4).add(v3(0, 0, 1.2));
TARGETS.LIMA.center = boxCenter([['LIMA', 0.45, 1], ['LIMA_LAD']]);
TARGETS.SVGR.center = boxCenter([['SVGR'], ['SVGR_PDA'], ['SVGR_PLV']]);
TARGETS.SVGO.center = boxCenter([['SVGO'], ['SVGO_OM']]);

// Colours used for the colour-coded anatomy mode and legends.
export const VESSEL_COLORS = {
  LM: '#f5c542', LAD: '#ff6b6b', D1: '#ff9f7a', D2: '#ffb59e', S1: '#d98cff', S2: '#d98cff', S3: '#d98cff',
  LCx: '#4dabf7', OM1: '#74c0fc', OM2: '#a5d8ff', OM3: '#a5d8ff',
  RCA: '#51cf66', CB: '#8ce99a', SAN: '#c0eb75', RVB: '#8ce99a', AM: '#94d82d', PDA: '#20c997', PLV: '#63e6be', PL2: '#63e6be',
  LIMA: '#ffd43b', LIMA_LAD: '#ff6b6b', SVGR: '#e599f7', SVGR_RCA: '#51cf66', SVGR_PDA: '#20c997', SVGR_PLV: '#63e6be',
  SVGO: '#e599f7', SVGO_OM: '#74c0fc',
};
