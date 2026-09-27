// LiverClear's 3D liver: a stylised but anatomically placed human liver with its lobes, the
// falciform ligament, the gallbladder, the double blood supply (portal vein and hepatic artery),
// the hepatic veins draining into the inferior vena cava, and the bile ducts down to the gut.
// Blood and bile move through it as dots.
//
// Orientation: we look at the patient from the front (anterior view), as in an anatomy atlas.
// So the patient's RIGHT side is on YOUR LEFT. Axes of the liver group: +x = patient's left,
// +y = up (towards the head), +z = forwards (towards you, the belly wall).
// Placement follows standard anatomy (Gray's Anatomy, 42nd ed., "Liver"; NIDDK "Your Digestive
// System & How It Works"; StatPearls "Anatomy, Abdomen and Pelvis: Liver", NCBI NBK500014):
//  - the liver fills the upper right of the abdomen, tucked under the right ribs and the dome of
//    the diaphragm; its left lobe crosses the midline and thins to a tip over the stomach;
//  - the falciform ligament on the front surface marks the border between the anatomical right and
//    left lobes; its free lower edge carries the round ligament (ligamentum teres) to the navel;
//  - the caudate lobe is on the back, beside the inferior vena cava; the quadrate lobe is on the
//    underside, between the gallbladder and the round ligament;
//  - the gallbladder lies in a hollow under the right lobe, its rounded end (fundus) peeking out at
//    the lower edge;
//  - at the porta hepatis (the "doorway" on the underside) the bile duct lies in front and to the
//    right, the hepatic artery in front and to the left, and the portal vein behind both;
//  - the right, middle and left hepatic veins leave from the back, straight into the inferior vena
//    cava just below the diaphragm; the vena cava then runs up to the right atrium of the heart.
// One model unit is about 5 cm, so the liver is about 21 cm across and 15 cm tall at its right lobe.
import { THREE, M, tube, clamp, lerp, smooth } from './kit.js';

// ================================================================ reference numbers
// [GH]   Hall JE, Hall ME. Guyton and Hall Textbook of Medical Physiology, 14th ed. (2021):
//        ch. 71 "The liver" (blood flow, blood reservoir, Kupffer cells, lobules),
//        ch. 65 (bile secretion), ch. 69 (glycogen), ch. 72 (plasma proteins).
// [SP]   StatPearls, "Anatomy, Abdomen and Pelvis: Liver" https://www.ncbi.nlm.nih.gov/books/NBK500014/
//        and "Physiology, Liver" https://www.ncbi.nlm.nih.gov/books/NBK535438/
// [BRIT] Encyclopaedia Britannica, "Liver" https://www.britannica.com/science/liver
// [NIDDK] NIDDK, "Your Liver" / "Your Digestive System & How It Works"
//        https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works
export const REF = {
  mass: [1.2, 1.5],        // kg in an adult, the largest internal organ (about 2% of body weight) [BRIT], [SP];
                           // Cleveland Clinic "Liver" (my.clevelandclinic.org/health/body/21481-liver): about 3 lb
  flow: 1350,              // mL/min total blood flow at rest, 27% of the resting cardiac output [GH ch. 71]
  flowPortal: 1050,        // mL/min through the portal vein [GH ch. 71]
  flowArtery: 300,         // mL/min through the hepatic artery [GH ch. 71]
  coShare: 27,             // % of cardiac output [GH ch. 71]; many texts round to "about a quarter"
  bloodHeld: 450,          // mL of blood inside the liver at any moment, about 10% of blood volume [GH ch. 71]
  lobules: [50000, 100000],// number of lobules [GH ch. 71]
  lobuleSize: [0.8, 2],    // mm across [GH ch. 71]
  bacteriaEscape: 1,       // % of gut bacteria that get past the Kupffer cells, "probably not more than 1%" [GH ch. 71]
};
REF.portalShare = Math.round((REF.flowPortal / REF.flow) * 100);   // ≈ 78%, "about three-quarters"
REF.arteryShare = 100 - REF.portalShare;                            // ≈ 22%, "about a quarter"

