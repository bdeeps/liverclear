// Chapter 3: the sugar bank, and the liver's factory. A day of meals drives blood sugar; insulin and
// glucagon tell the liver to store glucose as glycogen or release it. The model is simulateDay() in
// model.js (sources there: Guyton & Hall ch. 69, 79; ADA; Rothman 1991; Taylor 1996; DeFronzo 2009).
// Proteins: the liver makes nearly all the albumin, about 10–15 g a day (StatPearls "Physiology,
// Albumin", NBK459198), and most clotting factors (fibrinogen, prothrombin, V, VII, IX, X, XI;
// Kujovich, "Coagulopathy in liver disease", PMC6136435). It also makes much of the body's cholesterol.
import { THREE } from '../kit.js';
import { board, BOARD_BG, tint, fitNarrow, compactReadout, V } from '../liver.js';
import { makeCell, traveller } from '../micro.js';
import { simulateDay, MEALS, GLY_MAX } from '../model.js';

const MODES = { both: 'Both (healthy)', insulin: 'Insulin only', glucagon: 'Glucagon only' };
const hhmm = (h) => { h = ((h % 24) + 24) % 24; const H = Math.floor(h), m = Math.floor((h - H) * 60); return `${String(H).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };

function drawChart(g, w, h, st) {
  g.clearRect(0, 0, w, h); g.fillStyle = BOARD_BG; g.fillRect(0, 0, w, h);
  const d = st.day; if (!d) return;
  const L = 70, R = w - 70, top = 58, bot = h - 70, bgMax = 300;
  const X = (m) => L + (m / 1440) * (R - L), Y = (v) => bot - (Math.min(v, bgMax) / bgMax) * (bot - top), Yg = (v) => bot - (v / 120) * (bot - top);
  // Healthy range band: 70–140 mg/dL (fasting below 100, after meals below 140 [ADA]).
  g.fillStyle = 'rgba(92,225,169,.10)'; g.fillRect(L, Y(140), R - L, Y(70) - Y(140));
  g.font = '21px sans-serif'; g.fillStyle = 'rgba(92,225,169,.8)'; g.fillText('healthy range', L + 6, Y(140) + 18);
  g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '21px sans-serif';
  for (let v = 0; v <= bgMax; v += 50) { g.strokeStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(R, Y(v)); g.stroke(); g.fillText(v, 14, Y(v) + 7); }
  for (let v = 0; v <= 120; v += 40) g.fillText(v + ' g', R + 10, Yg(v) + 5);
  for (let hr = 0; hr <= 24; hr += 3) g.fillText(hr + 'h', X(hr * 60) - 10, bot + 22);
  // Meals.
  MEALS.forEach((ml) => { g.strokeStyle = 'rgba(255,209,102,.5)'; g.setLineDash([5, 6]); g.beginPath(); g.moveTo(X(ml.t), top); g.lineTo(X(ml.t), bot); g.stroke(); g.setLineDash([]); g.fillStyle = '#ffd166'; g.font = 'bold 20px sans-serif'; g.fillText('▼ ' + ml.name, X(ml.t) + 4, top + 14); });
  // Insulin and glucagon as thin strips under the axis.
  const sy = bot + 34;
  g.font = '18px sans-serif'; g.fillStyle = '#8fb0ff'; g.fillText('insulin', 6, sy + 8); g.fillStyle = '#ffb547'; g.fillText('glucagon', 6, sy + 26);
  for (let i = 0; i < d.length; i += 6) { const x = X(d[i].m); g.fillStyle = `rgba(143,176,255,${Math.min(1, d[i].I / 1.6)})`; g.fillRect(x, sy, 3, 12); g.fillStyle = `rgba(255,181,71,${Math.min(1, d[i].Gn / 1.1)})`; g.fillRect(x, sy + 16, 3, 12); }
  // Glycogen (right axis) and blood sugar (left axis).
  g.strokeStyle = '#ffe9f0'; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); d.forEach((p, i) => (i ? g.lineTo(X(p.m), Yg(p.gly)) : g.moveTo(X(p.m), Yg(p.gly)))); g.stroke(); g.setLineDash([]);
  g.strokeStyle = '#ff7a59'; g.lineWidth = 4; g.beginPath(); d.forEach((p, i) => (i ? g.lineTo(X(p.m), Y(p.bg)) : g.moveTo(X(p.m), Y(p.bg)))); g.stroke();
  // Cursor.
  const m = st.m, p = d[Math.min(1439, Math.max(0, Math.round(m)))];
  g.strokeStyle = '#8ef0ff'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(m), top - 6); g.lineTo(X(m), bot); g.stroke();
  g.fillStyle = '#ff7a59'; g.beginPath(); g.arc(X(m), Y(p.bg), 8, 0, 7); g.fill();
  g.fillStyle = '#ffe9f0'; g.beginPath(); g.arc(X(m), Yg(p.gly), 7, 0, 7); g.fill();
  g.font = 'bold 27px sans-serif'; g.fillStyle = '#ff7a59'; g.fillText('Blood sugar (mg/dL)', L, 32);
  g.fillStyle = '#ffe9f0'; g.fillText('- - Liver glycogen (g)', L + 320, 32);
  g.fillStyle = '#8ef0ff'; g.fillText(hhmm(m / 60), Math.min(R - 60, X(m) + 8), top + 36);
}

export default {
  id: 'metabolism',
  short: 'The sugar bank',
  title: 'The sugar bank (and a factory)',
  subtitle: 'Store sugar after meals, pay it back between them, and build what blood needs.',
  view: { pos: [-0.8, 4.2, 9.6], target: [-0.8, 3.1, 0] },
  learn: `<p>Your brain burns sugar (<b>glucose</b>) all day and all night, but you only eat a few times a day. The liver bridges the gap like a <b>bank</b>.</p>
    <p>After a meal, glucose floods in through the portal vein. The <b>pancreas</b> (see <a href="/pancreasclear/">PancreasClear</a>) releases the hormone <b>insulin</b>, and the liver takes glucose in and links thousands of them into big branching molecules called <b>glycogen</b>, stored as granules inside its cells. A full liver holds about <b>100 g</b> of glycogen. On an ordinary day the store swings roughly between half and three-quarters full.</p>
    <p>Between meals and overnight, blood sugar starts to dip. The pancreas switches to <b>glucagon</b>, and the liver breaks glycogen back down and releases glucose. It can also make brand-new glucose from bits of protein and fat, called <b>gluconeogenesis</b>. That is why your blood sugar stays around <b>70 to 140 mg/dL</b> all day, even while you sleep. How your body turns food into energy is in <a href="/energyclear/">EnergyClear</a>.</p>
    <p>The liver is a <b>factory</b> too. It makes <b>albumin</b>, the most common protein in your blood (about 10 to 15 g a day), which holds water in your blood vessels and carries things around. It makes most of the <b>clotting factors</b> that stop you bleeding, and much of your <b>cholesterol</b>, which every cell needs for its walls.</p>
    <p class="tip"><b>Try it:</b> press play and watch the glycogen granules grow after each meal and shrink overnight. Then switch the hormone signals to “insulin only” or “glucagon only” and see blood sugar fall too low or climb too high.</p>`,
  terms: [
    { t: 'Glucose', d: 'The simple sugar your cells burn for energy. Blood carries it everywhere.' },
    { t: 'Glycogen', d: 'A big branching molecule made of many glucose units: the liver’s and muscles’ sugar store.' },
    { t: 'Insulin', d: 'A hormone from the pancreas, released when blood sugar is high. It tells the liver and muscles to take glucose in.' },
    { t: 'Glucagon', d: 'A hormone from the pancreas, released when blood sugar is low. It tells the liver to release glucose.' },
    { t: 'Gluconeogenesis', d: 'Making new glucose from non-sugar building blocks, such as parts of proteins and fats.' },
    { t: 'Albumin', d: 'The most common protein in blood plasma, made by the liver. It holds water in the blood and carries hormones and drugs.' },
  ],
  defaults: { hour: 7.5, play: true, mode: 'both', carbs: 70 },
  controls: [
    { key: 'hour', type: 'range', label: 'Time of day', min: 0, max: 23.99, step: 0.01, fmt: (v) => hhmm(v) },
    { key: 'play', type: 'toggle', label: 'Play the day' },
    { key: 'mode', type: 'seg', label: 'Hormone signals', options: Object.entries(MODES).map(([v, label]) => ({ v, label })), fmt: () => '' },
    { key: 'carbs', type: 'range', label: 'Carbohydrate in each meal', min: 30, max: 120, step: 5, ends: ['light', 'heavy'], fmt: (v) => Math.round(v) + ' g', hint: 'A plate of rice and dal is roughly 60–80 g.' },
  ],
  quiz: [
    { q: 'After a meal, what does the liver do with extra glucose?', options: ['Throws it away', 'Stores it as glycogen', 'Turns it into bile', 'Sends it to the lungs'], answer: 1, why: 'Insulin tells liver cells to link glucose into glycogen and store it for later.' },
    { q: 'Why doesn’t your blood sugar crash at night while you sleep?', options: ['The brain stops using sugar', 'The liver releases stored glucose and makes new glucose', 'The stomach keeps digesting all night', 'Muscles give sugar back'], answer: 1, why: 'Glucagon tells the liver to break down glycogen and make new glucose, keeping blood sugar steady.' },
    { q: 'Which of these does the liver make?', options: ['Insulin', 'Red blood cells in adults', 'Albumin and clotting factors', 'Stomach acid'], answer: 2, why: 'The liver builds most blood proteins, including albumin and clotting factors. Insulin comes from the pancreas.' },
  ],
  reel: [
    { ms: 6000, caption: 'The liver is your sugar bank: it stores glucose after meals and pays it back between them.', set: { mode: 'both', carbs: 75, play: false }, anim: { hour: [6.5, 11] }, view: { pos: [-0.3, 5.4, 11.6], target: [-0.3, 3.3, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.set(0, 3.2, 0); stage.root.add(root);
    const cell = makeCell(stage, { neighbour: false });
    cell.root.position.set(1.3, 1.25, 0); cell.root.scale.setScalar(0.8); root.add(cell.root);
    // Glucose in the sinusoid, and glucose crossing into or out of the cell.
    const sinY = -cell.H / 2 - 0.55;
    const flowG = traveller(cell.root, [[-3, sinY, 0.3], [3, sinY, 0.3]], { n: 30, r: 0.07, speed: 0.8, cols: [[0, 0xffffff]], spread: 0.8 });
    const cross = traveller(cell.root, [[-0.9, sinY + 0.1, 0.6], [-0.9, -0.2, 0.6], [-1.0, 0.3, 0.3]], { n: 14, r: 0.075, speed: 0.6, cols: [[0, 0xffffff]], spread: 0.35 });
    const cross2 = traveller(cell.root, [[0.9, sinY + 0.1, -0.5], [0.9, -0.2, -0.5], [0.9, 0.3, -0.2]], { n: 10, r: 0.075, speed: 0.6, cols: [[0, 0xffffff]], spread: 0.35 });
    // Albumin (yellow) and clotting factors (cyan) leaving towards the blood, cholesterol (cream).
    const alb = traveller(cell.root, [[-0.9, 0.2, -0.3], [-0.4, -0.6, -0.5], [0.2, sinY + 0.15, -0.6], [3, sinY, -0.6]], { n: 12, r: 0.06, speed: 0.5, cols: [[0, 0xffd166]] });
    const clot = traveller(cell.root, [[-0.7, 0.4, 0.2], [0, -0.7, 0.1], [0.5, sinY + 0.15, 0.1], [3, sinY + 0.1, 0.1]], { n: 7, r: 0.055, speed: 0.45, cols: [[0, 0x8ef0ff]] });
    const chol = traveller(cell.root, [[1.0, -0.4, 0.4], [1.2, -0.9, 0.6], [1.4, sinY + 0.15, 0.7], [3, sinY + 0.05, 0.7]], { n: 6, r: 0.05, speed: 0.4, cols: [[0, 0xf3dfb4]] });
    const lbls = [
      tint(stage.label('Glycogen granules', [-1.0, 1.35, 0.9], cell.root), ''),
      tint(stage.label('Glucose in the blood', [2.2, sinY - 0.5, 0.4], cell.root), ''),
      tint(stage.label('Albumin and clotting factors out', [2.2, sinY + 0.55, -0.6], cell.root), 'gold'),
    ];
    const dir = tint(stage.label('', [0, 1.5, 1.2], cell.root), 'side');
    const st = { day: null, m: 0, key: '' };
    const chart = board(1100, 440, 7.4, (g, w, h) => drawChart(g, w, h, st));
    chart.position.set(-0.2, -1.95, 0.6); root.add(chart);
    let acc = 1, key = '';
    const fit = fitNarrow(stage, { pos: [0.3, 4.7, 12.2], target: [0.3, 3.95, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt);
        const k = `${s.mode}|${s.carbs}`;
        if (k !== key) { key = k; st.day = simulateDay({ carbs: s.carbs, mode: s.mode }); acc = 1; }
        if (s.play) s.hour = (s.hour + dt * 0.5) % 24;          // one hour every two seconds
        st.m = Math.min(1439, s.hour * 60);
        const p = st.day[Math.round(st.m)];
        cell.setGlycogen(p.gly / GLY_MAX);
        // Glucose crossing the cell wall: in when the liver is storing, out when releasing. Speed scales with the rate.
        const r = p.liver;                                   // g/min, + = releasing
        const v = Math.sign(-r) * Math.min(1.4, 0.25 + Math.abs(r) * 5);
        cross.speed = v; cross2.speed = v;
        cross.count = cross2.count = Math.abs(r) < 0.01 ? 0 : Math.min(14, 3 + Math.round(Math.abs(r) * 60));
        cross.step(dt); cross2.step(dt);
        flowG.count = Math.min(30, Math.round(p.bg / 7)); flowG.step(dt);
        alb.step(dt); clot.step(dt); chol.step(dt);
        cell.step(dt);
        dir.element.innerHTML = r < -0.01 ? '<b>Storing: glucose → glycogen</b>' : r > 0.01 ? '<b>Releasing: glycogen → glucose</b>' : '<b>Holding steady</b>';
        acc += dt; if (acc > 1 / 12) { acc = 0; chart.redraw(); }
        const narrow = fit();
        lbls.forEach((l) => { l.visible = !narrow; });
      },
      readout: (s) => {
        const p = st.day?.[Math.round(st.m)]; if (!p) return '';
        const rate = p.liver * 60;
        const bgTxt = p.bg < 70 ? ' · too low' : p.bg > 180 ? ' · too high' : '';
        return `<div class="big">${hhmm(s.hour)} · ${Math.round(p.bg)} mg/dL${bgTxt}</div>
          <div class="row"><span>Blood sugar</span><b>${Math.round(p.bg)} mg/dL (${(p.bg / 18).toFixed(1)} mmol/L)</b></div>
          <div class="row"><span>Liver glycogen</span><b>${Math.round(p.gly)} g of about 100</b></div>
          <div class="row"><span>The liver is</span><b>${rate < -0.3 ? `storing ${Math.abs(rate).toFixed(0)} g/h` : rate > 0.3 ? `releasing ${rate.toFixed(0)} g/h` : 'holding steady'}</b></div>
          <small>${s.mode === 'both' ? 'Insulin after meals, glucagon between them: blood sugar stays in the healthy band.' : s.mode === 'insulin' ? 'With no glucagon, the liver keeps its sugar locked away and blood sugar sinks too low between meals.' : 'With no insulin, the liver never stores and never stops releasing: blood sugar climbs far too high, as in untreated diabetes.'}</small>`;
      },
    });
  },
};
