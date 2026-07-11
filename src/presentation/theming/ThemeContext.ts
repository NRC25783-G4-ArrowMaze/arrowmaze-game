import { createContext, useContext } from 'react';
import type { ThemeMode } from './themeMode';

export interface ThemeContextValue {
  /** Tema activo. */
  theme: ThemeMode;
  /** Cambia el tema en caliente y lo persiste. */
  setTheme: (theme: ThemeMode) => void;
}

/**
 * Contexto con un valor por defecto usable: permite que los componentes se
 * rendericen sin un Provider explícito, en tema claro. (Vive aparte de
 * ThemeProvider para no romper react-refresh.)
 */
export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => undefined,
});

/** Hook de tema: expone { theme, setTheme } del contexto activo. */
export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
