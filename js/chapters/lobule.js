// Chapter 2: the lobule. Zoom from the whole organ to one hexagonal lobule to one liver cell.
// Blood runs in from the portal triads at the corners towards the central vein; bile runs the other
// way, out to the bile ductules. Kupffer cells in the sinusoids catch bacteria from the gut.
// Sources: Guyton & Hall 14th ed., ch. 71 (lobules 0.8–2 mm across, 50,000–100,000 of them; Kupffer
// cells let "probably less than 1 percent" of portal bacteria through); Junqueira's Basic Histology
// ch. 16; StatPearls "Histology, Liver" (NBK554441). See micro.js.
import { THREE, M } from '../kit.js';
import { makeLiver, tint, fitNarrow, compactReadout, REF, V } from '../liver.js';
import { makeLobule, makeCell, HEX_R } from '../micro.js';

const LEVELS = ['organ', 'lobule', 'cell'];
const VIEWS = {
  organ: { pos: [-1.2, 5.6, 8.6], target: [-1.5, 3.9, 0] },
  lobule: { pos: [-2.4, 10.2, 7.6], target: [-1.9, 3.0, 0] },
  cell: { pos: [-2.2, 5.6, 7.6], target: [-1.9, 3.3, 0] },
};

export default {
  id: 'lobule',
  short: 'Tiny hexagons',
  title: 'Inside: 100,000 tiny hexagons',
  subtitle: 'Blood flows in to the middle, bile flows out to the corners.',
  view: VIEWS.lobule,
  learn: `<p>Zoom into the liver and it is built from tiny six-sided units called <b>lobules</b>, each about <b>1 to 2 mm</b> across. There are <b>50,000 to 100,000</b> of them, packed together like a honeycomb.</p>
    <p>At every corner of a lobule sits a <b>portal triad</b>: three little tubes side by side. A branch of the <b>portal vein</b> (purple, from the gut), a branch of the <b>hepatic artery</b> (red, with oxygen) and a <b>bile ductule</b> (green). In the middle runs the <b>central vein</b>.</p>
    <p>Liver cells, called <b>hepatocytes</b>, are stacked in thin walls, or <b>plates</b>, that fan out from the centre like the spokes of a wheel. Between the plates run leaky capillaries called <b>sinusoids</b>. Blood from the corners trickles <b>inwards</b> along them to the central vein, and every liver cell gets to take things out of it and put things back. Meanwhile the cells make <b>bile</b> and send it <b>outwards</b> in tiny channels between them, the <b>bile canaliculi</b>, to the ductules at the corners. Blood in, bile out: two streams going opposite ways and never mixing.</p>
    <p>Watch the yellow star-shaped cells in the sinusoids. They are <b>Kupffer cells</b>, the liver's own germ-eaters. Blood from the gut carries some bacteria, and Kupffer cells swallow almost all of them: fewer than 1 in 100 get through.</p>
    <p class="tip"><b>Try it:</b> step through the zoom levels. In the lobule, follow one dot from a corner to the middle as it turns from purple and red to blue. Then switch on the gut bacteria and count how many escape.</p>`,
  terms: [
    { t: 'Lobule', d: 'A tiny six-sided unit of the liver, about 1–2 mm across, with a central vein in the middle.' },
    { t: 'Portal triad', d: 'The trio at each corner of a lobule: a small portal vein, a small hepatic artery and a bile ductule.' },
    { t: 'Hepatocyte', d: 'The main liver cell. It does most of the liver’s work: storing, building and cleaning.' },
    { t: 'Sinusoid', d: 'A wide, leaky capillary between plates of liver cells, where blood flows towards the central vein.' },
    { t: 'Bile canaliculus', d: 'A tiny channel between two liver cells that carries bile outwards. Plural: canaliculi.' },
    { t: 'Kupffer cell', d: 'A macrophage that lives in the sinusoids and swallows bacteria and worn-out cells.' },
  ],
  defaults: { zoom: 'lobule', flow: true, bacteria: false, speed: 1 },
  controls: [
    { key: 'zoom', type: 'seg', label: 'Zoom', options: [{ v: 'organ', label: 'Liver' }, { v: 'lobule', label: 'Lobule' }, { v: 'cell', label: 'One cell' }], fmt: (v) => ({ organ: '≈ 20 cm', lobule: '≈ 1 mm', cell: '≈ 25 µm' }[v]) },
    { key: 'flow', type: 'toggle', label: 'Blood and bile flowing' },
    { key: 'bacteria', type: 'toggle', label: 'Gut bacteria arriving' },
    { key: 'speed', type: 'range', label: 'Speed', min: 0.2, max: 3, step: 0.01, fmt: (v) => v.toFixed(1) + '×' },
  ],
  quiz: [
    { q: 'In a lobule, which way does blood flow?', options: ['From the central vein out to the corners', 'From the corners in to the central vein', 'Round and round the edge', 'It doesn’t move'], answer: 1, why: 'Blood enters at the portal triads on the corners and trickles through the sinusoids into the central vein.' },
    { q: 'And bile?', options: ['The same way as blood', 'The opposite way: out to the bile ductules at the corners', 'Straight into the central vein', 'Into the sinusoids'], answer: 1, why: 'Bile flows outwards in canaliculi between the cells, the opposite way to the blood, and never mixes with it.' },
    { q: 'What do Kupffer cells do?', options: ['Make bile', 'Store sugar', 'Swallow bacteria and old cells in the blood', 'Pump blood'], answer: 2, why: 'They are macrophages in the sinusoids. They catch almost all the bacteria that arrive from the gut.' },
  ],
  reel: [
    { ms: 5000, caption: 'Zoom in: the liver is built from about 100,000 tiny hexagons called lobules.', set: { zoom: 'lobule', flow: true, bacteria: false, speed: 1 }, view: { pos: [-0.2, 9.5, 5.2], target: [0, 3.2, 0] }, spin: 0.6 },
    { ms: 5400, caption: 'Blood flows in to the middle, bile flows out to the corners, and germ-eating cells stand guard.', set: { zoom: 'lobule', flow: true, bacteria: true, speed: 1.2 }, view: { pos: [0.6, 6.6, 4.4], target: [0.3, 3.3, 0.3] }, spin: 0.3 },
  ],
  onChange(s, key) { if (key === 'zoom' && s._stage) s._stage.setView(VIEWS[s.zoom].pos, VIEWS[s.zoom].target, 1.0); },

  build({ stage, s }) {
    Object.defineProperty(s, '_stage', { value: stage, enumerable: false, configurable: true });
    const root = new THREE.Group(); root.position.set(0, 3.3, 0); stage.root.add(root);
    // ---- level 1: the organ with a magnifier on it
    const organ = new THREE.Group(); root.add(organ);
    const liver = makeLiver(stage, { labels: false, flow: false, context: false });
    liver.root.position.y = 0.5; organ.add(liver.root);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 10, 48), M.glow(0x8ef0ff)); ring.position.set(-1.1, 0.8, 1.12); organ.add(ring);
    const hexes = new THREE.Group(); organ.add(hexes); hexes.position.copy(ring.position).add(V(0, 0, 0.01));
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
      const x = i * 0.13 + (j % 2 ? 0.065 : 0), y = j * 0.113; if (x * x + y * y > 0.14) continue;
      const h = new THREE.Mesh(new THREE.CircleGeometry(0.07, 6), M.ghost(0xffd0b8, 0.35)); h.position.set(x, y, 0); hexes.add(h);
    }
    const organLbl = tint(stage.label('Each tiny hexagon is a lobule, 1–2 mm across', [-1.1, 1.4, 1.2], organ), 'side');
    // ---- level 2: the lobule
    const lob = makeLobule(stage); root.add(lob.root);
    const lobLbls = [
      tint(stage.label('Central vein (to the heart)', [0, lob.yTop + 1.3, 0], lob.root), 'blue'),
      tint(stage.label('Portal triad', [HEX_R + 0.35, lob.yTop + 0.5, 0], lob.root), 'purple'),
      tint(stage.label('Plates of liver cells', [-1.2, lob.yTop + 0.35, -1.5], lob.root), ''),
      tint(stage.label('Kupffer cell', [0, 0, 0], lob.kupG.children[2]), 'gold'),
      tint(stage.label('Next lobule', [HEX_R * 1.5, lob.yTop, HEX_R * 0.87 + 0.6], lob.root), ''),
    ];
    // ---- level 3: one liver cell
    const cellG = new THREE.Group(); root.add(cellG);
    const cell = makeCell(stage); cell.root.position.set(-0.4, 0.4, 0); cellG.add(cell.root);
    const cellLbls = [
      tint(stage.label('Nucleus', [-0.2, 0.8, 0.6], cell.root), ''),
      tint(stage.label('Mitochondria', [1.1, 0.9, 0.9], cell.root), 'gold'),
      tint(stage.label('Glycogen (stored sugar)', [-1.5, -0.8, 1.1], cell.root), ''),
      tint(stage.label('Bile canaliculus', [1.6, 1.2, 1.2], cell.root), 'green'),
      tint(stage.label('Sinusoid: blood flows past', [0, -1.9, 1.3], cell.root), 'red'),
      tint(stage.label('Rough ER: builds proteins', [-1.4, 0.5, -0.8], cell.root), 'blue'),
    ];
    const groups = { organ, lobule: lob.root, cell: cellG };
    const lbls = { organ: [organLbl], lobule: lobLbls, cell: cellLbls };
    const scale = { organ: 1, lobule: 1, cell: 1 };
    const fit = fitNarrow(stage, { pos: [0, 11.2, 7.2], target: [0, 4.3, -0.9] });
    return compactReadout(stage, {
      update(dt, st) {
        dt = Math.max(0, dt);
        // Zooming: the new level grows in from small, the old one swells past you and vanishes.
        const cur = LEVELS.indexOf(st.zoom);
        LEVELS.forEach((k, i) => {
          const target = i === cur ? 1 : i < cur ? 4 : 0.2;
          scale[k] += (target - scale[k]) * Math.min(1, dt * 5);
          const g = groups[k]; g.scale.setScalar(scale[k]); g.visible = (i === cur) || (scale[k] > 0.25 && scale[k] < 3.6);
        });
        const narrow = fit();
        LEVELS.forEach((k, i) => lbls[k].forEach((l) => { l.visible = i === cur && Math.abs(scale[k] - 1) < 0.1 && !(narrow && l !== lbls[k][0]); }));
        if (st.flow) lob.step(dt, st.speed, { bacteria: st.bacteria });
        lob.showBacteria(st.bacteria);
        cell.step(st.flow ? dt : 0, st.speed);
        ring.material.color.setHSL(0.5, 0.9, 0.55 + 0.15 * Math.sin(performance.now() / 300));
      },
      readout: (st) => {
        if (st.zoom === 'organ') return `<div class="big">${REF.lobules[0].toLocaleString('en-US')}–${REF.lobules[1].toLocaleString('en-US')} lobules</div>
          <div class="row"><span>Each one</span><b>${REF.lobuleSize[0]}–${REF.lobuleSize[1]} mm across</b></div>
          <div class="row"><span>Blood in the liver at any moment</span><b>about ${REF.bloodHeld} mL</b></div>
          <small>About a tenth of all your blood is inside your liver at any moment.</small>`;
        if (st.zoom === 'cell') return `<div class="big">One hepatocyte, about 25 µm</div>
          <div class="row"><span>Faces a sinusoid</span><b>takes in, gives back</b></div>
          <div class="row"><span>Faces its neighbour</span><b>sends out bile</b></div>
          <small>Liver cells make up about 80% of the liver’s volume. Each one stores, builds and cleans.</small>`;
        const tot = lob.caught + lob.passed;
        return `<div class="big">Blood in, bile out</div>
          <div class="row"><span>Blood (purple + red → blue)</span><b>corners → centre</b></div>
          <div class="row"><span>Bile (green)</span><b>centre → corners</b></div>
          ${st.bacteria ? `<div class="row"><span>Bacteria caught by Kupffer cells</span><b>${lob.caught} of ${tot}</b></div>` : ''}
          <small>${st.bacteria ? 'In a real liver fewer than 1 in 100 gut bacteria get past the Kupffer cells.' : 'Each lobule is about 1–2 mm across; you have 50,000–100,000.'}</small>`;
      },
    });
  },
};
