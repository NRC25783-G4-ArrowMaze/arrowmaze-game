/**
 * createSyncScheduler — Guard del disparo del sync de progreso (D2).
 *
 * Problema que resuelve: el sync se dispara desde varios puntos (login,
 * victoria) sin coordinación — dos pushes podían solaparse — y el disparo tras
 * ganar salía incluso sin sesión (401 garantizado + ruido).
 *
 * Semántica:
 *  - GATE: `isEnabled()` (sesión activa) se consulta en cada request y también
 *    antes de la re-ejecución coalescida. Sin sesión → NO-OP silencioso.
 *  - SINGLE-FLIGHT: nunca dos ejecuciones simultáneas.
 *  - COALESCING: pedidos llegados durante un vuelo colapsan en UNA re-ejecución
 *    al terminar (ni descarte mudo ni cola infinita) — así el récord recién
 *    ganado durante el sync del login siempre alcanza a subir.
 *  - Los fallos van a console.warn y JAMÁS rompen el juego ni atascan el
 *    scheduler (offline-first: la red es inestable por diseño).
 */
export interface SyncScheduler {
  /** Pide una sincronización; el scheduler decide si/cuándo ejecutarla. */
  request(): void;
}

/** Módulo mínimo que el control necesita del progreso (evita acoplar el tipo completo). */
interface SyncCapableModule {
  syncProgress: { execute(): Promise<void> };
}

/**
 * Control de sync de sesión: empaqueta el scheduler con su configuración
 * mutable (sesión activa + módulo de progreso) detrás de métodos, para que el
 * composition root de React lo actualice sin mutar valores de estado
 * directamente. La política sigue viviendo en createSyncScheduler.
 */
export interface SessionSyncControl {
  scheduler: SyncScheduler;
  /** Actualiza el gate de sesión (login/logout/401). */
  setEnabled(enabled: boolean): void;
  /** Inyecta el módulo de progreso cuando el bootstrap lo resuelve. */
  setModule(module: SyncCapableModule | null): void;
}

export function createSessionSyncControl(): SessionSyncControl {
  let enabled = false;
  let module: SyncCapableModule | null = null;
  const scheduler = createSyncScheduler(
    () => module?.syncProgress.execute() ?? Promise.resolve(),
    () => enabled,
  );
  return {
    scheduler,
    setEnabled(value: boolean): void {
      enabled = value;
    },
    setModule(value: SyncCapableModule | null): void {
      module = value;
    },
  };
}

export function createSyncScheduler(
  executor: () => Promise<void>,
  isEnabled: () => boolean,
): SyncScheduler {
  let inFlight = false;
  let pending = false;

  const run = (): void => {
    inFlight = true;
    executor()
      .catch((error: unknown) => {
        console.warn('[SyncScheduler] Sincronización fallida (el juego continúa):', error);
      })
      .then(() => {
        inFlight = false;
        if (pending) {
          pending = false;
          if (isEnabled()) {
            run();
          }
        }
      });
  };

  return {
    request(): void {
      if (!isEnabled()) {
        return; // sin sesión: no-op silencioso (decisión sellada).
      }
      if (inFlight) {
        pending = true;
        return;
      }
      run();
    },
  };
}
