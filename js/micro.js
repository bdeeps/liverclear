// LiverClear's microscopic models: the hexagonal liver lobule and a single liver cell (hepatocyte).
//
// The lobule (Guyton & Hall ch. 71; Junqueira's Basic Histology, 16th ed., ch. 16 "Organs Associated
// with the Digestive Tract"; StatPearls "Histology, Liver" NBK554441):
//  - a six-sided column about 1–2 mm across, with a central vein running up its middle;
//  - at each corner a portal triad: a branch of the portal vein, a branch of the hepatic artery and a
//    bile ductule, travelling together;
//  - plates of liver cells, one or two cells thick, radiate from the central vein like spokes;
//  - between the plates run sinusoids, leaky capillaries lined with thin cells with holes in them;
//    blood from the portal venule and the arteriole mixes at the edge and flows INWARD to the central vein;
//  - bile is made by the cells and flows OUTWARD in tiny channels between them (bile canaliculi) to the
//    bile ductule at the corners: the opposite direction to the blood;
//  - Kupffer cells, the liver's resident macrophages, sit in the sinusoids and swallow bacteria.
// Units: the lobule's hexagon has a radius of 2.4 units, so one unit is about 0.25 mm.
import { THREE, M, tube, lerp, clamp, smooth } from './kit.js';
import { COL, pathOf, smoothPts, V } from './liver.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ================================================================ the lobule
export const HEX_R = 2.4;
export const hexCorner = (i, R = HEX_R, cx = 0, cz = 0) => { const a = (Math.PI / 3) * i; return [cx + R * Math.cos(a), cz + R * Math.sin(a)]; };
// Distance from the centre to the hexagon's edge along angle a (corners at 0°, 60°, …).
export const hexEdge = (a, R = HEX_R) => { const k = ((a % (Math.PI / 3)) + Math.PI / 3) % (Math.PI / 3) - Math.PI / 6; return (R * Math.cos(Math.PI / 6)) / Math.cos(k); };

