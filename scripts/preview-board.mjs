// Preview generator — reproduce EXACTAMENTE el SVG que pinta BoardComponent
// (misma matemática de layout y mismas constantes de theme), para tener un
// artefacto .svg abrible sin levantar el dev server. Solo es una ayuda visual.

import { writeFileSync } from 'node:fs';

// ── Constantes (espejo de src/presentation/theme.ts) ──
const BOARD_BACKGROUND = '#ffffff';
const DOT_COLOR = '#d3d7e0';
const DOT_RADIUS_RATIO = 0.09;
const BODY_STROKE_RATIO = 0.38;
const HEAD_TIP_RATIO = 0.5;
const HEAD_BACK_RATIO = 0.32;
const HEAD_HALF_BASE_RATIO = 0.36;

// ── Layout (espejo de boardLayout.ts) ──
const computeCellSize = (maxCol, maxRow, W, H) =>
  Math.max(0, Math.floor(Math.min(W / (maxCol + 1), H / (maxRow + 1))));
const computeOffset = (maxCol, maxRow, cs, W, H) => ({
  x: (W - maxCol * cs) / 2,
  y: (H - maxRow * cs) / 2,
});
const cellCenter = (col, row, cs, off) => ({ x: col * cs + off.x, y: row * cs + off.y });
const portDelta = (p) =>
  [{ dCol: 0, dRow: -1 }, { dCol: 1, dRow: 0 }, { dCol: 0, dRow: 1 }, { dCol: -1, dRow: 0 }][p];

// ── DEMO_BOARD (espejo de App.tsx) ──
const cells = Array.from({ length: 36 }, (_, i) => ({ col: i % 6, row: Math.floor(i / 6) }));
// Espejo de SAMPLE_LEVEL (presentation/game/sampleLevel.ts): head primero.
const arrows = [
  { color: '#3b82f6', cellIds: ['4,2', '4,1'], exitDir: 0 }, // blue → N
  { color: '#22c55e', cellIds: ['1,2'], exitDir: 1 }, // green → E (solo cabeza)
  { color: '#f97316', cellIds: ['2,2', '2,3'], exitDir: 2 }, // orange → S
];
const byId = new Map(cells.map((c) => [`${c.col},${c.row}`, c]));

const W = 420, H = 420;
const maxCol = Math.max(...cells.map((c) => c.col));
const maxRow = Math.max(...cells.map((c) => c.row));
const cs = computeCellSize(maxCol, maxRow, W, H);
const off = computeOffset(maxCol, maxRow, cs, W, H);
const dotR = cs * DOT_RADIUS_RATIO;

// Pasada 1: grilla de puntos
let dots = '';
for (let row = 0; row <= maxRow; row++)
  for (let col = 0; col <= maxCol; col++) {
    const c = cellCenter(col, row, cs, off);
    dots += `<circle cx="${c.x}" cy="${c.y}" r="${dotR}" fill="${DOT_COLOR}"/>`;
  }

// Pasada 2: flechas
let arrowSvg = '';
for (const a of arrows) {
  const centers = a.cellIds.map((id) => byId.get(id)).map((c) => cellCenter(c.col, c.row, cs, off));
  const [first, ...rest] = centers;
  const d = rest.length
    ? `M ${first.x},${first.y} ${rest.map((p) => `L ${p.x},${p.y}`).join(' ')}`
    : `M ${first.x},${first.y} L ${first.x},${first.y}`;
  // Punta en la celda LÍDER (último centro), orientada por el último tramo del shaft.
  const lead = centers[centers.length - 1];
  let dCol, dRow;
  if (centers.length >= 2) {
    const p = centers[centers.length - 2];
    const vx = lead.x - p.x, vy = lead.y - p.y;
    const len = Math.hypot(vx, vy) || 1;
    dCol = vx / len; dRow = vy / len;
  } else {
    ({ dCol, dRow } = portDelta(a.exitDir));
  }
  const perpX = -dRow, perpY = dCol;
  const tip = HEAD_TIP_RATIO * cs, back = HEAD_BACK_RATIO * cs, half = HEAD_HALF_BASE_RATIO * cs;
  const apex = { x: lead.x + dCol * tip, y: lead.y + dRow * tip };
  const bm = { x: lead.x - dCol * back, y: lead.y - dRow * back };
  const L = { x: bm.x + perpX * half, y: bm.y + perpY * half };
  const R = { x: bm.x - perpX * half, y: bm.y - perpY * half };
  arrowSvg +=
    `<path d="${d}" fill="none" stroke="${a.color}" stroke-width="${BODY_STROKE_RATIO * cs}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<polygon points="${apex.x},${apex.y} ${L.x},${L.y} ${R.x},${R.y}" fill="${a.color}"/>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
  `<rect x="0" y="0" width="${W}" height="${H}" fill="${BOARD_BACKGROUND}"/>` +
  dots + arrowSvg + `</svg>`;

writeFileSync(new URL('../doc/board-preview.svg', import.meta.url), svg);
console.log(`OK -> doc/board-preview.svg  (cellSize=${cs}, dots=${(maxCol + 1) * (maxRow + 1)})`);
