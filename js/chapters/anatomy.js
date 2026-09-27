// Chapter 1: the liver itself. Lobes, ligament, gallbladder, the double blood supply, the hepatic
// veins and the bile ducts, placed under the right ribs. Blood and bile flow through it.
// Sources: see the header of liver.js (Gray's Anatomy; StatPearls NBK500014; Guyton & Hall ch. 71;
// Britannica "Liver"; NIDDK).
import { THREE } from '../kit.js';
import { makeLiver, makeRibs, sideLabels, tint, fitNarrow, compactReadout, REF } from '../liver.js';

export default {
  id: 'anatomy',
  short: 'Meet the liver',
  title: 'Meet your liver',
  subtitle: 'The biggest organ inside you, with two blood supplies and a green drain.',
  view: { pos: [-1.6, 5.4, 8.5], target: [-1.8, 4.1, 0] },
  learn: `<p>Your <b>liver</b> is the largest organ inside your body: about <b>1.2 to 1.5 kg</b> in an adult, the weight of a big bag of sugar. It sits in the upper right of your belly, tucked under your right ribs and pressed up against the dome of your <b>diaphragm</b>. We are looking at it from the front, so the patient's <b>right</b> is on <b>your left</b>.</p>
    <p>It has a big <b>right lobe</b> and a thinner <b>left lobe</b> that reaches across over the stomach. A fold of tissue, the <b>falciform ligament</b>, marks the line between them on the front. Two small lobes hide round the back and underneath: the <b>caudate</b> and the <b>quadrate</b>. Tucked under the right lobe is a little green bag, the <b>gallbladder</b>.</p>
    <p>The liver is unusual because it gets blood from <b>two</b> pipes. The <b>hepatic artery</b> brings about a quarter of it, fresh with oxygen. The <b>portal vein</b> brings about three-quarters, straight from your stomach and intestines, full of everything you have just digested. So the liver gets first look at your food before the rest of your body does. About <b>1.35 litres</b> a minute pass through it, roughly a quarter of all the blood your heart pumps (see <a href="/heartclear/">HeartClear</a>). It all leaves through the <b>hepatic veins</b> into the <b>inferior vena cava</b>, the big vein that runs up to the heart.</p>
    <p>A second set of tubes carries <b>bile</b> the other way, out of the liver: the <b>hepatic ducts</b> join into the <b>common bile duct</b>, which empties into the first part of the small intestine, the <b>duodenum</b>.</p>
    <p class="tip"><b>Try it:</b> switch on X-ray and follow a purple dot from the gut. Then pull the lobes apart to see the tree of pipes inside, and show the ribs to see where the liver hides.</p>`,
  terms: [
    { t: 'Lobe', d: 'One of the big sections of the liver. The right lobe is the largest; the left lobe is thinner.' },
    { t: 'Portal vein', d: 'The vein that carries blood from the stomach, intestines and spleen to the liver, about three-quarters of its supply.' },
    { t: 'Hepatic artery', d: 'The artery that brings oxygen-rich blood to the liver, about a quarter of its supply.' },
    { t: 'Hepatic veins', d: 'The veins that carry blood out of the liver into the inferior vena cava.' },
    { t: 'Gallbladder', d: 'A small bag under the liver that stores and concentrates bile until you eat.' },
    { t: 'Bile duct', d: 'A tube that carries bile from the liver (and gallbladder) to the small intestine.' },
    { t: 'Hepatic', d: 'To do with the liver, from the Greek word hepar.' },
  ],
  defaults: { explode: 0, xray: false, ribs: false, flow: true, labels: true },
  controls: [
    { key: 'explode', type: 'range', label: 'Pull the lobes apart', min: 0, max: 1, step: 0.01, ends: ['together', 'apart'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'xray', type: 'toggle', label: 'X-ray: see the pipes inside' },
    { key: 'ribs', type: 'toggle', label: 'Show the ribs and diaphragm' },
    { key: 'flow', type: 'toggle', label: 'Blood and bile flowing' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Where does most of the liver’s blood come from?', options: ['Straight from the heart through an artery', 'From the stomach and intestines, through the portal vein', 'From the lungs', 'From the kidneys'], answer: 1, why: 'About three-quarters arrives through the portal vein, carrying what you have just digested. Only about a quarter comes through the hepatic artery.' },
    { q: 'Where in your body is the liver?', options: ['Low down on the left', 'Upper right of the belly, under the ribs', 'Behind the heart', 'In the middle of the back'], answer: 1, why: 'It sits under the right ribs, just below the diaphragm, with its left lobe reaching across the middle.' },
    { q: 'Which way does bile travel?', options: ['Into the liver from the gut', 'Out of the liver, down the bile ducts to the small intestine', 'Up to the heart', 'Into the portal vein'], answer: 1, why: 'Bile is made in the liver and drains out through the bile ducts, stored on the way in the gallbladder, into the duodenum.' },
  ],
  reel: [
    { ms: 5200, caption: 'Your liver is the biggest organ inside you: about 1.5 kg, tucked under your right ribs.', set: { explode: 0, xray: false, ribs: true, flow: true, labels: false }, view: { pos: [0.2, 4.6, 10.4], target: [-0.1, 3.5, 0] }, spin: 0.5 },
    { ms: 5600, caption: 'It gets blood twice: three-quarters straight from your gut, a quarter fresh from the heart.', set: { explode: 0.35, xray: true, ribs: false, flow: true, labels: false }, view: { pos: [0.2, 4.4, 9.4], target: [-0.1, 3.4, 0] }, spin: 0.3 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.set(0, 3.9, 0); stage.root.add(root);
    const liver = makeLiver(stage);
    root.add(liver.root);
    const ribs = makeRibs(root);
    const ribLabels = [tint(stage.label('Right ribs', [-3.1, -0.4, 1.0], root), 'cream'), tint(stage.label('Diaphragm', [-1.5, 1.75, -0.5], root), 'cream')];
    const sides = sideLabels(stage, root, -3.9, 2.4);
    const front = tint(stage.label('You are facing the patient', [0, -4.3, 0.8], root), 'side');
    let xr = 0, rb = 0;
    const fit = fitNarrow(stage, { pos: [0, 5.3, 12.5], target: [-0.1, 4.4, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt);
        xr += ((s.xray ? 1 : 0) - xr) * Math.min(1, dt * 5);
        liver.setXray(Math.max(xr, s.explode > 0.05 ? 0.35 * Math.min(1, s.explode * 3) : 0));
        liver.setExplode(s.explode);
        rb += ((s.ribs ? 1 : 0) - rb) * Math.min(1, dt * 5);
        ribs.group.visible = rb > 0.02; ribs.ribMat.opacity = 0.22 * rb; ribs.dia.material.opacity = 0.12 * rb;
        liver.flow.mesh.visible = s.flow;
        if (s.flow) liver.flow.step(dt, 1);
        const narrow = fit();
        liver.showLabels(s.labels, narrow);
        ribLabels.forEach((l) => { l.visible = s.labels && s.ribs && !narrow; });
        [...sides, front].forEach((l) => { l.visible = s.labels && !narrow; });
      },
      readout: (s) => `<div class="big">About ${REF.mass[0]}–${REF.mass[1]} kg</div>
        <div class="row"><span>Blood through it</span><b>${(REF.flow / 1000).toFixed(2)} L/min, ${REF.coShare}% of the heart's output</b></div>
        <div class="row"><span>From the portal vein · artery</span><b>${REF.flowPortal} · ${REF.flowArtery} mL/min</b></div>
        <small>${s.xray || s.explode > 0.05 ? 'Purple: portal blood from the gut. Red: fresh arterial blood. Blue: used blood leaving. Green: bile.' : 'Front view: the patient’s right is on your left.'}</small>`,
    });
  },
};
