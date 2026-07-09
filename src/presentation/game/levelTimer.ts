import type { IClock } from '../../application/ports/IClock';

/**
 * LevelTimer — cuenta el TIEMPO ACTIVO de un nivel (G3): segundos con la partida
 * en IN_PROGRESS y la UI fuera de PAUSED. Cuenta hacia arriba, nunca causa
 * derrota y no toca el dominio; es una proyección de presentación.
 *
 * El tiempo se lee siempre a través de un IClock inyectado, así que su
 * comportamiento es determinista y testeable con un reloj falso. La clave para
 * evitar el bug clásico del temporizador: el tramo en pausa NO se acumula.
 */
export class LevelTimer {
  private accumulatedMs = 0;
  private runningSince: number | null = null;
  private readonly clock: IClock;

  constructor(clock: IClock) {
    this.clock = clock;
  }

  /** Arranca o reanuda la cuenta. No-op si ya está corriendo. */
  start(): void {
    if (this.runningSince === null) {
      this.runningSince = this.clock.now();
    }
  }

  /**
   * Congela la cuenta conservando el acumulado (pausa C4 o estado terminal
   * WON/LOST). El tiempo de reloj que transcurra mientras está congelado no
   * cuenta como tiempo activo.
   */
  pause(): void {
    if (this.runningSince !== null) {
      this.accumulatedMs += this.clock.now() - this.runningSince;
      this.runningSince = null;
    }
  }

  /** Reinicia el timer a cero (restart de nivel). */
  reset(): void {
    this.accumulatedMs = 0;
    this.runningSince = null;
  }

  /** Milisegundos activos acumulados (incluye el tramo en curso si corre). */
  elapsedMs(): number {
    const live = this.runningSince === null ? 0 : this.clock.now() - this.runningSince;
    return this.accumulatedMs + live;
  }

  /** Segundos activos (piso). Es lo que el display formatea. */
  elapsedSeconds(): number {
    return Math.floor(this.elapsedMs() / 1000);
  }

  /** True si la cuenta está corriendo (no pausada ni detenida). */
  get running(): boolean {
    return this.runningSince !== null;
  }
}

/**
 * Formatea segundos como mm:ss (D2). No contempla horas en v1: a los 60+
 * minutos `mm` sigue creciendo (60:00, 100:00), sin acarreo a horas.
 */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