export function makeLobule(stage, { plates = 18, layers = 5 } = {}) {
  const root = new THREE.Group();
  const H = layers * 0.24, y0 = -H / 2, yTop = H / 2;
  // Hepatocyte plates: radial walls of cells.
  const cellG = new RoundedBoxGeometry(0.19, 0.2, 0.19, 2, 0.04);
  const slots = [];
  for (let k = 0; k < plates; k++) {
    const a = (k / plates) * Math.PI * 2, rMax = hexEdge(a) - 0.2;
    for (let r = 0.52; r < rMax; r += 0.23) for (let l = 0; l < layers; l++) slots.push({ a, r, y: y0 + 0.12 + l * 0.24, k });
  }
  const cells = new THREE.InstancedMesh(cellG, new THREE.MeshStandardMaterial({ color: 0xc97a66, roughness: 0.6, transparent: true, opacity: 1 }), slots.length);
  const o = new THREE.Object3D();
  slots.forEach((s, i) => { o.position.set(s.r * Math.cos(s.a), s.y, s.r * Math.sin(s.a)); o.rotation.set(0, -s.a, 0); o.updateMatrix(); cells.setMatrixAt(i, o.matrix); });
  cells.castShadow = true; root.add(cells);
  // Central vein.
  const cv = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, H + 1.6, 32, 1, true), new THREE.MeshStandardMaterial({ color: COL.blue, transparent: true, opacity: 0.75, side: THREE.DoubleSide, roughness: 0.4 }));
  cv.position.y = 0.4; root.add(cv);
  // Portal triads at the six corners, with small branches running along the edges.
  const tri = new THREE.Group(); root.add(tri);
  const triads = [];
  for (let i = 0; i < 6; i++) {
    const [x, z] = hexCorner(i), a = (Math.PI / 3) * i;
    const off = (d, s) => [x + d * Math.cos(a + s), z + d * Math.sin(a + s)];
    const pv = off(0.08, 0), ha = off(0.17, 2.2), bd = off(0.17, -2.2);
    const col = (p, r, c, len = H + 0.5) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), M.plastic(c, { roughness: 0.35 })); m.position.set(p[0], 0, p[1]); tri.add(m); return m; };
    col(pv, 0.1, COL.portal); col(ha, 0.055, COL.red); col(bd, 0.055, COL.bile);
    triads.push({ pv, ha, bd, x, z });
  }
  // Neighbouring lobules: faint outlines on the top face, so you can see how they tile.
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 });
  const hexLine = (cx, cz, y) => { const pts = []; for (let i = 0; i <= 6; i++) { const [x, z] = hexCorner(i, HEX_R, cx, cz); pts.push(V(x, y, z)); } return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat); };
  root.add(hexLine(0, 0, yTop + 0.02));
  const nb = new THREE.Group(); root.add(nb);
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6, d = HEX_R * Math.sqrt(3);
    const cx = d * Math.cos(a), cz = d * Math.sin(a);
    nb.add(hexLine(cx, cz, yTop + 0.02));
    const c = new THREE.Mesh(new THREE.CircleGeometry(0.22, 20), M.ghost(COL.blue, 0.35)); c.rotation.x = -Math.PI / 2; c.position.set(cx, yTop + 0.03, cz); nb.add(c);
    const f = new THREE.Mesh(new THREE.CircleGeometry(HEX_R * 0.98, 6), M.ghost(0xc97a66, 0.07)); f.rotation.x = -Math.PI / 2; f.rotation.z = 0; f.position.set(cx, yTop + 0.01, cz); nb.add(f);
  }
  // Bile canaliculi: thin green threads along the top of each plate.
  const canMat = M.glow(COL.bile, { transparent: true, opacity: 0.7 });
  for (let k = 0; k < plates; k++) {
    const a = (k / plates) * Math.PI * 2, rMax = hexEdge(a) - 0.1;
    root.add(tube([[0.45 * Math.cos(a), yTop + 0.015, 0.45 * Math.sin(a)], [rMax * Math.cos(a), yTop + 0.015, rMax * Math.sin(a)]], 0.018, canMat, false, 4));
  }

  // ---- blood in the sinusoids (between plates) and bile in the canaliculi (along plates)
  const nBlood = 150, nBile = 70;
  const blood = new THREE.InstancedMesh(new THREE.SphereGeometry(0.065, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), nBlood);
  const bile = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: COL.bile, toneMapped: false }), nBile);
  [blood, bile].forEach((m) => { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; root.add(m); });
  const bd = Array.from({ length: nBlood }, (_, i) => ({ k: Math.floor(rnd(i) * plates), t: rnd(i + 1), y: lerp(y0 + 0.1, yTop - 0.05, rnd(i + 2)), art: rnd(i + 3) < 0.25 }));
  const bl = Array.from({ length: nBile }, (_, i) => ({ k: Math.floor(rnd(i + 50) * plates), t: rnd(i + 51) }));
  const col = new THREE.Color(), cP = new THREE.Color(COL.portal), cA = new THREE.Color(COL.red), cB = new THREE.Color(COL.blue);

  // ---- Kupffer cells and bacteria
  const kup = [], kupG = new THREE.Group(); root.add(kupG);
  const kMat = new THREE.MeshStandardMaterial({ color: 0xffc35a, emissive: 0x5a3500, roughness: 0.5 });
  const nK = 9;
  for (let i = 0; i < nK; i++) {
    const k = Math.floor((i / nK) * plates + 0.5) % plates, a = ((k + 0.5) / plates) * Math.PI * 2, r = lerp(0.9, hexEdge(a) - 0.5, rnd(i + 90));
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), kMat);
    const arms = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), kMat); arms.scale.set(2.2, 0.6, 0.6); m.add(arms);
    m.position.set(r * Math.cos(a), yTop - 0.02, r * Math.sin(a)); kupG.add(m);
    kup.push({ k, r, m, a });
  }
  const nBac = 12;
  const bac = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.035, 0.1, 4, 8), new THREE.MeshBasicMaterial({ color: 0xb6ff5a, toneMapped: false }), nBac);
  bac.instanceMatrix.setUsage(THREE.DynamicDrawUsage); bac.frustumCulled = false; root.add(bac);
  const bacs = Array.from({ length: nBac }, (_, i) => ({ kk: i % nK, t: rnd(i + 200), caught: 0, esc: false }));
  let caught = 0, passed = 0, seed = 0;

  const api = {
    root, cells, cv, tri, nb, kupG, bac, triads, H, yTop,
    get caught() { return caught; }, get passed() { return passed; },
    showBacteria(on) { bac.visible = on; },
    step(dt, speed = 1, { bacteria = true } = {}) {
      dt = Math.max(0, dt) * speed;
      // Blood: from the edge inwards along a sinusoid, then up the central vein.
      for (let i = 0; i < nBlood; i++) {
        const d = bd[i]; d.t += dt * 0.16;
        if (d.t > 1) { d.t -= 1; d.k = Math.floor(rnd(i + d.t * 99 + (seed++)) * plates); d.art = rnd(seed) < 0.25; }
        const a = ((d.k + 0.5) / plates) * Math.PI * 2, rE = hexEdge(a) - 0.05;
        let p;
        if (d.t < 0.8) { const r = lerp(rE, 0.3, d.t / 0.8); p = [r * Math.cos(a), d.y, r * Math.sin(a)]; }
        else { const k = (d.t - 0.8) / 0.2; p = [0.15 * Math.cos(a), lerp(d.y, yTop + 1.2, k), 0.15 * Math.sin(a)]; }
        o.position.set(...p); o.rotation.set(0, 0, 0); o.updateMatrix(); blood.setMatrixAt(i, o.matrix);
        col.copy(d.art ? cA : cP).lerp(cB, smooth(d.t / 0.8)); blood.setColorAt(i, col);
      }
      blood.instanceMatrix.needsUpdate = true; blood.instanceColor.needsUpdate = true;
      // Bile: outwards along a plate, then along the edge to the nearest corner's ductule and down it.
      for (let i = 0; i < nBile; i++) {
        const d = bl[i]; d.t += dt * 0.09;
        if (d.t > 1) { d.t -= 1; d.k = Math.floor(rnd(i + (seed++)) * plates); }
        const a = (d.k / plates) * Math.PI * 2, rE = hexEdge(a) - 0.1;
        const ci = Math.round(a / (Math.PI / 3)) % 6, T = triads[ci];
        let p;
        if (d.t < 0.7) { const r = lerp(0.45, rE, d.t / 0.7); p = [r * Math.cos(a), yTop + 0.03, r * Math.sin(a)]; }
        else if (d.t < 0.85) { const k = (d.t - 0.7) / 0.15; p = [lerp(rE * Math.cos(a), T.bd[0], k), yTop + 0.03, lerp(rE * Math.sin(a), T.bd[1], k)]; }
        else { const k = (d.t - 0.85) / 0.15; p = [T.bd[0], lerp(yTop + 0.03, y0 - 0.3, k), T.bd[1]]; }
        o.position.set(...p); o.updateMatrix(); bile.setMatrixAt(i, o.matrix);
      }
      bile.instanceMatrix.needsUpdate = true;
      // Bacteria ride in with portal blood; a Kupffer cell grabs almost every one [GH ch. 71: fewer
      // than 1% get through].
      for (let i = 0; i < nBac; i++) {
        const b = bacs[i], K = kup[b.kk], a = K.a, rE = hexEdge(a) - 0.05;
        let p;
        if (b.caught > 0) {
          b.caught += dt;
          const s = Math.max(0, 1 - b.caught / 1.5);
          o.position.copy(K.m.position).add(V(0.05 * Math.sin(i), 0.05, 0.05 * Math.cos(i))); o.scale.setScalar(s); o.updateMatrix(); bac.setMatrixAt(i, o.matrix); o.scale.setScalar(1);
          if (b.caught > 2.2) { b.caught = 0; b.t = 0; b.kk = (b.kk + 1 + Math.floor(rnd(seed++) * (nK - 1))) % nK; b.esc = rnd(seed++) < 0.01; }
          continue;
        }
        b.t += dt * 0.2;
        const r = lerp(rE, 0.3, Math.min(1, b.t));
        if (!b.esc && r <= K.r) { b.caught = 0.001; caught++; continue; }
        if (b.t >= 1) { passed++; b.t = 0; b.esc = rnd(seed++) < 0.01; }
        p = [r * Math.cos(a), yTop - 0.02, r * Math.sin(a)];
        o.position.set(...p); o.rotation.set(0, -a, Math.PI / 2); o.updateMatrix(); bac.setMatrixAt(i, o.matrix); o.rotation.set(0, 0, 0);
      }
      bac.instanceMatrix.needsUpdate = true;
      kup.forEach((K, i) => { K.m.rotation.y += dt * 0.6; K.m.rotation.x = Math.sin(i + K.m.rotation.y) * 0.3; });
    },
  };
  api.step(0);
  return api;
}

