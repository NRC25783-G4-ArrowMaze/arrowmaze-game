import React, { useMemo, useEffect, useState } from 'react';
import './App.css';
import { BoardComponent } from './presentation/components/BoardComponent';
import { GameOverlay } from './presentation/components/GameOverlay';
import { computeBoardLayout } from './presentation/rendering/boardLayout';
import { useGameController } from './presentation/game/useGameController';
import { useTickAnimation } from './presentation/game/useTickAnimation';
import { useBoardInput } from './presentation/input/useBoardInput';
import { SAMPLE_LEVEL } from './presentation/game/sampleLevel';
import type { BoardViewModel } from './presentation/viewModel';
import { LocalProgressModuleFactory, type LocalProgressModule } from './infrastructure/factories/LocalProgressModuleFactory';
import { Score } from './domain/value-objects/Score';

const BOARD_SIZE = 420;

/**
 * App — Demo interactiva del tablero con animaciones (B1 + B2 + B3) y Persistencia Local.
 *
 * Flujo de un toque:
 * 1. La capa de input resuelve la flecha tocada (B3).
 * 2. Se captura el estado PREVIO de esa flecha.
 * 3. El motor ejecuta UN tick (PlayMoveUseCase) → outcome advanced/blocked/destroyed.
 * 4. La capa de animación reproduce la coreografía y bloquea el input mientras dura.
 *
 * La animación es puramente visual: el estado del juego lo decide el motor.
 */
const App: React.FC = () => {
  // ─────────────────────────────────────────────
  // 1. ESTADOS DE INFRAESTRUCTURA (Base de Datos)
  // ─────────────────────────────────────────────
  const [progressModule, setProgressModule] = useState<LocalProgressModule | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrapGame = async () => {
      try {
        // La fábrica se encarga del trabajo asíncrono y pesado de SQLite
        const module = await LocalProgressModuleFactory.create();
        
        if (isMounted) {
          setProgressModule(module);
        }
      } catch (error) {
        console.error("Error arrancando el motor de base de datos", error);
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    bootstrapGame();

    return () => {
      isMounted = false;
    };
  }, []);

  // ─────────────────────────────────────────────
  // 2. HOOKS DEL JUEGO
  // ─────────────────────────────────────────────
  const game = useGameController(SAMPLE_LEVEL);
  const anim = useTickAnimation();

  const layout = computeBoardLayout(game.viewModel.cells, BOARD_SIZE, BOARD_SIZE);

  // ─────────────────────────────────────────────
  // 3. PERSISTENCIA AUTOMÁTICA AL GANAR
  // ─────────────────────────────────────────────
  useEffect(() => {
    // Si el juego fue ganado, el módulo de DB está listo y hay un score válido
    if (game.status === 'WON' && progressModule && game.score) {
      
      const levelData = SAMPLE_LEVEL as unknown as { id?: string; movesAllowed?: number };
      const levelId = levelData.id ?? 'level_01'; 
      const totalMoves = levelData.movesAllowed ?? 20; 
      
      const movesUsed = totalMoves - game.movesRemaining;
      const timeElapsedSeconds = 45;

      progressModule.saveLocalProgress
        .execute(levelId, Score.createSimpleScore(game.score), movesUsed, timeElapsedSeconds)
        .then(() => {
          console.log(`[App] Progreso guardado en SQLite para el nivel ${levelId}`);
        })
        .catch((error: unknown) => {
          console.error('[App] Error al guardar el progreso local:', error);
        });
    }
  }, [game.status, game.score, game.movesRemaining, progressModule]);

  // Durante un fade de destroyed, re-inyectamos la flecha "fantasma" para verla
  // desvanecer (el motor ya la eliminó del estado).
  const viewModel: BoardViewModel = useMemo(() => {
    if (anim.ghostArrow === null) {
      return game.viewModel;
    }
    return {
      cells: game.viewModel.cells,
      arrows: [...game.viewModel.arrows, anim.ghostArrow],
    };
  }, [game.viewModel, anim.ghostArrow]);

  const onPointerDown = useBoardInput({
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    layout,
    // Bloqueo adicional: input deshabilitado si la DB sigue cargando
    enabled: game.status === 'IN_PROGRESS' && !anim.inFlight && !isInitializing,
    resolveArrowIdAt: (col, row) => game.controller.resolveArrowIdAt(col, row),
    onPlayMove: (command) => {
      const preArrow = game.viewModel.arrows.find((a) => a.id === command.arrowId);
      if (preArrow === undefined) {
        return;
      }
      const result = game.playMove(command);
      if (result === null || !result.success || result.outcome === undefined) {
        return;
      }
      anim.run({
        arrowId: command.arrowId,
        preArrow,
        outcome: result.outcome,
        cellSize: layout.cellSize,
      });
    },
  });

  // ─────────────────────────────────────────────
  // 4. RENDERIZADO CONDICIONAL
  // ─────────────────────────────────────────────
  
  // Protegemos la UI principal hasta que SQLite esté listo
  if (isInitializing) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Arrow Maze</h1>
        </header>
        <main className="app-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Inicializando base de datos local...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Arrow Maze</h1>
        <p>
          Movimientos: {game.movesRemaining} · Estado: {game.status}
        </p>
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
            board={viewModel}
            width={BOARD_SIZE}
            height={BOARD_SIZE}
            onPointerDown={onPointerDown}
            motions={anim.motions}
          />
          <GameOverlay status={game.status} score={game.score} />
        </div>
      </main>
    </div>
  );
};

export default App;