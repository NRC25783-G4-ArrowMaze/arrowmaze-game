/**
 * themeMode — Tipos y resolución pura del tema de la UI.
 *
 * Vive en `theming/` (no `theme/`) para no chocar con `presentation/theme.ts`,
 * que centraliza las constantes visuales del tablero SVG.
 */

/**
 * Temas soportados: 2 opciones sin "sistema" (decisión consciente: elegir
 * manualmente una vez desactiva el seguimiento del SO para siempre — el
 * selector de idioma sienta el mismo precedente de 2 botones).
 */
export type ThemeMode = 'light' | 'dark';

export const SUPPORTED_THEMES: readonly ThemeMode[] = ['light', 'dark'];

/**
 * Tema inicial: la preferencia guardada prevalece; si no hay (o está
 * corrupta), decide el sistema (prefers-color-scheme); el fallback es claro.
 */
export function resolveInitialTheme(saved: string | null, systemPrefersDark: boolean): ThemeMode {
  if (saved === 'light' || saved === 'dark') return saved;
  return systemPrefersDark ? 'dark' : 'light';
}
