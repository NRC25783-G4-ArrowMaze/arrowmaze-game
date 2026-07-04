import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { BoardComponent } from './presentation/components/BoardComponent';
import { GameOverlay } from './presentation/components/GameOverlay';
import { computeBoardLayout } from './presentation/rendering/boardLayout';
import { useGameController } from './presentation/game/useGameController';
import { useBoardInput } from './presentation/input/useBoardInput';
import { SAMPLE_LEVEL_2 } from './presentation/game/sampleLevel2';
import { LocalProgressModuleFactory, type LocalProgressModule } from './infrastructure/factories/LocalProgressModuleFactory';
import { Score } from './domain/value-objects/Score';
import { CapacitorTokenProvider } from './infrastructure/auth/CapacitorTokenProvider';

const BOARD_SIZE = 560;

/**
 * App — Demo interactiva del tablero (B1 + B3) con persistencia local y
 * sincronización bidireccional (Feature 13).
 *
 * Flujo de un toque:
 *   1. La capa de input resuelve la flecha tocada (B3).
 *   2. El controlador desliza la flecha tick-a-tick (un click = una jugada) hasta
 *      colisión o salida, reproyectando la forma real del dominio en cada paso.
 *   3. El input queda bloqueado mientras el slide está en vuelo.
 */
const App: React.FC = () => {
  const [progressModule, setProgressModule] = useState<LocalProgressModule | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrapGame = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

        // Inyectamos el proveedor nativo de Capacitor
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
        console.error('Error arrancando el motor de base de datos', error);
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    bootstrapGame();

    return () => {
      isMounted = false;
    };
  }, []);

  const game = useGameController(SAMPLE_LEVEL_2);

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
      const movesUsed = SAMPLE_LEVEL_2.allowedMoves - game.movesRemaining;
      const startedAt = levelStartRef.current ?? Date.now();
      const timeElapsedSeconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));

      progressModule.saveLocalProgress
        .execute(SAMPLE_LEVEL_2.id, Score.createSimpleScore(game.score), movesUsed, timeElapsedSeconds)
        .then(() => {
          console.log(`[App] Progreso local guardado para el nivel ${SAMPLE_LEVEL_2.id}`);
          // Intentamos subir el récord de inmediato tras ganar, si hay internet.
          return progressModule.syncProgress.execute();
        })
        .catch((error: unknown) => {
          console.error('[App] Error guardando o sincronizando el récord:', error);
        });
    }
  }, [game.status, game.score, game.movesRemaining, progressModule]);

  const onPointerDown = useBoardInput({
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    layout,
    // Bloqueo: input deshabilitado en estado terminal, con un slide en vuelo
    // o mientras arranca el módulo de persistencia.
    enabled: game.status === 'IN_PROGRESS' && !game.inFlight && !isInitializing,
    resolveArrowIdAt: (col, row) => game.controller.resolveArrowIdAt(col, row),
    onPlayMove: (command) => game.playMove(command),
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

export default App;
