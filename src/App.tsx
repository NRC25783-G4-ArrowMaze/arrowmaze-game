import React, { useEffect, useState } from 'react';
import './App.css';
import { GameView } from './presentation/components/GameView';
import { SAMPLE_LEVEL_2 } from './presentation/game/sampleLevel2';
import { fetchSceneWithFallback } from './presentation/game/loadScene';
import type { Scene } from './presentation/game/scene';
import { FetchLevelApiClient } from './infrastructure/api/FetchLevelApiClient';
import { LocalProgressModuleFactory, type LocalProgressModule } from './infrastructure/factories/LocalProgressModuleFactory';
import { CapacitorTokenProvider } from './infrastructure/auth/CapacitorTokenProvider';

/**
 * App — Bootstrap de la demo: resuelve la escena a jugar y el módulo de
 * persistencia, y recién entonces monta la partida (GameView).
 *
 * La escena se pide a la API de niveles (F2, `GET /api/v1/levels/:id`) con
 * fallback offline-first a la copia local: sin red o con el backend caído la
 * app arranca igual con SAMPLE_LEVEL_2. Ambas inicializaciones corren en
 * paralelo y el fallo de una no bloquea a la otra.
 */
const App: React.FC = () => {
  const [progressModule, setProgressModule] = useState<LocalProgressModule | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrapGame = async () => {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

      // Inyectamos el proveedor nativo de Capacitor
      const tokenProvider = new CapacitorTokenProvider();

      const [sceneResult, moduleResult] = await Promise.allSettled([
        fetchSceneWithFallback(new FetchLevelApiClient(apiBaseUrl), SAMPLE_LEVEL_2.id, SAMPLE_LEVEL_2),
        LocalProgressModuleFactory.create(apiBaseUrl, tokenProvider),
      ]);

      if (!isMounted) return;

      // fetchSceneWithFallback nunca rechaza (fallback interno); el allSettled
      // es por simetría y para que un throw inesperado no deje la app colgada.
      setScene(sceneResult.status === 'fulfilled' ? sceneResult.value : SAMPLE_LEVEL_2);

      if (moduleResult.status === 'fulfilled') {
        const module = moduleResult.value;
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
      } else {
        console.error('Error arrancando el motor de base de datos', moduleResult.reason);
      }
    };

    bootstrapGame();

    return () => {
      isMounted = false;
    };
  }, []);

  if (scene === null) {
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

  return <GameView scene={scene} progressModule={progressModule} />;
};

export default App;
