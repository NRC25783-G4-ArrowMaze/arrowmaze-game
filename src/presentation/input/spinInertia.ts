/**
 * SpinInertia — Inercia del orbit del MODO CUBO (diseño aprobado, ajuste 3):
 * soltar el drag con velocidad → el cubo sigue girando con el impulso y
 * desacelera con damping exponencial hasta parar; soltar sin velocidad → se
 * queda quieto. El timer del idle (~3s) corre DESDE que la inercia muere —
 * el llamador mantiene su lastInteraction fresco mientras isAlive.
 *
 * Pura (sin DOM ni three): consume deltas angulares ya aplicados y timestamps.
 */

export interface InertiaConfig {
  /** Ventana de muestreo hacia atrás para estimar la velocidad al soltar (ms). */
  sampleWindowMs: number;
  /** Constante del decaimiento exponencial (1/s). Mayor = frena antes. */
  damping: number;
  /** Velocidad angular mínima (rad/s): por debajo, la inercia muere. */
  minSpeed: number;
  /** Tope de velocidad angular al soltar (rad/s). */
  maxSpeed: number;
}

export const DEFAULT_INERTIA: InertiaConfig = {
  sampleWindowMs: 90,
  damping: 3.0,
  minSpeed: 0.03,
  maxSpeed: 7,
};

interface Sample {
  dYaw: number;
  dPitch: number;
  timeMs: number;
}

export class SpinInertia {
  private readonly config: InertiaConfig;
  private samples: Sample[] = [];
  private vYaw = 0;
  private vPitch = 0;
  private alive = false;

  constructor(config: InertiaConfig = DEFAULT_INERTIA) {
    this.config = config;
  }

  get isAlive(): boolean {
    return this.alive;
  }

  /** Registra un delta angular aplicado durante el drag. */
  addSample(dYaw: number, dPitch: number, timeMs: number): void {
    this.samples.push({ dYaw, dPitch, timeMs });
    const cutoff = timeMs - this.config.sampleWindowMs;
    while (this.samples.length > 0 && this.samples[0].timeMs < cutoff) {
      this.samples.shift();
    }
  }

  /**
   * Suelta el drag: estima la velocidad angular con los deltas de la ventana
   * reciente. Sin muestras recientes (o velocidad ínfima) no hay inercia.
   */
  release(timeMs: number): void {
    const cutoff = timeMs - this.config.sampleWindowMs;
    const recent = this.samples.filter((s) => s.timeMs >= cutoff);
    this.samples = [];
    if (recent.length === 0) {
      this.alive = false;
      return;
    }
    const spanMs = Math.max(timeMs - recent[0].timeMs, 16);
    let sumYaw = 0;
    let sumPitch = 0;
    for (const s of recent) {
      sumYaw += s.dYaw;
      sumPitch += s.dPitch;
    }
    const scale = 1000 / spanMs;
    const clamp = (v: number): number =>
      Math.max(-this.config.maxSpeed, Math.min(this.config.maxSpeed, v));
    this.vYaw = clamp(sumYaw * scale);
    this.vPitch = clamp(sumPitch * scale);
    this.alive = Math.hypot(this.vYaw, this.vPitch) >= this.config.minSpeed;
    if (!this.alive) {
      this.vYaw = 0;
      this.vPitch = 0;
    }
  }

  /**
   * Avanza un frame: devuelve el delta angular a aplicar, o null si la
   * inercia está muerta. Decae exponencialmente y muere bajo minSpeed.
   */
  step(dtSeconds: number): { dYaw: number; dPitch: number } | null {
    if (!this.alive) {
      return null;
    }
    const decay = Math.exp(-this.config.damping * dtSeconds);
    const dYaw = this.vYaw * dtSeconds;
    const dPitch = this.vPitch * dtSeconds;
    this.vYaw *= decay;
    this.vPitch *= decay;
    if (Math.hypot(this.vYaw, this.vPitch) < this.config.minSpeed) {
      this.alive = false;
      this.vYaw = 0;
      this.vPitch = 0;
    }
    return { dYaw, dPitch };
  }

  /** Mata la inercia (nuevo pointerdown la agarra, cortesía cancelada, etc.). */
  cancel(): void {
    this.alive = false;
    this.vYaw = 0;
    this.vPitch = 0;
    this.samples = [];
  }
}
