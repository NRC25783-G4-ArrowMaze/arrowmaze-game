/**
 * glideConfig — Diales de la animación de deslizamiento. Todo cosmético: no
 * afecta al dominio ni al ritmo del juego (TICK_MS).
 */

/**
 * GLIDE_SPEED — Velocidad de la animación del slide, en CELDAS/segundo. Dial
 * independiente del ritmo del dominio: como la forma persigue un `target` que
 * avanza una celda por tick, bajar esta velocidad solo hace que la animación se
 * rezague en vuelo y alcance al final, sin tocar TICK_MS ni ninguna regla.
 *
 * Default = 1000 / TICK_MS (TICK_MS = 90 en useGameController) ≈ 11.1 celdas/s,
 * es decir exactamente una celda por tick (paridad de velocidad con el ritmo).
 */
export const GLIDE_SPEED = 1000 / 90;
