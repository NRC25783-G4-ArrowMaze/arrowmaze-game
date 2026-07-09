/**
 * Puerto de persistencia de la preferencia de idioma de la UI (G2, D2).
 *
 * Mismo patrón que IAuthTokenProvider: la aplicación define el contrato y la
 * infraestructura lo implementa (Capacitor Preferences en cliente). La i18n es
 * asunto de presentación; este puerto solo persiste la elección a nivel de
 * usuario para que prevalezca sobre el locale del dispositivo en próximos
 * arranques.
 */
export interface ILanguagePreferenceProvider {
  /** Devuelve el idioma guardado (p.ej. "es"/"en"), o null si nunca se eligió. */
  getLanguage(): Promise<string | null>;

  /** Persiste el idioma elegido por el usuario. */
  setLanguage(lang: string): Promise<void>;
}
