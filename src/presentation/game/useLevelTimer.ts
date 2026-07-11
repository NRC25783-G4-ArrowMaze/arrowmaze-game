import { useEffect, useState } from 'react';
import type { IClock } from '../../application/ports/IClock';
import { SystemClock } from '../../infrastructure/time/SystemClock';
import { LevelTimer } from './levelTimer';

/** Refresco del display mientras corre (4×/s: al segundo sin lag perceptible). */
const REFRESH_MS = 250;

/** Reloj real por defecto; estable a nivel de módulo. Los tests inyectan uno falso. */
const DEFAULT_CLOCK: IClock = new SystemClock();

/**
 * useLevelTimer — segundos de tiempo activo del nivel (G3).
 *
 * @param running   true si la partida cuenta tiempo (IN_PROGRESS && flujo ACTIVE).
 *                  Al pasar a false (PAUSED / WON / LOST) el timer se congela.
 * @param resetKey  cambia al arrancar una partida nueva (restart o nivel nuevo) → reinicia a 0.
 * @param clock     reloj inyectable (IClock). SystemClock por defecto.
 */
export function useLevelTimer(running: boolean, resetKey: unknown, clock: IClock = DEFAULT_CLOCK): number {
  // Instancia estable del timer: el inicializador de useState corre una sola vez.
  const [timer] = useState(() => new LevelTimer(clock));
  const [seconds, setSeconds] = useState(0);

  // Reinicio a cero cuando cambia la partida (restart / cambio de nivel).
  useEffect(() => {
    timer.reset();
    // Reflejo inmediato del reinicio; el resto de refrescos van por el intervalo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeconds(0);
  }, [resetKey, timer]);

  // Arranca/congela según `running` y refresca el display; el intervalo NO corre
  // en pausa (early return) y se limpia en unmount / al cambiar de estado.
  useEffect(() => {
    if (running) {
      timer.start();
    } else {
      timer.pause();
    }
    // Reflejo inmediato de la transición (arranque / congelado).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeconds(timer.elapsedSeconds());

    if (!running) return;
    const id = setInterval(() => setSeconds(timer.elapsedSeconds()), REFRESH_MS);
    return () => clearInterval(id);
  }, [running, resetKey, timer]);

  return seconds;
}
