// Chapter 4: cleaning the blood. Three jobs inside one liver cell:
//  - ammonia (from breaking down protein) → urea in the urea cycle (Krebs and Henseleit, 1932), which
//    the kidneys then pass out in urine (Guyton & Hall ch. 70; StatPearls "Biochemistry, Urea Cycle"
//    NBK513323). Urine urea nitrogen is typically about 12–20 g a day (MedlinePlus "Urine urea
//    nitrogen"), roughly 25–40 g of urea, and it varies with how much protein you eat.
//  - alcohol → acetaldehyde (alcohol dehydrogenase, in the cell's fluid) → acetate (aldehyde
//    dehydrogenase, in the mitochondria). The liver clears it at a roughly steady rate, often quoted as
//    about 7–10 g an hour but varying widely between people (NIAAA "Alcohol Metabolism"; about
//    0.1 g/kg/h). Coffee, cold showers or water don't speed it up (Drinkaware; NHS). See model.js.
//  - worn-out red blood cells (they live about 120 days, Guyton & Hall ch. 33) are broken up by
//    macrophages; haem becomes bilirubin, about 250–400 mg a day (StatPearls "Physiology, Bilirubin",
//    NBK470290). The liver attaches it to glucuronic acid (conjugation) and sends it out in bile. If
//    bile can't drain, bilirubin backs up in the blood and skin and eyes turn yellow: jaundice.
import { THREE, M, tube } from '../kit.js';
import { board, BOARD_BG, tint, fitNarrow, compactReadout, pathOf, smoothPts, V, COL } from '../liver.js';
import { traveller } from '../micro.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { alcoholCurve, hoursToClear, DRINK_G } from '../model.js';

const TRICKS = { none: 'Nothing', coffee: 'Strong coffee', shower: 'Cold shower', water: 'Lots of water', sleep: 'A nap' };
const C = { nh3: 0xff7ad9, urea: 0xf3dfb4, eth: 0x9fd8ff, ald: 0xff9a3c, ace: 0x9be58a, bil: 0xffd84a, cbil: 0xc8e04a };

function drawAlc(g, w, h, st) {
  g.clearRect(0, 0, w, h); g.fillStyle = BOARD_BG; g.fillRect(0, 0, w, h);
  const L = 70, R = w - 30, top = 56, bot = h - 46, H = 10, gMax = Math.max(20, Math.ceil((st.peak + 5) / 10) * 10);
  const X = (t) => L + (t / H) * (R - L), Y = (v) => bot - (v / gMax) * (bot - top);
  g.lineWidth = 1; g.font = '21px sans-serif'; g.fillStyle = 'rgba(255,255,255,.55)';
  for (let v = 0; v <= gMax; v += gMax > 40 ? 20 : 10) { g.strokeStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(R, Y(v)); g.stroke(); g.fillText(v + ' g', 8, Y(v) + 7); }
  for (let t = 0; t <= H; t += 2) g.fillText(t + ' h', X(t) - 10, bot + 24);
  // The range of typical rates, 7–10 g/h, as a band of possible curves.
  const band = (rate) => alcoholCurve({ drinks: st.drinks, rate, hours: H });
  const lo = band(7), hi = band(10);
  g.fillStyle = 'rgba(159,216,255,.12)'; g.beginPath(); lo.forEach((p, i) => (i ? g.lineTo(X(p.t), Y(p.g)) : g.moveTo(X(p.t), Y(p.g)))); [...hi].reverse().forEach((p) => g.lineTo(X(p.t), Y(p.g))); g.closePath(); g.fill();
  g.strokeStyle = '#9fd8ff'; g.lineWidth = 4; g.beginPath(); st.curve.forEach((p, i) => (i ? g.lineTo(X(p.t), Y(p.g)) : g.moveTo(X(p.t), Y(p.g)))); g.stroke();
  g.strokeStyle = '#8ef0ff'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(st.t), top - 4); g.lineTo(X(st.t), bot); g.stroke();
  const p = st.curve[Math.min(st.curve.length - 1, Math.round(st.t * 20))];
  g.fillStyle = '#9fd8ff'; g.beginPath(); g.arc(X(st.t), Y(p.g), 8, 0, 7); g.fill();
  g.font = 'bold 27px sans-serif'; g.fillStyle = '#e8eef8'; g.fillText('Alcohol still in the body (grams)', L, 32);
  g.font = '21px sans-serif'; g.fillStyle = 'rgba(159,216,255,.8)'; g.fillText('shaded: the usual 7–10 g/h range', R - 340, 32);
  if (st.trick !== 'none') { g.fillStyle = '#ffd166'; g.font = 'bold 23px sans-serif'; g.fillText(`${TRICKS[st.trick]}: same line`, X(st.clear) + 10 > R - 190 ? R - 190 : X(st.clear) + 10, Y(gMax * 0.55)); }
}

