import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { type IAudioPreferences, type AudioPreferences } from '../../application/ports/IAudioPreferences';
import { CapacitorAudioPreferences } from '../../infrastructure/audio/CapacitorAudioPreferences';
import { type IAudioEngine, AudioEngine } from './AudioEngine';
import { AudioContext, type AudioContextValue } from './AudioContext';
import { DEFAULT_AUDIO_PREFERENCES } from './audioPolicy';

interface AudioProviderProps {
  children: ReactNode;
  /** Puerto de persistencia (D1). CapacitorAudioPreferences por defecto. */
  preferenceProvider?: IAudioPreferences;
  /** Motor de audio. AudioEngine real por defecto; inyectable en tests. */
  engine?: IAudioEngine;
  /** Estado inicial de desbloqueo (tests). En producción se desbloquea al interactuar. */
  initialUnlocked?: boolean;
}

/**
 * AudioProvider — carga las preferencias de audio al arrancar (antes de sonar),
 * las persiste al cambiar (D1) y desbloquea el autoplay tras la primera
 * interacción del usuario (D4). Mismo patrón que I18nProvider.
 */
export const AudioProvider: React.FC<AudioProviderProps> = ({
  children,
  preferenceProvider,
  engine,
  initialUnlocked,
}) => {
  const [provider] = useState<IAudioPreferences>(() => preferenceProvider ?? new CapacitorAudioPreferences());
  const [audioEngine] = useState<IAudioEngine>(() => engine ?? new AudioEngine());
  const [prefs, setPrefsState] = useState<AudioPreferences>(DEFAULT_AUDIO_PREFERENCES);
  const [unlocked, setUnlocked] = useState<boolean>(initialUnlocked ?? false);

  // Carga las preferencias guardadas al arrancar (se aplican antes de reproducir).
  useEffect(() => {
    let mounted = true;
    provider
      .getAudioPreferences()
      .then((saved) => {
        if (mounted && saved !== null) setPrefsState(saved);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [provider]);

  // Desbloqueo de autoplay: primera interacción del usuario (D4).
  useEffect(() => {
    if (unlocked) return;
    const unlock = (): void => setUnlocked(true);
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [unlocked]);

  const setPrefs = useCallback(
    (next: AudioPreferences) => {
      setPrefsState(next);
      provider.setAudioPreferences(next).catch((error: unknown) =>
        console.error('[AudioProvider] Error persistiendo preferencias de audio:', error),
      );
    },
    [provider],
  );

  const value = useMemo<AudioContextValue>(
    () => ({ prefs, setPrefs, engine: audioEngine, unlocked }),
    [prefs, setPrefs, audioEngine, unlocked],
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};
