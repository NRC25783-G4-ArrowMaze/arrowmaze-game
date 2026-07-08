import React, { useEffect, useState } from 'react';
import './App.css';
import { GameView } from './presentation/components/GameView';
import { SAMPLE_LEVEL_2 } from './presentation/game/sampleLevel2';
import { fetchSceneWithFallback } from './presentation/game/loadScene';
import type { Scene } from './presentation/game/scene';
import { FetchLevelApiClient } from './infrastructure/api/FetchLevelApiClient';
import { LevelSelectScreen } from './presentation/game/LevelSelectScreen';
import { LOCAL_LEVELS } from './presentation/game/levels/localLevels';
import { LEVEL_MAP } from './presentation/game/levelMap';
import { LevelSelectionProjection } from './domain/services/LevelSelectionProjection';
import { LocalProgressModuleFactory, type LocalProgressModule } from './infrastructure/factories/LocalProgressModuleFactory';
import { CapacitorTokenProvider } from './infrastructure/auth/CapacitorTokenProvider';
import type { LevelProgress } from './domain/entities/LevelProgress';

/** Siguiente nivel en el orden del LEVEL_MAP, o undefined si es el último. */
const nextLevelIdOf = (levelId: string): string | undefined => {
  const index = LEVEL_MAP.findIndex((node) => node.levelId === levelId);
  return index === -1 ? undefined : LEVEL_MAP[index + 1]?.levelId;
};

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

      // La escena NO espera a la persistencia: si SQLite tarda o falla (p.ej.
      // wasm ausente en web), el juego debe abrir igual — sin guardado, pero
      // jugable. Antes un allSettled conjunto dejaba la app en "Cargando..."
      // para siempre si la factory colgaba.
      const scenePromise = offlineMode
        ? Promise.resolve<Scene>(LOCAL_LEVELS['level-initial'])
        : fetchSceneWithFallback(new FetchLevelApiClient(apiBaseUrl), SAMPLE_LEVEL_2.id, SAMPLE_LEVEL_2);

      scenePromise
        // fetchSceneWithFallback nunca rechaza (fallback interno); el catch es
        // para que un throw inesperado no deje la app colgada.
        .catch(() => SAMPLE_LEVEL_2)
        .then((resolved) => { if (isMounted) setScene(resolved); });

      let module: LocalProgressModule;
      try {
        module = await LocalProgressModuleFactory.create(apiBaseUrl, tokenProvider);
      } catch (error) {
        console.error('Error arrancando el motor de base de datos', error);
        return;
      }
      if (!isMounted) return;

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

  // Siguiente nivel en el orden del mapa (undefined tras el último).
  const nextLevelId = scene === null ? undefined : nextLevelIdOf(scene.id);

  // Avance directo al siguiente nivel desde el overlay de victoria, sin pasar
  // por el mapa. Verifica el desbloqueo con el progreso fresco (el récord se
  // guardó al ganar): si el siguiente sigue bloqueado (p.ej. 'advanced' exige
  // ambos intermedios), cae al mapa para que el jugador elija.
  //
  // Si no se puede verificar el desbloqueo (sin módulo de persistencia o falla
  // la consulta) el avance falla CERRADO: vuelve al mapa en vez de dejar
  // avanzar a ciegas. Antes fallaba abierto, lo que ocultaba un fallo real de
  // persistencia — el jugador seguía "avanzando" nivel a nivel sin que nada se
  // guardara, y al volver al mapa todo el progreso aparecía perdido.
  const handleNextLevel = async () => {
    const nextScene = nextLevelId === undefined ? undefined : LOCAL_LEVELS[nextLevelId];
    if (nextScene === undefined) {
      handleBackToSelect();
      return;
    }

    if (progressModule === null) {
      console.warn('[App] Sin módulo de progreso: no se puede verificar el desbloqueo del siguiente nivel.');
      handleBackToSelect();
      return;
    }

    try {
      const progress = await progressModule.getLocalProgress.getAll();
      setAllProgress(progress);
      const nodes = LevelSelectionProjection.project(LEVEL_MAP, progress);
      if (nodes.find((n) => n.levelId === nextLevelId)?.state === 'bloqueado') {
        setScreen('SELECT');
        return;
      }
    } catch (error: unknown) {
      console.warn('[App] No se pudo verificar el desbloqueo del siguiente nivel:', error);
      handleBackToSelect();
      return;
    }

    console.log(`[App] Avanzando al siguiente nivel: ${nextLevelId}`);
    setScene(nextScene);
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

  return (
    <GameView
      // key: useGameController congela la Scene en el primer render; el remount
      // por id es lo que arranca la partida nueva al avanzar de nivel.
      key={scene.id}
      scene={scene}
      progressModule={progressModule}
      onBack={handleBackToSelect}
      onNextLevel={nextLevelId === undefined ? undefined : handleNextLevel}
    />
  );
};

export default App;
