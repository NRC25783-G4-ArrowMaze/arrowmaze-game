import React, { useEffect, useRef } from 'react';
import type { DerivedNode } from '../../domain/services/LevelSelectionProjection';
import { useTranslation } from '../i18n/I18nContext';

interface LevelNodeCardProps {
  node: DerivedNode;
  metadata?: { name: string; difficulty: string };
  onSelectLevel: () => void;
  /** Abre la clasificación de ESTE nivel (🏆). Disponible en TODAS las cards,
   * incluidas las bloqueadas: ver récords ajenos motiva a desbloquear. */
  onOpenLeaderboard?: () => void;
}

export const LevelNodeCard: React.FC<LevelNodeCardProps> = ({
  node,
  metadata,
  onSelectLevel,
  onOpenLeaderboard,
}) => {
  const { t } = useTranslation();
  const isBlocked = node.state === 'bloqueado';
  const isFocal = node.isFocal && !isBlocked;

  // Auto-scroll a la card "Siguiente →" al montar la pantalla: con el mapa a
  // 50+ niveles el jugador aterriza directo en su próximo nivel. Solo al
  // montar (SELECT se remonta al volver de una partida), no en cada cambio de
  // progreso. Optional call: jsdom no implementa scrollIntoView.
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isFocal) {
      cardRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = () => {
    if (isBlocked) {
      alert(t('levelSelect.locked.notice'));
      return;
    }
    onSelectLevel();
  };

  const stars = node.stars ? '★'.repeat(node.stars) : '';

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className={`level-node-card ${node.state} ${isFocal ? 'focal' : ''}`}
      style={{
        cursor: isBlocked ? 'not-allowed' : 'pointer',
        transform: isFocal ? 'scale(1.1)' : isBlocked ? 'scale(0.9)' : 'scale(1)',
        transition: 'all 0.2s ease',
        padding: '16px',
        border: isFocal ? '2px solid var(--success)' : '1px solid var(--border)',
        borderRadius: '8px',
        backgroundColor: isBlocked ? 'var(--surface-muted)' : 'var(--surface)',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      {/* 🏆 en TODAS las cards (también bloqueadas). stopPropagation: abrir la
          clasificación no debe disparar jugar ni el alert de bloqueado. */}
      {onOpenLeaderboard !== undefined && (
        <button
          aria-label={t('leaderboard.open')}
          onClick={(e) => {
            e.stopPropagation();
            onOpenLeaderboard();
          }}
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px',
            lineHeight: 1,
          }}
        >
          🏆
        </button>
      )}
      {/* Color SIEMPRE explícito (vía token): heredarlo del sistema volvía el
          título invisible sobre la card cuando SO y tema de la app difieren. */}
      <div
        className="level-node-title"
        style={{
          fontWeight: 'bold',
          marginBottom: '8px',
          color: isBlocked ? 'var(--text-disabled)' : 'var(--text)',
        }}
      >
        {metadata?.name || node.levelId}
      </div>

      {isBlocked && (
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔒</div>
      )}

      {node.state === 'completado' && (
        <>
          <div style={{ fontSize: '18px', marginBottom: '4px' }}>✓</div>
          {node.stars !== undefined && (
            <div style={{ fontSize: '16px', marginBottom: '4px', color: 'var(--gold)' }}>
              {stars}
            </div>
          )}
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {t('common.score', { score: node.bestScore ?? 0 })}
          </div>
        </>
      )}

      {node.state === 'disponible' && !isFocal && (
        <div style={{ fontSize: '12px', color: 'var(--text-disabled)' }}>
          {t('levelSelect.status.available')}
        </div>
      )}

      {isFocal && (
        <div
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            // Consolidación aprobada: el verde Material (#4CAF50) del focal se
            // unifica con --success (#16a34a) — cambio sutil de tono en claro.
            color: 'var(--success)',
            animation: 'pulse 1s infinite',
          }}
        >
          {t('levelSelect.card.next')}
        </div>
      )}

      {metadata?.difficulty && (
        <div style={{ fontSize: '12px', marginTop: '8px', color: 'var(--text-disabled)' }}>
          {t(`level.difficulty.${metadata.difficulty}`)}
        </div>
      )}
    </div>
  );
};
