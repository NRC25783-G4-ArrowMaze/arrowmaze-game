import React from 'react';
import { useTranslation } from '../i18n/I18nContext';
import { formatDuration } from '../game/levelTimer';

interface LevelTimerDisplayProps {
  /** Segundos de tiempo activo a mostrar. */
  seconds: number;
}

/**
 * LevelTimerDisplay — muestra el tiempo activo del nivel en mm:ss (G3), con el
 * mismo patrón visual que el contador de movimientos (label + valor). El texto
 * sale del catálogo i18n; el aria-label lleva el tiempo interpolado.
 */
export const LevelTimerDisplay: React.FC<LevelTimerDisplayProps> = ({ seconds }) => {
  const { t } = useTranslation();
  const display = formatDuration(seconds);

  return (
    <div className="stat-time" aria-label={t('game.timeElapsed', { time: display })}>
      <span className="stat-label">{t('game.time')}</span>
      <span className="stat-value" data-testid="level-timer">
        {display}
      </span>
    </div>
  );
};
