import { type IClock } from '../../application/ports/IClock';

/**
 * Implementación real de IClock sobre el reloj del sistema. Es el ÚNICO lugar
 * que lee Date.now() para el temporizador (G3, D3): el resto de la presentación
 * consume el tiempo a través del puerto.
 */
export class SystemClock implements IClock {
  now(): number {
    return Date.now();
  }
}
