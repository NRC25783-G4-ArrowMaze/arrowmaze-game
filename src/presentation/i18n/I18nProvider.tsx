import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { type Lang, resolveInitialLanguage, translate } from './i18n';
import { I18nContext, type I18nContextValue } from './I18nContext';
import type { ILanguagePreferenceProvider } from '../../application/ports/ILanguagePreferenceProvider';

interface I18nProviderProps {
  children: ReactNode;
  /** Puerto de persistencia de la preferencia (D2). Opcional para tests. */
  preferenceProvider?: ILanguagePreferenceProvider;
  /** Idioma inicial explícito (tests): salta la resolución por preferencia/locale. */
  initialLang?: Lang;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  preferenceProvider,
  initialLang,
}) => {
  // Resolución síncrona con el locale del dispositivo; la preferencia guardada
  // (async) prevalece en el efecto de abajo si existe (D2).
  const [lang, setLangState] = useState<Lang>(
    () =>
      initialLang ??
      resolveInitialLanguage(null, typeof navigator !== 'undefined' ? navigator.language : 'en'),
  );

  useEffect(() => {
    if (initialLang !== undefined || preferenceProvider === undefined) return;
    let mounted = true;
    preferenceProvider
      .getLanguage()
      .then((saved) => {
        if (!mounted) return;
        const device = typeof navigator !== 'undefined' ? navigator.language : 'en';
        setLangState(resolveInitialLanguage(saved, device));
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [preferenceProvider, initialLang]);

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      preferenceProvider?.setLanguage(next).catch((error: unknown) =>
        console.error('[I18nProvider] Error persistiendo la preferencia de idioma:', error),
      );
    },
    [preferenceProvider],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      t: (key, params) => translate(lang, key, params),
      setLang,
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