// ================================================================ one liver cell
// A hepatocyte is about 20–30 µm across (StatPearls "Histology, Liver"), with one or two round nuclei,
// up to about 1,000–2,000 mitochondria, lots of rough and smooth endoplasmic reticulum, a Golgi, and
// glycogen stored as rosettes of granules. One face lies along a sinusoid (with microvilli reaching into
// the space of Disse); the faces between neighbouring cells form the bile canaliculi.
// Units here: the cell is 3 units wide, so one unit is about 8 µm.
export function makeCell(stage, { neighbour = true, sinusoid = true } = {}) {
  const root = new THREE.Group();
  const W = 3, Hh = 2.2, D = 2.2;
  const memMat = new THREE.MeshPhysicalMaterial({ color: 0xf2b9a8, roughness: 0.3, transmission: 0, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, clearcoat: 0.6 });
  const cell = new THREE.Mesh(new RoundedBoxGeometry(W, Hh, D, 4, 0.35), memMat); cell.renderOrder = 3; root.add(cell);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new RoundedBoxGeometry(W, Hh, D, 1, 0.35), 30), new THREE.LineBasicMaterial({ color: 0xf6c9b8, transparent: true, opacity: 0.35 })); root.add(edge);
  const inner = new THREE.Group(); root.add(inner);
  // Nucleus and nucleolus.
  const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 20), new THREE.MeshPhysicalMaterial({ color: 0x7b5cc9, roughness: 0.35, clearcoat: 0.5 })); nuc.position.set(-0.2, 0.15, 0); inner.add(nuc);
  const nl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), M.plastic(0x4d3590)); nl.position.set(-0.05, 0.25, 0.4); inner.add(nl);
  // Mitochondria.
  const mitoMat = new THREE.MeshStandardMaterial({ color: 0xff9a52, roughness: 0.45 });
  const mitos = [];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.28, 4, 10), mitoMat);
    m.position.set(lerp(-1.2, 1.2, rnd(i + 10)), lerp(-0.8, 0.8, rnd(i + 20)), lerp(-0.75, 0.75, rnd(i + 30)));
    if (m.position.distanceTo(nuc.position) < 0.75) m.position.x += 1.0;
    m.rotation.set(rnd(i) * 3, rnd(i + 1) * 3, rnd(i + 2) * 3); inner.add(m); mitos.push(m);
  }
  // Rough ER: curved stacked sheets beside the nucleus, dotted with ribosomes.
  const erMat = new THREE.MeshStandardMaterial({ color: 0x6fa8ff, roughness: 0.5, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
  const er = new THREE.Group(); inner.add(er);
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.8 + i * 0.12, 0.8 + i * 0.12, 0.7, 24, 1, true, -0.9, 1.8), erMat);
    s.position.copy(nuc.position); er.add(s);
  }
  er.rotation.set(0, Math.PI, 0.2); er.position.set(-0.45, 0, 0);
  const ribo = new THREE.InstancedMesh(new THREE.SphereGeometry(0.025, 6, 4), M.plastic(0x2b4f9a), 120);
  for (let i = 0; i < 120; i++) { const R = 0.8 + (i % 4) * 0.12 + 0.03, a = lerp(-0.9, 0.9, rnd(i + 300)); const p = V(R * Math.sin(a), lerp(-0.33, 0.33, rnd(i + 400)), R * Math.cos(a)); const m = new THREE.Matrix4().makeTranslation(p.x, p.y, p.z); ribo.setMatrixAt(i, m); }
  er.add(ribo);
  // Smooth ER: tangled tubes (where drugs and alcohol are processed, and cholesterol is made).
  const ser = new THREE.Group(); inner.add(ser);
  const serMat = new THREE.MeshStandardMaterial({ color: 0x5fd3c8, roughness: 0.5 });
  for (let i = 0; i < 3; i++) ser.add(tube(smoothPts([[0.6, -0.5 + i * 0.3, -0.5], [0.9, -0.3 + i * 0.25, 0.1], [0.7, -0.6 + i * 0.3, 0.55], [1.15, -0.4 + i * 0.3, 0.65]], 30), 0.045, serMat, false, 40));
  // Golgi: a stack of curved discs.
  const golgi = new THREE.Group(); inner.add(golgi);
  for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.3 - i * 0.03, 0.3 - i * 0.03, 0.04, 20), M.plastic(0xffd166)); d.position.y = i * 0.07; d.scale.z = 0.5; golgi.add(d); }
  golgi.position.set(0.25, 0.7, -0.35); golgi.rotation.z = 0.5;
  // Glycogen rosettes: clusters of tiny granules; how many are shown is set by setGlycogen(0..1).
  const nGly = 60, glyG = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.06, 1), new THREE.MeshStandardMaterial({ color: 0xffe9f0, emissive: 0x402030, roughness: 0.5 }), nGly * 5);
  const glyPos = [];
  for (let i = 0; i < nGly; i++) {
    let p;
    for (let tries = 0; tries < 20; tries++) { p = V(lerp(-1.25, 1.25, rnd(i * 7 + tries)), lerp(-0.85, 0.85, rnd(i * 11 + tries + 5)), lerp(-0.8, 0.8, rnd(i * 13 + tries + 9))); if (p.distanceTo(nuc.position) > 0.7) break; }
    for (let j = 0; j < 5; j++) glyPos.push(p.clone().add(V(Math.cos(j * 1.3) * 0.07, Math.sin(j * 2.1) * 0.07, Math.sin(j * 1.7) * 0.07)));
  }
  inner.add(glyG);
  const setGlycogen = (k) => {
    const n = Math.round(clamp(k, 0, 1) * nGly) * 5;
    const m = new THREE.Matrix4();
    for (let i = 0; i < nGly * 5; i++) { if (i < n) m.makeTranslation(glyPos[i].x, glyPos[i].y, glyPos[i].z); else m.makeScale(0, 0, 0); glyG.setMatrixAt(i, m); }
    glyG.instanceMatrix.needsUpdate = true;
  };
  setGlycogen(0.6);

  const parts = { nuc, mitos, er, ser, golgi, glyG, cell };
  // Sinusoid below the cell: a channel of blood, with the leaky lining and microvilli.
  let sin = null;
  if (sinusoid) {
    sin = new THREE.Group(); root.add(sin);
    const y = -Hh / 2 - 0.55;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(W + 3, 0.04, D + 0.2), new THREE.MeshStandardMaterial({ color: 0xf0a0a0, transparent: true, opacity: 0.35, depthWrite: false }));
    wall.position.y = -Hh / 2 - 0.22; sin.add(wall);
    const mv = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 6), M.plastic(0xf2b9a8), 60);
    for (let i = 0; i < 60; i++) { const m = new THREE.Matrix4().makeTranslation(lerp(-1.35, 1.35, (i % 15) / 14), -Hh / 2 - 0.09, lerp(-0.9, 0.9, Math.floor(i / 15) / 3)); mv.setMatrixAt(i, m); }
    sin.add(mv);
    // Red blood cells: little dimpled discs drifting along the channel.
    const nR = 16, rbc = new THREE.InstancedMesh(new THREE.TorusGeometry(0.12, 0.07, 8, 16), M.plastic(0xd23a44, { roughness: 0.4 }), nR);
    rbc.instanceMatrix.setUsage(THREE.DynamicDrawUsage); sin.add(rbc);
    const rs = Array.from({ length: nR }, (_, i) => ({ x: lerp(-3, 3, i / nR), z: lerp(-0.8, 0.8, rnd(i + 70)), yy: lerp(-0.25, 0.2, rnd(i + 71)), r: rnd(i + 72) * 3 }));
    sin.userData = { y, rbc, rs };
  }
  // Neighbouring cell, with a bile canaliculus in the groove between them.
  let can = null;
  if (neighbour) {
    const nbc = new THREE.Mesh(new RoundedBoxGeometry(W * 0.6, Hh, D, 3, 0.35), memMat); nbc.position.x = W * 0.8 + 0.05; root.add(nbc);
    can = tube([[W / 2 + 0.02, 0.1, -D / 2 - 0.1], [W / 2 + 0.02, 0.1, D / 2 + 0.1]], 0.09, M.plastic(COL.bile, { transparent: true, opacity: 0.9 }), false, 8); root.add(can);
  }
  const o = new THREE.Object3D();
  return {
    root, inner, parts, sin, can, setGlycogen, W, H: Hh, D, memMat,
    step(dt, speed = 1) {
      dt = Math.max(0, dt) * speed;
      if (sin) {
        const { y, rbc, rs } = sin.userData;
        rs.forEach((r, i) => { r.x += dt * 0.7; if (r.x > 3) r.x -= 6; r.r += dt; o.position.set(r.x, y + r.yy, r.z); o.rotation.set(Math.PI / 2 + Math.sin(r.r) * 0.3, r.r * 0.3, 0); o.updateMatrix(); rbc.setMatrixAt(i, o.matrix); });
        rbc.instanceMatrix.needsUpdate = true;
      }
    },
  };
}

