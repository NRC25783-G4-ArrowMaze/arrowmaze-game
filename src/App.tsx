import React, { useEffect, useState } from 'react';
import './App.css';
import { GameView } from './presentation/components/GameView';
import { SAMPLE_LEVEL_2 } from './presentation/game/sampleLevel2';
import { fetchSceneWithFallback } from './presentation/game/loadScene';
import type { Scene } from './presentation/game/scene';
import { FetchLevelApiClient } from './infrastructure/api/FetchLevelApiClient';
import { LevelSelectScreen } from './presentation/game/LevelSelectScreen';
import { LOCAL_LEVELS } from './presentation/game/levels/localLevels';
import { LocalProgressModuleFactory, type LocalProgressModule } from './infrastructure/factories/LocalProgressModuleFactory';
import { CapacitorTokenProvider } from './infrastructure/auth/CapacitorTokenProvider';
import type { LevelProgress } from './domain/entities/LevelProgress';

const LEVEL_METADATA: Record<string, { name: string; difficulty: string }> = {
  'level-initial': { name: 'Nivel Inicial', difficulty: 'Fácil' },
  'level-intermediate-a': { name: 'Desafío A', difficulty: 'Medio' },
  'level-intermediate-b': { name: 'Desafío B', difficulty: 'Medio' },
  'level-advanced': { name: 'Avanzado', difficulty: 'Difícil' },
  'level-expert': { name: 'Experto', difficulty: 'Muy difícil' },
};

/**
 * App — Máquina de pantallas SELECT (mapa C3) → PLAYING (GameView).
 *
 * En el bootstrap resuelve en paralelo la escena a jugar y el módulo de
 * persistencia: la escena se pide a la API de niveles (F2, `GET
 * /api/v1/levels/:id`) con fallback offline-first a SAMPLE_LEVEL_2, y el módulo
 * carga el progreso local (D1) que alimenta el mapa de selección y sincroniza
 * con el servidor (D2, background). El fallo de una inicialización no bloquea la
 * otra.
 */
const App: React.FC = () => {
  const [progressModule, setProgressModule] = useState<LocalProgressModule | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [screen, setScreen] = useState<'SELECT' | 'PLAYING'>('SELECT');
  const [allProgress, setAllProgress] = useState<LevelProgress[]>([]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapGame = async () => {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      // Modo offline (build de distribución): sin fetch remoto ni sync.
      const offlineMode = import.meta.env.VITE_OFFLINE_MODE === 'true';

      // Inyectamos el proveedor nativo de Capacitor
      const tokenProvider = new CapacitorTokenProvider();

      const [sceneResult, moduleResult] = await Promise.allSettled([
        offlineMode
          ? Promise.resolve<Scene>(LOCAL_LEVELS['level-initial'])
          : fetchSceneWithFallback(new FetchLevelApiClient(apiBaseUrl), SAMPLE_LEVEL_2.id, SAMPLE_LEVEL_2),
        LocalProgressModuleFactory.create(apiBaseUrl, tokenProvider),
      ]);

      if (!isMounted) return;

      // fetchSceneWithFallback nunca rechaza (fallback interno); el allSettled
      // es por simetría y para que un throw inesperado no deje la app colgada.
      setScene(sceneResult.status === 'fulfilled' ? sceneResult.value : SAMPLE_LEVEL_2);

      if (moduleResult.status === 'fulfilled') {
        const module = moduleResult.value;
        setProgressModule(module);

        // Progreso inicial para el mapa de selección (C3)
        module.getLocalProgress.getAll()
          .then((progress) => { if (isMounted) setAllProgress(progress); })
          .catch((error: unknown) => console.warn('[App] No se pudo cargar el progreso inicial:', error));

        // Sincronización background (Bloque 4); en offline no hay backend.
        if (!offlineMode) {
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
      } else {
        console.error('Error arrancando el motor de base de datos', moduleResult.reason);
      }
    };

    bootstrapGame();

    return () => {
      isMounted = false;
    };
  }, []);

  // Cada nodo del mapa juega su nivel del catálogo local: scene.id === levelId,
  // de modo que el progreso guardado (D1) desbloquea el mapa (C3).
  const handleSelectLevel = (levelId: string) => {
    console.log(`[App] Seleccionado nivel: ${levelId}`);
    const selected = LOCAL_LEVELS[levelId];
    if (selected !== undefined) {
      setScene(selected);
    }
    setScreen('PLAYING');
  };

  // Al volver del juego recargamos el progreso para que el mapa refleje el
  // récord recién guardado por GameView tras ganar.
  const handleBackToSelect = () => {
    setScreen('SELECT');
    progressModule?.getLocalProgress.getAll()
      .then((progress) => setAllProgress(progress))
      .catch((error: unknown) => console.warn('[App] No se pudo recargar el progreso:', error));
  };

  if (scene === null) {
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

  return <GameView scene={scene} progressModule={progressModule} onBack={handleBackToSelect} />;
};

export default App;
