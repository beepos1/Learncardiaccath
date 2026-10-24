# Learn Cardiac Cath

An interactive 3D primer on C-arm angulation and coronary angiographic views for residents and fellows.

- **C-arm Basics** (`basics.html`): the machine, naming convention (views are named by the detector position), cranial/caudal, reading the monitor (spine and diaphragm cues), typical shot sequence, radiation.
- **Simulator** (`simulator.html`): a 3D cath lab (C-arm, table, patient, heart) next to a simulated fluoroscopy monitor rendered from the X-ray tube's point of view. Rotate (LAO/RAO), angulate (CRA/CAU), switch left/right coronary, inject contrast, toggle colour-coded anatomy. Keyboard: arrows, Space, L, C. `?view=<id>` deep-links a preset.
- **Standard Views** (`views.html`): ten standard projections with what each shows best and recognition tips.
- **Quiz** (`quiz.html`): name the view from the angiogram, or dial in the angles yourself.

## Run locally

It's a static site with no build step. Serve the folder over HTTP (ES modules don't load from `file://`):

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

It deploys as-is to GitHub Pages, Netlify, etc.

## Code layout

- `js/anatomy.js`: schematic heart and coronary tree, built on a cone-shaped ventricle in patient coordinates (+x right, +y anterior, +z cranial).
- `js/lab.js`: the shared 3D room + fluoroscopy component (`createLab(element, options)`).
- `js/views-data.js`: standard view definitions. Edit the angles and teaching points here.
- `vendor/three/`: vendored three.js r160 (MIT).

The anatomy is schematic. Real heart position, dominance and optimal angles vary from patient to patient.
