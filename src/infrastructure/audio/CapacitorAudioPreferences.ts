import { Preferences } from '@capacitor/preferences';
import { type IAudioPreferences, type AudioPreferences } from '../../application/ports/IAudioPreferences';

/**
 * Implementación de IAudioPreferences sobre @capacitor/preferences (mismo
 * mecanismo que CapacitorLanguagePreference / CapacitorTokenProvider). Serializa
 * las preferencias como JSON.
 */
export class CapacitorAudioPreferences implements IAudioPreferences {
  private readonly AUDIO_KEY = 'audio_preferences';

  async getAudioPreferences(): Promise<AudioPreferences | null> {
    try {
      const { value } = await Preferences.get({ key: this.AUDIO_KEY });
      if (value === null) {
        return null;
      }
      const parsed = JSON.parse(value) as Partial<AudioPreferences>;
      // Validación defensiva: si el payload está corrupto, tratamos como "sin preferencia".
      if (
        typeof parsed.muted !== 'boolean' ||
        typeof parsed.sfxVolume !== 'number' ||
        typeof parsed.musicVolume !== 'number'
      ) {
        return null;
      }
      return { muted: parsed.muted, sfxVolume: parsed.sfxVolume, musicVolume: parsed.musicVolume };
    } catch (error) {
      console.error('[CapacitorAudioPreferences] Error leyendo las preferencias de audio:', error);
      return null;
    }
  }

  async setAudioPreferences(prefs: AudioPreferences): Promise<void> {
    await Preferences.set({ key: this.AUDIO_KEY, value: JSON.stringify(prefs) });
  }
}
