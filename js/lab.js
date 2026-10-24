// The C-arm lab: a 3D cath-lab room (C-arm, table, patient, heart) next to a
// simulated fluoroscopy monitor that is rendered from the X-ray tube's point
// of view. Used by every page of the site.
//
// World frame (metres) = patient frame: +x patient's right, +y anterior/up,
// +z cranial. LAO/RAO is the "propeller" rotation of the C around the patient's
// long axis (z); CRA/CAU is the "orbital" slide of the C through its collar,
// a rotation about the x axis. Views are named by where the DETECTOR is.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import {
  VESSELS, VESSEL_BY_ID, vesselGeometry, ventricleGeometry, taperedTube,
  AORTA_CURVE, PULM_CURVE, ATRIA_CENTER, CATHETERS, VESSEL_COLORS, } from './anatomy.js';
import { VIEWS, formatAngles } from './views-data.js';

const ISO = new THREE.Vector3(0, 1.02, 0);
const CM = 0.01;
const SRC_D = 0.72;     // isocentre -> focal spot
const DET_D = 0.42;     // isocentre -> detector face
const ARC_R = 0.9;
const FIELD = 0.27;     // detector field of view (m)
const DEG = Math.PI / 180;
// centre of the coronary tree's bounding box, placed at isocentre
const HEART_CENTROID = (() => {
  const box = new THREE.Box3();
  for (const v of VESSELS) for (const p of v.curve.getSpacedPoints(20)) box.expandByPoint(p);
  return box.getCenter(new THREE.Vector3());
})();

