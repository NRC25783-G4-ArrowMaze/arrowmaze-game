/**
 * Puerto de reloj inyectable (G3, D3). La implementación real (SystemClock)
 * vive en Infrastructure; los tests inyectan un reloj falso. Ningún componente
 * lee el reloj del sistema directamente: consumen el tiempo a través de este
 * puerto, lo que hace el temporizador 100% reproducible y es el prerequisito
 * técnico para la futura integración tiempo→score (P23, fuera de alcance).
 */
export interface IClock {
  /** Instante actual en milisegundos desde epoch (Date.now en producción). */
  now(): number;
}
