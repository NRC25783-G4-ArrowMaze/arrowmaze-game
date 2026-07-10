import { Preferences } from '@capacitor/preferences';
import { type IThemePreference } from '../../application/ports/IThemePreference';

/**
 * Implementación de IThemePreference sobre @capacitor/preferences (mismo
 * mecanismo de almacenamiento que CapacitorLanguagePreference).
 */
export class CapacitorThemePreference implements IThemePreference {
  private readonly THEME_KEY = 'ui_theme_preference';

  async getTheme(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: this.THEME_KEY });
      return value;
    } catch (error) {
      console.error('[CapacitorThemePreference] Error leyendo la preferencia de tema:', error);
      return null;
    }
  }

  async setTheme(theme: string): Promise<void> {
    await Preferences.set({
      key: this.THEME_KEY,
      value: theme,
    });
  }
}