export default {
  id: 'detox',
  short: 'Cleaning the blood',
  title: 'Cleaning the blood',
  subtitle: 'Ammonia into urea, alcohol into acetate, old red cells into bile.',
  view: { pos: [-0.1, 5.3, 11.6], target: [0.1, 4.8, 0] },
  learn: `<p>Everything the portal vein brings from the gut passes through the liver before it reaches the rest of you, so the liver acts as a <b>filter and a chemical plant</b>. It changes harmful things into harmless ones, or into forms that can leave the body.</p>
    <p><b>Ammonia.</b> When your body breaks down protein, it makes <b>ammonia</b>, which is poisonous to the brain. Liver cells feed it into a loop of reactions called the <b>urea cycle</b> and turn it into <b>urea</b>, which is harmless. The blood carries urea to the <b>kidneys</b>, which pass it out in urine (see <a href="/kidneyclear/">KidneyClear</a>).</p>
    <p><b>Alcohol and medicines.</b> Enzymes in liver cells break down most medicines, and alcohol. <b>Alcohol dehydrogenase</b> turns alcohol into <b>acetaldehyde</b>, which is toxic, and a second enzyme turns that into harmless <b>acetate</b>. The liver works at a roughly <b>steady pace</b>: for many adults something like <b>7 to 10 g</b> of alcohol an hour, though it varies a lot from person to person. Coffee, cold showers or water do not speed it up. Only time does.</p>
    <p><b>Old red blood cells.</b> A red cell lives about <b>120 days</b>. Worn-out ones are swallowed by macrophages, and their red pigment becomes a yellow one, <b>bilirubin</b>. The liver packages bilirubin and sends it out in <b>bile</b>, which is why stool is brown. If bile can’t drain, bilirubin builds up in the blood and the skin and whites of the eyes turn yellow. That is called <b>jaundice</b>, and it always needs a doctor to find the cause.</p>
    <p class="tip"><b>Try it:</b> switch between the three jobs. For alcohol, add a drink and try each “trick”: the line doesn’t budge. For red cells, block the bile duct and watch the eye.</p>`,
  terms: [
    { t: 'Ammonia', d: 'A small nitrogen molecule made when protein is broken down. Toxic to the brain in large amounts.' },
    { t: 'Urea cycle', d: 'A loop of reactions in liver cells that turns ammonia into urea.' },
    { t: 'Urea', d: 'A harmless waste made from ammonia, carried to the kidneys and passed out in urine.' },
    { t: 'Alcohol dehydrogenase', d: 'The liver enzyme that turns alcohol into acetaldehyde, the first step in breaking it down.' },
    { t: 'Acetaldehyde', d: 'A toxic chemical made from alcohol, quickly turned into harmless acetate by another enzyme.' },
    { t: 'Bilirubin', d: 'A yellow pigment made from the haemoglobin of old red blood cells. The liver sends it out in bile.' },
    { t: 'Jaundice', d: 'Yellowing of the skin and eyes when bilirubin builds up in the blood. A sign to see a doctor.' },
  ],
  defaults: { job: 'ammonia', drinks: 2, rate: 8, trick: 'none', t: 0.5, play: true, blocked: false },
  controls: [
    { key: 'job', type: 'seg', label: 'What is being cleaned', options: [{ v: 'ammonia', label: 'Ammonia' }, { v: 'alcohol', label: 'Alcohol' }, { v: 'redcells', label: 'Old red cells' }], fmt: () => '' },
    { key: 'drinks', type: 'range', label: 'Alcohol: standard drinks (10 g each)', min: 1, max: 6, step: 1, fmt: (v) => `${v} (${v * DRINK_G} g)` },
    { key: 'rate', type: 'range', label: 'Alcohol: the liver’s pace', min: 5, max: 12, step: 0.5, ends: ['slower', 'faster'], fmt: (v) => v + ' g/h', hint: 'It differs from person to person; you can’t change your own.' },
    { key: 'trick', type: 'seg', label: 'Alcohol: try a “trick”', options: Object.entries(TRICKS).map(([v, label]) => ({ v, label })), fmt: () => '' },
    { key: 'blocked', type: 'toggle', label: 'Red cells: block the bile duct' },
    { key: 'play', type: 'toggle', label: 'Run the clock' },
  ],
  quiz: [
    { q: 'What does the liver turn ammonia into?', options: ['Glucose', 'Urea, which the kidneys remove', 'Bile salts', 'Alcohol'], answer: 1, why: 'The urea cycle turns toxic ammonia into harmless urea, which leaves in urine.' },
    { q: 'Which of these speeds up how fast the liver clears alcohol?', options: ['Strong coffee', 'A cold shower', 'Drinking lots of water', 'None of them: only time'], answer: 3, why: 'The liver’s enzymes work at a roughly steady pace. Coffee may make someone feel more awake, but the alcohol is still there.' },
    { q: 'Why can skin turn yellow in jaundice?', options: ['Too much carrot', 'Bilirubin from old red cells builds up because it can’t leave in bile', 'The liver makes too much glycogen', 'The blood runs out of oxygen'], answer: 1, why: 'Bilirubin normally leaves in bile. If it backs up, it spreads into the skin and eyes. Jaundice always needs a doctor.' },
  ],
  reel: [
    { ms: 5000, caption: 'The liver turns toxic ammonia into harmless urea, which your kidneys wash away.', set: { job: 'ammonia', play: true }, view: { pos: [0.2, 4.8, 10.6], target: [0.2, 3.9, 0] }, spin: 0 },
    { ms: 6000, caption: 'Alcohol leaves at a steady pace of a few grams an hour. Coffee or cold water can’t hurry it.', set: { job: 'alcohol', drinks: 3, rate: 8, trick: 'coffee', play: false }, anim: { t: [0, 4] }, view: { pos: [0.2, 3.6, 11], target: [0.2, 2.8, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.set(0, 4.2, 0); stage.root.add(root);
    // One big liver cell with a mitochondrion, over a blood vessel (sinusoid).
    const cellMat = new THREE.MeshPhysicalMaterial({ color: 0xf2b9a8, roughness: 0.3, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
    const cell = new THREE.Mesh(new RoundedBoxGeometry(4.4, 2.6, 2.0, 4, 0.5), cellMat); cell.position.set(0, 0.6, 0); root.add(cell);
    const cellEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new RoundedBoxGeometry(4.4, 2.6, 2.0, 1, 0.5), 30), new THREE.LineBasicMaterial({ color: 0xf6c9b8, transparent: true, opacity: 0.35 })); cellEdge.position.copy(cell.position); root.add(cellEdge);
    const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), M.plastic(0x7b5cc9)); nuc.position.set(-1.4, 1.35, -0.4); root.add(nuc);
    const mito = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 1.1, 6, 16), new THREE.MeshStandardMaterial({ color: 0xff9a52, transparent: true, opacity: 0.35, roughness: 0.4, depthWrite: false })); mito.rotation.z = Math.PI / 2; mito.position.set(0.9, 0.9, -0.1); root.add(mito);
    const vessel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 11, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xd8404c, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })); vessel.rotation.z = Math.PI / 2; vessel.position.set(0, -1.3, 0); root.add(vessel);
    const bileDuct = tube([[1.7, 1.75, 0.3], [2.6, 2.3, 0.3], [4.0, 2.4, 0.3], [5.2, 2.0, 0.3]], 0.14, new THREE.MeshStandardMaterial({ color: COL.bile, transparent: true, opacity: 0.35, depthWrite: false }), false, 40); root.add(bileDuct);
    // Kidneys and bladder (for urea), and an eye (for jaundice).
    const kid = new THREE.Group(); root.add(kid);
    const kidney = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), M.plastic(0x9c3b3b)); kidney.scale.set(0.42, 0.7, 0.3); kidney.position.set(5.2, -2.0, 0); kid.add(kidney);
    const bladder = new THREE.Mesh(new THREE.SphereGeometry(0.35, 20, 14), new THREE.MeshStandardMaterial({ color: 0xf3e39a, transparent: true, opacity: 0.6 })); bladder.position.set(5.2, -3.15, 0); kid.add(bladder);
    const eye = new THREE.Group(); eye.position.set(4.4, 0.5, 0.5); root.add(eye);
    const scleraMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 20), scleraMat); eye.add(sclera);
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.24, 32), M.plastic(0x5a3a22)); iris.position.z = 0.54; eye.add(iris);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), M.plastic(0x050505)); pupil.position.z = 0.545; eye.add(pupil);
    const spleen = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffc35a, emissive: 0x5a3500 })); spleen.position.set(-3.2, -1.3, 0.2); root.add(spleen);

    // ---- paths
    const ring = (cx, cy, r, n = 16, z = 0.25) => Array.from({ length: n + 1 }, (_, i) => [cx + r * Math.cos(Math.PI + (i / n) * Math.PI * 2), cy + r * Math.sin(Math.PI + (i / n) * Math.PI * 2), z]);
    const uAt = (pts, p) => pathOf(smoothPts(pts, 100)).near(p);
    const ammPts = [[-5.6, -1.3, 0.15], [-1.7, -1.3, 0.15], [-1.3, -0.3, 0.2], [-0.2, 0.6, 0.25], ...ring(0.9, 0.9, 0.45), [1.5, 0.3, 0.25], [1.7, -0.9, 0.15], [2.4, -1.3, 0.15], [4.6, -1.3, 0.15], [5.2, -1.9, 0.1], [5.2, -3.1, 0.1]];
    const amm = traveller(root, ammPts, { n: 26, r: 0.07, speed: 0.9, cols: [[0, C.nh3], [uAt(ammPts, [0.45, 0.9, 0.25]) + 0.04, C.urea]] });
    const alcPts = [[-1.4, -1.2, -0.2], [-1.2, -0.2, -0.2], [-0.6, 0.9, -0.1], [0.3, 0.9, -0.05], [1.0, 0.9, 0], [1.6, 0.0, -0.1], [2.0, -1.2, -0.2], [5.6, -1.2, -0.2]];
    const alc = traveller(root, alcPts, { n: 22, r: 0.07, speed: 0.55, cols: [[0, C.eth], [uAt(alcPts, [-0.6, 0.9, -0.1]), C.ald], [uAt(alcPts, [1.0, 0.9, 0]), C.ace]] });
    const rbcShape = new THREE.TorusGeometry(0.1, 0.06, 8, 16);
    const rbc = traveller(root, [[-5.6, -1.3, 0.2], [-3.3, -1.3, 0.2]], { n: 6, speed: 0.6, cols: [[0, 0xa3242e]], shape: rbcShape, spread: 0.2 });
    const bilOk = [[-3.1, -1.3, 0.25], [-1.6, -1.3, 0.25], [-1.1, -0.2, 0.3], [-0.2, 0.3, 0.35], [0.9, 1.3, 0.35], [1.7, 1.75, 0.3], [2.6, 2.3, 0.3], [4.0, 2.4, 0.3], [5.4, 1.95, 0.3]];
    const bilBad = [[-3.1, -1.3, 0.25], [-1.6, -1.3, 0.25], [-1.1, -0.2, 0.3], [-0.2, 0.3, 0.35], [0.8, -0.5, 0.3], [1.5, -1.3, 0.25], [3.6, -1.3, 0.25], [4.2, 0.1, 0.4]];
    const bil = traveller(root, bilOk, { n: 22, r: 0.065, speed: 0.6, cols: [[0, C.bil], [uAt(bilOk, [-0.2, 0.3, 0.35]), C.cbil]] });
    const bilB = traveller(root, bilBad, { n: 22, r: 0.065, speed: 0.6, cols: [[0, C.bil], [uAt(bilBad, [-0.2, 0.3, 0.35]), C.cbil]] });
    // Waiting alcohol molecules in the blood: the queue the liver hasn't reached yet.
    const nQ = 60, queue = new THREE.InstancedMesh(new THREE.SphereGeometry(0.065, 8, 6), M.glow(C.eth), nQ); queue.instanceMatrix.setUsage(THREE.DynamicDrawUsage); root.add(queue);
    const qj = Array.from({ length: nQ }, (_, i) => [Math.sin(i * 12.9) * 0.5 + 0.5, Math.sin(i * 7.3), Math.sin(i * 3.1)]);
    // Stations (enzymes and machines), each a glowing bead with a label.
    const stationMat = (c) => M.glow(c);
    const bead = (p, c) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), stationMat(c)); m.position.set(...p); root.add(m); return m; };
    const cycle = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.05, 10, 48), M.glow(0xffb547)); cycle.position.set(0.9, 0.9, 0.25); root.add(cycle);
    const cycleMarks = [0, 1, 2, 3].map((i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), M.glow(0xffffff)); cycle.add(m); m.position.set(0.45 * Math.cos(i * Math.PI / 2), 0.45 * Math.sin(i * Math.PI / 2), 0); return m; });
    const adh = bead([-0.6, 0.9, -0.1], 0x9fd8ff), aldh = bead([1.0, 0.9, 0], 0x9be58a), ugt = bead([-0.2, 0.3, 0.35], 0xffd84a);
    const L = (t, p, c) => tint(stage.label(t, p, root), c);
    const labels = {
      common: [L('Liver cell', [1.9, 2.15, 0.5], ''), L('Blood', [-4.9, -0.7, 0.2], 'red')],
      ammonia: [L('Ammonia from the gut', [-4.3, -1.95, 0.2], 'purple'), L('Urea cycle (in a mitochondrion)', [0.9, 1.7, 0.3], 'gold'), L('Urea to the kidneys', [3.4, -0.75, 0.2], 'cream'), L('Kidney', [5.9, -1.6, 0], ''), L('Urine', [5.9, -3.2, 0], '')],
      alcohol: [L('Alcohol waiting in the blood', [-3.6, -1.95, 0.2], 'blue'), L('Alcohol dehydrogenase', [-1.0, 1.55, -0.1], 'blue'), L('Acetaldehyde (toxic)', [0.2, 0.25, 0.1], 'gold'), L('Aldehyde dehydrogenase → acetate', [1.4, 1.65, 0], 'green')],
      redcells: [L('Old red cells', [-4.9, -1.95, 0.2], 'red'), L('Macrophage breaks them up', [-3.2, -0.65, 0.2], 'gold'), L('Bilirubin packaged for bile', [-0.4, -0.25, 0.4], 'gold'), L('Bile to the gut', [4.2, 2.95, 0.3], 'green'), L('Eye', [4.4, 1.3, 0.5], '')],
    };
    const st = { curve: [], t: 0, peak: 0, drinks: 2, trick: 'none', clear: 1 };
    const chart = board(1000, 380, 6.4, (g, w, h) => drawAlc(g, w, h, st));
    chart.position.set(0.3, -3.05, 0.6); root.add(chart);
    let acc = 1, key = '', yellow = 0;
    const fit = fitNarrow(stage, { pos: [0.3, 6.2, 14], target: [0.3, 5.5, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt);
        const job = s.job;
        const k = `${s.drinks}|${s.rate}`;
        if (k !== key) { key = k; st.curve = alcoholCurve({ drinks: s.drinks, rate: s.rate, hours: 10 }); st.peak = Math.max(...st.curve.map((p) => p.g)); st.clear = Math.max(1, hoursToClear(s.drinks, s.rate)); acc = 1; }
        if (s.play && job === 'alcohol') s.t = (s.t + dt * 0.5) % 10;
        st.t = s.t; st.drinks = s.drinks; st.trick = s.trick;
        const left = st.curve[Math.min(st.curve.length - 1, Math.round(s.t * 20))].g;
        amm.mesh.visible = job === 'ammonia'; kid.visible = job === 'ammonia'; cycle.visible = job === 'ammonia';
        alc.mesh.visible = queue.visible = adh.visible = aldh.visible = chart.visible = job === 'alcohol';
        rbc.mesh.visible = spleen.visible = ugt.visible = eye.visible = bileDuct.visible = job === 'redcells';
        bil.mesh.visible = job === 'redcells' && !s.blocked; bilB.mesh.visible = job === 'redcells' && s.blocked;
        const run = s.play ? dt : 0;
        if (job === 'ammonia') { amm.step(run); cycle.rotation.z -= run * 1.6; }
        if (job === 'alcohol') {
          // The conveyor runs at the liver's pace, not faster when more is waiting.
          alc.speed = 0.55 * (s.rate / 8); alc.count = left > 0.2 ? 22 : 0; alc.step(dt);
          const n = Math.min(nQ, Math.round(left / 1.2)); const o = new THREE.Object3D();
          for (let i = 0; i < nQ; i++) { o.position.set(-5.2 + qj[i][0] * 3.6 + Math.sin(performance.now() / 700 + i) * 0.05, -1.3 + qj[i][1] * 0.28, qj[i][2] * 0.28); o.scale.setScalar(i < n ? 1 : 0); o.updateMatrix(); queue.setMatrixAt(i, o.matrix); }
          queue.instanceMatrix.needsUpdate = true;
          acc += dt; if (acc > 1 / 12) { acc = 0; chart.redraw(); }
        }
        if (job === 'redcells') {
          rbc.step(run); (s.blocked ? bilB : bil).step(run);
          yellow += ((s.blocked ? 1 : 0) - yellow) * Math.min(1, dt * 0.6);
          scleraMat.color.setRGB(1, 1, 1).lerp(new THREE.Color(0xf0cc30), yellow);
        }
        const narrow = fit();
        Object.entries(labels).forEach(([j, ls]) => ls.forEach((l) => { l.visible = !narrow && (j === 'common' || j === job); }));
      },
      readout: (s) => {
        if (s.job === 'alcohol') {
          const left = st.curve[Math.min(st.curve.length - 1, Math.round(s.t * 20))]?.g ?? 0;
          return `<div class="big">${left.toFixed(0)} g of alcohol left</div>
            <div class="row"><span>After ${s.drinks} drink${s.drinks > 1 ? 's' : ''} (${s.drinks * DRINK_G} g)</span><b>about ${st.clear.toFixed(1)} h to clear</b></div>
            <div class="row"><span>${TRICKS[s.trick]}</span><b>${s.trick === 'none' ? 'the liver sets the pace' : 'no change at all'}</b></div>
            <small>Rates of about 7–10 g an hour are typical for adults but vary a lot. Alcohol harms the liver; the WHO says no amount is risk-free.</small>`;
        }
        if (s.job === 'redcells') return `<div class="big">${s.blocked ? 'Jaundice: bilirubin backs up' : 'Old red cells → bilirubin → bile'}</div>
          <div class="row"><span>A red cell lives</span><b>about 120 days</b></div>
          <div class="row"><span>Bilirubin made</span><b>about 250–400 mg a day</b></div>
          <small>${s.blocked ? 'With the bile duct blocked, bilirubin spills back into the blood and tints skin and eyes. Jaundice always needs a doctor.' : 'Bilirubin leaves in bile and gives stool its brown colour.'}</small>`;
        return `<div class="big">Ammonia → urea</div>
          <div class="row"><span>Ammonia comes from</span><b>breaking down protein</b></div>
          <div class="row"><span>Urea passed in urine</span><b>roughly 25–40 g a day</b></div>
          <small>Ammonia is toxic to the brain. The urea cycle turns two nitrogen atoms at a time into one harmless urea molecule.</small>`;
      },
    });
  },
};
