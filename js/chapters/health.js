// Chapter 6: keeping it healthy, and what goes wrong. General facts only; this is not medical advice.
// Sources:
//  - Regrowth: Guyton & Hall ch. 71 (up to about 70% can be removed and the rest regrows; rats in
//    5–7 days); living donors give 25–65% of their liver and it regrows to about full size in
//    8–12 weeks (UPMC "Living-donor liver transplant"; Johns Hopkins Medicine "What to expect").
//    The remaining lobes enlarge; the removed lobe itself does not grow back in its old shape
//    (Michalopoulos, Am J Pathol 176:2, 2010). Model: regrow() in model.js.
//  - Fatty liver (MASLD, formerly NAFLD): about 30% of adults worldwide, rising over time (Younossi et
//    al., Hepatology 77:1335, 2023); about 38.6% of adults in India in a 2022 meta-analysis (Shalimar
//    et al., J Clin Exp Hepatol 12:818, 2022).
//  - Hepatitis B and C (WHO fact sheets, 28 July 2026, figures for 2024): about 240 million people live
//    with chronic hepatitis B (about 1.1 million deaths a year); the vaccine gives nearly 100%
//    protection. About 47 million live with chronic hepatitis C (about 239,000 deaths); medicines cure
//    more than 95%; there is no vaccine.
//  - Cirrhosis: long-term damage replaces liver tissue with scar and lumpy regenerating nodules; early
//    stages (fat, inflammation, some fibrosis) can often improve if the cause is removed (NIDDK
//    "Cirrhosis"; NHS "Cirrhosis"; AASLD practice guidance on MASLD, 2023).
import { THREE, M, lerp, clamp, smooth } from '../kit.js';
import { makeLiver, board, BOARD_BG, sideLabels, tint, fitNarrow, compactReadout, V } from '../liver.js';
import { regrow } from '../model.js';

const STAGES = [
  { at: 0, name: 'Healthy liver', note: 'Smooth, soft and reddish-brown.' },
  { at: 0.25, name: 'Fatty liver', note: 'Fat builds up inside liver cells. Very common, often silent, and it can often improve.' },
  { at: 0.5, name: 'Inflamed (hepatitis)', note: 'Swollen, irritated liver cells. Still often able to recover if the cause stops.' },
  { at: 0.75, name: 'Scarring (fibrosis)', note: 'Scar tissue starts to replace healthy tissue.' },
  { at: 0.9, name: 'Cirrhosis', note: 'Hard, lumpy and shrunken. The scarring is largely permanent.' },
];
const CAUSES = { fat: 'Too much fat (MASLD)', alcohol: 'Alcohol over years', virus: 'Hepatitis B or C virus' };
const stageOf = (k) => STAGES.reduce((a, s) => (k >= s.at - 0.001 ? s : a), STAGES[0]);

function drawRegrow(g, w, h, st) {
  g.clearRect(0, 0, w, h); g.fillStyle = BOARD_BG; g.fillRect(0, 0, w, h);
  const L = 80, R = w - 30, top = 60, bot = h - 50, W = 12;
  const X = (wk) => L + (wk / W) * (R - L), Y = (v) => bot - (v / 100) * (bot - top);
  g.font = '21px sans-serif'; g.fillStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1;
  for (let v = 0; v <= 100; v += 25) { g.strokeStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(R, Y(v)); g.stroke(); g.fillText(v + '%', 12, Y(v) + 7); }
  for (let wk = 0; wk <= W; wk += 2) g.fillText(wk + ' wk', X(wk) - 18, bot + 30);
  g.fillStyle = 'rgba(92,225,169,.12)'; g.fillRect(X(8), top, X(12) - X(8), bot - top);
  g.fillStyle = 'rgba(92,225,169,.85)'; g.fillText('about full size', X(8) + 8, top + 24);
  g.strokeStyle = '#ff7a59'; g.lineWidth = 4; g.beginPath();
  for (let i = 0; i <= 120; i++) { const wk = (i / 120) * W, v = regrow(st.m0, wk) * 100; i ? g.lineTo(X(wk), Y(v)) : g.moveTo(X(wk), Y(v)); }
  g.stroke();
  const v = regrow(st.m0, st.wk) * 100;
  g.strokeStyle = '#8ef0ff'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(st.wk), top); g.lineTo(X(st.wk), bot); g.stroke();
  g.fillStyle = '#ff7a59'; g.beginPath(); g.arc(X(st.wk), Y(v), 9, 0, 7); g.fill();
  g.font = 'bold 27px sans-serif'; g.fillStyle = '#e8eef8'; g.fillText('Liver size, % of the original', L, 36);
}

