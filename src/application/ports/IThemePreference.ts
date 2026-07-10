/**
 * Puerto de persistencia de la preferencia de tema de la UI (modo oscuro).
 *
 * Mismo patrón que ILanguagePreferenceProvider: la aplicación define el
 * contrato y la infraestructura lo implementa (Capacitor Preferences en
 * cliente). El tema es asunto de presentación; este puerto solo persiste la
 * elección para que prevalezca sobre prefers-color-scheme en próximos
 * arranques.
 */
export interface IThemePreference {
  /** Devuelve el tema guardado (p.ej. "light"/"dark"), o null si nunca se eligió. */
  getTheme(): Promise<string | null>;

  /** Persiste el tema elegido por el usuario. */
  setTheme(theme: string): Promise<void>;
}
