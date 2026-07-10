import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { type ThemeMode, resolveInitialTheme } from './themeMode';
import { ThemeContext, type ThemeContextValue } from './ThemeContext';
import type { IThemePreference } from '../../application/ports/IThemePreference';

interface ThemeProviderProps {
  children: ReactNode;
  /** Puerto de persistencia de la preferencia. Opcional para tests. */
  preferenceProvider?: IThemePreference;
  /** Tema inicial explícito (tests): salta la resolución por preferencia/sistema. */
  initialTheme?: ThemeMode;
}

/** true si el sistema pide oscuro; false también sin matchMedia (jsdom/tests). */
const systemPrefersDark = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  preferenceProvider,
  initialTheme,
}) => {
  // Resolución síncrona con prefers-color-scheme; la preferencia guardada
  // (async) prevalece en el efecto de abajo si existe (mismo esquema en dos
  // fases que I18nProvider).
  const [theme, setThemeState] = useState<ThemeMode>(
    () => initialTheme ?? resolveInitialTheme(null, systemPrefersDark()),
  );

  // Una elección explícita del usuario gana SIEMPRE: si toca el toggle antes
  // de que la lectura async del storage resuelva, esta no debe pisarla.
  const userChose = useRef(false);

  useEffect(() => {
    if (initialTheme !== undefined || preferenceProvider === undefined) return;
    let mounted = true;
    preferenceProvider
      .getTheme()
      .then((saved) => {
        if (!mounted || userChose.current) return;
        setThemeState(resolveInitialTheme(saved, systemPrefersDark()));
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [preferenceProvider, initialTheme]);

  // Cambio EN CALIENTE: el tema vive como atributo del root (<html data-theme>);
  // los tokens CSS —y el SVG del tablero vía var()— cambian sin re-render.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = useCallback(
    (next: ThemeMode) => {
      userChose.current = true;
      setThemeState(next);
      preferenceProvider?.setTheme(next).catch((error: unknown) =>
        console.error('[ThemeProvider] Error persistiendo la preferencia de tema:', error),
      );
    },
    [preferenceProvider],
  );

  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
