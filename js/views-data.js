// Standard coronary angiographic projections.
// lao: + = LAO, - = RAO (degrees). cran: + = cranial, - = caudal (degrees).
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
];

export const VIEW_BY_ID = Object.fromEntries(VIEWS.map((v) => [v.id, v]));

export function formatAngles(lao, cran) {
  const a = Math.round(lao), c = Math.round(cran);
  const side = a === 0 ? 'AP' : a > 0 ? `LAO ${a}°` : `RAO ${-a}°`;
  const tilt = c === 0 ? '' : c > 0 ? ` · CRA ${c}°` : ` · CAU ${-c}°`;
  return side + tilt;
}
