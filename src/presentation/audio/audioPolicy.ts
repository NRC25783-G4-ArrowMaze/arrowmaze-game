import type { AdvanceOutcome } from '../../domain/value-objects/AdvanceResult';
import type { AudioPreferences } from '../../application/ports/IAudioPreferences';

export type { AudioPreferences };

/** Efectos de sonido empaquetados (nombres de archivo en public/audio/sfx). */
export type SfxId = 'advanced' | 'blocked' | 'exited' | 'won' | 'lost';

/** Pistas de música del pool (public/audio/music). */
export type MusicTrack = 'easy' | 'medium' | 'hard';

/** Preferencias por defecto (D1): sin mute, SFX 80, música 50. */
export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  muted: false,
  sfxVolume: 80,
  musicVolume: 50,
};

/**
 * SFX asociado a un outcome del motor (D2). El dominio usa 'destroyed' para la
 * salida por sumidero; el spec lo llama 'exited'.
 *   advanced → advanced · blocked → blocked · destroyed → exited
 */
export function sfxForOutcome(outcome: AdvanceOutcome): SfxId {
  switch (outcome) {
    case 'advanced':
      return 'advanced';
    case 'blocked':
      return 'blocked';
    case 'destroyed':
      return 'exited';
  }
}

/** Prioridad de outcomes en un mismo tick: exited (destroyed) > blocked > advanced. */
const OUTCOME_PRIORITY: Record<AdvanceOutcome, number> = {
  destroyed: 3,
  blocked: 2,
  advanced: 1,
};

/**
 * Elige un ÚNICO outcome cuando un tick produce varios (varias flechas): el de
 * mayor prioridad, para no encimar más de un SFX por tick (spec: "a lo sumo una
 * emisión por tipo dentro del mismo tick"). Devuelve null si no hay outcomes.
 */
export function prioritizeOutcome(outcomes: readonly AdvanceOutcome[]): AdvanceOutcome | null {
  let best: AdvanceOutcome | null = null;
  for (const outcome of outcomes) {
    if (best === null || OUTCOME_PRIORITY[outcome] > OUTCOME_PRIORITY[best]) {
      best = outcome;
    }
  }
  return best;
}

/**
 * Pista de música según la dificultad del nivel (D3, pool de 3). veryHard reusa
 * 'hard'; cualquier dificultad sin pista asignada cae a la pista por defecto ('easy').
 */
export function trackForDifficulty(difficulty: string | undefined): MusicTrack {
  switch (difficulty) {
    case 'easy':
      return 'easy';
    case 'medium':
      return 'medium';
    case 'hard':
    case 'veryHard':
      return 'hard';
    default:
      return 'easy';
  }
}

/**
 * Ganancia efectiva 0–1 para el elemento de audio. El mute global fuerza 0 sin
 * borrar el volumen base (D1); si no, es volumen/100 con clamp a [0,100].
 */
export function effectiveGain(volume: number, muted: boolean): number {
  if (muted) {
    return 0;
  }
  const clamped = Math.min(100, Math.max(0, volume));
  return clamped / 100;
}

/** Puerta de autoplay (D4): nada suena antes de la primera interacción del usuario. */
export function canPlay(unlocked: boolean): boolean {
  return unlocked;
}
