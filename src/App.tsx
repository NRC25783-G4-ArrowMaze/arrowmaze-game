import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { BoardComponent } from './presentation/components/BoardComponent';
import { GameOverlay } from './presentation/components/GameOverlay';
import { computeBoardLayout } from './presentation/rendering/boardLayout';
import { useGameController } from './presentation/game/useGameController';
import { useBoardInput } from './presentation/input/useBoardInput';
import { SAMPLE_LEVEL_2 } from './presentation/game/sampleLevel2';
import { LevelSelectScreen } from './presentation/game/LevelSelectScreen';
import { LocalProgressModuleFactory, type LocalProgressModule } from './infrastructure/factories/LocalProgressModuleFactory';
import { Score } from './domain/value-objects/Score';
import { CapacitorTokenProvider } from './infrastructure/auth/CapacitorTokenProvider';
import type { LevelProgress } from './domain/entities/LevelProgress';

const BOARD_SIZE = 560;

const LEVEL_METADATA: Record<string, { name: string; difficulty: string }> = {
  'level-initial': { name: 'Nivel Inicial', difficulty: 'Fácil' },
  'level-intermediate-a': { name: 'Desafío A', difficulty: 'Medio' },
  'level-intermediate-b': { name: 'Desafío B', difficulty: 'Medio' },
  'level-advanced': { name: 'Avanzado', difficulty: 'Difícil' },
  'level-expert': { name: 'Experto', difficulty: 'Muy difícil' },
};

/**
 * App — Máquina de pantallas SELECT (mapa C3) → PLAYING (tablero B1+B3).
 * Persiste progreso local (D1) y sincroniza con servidor (D2, background).
 */
const App: React.FC = () => {
  const [progressModule, setProgressModule] = useState<LocalProgressModule | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [screen, setScreen] = useState<'SELECT' | 'PLAYING'>('SELECT');
  const [allProgress, setAllProgress] = useState<LevelProgress[]>([]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapGame = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const tokenProvider = new CapacitorTokenProvider();
        const module = await LocalProgressModuleFactory.create(apiBaseUrl, tokenProvider);

        if (isMounted) {
          setProgressModule(module);

          // Cargar progreso inicial para el mapa de selección
          const progress = await module.getLocalProgress.getAll();
          if (isMounted) setAllProgress(progress);

          // Sincronización background
          module.syncProgress.execute()
            .then(() => console.log('[App] Sincronización background completada.'))
            .catch(async (error: unknown) => {
              console.warn('[App] Sincronización background detenida:', error);
              if (error instanceof Error && error.name === 'SessionExpiredError') {
                await tokenProvider.removeToken();
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
    return () => { isMounted = false; };
  }, []);

  // Estados de pantalla de juego (solo se usa cuando screen === 'PLAYING')
  const game = useGameController(SAMPLE_LEVEL_2);
  const levelStartRef = useRef<number | null>(null);

  useEffect(() => {
    levelStartRef.current = Date.now();
  }, []);

  const layout = computeBoardLayout(game.viewModel.cells, BOARD_SIZE, BOARD_SIZE);

  // Persistencia automática al ganar + volver a SELECT
  useEffect(() => {
    if (game.status === 'WON' && progressModule && game.score !== null) {
      const movesUsed = SAMPLE_LEVEL_2.allowedMoves - game.movesRemaining;
      const startedAt = levelStartRef.current ?? Date.now();
      const timeElapsedSeconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));

      progressModule.saveLocalProgress
        .execute(SAMPLE_LEVEL_2.id, Score.createSimpleScore(game.score), movesUsed, timeElapsedSeconds)
        .then(() => {
          console.log(`[App] Progreso guardado para ${SAMPLE_LEVEL_2.id}`);
          // Recargar progreso y volver a selección
          return progressModule.getLocalProgress.getAll();
        })
        .then((updatedProgress) => {
          setAllProgress(updatedProgress);
          setScreen('SELECT');
        })
        .catch((error: unknown) => {
          console.error('[App] Error guardando progreso:', error);
        });
    }
  }, [game.status, game.score, game.movesRemaining, progressModule]);

  const onPointerDown = useBoardInput({
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    layout,
    enabled: game.status === 'IN_PROGRESS' && !game.inFlight && !isInitializing,
    resolveArrowIdAt: (col, row) => game.controller.resolveArrowIdAt(col, row),
    onPlayMove: (command) => game.playMove(command),
  });

  const handleSelectLevel = (levelId: string) => {
    console.log(`[App] Seleccionado nivel: ${levelId}`);
    setScreen('PLAYING');
  };

  if (isInitializing) {
    return (
      <div className="app">
        <header className="app-header"><h1>Arrow Maze</h1></header>
        <main className="app-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Cargando motor del juego...</p>
        </main>
      </div>
    );
  }

  if (screen === 'SELECT') {
    return (
      <div className="app">
        <header className="app-header"><h1>Arrow Maze</h1></header>
        <main className="app-main">
          <LevelSelectScreen
            progress={allProgress}
            onSelectLevel={handleSelectLevel}
            levelMetadata={LEVEL_METADATA}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Arrow Maze</h1>
        <button onClick={() => setScreen('SELECT')} style={{ marginLeft: 'auto' }}>
          ← Volver
        </button>
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
        <div style={{ position: 'relative', width: BOARD_SIZE, height: BOARD_SIZE }}>
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
