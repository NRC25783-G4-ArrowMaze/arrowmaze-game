import React from 'react';
import { useTranslation } from '../i18n/I18nContext';
import { SUPPORTED_LANGUAGES, type Lang } from '../i18n/i18n';

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

/**
 * SettingsOverlay — Contenedor de ajustes (C4). Aloja el selector de idioma
 * (G2): cambia el idioma en caliente (D3) y persiste la preferencia (D2) vía el
 * contexto i18n. El estado de audio (G1) sigue como placeholder.
 */
export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ visible, onClose }) => {
  const { t, lang, setLang } = useTranslation();

  if (!visible) {
    return null;
  }

  return (
    <div
      data-testid="settings-overlay"
      role="dialog"
      aria-label={t('settings.title')}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '12px',
      }}
    >
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#374151' }}>{t('settings.title')}</div>
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
      <section style={{ textAlign: 'center' }}>
        <h3 style={{ margin: '4px 0' }}>{t('settings.audio.title')}</h3>
        <p style={{ margin: 0, color: '#6b7280' }}>{t('settings.comingSoon')}</p>
      </section>
      <button onClick={onClose} style={{ minWidth: '180px' }}>
        {t('settings.back')}
      </button>
    </div>
  );
};
