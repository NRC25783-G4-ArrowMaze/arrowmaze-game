import React from 'react';
import { useTranslation } from '../i18n/I18nContext';

/** Props del overlay de pausa (C4). */
export interface PauseOverlayProps {
  /** El caller decide: true cuando el tope de la pila de flujo (C1) es 'PAUSED'. */
  visible: boolean;
  /** Desapila PAUSED y retoma la partida donde quedó. */
  onResume: () => void;
  /** Descarta la partida actual y arranca una fresca sobre la misma escena. */
  onRestart: () => void;
  /** Apila SETTINGS sobre PAUSED. */
  onOpenSettings: () => void;
  /**
   * Navega fuera de la partida (vuelve a la selección de niveles, C3).
   * No transiciona GameFlowController: la partida se descarta al desmontar.
   */
  onExit: () => void;
}

/**
 * PauseOverlay — Overlay de pausa (C4). Mismo patrón visual que GameOverlay:
 * modal a pantalla completa (.overlay-backdrop/.overlay-card), sin librería de UI.
 */
export const PauseOverlay: React.FC<PauseOverlayProps> = ({
  visible,
  onResume,
  onRestart,
  onOpenSettings,
  onExit,
}) => {
  const { t } = useTranslation();

  if (!visible) {
    return null;
  }

  return (
    <div
      data-testid="pause-overlay"
      role="dialog"
      aria-label={t('pause.title')}
      className="overlay-backdrop"
    >
      <div className="overlay-card">
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#374151' }}>{t('pause.title')}</div>
        <button className="btn-primary" onClick={onResume} style={{ minWidth: '180px' }}>
          {t('pause.resume')}
        </button>
        <button onClick={onRestart} style={{ minWidth: '180px' }}>
          {t('pause.restart')}
        </button>
        <button onClick={onOpenSettings} style={{ minWidth: '180px' }}>
          {t('pause.settings')}
        </button>
        <button onClick={onExit} style={{ minWidth: '180px' }}>
          {t('pause.exit')}
        </button>
      </div>
    </div>
  );
};
