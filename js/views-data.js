// Standard angiographic projections: native coronaries, LV gram, bypass grafts.
// lao: + = LAO, - = RAO (degrees). cran: + = cranial, - = caudal (degrees).
// sys: the injection target (see TARGETS in anatomy.js).
// Angles are typical starting points; every patient's heart sits a little
// differently, so operators fine-tune them case by case.

export const VIEWS = [
  {
    id: 'rao-caudal', name: 'RAO Caudal', lao: -25, cran: -25, sys: 'L',
    nickname: 'The "circumflex view"',
    bestFor: ['Left main (body & bifurcation)', 'Proximal LCx', 'Obtuse marginals', 'Proximal LAD'],
    tips: [
      'Usually the first left-sided shot: it lays the LCx and OMs out along the bottom of the image.',
      'Spine sits on the left of the screen (RAO), diaphragm is out of the field (caudal).',
    ],
  },
  {
    id: 'ap-caudal', name: 'AP Caudal', lao: 0, cran: -30, sys: 'L',
    nickname: 'Left main view',
    bestFor: ['Left main', 'Proximal LAD', 'Proximal LCx'],
    tips: [
      'Good for left main disease and ostial LAD/LCx when RAO caudal overlaps.',
      'The spine overlies the middle of the image.',
    ],
  },
  {
    id: 'ap-cranial', name: 'AP Cranial', lao: 0, cran: 30, sys: 'L',
    nickname: 'LAD view',
    bestFor: ['Mid & distal LAD', 'Diagonal origins', 'Septals'],
    tips: [
      'Separates the LAD from its diagonals and elongates the mid LAD.',
      'Diaphragm creeps up into the bottom of the field: a cranial clue.',
    ],
  },
  {
    id: 'rao-cranial', name: 'RAO Cranial', lao: -30, cran: 30, sys: 'L',
    nickname: 'LAD / diagonal view',
    bestFor: ['Mid & distal LAD', 'Diagonal bifurcations', 'Septal perforators'],
    tips: [
      'Septals and diagonals leave the LAD on opposite sides, so you can tell them apart.',
      'Spine on the left, diaphragm in the field.',
    ],
  },
  {
    id: 'lao-cranial', name: 'LAO Cranial', lao: 40, cran: 30, sys: 'L',
    nickname: 'LAD / diagonal bifurcation view',
    bestFor: ['Mid LAD', 'LAD–diagonal bifurcations', 'Septals vs. diagonals'],
    tips: [
      'The LAD runs down the middle of the heart; septals branch off to one side and diagonals to the other.',
      'Spine on the right, diaphragm in the field. Ask the patient to breathe in to drop the diaphragm.',
    ],
  },
  {
    id: 'lao-caudal', name: 'LAO Caudal', lao: 45, cran: -30, sys: 'L',
    nickname: 'The "spider view"',
    bestFor: ['Left main', 'LAD/LCx bifurcation', 'Proximal LCx'],
    tips: [
      'Looks up at the base of the heart from below: LM, LAD and LCx splay out like a spider.',
      'Foreshortens the mid/distal vessels; use it for the bifurcation, not the whole vessel.',
      'Spine on the right, diaphragm out of the field.',
    ],
  },
  {
    id: 'left-lateral', name: 'Left Lateral', lao: 90, cran: 0, sys: 'L',
    nickname: 'Lateral',
    bestFor: ['Mid LAD', 'LIMA–LAD anastomosis', 'Separating LAD from LCx'],
    tips: [
      'LAD runs down the front of the heart; LCx along the back.',
      'Watch for the detector clipping the patient\'s arm or the table at 90°.',
    ],
  },
  {
    id: 'lao-rca', name: 'LAO (RCA)', lao: 35, cran: 0, sys: 'R',
    nickname: 'RCA "C" view',
    bestFor: ['Ostial & proximal RCA', 'Mid RCA', 'Acute marginals'],
    tips: [
      'The RCA traces a "C" as it runs in the right AV groove.',
      'Standard first shot of the right coronary; engagement and the ostium are well seen.',
    ],
  },
  {
    id: 'lao-cranial-rca', name: 'LAO Cranial (RCA)', lao: 30, cran: 20, sys: 'R',
    nickname: 'Crux view',
    bestFor: ['Distal RCA', 'Crux', 'PDA / PLV bifurcation'],
    tips: [
      'Cranial angulation opens up the crux so the PDA and PLV separate.',
    ],
  },
  {
    id: 'rao-rca', name: 'RAO (RCA)', lao: -30, cran: 0, sys: 'R',
    nickname: 'RCA "L" view',
    bestFor: ['Mid RCA', 'PDA (length)', 'Septal collaterals from PDA'],
    tips: [
      'The RCA makes an "L": the mid segment runs down and the PDA runs along the bottom.',
      'RAO 30 is also the classic view for an LV gram (ventriculogram).',
    ],
  },

  // ---- Ventriculography ----
  {
    id: 'lv-rao', name: 'LV gram RAO', lao: -30, cran: 0, sys: 'LV',
    nickname: 'The classic ventriculogram',
    bestFor: ['Anterior wall', 'Apex', 'Inferior wall', 'Mitral regurgitation'],
    tips: [
      'Lays the long axis of the LV across the screen: the anterior, apical and inferior segments are seen in profile.',
      'Contrast appearing behind the mitral plane in the left atrium means mitral regurgitation.',
      'Try the wall-motion options: anterior and inferior akinesis are obvious here, a lateral problem is not.',
    ],
  },
  {
    id: 'lv-lao', name: 'LV gram LAO', lao: 45, cran: 15, sys: 'LV',
    nickname: 'Septum in profile',
    bestFor: ['Septum', 'Lateral (posterolateral) wall', 'VSD'],
    tips: [
      'Looks down the septum, so the septal and lateral walls form the borders of the LV silhouette.',
      'The view for a post-infarct VSD (contrast crosses into the RV) and for lateral wall motion.',
      'RAO 30 + LAO 45 together cover all the walls; one view alone always misses some.',
    ],
  },

  // ---- Bypass grafts ----
  {
    id: 'lima-ap', name: 'LIMA AP', lao: 0, cran: 0, sys: 'LIMA',
    nickname: 'Subclavian & LIMA origin',
    bestFor: ['Left subclavian', 'LIMA origin', 'Proximal LIMA'],
    tips: [
      'The LIMA comes off the underside of the left subclavian artery and runs down beside the sternum.',
      'Surgical clips along the LIMA pedicle and the sternal wires are your landmarks in post-CABG patients.',
    ],
  },
  {
    id: 'lima-lateral', name: 'LIMA Lateral', lao: 90, cran: 0, sys: 'LIMA',
    nickname: 'LIMA–LAD anastomosis',
    bestFor: ['LIMA–LAD anastomosis', 'Distal LAD run-off'],
    tips: [
      'Lateral lays the anastomosis on the front of the heart, clear of the LIMA body.',
      'Contrast entering the native LAD beyond the anastomosis confirms the graft is patent.',
    ],
  },
  {
    id: 'lima-ap-cranial', name: 'LIMA AP Cranial', lao: 0, cran: 25, sys: 'LIMA',
    nickname: 'Anastomosis & run-off',
    bestFor: ['LIMA–LAD anastomosis', 'Distal LAD'],
    tips: [
      'Second, orthogonal-ish look at the anastomosis; pair it with the lateral.',
    ],
  },
  {
    id: 'svgr-lao', name: 'SVG–RCA LAO', lao: 35, cran: 0, sys: 'SVGR',
    nickname: 'Right graft: ostium & body',
    bestFor: ['SVG ostium', 'Graft body'],
    tips: [
      'Vein graft ostia sit on the front of the ascending aorta, above the native coronaries. Right-sided grafts are usually the lowest and furthest right.',
      'Ostial ring markers (if the surgeon placed them) show you where to engage.',
    ],
  },
  {
    id: 'svgr-rao', name: 'SVG–RCA RAO', lao: -30, cran: 0, sys: 'SVGR',
    nickname: 'Right graft: anastomosis',
    bestFor: ['Distal anastomosis', 'PDA / PLV run-off'],
    tips: [
      'Opens out the distal anastomosis and the native PDA and PLV it supplies.',
    ],
  },
  {
    id: 'svgo-rao-caudal', name: 'SVG–OM RAO Caudal', lao: -30, cran: -20, sys: 'SVGO',
    nickname: 'Left graft: anastomosis',
    bestFor: ['Distal anastomosis to OM', 'OM run-off'],
    tips: [
      'Same logic as the native circumflex: RAO caudal lays the lateral wall out.',
      'Grafts to the circumflex territory usually arise highest and furthest left on the aorta.',
    ],
  },
  {
    id: 'svgo-lao', name: 'SVG–OM LAO', lao: 45, cran: 0, sys: 'SVGO',
    nickname: 'Left graft: ostium & body',
    bestFor: ['SVG ostium', 'Graft body'],
    tips: [
      'The graft loops over the pulmonary artery toward the lateral wall; LAO separates it from the aorta.',
    ],
  },
];

export const GROUPS = { L: 'Left coronary', R: 'Right coronary', LV: 'Ventriculogram', G: 'Bypass grafts' };
for (const v of VIEWS) v.group = ['LIMA', 'SVGR', 'SVGO'].includes(v.sys) ? 'G' : v.sys;

export const VIEW_BY_ID = Object.fromEntries(VIEWS.map((v) => [v.id, v]));

export function formatAngles(lao, cran) {
  const a = Math.round(lao), c = Math.round(cran);
  const side = a === 0 ? 'AP' : a > 0 ? `LAO ${a}°` : `RAO ${-a}°`;
  const tilt = c === 0 ? '' : c > 0 ? ` · CRA ${c}°` : ` · CAU ${-c}°`;
  return side + tilt;
}