// ---------- materials ----------
function xrayMaterial(strength, shared) {
  return new THREE.ShaderMaterial({
    uniforms: { uStrength: { value: strength }, uFade: shared || { value: 1 } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uStrength; uniform float uFade;
      varying vec3 vN; varying vec3 vV;
      void main() {
        float f = abs(dot(normalize(vN), normalize(vV)));
        gl_FragColor = vec4(0.0, 0.0, 0.0, uStrength * uFade * pow(f, 0.55));
      }`,
    transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
  });
}

function labelEl(layer, text, cls = '') {
  const el = document.createElement('div');
  el.className = 'lab-label ' + cls;
  el.textContent = text;
  layer.appendChild(el);
  return el;
}

function placeLabel(el, world, camera, w, h, visible = true) {
  const p = world.clone().project(camera);
  const on = visible && p.z < 1 && Math.abs(p.x) < 1.05 && Math.abs(p.y) < 1.05;
  el.style.display = on ? '' : 'none';
  if (on) el.style.transform = `translate(${((p.x + 1) / 2) * w}px, ${((1 - p.y) / 2) * h}px) translate(-50%, -50%)`;
}

// ---------- anatomy meshes ----------
function buildHeartColor(shell = 1) {
  const g = new THREE.Group();
  const vent = new THREE.Mesh(ventricleGeometry(), new THREE.MeshStandardMaterial({
    color: 0xb03a3a, roughness: 0.6, transparent: true, opacity: 0.55 * shell, side: THREE.DoubleSide, depthWrite: false,
  }));
  vent.renderOrder = 2;
  g.add(vent);
  const atria = new THREE.Mesh(new THREE.SphereGeometry(3.2, 32, 20), new THREE.MeshStandardMaterial({
    color: 0x7a2f4a, roughness: 0.7, transparent: true, opacity: 0.45 * shell, depthWrite: false,
  }));
  atria.position.copy(ATRIA_CENTER);
  atria.scale.set(1.15, 0.8, 0.85);
  g.add(atria);
  const aorta = new THREE.Mesh(taperedTube(AORTA_CURVE, 1.5, 1.1, 120, 20), new THREE.MeshStandardMaterial({
    color: 0xd9534f, roughness: 0.5, transparent: true, opacity: 0.4 * shell, depthWrite: false,
  }));
  g.add(aorta);
  const pa = new THREE.Mesh(taperedTube(PULM_CURVE, 1.3, 1.1, 40, 16), new THREE.MeshStandardMaterial({
    color: 0x5b7bd5, roughness: 0.5, transparent: true, opacity: 0.4 * shell, depthWrite: false,
  }));
  g.add(pa);
  const vessels = {};
  for (const v of VESSELS) {
    const m = new THREE.Mesh(vesselGeometry(v), new THREE.MeshStandardMaterial({
      color: VESSEL_COLORS[v.id], emissive: VESSEL_COLORS[v.id], emissiveIntensity: 0.35, roughness: 0.4,
    }));
    m.renderOrder = 3;
    vessels[v.id] = m;
    g.add(m);
  }
  const catheters = {};
  for (const k of ['L', 'R']) {
    const m = new THREE.Mesh(new THREE.TubeGeometry(CATHETERS[k], 160, 0.1, 8), new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.3 }));
    catheters[k] = m;
    g.add(m);
  }
  return { group: g, vessels, catheters };
}

function buildXray(fade) {
  const g = new THREE.Group();
  const heart = new THREE.Mesh(ventricleGeometry(), xrayMaterial(0.07));
  g.add(heart);
  const atria = new THREE.Mesh(new THREE.SphereGeometry(3.2, 32, 20), xrayMaterial(0.05));
  atria.position.copy(ATRIA_CENTER); atria.scale.set(1.15, 0.8, 0.85);
  g.add(atria);
  // spine: vertebral bodies + pedicles
  const vb = new THREE.CylinderGeometry(2.0, 2.0, 2.2, 24).rotateX(Math.PI / 2);
  const ped = new THREE.CylinderGeometry(0.55, 0.55, 2.0, 12);
  for (let z = -16; z <= 16; z += 2.9) {
    const b = new THREE.Mesh(vb, xrayMaterial(0.2)); b.position.set(0.3, -9.5, z); g.add(b);
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(ped, xrayMaterial(0.14)); p.position.set(0.3 + s * 1.6, -12, z); g.add(p);
    }
  }
  // ribs
  for (let i = 0; i < 10; i++) {
    const z0 = 15 - i * 3.1;
    for (const s of [-1, 1]) {
      const c = new THREE.CatmullRomCurve3([
        [2.2, -10.5, z0], [9, -10, z0 - 1], [14.5, -4, z0 - 3.5], [14, 4, z0 - 6.5], [9, 8.5, z0 - 8.5], [3, 9.5, z0 - 9.5],
      ].map(([x, y, z]) => new THREE.Vector3(0.3 + s * x, y, z)));
      g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 40, 0.55, 8), xrayMaterial(0.08)));
    }
  }
  // diaphragm + liver/abdomen (the reason cranial views show a "dome")
  const abd = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), xrayMaterial(0.38));
  abd.scale.set(15, 11, 13); abd.position.set(1.5, -1.5, -17.6);
  g.add(abd);
  const vessels = {};
  for (const v of VESSELS) {
    const m = new THREE.Mesh(vesselGeometry(v), xrayMaterial(0.5, fade));
    vessels[v.id] = m;
    g.add(m);
  }
  const catheters = {};
  for (const k of ['L', 'R']) {
    const m = new THREE.Mesh(new THREE.TubeGeometry(CATHETERS[k], 160, 0.1, 8), xrayMaterial(0.75));
    catheters[k] = m; g.add(m);
  }
  return { group: g, vessels, catheters };
}

// ---------- room ----------
function buildRoom(scene) {
  scene.background = new THREE.Color(0x0f1720);
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1b2430, 1.1));
  const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(2, 4, -1); scene.add(dl);
  const dl2 = new THREE.DirectionalLight(0x9fc3ff, 0.5); dl2.position.set(-3, 2, 3); scene.add(dl2);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(4.5, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x18222e, roughness: 0.95 }));
  scene.add(floor);
  const grid = new THREE.GridHelper(9, 18, 0x2a3a4c, 0x1f2b38); grid.position.y = 0.002; scene.add(grid);

  const grey = new THREE.MeshStandardMaterial({ color: 0xc9d1da, roughness: 0.45, metalness: 0.15 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2c3540, roughness: 0.5, metalness: 0.2 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x3aa0ff, roughness: 0.4, metalness: 0.1 });

  // table (head end cantilevered toward the C-arm)
  const table = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.05, 2.3), dark);
  table.position.set(0, 0.88, -0.55); scene.add(table);
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.025, 2.28), new THREE.MeshStandardMaterial({ color: 0x3d4b5c, roughness: 0.9 }));
  pad.position.set(0, 0.915, -0.55); scene.add(pad);
  const ped = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.86, 0.6), grey);
  ped.position.set(0, 0.43, -1.15); scene.add(ped);

  // patient (translucent so the heart shows through)
  const skin = new THREE.MeshStandardMaterial({ color: 0x9fb7cc, roughness: 0.8, transparent: true, opacity: 0.16, depthWrite: false });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.5, 8, 24).rotateX(Math.PI / 2), skin);
  torso.scale.set(1.25, 0.72, 1); torso.position.set(0, 1.03, -0.09); scene.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), skin); head.position.set(0, 1.03, 0.46); scene.add(head);
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.75, 6, 16).rotateX(Math.PI / 2), skin);
    leg.position.set(s * 0.1, 0.99, -0.92); scene.add(leg);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.5, 6, 12).rotateX(Math.PI / 2), skin);
    arm.position.set(s * 0.25, 0.98, -0.12); scene.add(arm);
  }

  // C-arm: floor stand at the head end, L-arm, then propeller -> orbital
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.7), grey); stand.position.set(0, 0.06, 1.85); scene.add(stand);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.02, 24), grey); pillar.position.set(0, 0.6, 1.85); scene.add(pillar);
  const larm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.95), grey); larm.position.set(0, ISO.y, 1.45); scene.add(larm);

  const propeller = new THREE.Group(); propeller.position.copy(ISO); scene.add(propeller);
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.16), dark); collar.position.set(0, 0, ARC_R + 0.02); propeller.add(collar);
  const orbital = new THREE.Group(); propeller.add(orbital);

  const arcGeo = new THREE.TorusGeometry(ARC_R, 0.055, 16, 96, Math.PI * 1.02).rotateZ(-Math.PI / 2 - 0.01 * Math.PI).rotateY(-Math.PI / 2);
  const arc = new THREE.Mesh(arcGeo, grey); arc.scale.set(1, 1, 1); orbital.add(arc);
  // detector arm + flat panel
  const detArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, ARC_R - DET_D - 0.08, 0.12), grey);
  detArm.position.set(0, (ARC_R + DET_D + 0.08) / 2, 0); orbital.add(detArm);
  const detector = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.4), accent); detector.position.set(0, DET_D + 0.05, 0); orbital.add(detector);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.36).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x0b2440, emissive: 0x103a66, emissiveIntensity: 0.6 }));
  face.position.set(0, DET_D - 0.001, 0); orbital.add(face);
  // tube housing
  const tubeArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, ARC_R - SRC_D - 0.05, 0.12), grey);
  tubeArm.position.set(0, -(ARC_R + SRC_D) / 2, 0); orbital.add(tubeArm);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.32, 24).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf0a040, roughness: 0.4 }));
  tube.position.set(0, -SRC_D - 0.06, 0); orbital.add(tube);
  // X-ray beam (pyramid from focal spot to detector)
  const beamH = SRC_D + DET_D;
  const beamGeo = new THREE.ConeGeometry(0.2 * Math.SQRT2, beamH, 4, 1, true).rotateY(Math.PI / 4).rotateX(Math.PI);
  const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
  beam.position.set(0, -SRC_D + beamH / 2, 0);
  beam.renderOrder = 5;
  orbital.add(beam);
  const beamEdges = new THREE.LineSegments(new THREE.EdgesGeometry(beamGeo), new THREE.LineBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.45 }));
  beamEdges.position.copy(beam.position); orbital.add(beamEdges);

  return { propeller, orbital, beam, beamEdges };
}

// ---------- the lab ----------
export function createLab(root, opts = {}) {
  const o = Object.assign({
    controls: true, presets: true, room: true, readout: true, labels: true,
    lao: -25, cran: -25, sys: 'L', compact: false, autoRotate: false,
  }, opts);

  root.classList.add('lab');
  if (o.compact) root.classList.add('lab-compact');
  root.innerHTML = `
    <div class="lab-stage">
      ${o.room ? `<div class="lab-panel lab-room"><div class="lab-canvas"></div><div class="lab-labels"></div>
        <div class="lab-tag">3D room · drag to orbit</div>
        <div class="lab-room-btns"><button data-cam="operator" title="Operator's view">Operator</button><button data-cam="head" title="From the head">Head</button><button data-cam="heart" title="Zoom to the heart">Heart</button></div></div>` : ''}
      <div class="lab-panel lab-fluoro"><div class="lab-canvas"></div><canvas class="lab-noise"></canvas><div class="lab-vignette"></div><div class="lab-labels"></div>
        <div class="lab-osd"><span class="lab-osd-angles"></span><span class="lab-osd-sys"></span></div>
        <div class="lab-osd-r"><span>L</span></div>
        <div class="lab-tag">Fluoroscopy monitor</div></div>
    </div>
    ${o.controls ? `<div class="lab-controls">
      <div class="lab-sliders">
        <label><span class="lab-sl-name"><b>RAO</b> ⟵ rotation ⟶ <b>LAO</b></span>
          <input type="range" class="sl-lao" min="-90" max="90" step="1"><output class="out-lao"></output></label>
        <label><span class="lab-sl-name"><b>CAU</b> ⟵ angulation ⟶ <b>CRA</b></span>
          <input type="range" class="sl-cran" min="-45" max="45" step="1"><output class="out-cran"></output></label>
      </div>
      <div class="lab-toggles">
        <div class="seg" role="group" aria-label="Coronary"><button data-sys="L">Left</button><button data-sys="R">Right</button></div>
        <div class="seg" role="group" aria-label="Display"><button data-mode="xray">Angio</button><button data-mode="color">Anatomy</button></div>
        <button class="btn-inject">💉 Inject</button>
        <button class="btn-labels" aria-pressed="true">Labels</button>
      </div>
      ${o.presets ? `<div class="lab-presets"></div>` : ''}
    </div>` : ''}`;

  const fluoroBox = root.querySelector('.lab-fluoro');
  const fluoroCanvasBox = fluoroBox.querySelector('.lab-canvas');
  const fluoroLabels = fluoroBox.querySelector('.lab-labels');
  const osdAngles = fluoroBox.querySelector('.lab-osd-angles');
  const osdSys = fluoroBox.querySelector('.lab-osd-sys');
  if (!o.readout) fluoroBox.querySelector('.lab-osd').style.visibility = 'hidden';

  const state = {
    lao: o.lao, cran: o.cran, tLao: o.lao, tCran: o.cran,
    sys: o.sys, mode: 'xray', labels: o.labels, inject: null,
    listeners: [],
  };

  // shared heart transform: coronary centroid at isocentre
  const heartPos = ISO.clone().sub(HEART_CENTROID.clone().multiplyScalar(CM));

  // --- room ---
  let room = null;
  if (o.room) {
    const box = root.querySelector('.lab-room');
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    box.querySelector('.lab-canvas').appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const rig = buildRoom(scene);
    const heart = buildHeartColor();
    heart.group.scale.setScalar(CM); heart.group.position.copy(heartPos);
    scene.add(heart.group);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 50);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.target.copy(ISO); controls.minDistance = 0.4; controls.maxDistance = 7;
    controls.autoRotate = o.autoRotate; controls.autoRotateSpeed = 0.6;
    const layer = box.querySelector('.lab-labels');
    const labels = {
      det: labelEl(layer, 'Detector', 'tag-det'),
      tube: labelEl(layer, 'X-ray tube', 'tag-tube'),
      head: labelEl(layer, 'Head'),
      left: labelEl(layer, "Patient's left"),
      right: labelEl(layer, "Patient's right"),
    };
    room = { renderer, scene, camera, controls, rig, heart, box, labels };
    setRoomCam('operator', false);
  }

  function setRoomCam(which, smooth = true) {
    if (!room) return;
    const presets = {
      operator: { pos: [2.5, 2.1, -2.2], target: ISO.toArray() },
      head: { pos: [0, 1.45, 3.4], target: ISO.toArray() },
      heart: { pos: [0.35, 1.32, -0.42], target: ISO.toArray() },
    };
    const p = presets[which];
    room.camTween = { from: room.camera.position.clone(), to: new THREE.Vector3(...p.pos), t0: performance.now(), dur: smooth ? 700 : 0 };
    room.controls.target.set(...p.target);
  }

  // --- fluoro ---
  const fRenderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  fRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  fluoroCanvasBox.appendChild(fRenderer.domElement);
  const fScene = new THREE.Scene();
  const fade = { value: 1 };
  const xray = buildXray(fade);
  xray.group.scale.setScalar(CM); xray.group.position.copy(heartPos);
  fScene.add(xray.group);
  const colorHeart = buildHeartColor(0.5);
  colorHeart.group.scale.setScalar(CM); colorHeart.group.position.copy(heartPos);
  colorHeart.group.visible = false;
  fScene.add(colorHeart.group);
  fScene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.2));
  const fLight = new THREE.DirectionalLight(0xffffff, 1.2); fScene.add(fLight);
  const fCam = new THREE.PerspectiveCamera(2 * Math.atan(FIELD / 2 / (SRC_D + DET_D)) / DEG, 1, 0.05, 5);

  const vLabels = {};
  for (const v of VESSELS) {
    if (['S2', 'CB'].includes(v.id)) continue;
    vLabels[v.id] = labelEl(fluoroLabels, v.id === 'S1' ? 'Septals' : v.name, 'vessel');
    vLabels[v.id].style.setProperty('--c', VESSEL_COLORS[v.id]);
  }
  const spineLabel = labelEl(fluoroLabels, 'Spine', 'landmark');
  const diaLabel = labelEl(fluoroLabels, 'Diaphragm', 'landmark');

  // noise overlay
  const noise = fluoroBox.querySelector('.lab-noise');
  const nctx = noise.getContext('2d');
  noise.width = noise.height = 160;
  const nimg = nctx.createImageData(160, 160);
  let lastNoise = 0;
  function drawNoise(t) {
    if (t - lastNoise < 70) return;
    lastNoise = t;
    const d = nimg.data;
    for (let i = 0; i < d.length; i += 4) { const g = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = g; d[i + 3] = 255; }
    nctx.putImageData(nimg, 0, 0);
  }

  // --- geometry of the C-arm for the current angles ---
  const _q = new THREE.Quaternion(), _e = new THREE.Euler();
  function armFrame(lao, cran) {
    _e.set(0, 0, lao * DEG); _q.setFromEuler(_e);
    const q2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(cran * DEG, 0, 0));
    const q = _q.clone().multiply(q2);
    const det = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    const up = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    return { det, up };
  }

  function resize() {
    const w = fluoroCanvasBox.clientWidth, h = fluoroCanvasBox.clientHeight;
    if (w && h) {
      fRenderer.setSize(w, h, false);
      fCam.aspect = w / h; fCam.updateProjectionMatrix();
      fCam.projectionMatrix.elements[0] *= -1; // display as seen from the detector side
      fCam.projectionMatrixInverse.copy(fCam.projectionMatrix).invert();
    }
    if (room) {
      const c = room.box.querySelector('.lab-canvas');
      const rw = c.clientWidth, rh = c.clientHeight;
      if (rw && rh) { room.renderer.setSize(rw, rh, false); room.camera.aspect = rw / rh; room.camera.updateProjectionMatrix(); }
    }
  }
  const ro = new ResizeObserver(resize);
  ro.observe(fluoroCanvasBox);
  if (room) ro.observe(room.box);

  // --- injection / visibility ---
  function setReveal(frontCm) {
    for (const v of VESSELS) {
      const g = vesselGeometry(v);
      const frac = THREE.MathUtils.clamp((frontCm - v.start) / v.length, 0, 1);
      g.setDrawRange(0, Math.round(frac * g.userData.segments) * g.userData.indicesPerSegment);
    }
  }
  function applySystem() {
    for (const v of VESSELS) {
      const show = v.sys === state.sys;
      xray.vessels[v.id].visible = show;
      // colour views always show the whole tree, dimming the other system
      colorHeart.vessels[v.id].material.opacity = show ? 1 : 0.35;
      colorHeart.vessels[v.id].material.transparent = !show;
      if (room) room.heart.vessels[v.id].material.opacity = 1;
    }
    for (const k of ['L', 'R']) {
      xray.catheters[k].visible = k === state.sys;
      colorHeart.catheters[k].visible = k === state.sys;
      if (room) room.heart.catheters[k].visible = k === state.sys;
    }
    osdSys.textContent = state.sys === 'L' ? 'LCA' : 'RCA';
  }

  function inject() {
    state.inject = { t0: performance.now() };
  }
  function updateInjection(t) {
    if (!state.inject) { fade.value = 1; setReveal(1e9); return; }
    const s = (t - state.inject.t0) / 1000;
    const fill = 1.4, hold = 1.6, wash = 1.2, back = 0.8;
    if (s < fill) { setReveal((s / fill) * 22); fade.value = 1; }
    else if (s < fill + hold) { setReveal(1e9); fade.value = 1; }
    else if (s < fill + hold + wash) { fade.value = 1 - (s - fill - hold) / wash; }
    else if (s < fill + hold + wash + 0.5) { fade.value = 0; }
    else if (s < fill + hold + wash + 0.5 + back) { fade.value = (s - fill - hold - wash - 0.5) / back; }
    else { state.inject = null; fade.value = 1; }
  }

  // --- controls ---
  const ui = {};
  if (o.controls) {
    ui.lao = root.querySelector('.sl-lao'); ui.cran = root.querySelector('.sl-cran');
    ui.outLao = root.querySelector('.out-lao'); ui.outCran = root.querySelector('.out-cran');
    ui.lao.value = state.lao; ui.cran.value = state.cran;
    ui.lao.addEventListener('input', () => setAngles(+ui.lao.value, state.tCran, false));
    ui.cran.addEventListener('input', () => setAngles(state.tLao, +ui.cran.value, false));
    root.querySelectorAll('[data-sys]').forEach((b) => b.addEventListener('click', () => setSystem(b.dataset.sys)));
    root.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
    root.querySelector('.btn-inject').addEventListener('click', inject);
    const lb = root.querySelector('.btn-labels');
    lb.addEventListener('click', () => { state.labels = !state.labels; lb.setAttribute('aria-pressed', state.labels); });
    if (o.presets) {
      const pr = root.querySelector('.lab-presets');
      for (const v of VIEWS) {
        const b = document.createElement('button');
        b.textContent = v.name; b.title = `${formatAngles(v.lao, v.cran)} — ${v.nickname}`;
        b.addEventListener('click', () => { setSystem(v.sys); setAngles(v.lao, v.cran, true); });
        pr.appendChild(b);
      }
    }
  }
  root.querySelectorAll('[data-cam]').forEach((b) => b.addEventListener('click', () => setRoomCam(b.dataset.cam)));

  function syncUI() {
    if (!o.controls) return;
    ui.lao.value = Math.round(state.tLao); ui.cran.value = Math.round(state.tCran);
    const a = Math.round(state.tLao), c = Math.round(state.tCran);
    ui.outLao.textContent = a === 0 ? 'AP' : a > 0 ? `LAO ${a}°` : `RAO ${-a}°`;
    ui.outCran.textContent = c === 0 ? '0°' : c > 0 ? `CRA ${c}°` : `CAU ${-c}°`;
    root.querySelectorAll('[data-sys]').forEach((b) => b.classList.toggle('on', b.dataset.sys === state.sys));
    root.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === state.mode));
  }

  function setAngles(lao, cran, animate = true) {
    state.tLao = THREE.MathUtils.clamp(lao, -90, 90);
    state.tCran = THREE.MathUtils.clamp(cran, -45, 45);
    if (!animate) { state.lao = state.tLao; state.cran = state.tCran; }
    syncUI();
    state.listeners.forEach((f) => f({ lao: state.tLao, cran: state.tCran }));
  }
  function setSystem(sys) { state.sys = sys; applySystem(); syncUI(); }
  function setMode(mode) {
    state.mode = mode;
    xray.group.visible = mode === 'xray';
    colorHeart.group.visible = mode === 'color';
    fluoroBox.classList.toggle('mode-color', mode === 'color');
    syncUI();
  }

  // --- render loop ---
  let running = true, raf = 0;
  const io = new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) loop(); });
  io.observe(root);

  function frame(t) {
    // ease toward the target angles
    const k = 0.12;
    state.lao += (state.tLao - state.lao) * k; state.cran += (state.tCran - state.cran) * k;
    if (Math.abs(state.tLao - state.lao) < 0.02) state.lao = state.tLao;
    if (Math.abs(state.tCran - state.cran) < 0.02) state.cran = state.tCran;
    updateInjection(t);

    const { det, up } = armFrame(state.lao, state.cran);
    const src = ISO.clone().addScaledVector(det, -SRC_D);
    fCam.position.copy(src); fCam.up.copy(up); fCam.lookAt(ISO);
    fLight.position.copy(ISO).addScaledVector(det, 2);
    osdAngles.textContent = formatAngles(state.lao, state.cran);

    fRenderer.setClearColor(state.mode === 'xray' ? 0xc4c4c4 : 0x0d131a);
    fRenderer.render(fScene, fCam);
    if (state.mode === 'xray') drawNoise(t);

    const fw = fluoroCanvasBox.clientWidth, fh = fluoroCanvasBox.clientHeight;
    for (const id in vLabels) {
      const v = VESSEL_BY_ID[id];
      const wp = v.curve.getPointAt(id.startsWith('S') ? 0.6 : 0.55).multiplyScalar(CM).add(heartPos);
      const shown = state.labels && v.sys === state.sys && (state.mode === 'color' || (fade.value > 0.5 && !state.inject));
      placeLabel(vLabels[id], wp, fCam, fw, fh, shown);
    }
    placeLabel(spineLabel, new THREE.Vector3(0.3, -9.5, HEART_CENTROID.z - 4).multiplyScalar(CM).add(heartPos), fCam, fw, fh, state.labels && state.mode === 'xray');
    placeLabel(diaLabel, new THREE.Vector3(1.5, -1.5, -5).multiplyScalar(CM).add(heartPos), fCam, fw, fh, state.labels && state.mode === 'xray' && state.cran > 8);

    if (room) {
      room.rig.propeller.rotation.z = state.lao * DEG;
      room.rig.orbital.rotation.x = state.cran * DEG;
      if (room.camTween) {
        const ct = room.camTween, a = ct.dur ? Math.min(1, (t - ct.t0) / ct.dur) : 1;
        const e = a < 0.5 ? 2 * a * a : 1 - Math.pow(-2 * a + 2, 2) / 2;
        room.camera.position.lerpVectors(ct.from, ct.to, e);
        if (a >= 1) room.camTween = null;
      }
      room.controls.update();
      room.renderer.render(room.scene, room.camera);
      const rc = room.box.querySelector('.lab-canvas');
      const rw = rc.clientWidth, rh = rc.clientHeight, show = state.labels;
      placeLabel(room.labels.det, ISO.clone().addScaledVector(det, DET_D + 0.16), room.camera, rw, rh, show);
      placeLabel(room.labels.tube, src.clone().addScaledVector(det, -0.14), room.camera, rw, rh, show);
      placeLabel(room.labels.head, new THREE.Vector3(0, 1.17, 0.5), room.camera, rw, rh, show);
      placeLabel(room.labels.left, new THREE.Vector3(-0.36, 0.95, -0.35), room.camera, rw, rh, show);
      placeLabel(room.labels.right, new THREE.Vector3(0.36, 0.95, -0.35), room.camera, rw, rh, show);
    }
  }
  function loop() {
    cancelAnimationFrame(raf);
    const step = (t) => { if (!running) return; frame(t); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  }

  applySystem(); setMode('xray'); syncUI(); resize(); loop();

  return {
    setAngles, setSystem, setMode, inject, setRoomCam,
    getAngles: () => ({ lao: state.tLao, cran: state.tCran }),
    getMode: () => state.mode,
    getLabels: () => state.labels,
    onChange: (f) => state.listeners.push(f),
    setLabels: (b) => { state.labels = b; const lb = root.querySelector('.btn-labels'); if (lb) lb.setAttribute('aria-pressed', b); },
    setReadout: (b) => { fluoroBox.querySelector('.lab-osd').style.visibility = b ? '' : 'hidden'; },
  };
}
