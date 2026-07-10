import React, { useEffect, useMemo, useState } from 'react';
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
import { FetchAuthApiClient } from './infrastructure/api/FetchAuthApiClient';
import { LoginUser } from './application/services/LoginUser';
import { RegisterUser } from './application/services/RegisterUser';
import { LogoutUser } from './application/services/LogoutUser';
import { GetLevelLeaderboard } from './application/services/GetLevelLeaderboard';
import { FetchLeaderboardApiClient } from './infrastructure/api/FetchLeaderboardApiClient';
import { AccountOverlay } from './presentation/components/AccountOverlay';
import { LeaderboardOverlay } from './presentation/components/LeaderboardOverlay';
import { SettingsOverlay } from './presentation/components/SettingsOverlay';
import { AccountButton } from './presentation/components/AccountButton';
import { ThemeToggleButton } from './presentation/components/ThemeToggleButton';
import { Toast } from './presentation/components/Toast';
import { createSessionSyncControl } from './presentation/sync/createSyncScheduler';
import { aliasFromEmail } from './presentation/account/aliasFromEmail';
import type { LevelProgress } from './domain/entities/LevelProgress';
import { useTranslation } from './presentation/i18n/I18nContext';

/** Siguiente nivel en el orden del LEVEL_MAP, o undefined si es el último. */
const nextLevelIdOf = (levelId: string): string | undefined => {
  const index = LEVEL_MAP.findIndex((node) => node.levelId === levelId);
  return index === -1 ? undefined : LEVEL_MAP[index + 1]?.levelId;
};

