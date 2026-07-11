import { Preferences } from '@capacitor/preferences';
import { type ITutorialPreference } from '../../application/ports/ITutorialPreference';

/**
 * Implementación de ITutorialPreference sobre @capacitor/preferences (mismo
 * mecanismo que CapacitorAudioPreferences / CapacitorLanguagePreference). El
 * proyecto NO usa localStorage: la persistencia clave-valor va siempre por aquí.
 *
 * Guarda una marca simple ('1') cuando el tutorial se completa; cualquier valor
 * presente cuenta como "ya visto".
 */
export class CapacitorTutorialPreference implements ITutorialPreference {
  private readonly TUTORIAL_KEY = 'tutorial_completed';

  async isCompleted(): Promise<boolean> {
    try {
      const { value } = await Preferences.get({ key: this.TUTORIAL_KEY });
      return value !== null;
    } catch (error) {
      // Ante un fallo de lectura tratamos el tutorial como YA visto: es preferible
      // no molestar con la guía que arriesgar un bucle que la muestre siempre.
      console.error('[CapacitorTutorialPreference] Error leyendo el estado del tutorial:', error);
      return true;
    }
  }

  async markCompleted(): Promise<void> {
    await Preferences.set({ key: this.TUTORIAL_KEY, value: '1' });
  }
}
