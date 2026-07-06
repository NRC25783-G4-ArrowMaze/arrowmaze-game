import React, { useEffect, useRef } from 'react';
import { BoardComponent } from './BoardComponent';
import { GameOverlay } from './GameOverlay';
import { computeBoardLayout } from '../rendering/boardLayout';
import { useGameController } from '../game/useGameController';
import { useBoardInput } from '../input/useBoardInput';
import type { Scene } from '../game/scene';
import { type LocalProgressModule } from '../../infrastructure/factories/LocalProgressModuleFactory';
import { Score } from '../../domain/value-objects/Score';

const BOARD_SIZE = 560;

interface GameViewProps {
  scene: Scene;
  progressModule: LocalProgressModule | null;
}

/**
 * GameView — Partida sobre una Scene ya resuelta (local o remota, F2).
 *
 * Vive separado de App a propósito: useGameController congela la Scene en el
 * primer render, así que el tablero solo puede montarse cuando la escena
 * definitiva ya se conoce (tras el fetch remoto o su fallback).
 *
 * Flujo de un toque:
 *   1. La capa de input resuelve la flecha tocada (B3).
 *   2. El controlador desliza la flecha tick-a-tick (un click = una jugada) hasta
 *      colisión o salida, reproyectando la forma real del dominio en cada paso.
 *   3. El input queda bloqueado mientras el slide está en vuelo.
 */
export const GameView: React.FC<GameViewProps> = ({ scene, progressModule }) => {
  const game = useGameController(scene);

  // Marca de inicio del nivel: el tiempo se mide en presentación
  // (el motor no modela tiempo de partida).
  const levelStartRef = useRef<number | null>(null);

  useEffect(() => {
    levelStartRef.current = Date.now();
  }, []);

  const layout = computeBoardLayout(game.viewModel.cells, BOARD_SIZE, BOARD_SIZE);

  // Persistencia automática al ganar (upstream encolado)
  useEffect(() => {
    if (game.status === 'WON' && progressModule && game.score !== null) {
      const movesUsed = scene.allowedMoves - game.movesRemaining;
      const startedAt = levelStartRef.current ?? Date.now();
      const timeElapsedSeconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));

      progressModule.saveLocalProgress
        .execute(scene.id, Score.createSimpleScore(game.score), movesUsed, timeElapsedSeconds)
        .then(() => {
          console.log(`[GameView] Progreso local guardado para el nivel ${scene.id}`);
          // Intentamos subir el récord de inmediato tras ganar, si hay internet.
          return progressModule.syncProgress.execute();
        })
        .catch((error: unknown) => {
          console.error('[GameView] Error guardando o sincronizando el récord:', error);
        });
    }
  }, [game.status, game.score, game.movesRemaining, progressModule, scene]);

  const onPointerDown = useBoardInput({
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    layout,
    // Bloqueo: input deshabilitado en estado terminal o con un slide en vuelo.
    enabled: game.status === 'IN_PROGRESS' && !game.inFlight,
    resolveArrowIdAt: (col, row) => game.controller.resolveArrowIdAt(col, row),
    onPlayMove: (command) => game.playMove(command),
  });

  return (
    <div className="app">
      <header className="app-header">
        <h1>Arrow Maze</h1>
        <div className="app-stats">
          <div className="stat-moves">
            <span className="stat-label">Movimientos</span>
            <span className="stat-value">{game.movesRemaining}</span>
          </div>
          <div className="stat-status">
            {game.status === 'IN_PROGRESS' ? '▶ En juego' : `✓ ${game.status}`}
          </div>
        </div>
      </header>
      <main className="app-main">
        <div
          style={{
            position: 'relative',
            width: BOARD_SIZE,
            height: BOARD_SIZE,
          }}
        >
          <BoardComponent
            board={game.viewModel}
            width={BOARD_SIZE}
            height={BOARD_SIZE}
            onPointerDown={onPointerDown}
            collision={game.collision ?? undefined}
            vanishing={game.vanishing ?? undefined}
            headDisintegrating={game.headDisintegrating ?? undefined}
          />
          <GameOverlay status={game.status} score={game.score} />
        </div>
      </main>
    </div>
  );
};