// Colours. Blood: oxygen-poor blue, oxygen-rich red (the textbook convention; real blood is always
// red). Portal blood is oxygen-poor but full of nutrients from the gut, so it gets its own purple.
export const COL = { liver: 0x8b3a2f, red: 0xe23b4a, blue: 0x4f7bff, portal: 0x9a63e0, bile: 0x5fbf4a, gb: 0x5d8f3a, lig: 0xf1dcc0 };
const TINT = { blue: '#8fb0ff', red: '#ff8a94', purple: '#caa6ff', green: '#9be58a', side: '#8ef0ff', gold: '#ffd166', cream: '#f3dfb4' };
export function tint(l, cls) { const c = TINT[cls]; if (c) { l.element.style.borderColor = c; l.element.style.color = c; } return l; }

// ================================================================ small helpers
export function pathOf(points) {
  const Pt = points.map((p) => (p.isVector3 ? p.clone() : new THREE.Vector3(...p)));
  const L = [0];
  for (let i = 1; i < Pt.length; i++) L.push(L[i - 1] + Pt[i].distanceTo(Pt[i - 1]));
  const total = L[L.length - 1];
  return {
    points: Pt, total, lengths: L,
    at(u, out = new THREE.Vector3()) {
      const d = clamp(u, 0, 1) * total;
      let lo = 0, hi = L.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= d) lo = m; else hi = m; }
      const k = (d - L[lo]) / Math.max(1e-9, L[hi] - L[lo]);
      return out.copy(Pt[lo]).lerp(Pt[hi], k);
    },
    // Fraction along the path nearest to a point.
    near(p) { const q = p.isVector3 ? p : new THREE.Vector3(...p); let best = 0, bd = 1e9; Pt.forEach((x, i) => { const d = x.distanceTo(q); if (d < bd) { bd = d; best = i; } }); return L[best] / total; },
  };
}
export const smoothPts = (pts, n = 60) => new THREE.CatmullRomCurve3(pts.map((p) => (p.isVector3 ? p.clone() : new THREE.Vector3(...p)))).getPoints(n);
export const V = (...a) => new THREE.Vector3(...a);

// A board: a canvas drawn every few frames, shown on a plane in the scene.
export function board(w, h, planeW, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(planeW, (planeW * h) / w), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
  mesh.renderOrder = 5;
  mesh.redraw = (...a) => { draw(g, w, h, ...a); tex.needsUpdate = true; };
  return mesh;
}
export const BOARD_BG = 'rgba(10,12,18,.9)';

// A small floor sign so nobody mixes up left and right.
export function sideLabels(stage, parent, y, x, z = 0.8) {
  return [
    tint(stage.label("← Patient's right", [-x, y, z], parent), 'side'),
    tint(stage.label("Patient's left →", [x, y, z], parent), 'side'),
  ];
}

// On a phone-width stage the readout covers the upper left, so re-centre once, unless the viewer
// has orbited.
export function fitNarrow(stage, view) {
  let done = false;
  return () => {
    const narrow = stage.host.clientWidth < 560;
    if (narrow && !done && !stage.moved && !document.body.classList.contains('gb-reel')) { stage.setView(view.pos, view.target, 0.01); done = true; }
    return narrow;
  };
}
// On phones keep only the readout's headline and two rows.
export function compactReadout(stage, api) {
  const full = api.readout;
  if (!full) return api;
  api.readout = (s) => {
    const html = full(s);
    if (stage.host.clientWidth >= 560 || !html) return html;
    let rows = 0;
    return html.replace(/<small>[\s\S]*?<\/small>/g, '').replace(/<div class="row">[\s\S]*?<\/div>/g, (m) => (++rows <= 2 ? m : ''));
  };
  return api;
}

