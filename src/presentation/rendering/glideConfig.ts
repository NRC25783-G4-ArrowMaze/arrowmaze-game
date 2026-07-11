/**
 * glideConfig — Diales de la animación de deslizamiento y de salida del tablero.
 * Todo cosmético: no afecta al dominio ni al ritmo del juego (TICK_MS).
 */

/**
 * GLIDE_SPEED — Velocidad de la animación del slide, en CELDAS/segundo. Dial
 * independiente del ritmo del dominio: como la forma persigue un `target` que
 * avanza una celda por tick, bajar esta velocidad solo hace que la animación se
 * rezague en vuelo y alcance al final, sin tocar TICK_MS ni ninguna regla.
 *
 * Default = 1000 / TICK_MS (TICK_MS = 90 en useGameController) ≈ 11.1 celdas/s,
 * es decir exactamente una celda por tick (paridad de velocidad con el ritmo).
 * La salida voladora viaja a ESTA misma velocidad (no acelera ni frena al borde).
 */
export const GLIDE_SPEED = 1000 / 90;

/**
 * EXIT_MARGIN_CELLS — Celdas EXTRA que la flecha vuela tras haber salido su
 * largo completo, para que termine de fundirse fuera del recorte del tablero.
 */
export const EXIT_MARGIN_CELLS = 2;

/**
 * Curva del fade de salida: opacidad 1 → 0 en función del progreso de la salida
 * (0 = arranca la salida, 1 = fin del vuelo).
 *  - EXIT_FADE_START: fracción del recorrido con opacidad plena antes de fundir.
 *  - EXIT_FADE_POWER: exponente de la curva (1 = lineal, >1 arranca suave).
 */
export const EXIT_FADE_START = 0.1;
export const EXIT_FADE_POWER = 1.2;

/**
 * Opacidad de la salida para un progreso `p ∈ [0,1]`. Pura y monótona no
 * creciente: 1 hasta EXIT_FADE_START, luego cae a 0 en p = 1.
 */
export function exitOpacity(p: number): number {
  const clamped = Math.max(0, Math.min(p, 1));
  if (clamped <= EXIT_FADE_START) {
    return 1;
  }
  const t = (clamped - EXIT_FADE_START) / (1 - EXIT_FADE_START);
  return Math.max(0, 1 - Math.pow(t, EXIT_FADE_POWER));
}