// ================================================================ molecules on the move
// Small dots that travel along a path and can change colour at "stations" (a chemical change).
export function traveller(parent, pts, { n = 20, r = 0.06, speed = 0.4, cols = [[0, 0xffffff]], shape = null, spread = 0.04 } = {}) {
  const path = pathOf(smoothPts(pts, 100));
  const mesh = new THREE.InstancedMesh(shape || new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false; parent.add(mesh);
  const us = Array.from({ length: n }, (_, i) => (i + rnd(i + 17) * 0.8) / n), js = Array.from({ length: n }, (_, i) => [rnd(i + 1) - 0.5, rnd(i + 2) - 0.5, rnd(i + 3) - 0.5]);
  const o = new THREE.Object3D(), p = new THREE.Vector3(), c = new THREE.Color();
  const api = {
    mesh, path, speed, count: n,
    step(dt, k = 1) {
      dt = Math.max(0, dt);
      for (let i = 0; i < n; i++) {
        us[i] = (us[i] + (api.speed * k * dt) / path.total + 1) % 1;
        const vis = i < api.count;
        path.at(us[i], p);
        o.position.set(p.x + js[i][0] * spread, p.y + js[i][1] * spread, p.z + js[i][2] * spread);
        o.scale.setScalar(vis ? 1 : 0); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix);
        let ci = 0; for (let q = 0; q < cols.length; q++) if (us[i] >= cols[q][0]) ci = q;
        mesh.setColorAt(i, c.set(cols[ci][1]));
      }
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
  };
  api.step(0);
  return api;
}
