import React from 'react';
import { useTranslation } from '../i18n/I18nContext';
import { SUPPORTED_LANGUAGES, type Lang } from '../i18n/i18n';
import { useTheme } from '../theming/ThemeContext';
import { SUPPORTED_THEMES, type ThemeMode } from '../theming/themeMode';
import { useAudioContext } from '../audio/AudioContext';
import { AUDIO_CREDITS } from '../audio/audioCredits';

/** Props del overlay de ajustes (C4). */
export interface SettingsOverlayProps {
  /** El caller decide: true cuando el tope de la pila de flujo (C1) es 'SETTINGS'. */
  visible: boolean;
  /** Desapila SETTINGS: vuelve a PAUSED, nunca directo a ACTIVE. */
  onClose: () => void;
}

/** Etiqueta (endónimo) de cada idioma en el selector; sale del catálogo. */
const LANGUAGE_LABEL_KEY: Record<Lang, string> = {
  es: 'settings.language.es',
  en: 'settings.language.en',
};

/** Etiqueta de cada tema en el selector; sale del catálogo. */
const THEME_LABEL_KEY: Record<ThemeMode, string> = {
  light: 'settings.theme.light',
  dark: 'settings.theme.dark',
};

/**
 * SettingsOverlay — Contenedor de ajustes (C4). Aloja el selector de idioma
 * (G2, cambio en caliente + persistencia), el de tema (misma fuente de verdad
 * que el toggle del header, vía useTheme) y los controles de audio (G1: mute,
 * volúmenes independientes y créditos), todos vía sus contextos.
 */
export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ visible, onClose }) => {
  const { t, lang, setLang } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { prefs, setPrefs } = useAudioContext();

  if (!visible) {
    return null;
  }

  return (
    <div
      data-testid="settings-overlay"
      role="dialog"
      aria-label={t('settings.title')}
      className="overlay-backdrop"
    >
      <div className="overlay-card">
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{t('settings.title')}</div>
        <section style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '4px 0' }}>{t('settings.language.title')}</h3>
          <div data-testid="language-selector" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {SUPPORTED_LANGUAGES.map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={lang === code ? 'btn-primary' : undefined}
                style={{ minWidth: '90px' }}
              >
                {t(LANGUAGE_LABEL_KEY[code])}
              </button>
            ))}
          </div>
        </section>
        <section style={{ textAlign: 'center' }} data-testid="theme-settings">
          <h3 style={{ margin: '4px 0' }}>{t('settings.theme.title')}</h3>
          <div data-testid="theme-selector" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {SUPPORTED_THEMES.map((mode) => (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                aria-pressed={theme === mode}
                className={theme === mode ? 'btn-primary' : undefined}
                style={{ minWidth: '90px' }}
              >
                {t(THEME_LABEL_KEY[mode])}
              </button>
            ))}
          </div>
        </section>
        <section style={{ textAlign: 'center' }} data-testid="audio-settings">
          <h3 style={{ margin: '4px 0' }}>{t('settings.audio.title')}</h3>
          <label style={{ display: 'block', margin: '4px 0' }}>
            <input
              type="checkbox"
              checked={prefs.muted}
              onChange={(e) => setPrefs({ ...prefs, muted: e.target.checked })}
            />{' '}
            {t('settings.audio.mute')}
          </label>
          <label style={{ display: 'block', margin: '4px 0' }}>
            {t('settings.audio.sfxVolume')}{' '}
            <input
              type="range"
              min={0}
              max={100}
              value={prefs.sfxVolume}
              aria-label={t('settings.audio.sfxVolume')}
              onChange={(e) => setPrefs({ ...prefs, sfxVolume: Number(e.target.value) })}
            />
          </label>
          <label style={{ display: 'block', margin: '4px 0' }}>
            {t('settings.audio.musicVolume')}{' '}
            <input
              type="range"
              min={0}
              max={100}
              value={prefs.musicVolume}
              aria-label={t('settings.audio.musicVolume')}
              onChange={(e) => setPrefs({ ...prefs, musicVolume: Number(e.target.value) })}
            />
          </label>
          <details data-testid="audio-credits" style={{ marginTop: '8px' }}>
            <summary>{t('settings.audio.credits')}</summary>
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              {AUDIO_CREDITS.map((credit) => (
                <li key={credit.file}>
                  {credit.title} — {credit.author}
                  {credit.source.startsWith('http') ? (
                    <>
                      {' ('}
                      <a href={credit.source} target="_blank" rel="noopener noreferrer">
                        {credit.source}
                      </a>
                      {')'}
                    </>
                  ) : (
                    ` (${credit.source})`
                  )}
                </li>
              ))}
            </ul>
          </details>
        </section>
        <button onClick={onClose} style={{ minWidth: '180px' }}>
          {t('settings.back')}
        </button>
      </div>
    </div>
  );
};
