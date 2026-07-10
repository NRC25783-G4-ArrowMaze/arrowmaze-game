import { createSyncScheduler } from '../../src/presentation/sync/createSyncScheduler';

/**
 * createSyncScheduler — guard del sync de progreso (higiene):
 *  - Gate de sesión: sin sesión activa, request() es un NO-OP silencioso.
 *  - Single-flight: jamás dos ejecuciones simultáneas.
 *  - Coalescing: pedidos durante un vuelo colapsan en UNA re-ejecución al
 *    terminar (ni descarte mudo ni cola infinita).
 *  - Fallos → console.warn; el scheduler queda utilizable (nunca se atasca).
 */
describe('createSyncScheduler', () => {
  /** Executor controlable: promesas que resolvemos/rechazamos a mano. */
  function makeExecutor() {
    const resolvers: Array<{ resolve: () => void; reject: (e: unknown) => void }> = [];
    const executor = jest.fn(
      () =>
        new Promise<void>((resolve, reject) => {
          resolvers.push({ resolve, reject });
        }),
    );
    return { executor, resolvers };
  }

  const flush = async (): Promise<void> => {
    // Drena microtasks para que los .finally() encadenados corran.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  };

  it('(a) con sesión activa: request() ejecuta el sync', () => {
    const { executor } = makeExecutor();
    const scheduler = createSyncScheduler(executor, () => true);

    scheduler.request();

    expect(executor).toHaveBeenCalledTimes(1);
  });

  it('(b) sin sesión: request() es NO-OP silencioso (ni ejecuta ni loguea)', () => {
    const { executor } = makeExecutor();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    try {
      const scheduler = createSyncScheduler(executor, () => false);

      expect(() => scheduler.request()).not.toThrow();

      expect(executor).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
      infoSpy.mockRestore();
    }
  });

  it('(d) single-flight: un request durante el vuelo NO lanza una segunda ejecución simultánea', async () => {
    const { executor, resolvers } = makeExecutor();
    const scheduler = createSyncScheduler(executor, () => true);

    scheduler.request(); // vuelo 1
    scheduler.request(); // en vuelo → coalesce, no ejecuta ya
    expect(executor).toHaveBeenCalledTimes(1);

    resolvers[0].resolve();
    await flush();

    // Al terminar el vuelo, corre UNA re-ejecución.
    expect(executor).toHaveBeenCalledTimes(2);
  });

  it('(d) coalescing: VARIOS requests durante el vuelo colapsan en UNA sola re-ejecución', async () => {
    const { executor, resolvers } = makeExecutor();
    const scheduler = createSyncScheduler(executor, () => true);

    scheduler.request();
    scheduler.request();
    scheduler.request();
    scheduler.request();
    expect(executor).toHaveBeenCalledTimes(1);

    resolvers[0].resolve();
    await flush();
    expect(executor).toHaveBeenCalledTimes(2);

    // La re-ejecución no arrastra más pendientes fantasma.
    resolvers[1].resolve();
    await flush();
    expect(executor).toHaveBeenCalledTimes(2);
  });

  it('fallo del sync → console.warn, sin romper, y el scheduler sigue utilizable', async () => {
    const { executor, resolvers } = makeExecutor();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const scheduler = createSyncScheduler(executor, () => true);

      scheduler.request();
      resolvers[0].reject(new Error('red caída'));
      await flush();

      expect(warnSpy).toHaveBeenCalled();

      // No quedó atascado en vuelo: un nuevo request ejecuta.
      scheduler.request();
      expect(executor).toHaveBeenCalledTimes(2);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('fallo con pedido pendiente: la re-ejecución coalescida corre igual tras el warn', async () => {
    const { executor, resolvers } = makeExecutor();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const scheduler = createSyncScheduler(executor, () => true);

      scheduler.request();
      scheduler.request(); // pendiente durante el vuelo
      resolvers[0].reject(new Error('red caída'));
      await flush();

      expect(executor).toHaveBeenCalledTimes(2);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('el gate se re-verifica en la re-ejecución: si la sesión murió en el vuelo, no re-corre', async () => {
    const { executor, resolvers } = makeExecutor();
    let enabled = true;
    const scheduler = createSyncScheduler(executor, () => enabled);

    scheduler.request();
    scheduler.request(); // pendiente
    enabled = false; // logout durante el vuelo
    resolvers[0].resolve();
    await flush();

    expect(executor).toHaveBeenCalledTimes(1);
  });
});
