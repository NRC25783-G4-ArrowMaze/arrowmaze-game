import React from 'react';
import type { GameStatus } from '../../domain/entities/GameSession';

/** Props del overlay de fin de juego. */
export interface GameOverlayProps {
  /** Estado de la sesión. El overlay solo se muestra si es WON o LOST. */
  status: GameStatus;
  /** Puntaje final (presente solo al ganar). */
  score: number | null;
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
  onNextLevel,
  onBackToMap,
}) => {
  if (status === 'IN_PROGRESS') {
    return null;
  }

  const won = status === 'WON';

  return (
    <div
      data-testid="game-overlay"
      role="alertdialog"
      aria-label={won ? 'Ganaste' : 'Perdiste'}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: 'rgba(255, 255, 255, 0.82)',
        borderRadius: '12px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: won ? '#16a34a' : '#dc2626',
        }}
      >
        {won ? '¡Ganaste!' : 'Perdiste'}
      </div>
      {won && score !== null && (
        <div style={{ fontSize: '1rem', color: '#374151' }}>
          Puntaje: {score}
        </div>
      )}
      {won && onNextLevel !== undefined && (
        <button
          className="btn-primary"
          onClick={onNextLevel}
          style={{ minWidth: '200px', marginTop: '8px' }}
        >
          Siguiente nivel →
        </button>
      )}
      {onBackToMap !== undefined && (
        <button onClick={onBackToMap} style={{ minWidth: '200px' }}>
          Volver al mapa
        </button>
      )}
    </div>
  );
};
