// Schematic cardiac anatomy for the simulator.
//
// Patient coordinate frame (used everywhere in this project, units = cm here):
//   +x = patient's RIGHT, +y = ANTERIOR (toward the ceiling, patient supine),
//   +z = CRANIAL (toward the head). Origin = centre of the heart (isocentre).
//
// The ventricles are modelled as a blunt cone whose long axis runs from the
// base (AV groove) to the apex: leftward, anterior and caudal, as in a real
// chest. Coronary arteries are described on that surface with (u, phi, s):
//   u   = 0 at the AV groove, 1 at the apex (negative = above the base)
//   phi = angle around the long axis in degrees (0 = anterior face,
//         +90 = acute (right/inferior) margin, -90 = obtuse (left lateral) margin)
//   s   = radial factor (1 = on the epicardial surface, <1 = inside)

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

// Coronary tree. parent/at: the branch starts at fraction `at` along the parent.
// r0/r1: radius (cm) at origin and end. sys: 'L' = left system, 'R' = right.
export const VESSELS = [
  // ---- Left coronary system ----
  { id: 'LM', name: 'Left main', sys: 'L', r0: 0.24, r1: 0.22,
    pts: [[-0.12, -25, 0.32], [-0.06, -28, 0.7], [0.0, -32, 1]] },
  { id: 'LAD', name: 'LAD', sys: 'L', parent: 'LM', at: 1, r0: 0.19, r1: 0.06,
    pts: [[0.06, -22, 1], [0.2, -14, 1], [0.4, -12, 1], [0.6, -12, 1], [0.8, -14, 1], [0.95, -20, 1], [1.02, 40, 1], [0.97, 120, 1]] },
  { id: 'D1', name: 'Diagonal 1', sys: 'L', parent: 'LAD', at: 0.16, r0: 0.12, r1: 0.05,
    pts: [[0.25, -30, 1], [0.38, -48, 1], [0.55, -62, 1], [0.7, -70, 1]] },
  { id: 'D2', name: 'Diagonal 2', sys: 'L', parent: 'LAD', at: 0.38, r0: 0.1, r1: 0.04,
    pts: [[0.5, -26, 1], [0.64, -42, 1], [0.8, -54, 1]] },
  { id: 'S1', name: 'Septal 1', sys: 'L', parent: 'LAD', at: 0.12, r0: 0.08, r1: 0.03,
    pts: [[0.26, 5, 0.85], [0.36, 30, 0.6], [0.46, 55, 0.4]] },
  { id: 'S2', name: 'Septal 2', sys: 'L', parent: 'LAD', at: 0.3, r0: 0.07, r1: 0.03,
    pts: [[0.48, 5, 0.85], [0.57, 30, 0.6], [0.66, 50, 0.4]] },
  { id: 'LCx', name: 'Circumflex', sys: 'L', parent: 'LM', at: 1, r0: 0.18, r1: 0.08,
    pts: [[0.02, -45, 1], [0.03, -70, 1], [0.03, -100, 1], [0.04, -130, 1], [0.05, -158, 1]] },
  { id: 'OM1', name: 'OM 1', sys: 'L', parent: 'LCx', at: 0.32, r0: 0.12, r1: 0.05,
    pts: [[0.12, -80, 1], [0.3, -82, 1], [0.5, -80, 1], [0.7, -76, 1]] },
  { id: 'OM2', name: 'OM 2', sys: 'L', parent: 'LCx', at: 0.62, r0: 0.11, r1: 0.04,
    pts: [[0.13, -118, 1], [0.32, -114, 1], [0.52, -106, 1], [0.68, -100, 1]] },

  // ---- Right coronary system ----
  { id: 'RCA', name: 'RCA', sys: 'R', r0: 0.22, r1: 0.14,
    pts: [[-0.12, 35, 0.32], [-0.05, 42, 0.75], [0.0, 50, 1], [0.03, 70, 1], [0.04, 95, 1], [0.05, 120, 1], [0.05, 142, 1], [0.05, 155, 1]] },
  { id: 'CB', name: 'Conus branch', sys: 'R', parent: 'RCA', at: 0.08, r0: 0.07, r1: 0.03,
    pts: [[0.08, 30, 1], [0.12, 12, 1], [0.14, -2, 1]] },
  { id: 'AM', name: 'Acute marginal', sys: 'R', parent: 'RCA', at: 0.45, r0: 0.09, r1: 0.04,
    pts: [[0.15, 88, 1], [0.35, 80, 1], [0.55, 70, 1], [0.7, 60, 1]] },
  { id: 'PDA', name: 'PDA', sys: 'R', parent: 'RCA', at: 1, r0: 0.11, r1: 0.04,
    pts: [[0.12, 152, 1], [0.3, 148, 1], [0.5, 146, 1], [0.7, 146, 1], [0.85, 146, 1]] },
  { id: 'PLV', name: 'PLV', sys: 'R', parent: 'RCA', at: 1, r0: 0.1, r1: 0.04,
    pts: [[0.06, 170, 1], [0.08, 188, 1], [0.15, 202, 1], [0.3, 210, 1]] },
];