export default {
  id: 'health',
  short: 'Keeping it healthy',
  title: 'Regrowing, and what goes wrong',
  subtitle: 'The organ that grows back, and the slow damage it can’t always undo.',
  view: { pos: [-1.0, 4.6, 9.2], target: [-1.25, 3.3, 0] },
  learn: `<p>The liver has a superpower: it can <b>grow back</b>. Up to about <b>70%</b> of it can be removed, and the rest grows until the liver is roughly its old size again, in about <b>two to three months</b> in people. The leftover lobes swell up; the missing piece doesn't regrow in its old shape. In the Greek myth, an eagle ate the liver of <b>Prometheus</b> every day and it grew back every night. That is why a healthy adult can give part of their liver to someone else, a <b>living-donor transplant</b>, and both livers grow.</p>
    <p>But the liver can be hurt slowly, often with no signs for years. In <b>fatty liver disease</b> (now called <b>MASLD</b>), fat builds up inside liver cells. It is very common: about <b>3 in 10 adults</b> worldwide, and studies in India put it near <b>4 in 10</b>. Being active and eating well are linked with a healthier liver, and early fatty liver can often improve.</p>
    <p><b>Hepatitis</b> means an inflamed liver. The viruses <b>hepatitis B</b> and <b>C</b> spread through blood and, for B, from mother to baby and through sex. The WHO estimates about <b>240 million</b> people live with hepatitis B and <b>47 million</b> with hepatitis C. A <b>vaccine</b> protects against hepatitis B (it is part of India's childhood vaccine schedule), and medicines now cure more than 95% of hepatitis C.</p>
    <p>Years of damage from fat, heavy drinking or viruses can lead to <b>scarring</b> and finally <b>cirrhosis</b>: a hard, lumpy liver that can no longer do its jobs well. Only a doctor can tell how a liver is doing, with blood tests and scans, so if you are ever worried, talk to one.</p>
    <p class="tip"><b>Try it:</b> remove part of the liver and run the weeks forward. Then switch to damage, pick a cause and slide the years along to see the liver change.</p>`,
  terms: [
    { t: 'Regeneration', d: 'Regrowing lost tissue. The liver can regain its size after much of it is removed.' },
    { t: 'Living-donor transplant', d: 'An operation where a healthy person gives part of their liver to a patient; both parts grow.' },
    { t: 'MASLD', d: 'Metabolic dysfunction-associated steatotic liver disease: the new name for non-alcoholic fatty liver disease.' },
    { t: 'Hepatitis', d: 'Inflammation of the liver, often caused by viruses (A, B, C, D, E), alcohol or fat.' },
    { t: 'Fibrosis', d: 'Scar tissue building up in the liver after long-term damage.' },
    { t: 'Cirrhosis', d: 'Severe, lasting scarring that makes the liver hard and lumpy and stops it working well.' },
  ],
  defaults: { show: 'regrow', removed: 0.6, weeks: 0, play: true, cause: 'fat', years: 0.3 },
  controls: [
    { key: 'show', type: 'seg', label: 'Show', options: [{ v: 'regrow', label: 'Regrowing' }, { v: 'damage', label: 'Slow damage' }], fmt: () => '' },
    { key: 'removed', type: 'range', label: 'Regrowing: part removed', min: 0.3, max: 0.7, step: 0.01, fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'weeks', type: 'range', label: 'Regrowing: weeks since', min: 0, max: 12, step: 0.05, fmt: (v) => v.toFixed(1) + ' weeks' },
    { key: 'play', type: 'toggle', label: 'Regrowing: run the weeks' },
    { key: 'cause', type: 'seg', label: 'Damage: cause', options: Object.entries(CAUSES).map(([v, label]) => ({ v, label })), fmt: () => '' },
    { key: 'years', type: 'range', label: 'Damage: years of harm', min: 0, max: 1, step: 0.01, ends: ['none', 'many'], fmt: (v) => stageOf(v).name },
  ],
  quiz: [
    { q: 'About how much of a liver can be removed and still grow back?', options: ['Only 5%', 'Up to about 70%', 'All of it', 'None: it can’t regrow'], answer: 1, why: 'The remaining liver enlarges until it is close to its old size, in about two to three months in people.' },
    { q: 'Which liver virus can a vaccine protect you from?', options: ['Hepatitis B', 'Hepatitis C', 'Neither', 'The common cold'], answer: 0, why: 'The hepatitis B vaccine gives nearly complete protection. There is no vaccine for hepatitis C, though medicines now cure most cases.' },
    { q: 'Which is true about fatty liver?', options: ['It is rare', 'It is common, often silent, and early stages can often improve', 'It only affects older people who drink', 'It always hurts'], answer: 1, why: 'About 3 in 10 adults worldwide have it, usually without symptoms. A doctor can check with blood tests and scans.' },
  ],
  reel: [
    { ms: 5600, caption: 'Remove over half a liver and the rest grows back to about full size in two to three months.', set: { show: 'regrow', removed: 0.6, play: false }, anim: { weeks: [0, 10] }, view: { pos: [0.2, 4.6, 9.2], target: [0.1, 3.4, 0] }, spin: 0.3 },
    { ms: 5600, caption: 'Years of fat, alcohol or hepatitis can scar it into cirrhosis. If you are ever worried, see a doctor.', set: { show: 'damage', cause: 'fat' }, anim: { years: [0, 1] }, view: { pos: [0.2, 4.6, 8.6], target: [0.1, 3.9, 0] }, spin: 0.4 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.set(0, 3.9, 0); stage.root.add(root);
    const liver = makeLiver(stage, { labels: false, flow: false, context: false });
    root.add(liver.root);
    liver.vessels.forEach((m) => { m.visible = false; });
    liver.flow.mesh.visible = false;
    const { right, left, caud, quad, gb } = liver.groups;
    // The removed part, as a ghost outline.
    const ghost = new THREE.Mesh(liver.lobes[0].geometry.clone(), new THREE.MeshBasicMaterial({ color: 0x8ef0ff, wireframe: true, transparent: true, opacity: 0.06 }));
    root.add(ghost);
    // Fat droplets on the surface and virus particles around.
    const nF = 90, fat = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffe6a0, roughness: 0.3 }), nF);
    const ray = new THREE.Raycaster(); root.updateMatrixWorld(true);
    const fatPts = [];
    for (let i = 0; fatPts.length < nF && i < 400; i++) {
      const x = lerp(-2.1, 1.7, Math.abs(Math.sin(i * 12.9898)) % 1), y = lerp(-1.3, 1.3, Math.abs(Math.sin(i * 78.233)) % 1);
      ray.set(V(x, y, 4).applyMatrix4(root.matrixWorld), V(0, 0, -1));
      const hit = ray.intersectObjects(liver.lobes, false)[0];
      if (hit) fatPts.push(root.worldToLocal(hit.point.clone()));
    }
    const o = new THREE.Object3D();
    root.add(fat);
    const nV = 26, virus = new THREE.Group(); root.add(virus);
    const vMat = new THREE.MeshStandardMaterial({ color: 0xb58cff, emissive: 0x2a1650, roughness: 0.4 });
    for (let i = 0; i < nV; i++) {
      const v = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 1), vMat);
      for (let j = 0; j < 12; j++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.07, 5), vMat); const d = V(Math.sin(j * 2.3) * Math.cos(j), Math.cos(j * 2.3), Math.sin(j * 2.3) * Math.sin(j)).normalize(); sp.position.copy(d).multiplyScalar(0.1); sp.quaternion.setFromUnitVectors(V(0, 1, 0), d); v.add(sp); }
      v.userData = { a: i * 2.39, r: 2.4 + (i % 5) * 0.3, y: -1.2 + (i % 7) * 0.4 };
      virus.add(v);
    }
    const st = { m0: 0.4, wk: 0 };
    const chart = board(1000, 360, 4.4, (g, w, h) => drawRegrow(g, w, h, st));
    chart.position.set(0.1, -2.55, 0.9); root.add(chart);
    const sides = sideLabels(stage, root, -1.9, 2.5, 1.0);
    const lbl = { gone: tint(stage.label('Removed part', [-1.9, -1.5, 0.8], root), 'side'), grow: tint(stage.label('What is left grows', [1.2, 1.35, 0.6], root), 'gold'), stage: tint(stage.label('', [0.2, 1.9, 0.5], root), 'gold') };
    const pivot = V(1.6, 0.4, 0);
    let acc = 1, t = 0;
    const fit = fitNarrow(stage, { pos: [0.1, 5.7, 11.5], target: [0.1, 4.4, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const regrowing = s.show === 'regrow';
        if (regrowing && s.play) s.weeks = (s.weeks + dt * 1.2) % 12.5;
        const m0 = 1 - s.removed, wk = Math.min(12, s.weeks);
        st.m0 = m0; st.wk = wk;
        // Regrowth: the remaining lobes enlarge (volume ∝ scale³), growing towards the empty space.
        const sc = regrowing ? Math.cbrt(regrow(m0, wk) / m0) : 1;
        const grow = regrowing ? Math.min(1.45, lerp(1, sc, 1)) : 1;
        right.visible = !regrowing; gb.visible = !regrowing; ghost.visible = regrowing;
        liver.lig.visible = liver.fin.visible = liver.teres.visible = false;
        [left, caud, quad].forEach((g) => { g.scale.setScalar(grow); g.position.copy(pivot).multiplyScalar(1 - grow); });
        chart.visible = regrowing;
        // Damage: fat first, then inflammation, then scar.
        const k = regrowing ? 0 : s.years;
        const fatK = s.cause === 'virus' ? 0.1 * smooth(k / 0.3) : smooth(k / 0.3) * (1 - 0.6 * smooth((k - 0.7) / 0.3));
        const inflame = smooth((k - (s.cause === 'virus' ? 0.1 : 0.35)) / 0.25) * (1 - smooth((k - 0.8) / 0.2));
        const scar = smooth((k - 0.62) / 0.35);
        liver.setCondition({ fat: fatK, scar, inflame });
        for (let i = 0; i < fatPts.length; i++) {
          const on = !regrowing && s.cause !== 'virus' && i / fatPts.length < fatK;
          const g = 1 + fatK * 0.14 - scar * 0.16;
          o.position.copy(fatPts[i]).multiplyScalar(g); o.scale.setScalar(on ? 0.05 + 0.05 * ((i * 7) % 5) / 5 : 0); o.updateMatrix(); fat.setMatrixAt(i, o.matrix);
        }
        fat.instanceMatrix.needsUpdate = true;
        virus.visible = !regrowing && s.cause === 'virus' && k > 0.05 && k < 0.95;
        virus.children.forEach((v) => { const u = v.userData; v.position.set(Math.cos(u.a + t * 0.3) * u.r * 0.9, u.y + Math.sin(t + u.a) * 0.1, Math.sin(u.a + t * 0.3) * u.r * 0.5); v.rotation.y = t + u.a; });
        if (regrowing) { acc += dt; if (acc > 1 / 12) { acc = 0; chart.redraw(); } }
        const narrow = fit();
        lbl.gone.visible = lbl.grow.visible = regrowing && !narrow;
        lbl.stage.visible = !regrowing; lbl.stage.element.innerHTML = `<b>${stageOf(s.years).name}</b>`;
        sides.forEach((l) => { l.visible = !narrow && !regrowing; });
      },
      readout: (s) => {
        if (s.show === 'regrow') {
          const m0 = 1 - s.removed, v = regrow(m0, Math.min(12, s.weeks));
          return `<div class="big">${Math.round(v * 100)}% of its old size</div>
            <div class="row"><span>Left after the operation</span><b>${Math.round(m0 * 100)}%</b></div>
            <div class="row"><span>Weeks since</span><b>${Math.min(12, s.weeks).toFixed(1)}</b></div>
            <small>People regain about full size in roughly 8–12 weeks. The leftover lobes swell; the lost lobe doesn’t reappear.</small>`;
        }
        const stg = stageOf(s.years);
        const fact = s.cause === 'fat' ? 'About 30% of adults worldwide; about 39% in one Indian study.' : s.cause === 'virus' ? 'Hep B: ~240 million, preventable by vaccine. Hep C: ~47 million, curable in over 95%.' : 'Heavy drinking over many years can cause fatty liver, hepatitis and cirrhosis.';
        return `<div class="big">${stg.name}</div>
          <div class="row"><span>Cause shown</span><b>${CAUSES[s.cause]}</b></div>
          <div class="row"><span>How common</span><b>${s.cause === 'fat' ? '~3 in 10 adults' : s.cause === 'virus' ? '~290 million people' : 'varies widely'}</b></div>
          <small>${stg.note} ${fact} Only a doctor can check a liver: if you are worried, see one.</small>`;
      },
    });
  },
};
