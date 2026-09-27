// Chapter 5: bile and fat. The liver makes bile all the time; between meals the gallbladder stores
// and concentrates it; after a (fatty) meal the gut hormone CCK squeezes the gallbladder and relaxes
// the sphincter of Oddi, and bile pours into the duodenum. Bile salts break fat into tiny droplets,
// multiplying the surface where the enzyme lipase can work.
// Sources:
//  - Bile made: about 600–1000 mL a day (StatPearls "Physiology, Bile Secretion" NBK470209 gives about
//    600 mL; Guyton & Hall ch. 71 and Johns Hopkins Pathology "Bile duct anatomy and physiology"
//    give 500–1000 mL). We say "about half a litre to a litre".
//  - Gallbladder: holds about 30–50 mL and concentrates bile about 5–10 times by absorbing water and
//    salts (Johns Hopkins Pathology; Guyton & Hall ch. 71).
//  - Emulsion: "the average diameter of the emulsified fat particles in the intestine is less than
//    1 micrometer, ... an increase of as much as 1000-fold in total surface areas" (Guyton & Hall ch. 66).
//    Splitting one drop into n equal drops keeps the volume and multiplies the surface by n^(1/3).
//  - Gallstones: hardened lumps, mostly of cholesterol, that form in the gallbladder; many cause no
//    symptoms, but one stuck in a duct can cause pain and needs a doctor (NIDDK "Gallstones").
import { THREE, M, clamp, lerp } from '../kit.js';
import { makeLiver, tint, fitNarrow, compactReadout, P, COL, V } from '../liver.js';
import { traveller } from '../micro.js';

const cat = (...segs) => segs.flatMap((s, i) => (i ? s.slice(1) : s));
const GB_C = [-0.7, -1.15, 0.1];                     // centre of the gallbladder (liver space)

