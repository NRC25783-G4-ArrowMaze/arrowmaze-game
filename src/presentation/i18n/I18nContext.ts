import { createContext, useContext } from 'react';
import { type Lang, type TranslateParams, translate } from './i18n';

export interface I18nContextValue {
  /** Idioma activo. */
  lang: Lang;
  /** Traduce una clave al idioma activo (con interpolación opcional). */
  t: (key: string, params?: TranslateParams) => string;
  /** Cambia el idioma en caliente (D3) y lo persiste (D2). */
  setLang: (lang: Lang) => void;
}

const DEFAULT_LANG: Lang = 'es';

/**
 * Contexto con un valor por defecto usable: permite que los componentes se
 * rendericen sin un Provider explícito, traduciendo al idioma por defecto.
 * (Vive aparte de I18nProvider para no romper react-refresh: un archivo de
 * componentes solo debe exportar componentes.)
 */
export const I18nContext = createContext<I18nContextValue>({
  lang: DEFAULT_LANG,
  t: (key, params) => translate(DEFAULT_LANG, key, params),
  setLang: () => undefined,
});

/** Hook de traducción: expone { lang, t, setLang } del contexto activo. */
export const useTranslation = (): I18nContextValue => useContext(I18nContext);
