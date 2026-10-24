// Shared header/footer so every page stays in sync.
const PAGES = [
  ['index.html', 'Home'],
  ['basics.html', 'C-arm Basics'],
  ['simulator.html', 'Simulator'],
  ['views.html', 'Standard Views'],
  ['quiz.html', 'Quiz'],
];

const here = location.pathname.split('/').pop() || 'index.html';
const header = document.createElement('header');
header.className = 'site-header';
header.innerHTML = `<div class="wrap">
  <a class="brand" href="index.html" aria-label="Learn Cardiac Cath home">
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M6 22 A11 11 0 1 1 26 22" fill="none" stroke="#3aa0ff" stroke-width="3.2" stroke-linecap="round"/>
      <rect x="11" y="3" width="10" height="4" rx="1.2" fill="#3aa0ff"/>
      <circle cx="16" cy="27" r="3" fill="#f0a040"/>
      <path d="M16 24 L16 8" stroke="#ffe08a" stroke-width="1.2" stroke-dasharray="2 2"/>
    </svg>
    <span>Learn<b>Cardiac</b>Cath</span>
  </a>
  <nav class="nav">${PAGES.map(([h, t]) => `<a href="${h}"${h === here ? ' class="active"' : ''}>${t}</a>`).join('')}</nav>
</div>`;
document.body.prepend(header);

const footer = document.createElement('footer');
footer.innerHTML = `<div class="wrap">
  <p><b>Learn Cardiac Cath</b> — an interactive primer on C-arm angulation and coronary angiographic views for residents and fellows.</p>
  <p class="muted">Educational use only. The heart and coronary tree are schematic: real anatomy, dominance and heart position vary, and optimal angles are tailored to each patient. Not a substitute for supervised training.</p>
</div>`;
document.body.append(footer);
