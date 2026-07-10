import React from 'react';
import type { GameStatus } from '../../domain/entities/GameSession';
import { useTranslation } from '../i18n/I18nContext';
import { formatDuration } from '../game/levelTimer';

/** Props del overlay de fin de juego. */
export interface GameOverlayProps {
  /** Estado de la sesión. El overlay solo se muestra si es WON o LOST. */
  status: GameStatus;
  /** Puntaje final (presente solo al ganar). */
  score: number | null;
  /** Tiempo activo final del nivel en segundos (G3). Se muestra junto al score. */
  timeSeconds?: number;
  /**
   * Avanza directo al siguiente nivel del mapa (C3). Solo se ofrece al ganar
   * y si el caller lo provee (tras el último nivel no hay siguiente).
   */
  onNextLevel?: () => void;
  /** Vuelve al mapa de selección de niveles. */
  onBackToMap?: () => void;
}

/**
 * GameOverlay — Capa simple de fin de juego (B4).
 *
 * Se superpone al tablero cuando la sesión es terminal (WON/LOST) con un mensaje
 * claro y las acciones de continuación: al ganar, avanzar al siguiente nivel sin
 * pasar por el mapa (si existe) o volver al mapa. No gestiona vidas/corazones,
 * pantalla de inicio ni hints (grupo C, fuera de alcance). El bloqueo de input
 * en estado terminal lo hace la capa de input; la navegación la decide el caller.
 */
export const GameOverlay: React.FC<GameOverlayProps> = ({
  status,
  score,
  timeSeconds,
  onNextLevel,
  onBackToMap,
}) => {
  const { t } = useTranslation();

  if (status === 'IN_PROGRESS') {
    return null;
  }

  const won = status === 'WON';

  return (
    <div
      data-testid="game-overlay"
      role="alertdialog"
      aria-label={won ? t('overlay.aria.won') : t('overlay.aria.lost')}
      className="overlay-backdrop"
    >
      <div className="overlay-card">
        <div
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: won ? 'var(--success)' : 'var(--danger)',
          }}
        >
          {won ? t('overlay.victory.title') : t('overlay.defeat.title')}
        </div>
        {won && score !== null && (
          <div style={{ fontSize: '1rem', color: 'var(--text)' }}>
            {t('common.score', { score })}
          </div>
        )}
        {timeSeconds !== undefined && (
          <div data-testid="overlay-time" style={{ fontSize: '1rem', color: 'var(--text)' }}>
            {t('overlay.time', { time: formatDuration(timeSeconds) })}
          </div>
        )}
        {won && onNextLevel !== undefined && (
          <button
            className="btn-primary"
            onClick={onNextLevel}
            style={{ minWidth: '200px', marginTop: '8px' }}
          >
            {t('overlay.victory.nextLevel')}
          </button>
        )}
        {onBackToMap !== undefined && (
          <button onClick={onBackToMap} style={{ minWidth: '200px' }}>
            {t('overlay.backToMap')}
          </button>
        )}
      </div>
    </div>
  );
};
