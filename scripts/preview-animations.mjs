// Genera doc/animation-preview.html: un tablero con las 3 flechas demo y un botón
// por outcome que reproduce la MISMA coreografía que ArrowComponent (WAAPI +
// constantes de animation/motion.ts). Solo ayuda visual para el checkpoint de B2.

import { writeFileSync } from 'node:fs';

const CELL = 70, OFF = 35, W = 420, H = 420;
const DOT = '#d3d7e0', BG = '#ffffff';
const STROKE = 0.38 * CELL;
const TIP = 0.5 * CELL, BACK = 0.32 * CELL, HALF = 0.36 * CELL;
const portDelta = (p) => [[0, -1], [1, 0], [0, 1], [-1, 0]][p];
const center = (col, row) => [col * CELL + OFF, row * CELL + OFF];

const arrows = [
  { id: 'blue', color: '#3b82f6', cells: [[4, 2], [4, 1]], exit: 0 },
  { id: 'green', color: '#22c55e', cells: [[1, 2]], exit: 1 },
  { id: 'orange', color: '#f97316', cells: [[2, 2], [2, 3]], exit: 2 },
];

let dots = '';
for (let r = 0; r <= 5; r++)
  for (let c = 0; c <= 5; c++) {
    const [x, y] = center(c, r);
    dots += `<circle cx="${x}" cy="${y}" r="${0.09 * CELL}" fill="${DOT}"/>`;
  }

let groups = '';
for (const a of arrows) {
  const pts = a.cells.map(([c, r]) => center(c, r));
  const [fx, fy] = pts[0];
  const d = pts.length > 1
    ? `M ${fx},${fy} ` + pts.slice(1).map(([x, y]) => `L ${x},${y}`).join(' ')
    : `M ${fx},${fy} L ${fx},${fy}`;
  // Punta en la celda LÍDER (último punto), orientada por el último tramo del shaft.
  const lp = pts[pts.length - 1];
  let dc, dr;
  if (pts.length >= 2) {
    const p = pts[pts.length - 2];
    const vx = lp[0] - p[0], vy = lp[1] - p[1];
    const len = Math.hypot(vx, vy) || 1;
    dc = vx / len; dr = vy / len;
  } else {
    [dc, dr] = portDelta(a.exit);
  }
  const px = -dr, py = dc;
  const apex = [lp[0] + dc * TIP, lp[1] + dr * TIP];
  const bm = [lp[0] - dc * BACK, lp[1] - dr * BACK];
  const L = [bm[0] + px * HALF, bm[1] + py * HALF];
  const R = [bm[0] - px * HALF, bm[1] - py * HALF];
  groups +=
    `<g id="${a.id}" data-exit="${a.exit}">` +
    `<path d="${d}" fill="none" stroke="${a.color}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<polygon points="${apex} ${L} ${R}" fill="${a.color}"/></g>`;
}

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Arrow Maze — preview de animaciones (B2)</title>
<style>body{font-family:system-ui,sans-serif;background:#f1f3f7;margin:0;padding:24px;text-align:center}
button{font-size:15px;padding:10px 16px;margin:6px;border:0;border-radius:8px;background:#1f2937;color:#fff;cursor:pointer}
svg{background:${BG};border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.12)}</style></head>
<body>
<h2>Arrow Maze — animaciones de un tick</h2>
<p>Cada botón reproduce la coreografía real (glide / recoil / fade).</p>
<div>
<button onclick="glide('blue')">advanced → glide (azul, N)</button>
<button onclick="recoil('green')">blocked → recoil (verde, E)</button>
<button onclick="fade('orange')">destroyed → fade (naranja, S)</button>
<button onclick="reset()">reset</button>
</div>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${dots}${groups}</svg>
<script>
const CELL=${CELL}, FRAC=0.28;
const PD=p=>[[0,-1],[1,0],[0,1],[-1,0]][p];
const dxy=el=>{const [dc,dr]=PD(+el.dataset.exit);return [dc*CELL,dr*CELL];};
function glide(id){const el=document.getElementById(id);const [dx,dy]=dxy(el);
  el.animate([{transform:\`translate(\${-dx}px,\${-dy}px)\`},{transform:'translate(0,0)'}],{duration:${180},easing:'ease-out'});}
function recoil(id){const el=document.getElementById(id);const [dx,dy]=dxy(el);
  el.animate([{transform:'translate(0,0)'},{transform:\`translate(\${dx*FRAC}px,\${dy*FRAC}px)\`,offset:.4},{transform:'translate(0,0)'}],{duration:${220},easing:'ease-in-out'});}
function fade(id){const el=document.getElementById(id);const [dx,dy]=dxy(el);
  el.animate([{transform:'translate(0,0)',opacity:1},{transform:\`translate(\${dx}px,\${dy}px)\`,opacity:0}],{duration:${260},easing:'ease-in',fill:'forwards'});}
function reset(){['blue','green','orange'].forEach(id=>{const el=document.getElementById(id);el.getAnimations().forEach(a=>a.cancel());el.style.opacity=1;});}
</script>
</body></html>`;

writeFileSync(new URL('../doc/animation-preview.html', import.meta.url), html);
console.log('OK -> doc/animation-preview.html');
