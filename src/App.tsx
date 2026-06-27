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
import { CapacitorTokenProvider } from './infrastructure/auth/CapacitorTokenProvides';

const BOARD_SIZE = 420;

/**
 * App — Demo interactiva del tablero con animaciones y Sincronización Bidireccional.
 */
const App: React.FC = () => {
  const [progressModule, setProgressModule] = useState<LocalProgressModule | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrapGame = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        
        // 🚀 Inyectamos el proveedor nativo de Capacitor
        const tokenProvider = new CapacitorTokenProvider();

        const module = await LocalProgressModuleFactory.create(apiBaseUrl, tokenProvider);
        
        if (isMounted) {
          setProgressModule(module);

          // Sincronización background (Bloque 4)
          module.syncProgress.execute()
            .then(() => console.log('[App] Sincronización background completada.'))
            .catch(async (error: unknown) => {
              console.warn('[App] Sincronización background detenida:', error);
              
              // Si el error es de sesión (401 SessionExpiredError), 
              // podemos borrar el token inválido automáticamente.
              if (error instanceof Error && error.name === 'SessionExpiredError') {
                 await tokenProvider.removeToken();
                 // TODO: Despachar evento para redirigir al Login
              }
            });
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
  // 3. PERSISTENCIA AUTOMÁTICA AL GANAR (UPSTREAM ENCOLADO)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (game.status === 'WON' && progressModule && game.score) {
      
      const levelData = SAMPLE_LEVEL as unknown as { id?: string; movesAllowed?: number };
      const levelId = levelData.id ?? 'level_01'; 
      const totalMoves = levelData.movesAllowed ?? 20; 
      
      const movesUsed = totalMoves - game.movesRemaining;
      const timeElapsedSeconds = 45; 

      progressModule.saveLocalProgress
        .execute(levelId, Score.createSimpleScore(game.score), movesUsed, timeElapsedSeconds)
        .then(() => {
          console.log(`[App] Progreso local guardado para el nivel ${levelId}`);
          // Opcional: Podrías llamar a syncProgress.execute() aquí mismo para 
          // intentar subir el récord de inmediato tras ganar, si hay internet.
          return progressModule.syncProgress.execute();
        })
        .catch((error: unknown) => {
          console.error('[App] Error guardando o sincronizando el récord:', error);
        });
    }
  }, [game.status, game.score, game.movesRemaining, progressModule]);

  // ─────────────────────────────────────────────
  // 4. ANIMACIONES Y RENDERIZADO CONDICIONAL
  // ─────────────────────────────────────────────
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

  if (isInitializing) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Arrow Maze</h1>
        </header>
        <main className="app-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Cargando motor del juego...</p>
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