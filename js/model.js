// LiverClear's numbers: small, honest models for the charts. Pure JavaScript (no three.js), so it
// can be tested on its own with node.
//
// Sources:
//  [GH]  Hall JE, Hall ME. Guyton and Hall Textbook of Medical Physiology, 14th ed. (2021),
//        ch. 68–69 (carbohydrate and fat metabolism, glycogen), 71 (the liver), 79 (insulin, glucagon).
//  [ADA] American Diabetes Association, Standards of Care (2024), "Classification and Diagnosis":
//        normal fasting plasma glucose below 100 mg/dL; below 140 mg/dL two hours after a glucose load.
//  [R91] Rothman DL et al. Quantitation of hepatic glycogenolysis and gluconeogenesis in fasting humans
//        with 13C NMR. Science 254:573–576 (1991): liver glycogen after a meal about 45 g/L liver tissue
//        falling steadily overnight; gluconeogenesis supplies about 64% of glucose output over 22 h.
//  [T96] Taylor R et al. Direct assessment of liver glycogen storage by 13C NMR spectroscopy and
//        regulation of glucose homeostasis after a mixed meal in normal subjects. J Clin Invest
//        97:126–132 (1996): about a fifth of the carbohydrate in a mixed meal ends up as liver glycogen.
//  [D]   DeFronzo RA. Pathogenesis of type 2 diabetes. Diabetes 58:773 (2009): basal endogenous
//        glucose output about 2 mg/kg/min, about 1.8–2.0 mg/kg/min, most of it from the liver.
//  [NIAAA] National Institute on Alcohol Abuse and Alcoholism, "Alcohol Metabolism" (Alcohol Alert 72)
//        and "What Is A Standard Drink?": the liver clears roughly one standard drink an hour, but the
//        rate differs a lot between people.

// ================================================================ a day of blood sugar
// One adult (70 kg), minute by minute over 24 hours from midnight, with three meals.
// Glucose pool: blood and the fluid around cells, about 14 L, so 14 g of glucose ≈ 100 mg/dL.
// Liver glycogen: holds up to about 100–120 g in an adult [GH ch. 69: up to 5–8% of the liver's weight].
// Hormone signals: insulin rises when blood sugar is high, glucagon when it is low [GH ch. 79].
//  - insulin makes the liver take glucose in and build glycogen, stops it releasing glucose, and lets
//    muscles and fat take glucose in;
//  - glucagon makes the liver break glycogen down and make new glucose (gluconeogenesis).
// Constants were tuned so a healthy day gives: fasting 80–95 mg/dL, a peak of about 130–145 mg/dL
// about 45–60 minutes after a 70 g carbohydrate meal, back near fasting within 2–3 hours [ADA];
// liver output overnight about 2 mg/kg/min [D]; about a fifth of each meal's carbohydrate stored as
// liver glycogen [T96]; and the glycogen store falling by about a third overnight [R91].
export const MEALS = [{ t: 8 * 60, name: 'Breakfast' }, { t: 13.5 * 60, name: 'Lunch' }, { t: 20.5 * 60, name: 'Dinner' }];
export const VOL_DL = 140;                         // 14 L of fluid, in decilitres
export const GLY_MAX = 115;                        // g, a full liver's glycogen store
export const mgdl = (g) => (g * 1000) / VOL_DL;

export function simulateDay({ carbs = 70, mode = 'both' } = {}) {
  const ins = mode !== 'glucagon', glu = mode !== 'insulin';
  let G = 12.4, gly = 80, stom = 0, gut = 0;        // g in blood pool, g glycogen, g carbohydrate in the stomach and intestine
  const out = [];
  // Start the day from the end of a previous identical day, so midnight matches.
  for (let pass = 0; pass < 2; pass++) {
    for (let m = 0; m < 1440; m++) {
      for (const meal of MEALS) if (m === meal.t) stom += carbs;
      const bg = mgdl(G);
      const I = ins ? Math.min(2.5, Math.max(0.06, (bg - 72) / 45)) : 0;           // insulin signal
      const Gn = glu ? Math.min(1.3, Math.max(0, (112 - bg) / 25)) : 0;            // glucagon signal
      const empty = stom / 30; stom -= empty; gut += empty;                         // the stomach empties into the intestine
      const ra = gut / 30; gut -= ra;                                              // glucose absorbed from the gut, g/min
      // Liver: stores glucose as glycogen while insulin is high...
      const store = 0.5 * I * Math.max(0, (bg - 85) / 100) * Math.max(0, 1 - gly / GLY_MAX);
      // ...and releases it (glycogen breakdown + new glucose) when glucagon is high and insulin low.
      const sup = 1 / (1 + 3 * I);
      const glyco = 0.09 * (0.25 + Gn) * (gly / (gly + 25)) * sup;
      const gng = (0.045 + 0.06 * Gn) * sup + (ins ? 0 : 0.03);                    // without insulin nothing holds it back
      const liverOut = glyco + gng - store;                                        // + releases, − takes in
      // Body uses glucose: brain and red cells always (≈ 0.08 g/min), muscles and fat when insulin lets them.
      const use = (0.085 * bg) / (bg + 25) + 0.22 * I * (bg / 100);
      // Kidneys spill glucose into urine above about 180 mg/dL [GH ch. 28]: roughly the filtration
      // rate (about 1.25 dL/min) times the excess concentration.
      const urine = bg > 180 ? ((bg - 180) * 1.25) / 1000 : 0;
      G = Math.max(3, G + ra + liverOut - use - urine);
      gly = Math.min(GLY_MAX, Math.max(0, gly + store - glyco));
      if (pass === 1) out.push({ m, bg: mgdl(G), gly, I, Gn, liver: liverOut, ra });
    }
  }
  return out;
}

// ================================================================ alcohol
// Grams of pure alcohol still in the body after drinking, with the liver working at a steady pace.
// Alcohol dehydrogenase works at close to its top speed even at low blood levels, so the amount falls
// by about the same number of grams each hour ("zero-order"), whatever you do. Rates of roughly
// 7–10 g an hour are often quoted for adults, but the real rate varies a lot from person to person
// [NIAAA]; about 10% leaves unchanged in breath, sweat and urine.
// A "standard drink" differs by country: 8 g (a UK unit), 10 g (WHO, Australia, India's usual
// reference), 14 g (US). We use 10 g.
export const DRINK_G = 10;
export function alcoholCurve({ drinks = 2, rate = 8, hours = 10, overH = 1 } = {}) {
  const pts = [];
  let a = 0;
  for (let i = 0; i <= hours * 20; i++) {
    const t = i / 20, dt = 1 / 20;
    if (t < overH) a += (drinks * DRINK_G * dt) / overH;          // drinks spread over the first hour
    a = Math.max(0, a - rate * dt);
    pts.push({ t, g: a });
  }
  return pts;
}
export const hoursToClear = (drinks, rate) => (drinks * DRINK_G) / rate;

// ================================================================ regrowth
// After part of the liver is removed, the rest grows back towards the original mass. In people most
// of the regrowth happens in the first few weeks and the volume is largely restored in about 2–3
// months, though often not quite to 100% [StatPearls "Liver Regeneration"; Pomfret et al.,
// Transplantation 76:5 (2003); Michalopoulos, Am J Pathol 176:2 (2010)]. A simple saturating curve:
// remaining mass fraction m(w) = 1 − (1 − m0)·e^(−w/τ), with τ ≈ 3 weeks.
export const REGROW_TAU = 3;
export const regrow = (m0, weeks) => 1 - (1 - m0) * Math.exp(-weeks / REGROW_TAU);