// Dots that ride along paths, changing colour at set points (blood picking up or losing things).
// routes: [{ pts, n, speed, cols: [[u, hex], ...] }]. Returns { mesh, step(dt, speed) }.
export function flowDots(parent, routes, r = 0.04) {
  const list = routes.map((rt) => ({ ...rt, path: pathOf(smoothPts(rt.pts, 120)) }));
  const N = list.reduce((a, b) => a + b.n, 0);
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), N);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false;
  parent.add(mesh);
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const dots = [];
  list.forEach((rt) => { for (let k = 0; k < rt.n; k++) { const i = dots.length; dots.push({ rt, u: (k + rnd(i)) / rt.n, j: [rnd(i + 3) - 0.5, rnd(i + 5) - 0.5, rnd(i + 9) - 0.5], c: -1 }); } });
  const o = new THREE.Object3D(), p = new THREE.Vector3(), col = new THREE.Color();
  const api = {
    mesh, dots, list,
    step(dt, speed = 1) {
      dt = Math.max(0, dt);
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i], rt = d.rt;
        d.u = (d.u + (rt.speed * speed * dt) / rt.path.total) % 1;
        rt.path.at(d.u, p);
        const sp = rt.spread ?? 0.06;
        o.position.set(p.x + d.j[0] * sp, p.y + d.j[1] * sp, p.z + d.j[2] * sp); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix);
        let ci = 0; for (let k = 0; k < rt.cols.length; k++) if (d.u >= rt.cols[k][0]) ci = k;
        if (ci !== d.c) { d.c = ci; mesh.setColorAt(i, col.set(rt.cols[ci][1])); mesh.instanceColor.needsUpdate = true; }
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
  api.step(0);
  return api;
}

// ================================================================ the liver's shape
// Profiles along x (patient's right edge at x = −2.3, left lobe tip at x = +1.9): the height of the
// dome on top, the lower border (which climbs from the lower right to the upper left, following the
// right rib margin), the front-to-back half-thickness and the centre line.
const TOP = [[-2.3, 0.55], [-1.9, 1.12], [-1.2, 1.4], [-0.4, 1.36], [0.4, 1.12], [1.2, 0.92], [1.9, 0.68]];
const BOT = [[-2.3, -0.85], [-1.9, -1.42], [-1.2, -1.42], [-0.6, -1.1], [0, -0.72], [0.8, -0.36], [1.9, 0.3]];
const HZ = [[-2.3, 1.0], [-1.4, 1.2], [-0.4, 1.1], [0.4, 0.74], [1.2, 0.5], [1.9, 0.24]];
const ZC = [[-2.3, -0.3], [-1.0, -0.2], [0, -0.1], [1.9, 0.05]];
const X0 = -2.3, X1 = 1.9;
function interp(pts, x) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return lerp(va, vb, smooth((x - a) / (b - a))); }
  return pts[pts.length - 1][1];
}
export const profile = (x) => { const t = interp(TOP, x), b = interp(BOT, x); return { top: t, bot: b, mid: (t + b) / 2, hy: (t - b) / 2, hz: interp(HZ, x), zc: interp(ZC, x) }; };

// A point on the liver's cross-section at x, angle θ (θ = 0 at the back, π at the front). The lower
// half is pinched and pushed forwards, so the underside slopes down to a sharp front lower border
// and the back is thick and rounded, as in the real organ.
function section(x, th, k = 1) {
  const p = profile(x), s = Math.sin(th), c = -Math.cos(th);
  const lower = Math.max(0, -s);
  const y = p.mid + p.hy * k * (s > 0 ? s : s * 1.0);
  const z = p.zc + p.hz * k * (c * (1 - 0.5 * lower) + 0.45 * lower);
  return [x, y, z];
}

// One lobe from xa to xb. Outer ends are rounded; an inner end is closed with a flat cap, so two
// lobes meet cleanly at the falciform ligament and can be pulled apart.
function lobeGeometry(xa, xb, { roundA = false, roundB = false } = {}, nu = 72, nv = 56) {
  const pos = [], idx = [], R = 0.4;
  for (let i = 0; i <= nu; i++) {
    const x = lerp(xa, xb, i / nu);
    let k = 1;
    if (roundA && x - xa < R) k = Math.sqrt(Math.max(0, 1 - ((R - (x - xa)) / R) ** 2));
    if (roundB && xb - x < R) k = Math.min(k, Math.sqrt(Math.max(0, 1 - ((R - (xb - x)) / R) ** 2)));
    for (let j = 0; j <= nv; j++) pos.push(...section(x, (j / nv) * Math.PI * 2, Math.max(0.02, k)));
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = i * (nv + 1) + j, b = a + nv + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const cap = (x, ring, flip) => {
    const p = profile(x), c = pos.length / 3; pos.push(x, p.mid, p.zc + p.hz * 0.1);
    for (let j = 0; j < nv; j++) { const a = ring * (nv + 1) + j; flip ? idx.push(c, a + 1, a) : idx.push(c, a, a + 1); }
  };
  if (!roundA) cap(xa, 0, true);
  if (!roundB) cap(xb, nu, false);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// An egg shape stretched along an axis from a to b (for the gallbladder and small lobes).
function eggBetween(a, b, r0, r1, mat, seg = 32) {
  const A = V(...a), B = V(...b), len = A.distanceTo(B);
  const prof = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24, s = Math.sin(Math.PI * t); prof.push(new THREE.Vector2(Math.max(0.001, s * lerp(r0, r1, t)), -len / 2 + len * t)); }
  const g = new THREE.LatheGeometry(prof, seg);
  const m = new THREE.Mesh(g, mat); m.castShadow = true;
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), B.clone().sub(A).normalize());
  return m;
}

