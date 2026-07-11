/**
 * Puerto de persistencia del estado del tutorial (mismo patrón que
 * IAudioPreferences / ILanguagePreferenceProvider: la aplicación define el
 * contrato, la infraestructura lo implementa con Capacitor Preferences).
 *
 * El tutorial guiado del primer nivel solo debe mostrarse LA PRIMERA VEZ; este
 * puerto recuerda si el jugador ya lo completó, de forma persistente entre
 * sesiones.
 */
export interface ITutorialPreference {
  /** ¿El jugador ya completó el tutorial guiado? */
  isCompleted(): Promise<boolean>;
  /** Marca el tutorial como completado para que no vuelva a aparecer. */
  markCompleted(): Promise<void>;
}