export default {
  id: 'bile',
  short: 'Bile and fat',
  title: 'Bile: the liver’s washing-up liquid',
  subtitle: 'Made all day, stored in the gallbladder, poured on fat when you eat.',
  view: { pos: [0.5, 3.8, 8.8], target: [0.3, 4.25, 0] },
  learn: `<p>Your liver makes about <b>half a litre to a litre of bile</b> every day, a yellow-green liquid made of water, <b>bile salts</b>, cholesterol and the yellow pigment <b>bilirubin</b>. It trickles out through the bile ducts.</p>
    <p>Between meals, most of it backs up into the <b>gallbladder</b>, a little bag under the liver that holds about <b>30 to 50 mL</b>. There the bile is <b>concentrated</b> 5 to 10 times as water is pulled out of it, so it turns a darker green.</p>
    <p>When food with fat reaches the small intestine, the gut releases a hormone called <b>CCK</b>. The gallbladder <b>squeezes</b>, a ring of muscle at the end of the duct (the <b>sphincter of Oddi</b>) relaxes, and bile pours into the <b>duodenum</b>. What happens before that is in <a href="/stomachclear/">StomachClear</a>, and what comes after in <a href="/intestineclear/">IntestineClear</a>.</p>
    <p>Fat and water don't mix, so fat sits in big blobs that enzymes can only nibble from the outside. Bile salts work like <b>washing-up liquid</b>: one end loves water, the other loves fat. They coat the fat and break it into tiny droplets, called <b>emulsification</b>. The same amount of fat now has a far bigger <b>surface</b>, so the fat-digesting enzyme <b>lipase</b> from the pancreas can get to work. Droplets under a thousandth of a millimetre give up to <b>1,000 times</b> more surface.</p>
    <p>Sometimes cholesterol in the gallbladder hardens into <b>gallstones</b>. Many people never notice them, but a stone stuck in a duct can cause strong pain, and that needs a doctor.</p>
    <p class="tip"><b>Try it:</b> eat a meal and watch the gallbladder squeeze. Then slide the bile salts up and watch one fat blob shatter into tiny droplets while the surface area soars.</p>`,
  terms: [
    { t: 'Bile', d: 'A yellow-green liquid made by the liver that helps digest fat and carries some wastes out of the body.' },
    { t: 'Bile salts', d: 'Molecules in bile with a water-loving end and a fat-loving end. They break fat into tiny droplets.' },
    { t: 'Gallbladder', d: 'A small bag under the liver that stores and concentrates bile between meals.' },
    { t: 'CCK', d: 'Cholecystokinin: a hormone made by the small intestine when fat arrives. It makes the gallbladder squeeze.' },
    { t: 'Emulsification', d: 'Breaking fat into tiny droplets spread through water, so enzymes have much more surface to work on.' },
    { t: 'Lipase', d: 'An enzyme, mostly from the pancreas, that breaks fats into smaller pieces the gut can absorb.' },
    { t: 'Gallstone', d: 'A hard lump, usually of cholesterol, that can form in the gallbladder.' },
  ],
  defaults: { meal: false, salts: 0, stones: false, labels: true },
  controls: [
    { key: 'meal', type: 'toggle', label: 'Eat a meal with some fat' },
    { key: 'salts', type: 'range', label: 'Bile salts on the fat', min: 0, max: 1, step: 0.01, ends: ['none', 'plenty'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'stones', type: 'toggle', label: 'Gallstones' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'What does the gallbladder do?', options: ['Makes bile', 'Stores and concentrates bile between meals', 'Digests protein', 'Makes insulin'], answer: 1, why: 'The liver makes bile; the gallbladder stores it and pulls water out to concentrate it.' },
    { q: 'How do bile salts help digest fat?', options: ['They dissolve fat into sugar', 'They break it into tiny droplets, giving enzymes much more surface', 'They heat it up', 'They absorb it into the blood'], answer: 1, why: 'Emulsification: smaller droplets mean far more surface for lipase to work on.' },
    { q: 'Split one fat drop into 1,000 equal drops. The total surface becomes…', options: ['The same', '10 times bigger', '1,000 times bigger', 'Smaller'], answer: 1, why: 'Each drop is 10 times narrower, so the surface grows by the cube root of 1,000, which is 10. Splitting into a billion gives 1,000 times.' },
  ],
  reel: [
    { ms: 6000, caption: 'Bile waits in the gallbladder, squirts out when you eat, and shatters fat into tiny drops.', set: { meal: true, stones: false, labels: false }, anim: { salts: [0, 1] }, view: { pos: [0.4, 3.0, 10.2], target: [0.4, 3.3, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.set(0, 3.4, 0); stage.root.add(root);
    // ---- the liver, gallbladder, ducts and duodenum (seen a little from below)
    const organ = new THREE.Group(); organ.position.set(-1.1, 0.9, 0); organ.scale.setScalar(0.95); organ.rotation.x = 0.28; root.add(organ);
    const liver = makeLiver(stage, { labels: false, flow: false, context: true });
    organ.add(liver.root);
    liver.setXray(0.8);
    liver.vessels.forEach((m) => { m.visible = m.material.color.getHex() === COL.bile; });
    liver.context[2].visible = false;                 // no aorta here
    liver.gbMat.opacity = 0.75;
    const tree = liver.groups.tree;
    const sph = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 8, 24), M.plastic(0xff8a94)); sph.position.set(...P.cbd[3]); tree.add(sph);
    // Bile flows: liver → common bile duct → duodenum; liver → cystic duct → gallbladder; gallbladder → duodenum.
    const toDuo = traveller(tree, cat(P.bdR, P.chd, P.cbd, [[-0.95, -2.85, 0.1]]), { n: 26, r: 0.06, speed: 0.5, cols: [[0, 0xa6e05a]], spread: 0.02 });
    const toGb = traveller(tree, cat(P.bdL, P.chd, P.cystic, [GB_C]), { n: 22, r: 0.06, speed: 0.4, cols: [[0, 0xa6e05a]], spread: 0.02 });
    const fromGb = traveller(tree, cat([GB_C], [...P.cystic].reverse(), P.cbd.slice(1), [[-0.95, -2.85, 0.1]]), { n: 30, r: 0.065, speed: 0.8, cols: [[0, 0x3f8f2a]], spread: 0.03 });
    // Gallstones.
    const stones = new THREE.Group(); tree.add(stones);
    const stoneMat = M.matte(0xc9a24a);
    const sp = [[-0.78, -1.2, 0.2], [-0.62, -1.08, 0.02], [-0.85, -1.28, 0.02], [-0.7, -1.3, 0.28]];
    sp.forEach((p, i) => { const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.07 + (i % 2) * 0.03, 0), stoneMat); s.position.set(...p); stones.add(s); });
    const stuck = new THREE.Mesh(new THREE.DodecahedronGeometry(0.075, 0), stoneMat); stuck.position.set(...P.cystic[1]); tree.add(stuck);

    // ---- the emulsion lens: one blob of fat in the gut, split by bile salts
    const lens = new THREE.Group(); lens.position.set(3.1, 0.0, 0); root.add(lens);
    const ringM = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.05, 12, 64), M.glow(0x8ef0ff)); lens.add(ringM);
    const back = new THREE.Mesh(new THREE.CircleGeometry(1.37, 64), new THREE.MeshBasicMaterial({ color: 0x2a1c16, transparent: true, opacity: 0.55, depthWrite: false })); back.position.z = -0.9; lens.add(back);
    const MAXN = 125, R0 = 0.66;
    const fat = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 28, 18), new THREE.MeshPhysicalMaterial({ color: 0xffe08a, roughness: 0.2, clearcoat: 1, transparent: true, opacity: 0.92 }), MAXN);
    fat.instanceMatrix.setUsage(THREE.DynamicDrawUsage); lens.add(fat);
    const coat = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), M.glow(0x6fd35a), MAXN * 8);
    coat.instanceMatrix.setUsage(THREE.DynamicDrawUsage); lens.add(coat);
    const dirs = Array.from({ length: 8 }, (_, i) => { const a = i * 2.4, z = 1 - (2 * (i + 0.5)) / 8, r = Math.sqrt(1 - z * z); return V(r * Math.cos(a), r * Math.sin(a), z); });
    const o = new THREE.Object3D();
    const cube = (n) => { const k = Math.ceil(Math.cbrt(n)); const pts = []; for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) for (let l = 0; l < k; l++) pts.push([i - (k - 1) / 2, j - (k - 1) / 2, l - (k - 1) / 2]); return pts.sort((a, b) => a[0] ** 2 + a[1] ** 2 + a[2] ** 2 - b[0] ** 2 - b[1] ** 2 - b[2] ** 2).slice(0, n); };

    const L = (t, p, parent, c) => tint(stage.label(t, p, parent), c);
    const lbls = [
      L('Gallbladder', [-1.5, -1.7, 0.6], tree, 'green'),
      L('Common bile duct', [0.6, -1.85, 0.3], tree, 'green'),
      L('Duodenum', [-1.7, -2.9, 0.2], tree, ''),
      L('Sphincter of Oddi', [0.35, -2.8, 0.2], tree, 'red'),
      L('Liver', [-1.4, 1.1, 1.0], tree, ''),
      L('Inside the gut, magnified', [0, -1.7, 0], lens, 'side'),
    ];
    const stoneLbl = L('Gallstones', [-0.2, -1.1, 0.7], tree, 'gold');
    let gb = 0.8, conc = 0.5, k = 0, t = 0;
    const gbBase = liver.gb.scale.clone();
    const fit = fitNarrow(stage, { pos: [0.6, 3.9, 14], target: [0.6, 4.4, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const blocked = s.stones && s.meal;
        // Gallbladder volume and concentration. It empties over tens of minutes in life; here in seconds.
        if (s.meal && !blocked) gb = Math.max(0.25, gb - dt * 0.18); else if (!s.meal) gb = Math.min(1, gb + dt * 0.05);
        conc = s.meal ? Math.max(0.2, conc - dt * 0.1) : Math.min(1, conc + dt * 0.04);
        liver.gb.scale.set(gbBase.x * (0.55 + 0.45 * gb), gbBase.y * (0.8 + 0.2 * gb), gbBase.z * (0.55 + 0.45 * gb));
        liver.gbMat.color.set(0x7fb04a).lerp(new THREE.Color(0x2f6a1f), conc);
        if (blocked) liver.gb.scale.multiplyScalar(1 + 0.03 * Math.sin(t * 12));
        sph.scale.setScalar(s.meal ? 1.35 : 0.8);
        toDuo.mesh.visible = s.meal; toGb.mesh.visible = !s.meal; fromGb.mesh.visible = s.meal && !blocked;
        toDuo.step(dt); toGb.step(dt); fromGb.step(dt);
        stones.visible = s.stones; stuck.visible = blocked;
        // Emulsion: bile salts take the droplet size from 1 mm down to 1 µm (log scale).
        k += (s.salts - k) * Math.min(1, dt * 3);
        const n = Math.max(1, Math.round(Math.pow(MAXN, k))), r = R0 / Math.cbrt(n) * 0.98, spacing = Math.min(2 * R0 / Math.cbrt(n) * 1.08, 0.5);
        const pts = cube(n);
        for (let i = 0; i < MAXN; i++) {
          if (i < n) { const [a, b, c] = pts[i]; o.position.set(a * spacing + Math.sin(t * 0.9 + i) * 0.02, b * spacing + Math.cos(t * 1.1 + i) * 0.02, c * spacing * 0.6); o.scale.setScalar(r); } else o.scale.setScalar(0);
          o.updateMatrix(); fat.setMatrixAt(i, o.matrix);
          for (let j = 0; j < 8; j++) {
            const on = i < n && j < Math.round(k * 8);
            if (on) { const p = o.position.clone().addScaledVector(dirs[j], r * 1.02); const m = new THREE.Matrix4().compose(p, new THREE.Quaternion(), V(1, 1, 1).multiplyScalar(Math.max(0.018, r * 0.13))); coat.setMatrixAt(i * 8 + j, m); }
            else coat.setMatrixAt(i * 8 + j, new THREE.Matrix4().makeScale(0, 0, 0));
          }
        }
        fat.instanceMatrix.needsUpdate = true; coat.instanceMatrix.needsUpdate = true;
        const narrow = fit();
        lbls.forEach((l) => { l.visible = s.labels && !narrow; });
        stoneLbl.visible = s.labels && s.stones && !narrow;
      },
      readout: (s) => {
        const d = 1000 * Math.pow(1000, -k);            // droplet diameter in µm, 1 mm → 1 µm
        const area = 1000 / d;
        return `<div class="big">Surface × ${area < 10 ? area.toFixed(1) : Math.round(area).toLocaleString('en-IN')}</div>
          <div class="row"><span>Fat droplet size</span><b>${d >= 100 ? (d / 1000).toFixed(2) + ' mm' : d.toFixed(d < 10 ? 1 : 0) + ' µm'}</b></div>
          <div class="row"><span>Gallbladder</span><b>${s.stones && s.meal ? 'blocked by a stone' : s.meal ? 'squeezing' : 'filling'} · ${Math.round(20 + 30 * gb)} mL</b></div>
          <div class="row"><span>Bile made each day</span><b>about 0.5–1 L</b></div>
          <small>${s.stones && s.meal ? 'A stone stuck in a duct can cause strong pain after meals. That needs a doctor.' : 'The same amount of fat, in smaller drops, has far more surface for lipase to work on.'}</small>`;
      },
    });
  },
};
