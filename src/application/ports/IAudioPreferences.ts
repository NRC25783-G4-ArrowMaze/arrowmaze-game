/** Preferencias de audio del usuario (volúmenes en 0–100). */
export interface AudioPreferences {
  muted: boolean;
  sfxVolume: number;
  musicVolume: number;
}

/**
 * Puerto de persistencia de las preferencias de audio (G1, D1). Mismo patrón
 * que ILanguagePreferenceProvider: la aplicación define el contrato, la
 * infraestructura lo implementa (Capacitor Preferences). El audio es solo de
 * presentación; este puerto solo persiste la elección del usuario.
 */
export interface IAudioPreferences {
  /** Devuelve las preferencias guardadas, o null si nunca se configuraron. */
  getAudioPreferences(): Promise<AudioPreferences | null>;
  /** Persiste las preferencias del usuario. */
  setAudioPreferences(prefs: AudioPreferences): Promise<void>;
}
