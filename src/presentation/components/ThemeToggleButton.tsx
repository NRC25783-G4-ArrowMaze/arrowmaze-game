import React from 'react';
import { useTheme } from '../theming/ThemeContext';
import { useTranslation } from '../i18n/I18nContext';

/**
 * ThemeToggleButton — Toggle de tema del header del mapa de selección.
 *
 * Glifos: emoji directo (☀️/🌙) — es el patrón que el #49 estableció para los
 * iconos de ese header (⚙️/👤) y rinde nítido en ambos temas sin assets.
 * El icono refleja el ESTADO ACTUAL (🌙 = oscuro activo); un tap alterna.
 * Misma fuente de verdad que el selector de Ajustes: ambos operan vía useTheme.
 */
export const ThemeToggleButton: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const dark = theme === 'dark';
  const label = dark ? t('theme.toggle.toLight') : t('theme.toggle.toDark');
  return (
    <button
      className="btn-icon"
      data-testid="theme-toggle"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={label}
      title={label}
      aria-pressed={dark}
    >
      <span aria-hidden="true">{dark ? '🌙' : '☀️'}</span>
    </button>
  );
};
