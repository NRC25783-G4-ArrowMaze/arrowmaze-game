/**
 * idleSpin — Rampa de la rotación automática del MODO CUBO.
 *
 * Diseño aprobado: giro lento continuo que se PAUSA al primer pointerdown y se
 * reanuda solo tras ~3s sin interacción, con arranque suave (easing), no de
 * golpe. Esta función es la curva pura: dado el tiempo transcurrido desde la
 * última interacción, devuelve la velocidad angular (rad/s) que corresponde.
 */

export interface IdleSpinConfig {
  /** Silencio tras la última interacción antes de empezar a girar (ms). */
  delayMs: number;
  /** Duración de la rampa de arranque suave hasta velocidad plena (ms). */
  rampMs: number;
  /** Velocidad angular de crucero (rad/s). */
  maxSpeed: number;
}

export const DEFAULT_IDLE_SPIN: IdleSpinConfig = {
  delayMs: 3000,
  rampMs: 1200,
  maxSpeed: 0.25,
};

/**
 * Velocidad angular en función del tiempo desde la última interacción.
 * 0 durante el delay; ease-in cuadrático durante la rampa; crucero después.
 */
export function idleAngularVelocity(
  elapsedSinceInteractionMs: number,
  config: IdleSpinConfig = DEFAULT_IDLE_SPIN,
): number {
  const t = elapsedSinceInteractionMs - config.delayMs;
  if (t <= 0) {
    return 0;
  }
  if (t >= config.rampMs) {
    return config.maxSpeed;
  }
  const progress = t / config.rampMs;
  return config.maxSpeed * progress * progress;
}