const organMat = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.4, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.3, transparent: true, opacity: 1, ...o });
const vesselMat = (color) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.4, clearcoat: 0.4, clearcoatRoughness: 0.4, transparent: true, opacity: 1 });

// ================================================================ vessel and duct paths (liver space)
export const P = {
  // Portal vein: the superior mesenteric vein (from the intestines) and the splenic vein meet behind
  // the pancreas; the portal vein climbs to the porta hepatis and splits right and left.
  smv: [[0.3, -3.4, 0.2], [0.2, -2.7, -0.3], [0.05, -2.25, -0.6]],
  splenic: [[1.95, -2.0, -1.05], [1.1, -2.2, -0.9], [0.05, -2.25, -0.6]],
  pv: [[0.05, -2.25, -0.6], [-0.15, -1.55, -0.58], [-0.28, -0.8, -0.48]],
  pvR: [[-0.28, -0.8, -0.48], [-0.8, -0.52, -0.45], [-1.45, -0.3, -0.35]],
  pvL: [[-0.28, -0.8, -0.48], [0.2, -0.48, -0.36], [0.9, 0.0, -0.12]],
  // Hepatic artery: aorta → coeliac trunk → common hepatic artery → hepatic artery proper, which
  // runs up in front of the portal vein and splits right and left.
  aorta: [[0.38, 2.4, -1.45], [0.38, 0.4, -1.45], [0.38, -1.7, -1.45], [0.38, -3.4, -1.45]],
  ha: [[0.38, -1.7, -1.45], [0.36, -1.72, -1.0], [0.2, -1.55, -0.32], [-0.05, -1.3, -0.12], [-0.12, -0.82, -0.16]],
  haR: [[-0.12, -0.82, -0.16], [-0.7, -0.45, -0.05], [-1.3, -0.1, 0.02]],
  haL: [[-0.12, -0.82, -0.16], [0.3, -0.36, 0.0], [0.8, 0.15, 0.1]],
  // Hepatic veins (right, middle, left) into the inferior vena cava on the back of the liver.
  hvR: [[-1.6, 0.2, -0.3], [-1.05, 0.85, -0.75], [-0.52, 1.12, -1.0]],
  hvM: [[-0.5, -0.2, 0.25], [-0.45, 0.6, -0.45], [-0.47, 1.15, -1.0]],
  hvL: [[0.85, 0.45, -0.15], [0.2, 0.95, -0.6], [-0.38, 1.15, -1.0]],
  ivc: [[-0.45, -3.4, -1.05], [-0.45, -1.0, -1.08], [-0.45, 1.15, -1.05], [-0.45, 2.6, -1.05]],
  // Bile: right and left hepatic ducts → common hepatic duct → (cystic duct joins) → common bile
  // duct, behind the duodenum, opening into it at the ampulla.
  bdR: [[-1.3, -0.35, 0.22], [-0.72, -0.62, 0.02], [-0.32, -0.84, -0.06]],
  bdL: [[0.8, -0.05, 0.25], [0.22, -0.52, 0.05], [-0.32, -0.84, -0.06]],
  chd: [[-0.32, -0.84, -0.06], [-0.33, -1.05, -0.04], [-0.33, -1.3, -0.02]],
  cystic: [[-0.33, -1.3, -0.02], [-0.45, -1.12, -0.12], [-0.52, -0.9, -0.22]],
  cbd: [[-0.33, -1.3, -0.02], [-0.36, -1.9, -0.14], [-0.6, -2.5, -0.14], [-0.8, -2.74, -0.05]],
  duodenum: [[0.45, -1.95, 0.35], [-0.35, -2.05, 0.32], [-0.95, -2.3, 0.15], [-1.02, -2.8, 0.0], [-0.7, -3.18, -0.1], [0.1, -3.25, -0.15], [0.7, -3.05, -0.2]],
  // Gallbladder: fundus peeking below the lower border at the front, neck up and back.
  gbFundus: [-0.88, -1.4, 0.42], gbNeck: [-0.52, -0.9, -0.22],
};
const cat = (...segs) => segs.flatMap((s, i) => (i ? s.slice(1) : s));

