import React, { useEffect, useRef } from 'react';
import { BoardComponent } from './BoardComponent';
import { GameOverlay } from './GameOverlay';
import { PauseOverlay } from './PauseOverlay';
import { SettingsOverlay } from './SettingsOverlay';
import { computeBoardLayout } from '../rendering/boardLayout';
import { useGameController } from '../game/useGameController';
import { useBoardInput } from '../input/useBoardInput';
import type { Scene } from '../game/scene';
import { type LocalProgressModule } from '../../infrastructure/factories/LocalProgressModuleFactory';
import { Score } from '../../domain/value-objects/Score';
import { useTranslation } from '../i18n/I18nContext';
import { useLevelTimer } from '../game/useLevelTimer';
import { LevelTimerDisplay } from './LevelTimerDisplay';
import { useAudioContext } from '../audio/AudioContext';
import { useGameAudio } from '../game/useGameAudio';

const BOARD_SIZE = 560;

interface GameViewProps {
  scene: Scene;
  progressModule: LocalProgressModule | null;
  /**
   * Pide una sincronización de progreso al composition root (scheduler con
   * gate de sesión y single-flight). GameView no llama al sync directo: la
   * política (¿hay sesión?, ¿hay uno en vuelo?) vive en App.
   */
  requestSync?: () => void;
  /** Si se provee, muestra un botón para volver al mapa de selección (C3). */
  onBack?: () => void;
  /**
   * Si se provee, el overlay de victoria ofrece avanzar directo al siguiente
   * nivel del mapa sin pasar por la selección.
   */
  onNextLevel?: () => void;
  /** Dificultad semántica del nivel (easy/medium/hard/veryHard) para la música (G1). */
  difficulty?: string;
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
export const GameView: React.FC<GameViewProps> = ({ scene, progressModule, requestSync, onBack, onNextLevel, difficulty }) => {
  const { t } = useTranslation();
  const game = useGameController(scene);

  // Timer visual (G3): cuenta tiempo activo (IN_PROGRESS y flujo ACTIVE); se
  // congela en PAUSED/WON/LOST y se reinicia cuando restart reemplaza el
  // controller. Proyección de presentación: no toca el dominio ni el score.
  const timerRunning = game.status === 'IN_PROGRESS' && game.flowState === 'ACTIVE';
  const timeSeconds = useLevelTimer(timerRunning, game.controller);

  // Audio (G1): proyección de solo lectura del estado del juego → SFX por
  // outcome, música en loop por dificultad, controles/mute desde Ajustes.
  const { engine, unlocked, prefs } = useAudioContext();
  useGameAudio({
    status: game.status,
    flowState: game.flowState,
    difficulty,
    tickOutcome: game.tickOutcome,
    prefs,
    unlocked,
    engine,
  });

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

      // En el build offline no hay backend: se guarda local y no se sincroniza.
      const offlineMode = import.meta.env.VITE_OFFLINE_MODE === 'true';

      progressModule.saveLocalProgress
        .execute(scene.id, Score.createSimpleScore(game.score), movesUsed, timeElapsedSeconds)
        .then(() => {
          console.log(`[GameView] Progreso local guardado para el nivel ${scene.id}`);
          // Pide el sync al composition root: el scheduler decide (gate de
          // sesión + single-flight). Sin sesión, es un no-op silencioso.
          if (!offlineMode) {
            requestSync?.();
          }
        })
        .catch((error: unknown) => {
          console.error('[GameView] Error guardando el récord:', error);
        });
    }
  }, [game.status, game.score, game.movesRemaining, progressModule, requestSync, scene]);

  const onPointerDown = useBoardInput({
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    layout,
    // Bloqueo: input deshabilitado en estado terminal, con un slide en vuelo,
    // o cuando el tope de la pila de flujo no es ACTIVE (C1: PAUSED/SETTINGS).
    enabled: game.status === 'IN_PROGRESS' && !game.inFlight && game.flowState === 'ACTIVE',
    resolveArrowIdAt: (col, row) => game.controller.resolveArrowIdAt(col, row),
    onPlayMove: (command) => game.playMove(command),
  });

  return (
    <div className="app">
      <header className="app-header">
        <h1>{t('app.title')}</h1>
        <div className="app-actions">
          {game.status === 'IN_PROGRESS' && (
            <button onClick={game.pause} disabled={game.inFlight}>
              {t('game.pause')}
            </button>
          )}
        </div>
        <div className="app-stats">
          <div className="stat-moves" aria-label={t('game.movesLeft', { count: game.movesRemaining })}>
            <span className="stat-label">{t('game.moves')}</span>
            <span className="stat-value">{game.movesRemaining}</span>
          </div>
          <LevelTimerDisplay seconds={timeSeconds} />
          <div
            className={
              game.status === 'WON'
                ? 'stat-status stat-status--won'
                : game.status === 'LOST'
                  ? 'stat-status stat-status--lost'
                  : 'stat-status'
            }
          >
            {game.status === 'IN_PROGRESS'
              ? t('game.status.inProgress')
              : game.status === 'WON'
                ? t('game.status.won')
                : t('game.status.lost')}
          </div>
        </div>
      </header>
      <main className="app-main">
        {/* El sizing fluido vive en .board-frame (App.css); BOARD_SIZE queda
            como tamaño lógico del viewBox del SVG. */}
        <div
          className="board-frame"
          style={{
            position: 'relative',
            aspectRatio: '1 / 1',
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
          <GameOverlay
            status={game.status}
            score={game.score}
            timeSeconds={timeSeconds}
            onNextLevel={onNextLevel}
            onBackToMap={onBack}
          />
          <PauseOverlay
            visible={game.flowState === 'PAUSED'}
            onResume={game.resume}
            onRestart={game.restart}
            onOpenSettings={game.openSettings}
            onExit={() => onBack?.()}
          />
          <SettingsOverlay visible={game.flowState === 'SETTINGS'} onClose={game.closeSettings} />
        </div>
      </main>
    </div>
  );
};
