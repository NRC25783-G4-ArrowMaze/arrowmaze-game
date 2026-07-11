import { Preferences } from '@capacitor/preferences';
import { type ILanguagePreferenceProvider } from '../../application/ports/ILanguagePreferenceProvider';

/**
 * Implementación de ILanguagePreferenceProvider sobre @capacitor/preferences
 * (mismo mecanismo de almacenamiento que CapacitorTokenProvider).
 */
export class CapacitorLanguagePreference implements ILanguagePreferenceProvider {
  private readonly LANGUAGE_KEY = 'ui_language_preference';

  async getLanguage(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: this.LANGUAGE_KEY });
      return value;
    } catch (error) {
      console.error('[CapacitorLanguagePreference] Error leyendo la preferencia de idioma:', error);
      return null;
    }
  }

  async setLanguage(lang: string): Promise<void> {
    await Preferences.set({
      key: this.LANGUAGE_KEY,
      value: lang,
    });
  }
}