// ================================================================ the liver
export function makeLiver(stage, opts = {}) {
  const o = { labels: true, flow: true, context: true, ...opts };
  const root = new THREE.Group();
  const groups = {};
  const G = (name) => { const g = new THREE.Group(); root.add(g); groups[name] = g; return g; };
  const right = G('right'), left = G('left'), caud = G('caud'), quad = G('quad'), gbG = G('gb'), tree = G('tree'), ctx = G('ctx');

  const liverMat = organMat(COL.liver);
  const lobeR = new THREE.Mesh(lobeGeometry(X0, 0.02, { roundA: true }), liverMat); lobeR.castShadow = true; right.add(lobeR);
  const lobeL = new THREE.Mesh(lobeGeometry(-0.02, X1, { roundB: true }, 56, 56), liverMat); lobeL.castShadow = true; left.add(lobeL);
  // Caudate lobe: a tongue on the back beside the vena cava. Quadrate lobe: a square-ish block on the
  // underside between the gallbladder and the round ligament.
  const caudM = eggBetween([-0.2, -0.3, -1.0], [-0.1, 0.75, -1.02], 0.34, 0.26, liverMat); caud.add(caudM);
  const quadM = eggBetween([-0.52, -0.95, 0.18], [-0.12, -0.72, 0.38], 0.3, 0.26, liverMat); quad.add(quadM);
  const lobes = [lobeR, lobeL, caudM, quadM];
  // Keep the original vertex positions and normals so conditions (fat, scarring) can reshape the lobes.
  lobes.forEach((m) => { m.geometry.computeVertexNormals(); m.userData.base = Float32Array.from(m.geometry.attributes.position.array); m.userData.nrm = Float32Array.from(m.geometry.attributes.normal.array); });

  // Gallbladder (pear-shaped bag under the right lobe).
  const gbMat = organMat(COL.gb, { roughness: 0.3, clearcoat: 0.9 });
  const gb = eggBetween(P.gbFundus, P.gbNeck, 0.36, 0.2, gbMat); gbG.add(gb);

  // Surface finder: rays from outside onto the lobes (for the ligament).
  root.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  const onSurface = (x, y, zOut = 3, lift = 0.02) => { ray.set(V(x, y, zOut), V(0, 0, -1)); const h = ray.intersectObjects([lobeR, lobeL], false)[0]; return h ? V(h.point.x, h.point.y, h.point.z + lift) : V(x, y, 0.8); };
  const onTop = (x, z, lift = 0.02) => { ray.set(V(x, 4, z), V(0, -1, 0)); const h = ray.intersectObjects([lobeR, lobeL], false)[0]; return h ? V(h.point.x, h.point.y + lift, h.point.z) : V(x, 1.2, z); };
  // Falciform ligament: from the notch on the lower border, up the front and over the top.
  const ligPts = [onSurface(0.02, -0.66), onSurface(0.03, -0.2), onSurface(0.02, 0.4), onSurface(0.0, 0.9), onTop(-0.02, 0.2), onTop(-0.05, -0.4)];
  const ligMat = organMat(0xe2bfa3, { roughness: 0.6, clearcoat: 0.2 });
  const lig = tube(smoothPts(ligPts, 60), 0.022, ligMat, false, 80); root.add(lig);
  // A thin fin standing off the surface along the ligament.
  const finG = new THREE.BufferGeometry(), fp = [], fi = [];
  smoothPts(ligPts, 40).forEach((p, i) => { const n = p.clone().sub(V(-0.2, 0.2, -0.2)).normalize(); fp.push(p.x, p.y, p.z, p.x + n.x * 0.09, p.y + n.y * 0.09, p.z + n.z * 0.09); if (i) { const a = (i - 1) * 2; fi.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
  finG.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); finG.setIndex(fi); finG.computeVertexNormals();
  const fin = new THREE.Mesh(finG, organMat(0xe8c9b0, { side: THREE.DoubleSide, opacity: 0.55 })); root.add(fin);
  // Round ligament (the old umbilical vein) from the notch towards the navel.
  const teres = tube(smoothPts([ligPts[0].toArray(), [0.06, -1.05, 0.85], [0.1, -1.4, 1.0]], 30), 0.03, ligMat, false, 40); root.add(teres);

  // Vessels and ducts.
  const vessels = [];
  const vt = (pts, r, color, parent = tree) => { const m = tube(smoothPts(pts, 60), r, vesselMat(color), false, 90); parent.add(m); vessels.push(m); return m; };
  vt(P.pv, 0.13, COL.portal); vt(P.pvR, 0.1, COL.portal); vt(P.pvL, 0.09, COL.portal); vt(P.smv, 0.1, COL.portal); vt(P.splenic, 0.085, COL.portal);
  vt(P.ha, 0.05, COL.red); vt(P.haR, 0.04, COL.red); vt(P.haL, 0.035, COL.red);
  vt(P.hvR, 0.1, COL.blue); vt(P.hvM, 0.09, COL.blue); vt(P.hvL, 0.085, COL.blue);
  vt(P.ivc, 0.22, 0x5a6ccc);
  vt(P.bdR, 0.045, COL.bile); vt(P.bdL, 0.04, COL.bile); vt(P.chd, 0.055, COL.bile); vt(P.cystic, 0.04, COL.bile); vt(P.cbd, 0.06, COL.bile);
  // Finer branches inside each lobe (portal vein, artery and bile duct travel together as triads).
  const twig = (from, dirs, r, color) => dirs.forEach((d) => vt([from, [from[0] + d[0] * 0.5, from[1] + d[1] * 0.5, from[2] + d[2] * 0.5], [from[0] + d[0], from[1] + d[1], from[2] + d[2]]], r, color));
  twig(P.pvR[2], [[-0.5, 0.6, 0.2], [-0.4, -0.5, 0.4], [0.1, 0.8, 0.5]], 0.045, COL.portal);
  twig(P.pvL[2], [[0.6, 0.2, 0.1], [-0.1, 0.6, 0.25]], 0.04, COL.portal);
  twig(P.haR[2], [[-0.45, 0.55, 0.15], [-0.35, -0.5, 0.3]], 0.022, COL.red);
  twig(P.bdR[0], [[-0.45, 0.5, -0.05], [-0.3, -0.4, 0.1]], 0.022, COL.bile);

  const context = [];
  if (o.context) {
    const ghost = (color, op = 0.14) => new THREE.MeshStandardMaterial({ color, transparent: true, opacity: op, roughness: 0.6, depthWrite: false });
    const aorta = tube(smoothPts(P.aorta, 40), 0.24, ghost(0xd8404c, 0.45), false, 60); ctx.add(aorta);
    const duo = tube(smoothPts(P.duodenum, 60), 0.26, ghost(0xe88f86, 0.32), false, 80); ctx.add(duo);
    const pancreas = tube(smoothPts([[-0.55, -2.65, -0.35], [0.1, -2.45, -0.75], [0.9, -2.2, -1.0], [1.8, -1.95, -1.15]], 40), 0.26, ghost(0xf2c86a, 0.32), false, 60); ctx.add(pancreas);
    context.push(duo, pancreas, aorta);
  }

  // Flow of blood and bile. The portal vein brings about three times as much blood as the hepatic
  // artery [GH ch. 71], so it gets about three times as many dots.
  const hvIn = (hv) => cat(hv, [[-0.45, 1.3, -1.05], [-0.45, 2.6, -1.05]]);
  const routes = [
    { pts: cat(P.smv, P.pv, P.pvR, [[-1.62, -0.05, -0.3]], hvIn(P.hvR)), n: 44, speed: 0.9, cols: [[0, COL.portal], [0.5, COL.blue]] },
    { pts: cat(P.splenic, P.pv, P.pvL, [[0.95, 0.25, -0.1]], hvIn(P.hvL)), n: 40, speed: 0.9, cols: [[0, COL.portal], [0.55, COL.blue]] },
    { pts: cat(P.smv, P.pv, [[-0.4, -0.5, -0.1], [-0.52, -0.3, 0.2]], hvIn(P.hvM)), n: 30, speed: 0.9, cols: [[0, COL.portal], [0.5, COL.blue]] },
    { pts: cat(P.aorta.slice(0, 3), P.ha.slice(1), P.haR, [[-1.55, 0.05, -0.2]], hvIn(P.hvR)), n: 32, speed: 0.9, cols: [[0, COL.red], [0.6, COL.blue]] },
    { pts: P.ivc, n: 22, speed: 0.9, cols: [[0, COL.blue]] },
    { pts: cat(P.bdR, P.chd, P.cbd), n: 14, speed: 0.4, cols: [[0, COL.bile]], spread: 0.02 },
    { pts: cat(P.bdL, P.chd, P.cystic, [[-0.7, -1.15, 0.1]]), n: 10, speed: 0.4, cols: [[0, COL.bile]], spread: 0.02 },
  ];
  const flow = flowDots(tree, routes, 0.045);
  flow.mesh.visible = o.flow;

  // Labels ride with their parts when the liver comes apart.
  const labels = [], minor = [];
  const L = (html, pos, parent, cls = '', main = false) => { const l = stage.label(html, pos, parent); tint(l, cls); labels.push(l); if (!main) minor.push(l); return l; };
  if (o.labels) {
    L('Right lobe', [-1.7, 1.1, 0.95], right, '', true);
    L('Left lobe', [1.35, 0.95, 0.55], left, '', true);
    L('Falciform ligament', [0.3, 1.55, 0.55], root, 'cream');
    L('Caudate lobe (back)', [0.2, 0.55, -1.35], caud, '');
    L('Quadrate lobe (underside)', [0.55, -1.3, 0.95], quad, '');
    L('Gallbladder', [-1.3, -1.75, 0.6], gbG, 'green', true);
    L('Portal vein: ~¾ of the blood, from the gut', [1.25, -2.75, 0.1], tree, 'purple', true);
    L('Hepatic artery: ~¼, fresh oxygen', [1.55, -0.85, 0.2], tree, 'red', true);
    L('Hepatic veins', [-1.2, 1.4, -0.9], tree, 'blue');
    L('Inferior vena cava → heart', [-0.45, 2.75, -1.05], tree, 'blue', true);
    L('Common bile duct', [-1.45, -2.3, 0.1], tree, 'green', true);
    L('Common hepatic duct', [-2.0, -0.75, 0.0], tree, 'green');
    if (o.context) { L('Duodenum', [-1.6, -3.1, 0.1], ctx, ''); L('Pancreas', [2.35, -1.75, -1.1], ctx, ''); L('Aorta', [0.75, 2.2, -1.45], ctx, 'red'); }
  }

  let xr = 0;
  const api = {
    root, groups, lobes, gb, lig, fin, teres, vessels, context, flow, labels, minor, liverMat, gbMat,
    // 0 = solid, 1 = see-through (the vessel tree shows inside).
    setXray(k) {
      xr = k;
      liverMat.opacity = lerp(1, 0.2, k); liverMat.depthWrite = k < 0.5;
      lobes.forEach((m) => { m.renderOrder = 2; m.castShadow = k < 0.5; });
      gbMat.opacity = lerp(1, 0.55, k); gb.renderOrder = 2;
      ligMat.opacity = lerp(1, 0.4, k); fin.material.opacity = lerp(0.55, 0.2, k);
    },
    get xray() { return xr; },
    // Pull the lobes away from the vessel tree (k 0 → 1).
    setExplode(k) {
      const e = smooth(k);
      right.position.set(-0.9, 0.1, 0.1).multiplyScalar(e);
      left.position.set(1.0, 0.3, 0.2).multiplyScalar(e);
      caud.position.set(0.2, 0.3, -1.0).multiplyScalar(e);
      quad.position.set(0.1, -0.5, 1.1).multiplyScalar(e);
      gbG.position.set(-0.6, -0.9, 1.0).multiplyScalar(e);
      [lig, fin, teres].forEach((m) => { m.visible = k < 0.05; });
    },
    showLabels(on, narrow = false) { labels.forEach((l) => { l.visible = on; }); if (on && narrow) minor.forEach((l) => { l.visible = false; }); },
    // Reshape and recolour the liver for the health chapter.
    //  fat 0..1: pale, yellow, swollen (fatty liver); scar 0..1: shrunken, lumpy and tawny (cirrhosis);
    //  inflame 0..1: redder (hepatitis).
    setCondition({ fat = 0, scar = 0, inflame = 0 } = {}) {
      const key = `${fat.toFixed(3)}|${scar.toFixed(3)}|${inflame.toFixed(3)}`;
      if (key === this._cond) return;
      this._cond = key;
      const c = new THREE.Color(COL.liver);
      c.lerp(new THREE.Color(0xb8323a), inflame * 0.55);
      c.lerp(new THREE.Color(0xd9b46a), fat * 0.75);
      c.lerp(new THREE.Color(0xa77a3a), scar * 0.85);
      liverMat.color.copy(c);
      liverMat.roughness = 0.4 + scar * 0.35; liverMat.clearcoat = 0.6 - scar * 0.4;
      const grow = 1 + fat * 0.14 - scar * 0.16;
      lobes.forEach((m) => {
        const a = m.geometry.attributes.position, b = m.userData.base, n = m.userData.nrm;
        for (let i = 0; i < a.count; i++) {
          const x = b[i * 3], y = b[i * 3 + 1], z = b[i * 3 + 2];
          // Regenerative nodules: round lumps a few millimetres to a centimetre or so across.
          const bump = scar ? Math.abs(Math.sin(x * 9.1) * Math.sin(y * 8.3 + 1.3) * Math.sin(z * 8.7 + 2.1)) * 0.07 * scar : 0;
          a.setXYZ(i, x * grow + n[i * 3] * bump, y * grow + n[i * 3 + 1] * bump, z * grow + n[i * 3 + 2] * bump);
        }
        a.needsUpdate = true;
        if (scar) m.geometry.computeVertexNormals();
      });
    },
  };
  api.setXray(0); api.setExplode(0);
  return api;
}

// ================================================================ the body around it
// Ghost ribs (5th to 10th), the sternum and the dome of the diaphragm, so you can see that the
// liver hides under the right ribs. One unit ≈ 5 cm: the lower chest is about 32 cm wide.
export function makeRibs(parent) {
  const g = new THREE.Group(); parent.add(g);
  const mat = new THREE.MeshStandardMaterial({ color: 0xefe6d6, transparent: true, opacity: 0.28, roughness: 0.6, depthWrite: false });
  for (let k = 0; k < 6; k++) {
    // Each rib slopes down from the spine to the front, where its cartilage meets the sternum
    // (upper ribs) or the rib above (lower ribs, forming the rib margin).
    const yb = 2.6 - k * 0.5, yf = yb - 1.25 - k * 0.12, span = k < 3 ? 0.35 : 0.8 + (k - 3) * 0.55;
    const aEnd = Math.PI - Math.asin(Math.min(1, span / 3.2));
    for (const sx of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 16; i++) { const t = i / 16, a = lerp(0.42 * Math.PI, aEnd, t); pts.push([sx * 3.2 * Math.sin(a), lerp(yb - 0.35, yf, smooth(t)), -0.35 - 2.1 * Math.cos(a)]); }
      g.add(tube(smoothPts(pts, 40), 0.055, mat, false, 50));
    }
  }
  const sternum = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.6, 0.15), mat); sternum.position.set(0, 1.35, 1.78); g.add(sternum);
  const dia = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd98c7a, transparent: true, opacity: 0.1, roughness: 0.7, depthWrite: false, side: THREE.DoubleSide }));
  dia.scale.set(3.1, 1.0, 2.0); dia.position.set(0, 0.55, -0.35); g.add(dia);
  return { group: g, ribMat: mat, dia };
}
