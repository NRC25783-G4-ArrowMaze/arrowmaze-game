import { createContext, useContext } from 'react';
import type { AudioPreferences } from '../../application/ports/IAudioPreferences';
import type { IAudioEngine } from './AudioEngine';
import { DEFAULT_AUDIO_PREFERENCES } from './audioPolicy';

export interface AudioContextValue {
  /** Preferencias de audio activas (mute, volúmenes). */
  prefs: AudioPreferences;
  /** Actualiza y persiste las preferencias (aplica en caliente). */
  setPrefs: (prefs: AudioPreferences) => void;
  /** Motor de audio compartido. */
  engine: IAudioEngine;
  /** Autoplay desbloqueado tras la primera interacción (D4). */
  unlocked: boolean;
}

/** Motor no-op para el valor por defecto del contexto (sin Provider / en tests). */
const NOOP_ENGINE: IAudioEngine = {
  playSfx: () => undefined,
  playMusic: () => undefined,
  pauseMusic: () => undefined,
  resumeMusic: () => undefined,
  stopMusic: () => undefined,
  setMusicGain: () => undefined,
};

/**
 * Contexto de audio con valor por defecto usable (permite renderizar componentes
 * sin Provider, p. ej. en tests). Vive aparte de AudioProvider para no romper
 * react-refresh (un archivo de componentes solo exporta componentes).
 */
export const AudioContext = createContext<AudioContextValue>({
  prefs: DEFAULT_AUDIO_PREFERENCES,
  setPrefs: () => undefined,
  engine: NOOP_ENGINE,
  unlocked: false,
});

/** Hook de audio: expone { prefs, setPrefs, engine, unlocked }. */
export const useAudioContext = (): AudioContextValue => useContext(AudioContext);