function buildCurves() {
  const byId = {};
  for (const v of VESSELS) {
    const pts = v.pts.map(([u, phi, s]) => surfacePoint(u, phi, s));
    if (v.parent) {
      const p = byId[v.parent];
      pts.unshift(p.curve.getPointAt(v.at));
      v.start = p.start + v.at * p.length;
    } else {
      v.start = 0;
    }
    v.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    v.length = v.curve.getLength();
    byId[v.id] = v;
  }
  return byId;
}
export const VESSEL_BY_ID = buildCurves();

// Tapered tube. Indices are ordered from origin to tip so setDrawRange()
// reveals the vessel progressively (used for the contrast injection).
export function taperedTube(curve, r0, r1, segments = 64, radial = 10) {
  const frames = curve.computeFrenetFrames(segments, false);
  const pos = [], nrm = [], idx = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPointAt(t);
    const r = r0 + (r1 - r0) * t;
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

export function vesselGeometry(v) {
  if (!v.geometry) v.geometry = taperedTube(v.curve, v.r0, v.r1, Math.max(24, Math.round(v.length * 6)));
  return v.geometry;
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

// Great vessels and catheter paths (cm, patient frame).
export const AORTIC_ROOT = BASE.clone().addScaledVector(L, -0.12 * HEART_LENGTH).addScaledVector(E1, 0.4);

export const AORTA_CURVE = new THREE.CatmullRomCurve3([
  AORTIC_ROOT.clone().addScaledVector(L, 0.6),
  AORTIC_ROOT.clone(),
  new THREE.Vector3(1.6, 0.4, 5.2),
  new THREE.Vector3(1.6, 0.0, 8.0),
  new THREE.Vector3(0.6, -1.6, 10.2),
  new THREE.Vector3(-1.0, -3.6, 10.0),
  new THREE.Vector3(-1.8, -5.0, 7.5),
  new THREE.Vector3(-1.8, -5.6, 3.0),
  new THREE.Vector3(-1.6, -5.8, -4.0),
  new THREE.Vector3(-1.2, -6.0, -12.0),
], false, 'centripetal');

export const PULM_CURVE = new THREE.CatmullRomCurve3([
  surfacePoint(0.05, 10, 0.85),
  surfacePoint(-0.12, 0, 0.9),
  new THREE.Vector3(-1.2, 0.8, 5.6),
  new THREE.Vector3(-1.8, -1.0, 7.0),
], false, 'centripetal');

export const ATRIA_CENTER = BASE.clone().addScaledVector(L, -0.22 * HEART_LENGTH).addScaledVector(E1, -1.6);

// Catheter course: femoral/descending aorta -> arch -> ascending aorta -> ostium.
function catheterCurve(target, tipDir) {
  const ostium = target.curve.getPointAt(0);
  const pts = [
    new THREE.Vector3(-1.4, -5.9, -14),
    new THREE.Vector3(-1.6, -5.7, -4),
    new THREE.Vector3(-1.7, -5.4, 3),
    new THREE.Vector3(-1.6, -4.6, 7.6),
    new THREE.Vector3(-0.6, -3.2, 9.6),
    new THREE.Vector3(0.7, -1.4, 9.8),
    new THREE.Vector3(1.4, -0.1, 7.6),
    new THREE.Vector3(1.5 + tipDir.x, 0.4 + tipDir.y, 5.0),
    AORTIC_ROOT.clone().add(tipDir),
    ostium,
  ];
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
}
export const CATHETERS = {
  L: catheterCurve(VESSEL_BY_ID.LM, new THREE.Vector3(1.0, -0.8, 0.6)),
  R: catheterCurve(VESSEL_BY_ID.RCA, new THREE.Vector3(-1.2, 0.2, 0.8)),
};

// Colours used for the colour-coded anatomy mode and legends.
export const VESSEL_COLORS = {
  LM: '#f5c542', LAD: '#ff6b6b', D1: '#ff9f7a', D2: '#ffb59e', S1: '#d98cff', S2: '#d98cff',
  LCx: '#4dabf7', OM1: '#74c0fc', OM2: '#a5d8ff',
  RCA: '#51cf66', CB: '#8ce99a', AM: '#94d82d', PDA: '#20c997', PLV: '#63e6be',
};