// `difficulty` guarda una CLAVE semántica (no un literal) que la UI traduce vía
// catálogo i18n (G2); `name` es CONTENIDO del nivel y se muestra tal cual (P24).
const LEVEL_METADATA: Record<string, { name: string; difficulty: string }> = {
  'level-initial': { name: 'Nivel Inicial', difficulty: 'easy' },
  'level-intermediate-a': { name: 'Desafío A', difficulty: 'medium' },
  'level-intermediate-b': { name: 'Desafío B', difficulty: 'medium' },
  'level-advanced': { name: 'Avanzado', difficulty: 'hard' },
  'level-expert': { name: 'Experto', difficulty: 'veryHard' },
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
  const { t } = useTranslation();
  const [progressModule, setProgressModule] = useState<LocalProgressModule | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [screen, setScreen] = useState<'SELECT' | 'PLAYING'>('SELECT');
  const [allProgress, setAllProgress] = useState<LevelProgress[]>([]);
  const [accountVisible, setAccountVisible] = useState(false);
  // Ajustes (idioma/audio) desde el mapa: antes solo eran alcanzables en
  // partida vía pausa (C1); aquí es estado local de presentación, sin FSM.
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Email de la sesión activa para el badge del header (null = deslogueado o
  // sesión previa a este feature sin email guardado → el botón cae al label).
  const [userEmail, setUserEmail] = useState<string | null>(null);
  // Nivel cuya clasificación está abierta (🏆 de la card); null = cerrada.
  const [leaderboardLevelId, setLeaderboardLevelId] = useState<string | null>(null);
  // Toast de sesión (bienvenida / sesión cerrada). UN toast a la vez: el nonce
  // remonta el componente, así el nuevo reemplaza al viejo sin colas.
  const [toast, setToast] = useState<
    { kind: 'welcome'; alias: string; nonce: number } | { kind: 'loggedOut'; nonce: number } | null
  >(null);

  // Composition root de autenticación (E1/E2): una sola instancia de los casos
  // de uso, reutilizando el mismo TokenProvider nativo que el bootstrap de
  // persistencia. Sin estado nuevo persistido: la sesión es el token.
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const tokenProvider = useMemo(() => new CapacitorTokenProvider(), []);
  const authModule = useMemo(() => {
    const apiClient = new FetchAuthApiClient(apiBaseUrl);
    return {
      loginUser: new LoginUser(apiClient, tokenProvider),
      registerUser: new RegisterUser(apiClient),
      logoutUser: new LogoutUser(apiClient, tokenProvider),
    };
  }, [apiBaseUrl, tokenProvider]);

  // Caso de uso del leaderboard (misma composición que auth: adapter + Bearer).
  const getLevelLeaderboard = useMemo(
    () => new GetLevelLeaderboard(new FetchLeaderboardApiClient(apiBaseUrl, tokenProvider)),
    [apiBaseUrl, tokenProvider],
  );

  // Scheduler del sync (higiene): single-flight + coalescing con gate de
  // sesión. Login y victoria disparan por AQUÍ (nunca dos pushes solapados;
  // sin sesión el disparo es un no-op silencioso). El control encapsula la
  // configuración mutable (sesión/módulo) detrás de métodos; los closures del
  // scheduler la leen al EJECUTAR, así siempre ven el valor vigente.
  const [sync] = useState(createSessionSyncControl);

  // Estado de sesión inicial para el badge/overlay: token presente = logueado; y
  // el email guardado alimenta el alias del botón (sobrevive al F5). Migración:
  // si hay token pero no email (sesión previa a este feature), userEmail queda
  // null y el botón cae al label genérico.
  useEffect(() => {
    let active = true;
    tokenProvider.getToken()
      .then((token) => {
        if (active) {
          sync.setEnabled(token !== null);
          setIsAuthenticated(token !== null);
        }
      })
      .catch(() => { /* token ilegible: se asume deslogueado */ });
    tokenProvider.getEmail()
      .then((email) => { if (active) setUserEmail(email); })
      .catch(() => { /* email ilegible: sin alias, el botón usa el label */ });
    return () => { active = false; };
  }, [tokenProvider, sync]);

  // Cambios de sesión desde el overlay: actualiza el badge (identidad + estado),
  // CIERRA el overlay automáticamente en ambos sentidos (tras login no tiene
  // sentido mirar "Sesión activa"; tras logout, tampoco los formularios) y
  // saluda/despide con un toast. Al iniciar sesión, además dispara una
  // sincronización (D2) ahora que las peticiones llevan el token.
  const handleAuthChanged = (authenticated: boolean, email?: string): void => {
    sync.setEnabled(authenticated); // antes del request: el gate lo lee.
    setIsAuthenticated(authenticated);
    setUserEmail(authenticated ? (email ?? null) : null);
    setAccountVisible(false);
    const alias = authenticated ? aliasFromEmail(email ?? '') : '';
    if (authenticated && alias === '') {
      // Sin identidad utilizable (no debería pasar: el overlay siempre pasa el
      // email en el login) → sin toast; el resto del flujo sigue igual.
      setToast(null);
    } else {
      setToast(
        authenticated
          ? { kind: 'welcome', alias, nonce: Date.now() }
          : { kind: 'loggedOut', nonce: Date.now() },
      );
    }
    if (authenticated) {
      // El sync del login pasa por el scheduler (single-flight + coalescing).
      sync.scheduler.request();
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrapGame = async () => {
      // Modo offline (build de distribución): sin fetch remoto ni sync.
      const offlineMode = import.meta.env.VITE_OFFLINE_MODE === 'true';

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

      sync.setModule(module); // executor del scheduler lo lee.
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
              // La sesión murió: token y badge se limpian juntos (invariante
              // email persistido ⟺ token persistido).
              await tokenProvider.removeToken();
              await tokenProvider.removeEmail();
              sync.setEnabled(false);
              if (isMounted) {
                setIsAuthenticated(false);
                setUserEmail(null);
              }
              // TODO: Despachar evento para redirigir al Login
            }
          });
      }
    };

    bootstrapGame();

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl, tokenProvider, sync]);

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
        <header className="app-header"><h1>{t('app.title')}</h1></header>
        <main className="app-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>{t('app.loading')}</p>
        </main>
      </div>
    );
  }

  if (screen === 'SELECT') {
    return (
      <div className="app" style={{ position: 'relative' }}>
        <header className="app-header">
          <h1>{t('app.title')}</h1>
          <div className="app-actions">
            <button
              className="btn-icon"
              onClick={() => setSettingsVisible(true)}
              aria-label={t('settings.title')}
              title={t('settings.title')}
            >
              <span aria-hidden="true">⚙️</span>
            </button>
            <ThemeToggleButton />
            <AccountButton
              alias={userEmail !== null ? aliasFromEmail(userEmail) : ''}
              onClick={() => setAccountVisible(true)}
            />
          </div>
        </header>
        <main className="app-main">
          <LevelSelectScreen
            progress={allProgress}
            onSelectLevel={handleSelectLevel}
            levelMetadata={LEVEL_METADATA}
            onOpenLeaderboard={(levelId) => setLeaderboardLevelId(levelId)}
          />
        </main>
        {settingsVisible && (
          <SettingsOverlay visible onClose={() => setSettingsVisible(false)} />
        )}
        {accountVisible && (
          <AccountOverlay
            visible
            onClose={() => setAccountVisible(false)}
            initialAuthenticated={isAuthenticated}
            loginUser={authModule.loginUser}
            registerUser={authModule.registerUser}
            logoutUser={authModule.logoutUser}
            onAuthChanged={handleAuthChanged}
          />
        )}
        {toast !== null && (
          <Toast
            // key: remonta al reemplazar (un toast a la vez, sin colas).
            key={toast.nonce}
            message={
              toast.kind === 'welcome'
                ? t('account.welcome', { alias: toast.alias })
                : t('account.loggedOut')
            }
            onDone={() => setToast(null)}
          />
        )}
        {leaderboardLevelId !== null && !accountVisible && (
          <LeaderboardOverlay
            // key: remonta por nivel — el estado (loading/data) nace limpio en
            // cada apertura, sin resets síncronos dentro de effects.
            key={leaderboardLevelId}
            visible
            levelId={leaderboardLevelId}
            isAuthenticated={isAuthenticated}
            getLevelLeaderboard={getLevelLeaderboard}
            // Sinergia con la cuenta: el leaderboard es EL motivo para loguearse.
            // Cierra esta vista y abre el AccountOverlay.
            onRequestLogin={() => {
              setLeaderboardLevelId(null);
              setAccountVisible(true);
            }}
            onClose={() => setLeaderboardLevelId(null)}
          />
        )}
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
      requestSync={sync.scheduler.request}
      onBack={handleBackToSelect}
      onNextLevel={nextLevelId === undefined ? undefined : handleNextLevel}
      difficulty={LEVEL_METADATA[scene.id]?.difficulty}
    />
  );
};

export default App;
